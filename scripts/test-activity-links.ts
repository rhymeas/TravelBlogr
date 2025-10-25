/**
 * Test script to manually fetch activity links for Magdeburg
 * Run with: npx tsx scripts/test-activity-links.ts
 */

import { fetchActivityLink } from '../apps/web/lib/services/activityLinkService'

async function testActivityLinks() {
  const activities = [
    'Salzquelle',
    'Faunbrunnen',
    'Technikmuseum',
    'Domfelsen',
    '1. Magdeburger Friseurmuseum'
  ]

  const locationName = 'Magdeburg'
  const country = 'Germany'

  console.log('🧪 Testing Activity Link Service\n')
  console.log(`Location: ${locationName}, ${country}\n`)
  console.log('=' .repeat(80))

  for (const activityName of activities) {
    console.log(`\n🔍 Fetching link for: ${activityName}`)
    
    try {
      const result = await fetchActivityLink(activityName, locationName, country)
      
      if (result) {
        console.log(`✅ SUCCESS:`)
        console.log(`   URL: ${result.url}`)
        console.log(`   Source: ${result.source}`)
        console.log(`   Type: ${result.type}`)
        console.log(`   Confidence: ${result.confidence}`)
      } else {
        console.log(`❌ FAILED: No link found`)
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}`)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Test complete!')
}

testActivityLinks().catch(console.error)

