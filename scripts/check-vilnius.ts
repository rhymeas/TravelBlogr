import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data } = await supabase
    .from('locations')
    .select('name, featured_image, gallery_images')
    .eq('slug', 'vilnius')
    .single()

  console.log('Vilnius Current Data:')
  console.log('Featured:', data.featured_image)
  console.log('\nGallery Images:')
  data.gallery_images.forEach((img: string, i: number) => {
    console.log(`  ${i+1}. ${img}`)
  })
}

check()

