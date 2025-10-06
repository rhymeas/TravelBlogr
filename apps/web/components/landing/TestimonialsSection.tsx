'use client'

import { Star, Quote } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    location: 'San Francisco, CA',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    text: 'The storytelling is absolutely captivating. Each post transports me to these incredible destinations and makes me feel like I\'m experiencing the journey myself.',
    trip: 'Inspired my solo trip to Japan'
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    location: 'Barcelona, Spain',
    avatar: 'https://i.pravatar.cc/150?img=2',
    rating: 5,
    text: 'Beautiful photography combined with authentic insights. This blog helped me discover hidden gems in places I thought I knew well.',
    trip: 'Found secret spots in Santorini'
  },
  {
    id: 3,
    name: 'Emma Thompson',
    location: 'London, UK',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    text: 'More than just travel content - it\'s about mindful exploration and meaningful connections. The writing style is both elegant and deeply personal.',
    trip: 'Planned my mindful retreat in Bali'
  }
]

export function TestimonialsSection() {
  return (
    <section className="section-spacing px-6 bg-elegant">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Traveler
              <span className="text-gradient-elegant block font-normal">Stories</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Hear from fellow wanderers who found inspiration in our shared journeys
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={testimonial.id} delay={index * 150}>
              <div className="luxury-card rounded-2xl p-8 relative group">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                  <Quote className="h-8 w-8 text-rose-500" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 font-light leading-relaxed mb-6 italic">
                  "{testimonial.text}"
                </p>

                {/* Trip Inspiration */}
                <div className="mb-6 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100/50">
                  <p className="text-sm text-rose-700 font-medium">
                    ✨ {testimonial.trip}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={`${testimonial.name} avatar`}
                    className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-rose-100"
                    width="48"
                    height="48"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 font-light">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}