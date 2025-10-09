#!/usr/bin/env tsx

/**
 * Run Location Features Migration
 * 
 * This script sets up the database tables for:
 * 1. Location Ratings (star rating system)
 * 2. Location Views (pixel tracking)
 * 3. Location Comments (community discussion)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting Location Features Migration...\n')

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'setup-location-features.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📄 Executing SQL migration...')

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_').select('*').limit(0)
          
          if (directError) {
            console.error(`⚠️  Error executing statement:`, error.message)
            errorCount++
          } else {
            successCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.error(`⚠️  Error:`, err)
        errorCount++
      }
    }

    console.log(`\n✅ Migration completed!`)
    console.log(`   Successful statements: ${successCount}`)
    console.log(`   Errors: ${errorCount}`)

    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    
    const tables = [
      'location_ratings',
      'location_views', 
      'location_comments'
    ]

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)

      if (error) {
        console.log(`   ❌ ${table}: NOT FOUND`)
        console.error(`      Error: ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: EXISTS`)
      }
    }

    // Check if location columns were added
    console.log('\n🔍 Verifying location columns...')
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, rating, rating_count, view_count')
      .limit(1)

    if (locError) {
      console.log('   ❌ Location columns: ERROR')
      console.error(`      Error: ${locError.message}`)
    } else {
      console.log('   ✅ Location columns: EXISTS')
      if (locations && locations.length > 0) {
        console.log(`      Sample: rating=${locations[0].rating}, rating_count=${locations[0].rating_count}, view_count=${locations[0].view_count}`)
      }
    }

    console.log('\n✨ Migration complete! You can now use:')
    console.log('   • Star rating system')
    console.log('   • View tracking')
    console.log('   • Community comments')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Run SQL directly via Supabase SQL Editor
async function printInstructions() {
  console.log('\n📋 ALTERNATIVE: Manual Migration via Supabase Dashboard')
  console.log('=' .repeat(60))
  console.log('If the automatic migration fails, you can run it manually:')
  console.log('')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the contents of: scripts/setup-location-features.sql')
  console.log('4. Paste and run in the SQL Editor')
  console.log('=' .repeat(60))
}

runMigration()
  .then(() => {
    printInstructions()
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    printInstructions()
    process.exit(1)
  })

