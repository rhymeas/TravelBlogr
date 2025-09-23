import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Star, Plus, Upload, Link, Camera, X, CheckCircle, Loader2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Lightbox } from "@/components/Lightbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [newImageData, setNewImageData] = useState<AddImageFormData>({
    imageUrl: "",
    caption: ""
  });
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();

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
        title: t('mainImageSet'),
        description: t('mainImageSetDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler", 
        description: `${t('mainImageSetError')}: ${error.message}`,
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

  // Prepare images for lightbox (main image first, then others)
  const lightboxImages = mainImage 
    ? [mainImage, ...otherImages]
    : otherImages;

  // Lightbox handlers
  const openLightbox = (imageId: string) => {
    const index = lightboxImages.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNextImage = () => {
    if (lightboxIndex < lightboxImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const goToPreviousImage = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <Card className={className} data-testid="image-gallery">
      <CardHeader>
        <CardTitle>{t('galleryImages')} ({images.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Empty State with Modern Upload Area */}
        {images.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('noImagesYet')}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {isAdmin 
                ? t('noImagesAdmin')
                : t('imagesComingSoon')}
            </p>
            
            {/* Modern Integrated Upload Area */}
            {isAdmin && (
              <div className="max-w-md mx-auto">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/5 hover:bg-muted/10 transition-all duration-200 p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2">{t('addImage')}</h4>
                      <p className="text-muted-foreground text-sm mb-4">
                        {t('dragFilesOrSelect')}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <ObjectUploader
                        maxNumberOfFiles={5}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleImageUploadComplete}
                        buttonClassName="min-w-[120px]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('selectFiles')}
                      </ObjectUploader>
                      <Button 
                        variant="outline" 
                        size="default" 
                        className="min-w-[120px]" 
                        onClick={() => setIsAddingImage(true)}
                        data-testid="button-add-url"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        {t('addUrlImage')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Main Image */}
            {mainImage && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">{t('mainImage')}</h4>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingImage(true)}
                      data-testid="button-add-more-images"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addMoreImages')}
                    </Button>
                  )}
                </div>
                <div className="relative group">
                  <div 
                    className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => openLightbox(mainImage.id)}
                    data-testid="main-image-container"
                  >
                    <img
                      src={mainImage.imageUrl}
                      alt={mainImage.caption || t('mainImage')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      data-testid="main-image"
                    />
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-yellow-500 text-yellow-900 shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      {t('mainImage')}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteImageMutation.mutate(mainImage.id)}
                        data-testid={`button-delete-${mainImage.id}`}
                        className="shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {mainImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-xl">
                      <p className="text-white font-medium">{mainImage.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Grid */}
            <div>
              <h4 className="font-semibold text-lg mb-4">
                {otherImages.length > 0 ? `${t('moreImages')} (${otherImages.length})` : t('images')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div 
                      className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                      onClick={() => openLightbox(image.id)}
                      data-testid={`gallery-image-container-${image.id}`}
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.caption || "Galerie Bild"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        decoding="async"
                        data-testid={`gallery-image-${image.id}`}
                      />
                    </div>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 shadow-lg"
                          onClick={() => setMainImageMutation.mutate(image.id)}
                          data-testid={`button-set-main-${image.id}`}
                          title={t('setAsMain')}
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 shadow-lg"
                          onClick={() => deleteImageMutation.mutate(image.id)}
                          data-testid={`button-delete-${image.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {image.caption && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground truncate">{image.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add New Image Card */}
                {isAdmin && (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary/50 hover:bg-muted/5 transition-all cursor-pointer group">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="h-full w-full flex-col gap-2 text-muted-foreground group-hover:text-primary transition-colors" 
                      onClick={() => setIsAddingImage(true)}
                      data-testid="button-add-image-card"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm">{t('addImage')}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Add Image Modal/Form */}
        {isAdmin && isAddingImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="add-image-modal">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('addImage')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingImage(false);
                      setNewImageData({ imageUrl: "", caption: "" });
                      setUploadMode('upload');
                    }}
                    data-testid="button-close-modal"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
                  <Button 
                    variant={uploadMode === 'upload' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setUploadMode('upload')}
                    data-testid="toggle-upload-mode"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button 
                    variant={uploadMode === 'url' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setUploadMode('url')}
                    data-testid="toggle-url-mode"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    URL
                  </Button>
                </div>

                {/* Upload Mode */}
                {uploadMode === 'upload' && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <div className="p-3 rounded-full bg-primary/10 mx-auto w-fit">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-2">{t('uploadFiles')}</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('uploadDescription')}
                        </p>
                      </div>
                      <ObjectUploader
                        maxNumberOfFiles={5}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleImageUploadComplete}
                        buttonClassName="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('selectFiles')}
                      </ObjectUploader>
                    </div>
                  </div>
                )}

                {/* URL Mode */}
                {uploadMode === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image-url" className="text-sm font-medium">Bild-URL</Label>
                      <Input
                        id="image-url"
                        placeholder="https://example.com/image.jpg"
                        value={newImageData.imageUrl}
                        onChange={(e) => setNewImageData({ ...newImageData, imageUrl: e.target.value })}
                        data-testid="input-image-url"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-caption" className="text-sm font-medium">Bildunterschrift (optional)</Label>
                      <Textarea
                        id="image-caption"
                        placeholder="Beschreibung des Bildes..."
                        value={newImageData.caption}
                        onChange={(e) => setNewImageData({ ...newImageData, caption: e.target.value })}
                        data-testid="input-image-caption"
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>
                    
                    {/* URL Preview */}
                    {newImageData.imageUrl && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                            <img
                              src={newImageData.imageUrl}
                              alt={t('preview')}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t('imagePreview')}</p>
                            <p className="text-xs text-muted-foreground truncate">{newImageData.imageUrl}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={() => addImageMutation.mutate(newImageData)}
                        disabled={!newImageData.imageUrl || addImageMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-image"
                      >
                        {addImageMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('saving')}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {t('addImage')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingImage(false);
                          setNewImageData({ imageUrl: "", caption: "" });
                        }}
                        data-testid="button-cancel-add-image"
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lightbox */}
        <Lightbox
          images={lightboxImages.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            caption: img.caption || undefined
          }))}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNext={goToNextImage}
          onPrevious={goToPreviousImage}
        />
      </CardContent>
    </Card>
  );
}