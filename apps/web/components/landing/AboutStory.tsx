'use client'

import { Button } from '@/components/ui/Button'
import { Camera, Heart, Compass } from 'lucide-react'

export function AboutStory() {
  return (
    <section className="section-spacing px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <div className="scroll-reveal">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 rounded-full text-sm font-medium mb-6 glass-premium border border-rose-200/50">
                About the Journey
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight tracking-tight">
                Every Story Shared
                <span className="text-gradient-elegant block font-normal">Inspires a Journey</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                Travel becomes more meaningful when we share it forward. Your story about discovering that 'Penticton means a place to stay forever' doesn't just preserve your memory—it enriches someone else's future journey. This is how we build a community where every trip shared makes the next trip better.
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Share Stories That Help</h3>
                  <p className="text-gray-600 font-light">Your detailed experiences provide real planning value—from accommodation reviews to restaurant recommendations and cultural insights.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Plan with Confidence</h3>
                  <p className="text-gray-600 font-light">Use authentic community stories instead of generic guides. Follow complete journeys with real recommendations from fellow travelers.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Community Impact</h3>
                  <p className="text-gray-600 font-light">Every shared story helps others plan better trips, while their experiences guide your next adventure. Travel becomes more meaningful when shared forward.</p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-10 py-4 rounded-full font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
            >
              Join Our Community
            </Button>
          </div>

          {/* Image Side */}
          <div className="relative scroll-reveal">
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500 elegant-hover">
                <img
                  src="https://images.unsplash.com/photo-1510170312785-f2e24e37e9c3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxwaG90b2dyYXBoZXIlMjBjYW1lcmElMjB0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MHwxfHx8MTc1ODg1OTI1OXww&ixlib=rb-4.1.0&q=85"
                  alt="Travel photographer with camera capturing scenic view, adventure lifestyle, wanderlust spirit - Liam Simpson on Unsplash"
                  className="w-full h-96 object-cover"
                  width="500"
                  height="600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Enhanced Floating Stats Cards */}
              <div className="absolute -top-6 -left-6 luxury-card rounded-2xl p-4 animate-gentle-float">
                <div className="text-center">
                  <div className="text-2xl font-light text-luxury">50+</div>
                  <div className="text-sm text-gray-600 font-light">Countries</div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 luxury-card rounded-2xl p-4 animate-gentle-float" style={{ animationDelay: '2s' }}>
                <div className="text-center">
                  <div className="text-2xl font-light text-luxury">200+</div>
                  <div className="text-sm text-gray-600 font-light">Adventures</div>
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