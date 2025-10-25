import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearActivityImages() {
  console.log('🧹 Clearing all activity image_url values...')
  
  // Clear all image_url values
  const { data, error } = await supabase
    .from('location_activity_links')
    .update({ image_url: null })
    .not('image_url', 'is', null)
    .select('id')
  
  if (error) {
    console.error('❌ Error clearing images:', error)
    process.exit(1)
  }
  
  console.log(`✅ Cleared ${data?.length || 0} activity images`)
  
  // Verify
  const { count } = await supabase
    .from('location_activity_links')
    .select('*', { count: 'exact', head: true })
    .is('image_url', null)
  
  console.log(`✅ Total activities without images: ${count}`)
  console.log('🎯 Activities will now auto-fetch images from Brave API on page load!')
}

clearActivityImages()

