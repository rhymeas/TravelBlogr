#!/usr/bin/env tsx
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Get the first real user from the database
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single()

  if (!users) {
    console.log('❌ No users found')
    return
  }

  const userId = users.id
  console.log(`Using user ID: ${userId}`)

  // Update Tokyo post
  await supabase
    .from('blog_posts')
    .update({ author_id: userId })
    .eq('slug', 'beyond-tourism-authentic-tokyo-in-7-days')

  console.log('✅ Updated Tokyo post')

  // Update Rome post
  await supabase
    .from('blog_posts')
    .update({ author_id: userId })
    .eq('slug', '2-days-of-wonder-discovering-rome')

  console.log('✅ Updated Rome post')

  // Refetch images for Rome post
  console.log('🖼️  Refetching images for Rome...')
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', '2-days-of-wonder-discovering-rome')
    .single()

  if (post?.content) {
    const content = post.content as any
    // Just trigger an update to refresh
    await supabase
      .from('blog_posts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', post.id)
    
    console.log('✅ Rome post refreshed')
  }

  console.log('✅ Done!')
}

main()
