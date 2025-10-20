#!/usr/bin/env tsx

/**
 * Update specific blog posts with persona authors and refetch images
 *
 * Usage:
 * npx tsx scripts/update-blog-posts-with-personas.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { BlogPostEnhancer } from '../apps/web/lib/batch/domain/BlogPostEnhancer'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Persona IDs from migration
const PERSONAS = {
  ALEX_THOMPSON: '55555555-5555-5555-5555-555555555555', // Digital Nomad
  YUKI_TANAKA: '33333333-3333-3333-3333-333333333333',    // Cultural Explorer
  EMMA_CHEN: '11111111-1111-1111-1111-111111111111',      // Adventure Seeker
  SOFIA_MARTINEZ: '22222222-2222-2222-2222-222222222222', // Family Travel Expert
  MARCUS_OKONKWO: '44444444-4444-4444-4444-444444444444'  // Budget Backpacker
}

async function updateBlogPost(slug: string, authorId: string, refetchImages: boolean = false) {
  console.log(`\n📝 Updating blog post: ${slug}`)
  console.log(`👤 Setting author to: ${authorId}`)

  // 1. Get the blog post
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (fetchError || !post) {
    console.error(`❌ Blog post not found: ${slug}`)
    return
  }

  console.log(`✅ Found blog post: ${post.title}`)

  // 2. Update author
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({
      author_id: authorId,
      updated_at: new Date().toISOString()
    })
    .eq('id', post.id)

  if (updateError) {
    console.error(`❌ Failed to update author:`, updateError)
    return
  }

  console.log(`✅ Author updated successfully`)

  // 3. Refetch images if requested
  if (refetchImages) {
    console.log(`\n🖼️  Refetching images for: ${post.title}`)

    try {
      // Get trip data from content
      const content = post.content as any
      
      if (!content?.trip) {
        console.log(`⚠️  No trip data found in content, skipping image refetch`)
        return
      }

      // Enhance with new images
      const enhancedContent = await BlogPostEnhancer.enhance(
        content.trip,
        post.title,
        content.introduction || '',
        content.practicalInfo || {}
      )

      // Update blog post with new images
      const { error: imageUpdateError } = await supabase
        .from('blog_posts')
        .update({
          content: {
            ...content,
            trip: enhancedContent.trip
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (imageUpdateError) {
        console.error(`❌ Failed to update images:`, imageUpdateError)
        return
      }

      console.log(`✅ Images refetched and updated successfully`)
      
      // Count images
      const imageCount = enhancedContent.trip.days.reduce((total: number, day: any) => {
        return total + (day.images?.length || 0)
      }, 0)
      console.log(`📸 Total images: ${imageCount}`)

    } catch (error) {
      console.error(`❌ Error refetching images:`, error)
    }
  }
}

async function main() {
  console.log('🚀 Starting blog post updates...\n')

  // Update "Beyond Tourism: Authentic Tokyo in 7 Days" with Yuki Tanaka (Cultural Explorer)
  await updateBlogPost(
    'beyond-tourism-authentic-tokyo-in-7-days',
    PERSONAS.YUKI_TANAKA,
    false // Don't refetch images
  )

  // Update "2 Days of Wonder: Discovering Rome" with Sofia Martinez (Family Travel Expert)
  // AND refetch images
  await updateBlogPost(
    '2-days-of-wonder-discovering-rome',
    PERSONAS.SOFIA_MARTINEZ,
    true // Refetch images
  )

  console.log('\n✅ All blog posts updated successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

