#!/usr/bin/env tsx

/**
 * Enhance Existing Blog Posts with Images
 * 
 * This script:
 * 1. Fetches all published blog posts
 * 2. Enhances each post with BlogPostEnhancer (adds images, maps, translations)
 * 3. Updates the blog_posts table with enhanced content
 * 
 * Usage:
 *   npx tsx scripts/enhance-blog-posts-with-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { BlogPostEnhancer } from '../apps/web/lib/batch/domain/BlogPostEnhancer'

// Load environment variables
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function enhanceAllBlogPosts() {
  console.log('🎨 Starting blog post enhancement...\n')

  // 1. Fetch all published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      content,
      author_id,
      trip_id
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching blog posts:', error)
    return
  }

  if (!posts || posts.length === 0) {
    console.log('ℹ️ No published blog posts found')
    return
  }

  console.log(`📝 Found ${posts.length} published blog posts\n`)

  // 2. Enhance each post
  let successCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      console.log(`\n🎨 Enhancing: ${post.title}`)
      console.log(`   Post ID: ${post.id}`)

      // Parse existing content
      const rawContent = typeof post.content === 'string'
        ? JSON.parse(post.content)
        : post.content

      // Fetch trip data if available
      let tripData = null
      if (post.trip_id) {
        const { data: trip } = await supabase
          .from('trips')
          .select('*')
          .eq('id', post.trip_id)
          .single()
        
        tripData = trip
      }

      // Determine persona type (default to balanced)
      const personaType = 'balanced'

      // Enhance with images, maps, translations
      const enhanced = await BlogPostEnhancer.enhance(
        rawContent,
        tripData || { destination: rawContent.destination },
        personaType
      )

      // Update blog post with enhanced content
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content: enhanced.content,
          featured_image: enhanced.featured_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (updateError) {
        console.error(`   ❌ Error updating post: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Enhanced successfully`)
        console.log(`   📸 Added ${enhanced.content.images?.length || 0} images`)
        console.log(`   🗺️ Map data: ${enhanced.content.mapData ? 'Yes' : 'No'}`)
        successCount++
      }

      // Rate limiting - wait 2 seconds between posts
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`   ❌ Error enhancing post:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Enhancement Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${posts.length}`)
  console.log('='.repeat(60))
}

// Run the script
enhanceAllBlogPosts()
  .then(() => {
    console.log('\n✅ Blog post enhancement complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

