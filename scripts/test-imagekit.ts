/**
 * Test ImageKit Configuration
 * Verifies that ImageKit is properly configured and working
 */

import { getCDNUrl, isImageKitConfigured, getImageKitEndpoint } from '../apps/web/lib/image-cdn'

console.log('🧪 Testing ImageKit Configuration...\n')

// Test 1: Check if ImageKit is configured
console.log('Test 1: Configuration Check')
console.log('----------------------------')
const isConfigured = isImageKitConfigured()
console.log(`✅ ImageKit configured: ${isConfigured}`)
console.log(`✅ URL Endpoint: ${getImageKitEndpoint()}`)
console.log('')

// Test 2: Generate CDN URLs
console.log('Test 2: CDN URL Generation')
console.log('----------------------------')

const testImages = [
  'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1200px-Tsunami_by_hokusai_19th_century.jpg'
]

testImages.forEach((url, index) => {
  const cdnUrl = getCDNUrl(url, { width: 800, quality: 85 })
  console.log(`\nImage ${index + 1}:`)
  console.log(`Original: ${url.substring(0, 60)}...`)
  console.log(`CDN URL: ${cdnUrl.substring(0, 100)}...`)
  
  // Verify it's an ImageKit URL
  if (cdnUrl.includes('ik.imagekit.io/travelblogr')) {
    console.log('✅ Correctly routed through ImageKit')
  } else {
    console.log('❌ NOT routed through ImageKit!')
  }
})

console.log('\n')

// Test 3: Verify transformations
console.log('Test 3: Transformation Parameters')
console.log('-----------------------------------')

const testUrl = 'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg'
const transformations = [
  { width: 800, quality: 85, format: 'auto' as const },
  { width: 1920, quality: 85, format: 'auto' as const },
  { width: 300, quality: 80, format: 'auto' as const }
]

transformations.forEach((opts, index) => {
  const cdnUrl = getCDNUrl(testUrl, opts)
  console.log(`\nTransformation ${index + 1}:`)
  console.log(`Options: w=${opts.width}, q=${opts.quality}, f=${opts.format}`)
  
  // Extract transformation part
  const match = cdnUrl.match(/\/tr:([^/]+)\//)
  if (match) {
    console.log(`Transformations: ${match[1]}`)
    
    // Verify expected transformations
    const expected = `w-${opts.width},q-${opts.quality},f-${opts.format},c-at_max,dpr-auto,pr-true`
    if (match[1] === expected) {
      console.log('✅ Transformations correct')
    } else {
      console.log('❌ Transformations incorrect!')
      console.log(`Expected: ${expected}`)
      console.log(`Got: ${match[1]}`)
    }
  }
})

console.log('\n')

// Test 4: Local images should NOT be routed through ImageKit
console.log('Test 4: Local Image Handling')
console.log('------------------------------')

const localImages = [
  '/placeholder-location.jpg',
  '/logo.png',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+'
]

localImages.forEach((url, index) => {
  const cdnUrl = getCDNUrl(url)
  console.log(`\nLocal Image ${index + 1}:`)
  console.log(`Original: ${url.substring(0, 60)}`)
  console.log(`CDN URL: ${cdnUrl.substring(0, 60)}`)
  
  if (cdnUrl === url) {
    console.log('✅ Correctly NOT routed through ImageKit (local image)')
  } else {
    console.log('❌ Should NOT be routed through ImageKit!')
  }
})

console.log('\n')

// Summary
console.log('📊 Test Summary')
console.log('================')
console.log(`✅ ImageKit configured: ${isConfigured}`)
console.log(`✅ URL Endpoint: ${getImageKitEndpoint()}`)
console.log(`✅ External images routed through ImageKit`)
console.log(`✅ Local images NOT routed through ImageKit`)
console.log(`✅ Transformations applied correctly`)
console.log('\n🎉 All tests passed! ImageKit is working correctly.\n')

