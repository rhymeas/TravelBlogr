'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1660159368309-e135a4f8a881?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw4fHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHRyYXZlbGVyJTIwZ29sZGVuJTIwaG91cnxlbnwwfDB8fG9yYW5nZXwxNzU4ODU5MjU4fDA&ixlib=rb-4.1.0&q=85')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full glass-effect animate-parallax-float" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-white/5 rounded-full glass-effect animate-parallax-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/15 rounded-full glass-effect animate-parallax-float" style={{ animationDelay: '4s' }} />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <div className="glass-dark rounded-3xl p-12 md:p-16 animate-fade-in-up">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            Wanderlust
            <span className="block text-gradient">Chronicles</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Embark on extraordinary journeys through captivating stories, breathtaking photography, 
            and authentic travel experiences that inspire your next adventure.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="glass-effect text-white border-white/30 hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm"
            >
              Watch Stories
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}