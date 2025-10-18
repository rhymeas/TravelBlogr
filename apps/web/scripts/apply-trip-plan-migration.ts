/**
 * Apply trip_plan migration to add plan_data column
 * Run: npx tsx apps/web/scripts/apply-trip-plan-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying trip_plan migration...')

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'infrastructure/database/migrations/008_add_trip_plan_data.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL:')
    console.log(sql)
    console.log('')

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...')
      
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error: execError } = await supabase.rpc('exec', { sql: statement })
        if (execError) {
          console.error('❌ Error executing statement:', execError)
          throw execError
        }
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Verify column exists: SELECT column_name FROM information_schema.columns WHERE table_name = \'trip_plan\' AND column_name = \'plan_data\'')
    console.log('2. Test POI display on trip pages')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('')
    console.log('Manual steps:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy the SQL from infrastructure/database/migrations/008_add_trip_plan_data.sql')
    console.log('3. Paste and run it manually')
    process.exit(1)
  }
}

applyMigration()

