import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, User, Camera, Send, Image } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TripPhoto } from "@shared/schema";

interface LiveTripFeedProps {
  locationId: string;
  locationName: string;
  showUpload?: boolean;
}

export function LiveTripFeed({ locationId, locationName, showUpload = true }: LiveTripFeedProps) {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Query to fetch trip photos with auto-refresh
  const { data: tripPhotos = [], isLoading } = useQuery<TripPhoto[]>({
    queryKey: ["/api/locations", locationId, "trip-photos"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Simple upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ imageUrl, caption, uploadedBy }: any) => {
      const response = await apiRequest("POST", `/api/locations/${locationId}/trip-photos`, {
        imageUrl,
        caption: caption || null,
        uploadedBy: uploadedBy || null,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "trip-photos"] });
      setCaption("");
      setName("");
      setSelectedFile(null);
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 10485760) { // 10MB
        toast({
          title: "Datei zu groß",
          description: "Bitte wählen Sie eine Datei unter 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile && !caption.trim()) {
      toast({
        title: "Nichts zu posten",
        description: "Bitte wählen Sie ein Foto oder geben Sie Text ein.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = "";
      
      if (selectedFile) {
        // Get upload URL
        const uploadResponse = await apiRequest("POST", "/api/objects/upload");
        const { uploadURL } = await uploadResponse.json();
        
        // Upload file directly
        const uploadFileResponse = await fetch(uploadURL, {
          method: "PUT",
          body: selectedFile,
        });
        
        if (!uploadFileResponse.ok) {
          throw new Error("Datei-Upload fehlgeschlagen");
        }
        
        imageUrl = uploadURL;
      }

      // Create post
      await uploadMutation.mutateAsync({
        imageUrl,
        caption: caption.trim(),
        uploadedBy: name.trim(),
      });
    } catch (error) {
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
      {/* Simple Upload Area - Facebook Style */}
      {showUpload && (
        <Card className="p-4" data-testid="upload-area">
          <div className="space-y-3">
            {/* Text Input */}
            <Textarea
              placeholder={`Was möchten Sie aus ${locationName} teilen?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border-0 shadow-none resize-none text-base focus-visible:ring-0 p-0"
              rows={2}
              maxLength={500}
              data-testid="post-text-input"
            />
            
            {/* File Preview */}
            {selectedFile && (
              <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg" data-testid="file-preview">
                <Image className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-auto h-6 w-6 p-0"
                  data-testid="remove-file"
                >
                  ×
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-3">
                {/* Photo Upload Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 text-blue-600 hover:bg-blue-50"
                  data-testid="photo-upload-button"
                >
                  <Plus className="w-4 h-4" />
                  <span>Foto</span>
                </Button>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="file-input"
                />

                {/* Name Input */}
                <Input
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-32 h-8 text-xs"
                  maxLength={100}
                  data-testid="name-input"
                />
              </div>

              {/* Post Button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || (!selectedFile && !caption.trim())}
                size="sm"
                className="flex items-center space-x-1"
                data-testid="post-button"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Posten...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Posten</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Feed Title */}
      <div className="flex items-center space-x-2 px-1" data-testid="feed-title">
        <Camera className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Live aus {locationName}</h3>
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
          <p className="text-sm text-muted-foreground/70">Seien Sie der Erste, der etwas aus {locationName} teilt!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tripPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden" data-testid={`post-${photo.id}`}>
              {/* Post Header */}
              <div className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {photo.uploadedBy && (
                      <div className="flex items-center space-x-1" data-testid={`post-author-${photo.id}`}>
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{photo.uploadedBy}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground" data-testid={`post-time-${photo.id}`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(photo.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {photo.caption && (
                <div className="px-3 pb-2">
                  <p className="text-sm" data-testid={`post-caption-${photo.id}`}>{photo.caption}</p>
                </div>
              )}

              {/* Post Image */}
              {photo.imageUrl && (
                <div className="relative">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Reisefoto"}
                    className="w-full object-cover max-h-96"
                    data-testid={`post-image-${photo.id}`}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}