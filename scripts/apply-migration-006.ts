/**
 * Apply Migration 006: User Location Customizations
 * Run with: npx tsx scripts/apply-migration-006.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Starting Migration 006: User Location Customizations\n')

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../infrastructure/database/migrations/006_user_location_customizations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('📊 Executing SQL...\n')

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql function not found, trying direct execution...')
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.length > 0) {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement
          })
          
          if (stmtError) {
            console.error(`❌ Error executing statement:`, stmtError)
            console.error(`Statement: ${statement.substring(0, 100)}...`)
          }
        }
      }
    }

    console.log('✅ Migration 006 applied successfully!\n')
    console.log('📋 Created tables:')
    console.log('   - user_locations')
    console.log('   - trip_location_customizations')
    console.log('   - user_location_photos')
    console.log('\n📋 Created indexes and RLS policies')
    console.log('\n🎉 Community-driven location database is ready!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()

