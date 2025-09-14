import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, MapPin, Plus, Clock, User, Camera, Send, Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location, TripPhoto } from "@shared/schema";

export default function LiveFeedPage() {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch locations for the optional location selector
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch centralized trip photos
  const { data: tripPhotos = [], isLoading } = useQuery<TripPhoto[]>({
    queryKey: ["/api/trip-photos"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Upload mutation for centralized trip photos
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption, uploadedBy, locationId }: { file: File; caption: string; uploadedBy: string; locationId?: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (caption) formData.append('caption', caption);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (locationId) formData.append('locationId', locationId);

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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({
        title: "Gepostet!",
        description: "Ihr Foto wurde erfolgreich im Live-Feed geteilt.",
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
      toast({
        title: "Foto ausgewählt",
        description: `${file.name} bereit zum Hochladen.`,
      });
    }
  };

  // Upload handler
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
        locationId: selectedLocationId === "general" ? undefined : selectedLocationId,
      });
    } catch (error) {
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

  // Get location name by ID
  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return null;
    const location = locations.find(l => l.id === locationId);
    return location?.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="live-feed-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8" data-testid="live-feed-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="back-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Tour
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="live-feed-title">
            🚗 Live Reise-Feed
          </h1>
          <p className="text-primary-foreground/90 text-lg">
            Teile deine besten Momente von der Weinberg Tour 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Centralized Upload Area */}
        <Card className="p-6" data-testid="centralized-upload-area">
          <div className="space-y-6">
            {!selectedFile ? (
              /* Large Upload Button */
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                data-testid="button-select-file"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">📸 Foto aus der Reise teilen</div>
                    <div className="text-sm text-muted-foreground">
                      Klicken um ein Foto von der Weinberg Tour hochzuladen
                    </div>
                  </div>
                </div>
              </Button>
            ) : (
              /* Upload Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <Image className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      {selectedFile.name} ausgewählt
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    data-testid="button-remove-file"
                  >
                    Entfernen
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Dein Name (optional)</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      maxLength={100}
                      data-testid="input-name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Bildunterschrift (optional)</label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Erzähle von diesem besonderen Moment..."
                      maxLength={500}
                      rows={3}
                      data-testid="input-caption"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Ort (optional)</label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Wähle einen Ort aus (oder lasse es leer)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general" data-testid="location-option-general">Allgemein (kein Ort)</SelectItem>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id} data-testid={`location-option-${location.slug}`}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                  data-testid="button-upload"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2">🔄</div>
                      Foto wird hochgeladen...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="w-4 h-4 mr-2" />
                      Im Live-Feed teilen
                    </div>
                  )}
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </Card>

        {/* Trip Photos Feed */}
        <Card data-testid="trip-photos-feed">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">📸</span>
              Reise-Fotos ({tripPhotos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {tripPhotos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Fotos geteilt.</p>
                <p className="text-sm">Sei der erste und teile ein tolles Foto von der Reise!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tripPhotos.map((photo) => (
                  <div key={photo.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900/50" data-testid={`trip-photo-${photo.id}`}>
                    {/* Photo Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {photo.uploadedBy && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="w-4 h-4 mr-1" />
                            <span data-testid="photo-author">{photo.uploadedBy}</span>
                          </div>
                        )}
                        {getLocationName(photo.locationId) && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span data-testid="photo-location">{getLocationName(photo.locationId)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span data-testid="photo-timestamp">{formatTime(photo.uploadedAt)}</span>
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="mb-3">
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.caption || "Reise-Foto"}
                        className="w-full max-w-2xl h-auto rounded-lg object-cover"
                        data-testid="photo-image"
                      />
                    </div>

                    {/* Caption */}
                    {photo.caption && (
                      <div className="text-gray-700 dark:text-gray-200" data-testid="photo-caption">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}