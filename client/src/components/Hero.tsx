import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourSettings } from "@shared/schema";

interface HeroProps {
  tourSettings?: TourSettings;
}

export default function Hero({ tourSettings }: HeroProps) {
  const scrollToTimeline = () => {
    const element = document.getElementById('timeline');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen hero-gradient flex items-center justify-center relative overflow-hidden pt-16" data-testid="hero-section">
      <div className="absolute inset-0 opacity-10">
        <div 
          style={{
            backgroundImage: `url('${tourSettings?.heroImageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="w-full h-full"
        ></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="animate-slide-up">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6" data-testid="hero-title">
            {tourSettings?.tourName?.split(' ').slice(0, -1).join(' ') || 'Weinberg'}
            <span className="block text-3xl md:text-5xl lg:text-6xl font-light">
              {tourSettings?.tourName?.split(' ').slice(-1)[0] || '2025'}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            {tourSettings?.description || 'Entdecke die atemberaubende Schönheit Kanadas - von den Weinbergen des Okanagan-Tals bis zu den majestätischen Rocky Mountains'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={scrollToTimeline}
              className="bg-white text-primary px-8 py-3 text-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
              data-testid="hero-cta-button"
            >
              Reise entdecken
            </Button>
            <div className="text-white/80 text-sm" data-testid="hero-dates">
              {tourSettings?.startDate} - {tourSettings?.endDate}
            </div>
          </div>
        </div>
        
        {/* Animated scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-soft" data-testid="scroll-indicator">
          <ChevronDown className="w-6 h-6 text-white" />
        </div>
      </div>
    </section>
  );
}
