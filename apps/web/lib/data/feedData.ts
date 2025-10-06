// Feed data for Instagram-style travel feed

export interface FeedPost {
  id: string
  user: {
    username: string
    name: string
    avatar: string
    verified: boolean
  }
  location: string
  locationSlug?: string // Add slug for linking to detail pages
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
  {
    id: 'trending',
    name: 'Trending',
    emoji: '🔥',
    image: 'https://picsum.photos/100/100?random=30',
    isActive: true
  },
  {
    id: 'mountains',
    name: 'Mountains',
    emoji: '🏔️',
    image: 'https://picsum.photos/100/100?random=31',
    isActive: false
  },
  {
    id: 'beaches',
    name: 'Beaches',
    emoji: '🏖️',
    image: 'https://picsum.photos/100/100?random=32',
    isActive: false
  },
  {
    id: 'cities',
    name: 'Cities',
    emoji: '🏙️',
    image: 'https://picsum.photos/100/100?random=33',
    isActive: false
  },
  {
    id: 'food',
    name: 'Food',
    emoji: '🍜',
    image: 'https://picsum.photos/100/100?random=34',
    isActive: false
  },
  {
    id: 'culture',
    name: 'Culture',
    emoji: '🏛️',
    image: 'https://picsum.photos/100/100?random=35',
    isActive: false
  },
  {
    id: 'adventure',
    name: 'Adventure',
    emoji: '🎒',
    image: 'https://picsum.photos/100/100?random=36',
    isActive: false
  }
]

export const feedPosts: FeedPost[] = [
  {
    id: '1',
    user: {
      username: 'sarah_wanderlust',
      name: 'Sarah Chen',
      avatar: 'https://picsum.photos/150/150?random=20',
      verified: true
    },
    location: 'Banff National Park, Canada',
    locationSlug: 'banff-national-park',
    media: {
      type: 'carousel',
      items: [
        {
          url: 'https://picsum.photos/800/800?random=1',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=1'
        },
        {
          url: 'https://picsum.photos/800/800?random=2',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=2'
        },
        {
          url: 'https://picsum.photos/800/800?random=3',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=3'
        },
        {
          url: 'https://picsum.photos/800/800?random=4',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=4'
        }
      ]
    },
    caption: 'Morning hike to Lake Louise 🏔️ The reflection was absolutely perfect today! Sometimes you have to wake up at 5am for moments like these ✨ #BanffNationalPark #LakeLouise #CanadianRockies',
    likes: 1247,
    comments: 89,
    timeAgo: '2 hours ago',
    isLiked: false,
    isBookmarked: false
  },
  {
    id: '2',
    user: {
      username: 'marco_adventures',
      name: 'Marco Rodriguez',
      avatar: 'https://picsum.photos/150/150?random=21',
      verified: false
    },
    location: 'Santorini, Greece',
    locationSlug: 'santorini',
    media: {
      type: 'video',
      items: [
        {
          url: 'https://picsum.photos/800/800?random=5',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=5'
        }
      ]
    },
    caption: 'Sunset dinner in Oia never gets old 🌅 This little taverna has the best moussaka I\'ve ever tasted! Local tip: arrive 30 minutes before sunset for the best tables 🍽️',
    likes: 892,
    comments: 56,
    timeAgo: '4 hours ago',
    isLiked: true,
    isBookmarked: true
  },
  {
    id: '3',
    user: {
      username: 'tokyo_foodie',
      name: 'Yuki Tanaka',
      avatar: 'https://picsum.photos/150/150?random=22',
      verified: true
    },
    location: 'Shibuya, Tokyo',
    locationSlug: 'tokyo',
    media: {
      type: 'image',
      items: [
        {
          url: 'https://picsum.photos/800/800?random=6',
          type: 'image'
        }
      ]
    },
    caption: 'Found this hidden ramen shop in a tiny alley 🍜 No English menu, no tourists, just incredible tonkotsu ramen. This is why I love exploring Tokyo\'s backstreets! #TokyoFood #RamenHunt',
    likes: 2156,
    comments: 134,
    timeAgo: '6 hours ago',
    isLiked: false,
    isBookmarked: false
  },
  {
    id: '4',
    user: {
      username: 'nordic_nomad',
      name: 'Erik Larsson',
      avatar: 'https://picsum.photos/150/150?random=23',
      verified: false
    },
    location: 'Lofoten Islands, Norway',
    locationSlug: 'lofoten-islands',
    media: {
      type: 'video',
      items: [
        {
          url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop&crop=entropy',
          type: 'video',
          thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop&crop=entropy'
        }
      ]
    },
    caption: 'Northern Lights dancing over the fjords ✨ Waited 3 hours in -15°C but it was absolutely worth it! The aurora forecast said weak activity but nature had other plans 🌌 #NorthernLights #Lofoten #Norway',
    likes: 3421,
    comments: 198,
    timeAgo: '8 hours ago',
    isLiked: true,
    isBookmarked: true
  },
  {
    id: '5',
    user: {
      username: 'desert_dreams',
      name: 'Amira Hassan',
      avatar: 'https://picsum.photos/150/150?random=24',
      verified: true
    },
    location: 'Sahara Desert, Morocco',
    locationSlug: 'sahara-desert',
    media: {
      type: 'carousel',
      items: [
        {
          url: 'https://picsum.photos/800/800?random=7',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=7'
        },
        {
          url: 'https://picsum.photos/800/800?random=8',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=8'
        },
        {
          url: 'https://picsum.photos/800/800?random=9',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=9'
        },
        {
          url: 'https://picsum.photos/800/800?random=10',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=10'
        }
      ]
    },
    caption: 'Camel trekking into the Sahara at golden hour 🐪 Three days without wifi, just endless dunes and star-filled nights. Sometimes disconnecting is exactly what you need ⭐ #SaharaDesert #Morocco #DigitalDetox',
    likes: 1876,
    comments: 92,
    timeAgo: '12 hours ago',
    isLiked: false,
    isBookmarked: false
  },
  {
    id: '6',
    user: {
      username: 'island_hopper',
      name: 'Maya Patel',
      avatar: 'https://picsum.photos/150/150?random=25',
      verified: true
    },
    location: 'Bali, Indonesia',
    locationSlug: 'bali',
    media: {
      type: 'video',
      items: [
        {
          url: 'https://picsum.photos/800/800?random=11',
          type: 'image',
          thumbnail: 'https://picsum.photos/100/100?random=11'
        }
      ]
    },
    caption: 'Sunrise yoga session overlooking the rice terraces 🧘‍♀️ There\'s something magical about practicing as the world wakes up around you. The sound of nature is the best meditation music 🌅 #BaliYoga #RiceTerraces #MindfulTravel',
    likes: 2341,
    comments: 167,
    timeAgo: '1 day ago',
    isLiked: true,
    isBookmarked: false
  }
]
