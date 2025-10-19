/**
 * Test Blog Post Generation
 *
 * Simple script to test generating 1 blog post from a trip
 * to ensure batch generation will work.
 *
 * Usage:
 * npx tsx scripts/test-blog-generation.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBlogGeneration() {
  console.log('🧪 Testing Blog Post Generation...\n')

  // Step 1: Get a test trip
  console.log('📍 Step 1: Fetching a test trip...')
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      description,
      destination,
      start_date,
      end_date,
      user_id,
      location_data
    `)
    .limit(1)
    .single()

  if (tripsError || !trips) {
    console.error('❌ No trips found in database!')
    console.error('Please create a trip first in the app.')
    process.exit(1)
  }

  console.log(`✅ Found trip: "${trips.title}"`)
  console.log(`   Destination: ${trips.destination}`)
  console.log(`   Trip ID: ${trips.id}\n`)

  // Step 2: Call the batch generation API
  console.log('🚀 Step 2: Calling batch generation API...')
  
  const response = await fetch('http://localhost:3000/api/batch/blog-posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: trips.user_id,
      tripIds: [trips.id],
      autoPublish: false, // Don't auto-publish for testing
      includeAffiliate: true,
      seoOptimize: true
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ API call failed!')
    console.error('Status:', response.status)
    console.error('Error:', error)
    process.exit(1)
  }

  const result = await response.json()
  console.log('✅ API call successful!\n')

  // Step 3: Check the batch job
  console.log('📊 Step 3: Batch job created:')
  console.log(`   Job ID: ${result.jobId}`)
  console.log(`   Status: ${result.status}`)
  console.log(`   Message: ${result.message}\n`)

  // Step 4: Poll for completion
  console.log('⏳ Step 4: Waiting for completion...')
  console.log('(This may take 1-2 minutes for GROQ batch processing)\n')

  let attempts = 0
  const maxAttempts = 60 // 5 minutes max
  let jobCompleted = false

  while (attempts < maxAttempts && !jobCompleted) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

    const { data: job, error: jobError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', result.jobId)
      .single()

    if (jobError) {
      console.error('❌ Error fetching job status:', jobError)
      break
    }

    attempts++
    console.log(`   [${attempts}] Status: ${job.status}`)

    if (job.status === 'completed') {
      jobCompleted = true
      console.log('\n✅ Job completed successfully!\n')

      console.log('📈 Results:')
      console.log(`   Total items: ${job.result?.totalItems || 0}`)
      console.log(`   Success: ${job.result?.successCount || 0}`)
      console.log(`   Failed: ${job.result?.failureCount || 0}`)
      console.log(`   Skipped: ${job.result?.skippedCount || 0}\n`)

      // Step 5: Check if blog post was created
      console.log('📝 Step 5: Checking for generated blog post...')
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('source_trip_id', trips.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (blogError || !blogPosts || blogPosts.length === 0) {
        console.error('❌ No blog post found!')
        console.error('Error:', blogError)
      } else {
        const post = blogPosts[0]
        console.log('✅ Blog post created!')
        console.log(`   Title: ${post.title}`)
        console.log(`   Slug: ${post.slug}`)
        console.log(`   Status: ${post.status}`)
        console.log(`   URL: http://localhost:3000/blog/posts/${post.slug}\n`)

        // Check if content has enriched data
        const content = typeof post.content === 'string' 
          ? JSON.parse(post.content) 
          : post.content

        if (content?.days && content.days.length > 0) {
          console.log('📍 Checking enrichment data...')
          const firstDay = content.days[0]
          
          console.log(`   Day 1: ${firstDay.title}`)
          console.log(`   - Has location image: ${!!firstDay.location?.image ? '✅' : '❌'}`)
          console.log(`   - Has POIs: ${firstDay.location?.pois?.length > 0 ? `✅ (${firstDay.location.pois.length})` : '❌'}`)
          console.log(`   - Has transportation: ${!!firstDay.location?.transportation ? '✅' : '❌'}`)
        }
      }

      break
    } else if (job.status === 'failed') {
      console.error('\n❌ Job failed!')
      console.error('Error:', job.error_message)
      break
    }
  }

  if (!jobCompleted && attempts >= maxAttempts) {
    console.error('\n❌ Job timed out after 5 minutes')
    console.error('Check the batch_jobs table for status')
  }

  console.log('\n🎉 Test complete!')
}

// Run the test
testBlogGeneration().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})

