import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera, Upload, X, Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location, Creator } from "@shared/schema";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("general");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
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

  // Upload mutation for centralized trip photos
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption, uploadedBy, locationId, creatorId }: { file: File; caption: string; uploadedBy: string; locationId?: string; creatorId?: string }) => {
      const formData = new FormData();
      formData.append('media', file); // Use 'media' key to support both images and videos
      formData.append('caption', caption || ''); // Always append caption, even if empty
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
      queryClient.invalidateQueries({ queryKey: ["/api/trip-photos/paginated", "global"] });
      // Auto-redirect to news feed after upload
      window.location.href = '/live-feed';
    },
    onSettled: () => {
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  // Reset form helper
  const resetForm = () => {
    setCaption("");
    setName("");
    setSelectedLocationId("general");
    setSelectedCreatorId("");
    setSelectedFile(null);
    setMediaType('image');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie ein Bild oder Video aus.",
        variant: "destructive",
      });
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: `${isVideo ? 'Videos' : 'Bilder'} dürfen maximal ${isVideo ? '50' : '10'}MB groß sein.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setMediaType(isVideo ? 'video' : 'image');
  };

  // Handle modal close
  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie ein Bild oder Video aus.",
        variant: "destructive",
      });
      return;
    }

    // Check if creator is selected
    if (!selectedCreatorId) {
      toast({
        title: "Person auswählen",
        description: "Bitte wählen Sie aus, wer die Datei hochlädt.",
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

  // Handle open change from dialog
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCloseModal();
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="upload-modal">
          <DialogHeader>
            <DialogTitle>Foto oder Video teilen</DialogTitle>
            <DialogDescription>
              Teilen Sie Ihr Foto oder Video mit der Gruppe und fügen Sie optional eine Beschreibung hinzu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File selection section */}
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Foto oder Video auswählen
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Bilder (JPG, PNG, WebP, GIF) bis 10MB oder Videos (MP4, WebM, MOV) bis 50MB
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    data-testid="button-select-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Datei auswählen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Selected file preview */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {mediaType === 'video' ? (
                      <Video className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Image className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    data-testid="button-remove-file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  {/* Creator Selection - Required */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Wer lädt die Datei hoch? *</label>
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}