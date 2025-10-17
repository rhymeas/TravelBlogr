'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

// ✅ Self-hosted videos on Supabase - Fast & Reliable!
// Videos uploaded to: https://supabase.com/dashboard/project/nchhcxokrzabbkvhzsor/storage/buckets/images/uploads
const HERO_VIDEOS = [
  {
    id: 'caribbean',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/4135118-sd_960_540_30fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/4135118/pexels-photo-4135118.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/4135118/pexels-photo-4135118.jpeg?auto=compress&cs=tinysrgb&w=1260',
    credit: 'Taryn Elliott',
    theme: 'tropical'
  },
  {
    id: 'city',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/2282013-sd_640_338_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/2282013/pexels-photo-2282013.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/2282013/pexels-photo-2282013.jpeg?auto=compress&cs=tinysrgb&w=1260',
    credit: 'Kelly',
    theme: 'urban'
  },
  {
    id: 'snow',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/1858244-sd_640_338_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/1858244/pexels-photo-1858244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/1858244/pexels-photo-1858244.jpeg?auto=compress&cs=tinysrgb&w=1260',
    credit: 'Taryn Elliott',
    theme: 'winter'
  },
  {
    id: 'desert',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/2055060-sd_640_268_25fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/2055060/pexels-photo-2055060.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/2055060/pexels-photo-2055060.jpeg?auto=compress&cs=tinysrgb&w=1260',
    credit: 'Taryn Elliott',
    theme: 'desert'
  },
  {
    id: 'nature',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/14190583_960_540_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/14190583/pexels-photo-14190583.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/14190583/pexels-photo-14190583.jpeg?auto=compress&cs=tinysrgb&w=1260',
    credit: 'Pexels',
    theme: 'nature'
  }
]

export function VideoHero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})

  // Rotate videos every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
      setIsVideoLoaded(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Handle video errors - fallback to image
  const handleVideoError = (videoId: string) => {
    console.warn(`Video failed to load: ${videoId}, falling back to image`)
    setVideoErrors(prev => ({ ...prev, [videoId]: true }))
  }

  const currentVideo = HERO_VIDEOS[currentVideoIndex]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        {HERO_VIDEOS.map((video, index) => (
          <div
            key={video.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Show fallback image if video failed to load */}
            {videoErrors[video.id] ? (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${video.fallbackImage || video.poster})` }}
              />
            ) : (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={video.poster}
                className="w-full h-full object-cover"
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => handleVideoError(video.id)}
                preload={index === 0 ? 'auto' : 'metadata'}
              >
                <source src={video.url} type="video/mp4" />
              </video>
            )}
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Video Credit */}
      <div className="absolute bottom-4 right-4 z-20 text-white/60 text-xs flex items-center gap-1">
        <span>Video by</span>
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/80 transition-colors underline"
        >
          {currentVideo.credit}
        </a>
        <span>on Pexels</span>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full glass-premium animate-gentle-float" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-white/5 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/15 rounded-full glass-premium animate-gentle-float" style={{ animationDelay: '4s' }} />

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

      {/* Video Navigation Dots */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {HERO_VIDEOS.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentVideoIndex(index)
              setIsVideoLoaded(false)
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentVideoIndex
                ? 'bg-white w-8'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

