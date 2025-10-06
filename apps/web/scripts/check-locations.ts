import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('slug, name, is_published')
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n📍 Available Locations:\n')
  data?.forEach(loc => {
    console.log(`  ${loc.is_published ? '✅' : '❌'} ${loc.slug} (${loc.name})`)
  })
  console.log()
}

checkLocations()

