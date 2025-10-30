/**
 * Apply routing usage tracking migration
 * 
 * Run with: npx tsx scripts/apply-routing-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Applying routing usage tracking migration...')

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250128000000_routing_usage_tracking.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log('⚠️  Skipping (already exists):', statement.substring(0, 50) + '...')
        } else {
          console.error('❌ Error:', error.message)
          console.error('   Statement:', statement.substring(0, 100) + '...')
        }
      } else {
        console.log('✅ Applied:', statement.substring(0, 50) + '...')
      }
    } catch (err) {
      console.error('❌ Exception:', err)
    }
  }

  console.log('\n✅ Migration complete!')
}

applyMigration().catch(console.error)

