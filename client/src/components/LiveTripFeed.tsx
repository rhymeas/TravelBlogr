import { useState, useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, User, Camera, Send, Image, Upload, Heart, Trash2, Video, Play, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TripPhoto, Creator, GroupedTripPhoto } from "@shared/schema";

interface LiveTripFeedProps {
  locationId: string;
  locationName: string;
  showUpload?: boolean;
}

export function LiveTripFeed({ locationId, locationName, showUpload = true }: LiveTripFeedProps) {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [userKey] = useState(() => localStorage.getItem('userKey') || `user_${Date.now()}_${Math.random()}`);
  const [likedPhotos, setLikedPhotos] = useState(new Set<string>());
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>(() => {
    // Load delete tokens from localStorage on mount
    try {
      const saved = localStorage.getItem(`deleteTokens_${userKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save user key to localStorage
  useEffect(() => {
    localStorage.setItem('userKey', userKey);
  }, [userKey]);

  // Save delete tokens to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`deleteTokens_${userKey}`, JSON.stringify(deleteTokens));
    } catch {
      // Ignore localStorage errors
    }
  }, [deleteTokens, userKey]);

  // Query to fetch creators
  const { data: creators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  // Infinite query for grouped paginated trip photos
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/trip-photos/paginated-grouped", locationId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: '10',
        ...(locationId && { locationId }),
        ...(pageParam && { cursor: pageParam }),
      });
      
      const response = await fetch(`/api/trip-photos/paginated-grouped?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Flatten all pages into a single array of grouped photos
  const groupedPhotos = data?.pages.flatMap(page => page.items) || [] as GroupedTripPhoto[];

  // Enhanced media upload mutation using new API
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption, uploadedBy, creatorId, mediaType }: { 
      file: File; 
      caption: string; 
      uploadedBy: string; 
      creatorId: string;
      mediaType: 'image' | 'video';
    }) => {
      // Extract EXIF data for proper date sorting
      let exifData: Record<number, string> = {};
      if (mediaType === 'image') {
        try {
          const exifr = await import('exifr');
          const parsed = await exifr.parse(file);
          const dateTime = parsed?.DateTimeOriginal || parsed?.DateTime || parsed?.CreateDate;
          if (dateTime && dateTime instanceof Date) {
            exifData[0] = dateTime.toISOString();
          }
        } catch (error) {
          console.warn('Failed to extract EXIF data:', error);
        }
      }

      const formData = new FormData();
      formData.append('media', file);
      if (caption) formData.append('caption', caption);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (creatorId) formData.append('creatorId', creatorId);
      if (locationId) formData.append('locationId', locationId);
      if (Object.keys(exifData).length > 0) {
        formData.append('exifData', JSON.stringify(exifData));
      }

      const response = await fetch('/api/trip-photos/media-batch', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload fehlgeschlagen");
      }
      const result = await response.json();
      return result.files?.[0] || result; // Return first file from batch result
    },
    onSuccess: (newPhoto) => {
      // Store delete token locally
      if (newPhoto.deleteToken) {
        setDeleteTokens(prev => ({
          ...prev,
          [newPhoto.id]: newPhoto.deleteToken
        }));
      }
      
      // Refetch the first page to include new photo
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos/paginated-grouped", locationId] });
      refetch();
      
      setCaption("");
      setName("");
      setSelectedCreatorId("");
      setSelectedFile(null);
      setMediaType('image');
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({
        title: "Gepostet!",
        description: "Ihr Beitrag wurde erfolgreich geteilt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Like mutation with proper cache updates
  const likeMutation = useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const response = await fetch(`/api/trip-photos/${photoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userKey }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      return response.json();
    },
    onMutate: async ({ photoId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/trip-photos/paginated-grouped", locationId] });
      
      // Optimistic update
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photoId)) {
          newSet.delete(photoId);
        } else {
          newSet.add(photoId);
        }
        return newSet;
      });
      
      // Update cache optimistically
      queryClient.setQueryData(
        ["/api/trip-photos/paginated-grouped", locationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((group: any) => ({
                ...group,
                media: group.media.map((mediaItem: any) => {
                  if (mediaItem.id === photoId) {
                    const isLiked = likedPhotos.has(photoId);
                    return {
                      ...mediaItem,
                      likesCount: Math.max(0, (mediaItem.likesCount || 0) + (isLiked ? -1 : 1))
                    };
                  }
                  return mediaItem;
                })
              }))
            }))
          };
        }
      );
    },
    onSuccess: (result, { photoId }) => {
      // Update with server response
      const { liked, likesCount } = result;
      
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (liked) {
          newSet.add(photoId);
        } else {
          newSet.delete(photoId);
        }
        return newSet;
      });
      
      // Update cache with actual server data
      queryClient.setQueryData(
        ["/api/trip-photos/paginated-grouped", locationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((group: any) => ({
                ...group,
                media: group.media.map((mediaItem: any) => 
                  mediaItem.id === photoId ? { ...mediaItem, likesCount } : mediaItem
                )
              }))
            }))
          };
        }
      );
    },
    onError: (error, { photoId }) => {
      // Revert optimistic update
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(photoId)) {
          newSet.delete(photoId);
        } else {
          newSet.add(photoId);
        }
        return newSet;
      });
      
      // Invalidate and refetch to get correct state
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos/paginated-grouped", locationId] });
      
      toast({
        title: "Fehler",
        description: "Like konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Edit post mutation
  const editMutation = useMutation({
    mutationFn: async ({ postId, caption }: { postId: string; caption: string }) => {
      const response = await fetch(`/api/trip-photos/${postId}/caption`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update caption');
      }
      
      return response.json();
    },
    onSuccess: (_, { postId, caption }) => {
      // Update cache with new caption
      queryClient.setQueryData(
        ['/api/trip-photos/paginated-grouped', locationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((group: any) => 
                group.id === postId 
                  ? { ...group, caption }
                  : group
              )
            }))
          };
        }
      );
      
      setEditingPost(null);
      setEditCaption("");
      
      toast({
        title: "Aktualisiert",
        description: "Ihr Beitrag wurde erfolgreich bearbeitet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Bearbeitung fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const deleteToken = deleteTokens[photoId];
      const response = await fetch(`/api/trip-photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }
    },
    onSuccess: (_, { photoId }) => {
      // Remove from delete tokens (this will trigger localStorage update via useEffect)
      setDeleteTokens(prev => {
        const newTokens = { ...prev };
        delete newTokens[photoId];
        return newTokens;
      });
      
      // Update cache by removing the deleted photo from groups
      queryClient.setQueryData(
        ["/api/trip-photos/paginated-grouped", locationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((group: any) => ({
                ...group,
                media: group.media.filter((mediaItem: any) => mediaItem.id !== photoId)
              })).filter((group: any) => group.media.length > 0) // Remove empty groups
            }))
          };
        }
      );
      
      toast({
        title: "Gelöscht",
        description: "Ihr Beitrag wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Löschen fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Infinite scroll hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Enhanced file selection with video support
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File size validation (50MB for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 52428800 : 10485760;
      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: `Bitte wählen Sie eine ${file.type.startsWith('video/') ? 'Video unter 50MB' : 'Bild unter 10MB'}.`,
          variant: "destructive",
        });
        return;
      }
      
      // File type validation
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
      
      if (!allAllowedTypes.includes(file.type)) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Nur Bilder (JPG, PNG, WebP, GIF) und Videos (MP4, WebM, MOV) sind erlaubt.",
          variant: "destructive",
        });
        return;
      }
      
      // Set media type based on file
      const detectedMediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(detectedMediaType);
      setSelectedFile(file);
      
      toast({
        title: `${detectedMediaType === 'video' ? 'Video' : 'Foto'} ausgewählt`,
        description: `${file.name} bereit zum Hochladen.`,
      });
    }
  };

  // Enhanced upload handler with media type support
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: `Bitte ${mediaType === 'video' ? 'Video' : 'Foto'} wählen`,
        description: `Wählen Sie ein ${mediaType === 'video' ? 'Video' : 'Foto'} zum Hochladen aus.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        caption: caption.trim(),
        uploadedBy: name.trim(),
        creatorId: selectedCreatorId,
        mediaType,
      });
    } catch (error) {
      // Error handling is already in the mutation
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Handle like click
  const handleLike = async (photoId: string) => {
    await likeMutation.mutateAsync({ photoId });
  };

  // Handle delete click
  const handleDelete = async (photoId: string) => {
    if (!deleteTokens[photoId]) {
      toast({
        title: "Löschen nicht möglich",
        description: "Sie können nur eigene Beiträge löschen.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Möchten Sie diesen Beitrag wirklich löschen?")) {
      await deleteMutation.mutateAsync({ photoId });
    }
  };

  // Format timestamp
  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    const timestamp = typeof date === 'string' ? new Date(date) : date;
    return timestamp.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4" data-testid="live-trip-feed">
      {/* Large, Prominent Upload Area - Facebook Style */}
      {showUpload && (
        <Card className="p-6" data-testid="upload-area">
          <div className="space-y-4">
            {!selectedFile ? (
              /* Large Upload Button */
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center space-y-2 text-blue-600"
                data-testid="large-upload-button"
              >
                <Upload className="w-8 h-8" />
                <span className="text-lg font-medium">Foto oder Video aus {locationName} hochladen</span>
                <span className="text-sm text-muted-foreground">Bilder (JPG, PNG, WebP, GIF - max. 10MB) oder Videos (MP4, WebM, MOV - max. 50MB)</span>
              </Button>
            ) : (
              /* File Selected - Show Preview and Details */
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200" data-testid="file-preview">
                  {mediaType === 'video' ? (
                    <Video className="w-6 h-6 text-green-600" />
                  ) : (
                    <Image className="w-6 h-6 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-green-600">{mediaType === 'video' ? 'Video' : 'Bild'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-green-700 hover:text-green-800"
                    data-testid="remove-file"
                  >
                    ×
                  </Button>
                </div>

                {/* Creator Selection */}
                <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                  <SelectTrigger data-testid="creator-select">
                    <SelectValue placeholder="Wer postet dieses Foto?" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Caption Input */}
                <Textarea
                  placeholder={`Beschreibung für Ihr Foto aus ${locationName}...`}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="text-base"
                  rows={3}
                  maxLength={500}
                  data-testid="post-text-input"
                />

                {/* Name Input - Optional for additional context */}
                <Input
                  placeholder="Zusätzliche Namensangabe (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  data-testid="name-input"
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    data-testid="change-photo"
                  >
                    Anderes Foto wählen
                  </Button>
                  
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="flex items-center space-x-2 px-6"
                    data-testid="post-button"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Hochladen...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Foto posten</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Hidden File Input - Now supports video */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
          </div>
        </Card>
      )}

      {/* Feed Title */}
      <div className="flex items-center space-x-2 px-1" data-testid="feed-title">
        <Camera className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Live aus {locationName}</h3>
        <div className="ml-auto text-xs text-muted-foreground">
          {groupedPhotos.length} {groupedPhotos.length === 1 ? 'Beitrag' : 'Beiträge'}
        </div>
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <Card className="p-8" data-testid="loading-posts">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      ) : groupedPhotos.length === 0 ? (
        <Card className="p-8 text-center" data-testid="no-posts">
          <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Noch keine Beiträge</p>
          <p className="text-sm text-muted-foreground/70">Seien Sie der Erste, der etwas aus {locationName} teilt!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedPhotos.map((group) => {
            const hasMultipleMedia = group.media.length > 1;
            const totalLikes = group.media.reduce((sum, media) => sum + (media.likesCount || 0), 0);
            const firstMedia = group.media[0];
            
            return (
              <Card key={group.id} className="overflow-hidden" data-testid={`post-${group.id}`}>
                {/* Post Header */}
                <div className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1" data-testid={`post-author-${group.id}`}>
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Von {group.creatorId || 'Anonym'}</span>
                      </div>
                      {hasMultipleMedia && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <Camera className="w-3 h-3" />
                          <span>{group.media.length} Fotos</span>
                        </div>
                      )}
                      {firstMedia.mediaType === 'video' && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground" data-testid={`post-time-${group.id}`}>
                      <Clock className="w-3 h-3" />
                      <span>Aufgenommen: {formatTime(group.groupTakenAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Post Media - Single or Gallery */}
                {hasMultipleMedia ? (
                  /* Carousel Gallery */
                  <div className="relative" data-testid={`post-gallery-${group.id}`}>
                    {(() => {
                      const currentIndex = currentImageIndex[group.id] || 0;
                      const currentMedia = group.media[currentIndex];
                      return (
                        <>
                          {/* Main Image/Video Display */}
                          <div className="relative">
                            {currentMedia.mediaType === 'video' && currentMedia.videoUrl ? (
                              <video
                                src={currentMedia.videoUrl}
                                poster={currentMedia.thumbnailUrl || undefined}
                                controls
                                className="w-full max-h-96 object-cover"
                                data-testid={`gallery-video-${currentMedia.id}`}
                              >
                                <source src={currentMedia.videoUrl} type="video/mp4" />
                                Ihr Browser unterstützt das Video-Element nicht.
                              </video>
                            ) : (
                              <img
                                src={currentMedia.imageUrl}
                                alt={group.caption || "Gallery image"}
                                className="w-full max-h-96 object-cover"
                                data-testid={`gallery-image-${currentMedia.id}`}
                              />
                            )}
                            {currentMedia.mediaType === 'video' && (
                              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
                                <Video className="w-3 h-3" />
                                <span>Video</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Navigation Dots */}
                          {group.media.length > 1 && (
                            <div className="flex justify-center items-center space-x-2 py-3 bg-gray-50 dark:bg-gray-800">
                              {group.media.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(prev => ({ ...prev, [group.id]: index }))}
                                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    index === currentIndex 
                                      ? 'bg-primary scale-125' 
                                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                  }`}
                                  data-testid={`gallery-dot-${index}`}
                                  aria-label={`Go to image ${index + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()
                  </div>
                ) : (
                  /* Single Media */
                  firstMedia.mediaType === 'video' && firstMedia.videoUrl ? (
                    <div className="relative">
                      <video
                        src={firstMedia.videoUrl}
                        poster={firstMedia.thumbnailUrl || undefined}
                        controls
                        className="w-full max-h-96"
                        data-testid={`post-video-${firstMedia.id}`}
                      >
                        <source src={firstMedia.videoUrl} type="video/mp4" />
                        Ihr Browser unterstützt das Video-Element nicht.
                      </video>
                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </div>
                    </div>
                  ) : firstMedia.imageUrl && (
                    <div className="relative">
                      <img
                        src={firstMedia.imageUrl}
                        alt={group.caption || "Reisefoto"}
                        className="w-full object-cover max-h-96"
                        data-testid={`post-image-${firstMedia.id}`}
                      />
                    </div>
                  )
                )}

                {/* Post Caption */}
                {group.caption && (
                  <div className="px-3 py-2 border-t border-border/50">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-foreground flex-1 mr-2" data-testid={`post-caption-${group.id}`}>
                        {group.caption}
                      </p>
                      {group.caption && (
                        <Dialog open={editingPost === group.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingPost(null);
                            setEditCaption("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPost(group.id);
                                setEditCaption(group.caption || "");
                              }}
                              className="text-muted-foreground hover:text-primary p-1 h-auto"
                              data-testid={`edit-button-${group.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Beitrag bearbeiten</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Beschreibung bearbeiten..."
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                className="text-base"
                                rows={4}
                                maxLength={500}
                                data-testid="edit-caption-input"
                              />
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPost(null);
                                    setEditCaption("");
                                  }}
                                  data-testid="cancel-edit-button"
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  onClick={() => editMutation.mutate({ postId: group.id, caption: editCaption })}
                                  disabled={editMutation.isPending}
                                  data-testid="save-edit-button"
                                >
                                  {editMutation.isPending ? "Speichern..." : "Speichern"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}

                {/* Post Actions - Like and Delete */}
                <div className="p-3 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(firstMedia.id)}
                      className={`flex items-center space-x-2 ${
                        likedPhotos.has(firstMedia.id) ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                      data-testid={`like-button-${group.id}`}
                    >
                      <Heart 
                        className={`w-4 h-4 ${likedPhotos.has(firstMedia.id) ? 'fill-current' : ''}`} 
                      />
                      <span>{hasMultipleMedia ? totalLikes : (firstMedia.likesCount || 0)}</span>
                    </Button>
                    
                    {group.media.some(media => deleteTokens[media.id]) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(firstMedia.id)}
                        className="text-muted-foreground hover:text-red-500"
                        data-testid={`delete-button-${group.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="flex justify-center p-4">
            {isFetchingNextPage ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Lade weitere Beiträge...</span>
              </div>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                className="text-sm"
                data-testid="load-more-button"
              >
                Weitere Beiträge laden
              </Button>
            ) : groupedPhotos.length > 0 ? (
              <p className="text-sm text-muted-foreground">Alle Beiträge geladen</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}