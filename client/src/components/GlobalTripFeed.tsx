import { useState, useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, User, Camera, Send, Image, Upload, Heart, Trash2, Video, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TripPhoto, Creator, Location } from "@shared/schema";

export default function GlobalTripFeed() {
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
    queryKey: ["/api/trip-photos/paginated", "global"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: '10',
        ...(pageParam && { cursor: pageParam }),
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

  // Get location name by ID
  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return null;
    const location = locations.find(l => l.id === locationId);
    return location?.name;
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
      <div className="flex items-center space-x-2 px-1" data-testid="feed-title">
        <Camera className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Live Feed</h3>
        <div className="ml-auto text-xs text-muted-foreground">
          {tripPhotos.length} {tripPhotos.length === 1 ? 'Beitrag' : 'Beiträge'}
        </div>
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <Card className="p-8" data-testid="loading-posts">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      ) : tripPhotos.length === 0 ? (
        <Card className="p-8 text-center" data-testid="no-posts">
          <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Noch keine Beiträge</p>
          <p className="text-sm text-muted-foreground/70">Sei der Erste, der etwas teilt!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tripPhotos.map((photo) => (
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
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground" data-testid={`post-time-${photo.id}`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(photo.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Post Caption */}
              {photo.caption && (
                <div className="px-3 pb-2">
                  <p className="text-sm" data-testid={`post-caption-${photo.id}`}>{photo.caption}</p>
                </div>
              )}

              {/* Post Media - Image or Video */}
              {photo.mediaType === 'video' && photo.videoUrl ? (
                <div className="relative">
                  <video
                    src={photo.videoUrl}
                    poster={photo.thumbnailUrl || undefined}
                    controls
                    className="w-full max-h-96"
                    data-testid={`post-video-${photo.id}`}
                  >
                    <source src={photo.videoUrl} type="video/mp4" />
                    Ihr Browser unterstützt das Video-Element nicht.
                  </video>
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Video</span>
                  </div>
                </div>
              ) : photo.imageUrl && (
                <div className="relative">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Reisefoto"}
                    className="w-full object-cover max-h-96"
                    data-testid={`post-image-${photo.id}`}
                  />
                </div>
              )}

              {/* Post Actions - Like and Delete */}
              <div className="p-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
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
                  
                  {deleteTokens[photo.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(photo.id)}
                      className="text-muted-foreground hover:text-red-500"
                      data-testid={`delete-button-${photo.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
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
            ) : tripPhotos.length > 0 ? (
              <p className="text-sm text-muted-foreground">Alle Beiträge geladen</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}