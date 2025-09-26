'use client'

import { Button } from '@/components/ui/Button'
import { Camera, Heart, Compass } from 'lucide-react'

export function AboutStory() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div className="animate-slide-in-left">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
                About the Journey
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Every Journey Tells a
                <span className="text-gradient block">Story</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Born from a passion for exploration and storytelling, this blog captures the essence 
                of wanderlust through authentic experiences, stunning photography, and heartfelt narratives 
                that inspire fellow travelers to embark on their own adventures.
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Storytelling</h3>
                  <p className="text-gray-600">Capturing moments that words alone cannot express through stunning photography and immersive narratives.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentic Experiences</h3>
                  <p className="text-gray-600">Sharing genuine encounters with local cultures, hidden gems, and transformative moments from the road.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspiring Adventures</h3>
                  <p className="text-gray-600">Providing practical insights and emotional inspiration to help you plan your own unforgettable journeys.</p>
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Read My Story
            </Button>
          </div>

          {/* Image Side */}
          <div className="relative animate-slide-in-right">
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1510170312785-f2e24e37e9c3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxwaG90b2dyYXBoZXIlMjBjYW1lcmElMjB0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MHwxfHx8MTc1ODg1OTI1OXww&ixlib=rb-4.1.0&q=85"
                  alt="Travel photographer with camera capturing scenic view, adventure lifestyle, wanderlust spirit - Liam Simpson on Unsplash"
                  className="w-full h-96 object-cover"
                  width="500"
                  height="600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -top-6 -left-6 glass-effect rounded-2xl p-4 animate-parallax-float">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 glass-effect rounded-2xl p-4 animate-parallax-float" style={{ animationDelay: '2s' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">200+</div>
                  <div className="text-sm text-gray-600">Adventures</div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-1/4 -right-8 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-parallax-float" style={{ animationDelay: '4s' }} />
              <div className="absolute bottom-1/4 -left-8 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-parallax-float" style={{ animationDelay: '6s' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}