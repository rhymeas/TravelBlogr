// Auto-generated realistic feed data using actual location images
// Generated: 2025-10-09T05:48:38.051Z

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

export const feedPosts: FeedPost[] = [
  {
    "id": "post-1",
    "user": {
      "username": "sarah_wanderlust",
      "name": "Sarah Chen",
      "avatar": "https://i.pravatar.cc/150?img=1",
      "verified": true
    },
    "location": "Regional District of Central Okanagan",
    "locationSlug": "regional-district-of-central-okanagan",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/d/da/June_13%2C_2010_Oliver_Mudslide_through_vineyard.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Kelowna_Vineyard_overlooking_Okanagan_Lake.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/9/99/Vines_in_the_Okanagan_Valley.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Vaseux_Lake_BC_Jl_%2713_-_P1100485.jpg",
          "type": "image"
        }
      ]
    },
    "caption": "Absolutely breathtaking views! 🌅 Can't believe I'm finally here!",
    "likes": 3804,
    "comments": 136,
    "timeAgo": "2h ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-2",
    "user": {
      "username": "marco_explorer",
      "name": "Marco Silva",
      "avatar": "https://i.pravatar.cc/150?img=13",
      "verified": false
    },
    "location": "New York City",
    "locationSlug": "new-york",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Standing_Out_%28192213915%29.jpeg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Empire_State_Building_Cityscape_at_Dusk.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/New_York_City_from_Liberty_Island_2001_1.jpg",
          "type": "image"
        }
      ]
    },
    "caption": "This place exceeded all my expectations ✨ Highly recommend!",
    "likes": 2075,
    "comments": 375,
    "timeAgo": "5h ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-3",
    "user": {
      "username": "emma_travels",
      "name": "Emma Johnson",
      "avatar": "https://i.pravatar.cc/150?img=5",
      "verified": true
    },
    "location": "Vilnius",
    "locationSlug": "vilnius",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Trakai_Island.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/9/90/339_vilnius_Mindaugas_Tries_Time_Travel_%2822227687610%29.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Gates_of_Dawn_%289651321601%29.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/1/19/Vilnius_Landmarks_134.jpg",
          "type": "image"
        }
      ]
    },
    "caption": "Living my best life in this amazing city 🎉",
    "likes": 205,
    "comments": 321,
    "timeAgo": "1d ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-4",
    "user": {
      "username": "alex_adventures",
      "name": "Alex Kim",
      "avatar": "https://i.pravatar.cc/150?img=8",
      "verified": false
    },
    "location": "Sunshine Coast Regional",
    "locationSlug": "sunshine-coast-regional",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://images.pexels.com/photos/16373216/pexels-photo-16373216.jpeg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/28096752/pexels-photo-28096752.jpeg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/10847343/pexels-photo-10847343.jpeg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/59924/pexels-photo-59924.jpeg",
          "type": "image"
        }
      ]
    },
    "caption": "Found paradise! 🏝️ Who else has been here?",
    "likes": 2483,
    "comments": 183,
    "timeAgo": "2d ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-5",
    "user": {
      "username": "lisa_nomad",
      "name": "Lisa Martinez",
      "avatar": "https://i.pravatar.cc/150?img=9",
      "verified": false
    },
    "location": "Tokyo",
    "locationSlug": "tokyo",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/6/66/Tokyo_Skyline20210123.jpg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/34198247/pexels-photo-34198247.jpeg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/2816904/pexels-photo-2816904.jpeg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/2849145/pexels-photo-2849145.jpeg",
          "type": "image"
        }
      ]
    },
    "caption": "The architecture here is simply stunning 🏛️",
    "likes": 4808,
    "comments": 258,
    "timeAgo": "3d ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-6",
    "user": {
      "username": "sarah_wanderlust",
      "name": "Sarah Chen",
      "avatar": "https://i.pravatar.cc/150?img=1",
      "verified": true
    },
    "location": "Sechelt",
    "locationSlug": "sechelt",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://images.metmuseum.org/CRDImages/ep/original/DT5549.jpg",
          "type": "image"
        },
        {
          "url": "https://images.metmuseum.org/CRDImages/es/original/DP158590.jpg",
          "type": "image"
        },
        {
          "url": "https://images.metmuseum.org/CRDImages/ep/original/DP278968.jpg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/34212603/pexels-photo-34212603.jpeg",
          "type": "image"
        }
      ]
    },
    "caption": "Sunset views that take your breath away 🌇",
    "likes": 2659,
    "comments": 263,
    "timeAgo": "2h ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-7",
    "user": {
      "username": "marco_explorer",
      "name": "Marco Silva",
      "avatar": "https://i.pravatar.cc/150?img=13",
      "verified": false
    },
    "location": "Vancouver",
    "locationSlug": "vancouver",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://images.metmuseum.org/CRDImages/ep/original/DT5549.jpg",
          "type": "image"
        },
        {
          "url": "https://images.metmuseum.org/CRDImages/es/original/DP158590.jpg",
          "type": "image"
        },
        {
          "url": "https://images.metmuseum.org/CRDImages/ep/original/DP278968.jpg",
          "type": "image"
        },
        {
          "url": "https://images.pexels.com/photos/2382874/pexels-photo-2382874.jpeg",
          "type": "image"
        }
      ]
    },
    "caption": "Exploring hidden gems in this beautiful place 💎",
    "likes": 1531,
    "comments": 169,
    "timeAgo": "5h ago",
    "isLiked": false,
    "isBookmarked": false
  },
  {
    "id": "post-8",
    "user": {
      "username": "emma_travels",
      "name": "Emma Johnson",
      "avatar": "https://i.pravatar.cc/150?img=5",
      "verified": true
    },
    "location": "Rome",
    "locationSlug": "rome",
    "media": {
      "type": "carousel",
      "items": [
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Reflections_Under_Ponte_Sisto_%28176955597%29.jpeg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Rome%2C_Italy%2C_Rome_Eternal_%28Roma_Caput_Mundi%2C_The_Eternal_City%29.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Rome_Landmark%2C_Site_of_first_African_American_school.jpg",
          "type": "image"
        },
        {
          "url": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Asser_Levy_Recreation_Center.jpg",
          "type": "image"
        }
      ]
    },
    "caption": "Travel goals achieved! ✈️ Where should I go next?",
    "likes": 2479,
    "comments": 17,
    "timeAgo": "1d ago",
    "isLiked": false,
    "isBookmarked": false
  }
]
