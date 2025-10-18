/**
 * Test Script: Detour Calculation
 * 
 * Tests the detour calculation service
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { 
  calculateDetourTime, 
  isWorthTheDetour,
  filterPOIsByDetourTime,
  getWorthwhilePOIs
} from '../apps/web/lib/services/detourCalculationService'

async function testDetourCalculation() {
  console.log('\n🧪 Testing Detour Calculation Service\n')
  console.log('='.repeat(60))

  // Test route: Paris to Lyon (simplified)
  const routeGeometry = [
    [2.3522, 48.8566],  // Paris
    [2.5, 48.5],
    [3.0, 48.0],
    [3.5, 47.5],
    [4.0, 47.0],
    [4.8357, 45.7640]   // Lyon
  ]

  // Test Case 1: POI very close to route (should be quick detour)
  console.log('\n📍 Test Case 1: POI Close to Route')
  console.log('-'.repeat(60))
  
  const closePOI: [number, number] = [3.1, 48.0] // Very close to route point
  console.log(`POI coordinates: ${closePOI}`)
  
  try {
    const detourTime = await calculateDetourTime(routeGeometry, closePOI, 'driving-car')
    console.log(`✅ Detour time: ${detourTime} minutes`)
    console.log(`Worth it? ${isWorthTheDetour(detourTime) ? 'YES ✅' : 'NO ❌'}`)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test Case 2: POI far from route (should be longer detour)
  console.log('\n📍 Test Case 2: POI Far from Route')
  console.log('-'.repeat(60))
  
  const farPOI: [number, number] = [2.0, 47.0] // Further from route
  console.log(`POI coordinates: ${farPOI}`)
  
  try {
    const detourTime = await calculateDetourTime(routeGeometry, farPOI, 'driving-car')
    console.log(`✅ Detour time: ${detourTime} minutes`)
    console.log(`Worth it? ${isWorthTheDetour(detourTime) ? 'YES ✅' : 'NO ❌'}`)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test Case 3: High-rated POI (should be worth longer detour)
  console.log('\n📍 Test Case 3: High-Rated POI')
  console.log('-'.repeat(60))
  
  const highRatedPOI: [number, number] = [2.5, 47.5]
  console.log(`POI coordinates: ${highRatedPOI}`)
  console.log(`POI rating: 4.8/5`)
  
  try {
    const detourTime = await calculateDetourTime(routeGeometry, highRatedPOI, 'driving-car')
    console.log(`✅ Detour time: ${detourTime} minutes`)
    console.log(`Worth it (high rating)? ${isWorthTheDetour(detourTime, 4.8) ? 'YES ✅' : 'NO ❌'}`)
    console.log(`Worth it (low rating)? ${isWorthTheDetour(detourTime, 2.0) ? 'YES ✅' : 'NO ❌'}`)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test Case 4: Interest-matching POI
  console.log('\n📍 Test Case 4: Interest-Matching POI')
  console.log('-'.repeat(60))
  
  const interestPOI: [number, number] = [3.5, 47.0]
  const userInterests = ['food', 'culture']
  const poiKinds = 'restaurants,french_cuisine,local_food'
  
  console.log(`POI coordinates: ${interestPOI}`)
  console.log(`User interests: ${userInterests.join(', ')}`)
  console.log(`POI kinds: ${poiKinds}`)
  
  try {
    const detourTime = await calculateDetourTime(routeGeometry, interestPOI, 'driving-car')
    console.log(`✅ Detour time: ${detourTime} minutes`)
    console.log(`Worth it (with interest match)? ${isWorthTheDetour(detourTime, 3.5, userInterests, poiKinds) ? 'YES ✅' : 'NO ❌'}`)
    console.log(`Worth it (no interest match)? ${isWorthTheDetour(detourTime, 3.5, [], poiKinds) ? 'YES ✅' : 'NO ❌'}`)
  } catch (error) {
    console.error('❌ Error:', error)
  }

  // Test Case 5: Filter POIs by detour time
  console.log('\n📍 Test Case 5: Filter POIs by Detour Time')
  console.log('-'.repeat(60))
  
  const testPOIs = [
    { name: 'Quick Stop', detourTimeMinutes: 5, rating: 3.5 },
    { name: 'Medium Detour', detourTimeMinutes: 12, rating: 4.0 },
    { name: 'Long Detour', detourTimeMinutes: 25, rating: 4.5 },
    { name: 'Very Long Detour', detourTimeMinutes: 40, rating: 5.0 }
  ]
  
  console.log(`Total POIs: ${testPOIs.length}`)
  
  const filtered10 = filterPOIsByDetourTime(testPOIs, 10)
  console.log(`POIs with < 10 min detour: ${filtered10.length}`)
  filtered10.forEach(poi => console.log(`  - ${poi.name}: ${poi.detourTimeMinutes} min`))
  
  const filtered20 = filterPOIsByDetourTime(testPOIs, 20)
  console.log(`POIs with < 20 min detour: ${filtered20.length}`)
  filtered20.forEach(poi => console.log(`  - ${poi.name}: ${poi.detourTimeMinutes} min`))

  // Test Case 6: Get worthwhile POIs
  console.log('\n📍 Test Case 6: Get Worthwhile POIs')
  console.log('-'.repeat(60))
  
  const worthwhile = getWorthwhilePOIs(
    testPOIs.map(poi => ({
      ...poi,
      kinds: 'attraction,museum'
    })),
    ['culture']
  )
  
  console.log(`Worthwhile POIs: ${worthwhile.length}`)
  worthwhile.forEach(poi => console.log(`  - ${poi.name}: ${poi.detourTimeMinutes} min (rating: ${poi.rating})`))

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!\n')
  console.log('⚠️ Note: Actual detour times depend on routing API availability')
  console.log('⚠️ Some tests may fail if routing API is down or rate-limited\n')
}

// Run tests
testDetourCalculation().catch(console.error)

