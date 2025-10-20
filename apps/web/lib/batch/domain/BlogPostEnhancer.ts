/**
 * Blog Post Enhancer
 * Adds images, maps, translations, ad placements, and smart affiliate links to blog posts
 */

import { fetchLocationGalleryHighQuality } from '@/lib/services/enhancedImageService'
import { generateSmartLinksForActivities, type SmartAffiliateLink } from '@/lib/utils/smartAffiliateLinks'

export interface EnhancedBlogContent {
  title: string
  excerpt: string
  content: {
    introduction: string
    destination: string
    highlights: string[]
    days: DayContent[]
    practicalInfo: PracticalInfo
    emotionalStory?: string
    mapData?: MapData
    images: BlogImage[]
    adPlacements: AdPlacement[]
  }
  featured_image: string
  gallery_images: string[]
}

export interface DayContent {
  day_number: number
  title: string
  description: string
  activities: string[]
  tips: string
  images?: BlogImage[]
  location?: {
    name: string
    coordinates?: { lat: number; lng: number }
    translatedName?: string
  }
  smartAffiliateLinks?: SmartAffiliateLink[]  // Auto-generated affiliate links
}

export interface BlogImage {
  url: string
  alt: string
  caption?: string
  size: 'small' | 'medium' | 'large' | 'full'
  aspectRatio: '16:9' | '4:3' | '1:1'
  position: number
}

export interface AdPlacement {
  type: 'horizontal' | 'vertical' | 'rectangular' | 'square'
  position: 'top' | 'middle' | 'bottom' | 'sidebar'
  afterSection?: string
  slot: string
}

export interface MapData {
  center: { lat: number; lng: number }
  zoom: number
  markers: Array<{
    position: { lat: number; lng: number }
    title: string
    description?: string
  }>
  route?: Array<{ lat: number; lng: number }>
}

export interface PracticalInfo {
  bestTime?: string
  budget?: string
  packing?: string[]
  customs?: string[]
}

export class BlogPostEnhancer {
  /**
   * Enhance blog post with images, maps, translations, and ads
   */
  static async enhance(
    rawContent: any,
    trip: any,
    personaType?: string
  ): Promise<EnhancedBlogContent> {
    console.log('🎨 Enhancing blog post with images, maps, and ads...')

    // 1. Get destination-specific images
    const images = await this.fetchDestinationImages(trip, rawContent)

    // 2. Add map data
    const mapData = await this.generateMapData(trip, rawContent)

    // 3. Translate Asian text if needed
    const translatedContent = await this.translateAsianText(rawContent, trip)

    // 4. Add emotional storytelling based on persona
    const emotionalStory = this.addEmotionalNarrative(translatedContent, personaType)

    // 5. Place Google Ads strategically
    const adPlacements = this.generateAdPlacements(translatedContent)

    // 6. Distribute images throughout content
    const enhancedDays = this.distributeImages(translatedContent.days || [], images)

    return {
      title: translatedContent.title,
      excerpt: translatedContent.excerpt,
      content: {
        introduction: emotionalStory.introduction || translatedContent.introduction,
        destination: translatedContent.destination,
        highlights: translatedContent.highlights || [],
        days: enhancedDays,
        practicalInfo: translatedContent.practicalInfo || {},
        emotionalStory: emotionalStory.story,
        mapData,
        images,
        adPlacements
      },
      featured_image: images[0]?.url || trip.cover_image,
      gallery_images: images.slice(1, 6).map(img => img.url)
    }
  }

  /**
   * Fetch destination-specific images (not generic Unsplash)
   */
  private static async fetchDestinationImages(
    trip: any,
    content: any
  ): Promise<BlogImage[]> {
    const images: BlogImage[] = []
    const destination = trip.destination || content.destination

    if (!destination) return images

    try {
      // Use our HIGH QUALITY image service with REDDIT ULTRA priority!
      // Priority: Reddit ULTRA → Pexels → Flickr ULTRA → Openverse → Europeana → Unsplash → Wikimedia
      console.log(`🖼️ [BLOG] Fetching high-quality images for: ${destination}`)
      console.log(`   🥇 Priority #1: Reddit ULTRA (travel photography subreddits)`)
      console.log(`   🥈 Priority #2: Pexels (smart-filtered stock photos)`)
      console.log(`   🥉 Priority #3: Flickr ULTRA (community photos)`)
      const imageUrls = await fetchLocationGalleryHighQuality(destination, 8)

      console.log(`✅ [BLOG] Found ${imageUrls.length} images for ${destination}`)

      // Convert to blog images with varying sizes
      const sizes: Array<'small' | 'medium' | 'large' | 'full'> = [
        'full',    // Hero image
        'large',   // Section image
        'medium',  // Day image
        'large',   // Section image
        'medium',  // Day image
        'small',   // Inline image
        'medium',  // Day image
        'large'    // Closing image
      ]

      imageUrls.forEach((url, index) => {
        images.push({
          url,
          alt: `${destination} - ${index + 1}`,
          caption: undefined,
          size: sizes[index] || 'medium',
          aspectRatio: '16:9', // Always 16:9 as requested
          position: index
        })
      })

      console.log(`✅ Fetched ${images.length} destination-specific images`)
    } catch (error) {
      console.error('Error fetching destination images:', error)
    }

    return images
  }

  /**
   * Generate map data with markers and routes
   */
  private static async generateMapData(
    trip: any,
    content: any
  ): Promise<MapData | undefined> {
    const locationData = trip.location_data

    if (!locationData) return undefined

    const markers: MapData['markers'] = []
    const route: MapData['route'] = []

    // Add start location
    if (locationData.start) {
      // In real implementation, geocode the location
      markers.push({
        position: { lat: 0, lng: 0 }, // Placeholder - geocode in real implementation
        title: locationData.start,
        description: 'Starting point'
      })
    }

    // Add end location
    if (locationData.end && locationData.end !== locationData.start) {
      markers.push({
        position: { lat: 0, lng: 0 }, // Placeholder
        title: locationData.end,
        description: 'Ending point'
      })
    }

    // Add day locations from content
    if (content.days) {
      content.days.forEach((day: any) => {
        if (day.location?.coordinates) {
          markers.push({
            position: day.location.coordinates,
            title: day.location.name || `Day ${day.day_number}`,
            description: day.title
          })
          route.push(day.location.coordinates)
        }
      })
    }

    return {
      center: markers[0]?.position || { lat: 0, lng: 0 },
      zoom: 10,
      markers,
      route: route.length > 1 ? route : undefined
    }
  }

  /**
   * Translate Asian text (Japanese, Chinese, Korean signs)
   */
  private static async translateAsianText(
    content: any,
    trip: any
  ): Promise<any> {
    const asianCountries = ['Japan', 'China', 'Korea', 'Thailand', 'Vietnam']
    const isAsianDestination = asianCountries.some(country =>
      trip.destination?.includes(country) || trip.location_data?.countries?.includes(country)
    )

    if (!isAsianDestination) return content

    console.log('🈯 Translating Asian text...')

    // In real implementation, use translation API
    // For now, add romanization hints
    const translatedContent = { ...content }

    if (translatedContent.days) {
      translatedContent.days = translatedContent.days.map((day: any) => ({
        ...day,
        location: day.location ? {
          ...day.location,
          translatedName: day.location.name // Placeholder - translate in real implementation
        } : undefined
      }))
    }

    return translatedContent
  }

  /**
   * Add emotional narrative based on persona type
   */
  private static addEmotionalNarrative(
    content: any,
    personaType?: string
  ): { introduction: string; story: string } {
    const emotionalHooks: Record<string, string> = {
      adventure: "My heart was racing as I stood at the edge, knowing this moment would change everything...",
      luxury: "There are moments in life when time seems to slow down, when every detail becomes a memory worth savoring...",
      cultural: "In the quiet spaces between ancient stones and modern life, I found something I didn't know I was searching for...",
      family: "Watching my children's eyes light up with wonder reminded me why we travel—not just to see new places, but to see the world through their eyes...",
      'digital-nomad': "Sometimes the best office has no walls, just an ocean view and the freedom to work from anywhere...",
      backpacking: "With everything I owned on my back and the whole world ahead of me, I felt more alive than ever...",
      wellness: "The moment I let go of everything weighing me down, I finally understood what it means to truly breathe...",
      photography: "Through my lens, I saw not just a place, but a thousand untold stories waiting to be captured...",
      educational: "The best classroom has no walls—just endless curiosity and the joy of discovery...",
      workation: "Balancing deadlines and sunsets taught me that work and life don't have to be separate—they can be beautifully intertwined..."
    }

    const hook = emotionalHooks[personaType || 'adventure'] || emotionalHooks.adventure

    return {
      introduction: `${hook}\n\n${content.introduction || ''}`,
      story: hook
    }
  }

  /**
   * Generate strategic ad placements
   */
  private static generateAdPlacements(content: any): AdPlacement[] {
    const placements: AdPlacement[] = []

    // Top horizontal ad (after introduction)
    placements.push({
      type: 'horizontal',
      position: 'top',
      afterSection: 'introduction',
      slot: 'blog-top-horizontal'
    })

    // Sidebar vertical ad (sticky)
    placements.push({
      type: 'vertical',
      position: 'sidebar',
      slot: 'blog-sidebar-vertical'
    })

    // Middle rectangular ad (between days)
    const dayCount = content.days?.length || 0
    if (dayCount > 3) {
      placements.push({
        type: 'rectangular',
        position: 'middle',
        afterSection: `day-${Math.floor(dayCount / 2)}`,
        slot: 'blog-middle-rectangular'
      })
    }

    // Bottom horizontal ad (before practical info)
    placements.push({
      type: 'horizontal',
      position: 'bottom',
      afterSection: 'days',
      slot: 'blog-bottom-horizontal'
    })

    return placements
  }

  /**
   * Distribute images throughout content with varying sizes
   * AND generate smart affiliate links for activities
   */
  private static distributeImages(
    days: DayContent[],
    images: BlogImage[]
  ): DayContent[] {
    if (!days || days.length === 0) return days

    // Skip first image (used as featured)
    const availableImages = images.slice(1)

    return days.map((day, index) => {
      const dayImages = availableImages.filter(img =>
        img.position === index + 1 || img.position === index + 2
      )

      // Generate smart affiliate links for this day's activities
      const smartAffiliateLinks = day.activities && day.location?.name
        ? generateSmartLinksForActivities(day.activities, day.location.name)
        : []

      return {
        ...day,
        images: dayImages.length > 0 ? dayImages : undefined,
        smartAffiliateLinks: smartAffiliateLinks.length > 0 ? smartAffiliateLinks : undefined
      }
    })
  }
}

