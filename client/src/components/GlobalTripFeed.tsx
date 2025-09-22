import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import { useLocation } from "wouter";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, User, Camera, Send, Image, Upload, Heart, Trash2, Video, Play, MoreVertical, X, Maximize2, Edit, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TripPhoto, Creator, Location } from "@shared/schema";

export default function GlobalTripFeed() {
  const [, setLocation] = useLocation();
  
  // Get URL parameters for deep linking
  const urlParams = new URLSearchParams(window.location.search);
  const filterLocationId = urlParams.get('locationId');
  const shouldFocus = urlParams.get('focus') === 'first';
  // Upload state
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  // User and interaction state
  const [userKey] = useState(() => localStorage.getItem('userKey') || `user_${Date.now()}_${Math.random()}`);
  const [likedPhotos, setLikedPhotos] = useState(() => {
    // Load liked photos from localStorage on mount
    try {
      const currentUserKey = localStorage.getItem('userKey') || `user_${Date.now()}_${Math.random()}`;
      const saved = localStorage.getItem(`likedPhotos_${currentUserKey}`);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>(() => {
    // Load delete tokens from localStorage on mount
    try {
      const saved = localStorage.getItem(`deleteTokens_${userKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // Modal state
  const [fullViewMedia, setFullViewMedia] = useState<TripPhoto | null>(null);
  const [fullViewCarousel, setFullViewCarousel] = useState<TripPhoto[] | null>(null);
  const [fullViewIndex, setFullViewIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Touch state for full view modal
  const [modalTouchStart, setModalTouchStart] = useState<number | null>(null);
  const [modalTouchEnd, setModalTouchEnd] = useState<number | null>(null);
  
  // Edit state
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLocationId, setEditLocationId] = useState("");
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save user key to localStorage
  useEffect(() => {
    localStorage.setItem('userKey', userKey);
  }, [userKey]);


  // Save liked photos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`likedPhotos_${userKey}`, JSON.stringify(Array.from(likedPhotos)));
    } catch {
      // Ignore localStorage errors
    }
  }, [likedPhotos, userKey]);

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

  // Query to fetch locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Infinite query for paginated trip photos (global feed - no locationId filter)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/trip-photos/paginated", "global", filterLocationId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: '10',
        ...(pageParam && { cursor: pageParam }),
        ...(filterLocationId && { locationId: filterLocationId }),
      });
      
      const response = await fetch(`/api/trip-photos/paginated?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Flatten the paginated data
  const tripPhotos = data?.pages.flatMap(page => page.items) || [];
  
  // Handle deep linking focus behavior
  useEffect(() => {
    if (shouldFocus && data?.pages?.[0]?.items?.length) {
      const firstItem = data.pages[0].items[0];
      // Scroll to the first item
      setTimeout(() => {
        const element = document.querySelector(`[data-testid="post-image-${firstItem.id}"]`) || 
                       document.querySelector(`[data-testid="post-video-${firstItem.id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optional: Open full view
          openFullView(firstItem);
        }
      }, 500); // Wait for rendering
    }
  }, [shouldFocus, data]);
  
  // Helper function to safely get time from Date or string
  const getTimeSafe = (date: Date | string | null): number => {
    if (!date) return 0;
    if (typeof date === 'string') {
      return new Date(date).getTime();
    }
    return date.getTime();
  };

  // Group photos by groupId for carousel display
  const groupedPhotos = React.useMemo(() => {
    const groups = new Map<string, TripPhoto[]>();
    const singles: TripPhoto[] = [];
    
    tripPhotos.forEach(photo => {
      if (photo.groupId) {
        if (!groups.has(photo.groupId)) {
          groups.set(photo.groupId, []);
        }
        groups.get(photo.groupId)!.push(photo);
      } else {
        singles.push(photo);
      }
    });
    
    // Convert grouped photos to display items
    type CarouselItem = { type: 'carousel', groupId: string, photos: TripPhoto[], id: string, uploadedAt: Date | null, locationId: string | null };
    const groupedItems: (TripPhoto | CarouselItem)[] = [];
    
    // Add carousel groups
    groups.forEach((photos, groupId) => {
      if (photos.length > 1) {
        // Sort photos by time (oldest to newest for carousel display)
        const sortedPhotos = photos.sort((a, b) => getTimeSafe(a.uploadedAt) - getTimeSafe(b.uploadedAt));
        // Use the newest photo's timestamp for feed ordering
        const newestPhoto = sortedPhotos[sortedPhotos.length - 1];
        groupedItems.push({
          type: 'carousel',
          groupId,
          photos: sortedPhotos,
          id: `carousel-${groupId}`,
          uploadedAt: newestPhoto?.uploadedAt || null,
          locationId: newestPhoto?.locationId || null
        });
      } else {
        // Single photo in group, treat as individual
        groupedItems.push(photos[0]);
      }
    });
    
    // Add individual photos
    groupedItems.push(...singles);
    
    // Sort by upload time (most recent first)
    return groupedItems.sort((a, b) => {
      const timeA = getTimeSafe(a.uploadedAt);
      const timeB = getTimeSafe(b.uploadedAt);
      return timeB - timeA;
    });
  }, [tripPhotos]);

  // Upload mutation with batch support and EXIF data
  const uploadMutation = useMutation({
    mutationFn: async ({ files, caption, uploadedBy, creatorId, locationId }: { 
      files: File[]; 
      caption: string; 
      uploadedBy: string; 
      creatorId: string;
      locationId: string;
    }) => {
      // Extract EXIF data for proper date sorting
      let exifData: Record<number, string> = {};
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            const exifr = await import('exifr');
            const parsed = await exifr.parse(file);
            const dateTime = parsed?.DateTimeOriginal || parsed?.DateTime || parsed?.CreateDate;
            if (dateTime && dateTime instanceof Date) {
              exifData[i] = dateTime.toISOString();
            }
          } catch (error) {
            console.warn('Failed to extract EXIF data from', file.name, error);
          }
        }
      }

      const formData = new FormData();
      files.forEach(file => formData.append('media', file));
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
      return response.json();
    },
    onSuccess: (result) => {
      // Store delete tokens locally for batch uploads
      if (result.files) {
        const newTokens: Record<string, string> = {};
        result.files.forEach((file: any) => {
          if (file.deleteToken) {
            newTokens[file.id] = file.deleteToken;
          }
        });
        setDeleteTokens(prev => ({ ...prev, ...newTokens }));
      }
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos/paginated", "global"] });
      
      // Reset form and close modal
      setCaption("");
      setName("");
      setSelectedCreatorId("");
      setSelectedLocationId("");
      setSelectedFiles([]);
      setMediaType('image');
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowUploadModal(false);
      
      const fileCount = result.files?.length || 1;
      toast({
        title: "Gepostet!",
        description: `${fileCount === 1 ? 'Ihr Beitrag' : `${fileCount} Dateien`} wurde(n) erfolgreich geteilt.`,
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


  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const response = await apiRequest("POST", `/api/trip-photos/${photoId}/like`, {
        userKey,
      });
      return response.json();
    },
    onMutate: ({ photoId }) => {
      // Capture current state before update
      const wasLiked = likedPhotos.has(photoId);
      
      // Optimistic update
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.delete(photoId);
        } else {
          newSet.add(photoId);
        }
        return newSet;
      });
      
      // Update cache optimistically using captured state
      queryClient.setQueryData(
        ["/api/trip-photos/paginated", "global"],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((photo: any) => {
                if (photo.id === photoId) {
                  return {
                    ...photo,
                    likesCount: Math.max(0, (photo.likesCount || 0) + (wasLiked ? -1 : 1))
                  };
                }
                return photo;
              })
            }))
          };
        }
      );
      
      return { wasLiked }; // Return for use in onError
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
        ["/api/trip-photos/paginated", "global"],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((photo: any) => 
                photo.id === photoId ? { ...photo, likesCount } : photo
              )
            }))
          };
        }
      );
    },
    onError: (error, { photoId }, context) => {
      // Revert optimistic update using original state
      const wasLiked = context?.wasLiked ?? false;
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(photoId);
        } else {
          newSet.delete(photoId);
        }
        return newSet;
      });
      
      // Invalidate and refetch to get correct state
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos/paginated", "global"] });
      
      toast({
        title: "Fehler",
        description: "Like konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ photoId }: { photoId: string }) => {
      const response = await fetch(`/api/trip-photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }
    },
    onSuccess: (_, { photoId }) => {
      // Remove from delete tokens
      setDeleteTokens(prev => {
        const newTokens = { ...prev };
        delete newTokens[photoId];
        return newTokens;
      });
      
      // Update cache by removing the deleted photo
      queryClient.setQueryData(
        ["/api/trip-photos/paginated", "global"],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.filter((photo: any) => photo.id !== photoId)
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

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ photoId, caption, locationId }: { photoId: string; caption: string; locationId: string }) => {
      const response = await fetch(`/api/trip-photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, locationId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }
      return response.json();
    },
    onSuccess: (_, { photoId, caption, locationId }) => {
      // Update cache with new caption and location
      queryClient.setQueryData(
        ["/api/trip-photos/paginated", "global"],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((photo: any) => 
                photo.id === photoId ? { ...photo, caption, locationId } : photo
              )
            }))
          };
        }
      );
      
      setEditingPost(null);
      setEditCaption("");
      setEditLocationId("");
      
      toast({
        title: "Aktualisiert",
        description: "Beitrag wurde erfolgreich geändert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Aktualisierung fehlgeschlagen",
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleLike = (photoId: string) => {
    likeMutation.mutate({ photoId });
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate({ photoId });
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    let hasVideo = false;
    let hasImage = false;

    // Validate each file
    for (const file of files) {
      // File type validation
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const isImage = allowedImageTypes.includes(file.type);
      const isVideo = allowedVideoTypes.includes(file.type);
      
      if (!isImage && !isVideo) {
        toast({
          title: "Ungültiger Dateityp",
          description: `Datei ${file.name}: Nur Bilder (JPG, PNG, WebP, GIF) und Videos (MP4, WebM, MOV) sind erlaubt.`,
          variant: "destructive",
        });
        continue;
      }

      // File size validation
      const maxSize = isVideo ? 52428800 : 10485760; // 50MB for videos, 10MB for images
      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: `${file.name}: ${isVideo ? 'Videos unter 50MB' : 'Bilder unter 10MB'} erlaubt.`,
          variant: "destructive",
        });
        continue;
      }

      if (isVideo) hasVideo = true;
      if (isImage) hasImage = true;
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Don't allow mixing videos and images
    if (hasVideo && hasImage) {
      toast({
        title: "Medientyp mischen nicht erlaubt",
        description: "Bitte laden Sie entweder nur Bilder oder nur Videos gleichzeitig hoch.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(validFiles);
    setMediaType(hasVideo ? 'video' : 'image');
    
    toast({
      title: `${validFiles.length} ${hasVideo ? 'Video(s)' : 'Foto(s)'} ausgewählt`,
      description: `${validFiles.length === 1 ? 'Datei' : 'Dateien'} bereit zum Hochladen.`,
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: `Bitte ${mediaType === 'video' ? 'Video(s)' : 'Foto(s)'} wählen`,
        description: `Wählen Sie ${mediaType === 'video' ? 'Video(s)' : 'Foto(s)'} zum Hochladen aus.`,
        variant: "destructive",
      });
      return;
    }

    if (!selectedLocationId) {
      toast({
        title: "Location wählen",
        description: "Bitte wählen Sie eine Location für Ihren Beitrag aus.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      files: selectedFiles,
      caption: caption.trim(),
      uploadedBy: name.trim(),
      creatorId: selectedCreatorId,
      locationId: selectedLocationId,
    });
  };

  // Full view handlers
  const openFullView = (photo: TripPhoto, carousel?: TripPhoto[]) => {
    setFullViewMedia(photo);
    if (carousel && carousel.length > 1) {
      setFullViewCarousel(carousel);
      const index = carousel.findIndex(p => p.id === photo.id);
      setFullViewIndex(index >= 0 ? index : 0);
    } else {
      setFullViewCarousel(null);
      setFullViewIndex(0);
    }
  };

  const closeFullView = () => {
    setFullViewMedia(null);
    setFullViewCarousel(null);
    setFullViewIndex(0);
  };

  // Keyboard navigation for full view modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!fullViewMedia) return;

      switch (e.key) {
        case 'Escape':
          closeFullView();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (fullViewCarousel && fullViewCarousel.length > 1) {
            goToFullViewPrev();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (fullViewCarousel && fullViewCarousel.length > 1) {
            goToFullViewNext();
          }
          break;
      }
    };

    if (fullViewMedia) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [fullViewMedia, fullViewCarousel]);

  const goToFullViewNext = () => {
    if (!fullViewCarousel) return;
    const nextIndex = (fullViewIndex + 1) % fullViewCarousel.length;
    setFullViewIndex(nextIndex);
    setFullViewMedia(fullViewCarousel[nextIndex]);
  };

  const goToFullViewPrev = () => {
    if (!fullViewCarousel) return;
    const prevIndex = (fullViewIndex - 1 + fullViewCarousel.length) % fullViewCarousel.length;
    setFullViewIndex(prevIndex);
    setFullViewMedia(fullViewCarousel[prevIndex]);
  };

  const goToFullViewIndex = (index: number) => {
    if (!fullViewCarousel || index < 0 || index >= fullViewCarousel.length) return;
    setFullViewIndex(index);
    setFullViewMedia(fullViewCarousel[index]);
  };

  // Touch event handlers for full view modal swipe
  const handleModalTouchStart = (e: React.TouchEvent) => {
    setModalTouchEnd(null);
    setModalTouchStart(e.targetTouches[0].clientX);
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    setModalTouchEnd(e.targetTouches[0].clientX);
  };

  const handleModalTouchEnd = () => {
    if (!modalTouchStart || !modalTouchEnd || !fullViewCarousel || fullViewCarousel.length <= 1) return;
    
    const distance = modalTouchStart - modalTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToFullViewNext();
    }
    if (isRightSwipe) {
      goToFullViewPrev();
    }
  };

  // Upload modal handlers
  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    // Reset form
    setCaption("");
    setName("");
    setSelectedCreatorId("");
    setSelectedLocationId("");
    setSelectedFiles([]);
    setMediaType('image');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Get location name by ID
  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return null;
    const location = locations.find(l => l.id === locationId);
    return location?.name || null;
  };

  // Format timestamp with relative time
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
    <div className="space-y-4" data-testid="global-trip-feed">


      {/* Feed Title */}
      <div className="flex items-center space-x-2 px-1" data-testid="feed-stats">
        <Camera className="w-5 h-5 text-primary" />
        <div className="text-xs text-muted-foreground">
          {tripPhotos.length} {tripPhotos.length === 1 ? 'Beitrag' : 'Beiträge'}
        </div>
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="space-y-3" data-testid="loading-posts">
          {/* Render 3 skeleton cards */}
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              {/* Skeleton Post Header */}
              <div className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* Skeleton Media Area */}
              <Skeleton className="w-full h-96" />

              {/* Skeleton Caption */}
              <div className="p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Skeleton Footer */}
                <div className="flex items-center justify-between mt-3">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : tripPhotos.length === 0 ? (
        <Card className="p-8 text-center" data-testid="no-posts">
          <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Noch keine Beiträge</p>
          <p className="text-sm text-muted-foreground/70">Sei der Erste, der etwas teilt!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedPhotos.map((item) => {
            const isCarousel = 'type' in item && item.type === 'carousel';
            
            if (isCarousel) {
              return <CarouselPost key={item.id} carousel={item} creators={creators} getLocationName={getLocationName} formatTime={formatTime} likedPhotos={likedPhotos} handleLike={handleLike} handleDelete={handleDelete} openFullView={openFullView} />;
            }
            
            const photo = item as TripPhoto;
            return (
            <Card key={photo.id} className="overflow-hidden" data-testid={`post-${photo.id}`}>
              {/* Post Header */}
              <div className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1" data-testid={`post-author-${photo.id}`}>
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {photo.creatorId ? 
                          creators.find(c => c.id === photo.creatorId)?.name || photo.uploadedBy || 'Unbekannt' : 
                          photo.uploadedBy || 'Unbekannt'
                        }
                      </span>
                    </div>
                    {getLocationName(photo.locationId) && (
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        📍 {getLocationName(photo.locationId)}
                      </div>
                    )}
                    {photo.mediaType === 'video' && (
                      <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground" data-testid={`post-time-${photo.id}`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(photo.uploadedAt)}</span>
                    </div>
                    {/* Three-dot delete menu - Always show for testing */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 z-50 relative"
                            data-testid={`post-menu-${photo.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingPost(photo.id);
                              setEditCaption(photo.caption || "");
                              setEditLocationId(photo.locationId || "");
                            }}
                            className="text-blue-600 hover:text-blue-700 cursor-pointer"
                            data-testid={`edit-menu-item-${photo.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(photo.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                            data-testid={`delete-menu-item-${photo.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>
              </div>


              {/* Post Media - Image or Video */}
              {photo.mediaType === 'video' && photo.videoUrl ? (
                <VideoPreview photo={photo} openFullView={openFullView} />
              ) : photo.imageUrl && (
                <div className="relative group cursor-pointer" onClick={() => openFullView(photo)}>
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Reisefoto"}
                    className="w-full object-cover max-h-96 bg-gray-50 dark:bg-gray-800"
                    data-testid={`post-image-${photo.id}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                      <Maximize2 className="w-6 h-6 text-black dark:text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Post Caption - Now Below Media */}
              {photo.caption && (
                <div className="px-3 py-1.5">
                  <p className="text-sm" data-testid={`post-caption-${photo.id}`}>{photo.caption}</p>
                </div>
              )}

              {/* Post Actions - Like */}
              <div className="p-3 pt-2 border-t border-border/50">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(photo.id)}
                    className={`flex items-center space-x-2 ${
                      likedPhotos.has(photo.id) ? 'text-red-500' : 'text-muted-foreground'
                    }`}
                    data-testid={`like-button-${photo.id}`}
                  >
                    <Heart 
                      className={`w-4 h-4 ${likedPhotos.has(photo.id) ? 'fill-current' : ''}`} 
                    />
                    <span>{photo.likesCount || 0}</span>
                  </Button>
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
      
      {/* Floating Upload Button */}
      <Button
        onClick={openUploadModal}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        data-testid="floating-upload-button"
      >
        <Plus className="w-6 h-6" />
      </Button>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={uploadMutation.isPending ? undefined : closeUploadModal}>
          <DialogContent className="max-w-md" data-testid="upload-modal">
            <DialogHeader>
              <DialogTitle>Neuen Beitrag teilen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="file-input"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-dashed border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  data-testid="file-upload-button"
                >
                  <div className="flex flex-col items-center space-y-2">
                    {mediaType === 'video' ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
                    <span className="text-sm">
                      {selectedFiles.length > 0 ? 
                        (selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} Dateien`) : 
                        `${mediaType === 'video' ? 'Video' : 'Foto'} auswählen`}
                    </span>
                  </div>
                </Button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {/* Location Selection */}
                  <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    <SelectTrigger data-testid="location-select">
                      <SelectValue placeholder="Location auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Creator Selection */}
                  <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                    <SelectTrigger data-testid="creator-select">
                      <SelectValue placeholder="Autor auswählen (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Name Input (if no creator selected) */}
                  {!selectedCreatorId && (
                    <Input
                      type="text"
                      placeholder="Ihr Name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      data-testid="name-input"
                    />
                  )}
                  
                  {/* Caption Input */}
                  <Textarea
                    placeholder="Beschreibung hinzufügen..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    rows={3}
                    data-testid="caption-input"
                  />
                  
                  {/* Upload Button */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={closeUploadModal}
                      className="flex-1"
                      data-testid="cancel-upload-button"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending || !selectedLocationId}
                      className="flex-1"
                      data-testid="upload-button"
                    >
                      {uploadMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Teilen</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Full View Modal */}
      {fullViewMedia && (
        <Dialog open={!!fullViewMedia} onOpenChange={closeFullView}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col bg-black" data-testid="full-view-modal">
            {/* Header - Outside image */}
            <DialogHeader className="bg-black text-white p-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <DialogTitle className="text-lg font-medium">
                    {fullViewMedia.caption || 'Reisefoto'}
                  </DialogTitle>
                  {/* Image Counter - In header */}
                  {fullViewCarousel && fullViewCarousel.length > 1 && (
                    <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <span data-testid="full-view-counter">
                        {fullViewIndex + 1} von {fullViewCarousel.length}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeFullView}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  data-testid="close-full-view"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm opacity-80 mt-2">
                {fullViewMedia.creatorId ? 
                  creators.find(c => c.id === fullViewMedia.creatorId)?.name || fullViewMedia.uploadedBy || 'Unbekannt' : 
                  fullViewMedia.uploadedBy || 'Unbekannt'
                } • {formatTime(fullViewMedia.uploadedAt)}
                {getLocationName(fullViewMedia.locationId) && (
                  <span> • 📍 {getLocationName(fullViewMedia.locationId)}</span>
                )}
              </div>
            </DialogHeader>
            
            {/* Main content area with navigation */}
            <div className="flex flex-1 items-center bg-black min-h-0">
              {/* Left Navigation - Outside image */}
              {fullViewCarousel && fullViewCarousel.length > 1 && (
                <div className="flex-shrink-0 px-4">
                  <button
                    onClick={goToFullViewPrev}
                    className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 transition-colors"
                    data-testid="full-view-prev"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Clean image area */}
              <div 
                className="flex-1 flex items-center justify-center bg-black min-h-0 py-4"
                onTouchStart={handleModalTouchStart}
                onTouchMove={handleModalTouchMove}
                onTouchEnd={handleModalTouchEnd}
              >
                {fullViewMedia.mediaType === 'video' && fullViewMedia.videoUrl ? (
                  <video
                    src={fullViewMedia.videoUrl}
                    poster={fullViewMedia.thumbnailUrl || undefined}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain"
                    data-testid="full-view-video"
                  >
                    <source src={fullViewMedia.videoUrl} type="video/mp4" />
                    Ihr Browser unterstützt das Video-Element nicht.
                  </video>
                ) : fullViewMedia.imageUrl && (
                  <img
                    src={fullViewMedia.imageUrl}
                    alt={fullViewMedia.caption || "Reisefoto"}
                    className="max-w-full max-h-full object-contain"
                    data-testid="full-view-image"
                  />
                )}
              </div>

              {/* Right Navigation - Outside image */}
              {fullViewCarousel && fullViewCarousel.length > 1 && (
                <div className="flex-shrink-0 px-4">
                  <button
                    onClick={goToFullViewNext}
                    className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 transition-colors"
                    data-testid="full-view-next"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation - Outside image at bottom */}
            {fullViewCarousel && fullViewCarousel.length > 1 && (
              <div className="bg-black border-t border-gray-800 p-4 flex-shrink-0">
                <div className="flex justify-center space-x-2 overflow-x-auto">
                  {fullViewCarousel.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => goToFullViewIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-all overflow-hidden ${
                        index === fullViewIndex 
                          ? 'border-white shadow-lg' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                      data-testid={`full-view-thumbnail-${index}`}
                    >
                      {photo.mediaType === 'video' && photo.thumbnailUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={photo.thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : photo.imageUrl ? (
                        <img
                          src={photo.imageUrl}
                          alt={photo.caption || "Thumbnail"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null);
            setEditCaption("");
            setEditLocationId("");
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Beitrag bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Beschreibung</label>
                <Textarea
                  placeholder="Beschreibung bearbeiten..."
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="text-base"
                  rows={4}
                  maxLength={500}
                  data-testid="edit-caption-input"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Ort</label>
                <Select value={editLocationId} onValueChange={setEditLocationId}>
                  <SelectTrigger data-testid="edit-location-select">
                    <SelectValue placeholder="Ort auswählen (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kein Ort</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPost(null);
                    setEditCaption("");
                    setEditLocationId("");
                  }}
                  data-testid="edit-cancel-button"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    if (editingPost) {
                      editMutation.mutate({
                        photoId: editingPost,
                        caption: editCaption,
                        locationId: editLocationId || ""
                      });
                    }
                  }}
                  disabled={editMutation.isPending}
                  data-testid="edit-save-button"
                >
                  {editMutation.isPending ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Carousel Post Component
interface CarouselPostProps {
  carousel: { type: 'carousel', groupId: string, photos: TripPhoto[], id: string, uploadedAt: Date | null, locationId: string | null };
  creators: Creator[];
  getLocationName: (locationId: string | null) => string | null;
  formatTime: (date: Date | null) => string;
  likedPhotos: Set<string>;
  handleLike: (photoId: string) => void;
  handleDelete: (photoId: string) => void;
  openFullView: (photo: TripPhoto, carousel?: TripPhoto[]) => void;
}

function CarouselPost({ carousel, creators, getLocationName, formatTime, likedPhotos, handleLike, handleDelete, openFullView }: CarouselPostProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const currentPhoto = carousel.photos[currentIndex];

  const nextPhoto = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % carousel.photos.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevPhoto = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + carousel.photos.length) % carousel.photos.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && carousel.photos.length > 1) {
      nextPhoto();
    }
    if (isRightSwipe && carousel.photos.length > 1) {
      prevPhoto();
    }
  };


  return (
    <Card className="overflow-hidden" data-testid={`post-${carousel.id}`}>
      {/* Post Header */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1" data-testid={`post-author-${carousel.id}`}>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {currentPhoto.creatorId ? 
                  creators.find(c => c.id === currentPhoto.creatorId)?.name || currentPhoto.uploadedBy || 'Unbekannt' : 
                  currentPhoto.uploadedBy || 'Unbekannt'
                }
              </span>
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center space-x-1">
              <Image className="w-3 h-3" />
              <span>{carousel.photos.length} Fotos</span>
            </div>
            {getLocationName(currentPhoto.locationId) && (
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                📍 {getLocationName(currentPhoto.locationId)}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground" data-testid={`post-time-${carousel.id}`}>
              <Clock className="w-3 h-3" />
              <span>{formatTime(currentPhoto.uploadedAt)}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 z-50 relative"
                  data-testid={`post-menu-${carousel.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem
                  onClick={() => handleDelete(currentPhoto.id)}
                  className="text-red-600 focus:text-red-600"
                  data-testid={`delete-post-${carousel.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Carousel Content */}
      <div 
        className="relative group overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding Container */}
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {carousel.photos.map((photo, index) => (
            <div key={photo.id} className="w-full flex-shrink-0 relative">
              {photo.mediaType === 'video' && photo.videoUrl ? (
                <VideoPreview photo={photo} openFullView={(p) => openFullView(p, carousel.photos)} />
              ) : photo.imageUrl && (
                <div className="relative cursor-pointer" onClick={() => openFullView(photo, carousel.photos)}>
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Reisefoto"}
                    className="w-full object-cover max-h-96 bg-gray-50 dark:bg-gray-800"
                    data-testid={`post-image-${photo.id}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                      <Maximize2 className="w-6 h-6 text-black dark:text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Only show if more than 1 photo */}
        {carousel.photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              data-testid={`carousel-prev-${carousel.id}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              data-testid={`carousel-next-${carousel.id}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Carousel Indicators */}
        {carousel.photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {carousel.photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                data-testid={`carousel-indicator-${carousel.id}-${index}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Caption */}
      {currentPhoto.caption && (
        <div className="px-3 py-1.5">
          <p className="text-sm" data-testid={`post-caption-${currentPhoto.id}`}>{currentPhoto.caption}</p>
        </div>
      )}

      {/* Post Actions - Like */}
      <div className="p-3 pt-2 border-t border-border/50">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike(currentPhoto.id)}
            className={`flex items-center space-x-2 ${
              likedPhotos.has(currentPhoto.id) ? 'text-red-500' : 'text-muted-foreground'
            }`}
            data-testid={`like-button-${currentPhoto.id}`}
          >
            <Heart 
              className={`w-4 h-4 ${likedPhotos.has(currentPhoto.id) ? 'fill-current' : ''}`} 
            />
            <span>{currentPhoto.likesCount || 0}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Video Preview Component with fallback handling
interface VideoPreviewProps {
  photo: TripPhoto;
  openFullView: (photo: TripPhoto, carousel?: TripPhoto[]) => void;
}

function VideoPreview({ photo, openFullView }: VideoPreviewProps) {
  const [showVideo, setShowVideo] = React.useState(false);
  const [thumbnailError, setThumbnailError] = React.useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Generate a thumbnail from the video if no thumbnailUrl is available
  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && !photo.thumbnailUrl && !thumbnailError) {
      // Try to capture a frame at 1 second or 10% of video duration, whichever is smaller
      video.currentTime = Math.min(1, video.duration * 0.1);
    }
    setIsVideoLoaded(true);
  };

  const handlePlayClick = () => {
    setShowVideo(true);
    // Small delay to ensure video element is rendered
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 100);
  };

  const hasThumbnail = photo.thumbnailUrl && !thumbnailError;

  return (
    <div className="relative group" data-testid={`post-video-${photo.id}`}>
      {!showVideo ? (
        // Preview mode - show thumbnail or placeholder
        <div className="relative w-full h-96 bg-gray-900 rounded cursor-pointer" onClick={handlePlayClick}>
          {hasThumbnail ? (
            <img
              src={photo.thumbnailUrl || ""}
              alt={photo.caption || "Video Vorschau"}
              className="w-full h-full object-cover rounded"
              onError={() => setThumbnailError(true)}
              data-testid={`post-video-thumbnail-${photo.id}`}
            />
          ) : (
            // Fallback placeholder with gradient background
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-2 opacity-60" />
                <p className="text-sm opacity-80">Video Vorschau</p>
              </div>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-4 hover:bg-black/80 transition-colors" data-testid={`button-play-${photo.id}`}>
              <PlayCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Video badge */}
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
            <Video className="w-3 h-3" />
            <span>Video</span>
          </div>
        </div>
      ) : (
        // Video mode - show actual video player
        <div className="relative">
          <video
            ref={videoRef}
            src={photo.videoUrl || ""}
            poster={photo.thumbnailUrl || undefined}
            controls
            preload="metadata"
            playsInline
            className="w-full max-h-96 object-cover rounded"
            data-testid={`post-video-player-${photo.id}`}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onError={(e) => {
              console.error('Video error:', e);
              console.log('Video URL:', photo.videoUrl);
            }}
          >
            <source src={photo.videoUrl || ""} type="video/mp4" />
            Ihr Browser unterstützt das Video-Element nicht.
          </video>
          
          {/* Video badge */}
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
            <Video className="w-3 h-3" />
            <span>Video</span>
          </div>
          
          {/* Fullscreen button */}
          <button 
            onClick={() => openFullView(photo)}
            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            title="Vollbild anzeigen"
            data-testid={`button-fullview-${photo.id}`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}