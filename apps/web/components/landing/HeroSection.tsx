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

      {/* Enhanced Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full glass-premium animate-gentle-float" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-white/5 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/15 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-1/2 left-20 w-8 h-8 bg-rose-400/20 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '6s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-pink-400/20 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '8s' }} />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <div className="glass-premium rounded-3xl p-12 md:p-16 animate-fade-in-scale">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-tight tracking-tight">
            Share with
            <span className="block text-gradient-elegant font-normal text-shimmer">Intention</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            Curated for mindful travelers who believe every journey deserves to be 
            shared with purpose and preserved with care.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="btn-luxury flex items-center gap-2">
              <span>Start Exploring</span>
              <ArrowRight className="h-5 w-5 flex-shrink-0" />
            </button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="backdrop-blur-elegant text-white border-white/30 hover:bg-white/10 px-10 py-4 text-base font-medium rounded-full transition-all duration-300"
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