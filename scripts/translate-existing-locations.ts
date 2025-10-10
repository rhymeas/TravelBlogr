/**
 * Script to translate existing location names
 * Updates locations with non-Latin names to include English translations
 */

import { createClient } from '@supabase/supabase-js'
import { translateLocationName, hasNonLatinCharacters, getDisplayName } from '../apps/web/lib/services/translationService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function translateExistingLocations() {
  console.log('🌐 Starting translation of existing locations...\n')

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, slug, name, country, region')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let translatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const location of locations) {
    // Check if name needs translation
    if (!hasNonLatinCharacters(location.name)) {
      console.log(`⏭️  Skipping ${location.name} (already in Latin script)`)
      skippedCount++
      continue
    }

    console.log(`\n🌐 Translating: ${location.name}`)

    try {
      // Translate the name
      const translationResult = await translateLocationName(location.name)
      
      if (!translationResult.needsTranslation) {
        console.log(`   ⏭️  No translation needed`)
        skippedCount++
        continue
      }

      const displayName = getDisplayName(translationResult.original, translationResult.translated)
      const newSlug = generateSlug(translationResult.translated)

      console.log(`   ✅ Translated: ${displayName}`)
      console.log(`   🔗 New slug: ${newSlug}`)

      // Update the location with both name and slug
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          name: displayName,
          slug: newSlug,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError.message)
        errorCount++
      } else {
        console.log(`   💾 Updated in database`)
        translatedCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error')
      errorCount++
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Translated: ${translatedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📍 Total: ${locations.length}`)
}

// Run the script
translateExistingLocations()
  .then(() => {
    console.log('\n✅ Translation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

