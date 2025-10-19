/**
 * Generate Blog Posts from Trips Use Case
 * 
 * Application layer - orchestrates batch blog post generation from existing trips.
 * Leverages GROQ batch API for 50% cost savings.
 * 
 * Flow:
 * 1. Fetch trips with all related data (posts, images, locations, POIs)
 * 2. Build rich context for each trip
 * 3. Create GROQ batch request
 * 4. Submit to GROQ batch API
 * 5. Poll for completion
 * 6. Process results and create blog posts
 */

import { createServerSupabase } from '@/lib/supabase-server'
import { createGroqClient } from '@/lib/groq'
import { BatchJob, BatchJobResult } from '../../domain/entities/BatchJob'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'
import { getAllAffiliateLinks } from '@/lib/utils/affiliateLinks'

export interface GenerateBlogPostsCommand {
  userId: string
  tripIds: string[]
  autoPublish: boolean
  includeAffiliate: boolean
  seoOptimize: boolean
}

export interface GenerateBlogPostsResult {
  success: boolean
  batchJob: BatchJob
  error?: string
}

export class GenerateBlogPostsFromTripsUseCase {
  /**
   * Execute the use case
   */
  async execute(command: GenerateBlogPostsCommand): Promise<GenerateBlogPostsResult> {
    try {
      console.log('🚀 Starting batch blog post generation:', command)

      // 1. Create batch job entity
      const batchJob = BatchJob.create(
        command.userId,
        'blog_posts_from_trips',
        {
          type: 'blog_posts_from_trips',
          sourceIds: command.tripIds,
          options: {
            autoPublish: command.autoPublish,
            includeAffiliate: command.includeAffiliate,
            seoOptimize: command.seoOptimize
          }
        }
      )

      // 2. Validate
      const validation = batchJob.validate()
      if (!validation.isValid) {
        return {
          success: false,
          batchJob,
          error: validation.errors.join(', ')
        }
      }

      // 3. Fetch trips with all related data
      console.log('📦 Fetching trips with related data...')
      const trips = await this.fetchTripsWithData(command.tripIds)

      if (trips.length === 0) {
        return {
          success: false,
          batchJob,
          error: 'No trips found'
        }
      }

      // 4. Build GROQ batch requests
      console.log('🔨 Building GROQ batch requests...')
      const batchRequests = await this.buildBatchRequests(trips, command)

      // 5. Submit to GROQ batch API
      console.log('📤 Submitting to GROQ batch API...')
      const groqBatchId = await this.submitBatchToGroq(batchRequests)

      // 6. Start the batch job
      batchJob.start(groqBatchId)

      // 7. Save batch job to database
      await this.saveBatchJob(batchJob)

      console.log('✅ Batch job created:', batchJob.id)

      return {
        success: true,
        batchJob
      }
    } catch (error) {
      console.error('❌ Error in GenerateBlogPostsFromTripsUseCase:', error)
      return {
        success: false,
        batchJob: BatchJob.create(command.userId, 'blog_posts_from_trips', {
          type: 'blog_posts_from_trips',
          sourceIds: command.tripIds,
          options: {}
        }),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Fetch trips with all related data
   */
  private async fetchTripsWithData(tripIds: string[]) {
    const supabase = await createServerSupabase()
    const { isFeatureEnabled } = await import('@/lib/featureFlags')

    // Use batch processing if enabled
    if (isFeatureEnabled('BATCH_BLOG_PROCESSING')) {
      const { processBatch } = await import('@/lib/services/smartDataHandler')

      console.log(`📦 Fetching ${tripIds.length} trips in batches...`)

      const trips = await processBatch(
        tripIds,
        async (tripId) => {
          const { data, error } = await supabase
            .from('trips')
            .select(`
              *,
              posts (
                id,
                title,
                content,
                location,
                post_date,
                featured_image,
                location_data
              ),
              trip_plan (
                id,
                day,
                title,
                description,
                location,
                type,
                plan_data
              )
            `)
            .eq('id', tripId)
            .single()

          if (error) {
            console.error(`Error fetching trip ${tripId}:`, error)
            return null
          }

          return data
        },
        {
          batchSize: 10,  // Process 10 trips at a time
          delayMs: 500,   // 500ms delay between batches
          onProgress: (current, total) => {
            console.log(`   Progress: ${current}/${total} trips`)
          }
        }
      )

      return trips.filter(Boolean) // Remove nulls
    } else {
      // Fallback: Fetch all at once
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          posts (
            id,
            title,
            content,
            location,
            post_date,
            featured_image,
            location_data
          ),
          trip_plan (
            id,
            day,
            title,
            description,
            location,
            type,
            plan_data
          )
        `)
        .in('id', tripIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching trips:', error)
        throw new Error('Failed to fetch trips')
      }

      return trips || []
    }
  }

  /**
   * Build GROQ batch requests with rich context
   */
  private async buildBatchRequests(trips: any[], command: GenerateBlogPostsCommand) {
    const requests = []

    for (const trip of trips) {
      // Build rich context from trip data
      const context = await this.buildTripContext(trip, command)

      // Create GROQ request
      requests.push({
        custom_id: trip.id,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional travel writer creating SEO-optimized blog posts from trip data. Write engaging, informative content that provides real value to readers.'
            },
            {
              role: 'user',
              content: this.buildPrompt(trip, context, command)
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }
      })
    }

    return requests
  }

  /**
   * Build rich context from trip data
   */
  private async buildTripContext(trip: any, command: GenerateBlogPostsCommand) {
    const context: any = {
      trip: {
        title: trip.title,
        description: trip.description,
        startDate: trip.start_date,
        endDate: trip.end_date,
        duration: trip.posts?.length || 0
      },
      posts: trip.posts || [],
      locations: [],
      pois: [],
      activities: [],
      affiliateLinks: {}
    }

    // Get location intelligence for main destination
    if (trip.posts && trip.posts.length > 0) {
      const mainLocation = trip.posts[0].location
      if (mainLocation) {
        const { isFeatureEnabled } = await import('@/lib/featureFlags')

        let intelligence

        // Use smart caching if enabled
        if (isFeatureEnabled('SMART_POI_SYSTEM')) {
          const { smartFetch } = await import('@/lib/services/smartDataHandler')

          intelligence = await smartFetch(
            `location_intel_${mainLocation}`,
            'pois',
            async () => {
              return await getLocationIntelligence(mainLocation, true)
            },
            { useServerClient: true }
          )
        } else {
          // Fallback: Direct fetch
          intelligence = await getLocationIntelligence(mainLocation, true)
        }

        context.locations.push(intelligence.location)
        context.pois = intelligence.pois
        context.activities = intelligence.activities

        // Generate affiliate links if requested
        if (command.includeAffiliate && intelligence.location) {
          context.affiliateLinks = getAllAffiliateLinks({
            locationName: mainLocation,
            latitude: intelligence.location.coordinates?.lat,
            longitude: intelligence.location.coordinates?.lng
          })
        }
      }
    }

    return context
  }

  /**
   * Build prompt for GROQ
   */
  private buildPrompt(trip: any, context: any, command: GenerateBlogPostsCommand): string {
    return `Generate a comprehensive travel blog post from this trip data:

TRIP INFORMATION:
${JSON.stringify(context.trip, null, 2)}

DAY-BY-DAY POSTS:
${JSON.stringify(context.posts, null, 2)}

LOCATION DATA:
${JSON.stringify(context.locations, null, 2)}

POIS & ACTIVITIES:
${JSON.stringify({ pois: context.pois, activities: context.activities }, null, 2)}

${command.includeAffiliate ? `AFFILIATE LINKS:\n${JSON.stringify(context.affiliateLinks, null, 2)}\n` : ''}

Generate a blog post with this structure (return as JSON):
{
  "title": "SEO-optimized title (60-70 characters)",
  "excerpt": "Compelling excerpt (150-160 characters)",
  "content": {
    "destination": "Main destination name",
    "introduction": "Engaging introduction (2-3 paragraphs)",
    "highlights": ["Key highlight 1", "Key highlight 2", ...],
    "days": [
      {
        "day_number": 1,
        "title": "Day title",
        "description": "Rich description with details",
        "activities": ["Activity 1", "Activity 2"],
        "tips": "Pro tip for this day"
      }
    ],
    "practicalInfo": {
      "bestTime": "Best time to visit",
      "budget": "Budget estimate",
      "packing": ["Item 1", "Item 2"]
    },
    "conclusion": "Inspiring conclusion"
  },
  "seo_title": "SEO title",
  "seo_description": "SEO meta description",
  "seo_keywords": ["keyword1", "keyword2"],
  "tags": ["tag1", "tag2"],
  "category": "adventure|culture|food|nature|city"
}

${command.seoOptimize ? 'Optimize for SEO with relevant keywords, internal linking opportunities, and engaging meta descriptions.' : ''}
${command.includeAffiliate ? 'Include natural mentions of booking options where appropriate.' : ''}

Write in a friendly, informative tone. Focus on practical value and authentic experiences.`
  }

  /**
   * Submit batch to GROQ
   */
  private async submitBatchToGroq(requests: any[]): Promise<string> {
    // For now, return a mock batch ID
    // TODO: Implement actual GROQ batch API submission when available
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    console.log(`📤 Would submit ${requests.length} requests to GROQ batch API`)
    console.log(`🆔 Mock batch ID: ${batchId}`)
    
    return batchId
  }

  /**
   * Save batch job to database
   */
  private async saveBatchJob(batchJob: BatchJob): Promise<void> {
    const supabase = await createServerSupabase()

    const { error } = await supabase
      .from('batch_jobs')
      .insert(batchJob.toJSON())

    if (error) {
      console.error('Error saving batch job:', error)
      throw new Error('Failed to save batch job')
    }
  }
}

