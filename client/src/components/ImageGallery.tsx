import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Star, Plus, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import type { LocationImage } from "@shared/schema";

interface ImageGalleryProps {
  locationId: string;
  isAdmin?: boolean;
  className?: string;
}

interface AddImageFormData {
  imageUrl: string;
  caption: string;
}

export function ImageGallery({ locationId, isAdmin = false, className = "" }: ImageGalleryProps) {
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImageData, setNewImageData] = useState<AddImageFormData>({
    imageUrl: "",
    caption: ""
  });
  const { toast } = useToast();

  // Fetch images for the location
  const { data: images = [], isLoading } = useQuery<LocationImage[]>({
    queryKey: ["/api/locations", locationId, "images"],
  });

  // Add image via URL mutation
  const addImageMutation = useMutation({
    mutationFn: async (data: AddImageFormData) => {
      const response = await apiRequest("POST", `/api/locations/${locationId}/images`, {
        imageUrl: data.imageUrl,
        caption: data.caption,
        isMain: images.length === 0 // Set as main if first image
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "images"] });
      setNewImageData({ imageUrl: "", caption: "" });
      setIsAddingImage(false);
      toast({
        title: "Bild hinzugefügt",
        description: "Das Bild wurde erfolgreich zur Galerie hinzugefügt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Bild konnte nicht hinzugefügt werden: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiRequest("DELETE", `/api/locations/${locationId}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "images"] });
      toast({
        title: "Bild gelöscht",
        description: "Das Bild wurde erfolgreich aus der Galerie entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Bild konnte nicht gelöscht werden: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Set main image mutation
  const setMainImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiRequest("PUT", `/api/locations/${locationId}/images/${imageId}/main`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", locationId, "images"] });
      toast({
        title: "Hauptbild festgelegt",
        description: "Das Bild wurde als Hauptbild festgelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler", 
        description: `Hauptbild konnte nicht festgelegt werden: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle file upload completion
  const handleImageUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      
      // Add the uploaded image to the location
      const imageData = {
        imageUrl: uploadedFile.uploadURL,
        caption: uploadedFile.name || "",
      };
      
      addImageMutation.mutate(imageData);
    }
  };

  // Handle upload parameters
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
        fields: {},
        headers: {
          "Content-Type": "application/octet-stream",
        },
      };
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Upload-Parameter konnten nicht abgerufen werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mainImage = images.find(img => img.isMain);
  const otherImages = images.filter(img => !img.isMain);

  return (
    <Card className={className} data-testid="image-gallery">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Bilder-Galerie ({images.length})</CardTitle>
          {isAdmin && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingImage(!isAddingImage)}
                data-testid="button-add-image-url"
              >
                <Plus className="w-4 h-4 mr-2" />
                URL hinzufügen
              </Button>
              <ObjectUploader
                maxNumberOfFiles={5}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleImageUploadComplete}
                buttonClassName="h-8 px-3"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </ObjectUploader>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Image Form */}
        {isAdmin && isAddingImage && (
          <Card className="mb-6 border-dashed">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-url">Bild-URL</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={newImageData.imageUrl}
                    onChange={(e) => setNewImageData({ ...newImageData, imageUrl: e.target.value })}
                    data-testid="input-image-url"
                  />
                </div>
                <div>
                  <Label htmlFor="image-caption">Bildunterschrift (optional)</Label>
                  <Input
                    id="image-caption"
                    placeholder="Beschreibung des Bildes"
                    value={newImageData.caption}
                    onChange={(e) => setNewImageData({ ...newImageData, caption: e.target.value })}
                    data-testid="input-image-caption"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => addImageMutation.mutate(newImageData)}
                    disabled={!newImageData.imageUrl || addImageMutation.isPending}
                    data-testid="button-save-image"
                  >
                    {addImageMutation.isPending ? "Speichern..." : "Bild hinzufügen"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingImage(false);
                      setNewImageData({ imageUrl: "", caption: "" });
                    }}
                    data-testid="button-cancel-add-image"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Image */}
        {mainImage && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Hauptbild</h4>
            <div className="relative group">
              <img
                src={mainImage.imageUrl}
                alt={mainImage.caption || "Hauptbild"}
                className="w-full aspect-video object-cover rounded-lg"
                data-testid="main-image"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-500 text-yellow-900">
                  <Star className="w-3 h-3 mr-1" />
                  Hauptbild
                </Badge>
              </div>
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteImageMutation.mutate(mainImage.id)}
                    data-testid={`button-delete-${mainImage.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {mainImage.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 rounded-b-lg">
                  <p className="text-sm">{mainImage.caption}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Images Grid */}
        {otherImages.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">
              Weitere Bilder ({otherImages.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.imageUrl}
                    alt={image.caption || "Galerie Bild"}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    data-testid={`gallery-image-${image.id}`}
                  />
                  {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMainImageMutation.mutate(image.id)}
                        data-testid={`button-set-main-${image.id}`}
                        title="Als Hauptbild festlegen"
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteImageMutation.mutate(image.id)}
                        data-testid={`button-delete-${image.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg">
                      <p className="text-xs truncate">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">📸</div>
              <h4 className="font-medium mb-2">Keine Bilder vorhanden</h4>
              <p className="text-sm">
                {isAdmin 
                  ? "Fügen Sie Bilder über Upload oder URL hinzu"
                  : "Bilder werden bald hinzugefügt"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}