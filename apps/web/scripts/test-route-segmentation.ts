/**
 * Test Script: Route Segmentation
 * 
 * Tests the new route segmentation service
 */

import { segmentRouteByDrivingTime, calculateOvernightStops } from '../lib/services/routeSegmentationService'

async function testRouteSegmentation() {
  console.log('\n🧪 Testing Route Segmentation Service\n')
  console.log('='.repeat(60))

  // Test Case 1: Short route (no segmentation needed)
  console.log('\n📍 Test Case 1: Short Route (Paris to Lyon, 4 hours)')
  console.log('-'.repeat(60))
  
  const shortRoute = {
    routeGeometry: [
      [2.3522, 48.8566], // Paris
      [2.5, 48.5],
      [3.0, 48.0],
      [4.0, 47.0],
      [4.8357, 45.7640]  // Lyon
    ],
    totalDistanceKm: 465,
    totalDurationHours: 4.5,
    maxDrivingHoursPerDay: 6,
    startDate: '2025-10-24',
    startTime: '09:00',
    locations: [
      { name: 'Paris', coordinates: [2.3522, 48.8566] as [number, number] },
      { name: 'Lyon', coordinates: [4.8357, 45.7640] as [number, number] }
    ]
  }

  const shortSegments = segmentRouteByDrivingTime(shortRoute)
  console.log(`✅ Segments created: ${shortSegments.length}`)
  console.log(JSON.stringify(shortSegments, null, 2))

  // Test Case 2: Long route (needs segmentation)
  console.log('\n📍 Test Case 2: Long Route (Paris to Montpellier, 7.5 hours)')
  console.log('-'.repeat(60))
  
  const longRoute = {
    routeGeometry: [
      [2.3522, 48.8566],  // Paris
      [2.5, 48.0],
      [3.0, 47.0],
      [3.5, 46.0],
      [4.0, 45.0],
      [4.5, 44.0],
      [3.8767, 43.6108]   // Montpellier
    ],
    totalDistanceKm: 750,
    totalDurationHours: 7.5,
    maxDrivingHoursPerDay: 4,
    startDate: '2025-10-24',
    startTime: '09:00',
    locations: [
      { name: 'Paris', coordinates: [2.3522, 48.8566] as [number, number] },
      { name: 'Montpellier', coordinates: [3.8767, 43.6108] as [number, number] }
    ]
  }

  const longSegments = segmentRouteByDrivingTime(longRoute)
  console.log(`✅ Segments created: ${longSegments.length}`)
  
  longSegments.forEach((segment, index) => {
    console.log(`\nSegment ${index + 1}:`)
    console.log(`  Day: ${segment.day}`)
    console.log(`  From: ${segment.startLocation.name}`)
    console.log(`  To: ${segment.endLocation.name}`)
    console.log(`  Distance: ${segment.distanceKm.toFixed(1)} km`)
    console.log(`  Duration: ${segment.drivingTimeHours.toFixed(1)} hours`)
    console.log(`  Departure: ${segment.estimatedDepartureTime}`)
    console.log(`  Arrival: ${segment.estimatedArrivalTime}`)
    console.log(`  Geometry points: ${segment.geometry.length}`)
  })

  // Test Case 3: Overnight stops
  console.log('\n📍 Test Case 3: Overnight Stops')
  console.log('-'.repeat(60))
  
  const overnightStops = calculateOvernightStops(longSegments)
  console.log(`✅ Overnight stops: ${overnightStops.length}`)
  
  overnightStops.forEach((stop, index) => {
    console.log(`\nStop ${index + 1}:`)
    console.log(`  Location: ${stop.location.name}`)
    console.log(`  Day: ${stop.day}`)
    console.log(`  Arrival: ${stop.arrivalTime}`)
    console.log(`  Departure: ${stop.departureTime}`)
    console.log(`  Stay: ${stop.stayDuration}`)
  })

  // Test Case 4: Very long route (multiple segments)
  console.log('\n📍 Test Case 4: Very Long Route (Paris to Barcelona, 10 hours)')
  console.log('-'.repeat(60))
  
  const veryLongRoute = {
    routeGeometry: Array.from({ length: 20 }, (_, i) => [
      2.3522 + (i * 0.1),
      48.8566 - (i * 0.3)
    ]),
    totalDistanceKm: 1000,
    totalDurationHours: 10,
    maxDrivingHoursPerDay: 4,
    startDate: '2025-10-24',
    startTime: '09:00',
    locations: [
      { name: 'Paris', coordinates: [2.3522, 48.8566] as [number, number] },
      { name: 'Barcelona', coordinates: [2.1734, 41.3851] as [number, number] }
    ]
  }

  const veryLongSegments = segmentRouteByDrivingTime(veryLongRoute)
  console.log(`✅ Segments created: ${veryLongSegments.length}`)
  console.log(`Expected: ${Math.ceil(10 / 4)} segments`)
  
  // Verify total distance matches
  const totalSegmentDistance = veryLongSegments.reduce((sum, seg) => sum + seg.distanceKm, 0)
  const totalSegmentDuration = veryLongSegments.reduce((sum, seg) => sum + seg.drivingTimeHours, 0)
  
  console.log(`\nVerification:`)
  console.log(`  Total distance: ${totalSegmentDistance.toFixed(1)} km (expected: ${veryLongRoute.totalDistanceKm} km)`)
  console.log(`  Total duration: ${totalSegmentDuration.toFixed(1)} hours (expected: ${veryLongRoute.totalDurationHours} hours)`)
  console.log(`  Distance match: ${Math.abs(totalSegmentDistance - veryLongRoute.totalDistanceKm) < 10 ? '✅' : '❌'}`)
  console.log(`  Duration match: ${Math.abs(totalSegmentDuration - veryLongRoute.totalDurationHours) < 0.5 ? '✅' : '❌'}`)

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!\n')
}

// Run tests
testRouteSegmentation().catch(console.error)

