import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data } = await supabase
    .from('locations')
    .select('name, slug, region, country, featured_image, gallery_images')
    .ilike('name', '%okanagan%')

  console.log('Okanagan Locations:')
  data?.forEach((loc: any) => {
    console.log(`\n📍 ${loc.name}`)
    console.log(`   Slug: ${loc.slug}`)
    console.log(`   Region: ${loc.region}`)
    console.log(`   Country: ${loc.country}`)
    console.log(`   Featured: ${loc.featured_image}`)
    console.log(`   Gallery: ${loc.gallery_images?.length || 0} images`)
    if (loc.gallery_images?.length > 0) {
      console.log(`   First 3 gallery images:`)
      loc.gallery_images.slice(0, 3).forEach((img: string, i: number) => {
        console.log(`     ${i+1}. ${img}`)
      })
    }
  })
}

check()

