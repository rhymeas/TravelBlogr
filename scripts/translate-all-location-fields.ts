/**
 * Script to translate ALL location fields (name, region, country, description)
 * Ensures complete English translation for all location data
 */

import { createClient } from '@supabase/supabase-js'
import { translateLocationName, hasNonLatinCharacters, getDisplayName } from '../apps/web/lib/services/translationService'

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

async function translateAllLocationFields() {
  console.log('🌐 Starting comprehensive translation of all location fields...\n')

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, slug, name, country, region, description')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const location of locations) {
    console.log(`\n🔍 Processing: ${location.name}`)

    let needsUpdate = false
    const updates: any = {}

    // 1. Translate NAME
    if (hasNonLatinCharacters(location.name)) {
      console.log(`   🌐 Translating name: ${location.name}`)
      const nameTranslation = await translateLocationName(location.name)
      const translatedName = getDisplayName(nameTranslation.original, nameTranslation.translated)
      const newSlug = generateSlug(nameTranslation.translated)
      
      console.log(`      → ${translatedName}`)
      console.log(`      → slug: ${newSlug}`)
      
      updates.name = translatedName
      updates.slug = newSlug
      needsUpdate = true
    }

    // 2. Translate REGION
    if (location.region && hasNonLatinCharacters(location.region)) {
      console.log(`   🌐 Translating region: ${location.region}`)
      const regionTranslation = await translateLocationName(location.region)
      const translatedRegion = getDisplayName(regionTranslation.original, regionTranslation.translated)
      
      console.log(`      → ${translatedRegion}`)
      
      updates.region = translatedRegion
      needsUpdate = true
    }

    // 3. Translate COUNTRY
    if (location.country && hasNonLatinCharacters(location.country)) {
      console.log(`   🌐 Translating country: ${location.country}`)
      const countryTranslation = await translateLocationName(location.country)
      const translatedCountry = getDisplayName(countryTranslation.original, countryTranslation.translated)
      
      console.log(`      → ${translatedCountry}`)
      
      updates.country = translatedCountry
      needsUpdate = true
    }

    // 4. Update DESCRIPTION if it contains foreign characters
    if (location.description && hasNonLatinCharacters(location.description)) {
      console.log(`   🌐 Updating description (contains foreign text)`)
      
      // Build new description with translated fields
      const finalName = updates.name || location.name
      const finalCountry = updates.country || location.country
      const finalRegion = updates.region || location.region
      
      const newDescription = `${finalName} is a city in ${finalCountry}${finalRegion ? `, ${finalRegion}` : ''}.`
      
      console.log(`      → ${newDescription}`)
      
      updates.description = newDescription
      needsUpdate = true
    }

    // Skip if no updates needed
    if (!needsUpdate) {
      console.log(`   ⏭️  No translation needed`)
      skippedCount++
      continue
    }

    // Update the location
    try {
      updates.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', location.id)

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError.message)
        errorCount++
      } else {
        console.log(`   ✅ Updated successfully`)
        updatedCount++
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error')
      errorCount++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updatedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📍 Total: ${locations.length}`)
}

// Run the script
translateAllLocationFields()
  .then(() => {
    console.log('\n✅ Translation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

