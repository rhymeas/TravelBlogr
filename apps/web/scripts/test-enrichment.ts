/**
 * Test Blog Post Enrichment
 *
 * Simple script to test the enrichment service directly
 * without going through the full batch generation.
 *
 * Usage:
 * npx tsx scripts/test-enrichment.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { enrichBlogPostDays } from '../lib/services/blogEnrichmentService'

// Sample blog post days (like what GROQ would generate)
const sampleDays = [
  {
    day_number: 1,
    title: "Arrival in Rome",
    description: "Arrive in Rome and explore the historic city center. Visit the Colosseum and Roman Forum.",
    activities: [
      "Visit the Colosseum",
      "Explore the Roman Forum",
      "Walk through the historic center"
    ],
    tips: "Book Colosseum tickets in advance to skip the lines.",
    location: {
      name: "Rome"
    }
  },
  {
    day_number: 2,
    title: "Vatican City",
    description: "Spend the day exploring Vatican City, including St. Peter's Basilica and the Vatican Museums.",
    activities: [
      "Visit St. Peter's Basilica",
      "Tour the Vatican Museums",
      "See the Sistine Chapel"
    ],
    tips: "Dress modestly when visiting religious sites.",
    location: {
      name: "Vatican City"
    }
  },
  {
    day_number: 3,
    title: "Trastevere & Departure",
    description: "Explore the charming Trastevere neighborhood before departing.",
    activities: [
      "Walk through Trastevere",
      "Visit Santa Maria in Trastevere",
      "Enjoy authentic Roman cuisine"
    ],
    tips: "Try the local trattorias for authentic Roman food.",
    location: {
      name: "Trastevere, Rome"
    }
  }
]

async function testEnrichment() {
  console.log('🧪 Testing Blog Post Enrichment...\n')
  console.log(`📍 Enriching ${sampleDays.length} days...\n`)

  try {
    // Test enrichment (use server client = true for script)
    const enrichedDays = await enrichBlogPostDays(sampleDays, true)

    console.log('✅ Enrichment complete!\n')

    // Display results
    enrichedDays.forEach((day, index) => {
      console.log(`📅 Day ${day.day_number}: ${day.title}`)
      console.log(`   Location: ${day.location?.name || 'Unknown'}`)
      
      // Check coordinates
      if (day.location?.coordinates) {
        console.log(`   ✅ Coordinates: ${day.location.coordinates.lat}, ${day.location.coordinates.lng}`)
      } else {
        console.log(`   ❌ No coordinates`)
      }

      // Check image
      if (day.location?.image) {
        console.log(`   ✅ Image: ${day.location.image.substring(0, 60)}...`)
      } else {
        console.log(`   ❌ No image`)
      }

      // Check POIs
      if (day.location?.pois && day.location.pois.length > 0) {
        console.log(`   ✅ POIs: ${day.location.pois.length} found`)
        day.location.pois.slice(0, 3).forEach(poi => {
          console.log(`      - ${poi.name} (${poi.category})`)
        })
        if (day.location.pois.length > 3) {
          console.log(`      ... and ${day.location.pois.length - 3} more`)
        }
      } else {
        console.log(`   ❌ No POIs`)
      }

      // Check transportation
      if (day.location?.transportation?.providers && day.location.transportation.providers.length > 0) {
        console.log(`   ✅ Transportation: ${day.location.transportation.providers.length} providers`)
        console.log(`      ${day.location.transportation.providers.join(', ')}`)
      } else {
        console.log(`   ❌ No transportation info`)
      }

      console.log('')
    })

    // Summary
    const stats = {
      totalDays: enrichedDays.length,
      withCoordinates: enrichedDays.filter(d => d.location?.coordinates).length,
      withImages: enrichedDays.filter(d => d.location?.image).length,
      withPOIs: enrichedDays.filter(d => d.location?.pois && d.location.pois.length > 0).length,
      withTransportation: enrichedDays.filter(d => d.location?.transportation?.providers && d.location.transportation.providers.length > 0).length,
      totalPOIs: enrichedDays.reduce((sum, d) => sum + (d.location?.pois?.length || 0), 0)
    }

    console.log('📊 Summary:')
    console.log(`   Total days: ${stats.totalDays}`)
    console.log(`   With coordinates: ${stats.withCoordinates}/${stats.totalDays}`)
    console.log(`   With images: ${stats.withImages}/${stats.totalDays}`)
    console.log(`   With POIs: ${stats.withPOIs}/${stats.totalDays} (${stats.totalPOIs} total POIs)`)
    console.log(`   With transportation: ${stats.withTransportation}/${stats.totalDays}`)
    console.log('')

    // Success rate
    const successRate = Math.round((stats.withImages / stats.totalDays) * 100)
    console.log(`✅ Success rate: ${successRate}%`)

    if (successRate >= 80) {
      console.log('🎉 Enrichment working great!')
    } else if (successRate >= 50) {
      console.log('⚠️  Enrichment working but could be better')
    } else {
      console.log('❌ Enrichment needs improvement')
    }

  } catch (error) {
    console.error('❌ Enrichment failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testEnrichment().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})

