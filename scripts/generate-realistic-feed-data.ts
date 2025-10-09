/**
 * Generate realistic feed data using actual location images from database
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateFeedData() {
  console.log('🎨 Generating realistic feed data...\n')
  
  // Fetch locations with images
  const { data: locations, error } = await supabase
    .from('locations')
    .select('name, slug, featured_image, gallery_images')
    .not('gallery_images', 'is', null)
    .limit(10)
  
  if (error || !locations) {
    console.error('❌ Error fetching locations:', error)
    return
  }
  
  console.log(`✅ Found ${locations.length} locations with images\n`)
  
  // Mock users
  const users = [
    { username: 'sarah_wanderlust', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
    { username: 'marco_explorer', name: 'Marco Silva', avatar: 'https://i.pravatar.cc/150?img=13' },
    { username: 'emma_travels', name: 'Emma Johnson', avatar: 'https://i.pravatar.cc/150?img=5' },
    { username: 'alex_adventures', name: 'Alex Kim', avatar: 'https://i.pravatar.cc/150?img=8' },
    { username: 'lisa_nomad', name: 'Lisa Martinez', avatar: 'https://i.pravatar.cc/150?img=9' }
  ]
  
  // Captions templates
  const captionTemplates = [
    "Absolutely breathtaking views! 🌅 Can't believe I'm finally here!",
    "This place exceeded all my expectations ✨ Highly recommend!",
    "Living my best life in this amazing city 🎉",
    "Found paradise! 🏝️ Who else has been here?",
    "The architecture here is simply stunning 🏛️",
    "Sunset views that take your breath away 🌇",
    "Exploring hidden gems in this beautiful place 💎",
    "Travel goals achieved! ✈️ Where should I go next?",
    "This is what dreams are made of 🌟",
    "Wanderlust level: Maximum! 🗺️"
  ]
  
  // Generate feed posts
  const feedPosts = locations.slice(0, 8).map((location, index) => {
    const user = users[index % users.length]
    const images = location.gallery_images || []
    const mediaType = images.length > 3 ? 'carousel' : images.length > 1 ? 'carousel' : 'image'
    
    return {
      id: `post-${index + 1}`,
      user: {
        ...user,
        verified: Math.random() > 0.5
      },
      location: location.name,
      locationSlug: location.slug,
      media: {
        type: mediaType,
        items: mediaType === 'carousel' 
          ? images.slice(0, 4).map((url: string) => ({ url, type: 'image' as const }))
          : [{ url: location.featured_image || images[0], type: 'image' as const }]
      },
      caption: captionTemplates[index % captionTemplates.length],
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 500) + 10,
      timeAgo: ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago'][index % 5],
      isLiked: false,
      isBookmarked: false
    }
  })
  
  // Generate TypeScript file
  const tsContent = `// Auto-generated realistic feed data using actual location images
// Generated: ${new Date().toISOString()}

export interface FeedPost {
  id: string
  user: {
    username: string
    name: string
    avatar: string
    verified: boolean
  }
  location: string
  locationSlug?: string
  media: {
    type: 'image' | 'video' | 'carousel'
    items: Array<{
      url: string
      type: 'image' | 'video'
      thumbnail?: string
    }>
  }
  caption: string
  likes: number
  comments: number
  timeAgo: string
  isLiked: boolean
  isBookmarked: boolean
}

export interface LocationFilter {
  id: string
  name: string
  emoji: string
  image: string
  isActive: boolean
}

export const locationFilters: LocationFilter[] = [
  { id: 'all', name: 'All', emoji: '🌍', image: '', isActive: true },
  { id: 'beaches', name: 'Beaches', emoji: '🏖️', image: '', isActive: false },
  { id: 'mountains', name: 'Mountains', emoji: '⛰️', image: '', isActive: false },
  { id: 'cities', name: 'Cities', emoji: '🏙️', image: '', isActive: false },
  { id: 'nature', name: 'Nature', emoji: '🌲', image: '', isActive: false },
  { id: 'culture', name: 'Culture', emoji: '🏛️', image: '', isActive: false },
  { id: 'food', name: 'Food', emoji: '🍜', image: '', isActive: false },
  { id: 'adventure', name: 'Adventure', emoji: '🎒', image: '', isActive: false }
]

export const feedPosts: FeedPost[] = ${JSON.stringify(feedPosts, null, 2)}
`
  
  // Write to file
  const outputPath = path.join(process.cwd(), 'apps/web/lib/data/feedData.ts')
  fs.writeFileSync(outputPath, tsContent, 'utf-8')
  
  console.log(`✅ Generated ${feedPosts.length} realistic feed posts`)
  console.log(`📝 Written to: ${outputPath}`)
  console.log('\nSample posts:')
  feedPosts.slice(0, 3).forEach(post => {
    console.log(`  - ${post.user.name} in ${post.location} (${post.media.items.length} images)`)
  })
}

generateFeedData()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

