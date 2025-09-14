import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Link, AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  testId?: string;
  required?: boolean;
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
  required = false
}: ImageInputProps) {
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
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
    if (!value || activeTab !== "url") return;
    
    const timeoutId = setTimeout(() => {
      validateImageUrl(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, activeTab]);

  // Handle upload completion
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
        onChange(data.publicURL || uploadUrl);
        setActiveTab("url"); // Switch to URL tab to show the result
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        onChange(uploadUrl); // Fallback to direct URL
        setActiveTab("url");
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
    <div className={`space-y-3 ${className}`} data-testid={testId}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "upload")} className="w-full">
        <TabsList className="grid w-full grid-cols-2" data-testid={`${testId}-tabs`}>
          <TabsTrigger value="url" className="flex items-center gap-2" data-testid={`${testId}-tab-url`}>
            <Link className="w-4 h-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2" data-testid={`${testId}-tab-upload`}>
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3" data-testid={`${testId}-url-content`}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                value={value}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={placeholder}
                data-testid={`${testId}-url-input`}
              />
            </div>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
                data-testid={`${testId}-clear-button`}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
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
        </TabsContent>

        <TabsContent value="upload" data-testid={`${testId}-upload-content`}>
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={getUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full"
          >
            <div className="flex items-center gap-2" data-testid={`${testId}-upload-button`}>
              <Upload className="w-4 h-4" />
              Bild hochladen
            </div>
          </ObjectUploader>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {value && !imageValidation.isValidating && (
        <Card className="overflow-hidden" data-testid={`${testId}-preview-card`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid={`${testId}-preview-filename`}>
                  {value.split('/').pop() || 'Unbenannt'}
                </p>
                <div className="flex items-center gap-2 mt-1">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}