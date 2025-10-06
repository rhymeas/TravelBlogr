'use client'

import { Calendar, MapPin, Heart, Camera } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const timelineEvents = [
  {
    id: 1,
    date: '2024',
    title: 'Parisian Romance',
    location: 'Paris, France',
    description: 'Discovering the timeless elegance of the City of Light through cobblestone streets and golden hour magic',
    image: 'https://images.unsplash.com/photo-1591370879678-b1429e988558?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyJTIwc3RyZWV0JTIwcm9tYW50aWN8ZW58MHwwfHxvcmFuZ2V8MTc1ODk0NDU1Nnww&ixlib=rb-4.1.0&q=85',
    attribution: 'P.O.sitive Negative on Unsplash',
    didYouKnow: 'The Eiffel Tower was originally intended to be temporary and was almost demolished in 1909',
    accommodation: 'Boutique hotel in Le Marais district',
    highlights: ['Seine river cruise', 'Montmartre sunrise', 'Local bistro discoveries']
  },
  {
    id: 2,
    date: '2023',
    title: 'Santorini Serenity',
    location: 'Santorini, Greece',
    description: 'Immersing in the pristine beauty of white-washed villages perched on volcanic cliffs',
    image: 'https://images.unsplash.com/photo-1607282676880-c92863b908a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxzYW50b3JpbmklMjB3aGl0ZSUyMGJ1aWxkaW5ncyUyMGJsdWUlMjBkb21lcyUyMG1lZGl0ZXJyYW5lYW58ZW58MHwwfHxibHVlfDE3NTg5NDQ1NTZ8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Raimond Klavins on Unsplash',
    didYouKnow: 'Santorini\'s unique architecture was designed to withstand earthquakes and strong Aegean winds',
    accommodation: 'Cliffside cave hotel with infinity pool',
    highlights: ['Oia sunset viewing', 'Wine tasting tours', 'Traditional Greek cooking']
  },
  {
    id: 3,
    date: '2023',
    title: 'Kyoto Contemplation',
    location: 'Kyoto, Japan',
    description: 'Finding peace among ancient temples and cherry blossoms in Japan\'s cultural heart',
    image: 'https://images.unsplash.com/photo-1680362421946-03873758cd7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw4fHxreW90byUyMHRlbXBsZSUyMGNoZXJyeSUyMGJsb3Nzb21zJTIwemVuJTIwZ2FyZGVufGVufDB8MHx8fDE3NTg5NDQ1NTZ8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'INHYEOK PARK on Unsplash',
    didYouKnow: 'Kyoto has over 2,000 temples and shrines, each with centuries of spiritual significance',
    accommodation: 'Traditional ryokan with tatami rooms',
    highlights: ['Temple meditation', 'Cherry blossom season', 'Tea ceremony experience']
  }
]

export function TravelTimeline() {
  return (
    <section className="section-spacing px-6 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
            Journey
            <span className="text-gradient-elegant block font-normal">Timeline</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            A curated collection of transformative travel moments
          </p>
        </div>

        <div className="relative">
          {/* Gradient Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full timeline-line"></div>

          {timelineEvents.map((event, index) => (
            <div key={event.id} className={`relative flex items-center mb-20 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Date Badge */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-rose-200 flex items-center justify-center shadow-lg z-10">
                <Calendar className="h-6 w-6 text-rose-500" />
              </div>

              {/* Content Card */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-16' : 'pl-16'}`}>
                <Card className="luxury-card rounded-2xl overflow-hidden scroll-reveal">
                  <div className="aspect-video relative">
                    <img 
                      src={event.image} 
                      alt={`${event.title} - ${event.attribution}`} 
                      className="w-full h-full object-cover" 
                      width="500"
                      height="300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center text-rose-600 mb-3">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">{event.location}</span>
                    </div>
                    
                    <h3 className="font-display text-2xl font-normal text-gray-900 mb-4">
                      {event.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 font-light leading-relaxed">
                      {event.description}
                    </p>

                    {/* Enhanced Did You Know Box */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4 mb-6 glass-premium">
                      <div className="flex items-start">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-1 mr-3 mt-0.5 animate-gentle-float">
                          <Heart className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800 mb-1">Did you know?</p>
                          <p className="text-sm text-amber-700 font-light leading-relaxed">{event.didYouKnow}</p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Accommodation */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100/50">
                      <p className="text-sm font-medium text-rose-700 mb-2 flex items-center">
                        <Camera className="h-3 w-3 mr-2" />
                        Accommodation
                      </p>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">{event.accommodation}</p>
                    </div>

                    {/* Enhanced Highlights */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Highlights</p>
                      <div className="flex flex-wrap gap-2">
                        {event.highlights.map((highlight, highlightIndex) => (
                          <span 
                            key={highlight} 
                            className="px-3 py-1 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 rounded-full text-sm font-light transform hover:scale-105 transition-all duration-300 border border-rose-200/50"
                            style={{ animationDelay: `${highlightIndex * 0.1}s` }}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}