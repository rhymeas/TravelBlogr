/**
 * Script to fix location slugs
 * Updates locations with non-Latin slugs to use English slugs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Check if slug contains non-Latin characters or is empty
 */
function needsSlugFix(slug: string): boolean {
  if (!slug || slug.trim() === '') return true
  // Check if slug contains non-Latin characters
  return /[^\x00-\x7F]/.test(slug)
}

async function fixLocationSlugs() {
  console.log('🔧 Starting slug fix...\n')

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, slug, name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let fixedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const location of locations) {
    // Check if slug needs fixing
    if (!needsSlugFix(location.slug)) {
      console.log(`⏭️  Skipping ${location.name} (slug: ${location.slug})`)
      skippedCount++
      continue
    }

    console.log(`\n🔧 Fixing slug for: ${location.name}`)
    console.log(`   Old slug: "${location.slug}"`)

    try {
      // Generate new slug from name
      const newSlug = generateSlug(location.name)
      
      console.log(`   New slug: "${newSlug}"`)

      // Update the location
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          slug: newSlug,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError.message)
        errorCount++
      } else {
        console.log(`   ✅ Updated in database`)
        fixedCount++
      }

    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error')
      errorCount++
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Fixed: ${fixedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📍 Total: ${locations.length}`)
}

// Run the script
fixLocationSlugs()
  .then(() => {
    console.log('\n✅ Slug fix complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

