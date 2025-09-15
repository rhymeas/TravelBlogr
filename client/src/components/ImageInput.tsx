import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Link, AlertCircle, CheckCircle, Loader2, X, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  testId?: string;
  required?: boolean;
  allowMultiple?: boolean;
  onMultipleChange?: (urls: string[]) => void;
  usePublicUpload?: boolean; // New prop to use public uploads for publicly accessible images
}

interface ImageValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error?: string;
}

export function ImageInput({ 
  label, 
  value, 
  onChange, 
  placeholder = "https://example.com/image.jpg",
  className = "",
  testId = "image-input",
  required = false,
  allowMultiple = false,
  onMultipleChange,
  usePublicUpload = false
}: ImageInputProps) {
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [showUpload, setShowUpload] = useState(false);
  const [imageValidation, setImageValidation] = useState<ImageValidationState>({
    isValidating: false,
    isValid: null,
  });
  const [previewError, setPreviewError] = useState(false);

  // Validate image URL
  const validateImageUrl = async (url: string) => {
    if (!url.trim()) {
      setImageValidation({ isValidating: false, isValid: null });
      return;
    }

    setImageValidation({ isValidating: true, isValid: null });
    
    try {
      // Check if URL is a valid image by attempting to load it
      const img = new Image();
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error("Bild kann nicht geladen werden"));
      });

      img.src = url;
      await loadPromise;
      
      setImageValidation({ isValidating: false, isValid: true });
      setPreviewError(false);
    } catch (error) {
      setImageValidation({
        isValidating: false,
        isValid: false,
        error: "Ungültige Bild-URL"
      });
      setPreviewError(true);
    }
  };

  // Debounced validation effect
  useEffect(() => {
    if (!value) return;
    
    const timeoutId = setTimeout(() => {
      validateImageUrl(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Handle upload completion
  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      if (allowMultiple && result.successful.length > 1) {
        // Handle multiple files
        try {
          const normalizedUrls = await Promise.all(
            result.successful.map(async (file: any) => {
              try {
                const response = await apiRequest("POST", "/api/objects/normalize", {
                  imageURL: file.uploadURL
                });
                const data = await response.json();
                return data.publicURL || file.uploadURL;
              } catch (error) {
                console.error("Error processing uploaded image:", error);
                return file.uploadURL; // Fallback to direct URL
              }
            })
          );
          onMultipleChange?.(normalizedUrls);
          setShowUpload(false);
          setInputMode("url");
        } catch (error) {
          console.error("Error processing multiple uploaded images:", error);
          // Fallback: use direct URLs
          const fallbackUrls = result.successful.map((file: any) => file.uploadURL);
          onMultipleChange?.(fallbackUrls);
          setShowUpload(false);
          setInputMode("url");
        }
      } else {
        // Handle single file (original behavior)
        const uploadedFile = result.successful[0];
        const uploadUrl = uploadedFile.uploadURL;
        
        try {
          // Normalize the object path and get the public URL
          const response = await apiRequest("POST", "/api/objects/normalize", {
            imageURL: uploadUrl
          });
          const data = await response.json();
          onChange(data.publicURL || uploadUrl);
          setShowUpload(false); // Close upload mode
          setInputMode("url"); // Switch to URL mode to show the result
        } catch (error) {
          console.error("Error processing uploaded image:", error);
          onChange(uploadUrl); // Fallback to direct URL
          setShowUpload(false);
          setInputMode("url");
        }
      }
    }
  };

  // Get upload parameters for ObjectUploader
  const getUploadParameters = async () => {
    const endpoint = usePublicUpload ? "/api/objects/upload-public" : "/api/objects/upload";
    const response = await apiRequest("POST", endpoint);
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUrlChange = (newValue: string) => {
    onChange(newValue);
    setPreviewError(false);
    if (newValue.trim()) {
      setImageValidation({ isValidating: true, isValid: null });
    } else {
      setImageValidation({ isValidating: false, isValid: null });
    }
  };

  const clearImage = () => {
    onChange("");
    setImageValidation({ isValidating: false, isValid: null });
    setPreviewError(false);
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid={testId}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Main Input Area */}
      {!showUpload ? (
        <div className="space-y-3">
          {/* URL Input with Upload Option */}
          <div className="relative">
            <Input
              type="url"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={placeholder}
              className="pr-24"
              data-testid={`${testId}-url-input`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={clearImage}
                  data-testid={`${testId}-clear-button`}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                onClick={() => setShowUpload(true)}
                data-testid={`${testId}-toggle-upload`}
                title="Stattdessen Datei hochladen"
              >
                <Upload className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Alternative Upload Button for better discoverability */}
          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="text-muted-foreground border-dashed"
              data-testid={`${testId}-show-upload`}
            >
              <Upload className="w-4 h-4 mr-2" />
              oder Datei hochladen
            </Button>
          </div>

          {/* Validation indicators */}
          {imageValidation.isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`${testId}-validating`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Bild wird überprüft...
            </div>
          )}
          
          {imageValidation.isValid === true && (
            <div className="flex items-center gap-2 text-sm text-green-600" data-testid={`${testId}-valid`}>
              <CheckCircle className="w-4 h-4" />
              Gültiges Bild
            </div>
          )}
          
          {imageValidation.isValid === false && (
            <div className="flex items-center gap-2 text-sm text-red-600" data-testid={`${testId}-invalid`}>
              <AlertCircle className="w-4 h-4" />
              {imageValidation.error}
            </div>
          )}
        </div>
      ) : (
        /* Upload Mode */
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-2">{allowMultiple ? "Bilder hochladen" : "Bild hochladen"}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {allowMultiple 
                    ? "Wählen Sie mehrere Bilder von Ihrem Gerät aus (max. 10 Dateien, je 10MB)"
                    : "Wählen Sie ein Bild von Ihrem Gerät aus (max. 10MB)"
                  }
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <ObjectUploader
                  maxNumberOfFiles={allowMultiple ? 10 : 1}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full max-w-xs"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {allowMultiple ? "Dateien auswählen" : "Datei auswählen"}
                </ObjectUploader>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                  data-testid={`${testId}-back-to-url`}
                  className="text-muted-foreground"
                >
                  <Link className="w-4 h-4 mr-2" />
                  oder URL eingeben
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Image Preview */}
      {value && !imageValidation.isValidating && (
        <Card className="overflow-hidden border-primary/20" data-testid={`${testId}-preview-card`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {!previewError ? (
                  <img
                    src={value}
                    alt="Vorschau"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewError(true)}
                    data-testid={`${testId}-preview-image`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium mb-1" data-testid={`${testId}-preview-filename`}>
                  Bild-Vorschau
                </p>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {value.split('/').pop() || 'Unbenannt'}
                </p>
                <div className="flex items-center gap-2">
                  {imageValidation.isValid === true && (
                    <Badge variant="secondary" className="text-xs" data-testid={`${testId}-preview-status-valid`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Gültig
                    </Badge>
                  )}
                  {imageValidation.isValid === false && (
                    <Badge variant="destructive" className="text-xs" data-testid={`${testId}-preview-status-invalid`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Fehler
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearImage}
                data-testid={`${testId}-remove-preview`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}