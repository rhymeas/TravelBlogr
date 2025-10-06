'use client'

import { MapPin, Camera, Users, Heart } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'

const stats = [
  {
    icon: MapPin,
    value: '50+',
    label: 'Countries Explored',
    description: 'From bustling cities to remote villages'
  },
  {
    icon: Camera,
    value: '10K+',
    label: 'Photos Captured',
    description: 'Moments frozen in time'
  },
  {
    icon: Users,
    value: '25K+',
    label: 'Fellow Travelers',
    description: 'Connected through shared wanderlust'
  },
  {
    icon: Heart,
    value: '200+',
    label: 'Adventures Shared',
    description: 'Stories that inspire journeys'
  }
]

export function StatsSection() {
  return (
    <section className="section-spacing px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
              Community by
              <span className="text-gradient-elegant block font-normal">Numbers</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Every statistic represents stories shared and trips planned through our community
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 100}>
              <div className="luxury-card rounded-2xl p-8 text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                
                <div className="mb-4">
                  <div className="text-4xl font-light text-luxury mb-2">{stat.value}</div>
                  <div className="text-lg font-medium text-gray-900 mb-2">{stat.label}</div>
                  <div className="text-sm text-gray-600 font-light leading-relaxed">{stat.description}</div>
                </div>

                <div className="divider-elegant opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}