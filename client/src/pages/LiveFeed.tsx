import { useQuery } from "@tanstack/react-query";
import { User, Camera } from "lucide-react";
import Header from "@/components/Header";
import type { Location, TripPhoto, Creator } from "@shared/schema";

export default function LiveFeedPage() {
  // Fetch locations for location name lookup
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch creators for creator name lookup
  const { data: creators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  // Fetch centralized trip photos
  const { data: tripPhotos = [], isLoading } = useQuery<TripPhoto[]>({
    queryKey: ["/api/trip-photos"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Format timestamp with relative time
  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    const timestamp = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`;
    if (hours < 24) return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
    if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
    
    return timestamp.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get location name by ID
  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return null;
    const location = locations.find(l => l.id === locationId);
    return location?.name;
  };

  // Loading skeleton component
  const PhotoSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        {/* Loading skeletons */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-foreground">Live Feed</h1>
            <p className="text-muted-foreground mt-1">Teile deine Reisemomente</p>
          </div>
          <PhotoSkeleton />
          <PhotoSkeleton />
          <PhotoSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" data-testid="live-feed-page">
      <Header />
      
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground" data-testid="live-feed-title">Live Feed</h1>
          <p className="text-muted-foreground mt-1">Teile deine Reisemomente</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Photo feed - Instagram style */}
        <div className="space-y-4">
          {tripPhotos.length === 0 ? (
            <div className="py-12">
              {/* Empty state with gray placeholders */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-2">Noch keine Fotos</h3>
                <p className="text-gray-500 text-sm">Sei der Erste, der ein Foto teilt</p>
              </div>

              {/* Gray placeholder cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {tripPhotos.map((photo) => (
                <div key={photo.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden" data-testid={`trip-photo-${photo.id}`}>
                  {/* Photo header - Instagram style */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        {(photo.creatorId || photo.uploadedBy) && (
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100" data-testid="photo-author">
                            {photo.creatorId ? 
                              creators.find(c => c.id === photo.creatorId)?.name || photo.uploadedBy || 'Unbekannt' : 
                              photo.uploadedBy
                            }
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {getLocationName(photo.locationId) && (
                            <>
                              <span data-testid="photo-location">{getLocationName(photo.locationId)}</span>
                              <span>•</span>
                            </>
                          )}
                          <span data-testid="photo-timestamp">{formatTime(photo.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo image */}
                  <div className="relative bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={photo.imageUrl} 
                      alt={photo.caption || "Foto"}
                      className="w-full h-auto"
                      data-testid="photo-image"
                      onError={(e) => {
                        // Show placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="h-64 flex items-center justify-center text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }
                      }}
                    />
                  </div>

                  {/* Caption */}
                  {photo.caption && (
                    <div className="p-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100" data-testid="photo-caption">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}