#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content')
    .limit(1)
    .single()

  console.log('Blog post structure:')
  console.log(JSON.stringify(data, null, 2))
}

main()

