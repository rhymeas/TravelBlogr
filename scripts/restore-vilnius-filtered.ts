/**
 * Restore Vilnius images but filter out the problematic ones manually
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Original gallery from validation output
const originalGallery = [
  'https://upload.wikimedia.org/wikipedia/commons/6/6c/Trakai_Island.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/90/339_vilnius_Mindaugas_Tries_Time_Travel_%2822227687610%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/2f/Gates_of_Dawn_%289651321601%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/e/e1/Graf_van_Generalleutnant_A_Wegner%2C_een_Duitse_militair_op_het_oorlogskerkhof_va%2C_Bestanddeelnr_190-1268.jpg', // ❌ MILITARY
  'https://upload.wikimedia.org/wikipedia/commons/a/a3/V_Piknik_Kawaleryjski_-_Bli%C5%BCyn_-_14034707401_WWII_reenactment_reenactors_Wehrmacht_Heer_Army_of_Nazi_Germany_replicas_of_uniforms_equipment_weapons_motorcycle_Poland_forest_2014-04-27.jpg', // ❌ MILITARY
  'https://upload.wikimedia.org/wikipedia/commons/1/19/Vilnius_Landmarks_134.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/36/Vilnius_Landmarks_128.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a0/Vilnius_Landmarks_132.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/93/Vilnius_Landmarks_165.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/f/fe/Vilnius_Landmarks_95.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/59/Winter_cityscape_of_Vilnius.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/6/68/Vilnius_Gloomy_Cityscape.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/e/ef/500px_photo_%28136060211%29.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/f/fd/Vilnius_Cityscape.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/bd/Sunset_At_The_Birch_%28165409515%29.jpeg',
  'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL2Zydmlsbml1c19saXRodWFuaWFfZWFzdGVybl9ldXJvcGVfOS1pbWFnZS1reWJjZ2M3dC5qcGc.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/36/The_church_towers_in_Vilnius%2C_Architecture_%287628641746%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/b3/Tombstone_for_Leonas_Sapiega01%28js%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/27/Printing-House_Courtyard2.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/9/94/Vilnius_Gediminas_Technical_University_Faculty_of_Architecture.JPG'
]

// Filter out problematic images
const filteredGallery = originalGallery.filter(url => {
  // Remove military images (indices 3 and 4)
  if (url.includes('Graf_van_Generalleutnant') || 
      url.includes('Wehrmacht') || 
      url.includes('WWII_reenactment')) {
    console.log(`❌ Removing military image: ${url.substring(0, 80)}...`)
    return false
  }
  return true
})

// Use a good featured image
const featuredImage = 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Vilnius_Cityscape.jpg'

async function restore() {
  console.log('🔄 Restoring Vilnius with filtered images')
  console.log(`   Original: ${originalGallery.length} images`)
  console.log(`   Filtered: ${filteredGallery.length} images`)
  console.log(`   Removed: ${originalGallery.length - filteredGallery.length} military images\n`)
  
  const { error } = await supabase
    .from('locations')
    .update({
      featured_image: featuredImage,
      gallery_images: filteredGallery,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'vilnius')
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Vilnius restored successfully!')
    console.log(`   Featured: ${featuredImage}`)
    console.log(`   Gallery: ${filteredGallery.length} images`)
  }
}

restore()

