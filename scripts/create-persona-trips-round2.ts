/**
 * Script to create SECOND ROUND of realistic trips for team personas
 * This time we'll create trips WITHOUT blog posts, so they can be used
 * with the batch blog generation system!
 * 
 * Run with: npx tsx scripts/create-persona-trips-round2.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Trip plans for each persona - DIFFERENT trip types this time!
const tripPlans = [
  {
    // Emma Chen - Budget Backpacking (different from adventure trekking)
    personaId: '063592b9-057e-44d8-a700-69380d4d8c2c',
    personaName: 'Emma Chen',
    trip: {
      title: 'Backpacking Southeast Asia on $30 a Day',
      slug: 'southeast-asia-budget-backpacking',
      description: 'Three weeks exploring Thailand, Vietnam, and Cambodia without breaking the bank!',
      start_date: '2024-12-01',
      end_date: '2024-12-21',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
      destination: 'Southeast Asia (Thailand, Vietnam, Cambodia)',
      trip_type: 'backpacking',
      duration_days: 21,
      highlights: ['Bangkok Street Food', 'Ha Long Bay', 'Angkor Wat', 'Island Hopping', 'Night Markets'],
      location_data: {
        start: 'Bangkok, Thailand',
        end: 'Siem Reap, Cambodia',
        countries: ['Thailand', 'Vietnam', 'Cambodia'],
        regions: ['Southeast Asia']
      }
    }
  },
  {
    // Marcus Rodriguez - Wellness Retreat (different from wine/luxury)
    personaId: '7b60292f-9591-48c4-9b94-95ae32680e26',
    personaName: 'Marcus Rodriguez',
    trip: {
      title: 'Wellness and Rejuvenation in the Swiss Alps',
      slug: 'swiss-alps-wellness-retreat',
      description: 'A transformative week of spa treatments, mountain air, and mindful luxury in Switzerland.',
      start_date: '2025-01-15',
      end_date: '2025-01-22',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      destination: 'Zermatt & St. Moritz, Swiss Alps',
      trip_type: 'wellness',
      duration_days: 7,
      highlights: ['Thermal Spa', 'Alpine Yoga', 'Gourmet Wellness Cuisine', 'Mountain Meditation', 'Luxury Lodges'],
      location_data: {
        start: 'Zurich, Switzerland',
        end: 'St. Moritz, Switzerland',
        countries: ['Switzerland'],
        regions: ['Swiss Alps']
      }
    }
  },
  {
    // Yuki Tanaka - Street Photography (different from cultural temples)
    personaId: 'fc53dd48-6caf-473b-a660-2c389e8ab067',
    personaName: 'Yuki Tanaka',
    trip: {
      title: 'Capturing the Soul of Marrakech: A Photographer\'s Journey',
      slug: 'marrakech-street-photography',
      description: 'Ten days documenting the colors, chaos, and quiet moments of Morocco\'s most vibrant city.',
      start_date: '2025-02-10',
      end_date: '2025-02-20',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200',
      destination: 'Marrakech, Morocco',
      trip_type: 'photography',
      duration_days: 10,
      highlights: ['Jemaa el-Fnaa Square', 'Souk Photography', 'Riad Architecture', 'Desert Light', 'Local Portraits'],
      location_data: {
        start: 'Marrakech, Morocco',
        end: 'Marrakech, Morocco',
        countries: ['Morocco'],
        regions: ['North Africa']
      }
    }
  },
  {
    // Sophie Laurent - Educational Travel (different from beach/theme parks)
    personaId: 'c97c8945-2183-443f-8066-196fb3446cac',
    personaName: 'Sophie Laurent',
    trip: {
      title: 'Learning Adventures in London: Museums, History & Harry Potter',
      slug: 'london-educational-family-trip',
      description: 'A week of educational fun exploring London\'s museums, historical sites, and magical experiences with the kids!',
      start_date: '2025-03-15',
      end_date: '2025-03-22',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
      destination: 'London, United Kingdom',
      trip_type: 'educational',
      duration_days: 7,
      highlights: ['British Museum', 'Natural History Museum', 'Tower of London', 'Harry Potter Studio Tour', 'Science Museum'],
      location_data: {
        start: 'London, UK',
        end: 'London, UK',
        countries: ['United Kingdom'],
        regions: ['England']
      }
    }
  },
  {
    // Alex Thompson - Workation (different from pure digital nomad setup)
    personaId: '4e36a62a-be89-4d5f-a646-83790f7357fa',
    personaName: 'Alex Thompson',
    trip: {
      title: 'Workation in Bali: Balancing Code and Surf',
      slug: 'bali-workation-canggu',
      description: 'Four weeks working remotely from Bali\'s surf capital—coworking by day, waves by evening.',
      start_date: '2025-04-01',
      end_date: '2025-04-28',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
      destination: 'Canggu, Bali, Indonesia',
      trip_type: 'workation',
      duration_days: 28,
      highlights: ['Dojo Coworking', 'Daily Surf Sessions', 'Digital Nomad Meetups', 'Rice Terrace Cafes', 'Sunset Beach Work'],
      location_data: {
        start: 'Denpasar, Bali',
        end: 'Canggu, Bali',
        countries: ['Indonesia'],
        regions: ['Bali']
      }
    }
  }
]

async function createPersonaTripsRound2() {
  console.log('🌍 Creating ROUND 2 trips for batch blog generation...\n')
  console.log('📝 These trips will NOT have blog posts initially')
  console.log('✨ They will be available in /dashboard/batch for AI generation!\n')

  const createdTrips = []

  for (const plan of tripPlans) {
    console.log(`\n📝 Creating trip for ${plan.personaName}...`)
    
    try {
      // Create the trip WITHOUT blog post
      console.log('  📍 Creating trip...')
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          ...plan.trip,
          user_id: plan.personaId
        })
        .select()
        .single()

      if (tripError) {
        console.error(`  ❌ Error creating trip:`, tripError.message)
        continue
      }

      console.log(`  ✅ Trip created: ${trip.id}`)
      console.log(`  🔗 Slug: ${trip.slug}`)
      console.log(`  📦 Type: ${trip.trip_type}`)
      
      createdTrips.push({
        id: trip.id,
        title: trip.title,
        author: plan.personaName,
        type: trip.trip_type
      })

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error)
    }
  }

  console.log('\n\n🎉 Round 2 trips created!\n')
  console.log('📊 Summary:')
  createdTrips.forEach(trip => {
    console.log(`  - ${trip.author}: ${trip.title} (${trip.type})`)
  })
  
  console.log('\n✨ Next Steps:')
  console.log('  1. Go to http://localhost:3000/dashboard/batch')
  console.log('  2. You should see these 5 trips in "Available Trips"')
  console.log('  3. Select them and click "Generate Blog Posts"')
  console.log('  4. The batch system will use each persona\'s writing style!')
  console.log('\n🚀 This tests the REAL batch blog generation system!')
}

createPersonaTripsRound2().catch(console.error)

