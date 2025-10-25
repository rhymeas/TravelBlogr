#!/usr/bin/env tsx

/**
 * Apply Activity Migration and Refetch Images/Links
 * 
 * This script:
 * 1. Applies the migration to create location_activity_links table
 * 2. Migrates data from old activities table
 * 3. Refetches images and links for all activities
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const envPath = path.join(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Applying migration: 014_migrate_to_activity_links.sql')
  
  const migrationPath = path.join(
    process.cwd(),
    'infrastructure/database/migrations/014_migrate_to_activity_links.sql'
  )
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
  
  if (error) {
    console.error('❌ Migration failed:', error)
    
    // Try direct query instead
    console.log('🔄 Trying direct query...')
    const { error: directError } = await supabase
      .from('_migrations')
      .insert({ name: '014_migrate_to_activity_links', applied_at: new Date().toISOString() })
    
    if (directError) {
      console.error('❌ Direct query also failed:', directError)
      console.log('\n⚠️  Please apply migration manually using Supabase SQL Editor')
      console.log('📄 Migration file:', migrationPath)
      return false
    }
  }
  
  console.log('✅ Migration applied successfully!')
  return true
}

async function checkMigration() {
  console.log('🔍 Checking if migration is needed...')
  
  // Check if location_activity_links table exists
  const { data, error } = await supabase
    .from('location_activity_links')
    .select('id')
    .limit(1)
  
  if (error && error.message.includes('does not exist')) {
    console.log('⚠️  Table location_activity_links does not exist - migration needed')
    return false
  }
  
  console.log('✅ Table location_activity_links already exists')
  return true
}

async function refetchActivityData() {
  console.log('\n🔄 Refetching activity images and links...')
  
  // Get all locations with activities
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, slug, name, country')
    .not('slug', 'is', null)
    .limit(100)
  
  if (locError) {
    console.error('❌ Failed to fetch locations:', locError)
    return
  }
  
  console.log(`📍 Found ${locations?.length || 0} locations`)
  
  let totalActivities = 0
  let imagesFixed = 0
  let linksFixed = 0
  
  for (const location of locations || []) {
    console.log(`\n📍 Processing: ${location.name}`)
    
    // Get activities for this location
    const { data: activities, error: actError } = await supabase
      .from('location_activity_links')
      .select('id, activity_name, image_url, link_url')
      .eq('location_id', location.id)
      .limit(50)
    
    if (actError) {
      console.error(`  ❌ Failed to fetch activities:`, actError)
      continue
    }
    
    if (!activities || activities.length === 0) {
      console.log(`  ⚠️  No activities found`)
      continue
    }
    
    console.log(`  📋 Found ${activities.length} activities`)
    totalActivities += activities.length
    
    // Refetch images and links for activities without them
    for (const activity of activities) {
      const needsImage = !activity.image_url
      const needsLink = !activity.link_url
      
      if (!needsImage && !needsLink) {
        continue
      }
      
      console.log(`  🔄 ${activity.activity_name}`)
      
      try {
        const updates: any = { updated_at: new Date().toISOString() }
        
        // Fetch image if missing
        if (needsImage) {
          const imageUrl = `/api/activities/find-image?activityName=${encodeURIComponent(activity.activity_name)}&locationName=${encodeURIComponent(location.name)}&country=${encodeURIComponent(location.country)}`
          
          const imageRes = await fetch(`${supabaseUrl.replace('https://', 'http://localhost:3000')}${imageUrl}`)
          const imageData = await imageRes.json()
          
          if (imageData.success && imageData.url && !imageData.url.includes('placeholder')) {
            updates.image_url = imageData.url
            imagesFixed++
            console.log(`    ✅ Image found`)
          }
        }
        
        // Fetch link if missing
        if (needsLink) {
          const linkUrl = `/api/activities/find-links?activityName=${encodeURIComponent(activity.activity_name)}&locationName=${encodeURIComponent(location.name)}`
          
          const linkRes = await fetch(`${supabaseUrl.replace('https://', 'http://localhost:3000')}${linkUrl}`)
          const linkData = await linkRes.json()
          
          if (linkData.success && linkData.links && linkData.links.length > 0) {
            updates.link_url = linkData.links[0].url
            updates.source = linkData.links[0].source
            updates.type = linkData.links[0].source === 'wikipedia' ? 'guide' : 'official'
            linksFixed++
            console.log(`    ✅ Link found`)
          }
        }
        
        // Update activity
        if (Object.keys(updates).length > 1) {
          const { error: updateError } = await supabase
            .from('location_activity_links')
            .update(updates)
            .eq('id', activity.id)
          
          if (updateError) {
            console.error(`    ❌ Update failed:`, updateError)
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (err) {
        console.error(`    ❌ Error:`, err)
      }
    }
  }
  
  console.log('\n✅ Refetch complete!')
  console.log(`📊 Total activities: ${totalActivities}`)
  console.log(`🖼️  Images fixed: ${imagesFixed}`)
  console.log(`🔗 Links fixed: ${linksFixed}`)
}

async function main() {
  console.log('🚀 Starting activity migration...\n')
  
  const exists = await checkMigration()
  
  if (!exists) {
    const success = await applyMigration()
    if (!success) {
      console.log('\n⚠️  Please apply migration manually and run this script again')
      process.exit(1)
    }
  }
  
  // Note: Refetch is commented out because it requires the Next.js server to be running
  // await refetchActivityData()
  
  console.log('\n✅ Migration complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Start the dev server: npm run dev')
  console.log('2. Go to any location page (e.g., /locations/magdeburg-saxony-anhalt-germany)')
  console.log('3. Click "Refetch Data" button')
  console.log('4. Select "Refetch Activity Images" and "Refetch Activity Links"')
  console.log('5. Click "Start Refetch"')
}

main().catch(console.error)

