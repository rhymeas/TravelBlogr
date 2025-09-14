import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Clock, User, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TripPhoto } from "@shared/schema";

interface LiveTripFeedProps {
  locationId: string;
  locationName: string;
}

export function LiveTripFeed({ locationId, locationName }: LiveTripFeedProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [uploadImageUrl, setUploadImageUrl] = useState("");
  const { toast } = useToast();

  // Query to fetch trip photos
  const { data: tripPhotos = [], isLoading, refetch } = useQuery<TripPhoto[]>({
    queryKey: ["/api/locations", locationId, "trip-photos"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Mutation for adding trip photos
  const addTripPhotoMutation = useMutation({
    mutationFn: async (tripPhotoData: any) => {
      const response = await apiRequest("POST", `/api/locations/${locationId}/trip-photos`, tripPhotoData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "trip-photos"] });
      setIsUploadModalOpen(false);
      setUploadCaption("");
      setUploadedBy("");
      setUploadImageUrl("");
      toast({
        title: "Foto hochgeladen!",
        description: "Ihr Reisefoto wurde erfolgreich geteilt.",
      });
    },
    onError: () => {
      toast({
        title: "Upload fehlgeschlagen",
        description: "Ihr Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Handle upload completion from ObjectUploader
  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadUrl = uploadedFile.uploadURL;
      
      try {
        // Normalize the object path and get the public URL
        const response = await apiRequest("POST", "/api/objects/normalize", {
          imageURL: uploadUrl
        });
        const data = await response.json();
        setUploadImageUrl(data.publicURL || uploadUrl);
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        setUploadImageUrl(uploadUrl); // Fallback to direct URL
      }
    }
  };

  // Get upload parameters for ObjectUploader
  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImageUrl) {
      toast({
        title: "Kein Foto",
        description: "Bitte laden Sie ein Foto hoch.",
        variant: "destructive",
      });
      return;
    }

    addTripPhotoMutation.mutate({
      imageUrl: uploadImageUrl,
      caption: uploadCaption,
      uploadedBy: uploadedBy || null,
    });
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date | string | null) => {
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
    <Card className="w-full" data-testid="live-trip-feed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center" data-testid="feed-title">
            <Camera className="w-5 h-5 mr-2 text-primary" />
            Live Reise-Feed
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              data-testid="refresh-feed"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="upload-photo-button">
                  <Upload className="w-4 h-4 mr-2" />
                  Foto teilen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="upload-modal">
                <DialogHeader>
                  <DialogTitle>Reisefoto für {locationName} teilen</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo-upload">Foto hochladen</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={getUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full"
                    >
                      <div className="flex items-center justify-center py-4">
                        <Upload className="w-5 h-5 mr-2" />
                        {uploadImageUrl ? "Foto ändern" : "Foto auswählen"}
                      </div>
                    </ObjectUploader>
                    {uploadImageUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700" data-testid="upload-success">
                        ✓ Foto erfolgreich hochgeladen
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Bildunterschrift (optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Beschreiben Sie diesen Moment..."
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      className="resize-none"
                      rows={3}
                      data-testid="input-caption"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uploaded-by">Name (optional)</Label>
                    <Input
                      id="uploaded-by"
                      placeholder="Ihr Name"
                      value={uploadedBy}
                      onChange={(e) => setUploadedBy(e.target.value)}
                      data-testid="input-name"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUploadModalOpen(false)}
                      data-testid="cancel-upload"
                    >
                      Abbrechen
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addTripPhotoMutation.isPending || !uploadImageUrl}
                      data-testid="submit-photo"
                    >
                      {addTripPhotoMutation.isPending ? "Wird hochgeladen..." : "Foto teilen"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Aktuelle Fotos von {locationName}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" data-testid="loading-photos">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tripPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-photos">
            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="font-medium">Noch keine Fotos geteilt</p>
            <p className="text-sm">Seien Sie der Erste, der ein Foto von {locationName} teilt!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tripPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="border rounded-lg overflow-hidden bg-card" 
                data-testid={`trip-photo-${photo.id}`}
              >
                {/* Photo */}
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Reisefoto"}
                    className="w-full h-full object-cover"
                    data-testid={`photo-image-${photo.id}`}
                  />
                </div>
                
                {/* Photo Details */}
                <div className="p-3 space-y-2">
                  {photo.caption && (
                    <p className="text-sm" data-testid={`photo-caption-${photo.id}`}>
                      {photo.caption}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      {photo.uploadedBy && (
                        <div className="flex items-center" data-testid={`photo-author-${photo.id}`}>
                          <User className="w-3 h-3 mr-1" />
                          <span>{photo.uploadedBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center" data-testid={`photo-timestamp-${photo.id}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatTimestamp(photo.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}