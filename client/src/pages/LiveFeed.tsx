import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Clock, User, Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import type { Location, TripPhoto, Creator } from "@shared/schema";

export default function LiveFeedPage() {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("general");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch locations for the optional location selector
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch creators for the creator selector
  const { data: creators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  // Fetch centralized trip photos
  const { data: tripPhotos = [], isLoading } = useQuery<TripPhoto[]>({
    queryKey: ["/api/trip-photos"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Upload mutation for centralized trip photos
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption, uploadedBy, locationId, creatorId }: { file: File; caption: string; uploadedBy: string; locationId?: string; creatorId?: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (caption) formData.append('caption', caption);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (locationId) formData.append('locationId', locationId);
      if (creatorId) formData.append('creatorId', creatorId);

      const response = await fetch('/api/trip-photos', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos"] });
      setCaption("");
      setName("");
      setSelectedLocationId("general");
      setSelectedCreatorId("");
      setSelectedFile(null);
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({
        title: "Erfolgreich geteilt",
        description: "Dein Foto wurde im Feed gepostet.",
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

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File selection handler called", e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) { // 10MB
        toast({
          title: "Datei zu groß",
          description: "Bitte wählen Sie eine Datei unter 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Nur JPG, PNG, WebP und GIF Dateien sind erlaubt.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      console.log("Opening upload modal with file:", file.name);
      setShowUploadModal(true);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setCaption("");
    setName("");
    setSelectedLocationId("general");
    setSelectedCreatorId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Kein Foto ausgewählt",
        description: "Bitte wählen Sie ein Foto aus.",
        variant: "destructive",
      });
      return;
    }

    // Check if creator is selected
    if (!selectedCreatorId) {
      toast({
        title: "Person auswählen",
        description: "Bitte wählen Sie aus, wer das Foto hochlädt.",
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
        locationId: selectedLocationId === "general" ? undefined : selectedLocationId,
        creatorId: selectedCreatorId,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

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
        {/* Simple header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 -ml-2">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Zurück
              </Button>
            </Link>
            <h1 className="text-xl font-semibold mt-2">Live Feed</h1>
          </div>
        </div>

        {/* Loading skeletons */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md" data-testid="upload-modal">
          <DialogHeader>
            <DialogTitle>Foto teilen</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={handleCloseModal}
                data-testid="button-close-modal"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selected file preview */}
            {selectedFile && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{selectedFile.name}</span>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid="button-remove-file"
                >
                  <span className="text-sm">Entfernen</span>
                </button>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-3">
              {/* Creator Selection - Required */}
              <div>
                <label className="text-sm font-medium mb-2 block">Wer lädt das Foto hoch? *</label>
                <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-700" data-testid="creator-dropdown">
                    <SelectValue placeholder="Bitte wählen Sie eine Person aus" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id} data-testid={`creator-option-${creator.id}`}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Zusätzliche Notiz (optional)"
                className="border-gray-300 dark:border-gray-700"
                maxLength={100}
                data-testid="input-name"
              />

              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Beschreibung hinzufügen..."
                className="border-gray-300 dark:border-gray-700 resize-none"
                maxLength={500}
                rows={3}
                data-testid="input-caption"
              />

              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="border-gray-300 dark:border-gray-700" data-testid="select-location">
                  <SelectValue placeholder="Ort auswählen (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general" data-testid="location-option-general">Kein Ort</SelectItem>
                  {locations?.filter(location => location.id && location.id.trim() !== '').map((location) => (
                    <SelectItem key={location.id} value={location.id} data-testid={`location-option-${location.slug}`}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
              data-testid="button-upload"
            >
              {uploading ? (
                <span>Wird hochgeladen...</span>
              ) : (
                <span>Teilen</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simple floating upload button */}
      <button
        onClick={() => {
          console.log("FAB clicked, fileInputRef.current:", fileInputRef.current);
          fileInputRef.current?.click();
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        data-testid="floating-upload-button"
      >
        <Upload className="w-6 h-6" />
      </button>
    </div>
  );
}