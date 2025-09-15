import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightboxImage {
  id: string;
  imageUrl: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Lightbox({ 
  images, 
  currentIndex, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious 
}: LightboxProps) {
  const [imageLoading, setImageLoading] = useState(true);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      // Prevent body scrolling when lightbox is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onNext, onPrevious]);

  // Reset loading state when image changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 p-3"
        onClick={onClose}
        data-testid="lightbox-close"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
          <span data-testid="lightbox-counter">
            {currentIndex + 1} von {images.length}
          </span>
        </div>
      )}

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <>
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 p-4"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            disabled={currentIndex === 0}
            data-testid="lightbox-previous"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 p-4"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={currentIndex === images.length - 1}
            data-testid="lightbox-next"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Main Image Container */}
      <div 
        className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading State */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Image */}
        <img
          src={currentImage.imageUrl}
          alt={currentImage.caption || `Bild ${currentIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
          data-testid="lightbox-image"
        />

        {/* Caption */}
        {currentImage.caption && !imageLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-white text-center font-medium text-lg" data-testid="lightbox-caption">
              {currentImage.caption}
            </p>
          </div>
        )}
      </div>

      {/* Touch/Swipe Areas for Mobile */}
      {hasMultipleImages && (
        <>
          {/* Left touch area for previous */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-20 md:w-32 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (currentIndex > 0) onPrevious();
            }}
            data-testid="lightbox-touch-previous"
          />
          
          {/* Right touch area for next */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-20 md:w-32 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (currentIndex < images.length - 1) onNext();
            }}
            data-testid="lightbox-touch-next"
          />
        </>
      )}
    </div>
  );
}