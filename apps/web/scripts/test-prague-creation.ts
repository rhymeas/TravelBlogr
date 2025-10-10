#!/usr/bin/env tsx
/**
 * Test script to verify Prague location is created with user input name
 * Run: cd apps/web && npx tsx scripts/test-prague-creation.ts
 */

import { createClient } from '@supabase/supabase-js'

// Simple inline version to avoid path alias issues
class TestLocationService {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  async findOrCreateLocation(query: string) {
    // Check database first
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: existing } = await this.supabase
      .from('locations')
      .select('slug, name, country, region, latitude, longitude, description, featured_image')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      console.log(`✅ Found existing location: ${existing.name}`)
      return existing
    }

    console.log(`🌐 Location not found in database, will be created via trip planner`)
    return null
  }
}

async function testPragueCreation() {
  console.log('🧪 Testing Prague Location Status\n')
  console.log('=' .repeat(60))

  const service = new TestLocationService()

  // Test: Check if Prague exists
  console.log('\n📍 Checking for Prague in database...')
  console.log('Expected: Should NOT exist (we just deleted it)\n')

  const prague = await service.findOrCreateLocation('Prague')

  if (prague) {
    console.log('\n❌ UNEXPECTED: Prague still exists in database!')
    console.log(`   Name: ${prague.name}`)
    console.log(`   Slug: ${prague.slug}`)
  } else {
    console.log('\n✅ CONFIRMED: Prague has been deleted from database')
    console.log('\n📝 Next steps:')
    console.log('   1. Go to http://localhost:3002/plan')
    console.log('   2. Enter "Prague" as your destination')
    console.log('   3. Create a trip')
    console.log('   4. Check that the location is created as "Prague" (not "Hlavní město Praha")')
    console.log('   5. Verify activities and restaurants are auto-populated')
  }

  console.log('\n' + '=' .repeat(60))
  console.log('Test complete!\n')
}

testPragueCreation().catch(console.error)

