'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ArrowRight, MapPin } from 'lucide-react'

const destinations = [
  {
    id: 1,
    name: 'Bali, Indonesia',
    slug: 'bali',
    description: 'Mystical rice terraces and ancient temples',
    image: 'https://images.unsplash.com/photo-1639020124170-e071a2301909?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxMHx8cmljZSUyMHRlcnJhY2VzJTIwdHJvcGljYWwlMjBiYWxpJTIwZ3JlZW4lMjBmaWVsZHN8ZW58MHwwfHxncmVlbnwxNzU4ODU5MjU5fDA&ixlib=rb-4.1.0&q=85',
    attribution: 'Alexey Demidov on Unsplash',
    experiences: ['Temple Hopping', 'Rice Terrace Trek', 'Sunset Yoga'],
    className: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 2,
    name: 'Tokyo, Japan',
    slug: 'tokyo',
    description: 'Neon-lit streets and timeless traditions',
    image: 'https://images.unsplash.com/photo-1658972687498-99cd1b6bb8ab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHx0b2t5byUyMGNpdHlzY2FwZSUyMG5lb24lMjBsaWdodHMlMjBza3lzY3JhcGVyc3xlbnwwfDB8fGJsdWV8MTc1ODg1OTI1OXww&ixlib=rb-4.1.0&q=85',
    attribution: 'Jezael Melgoza on Unsplash',
    experiences: ['Street Food Tour', 'Cherry Blossom', 'Tech Districts'],
    className: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 3,
    name: 'Iceland',
    slug: 'lofoten-islands', // Using closest match from our location data
    description: 'Northern lights and volcanic wonders',
    image: 'https://images.unsplash.com/photo-1583860894521-ed1984e36494?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMGljZWxhbmQlMjBzbm93fGVufDB8MHx8cHVycGxlfDE3NTg4NTkyNTl8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'ian kelsall on Unsplash',
    experiences: ['Aurora Hunting', 'Glacier Hiking', 'Hot Springs'],
    className: 'md:col-span-1 md:row-span-1'
  }
]

export function FeaturedDestinations() {
  return (
    <section className="section-spacing px-6 bg-elegant">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
            Featured
            <span className="text-gradient-elegant block font-normal">Destinations</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Discover breathtaking locations that have captured our hearts and cameras
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr">
          {destinations.map((destination, index) => (
            <Link
              key={destination.id}
              href={`/locations/${destination.slug}`}
              className={`group block ${destination.className} scroll-reveal`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <Card className="relative overflow-hidden rounded-2xl luxury-card h-full">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${destination.image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Premium Glassmorphism Overlay */}
              <div className="absolute inset-0 glass-premium opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="mb-4">
                  <div className="flex items-center text-white/80 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Destination</span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                    {destination.name}
                  </h3>
                  <p className="text-white/90 text-lg mb-6">
                    {destination.description}
                  </p>
                </div>

                {/* Enhanced Experiences Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {destination.experiences.map((experience, tagIndex) => (
                    <span 
                      key={experience}
                      className="px-3 py-1 glass-premium rounded-full text-white text-sm font-light transform hover:scale-105 transition-all duration-300"
                      style={{ animationDelay: `${tagIndex * 0.1}s` }}
                    >
                      {experience}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="flex items-center text-white font-medium group-hover:text-rose-300 transition-colors duration-400">
                  Explore Journey
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-400" />
                </div>
              </div>

              {/* Enhanced Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-rose-300/50 transition-all duration-500" />

              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-rose-500/10 to-transparent" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}