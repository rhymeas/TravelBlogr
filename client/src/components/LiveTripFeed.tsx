import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, User, Camera, Send, Image, Upload } from "lucide-react";
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

  // Simplified direct file upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption, uploadedBy }: { file: File; caption: string; uploadedBy: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (caption) formData.append('caption', caption);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);

      const response = await fetch(`/api/locations/${locationId}/trip-photos`, {
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

  // Enhanced file selection with better validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File size validation
      if (file.size > 10485760) { // 10MB
        toast({
          title: "Datei zu groß",
          description: "Bitte wählen Sie eine Datei unter 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      // File type validation
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
      toast({
        title: "Foto ausgewählt",
        description: `${file.name} bereit zum Hochladen.`,
      });
    }
  };

  // Simplified direct upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Bitte Foto wählen",
        description: "Wählen Sie ein Foto zum Hochladen aus.",
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
      });
    } catch (error) {
      // Error handling is already in the mutation
      console.error("Upload error:", error);
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
                <span className="text-lg font-medium">Foto aus {locationName} hochladen</span>
                <span className="text-sm text-muted-foreground">JPG, PNG, WebP oder GIF (max. 10MB)</span>
              </Button>
            ) : (
              /* File Selected - Show Preview and Details */
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200" data-testid="file-preview">
                  <Image className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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

                {/* Name Input */}
                <Input
                  placeholder="Ihr Name (optional)"
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
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
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