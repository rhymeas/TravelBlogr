'use client'

import { Card } from '@/components/ui/Card'
import { ArrowRight, MapPin } from 'lucide-react'

const destinations = [
  {
    id: 1,
    name: 'Bali, Indonesia',
    description: 'Mystical rice terraces and ancient temples',
    image: 'https://images.unsplash.com/photo-1639020124170-e071a2301909?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxMHx8cmljZSUyMHRlcnJhY2VzJTIwdHJvcGljYWwlMjBiYWxpJTIwZ3JlZW4lMjBmaWVsZHN8ZW58MHwwfHxncmVlbnwxNzU4ODU5MjU5fDA&ixlib=rb-4.1.0&q=85',
    attribution: 'Alexey Demidov on Unsplash',
    experiences: ['Temple Hopping', 'Rice Terrace Trek', 'Sunset Yoga'],
    className: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 2,
    name: 'Tokyo, Japan',
    description: 'Neon-lit streets and timeless traditions',
    image: 'https://images.unsplash.com/photo-1658972687498-99cd1b6bb8ab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHx0b2t5byUyMGNpdHlzY2FwZSUyMG5lb24lMjBsaWdodHMlMjBza3lzY3JhcGVyc3xlbnwwfDB8fGJsdWV8MTc1ODg1OTI1OXww&ixlib=rb-4.1.0&q=85',
    attribution: 'Jezael Melgoza on Unsplash',
    experiences: ['Street Food Tour', 'Cherry Blossom', 'Tech Districts'],
    className: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 3,
    name: 'Iceland',
    description: 'Northern lights and volcanic wonders',
    image: 'https://images.unsplash.com/photo-1583860894521-ed1984e36494?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyMGxpZ2h0cyUyMGF1cm9yYSUyMGljZWxhbmQlMjBzbm93fGVufDB8MHx8cHVycGxlfDE3NTg4NTkyNTl8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'ian kelsall on Unsplash',
    experiences: ['Aurora Hunting', 'Glacier Hiking', 'Hot Springs'],
    className: 'md:col-span-1 md:row-span-1'
  }
]

export function FeaturedDestinations() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Featured
            <span className="text-gradient block">Destinations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover breathtaking locations that have captured our hearts and cameras
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr">
          {destinations.map((destination, index) => (
            <Card 
              key={destination.id}
              className={`group relative overflow-hidden rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${destination.className} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${destination.image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 glass-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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

                {/* Experiences Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {destination.experiences.map((experience) => (
                    <span 
                      key={experience}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium"
                    >
                      {experience}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <button className="flex items-center text-white font-semibold group-hover:text-blue-300 transition-colors duration-300">
                  Explore Journey
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/30 transition-colors duration-300" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}