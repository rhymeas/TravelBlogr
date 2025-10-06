/**
 * Test Image Service
 * Verifies that all image sources are working correctly
 */

import { fetchLocationImage, fetchLocationGallery } from '../apps/web/lib/services/robustImageService'

async function testImageService() {
  console.log('🧪 Testing Image Service...\n')

  const testLocations = [
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  ]

  for (const location of testLocations) {
    console.log(`\n📍 Testing: ${location.name}`)
    console.log('─'.repeat(50))

    // Test featured image
    console.log('\n1️⃣ Fetching featured image...')
    const featuredImage = await fetchLocationImage(
      location.name,
      undefined,
      location.lat,
      location.lng
    )
    console.log(`   Result: ${featuredImage}`)

    // Test gallery images
    console.log('\n2️⃣ Fetching gallery (5 images)...')
    const gallery = await fetchLocationGallery(location.name, 5)
    gallery.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img}`)
    })

    console.log('\n✅ Test complete for', location.name)
  }

  console.log('\n\n🎉 All tests complete!')
}

// Run tests
testImageService().catch(console.error)

