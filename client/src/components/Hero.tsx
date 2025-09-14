import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourSettings, HeroImage } from "@shared/schema";

interface HeroProps {
  tourSettings?: TourSettings;
}


export default function Hero({ tourSettings }: HeroProps) {
  const [currentImage, setCurrentImage] = useState(0);

  // Fetch hero images from database
  const { data: dbHeroImages, isLoading: heroImagesLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
  });

  // Use ONLY database images - no fallbacks
  const heroImages = dbHeroImages || [];

  useEffect(() => {
    // Only run interval if there are hero images
    if (heroImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const scrollToTimeline = () => {
    const element = document.getElementById('timeline');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Show loading state if hero images are loading
  if (heroImagesLoading) {
    return (
      <section className="h-auto md:min-h-[75vh] relative overflow-hidden pt-8 md:pt-12 flex items-center justify-center" data-testid="hero-loading">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </section>
    );
  }

  // Empty state - no hero images configured
  if (heroImages.length === 0) {
    return (
      <section className="h-auto md:min-h-[75vh] relative overflow-hidden pt-8 md:pt-12" data-testid="hero-section">
        {/* Simple gradient background for empty state */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex items-center justify-center min-h-0 md:min-h-[75vh] py-8 md:py-0">
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 md:mb-6" data-testid="hero-title">
              <span className="block">
                {tourSettings?.tourName?.split(' ').slice(0, -1).join(' ') || 'Weinberg'}
              </span>
              <span className="block text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-light text-white/80">
                {tourSettings?.tourName?.split(' ').slice(-1)[0] || 'Tour 2025'}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto font-light" data-testid="hero-description">
              {tourSettings?.description || 'Reiseführer für das kanadische Weinland-Abenteuer durch British Columbia'}
            </p>
            <div className="flex flex-col gap-6 justify-center items-center">
              <Button
                onClick={scrollToTimeline}
                className="bg-white text-primary px-8 py-3 text-base sm:text-lg font-semibold hover:bg-white/90 transition-all shadow-xl"
                data-testid="hero-cta-button"
              >
                Reiseplan ansehen
              </Button>
              <div className="text-white text-base sm:text-lg md:text-xl font-bold bg-white/20 px-6 py-3 md:px-8 md:py-4 rounded-lg backdrop-blur-sm shadow-lg" data-testid="hero-dates">
                {tourSettings?.startDate || '20. September'} - {tourSettings?.endDate || '6. Oktober 2025'}
              </div>
            </div>
          </div>
        </div>
          
        {/* Animated scroll indicator - Hidden on mobile */}
        <div className="hidden sm:block absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 animate-float z-20" data-testid="scroll-indicator">
          <ChevronDown className="w-8 h-8 text-white/80" />
        </div>
      </section>
    );
  }

  // Normal state - hero images exist
  return (
    <section className="h-auto md:min-h-[75vh] relative overflow-hidden pt-8 md:pt-12" data-testid="hero-section">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              style={{
                backgroundImage: `url('${image.imageUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              className="w-full h-full"
            ></div>
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>

      {/* Navigation Controls - Only show if more than 1 image */}
      {heroImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="hidden sm:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all items-center justify-center"
            data-testid="hero-prev-button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="hidden sm:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all items-center justify-center"
            data-testid="hero-next-button"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex items-center justify-center min-h-0 md:min-h-[75vh] py-8 md:py-0 pb-24 md:pb-0">
        <div className="animate-fade-in">
          <div className="mb-4">
            <span className="inline-block bg-primary/20 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
              {heroImages[currentImage].title}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 md:mb-6" data-testid="hero-title">
            <span className="block">
              {tourSettings?.tourName?.split(' ').slice(0, -1).join(' ') || 'Weinberg'}
            </span>
            <span className="block text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-light text-primary">
              {tourSettings?.tourName?.split(' ').slice(-1)[0] || 'Tour 2025'}
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-white/90 mb-3 md:mb-4 max-w-3xl mx-auto font-light" data-testid="hero-description">
            {tourSettings?.description || 'Reiseführer für das kanadische Weinland-Abenteuer durch British Columbia'}
          </p>
          <p className="text-sm sm:text-base md:text-lg text-white/70 mb-6 md:mb-8" data-testid="hero-location-description">
            {heroImages[currentImage].description}
          </p>
          <div className="flex flex-col gap-6 justify-center items-center">
            <Button
              onClick={scrollToTimeline}
              className="bg-primary text-white px-8 py-3 text-base sm:text-lg font-semibold hover:bg-primary/90 transition-all shadow-xl backdrop-blur-sm border border-white/10"
              data-testid="hero-cta-button"
            >
              Reiseplan ansehen
            </Button>
            <div className="text-white text-base sm:text-lg md:text-xl font-bold bg-primary/20 px-6 py-3 md:px-8 md:py-4 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg" data-testid="hero-dates">
              {tourSettings?.startDate || '20. September'} - {tourSettings?.endDate || '6. Oktober 2025'}
            </div>
          </div>
        </div>
      </div>

      {/* Image Indicators - Only show if more than 1 image */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2" data-testid="hero-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentImage ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
              }`}
              data-testid={`hero-indicator-${index}`}
            />
          ))}
        </div>
      )}
        
      {/* Animated scroll indicator - Hidden on mobile */}
      <div className="hidden sm:block absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 animate-float z-20" data-testid="scroll-indicator">
        <ChevronDown className="w-8 h-8 text-white/80" />
      </div>
    </section>
  );
}
