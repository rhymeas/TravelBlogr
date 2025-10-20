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
  useRandomPersona?: boolean // If true, assigns random persona instead of trip owner
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
    const useRandomPersona = (command as any).useRandomPersona || false

    for (const trip of trips) {
      // Build rich context from trip data
      const context = await this.buildTripContext(trip, command)

      // Get persona for this trip (either trip owner or random)
      const persona = await this.getPersonaForTrip(trip, useRandomPersona)

      // Build persona-specific prompt
      const prompt = await this.buildPrompt(trip, context, command, persona)

      // Extract system instructions from prompt
      const systemInstructions = persona && persona.writing_style
        ? `You are ${persona.full_name}, a ${persona.writing_style.personality} travel writer with expertise in ${persona.expertise?.slice(0, 3).join(', ')}. Write COMPELLING, EMOTIONAL stories that resonate deeply with readers. Provide real value while staying true to your unique voice.`
        : 'You are a professional travel writer creating SEO-optimized blog posts from trip data. Write engaging, informative content that provides real value to readers.'

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
              content: systemInstructions
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000, // Increased for more detailed content
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
   * Get random team persona for blog post authoring
   * If useRandomPersona is true, selects a random persona instead of trip owner
   */
  private async getRandomTeamPersona(useRandomPersona: boolean = false) {
    const supabase = await createServerSupabase()

    const { data: personas, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, writing_style, expertise, travel_preferences')
      .in('username', ['emma_chen', 'marcus_rodriguez', 'yuki_tanaka', 'sophie_laurent', 'alex_thompson'])

    if (error || !personas || personas.length === 0) {
      console.warn('⚠️ No team personas found, using default style')
      return null
    }

    // Select random persona
    const randomIndex = Math.floor(Math.random() * personas.length)
    const selectedPersona = personas[randomIndex]

    if (useRandomPersona) {
      console.log(`🎲 Using random persona: ${selectedPersona.full_name}`)
    }

    return selectedPersona
  }

  /**
   * Get persona for trip (either trip owner or random)
   */
  private async getPersonaForTrip(trip: any, useRandomPersona: boolean = false) {
    if (useRandomPersona) {
      return await this.getRandomTeamPersona(true)
    }

    // Get trip owner's persona
    const supabase = await createServerSupabase()
    const { data: persona } = await supabase
      .from('profiles')
      .select('id, full_name, username, writing_style, expertise, travel_preferences')
      .eq('id', trip.user_id)
      .single()

    return persona || await this.getRandomTeamPersona(true)
  }

  /**
   * Build prompt for GROQ with persona-specific writing style
   */
  private async buildPrompt(trip: any, context: any, command: GenerateBlogPostsCommand, persona: any): Promise<string> {
    let systemInstructions = 'You are a professional travel writer creating SEO-optimized blog posts from trip data.'
    let writingStyleGuidance = 'Write in a friendly, informative tone. Focus on practical value and authentic experiences.'
    let emotionalGuidance = ''

    if (persona && persona.writing_style) {
      const style = persona.writing_style
      systemInstructions = `You are ${persona.full_name}, a ${style.personality} travel writer with expertise in ${persona.expertise?.slice(0, 3).join(', ')}.`

      // Emotional storytelling guidance based on trip type
      const tripType = trip.trip_type || 'adventure'
      const emotionalHooks: Record<string, string> = {
        adventure: "Start with a heart-racing moment that captures the thrill and adrenaline. Make readers feel the excitement!",
        luxury: "Begin with a sensory detail that evokes sophistication and indulgence. Transport readers to a world of refined elegance.",
        cultural: "Open with a quiet, contemplative observation that reveals deeper meaning. Invite readers to see beyond the surface.",
        family: "Start with a genuine family moment that captures joy and connection. Help parents see themselves in your story.",
        'digital-nomad': "Begin with the freedom and flexibility of remote work. Show the perfect work-life integration.",
        backpacking: "Open with the raw authenticity of budget travel. Celebrate the freedom of minimalism.",
        wellness: "Start with a moment of transformation or release. Guide readers toward inner peace.",
        photography: "Begin with a visual moment that captures light, composition, or emotion. Paint with words.",
        educational: "Open with a moment of discovery or learning. Spark curiosity and wonder.",
        workation: "Start with the balance between productivity and paradise. Show how work enhances travel."
      }

      emotionalGuidance = emotionalHooks[tripType] || emotionalHooks.adventure

      writingStyleGuidance = `
WRITING STYLE REQUIREMENTS:
- Tone: ${style.tone}
- Personality: ${style.personality}
- Characteristics: ${style.characteristics?.join(', ')}
- Writing patterns: ${style.writing_patterns?.join('; ')}
- Preferred vocabulary: ${style.vocabulary?.join(', ')}
- Sentence structure: ${style.sentence_structure}
- Emoji usage: ${style.emoji_usage}

EMOTIONAL STORYTELLING:
${emotionalGuidance}

Your expertise areas: ${persona.expertise?.join(', ')}
Your travel style: ${persona.travel_preferences?.travel_style}
Your budget preference: ${persona.travel_preferences?.budget_preference}

Write as ${persona.full_name} would write - authentic to your unique voice and perspective.
Create a COMPELLING, EMOTIONAL story that resonates with readers on a personal level.`
    }

    return `${systemInstructions}

Generate a comprehensive travel blog post from this trip data:

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
    "introduction": "EMOTIONAL, COMPELLING introduction that hooks readers immediately (2-3 paragraphs). Start with a powerful moment or feeling.",
    "highlights": ["Key highlight 1", "Key highlight 2", ...],
    "days": [
      {
        "day_number": 1,
        "title": "Day title",
        "description": "Rich, EMOTIONAL description with sensory details and personal moments",
        "activities": ["Activity 1", "Activity 2"],
        "tips": "Pro tip for this day",
        "location": {
          "name": "Location name",
          "coordinates": { "lat": 0, "lng": 0 }
        }
      }
    ],
    "practicalInfo": {
      "bestTime": "Best time to visit",
      "budget": "Budget estimate with specific numbers",
      "packing": ["Item 1", "Item 2"]
    },
    "mapData": {
      "center": { "lat": 0, "lng": 0 },
      "zoom": 10,
      "markers": [
        {
          "position": { "lat": 0, "lng": 0 },
          "title": "Location name",
          "description": "Brief description"
        }
      ]
    },
    "conclusion": "Inspiring, emotional conclusion that resonates"
  },
  "seo_title": "SEO title",
  "seo_description": "SEO meta description",
  "seo_keywords": ["keyword1", "keyword2"],
  "tags": ["tag1", "tag2"],
  "category": "adventure|culture|food|nature|city"
}

IMPORTANT REQUIREMENTS:
- Include GPS coordinates for each day's location (for map integration)
- If destination is in Asia (Japan, China, Korea, Thailand, Vietnam), include romanized versions of place names
- Write COMPELLING, EMOTIONAL stories that make readers FEEL the experience
- Use sensory details: what you saw, heard, smelled, tasted, felt
- Include personal moments and genuine reactions
- Make it authentic and relatable

${command.seoOptimize ? 'Optimize for SEO with relevant keywords, internal linking opportunities, and engaging meta descriptions.' : ''}
${command.includeAffiliate ? 'Include natural mentions of booking options where appropriate.' : ''}

${writingStyleGuidance}`
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

