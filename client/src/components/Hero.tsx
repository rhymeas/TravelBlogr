import { useState, useEffect } from "react";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourSettings } from "@shared/schema";

interface HeroProps {
  tourSettings?: TourSettings;
}

const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Penticton Wine Country",
    description: "Naramata Bench Weinberge über dem Okanagan Lake"
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Jasper National Park",
    description: "Maligne Lake mit der berühmten Spirit Island"
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Golden Rocky Mountains",
    description: "Kicking Horse River zwischen majestätischen Gipfeln"
  },
  {
    url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Vernon - Kalamalka Lake",
    description: "Das türkisfarbene Juwel des Okanagan Valley"
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Wells Gray Provincial Park",
    description: "Helmcken Falls - 141 Meter spektakulärer Wasserfall"
  },
  {
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    location: "Sunshine Coast",
    description: "Powell River & Desolation Sound Marine Park"
  }
];

export default function Hero({ tourSettings }: HeroProps) {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <section className="min-h-screen relative overflow-hidden pt-16" data-testid="hero-section">
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
                backgroundImage: `url('${index === 0 && tourSettings?.heroImageUrl ? tourSettings.heroImageUrl : image.url}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              className="w-full h-full"
            ></div>
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
        data-testid="hero-prev-button"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
        data-testid="hero-next-button"
      >
        <ArrowRight className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex items-center justify-center min-h-screen">
        <div className="animate-fade-in">
          <div className="mb-4">
            <span className="inline-block bg-primary/20 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
              {heroImages[currentImage].location}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6" data-testid="hero-title">
            <span className="block">
              {tourSettings?.tourName?.split(' ').slice(0, -1).join(' ') || 'Weinberg'}
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl font-light text-primary">
              {tourSettings?.tourName?.split(' ').slice(-1)[0] || 'Tour 2025'}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto font-light" data-testid="hero-description">
            {tourSettings?.description || 'Reiseführer für das kanadische Weinland-Abenteuer durch British Columbia'}
          </p>
          <p className="text-lg text-white/70 mb-8" data-testid="hero-location-description">
            {heroImages[currentImage].description}
          </p>
          <div className="flex flex-col gap-6 justify-center items-center">
            <Button
              onClick={scrollToTimeline}
              className="bg-primary text-white px-10 py-4 text-lg font-semibold hover:bg-primary/90 transition-all shadow-xl backdrop-blur-sm border border-white/10"
              data-testid="hero-cta-button"
            >
              Reiseplan ansehen
            </Button>
            <div className="text-white text-xl font-bold bg-primary/20 px-8 py-4 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg" data-testid="hero-dates">
              {tourSettings?.startDate || '20. September'} - {tourSettings?.endDate || '6. Oktober 2025'}
            </div>
          </div>
        </div>
      </div>

      {/* Image Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2" data-testid="hero-indicators">
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
        
      {/* Animated scroll indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-float z-20" data-testid="scroll-indicator">
        <ChevronDown className="w-8 h-8 text-white/80" />
      </div>
    </section>
  );
}
