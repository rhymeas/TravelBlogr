#!/usr/bin/env tsx

/**
 * Migrate AI-Generated Blog Posts to CMS
 * 
 * Converts blog posts from blog_posts table to cms_posts table
 * so they can be edited in the Blog CMS with Novel editor.
 * 
 * Conversion:
 * - blog_posts.content (structured JSON) → cms_posts.content (Novel editor JSON)
 * - Preserves all metadata (title, slug, tags, etc.)
 * - Marks as 'published' if already published
 * - Generates excerpt from content if missing
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Convert blog_posts content to Novel editor format
function convertToNovelFormat(blogPost: any): any {
  const content = blogPost.content || {}
  const days = content.days || []
  
  // Build Novel editor JSON structure
  const novelContent = {
    type: 'doc',
    content: [
      // Title (already in post.title, but add as heading for editor)
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: blogPost.title }]
      },
      // Featured Image
      ...(blogPost.featured_image ? [{
        type: 'image',
        attrs: {
          src: blogPost.featured_image,
          alt: blogPost.title,
          title: blogPost.title
        }
      }] : []),
      // Excerpt/Introduction
      ...(blogPost.excerpt ? [{
        type: 'paragraph',
        content: [{ type: 'text', marks: [{ type: 'bold' }], text: blogPost.excerpt }]
      }] : []),
      // Introduction from content
      ...(content.introduction ? [{
        type: 'paragraph',
        content: [{ type: 'text', text: content.introduction }]
      }] : []),
      // Highlights
      ...(content.highlights && content.highlights.length > 0 ? [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Highlights' }]
        },
        {
          type: 'bulletList',
          content: content.highlights.map((highlight: string) => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: highlight }]
            }]
          }))
        }
      ] : []),
      // Days
      ...days.flatMap((day: any, index: number) => [
        // Day heading
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: `Day ${day.day_number || index + 1}: ${day.title}` }]
        },
        // Day location
        ...(day.location?.name ? [{
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'italic' }], text: `📍 ${day.location.name}` }
          ]
        }] : []),
        // Day description
        ...(day.description ? [{
          type: 'paragraph',
          content: [{ type: 'text', text: day.description }]
        }] : []),
        // Day activities
        ...(day.activities && day.activities.length > 0 ? [
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Activities' }]
          },
          {
            type: 'bulletList',
            content: day.activities.map((activity: string) => ({
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: activity }]
              }]
            }))
          }
        ] : []),
        // Day images
        ...(day.images && day.images.length > 0 ? day.images.map((img: any) => ({
          type: 'image',
          attrs: {
            src: img.url,
            alt: img.alt || `${day.location?.name || day.title} - Day ${day.day_number}`,
            title: img.alt || day.title
          }
        })) : []),
        // Day tips
        ...(day.tips ? [{
          type: 'blockquote',
          content: [{
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: '💡 Tip: ' },
              { type: 'text', text: day.tips }
            ]
          }]
        }] : [])
      ]),
      // Practical Info
      ...(content.practicalInfo ? [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Practical Information' }]
        },
        ...(content.practicalInfo.bestTime ? [{
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Best Time to Visit: ' },
            { type: 'text', text: content.practicalInfo.bestTime }
          ]
        }] : []),
        ...(content.practicalInfo.budget ? [{
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Budget: ' },
            { type: 'text', text: content.practicalInfo.budget }
          ]
        }] : []),
        ...(content.practicalInfo.packing && content.practicalInfo.packing.length > 0 ? [
          {
            type: 'paragraph',
            content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Packing List:' }]
          },
          {
            type: 'bulletList',
            content: content.practicalInfo.packing.map((item: string) => ({
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: item }]
              }]
            }))
          }
        ] : [])
      ] : [])
    ]
  }

  return novelContent
}

// Generate excerpt from content if missing
function generateExcerpt(blogPost: any): string {
  if (blogPost.excerpt) return blogPost.excerpt
  
  const content = blogPost.content || {}
  
  // Try introduction
  if (content.introduction) {
    return content.introduction.substring(0, 200) + '...'
  }
  
  // Try first day description
  if (content.days && content.days.length > 0 && content.days[0].description) {
    return content.days[0].description.substring(0, 200) + '...'
  }
  
  // Fallback
  return `Explore ${content.destination || 'amazing destinations'} with this comprehensive travel guide.`
}

// Migrate single blog post
async function migrateBlogPost(blogPost: any) {
  console.log(`\n📝 Migrating: ${blogPost.title}`)
  
  try {
    // Check if already migrated
    const { data: existing } = await supabase
      .from('cms_posts')
      .select('id')
      .eq('slug', blogPost.slug)
      .single()
    
    if (existing) {
      console.log(`   ⏭️  Already migrated (slug: ${blogPost.slug})`)
      return { success: true, skipped: true }
    }
    
    // Convert content to Novel format
    const novelContent = convertToNovelFormat(blogPost)
    
    // Generate excerpt
    const excerpt = generateExcerpt(blogPost)
    
    // Determine status
    const status = blogPost.status === 'published' ? 'published' : 'draft'
    
    // Create CMS post
    const { data, error } = await supabase
      .from('cms_posts')
      .insert({
        title: blogPost.title,
        slug: blogPost.slug,
        content: novelContent,
        excerpt,
        status,
        visibility: blogPost.visibility || 'public',
        featured_image: blogPost.featured_image,
        tags: blogPost.tags || [],
        category: blogPost.category || 'Travel Guide',
        author_id: blogPost.author_id,
        published_at: blogPost.published_at,
        seo_title: blogPost.seo_title || blogPost.title,
        seo_description: blogPost.seo_description || excerpt,
        created_at: blogPost.created_at,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error(`   ❌ Error:`, error.message)
      return { success: false, error: error.message }
    }
    
    console.log(`   ✅ Migrated successfully (ID: ${data.id})`)
    console.log(`   📊 Status: ${status}`)
    console.log(`   🏷️  Tags: ${(blogPost.tags || []).join(', ') || 'none'}`)
    console.log(`   📝 Excerpt: ${excerpt.substring(0, 100)}...`)
    
    return { success: true, data }
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main function
async function main() {
  console.log('🚀 Migrating AI-Generated Blog Posts to CMS...\n')
  
  // Fetch all blog posts
  const { data: blogPosts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching blog posts:', error)
    return
  }
  
  console.log(`Found ${blogPosts.length} blog posts to migrate\n`)
  
  const results = {
    total: blogPosts.length,
    migrated: 0,
    skipped: 0,
    failed: 0
  }
  
  for (const post of blogPosts) {
    const result = await migrateBlogPost(post)
    
    if (result.success) {
      if (result.skipped) {
        results.skipped++
      } else {
        results.migrated++
      }
    } else {
      results.failed++
    }
    
    // Wait 500ms between posts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Migration Complete!')
  console.log('='.repeat(60))
  console.log(`📊 Total posts: ${results.total}`)
  console.log(`✅ Migrated: ${results.migrated}`)
  console.log(`⏭️  Skipped (already migrated): ${results.skipped}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log('\n💡 You can now edit these posts at: http://localhost:3001/blog-cms')
}

main()

