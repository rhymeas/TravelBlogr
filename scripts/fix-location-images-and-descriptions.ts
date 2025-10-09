/**
 * One-time script to fix location images and descriptions
 * 
 * Fixes:
 * 1. Replace placeholder images with real location photos
 * 2. Fix Vilnius description (Lithuanian → English)
 * 3. Fix location type descriptions (city → national park, region, etc.)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Location-specific fixes with curated images and proper descriptions
const locationFixes = [
  {
    name: 'Vilnius',
    featured_image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1600&q=80',
    description: 'Vilnius is the capital and largest city of Lithuania, known for its baroque architecture, medieval Old Town, and vibrant cultural scene.',
    gallery_images: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1600&q=80',
      'https://images.unsplash.com/photo-1601397741532-f0e3c1e7c5b5?w=1600&q=80',
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1600&q=80'
    ]
  },
  {
    name: 'Banff National Park',
    featured_image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1600&q=80',
    description: 'Banff National Park is Canada\'s oldest national park, featuring stunning mountain landscapes, turquoise glacial lakes, and abundant wildlife in the Canadian Rockies.',
    gallery_images: [
      'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1600&q=80',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'
    ]
  },
  {
    name: 'Kelowna',
    featured_image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
    description: 'Kelowna is a vibrant city in British Columbia\'s Okanagan Valley, famous for its wineries, beautiful beaches on Okanagan Lake, and year-round outdoor recreation.',
    gallery_images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'
    ]
  },
  {
    name: 'Squamish',
    featured_image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1600&q=80',
    description: 'Squamish is an outdoor adventure hub in British Columbia, known for world-class rock climbing, mountain biking, and stunning views of the Stawamus Chief mountain.',
    gallery_images: [
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80'
    ]
  },
  {
    name: 'Sechelt',
    featured_image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
    description: 'Sechelt is a charming coastal town on British Columbia\'s Sunshine Coast, offering beautiful beaches, arts and culture, and access to pristine wilderness.',
    gallery_images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80'
    ]
  },
  {
    name: 'Regional District of Central Okanagan',
    featured_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    description: 'The Regional District of Central Okanagan encompasses the beautiful Okanagan Valley region in British Columbia, known for its wine country, lakes, and mountain scenery.',
    gallery_images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'
    ]
  },
  {
    name: 'Sunshine Coast Regional',
    featured_image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
    description: 'The Sunshine Coast is a stunning coastal region in Queensland, Australia, featuring pristine beaches, lush hinterland, and a relaxed lifestyle.',
    gallery_images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'
    ]
  }
]

async function fixLocations() {
  console.log('🔧 Starting location fixes...\n')

  for (const fix of locationFixes) {
    console.log(`📍 Fixing: ${fix.name}`)

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          featured_image: fix.featured_image,
          description: fix.description,
          gallery_images: fix.gallery_images,
          updated_at: new Date().toISOString()
        })
        .eq('name', fix.name)

      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
      } else {
        console.log(`  ✅ Updated successfully`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error: any) {
      console.error(`  ❌ Exception: ${error.message}`)
    }
  }

  console.log('\n✅ All fixes complete!')
}

// Run the script
fixLocations().catch(console.error)

