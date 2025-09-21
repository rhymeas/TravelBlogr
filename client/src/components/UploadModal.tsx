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
import * as exifr from "exifr";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("general");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  // Extract EXIF data from image files
  const extractExifData = async (file: File): Promise<Date | null> => {
    try {
      if (!file.type.startsWith('image/')) {
        return null; // Not an image file
      }
      
      const exifData = await exifr.parse(file);
      
      // Try to get the DateTimeOriginal, DateTime, or CreateDate
      const dateTime = exifData?.DateTimeOriginal || 
                       exifData?.DateTime || 
                       exifData?.CreateDate;
      
      if (dateTime && dateTime instanceof Date) {
        return dateTime;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to extract EXIF data from', file.name, error);
      return null;
    }
  };

  // Upload mutation for batch trip photos
  const uploadMutation = useMutation({
    mutationFn: async ({ files, caption, uploadedBy, locationId, creatorId }: { files: File[]; caption: string; uploadedBy: string; locationId?: string; creatorId?: string }) => {
      const formData = new FormData();
      
      // Add all files to the form data
      files.forEach((file) => {
        formData.append('media', file);
      });
      
      // Extract EXIF data for each file and add to form data
      const exifDataPromises = files.map(async (file, index) => {
        const takenAt = await extractExifData(file);
        return { index, takenAt };
      });
      
      const exifResults = await Promise.all(exifDataPromises);
      
      // Add EXIF data to form data as JSON
      const exifData = exifResults.reduce((acc, { index, takenAt }) => {
        if (takenAt) {
          acc[index] = takenAt.toISOString();
        }
        return acc;
      }, {} as Record<number, string>);
      
      formData.append('exifData', JSON.stringify(exifData));
      formData.append('caption', caption || '');
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (locationId) formData.append('locationId', locationId);
      if (creatorId) formData.append('creatorId', creatorId);

      const response = await fetch('/api/trip-photos/media-batch', {
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
    setSelectedFiles([]);
    setMediaType('image');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // File selection handler for multiple files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    let hasVideo = false;
    let hasImage = false;

    // Validate each file
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Ungültiger Dateityp",
          description: `Datei "${file.name}" ist kein gültiges Bild oder Video.`,
          variant: "destructive",
        });
        continue;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: `"${file.name}" ist zu groß. ${isVideo ? 'Videos' : 'Bilder'} dürfen maximal ${isVideo ? '50' : '10'}MB groß sein.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
      if (isVideo) hasVideo = true;
      if (isImage) hasImage = true;
    }

    if (validFiles.length === 0) {
      return;
    }

    // Set media type based on content
    if (hasVideo && hasImage) {
      setMediaType('image'); // Mixed content, default to image
    } else if (hasVideo) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    setSelectedFiles(validFiles);
  };

  // Handle modal close
  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  // Upload handler for multiple files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Keine Dateien ausgewählt",
        description: "Bitte wählen Sie mindestens ein Bild oder Video aus.",
        variant: "destructive",
      });
      return;
    }

    // Check if creator is selected
    if (!selectedCreatorId) {
      toast({
        title: "Person auswählen",
        description: "Bitte wählen Sie aus, wer die Dateien hochlädt.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({
        files: selectedFiles,
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
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="upload-modal">
          <DialogHeader>
            <DialogTitle>Fotos oder Videos teilen</DialogTitle>
            <DialogDescription>
              Teilen Sie Ihre Fotos oder Videos mit der Gruppe und fügen Sie optional eine Beschreibung hinzu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File selection section */}
            {selectedFiles.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Fotos oder Videos auswählen
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Mehrere Dateien auswählen: Bilder (JPG, PNG, WebP, GIF) bis 10MB oder Videos (MP4, WebM, MOV) bis 50MB
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    data-testid="button-select-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Dateien auswählen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Selected files preview */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedFiles.length} Datei{selectedFiles.length !== 1 ? 'en' : ''} ausgewählt
                    </span>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      data-testid="button-remove-all-files"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        {file.type.startsWith('video/') ? (
                          <Video className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Image className="w-3 h-3 text-green-600 flex-shrink-0" />
                        )}
                        <span className="text-gray-600 dark:text-gray-400 truncate">{file.name}</span>
                        <button
                          onClick={() => {
                            const newFiles = [...selectedFiles];
                            newFiles.splice(index, 1);
                            setSelectedFiles(newFiles);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                          data-testid={`button-remove-file-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  {/* Creator Selection - Required */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Wer lädt die Dateien hoch? *</label>
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
                    <span>{selectedFiles.length} Datei{selectedFiles.length !== 1 ? 'en' : ''} teilen</span>
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