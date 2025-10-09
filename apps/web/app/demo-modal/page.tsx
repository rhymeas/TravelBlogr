'use client'

/**
 * Demo page to showcase the new modern glassmorphism modal
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { planModalV2 } from '@/components/plan/planModalV2'

// Mock plan data
const mockplan = {
  title: 'European Adventure: Paris to Rome',
  summary: 'Experience the best of Europe with this carefully curated 8-day journey through iconic cities, featuring world-class museums, authentic cuisine, and unforgettable experiences.',
  createdAt: new Date().toISOString(),
  stats: {
    totalDays: 8,
    totalActivities: 15,
    totalMeals: 12,
  },
  days: [
    {
      day: 1,
      date: 'May 15, 2024',
      location: 'Paris, France',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '09:00',
          title: 'Eiffel Tower Visit',
          description: 'Start your journey at the iconic Eiffel Tower. Take the elevator to the summit for breathtaking panoramic views of Paris.',
          duration: 2,
          costEstimate: 30
        },
        {
          type: 'meal',
          time: '12:30',
          title: 'Le Petit Cler',
          description: 'Enjoy authentic French cuisine at this charming bistro near the Eiffel Tower. Try the coq au vin and crème brûlée.',
          duration: 1.5,
          costEstimate: 45
        },
        {
          type: 'activity',
          time: '15:00',
          title: 'Louvre Museum',
          description: 'Explore the world\'s largest art museum. Don\'t miss the Mona Lisa, Venus de Milo, and the Egyptian antiquities.',
          duration: 3,
          costEstimate: 20
        }
      ]
    },
    {
      day: 2,
      date: 'May 16, 2024',
      location: 'Paris, France',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '10:00',
          title: 'Montmartre & Sacré-Cœur',
          description: 'Wander through the artistic neighborhood of Montmartre and visit the stunning Sacré-Cœur Basilica.',
          duration: 2.5,
          costEstimate: 0
        },
        {
          type: 'meal',
          time: '13:00',
          title: 'La Maison Rose',
          description: 'Dine at this Instagram-famous pink café in Montmartre. Perfect for people watching and French classics.',
          duration: 1.5,
          costEstimate: 40
        },
        {
          type: 'activity',
          time: '16:00',
          title: 'Seine River Cruise',
          description: 'Relax on a scenic cruise along the Seine, passing by Notre-Dame, the Louvre, and other landmarks.',
          duration: 1.5,
          costEstimate: 25
        }
      ]
    },
    {
      day: 3,
      date: 'May 17, 2024',
      location: 'Venice, Italy',
      type: 'travel',
      items: [
        {
          type: 'travel',
          time: '08:00',
          title: 'Train to Venice',
          description: 'High-speed train from Paris to Venice. Enjoy the scenic journey through the Alps.',
          duration: 7,
          costEstimate: 120
        },
        {
          type: 'activity',
          time: '17:00',
          title: 'St. Mark\'s Square',
          description: 'Arrive in Venice and explore the magnificent St. Mark\'s Square and Basilica.',
          duration: 2,
          costEstimate: 15
        }
      ]
    },
    {
      day: 4,
      date: 'May 18, 2024',
      location: 'Venice, Italy',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '09:00',
          title: 'Gondola Ride',
          description: 'Experience Venice from the water with a traditional gondola ride through the canals.',
          duration: 1,
          costEstimate: 80
        },
        {
          type: 'activity',
          time: '11:00',
          title: 'Doge\'s Palace',
          description: 'Tour the stunning Gothic palace and cross the famous Bridge of Sighs.',
          duration: 2,
          costEstimate: 25
        },
        {
          type: 'meal',
          time: '14:00',
          title: 'Osteria alle Testiere',
          description: 'Savor fresh seafood at this intimate Venetian restaurant. Reservations essential.',
          duration: 2,
          costEstimate: 60
        }
      ]
    },
    {
      day: 5,
      date: 'May 19, 2024',
      location: 'Rome, Italy',
      type: 'travel',
      items: [
        {
          type: 'travel',
          time: '10:00',
          title: 'Train to Rome',
          description: 'High-speed train from Venice to Rome through the Italian countryside.',
          duration: 4,
          costEstimate: 50
        },
        {
          type: 'activity',
          time: '16:00',
          title: 'Trevi Fountain',
          description: 'Visit the iconic Baroque fountain and toss a coin to ensure your return to Rome.',
          duration: 1,
          costEstimate: 0
        }
      ]
    },
    {
      day: 6,
      date: 'May 20, 2024',
      location: 'Rome, Italy',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '08:00',
          title: 'Colosseum & Roman Forum',
          description: 'Explore ancient Rome with a guided tour of the Colosseum and Roman Forum.',
          duration: 3.5,
          costEstimate: 40
        },
        {
          type: 'meal',
          time: '13:00',
          title: 'Trattoria Da Enzo',
          description: 'Authentic Roman cuisine in Trastevere. Try the carbonara and cacio e pepe.',
          duration: 1.5,
          costEstimate: 35
        },
        {
          type: 'activity',
          time: '16:00',
          title: 'Vatican Museums & Sistine Chapel',
          description: 'Marvel at Michelangelo\'s masterpiece and the vast Vatican art collection.',
          duration: 3,
          costEstimate: 35
        }
      ]
    },
    {
      day: 7,
      date: 'May 21, 2024',
      location: 'Rome, Italy',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '10:00',
          title: 'Pantheon',
          description: 'Visit the best-preserved ancient Roman building with its magnificent dome.',
          duration: 1,
          costEstimate: 0
        },
        {
          type: 'activity',
          time: '12:00',
          title: 'Spanish Steps & Via Condotti',
          description: 'Climb the famous Spanish Steps and explore the luxury shopping district.',
          duration: 2,
          costEstimate: 0
        },
        {
          type: 'meal',
          time: '19:00',
          title: 'La Pergola',
          description: 'Celebrate your final night with fine dining at Rome\'s only 3-Michelin-star restaurant.',
          duration: 3,
          costEstimate: 200
        }
      ]
    },
    {
      day: 8,
      date: 'May 22, 2024',
      location: 'Rome, Italy',
      type: 'activity',
      items: [
        {
          type: 'activity',
          time: '09:00',
          title: 'Villa Borghese Gardens',
          description: 'Spend your last morning strolling through Rome\'s beautiful gardens and art gallery.',
          duration: 2,
          costEstimate: 15
        },
        {
          type: 'meal',
          time: '12:00',
          title: 'Farewell Lunch',
          description: 'One last Italian meal before departure. Enjoy pizza al taglio and gelato.',
          duration: 1,
          costEstimate: 20
        }
      ]
    }
  ],
  tips: [
    'Book museum tickets online in advance to skip long queues, especially for the Louvre and Vatican.',
    'Consider getting a Paris Museum Pass for unlimited access to 60+ museums and monuments.',
    'In Venice, avoid tourist trap restaurants near St. Mark\'s Square. Walk 10 minutes away for better value.',
    'Download offline maps for each city to navigate without using data.',
    'Bring comfortable walking shoes - you\'ll be walking 15,000+ steps per day!',
    'Learn basic phrases in French and Italian - locals appreciate the effort.',
    'Visit popular attractions early morning or late afternoon to avoid crowds.'
  ]
}

export default function DemoModalPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Modern Glassmorphism Modal
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            A sleek, minimalistic redesign of the trip planning modal
          </p>
          <p className="text-sm text-gray-500">
            Featuring glassmorphism effects, smooth animations, and progressive disclosure
          </p>
        </div>

        <div className="glass-premium rounded-3xl p-12 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ✨ Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🎨 Modern Design</h3>
              <p className="text-sm text-gray-600">Glassmorphism effects with frosted glass aesthetics</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">⚡ Smooth Animations</h3>
              <p className="text-sm text-gray-600">Framer Motion powered transitions and micro-interactions</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">📱 Responsive</h3>
              <p className="text-sm text-gray-600">Optimized for all screen sizes and devices</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🎯 Progressive Disclosure</h3>
              <p className="text-sm text-gray-600">Show essentials first, details on demand</p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-lg px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
        >
          🚀 Launch Modal Demo
        </Button>

        <div className="mt-8 text-sm text-gray-500">
          <p>Branch: <code className="bg-white/50 px-2 py-1 rounded">feature/modern-modal-redesign</code></p>
        </div>
      </div>

      {showModal && (
        <planModalV2
          plan={mockplan}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}