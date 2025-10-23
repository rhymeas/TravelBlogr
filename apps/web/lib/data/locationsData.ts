export interface LocationActivity {
  id: string
  name: string
  description: string
  completed: boolean
  category: 'outdoor' | 'cultural' | 'food' | 'adventure' | 'relaxation'
  difficulty?: 'easy' | 'moderate' | 'hard'
  duration?: string
  cost?: 'free' | 'low' | 'medium' | 'high'
  latitude?: number
  longitude?: number
  // Optional enrichments
  image_url?: string
  link_url?: string
  link_source?: 'wikipedia' | 'wikivoyage' | 'google' | 'official' | 'booking' | 'guide'
}

export interface LocationRestaurant {
  id: string
  name: string
  description: string
  cuisine: string
  price_range: '$' | '$$' | '$$$' | '$$$$'
  rating: number
  image: string
  website?: string
  address: string
  phone?: string
  specialties: string[]
  latitude?: number
  longitude?: number
}

export interface LocationExperience {
  id: string
  title: string
  description: string
  image: string
  category: 'unique' | 'seasonal' | 'local' | 'adventure' | 'cultural'
  best_time?: string
  duration?: string
  booking_required: boolean
  contact_info?: string
}

export interface LocationDidYouKnow {
  id: string
  title: string
  content: string
  category: 'history' | 'culture' | 'nature' | 'fun_fact' | 'local_tip'
  icon?: string
}

export interface Location {
  id: string
  name: string
  slug: string
  country: string
  region: string
  description: string
  featured_image: string
  rating: number
  rating_count?: number
  visit_count: number
  view_count?: number
  is_featured: boolean
  created_at: string
  images: string[]
  posts: LocationPost[]
  activities: LocationActivity[]
  restaurants: LocationRestaurant[]
  experiences: LocationExperience[]
  did_you_know: LocationDidYouKnow[]
  latitude?: number
  longitude?: number
  // Raw DB fields (used for precise gallery actions)
  db_gallery_images?: string[]
  db_featured_image?: string | null
}

export interface LocationPost {
  id: string
  title: string
  excerpt: string
  image: string
  author: string
  date: string
  likes: number
  views: number
}

// Location data with proper slugs for URL routing
export const locations: Location[] = [
  {
    id: '1',
    name: 'Banff National Park',
    slug: 'banff-national-park',
    country: 'Canada',
    region: 'Alberta',
    description: 'A stunning mountain wilderness in the Canadian Rockies, featuring pristine lakes, towering peaks, and abundant wildlife. One of Canada\'s most visited national parks.',
    featured_image: 'https://picsum.photos/1200/800?random=100',
    rating: 4.9,
    visit_count: 45600,
    is_featured: true,
    created_at: '2024-01-15',
    images: [
      'https://picsum.photos/800/600?random=101',
      'https://picsum.photos/800/600?random=102',
      'https://picsum.photos/800/600?random=103',
      'https://picsum.photos/800/600?random=104',
      'https://picsum.photos/800/600?random=105'
    ],
    posts: [
      {
        id: '1',
        title: 'Morning Hike to Lake Louise',
        excerpt: 'The reflection was absolutely perfect today! Sometimes you have to wake up at 5am for moments like these.',
        image: 'https://picsum.photos/400/300?random=110',
        author: 'Sarah Chen',
        date: '2024-01-20',
        likes: 1247,
        views: 5200
      },
      {
        id: '2',
        title: 'Wildlife Photography Tips',
        excerpt: 'Spotted a family of elk during golden hour. Here are my tips for capturing wildlife in Banff.',
        image: 'https://picsum.photos/400/300?random=111',
        author: 'Nature Photographer',
        date: '2024-01-18',
        likes: 892,
        views: 3400
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Hike to Lake Louise',
        description: 'Iconic turquoise lake surrounded by snow-capped peaks',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2-3 hours',
        cost: 'free'
      },
      {
        id: '2',
        name: 'Visit Moraine Lake',
        description: 'Famous "Twenty Dollar Bill" lake view',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '1-2 hours',
        cost: 'free'
      },
      {
        id: '3',
        name: 'Ride the Banff Gondola',
        description: 'Panoramic views from Sulphur Mountain summit',
        completed: false,
        category: 'adventure',
        difficulty: 'easy',
        duration: '2-3 hours',
        cost: 'high'
      },
      {
        id: '4',
        name: 'Soak in Banff Hot Springs',
        description: 'Natural thermal pools with mountain views',
        completed: false,
        category: 'relaxation',
        difficulty: 'easy',
        duration: '1-2 hours',
        cost: 'medium'
      },
      {
        id: '5',
        name: 'Explore Johnston Canyon',
        description: 'Walk to frozen waterfalls in winter',
        completed: false,
        category: 'outdoor',
        difficulty: 'moderate',
        duration: '3-4 hours',
        cost: 'free'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'The Bison Restaurant',
        description: 'Farm-to-table dining featuring locally sourced Canadian cuisine with mountain views',
        cuisine: 'Canadian',
        price_range: '$$$',
        rating: 4.7,
        image: 'https://picsum.photos/400/300?random=201',
        website: 'https://thebison.ca',
        address: '211 Bear Street, Banff, AB',
        phone: '+1 403-762-5550',
        specialties: ['Bison Tenderloin', 'Alberta Beef', 'Wild Game', 'Local Trout']
      },
      {
        id: '2',
        name: 'Juniper Bistro',
        description: 'Contemporary bistro with panoramic mountain views and innovative cuisine',
        cuisine: 'Contemporary',
        price_range: '$$$$',
        rating: 4.8,
        image: 'https://picsum.photos/400/300?random=202',
        website: 'https://thejuniper.com',
        address: '1 Juniper Way, Banff, AB',
        phone: '+1 403-763-6205',
        specialties: ['Tasting Menu', 'Wine Pairings', 'Seasonal Dishes', 'Mountain Views']
      },
      {
        id: '3',
        name: 'Tooloulou\'s',
        description: 'Cajun and Creole cuisine bringing New Orleans flavors to the Rockies',
        cuisine: 'Cajun/Creole',
        price_range: '$$',
        rating: 4.5,
        image: 'https://picsum.photos/400/300?random=203',
        address: '120 Banff Avenue, Banff, AB',
        phone: '+1 403-762-3848',
        specialties: ['Jambalaya', 'Gumbo', 'Po\' Boys', 'Beignets']
      },
      {
        id: '4',
        name: 'Park Distillery',
        description: 'Local distillery and restaurant featuring house-made spirits and hearty mountain fare',
        cuisine: 'Pub/Distillery',
        price_range: '$$',
        rating: 4.4,
        image: 'https://picsum.photos/400/300?random=204',
        website: 'https://parkdistillery.com',
        address: '219 Banff Avenue, Banff, AB',
        phone: '+1 403-762-5114',
        specialties: ['House Spirits', 'Craft Cocktails', 'Elk Burger', 'Poutine']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Ice Walk in Johnston Canyon',
        description: 'Experience the magic of frozen waterfalls on a guided ice walk through Johnston Canyon. Professional guides provide ice cleats and share stories of the canyon\'s formation.',
        image: 'https://picsum.photos/400/300?random=301',
        category: 'seasonal',
        best_time: 'December - March',
        duration: '3 hours',
        booking_required: true,
        contact_info: 'Discover Banff Tours: +1 403-760-5007'
      },
      {
        id: '2',
        title: 'Sunrise Photography at Moraine Lake',
        description: 'Join a professional photographer for an early morning shoot at one of the world\'s most photographed lakes. Learn composition techniques while capturing the perfect shot.',
        image: 'https://picsum.photos/400/300?random=302',
        category: 'unique',
        best_time: 'June - September',
        duration: '4 hours',
        booking_required: true,
        contact_info: 'Banff Photo Walks: info@banffphotowalks.com'
      },
      {
        id: '3',
        title: 'Indigenous Cultural Experience',
        description: 'Learn about the traditional ways of the Stoney Nakoda people through storytelling, traditional crafts, and a sacred smudging ceremony.',
        image: 'https://picsum.photos/400/300?random=303',
        category: 'cultural',
        duration: '2 hours',
        booking_required: true,
        contact_info: 'Mahikan Trails: +1 403-762-2343'
      },
      {
        id: '4',
        title: 'Helicopter Tour of the Rockies',
        description: 'See Banff from above on a scenic helicopter flight over glaciers, alpine lakes, and towering peaks. Multiple tour lengths available.',
        image: 'https://picsum.photos/400/300?random=304',
        category: 'adventure',
        best_time: 'May - October',
        duration: '20 minutes - 2 hours',
        booking_required: true,
        contact_info: 'Alpine Helicopters: +1 403-678-4802'
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Canada\'s First National Park',
        content: 'Banff was established in 1885 as Canada\'s first national park and is part of the Canadian Rocky Mountain Parks UNESCO World Heritage Site.',
        category: 'history'
      },
      {
        id: '2',
        title: 'The Fairmont Banff Springs Hotel',
        content: 'Known as the "Castle in the Rockies," this iconic hotel was built by the Canadian Pacific Railway in 1888 and is said to be haunted by a bride who died on her wedding day.',
        category: 'fun_fact'
      },
      {
        id: '3',
        title: 'Lake Louise\'s Color Secret',
        content: 'The stunning turquoise color comes from rock flour - fine particles of glacial silt suspended in the water that reflect blue and green wavelengths of light.',
        category: 'nature'
      },
      {
        id: '4',
        title: 'Best Photography Times',
        content: 'For the best photos at Moraine Lake, arrive before 6 AM during summer months. The lake is often crowded by 8 AM, and parking fills up quickly.',
        category: 'local_tip'
      },
      {
        id: '5',
        title: 'Wildlife Safety',
        content: 'Banff is home to both black bears and grizzly bears. Always carry bear spray, make noise while hiking, and never approach or feed wildlife.',
        category: 'local_tip'
      }
    ]
  },
  {
    id: '2',
    name: 'Santorini',
    slug: 'santorini',
    country: 'Greece',
    region: 'Cyclades',
    description: 'A breathtaking Greek island known for its white-washed buildings, blue-domed churches, and spectacular sunsets over the Aegean Sea.',
    featured_image: 'https://picsum.photos/1200/800?random=120',
    rating: 4.8,
    visit_count: 38900,
    is_featured: true,
    created_at: '2024-01-10',
    images: [
      'https://picsum.photos/800/600?random=121',
      'https://picsum.photos/800/600?random=122',
      'https://picsum.photos/800/600?random=123',
      'https://picsum.photos/800/600?random=124',
      'https://picsum.photos/800/600?random=125'
    ],
    posts: [
      {
        id: '3',
        title: 'Sunset in Oia Village',
        excerpt: 'The most magical sunset I\'ve ever witnessed. The colors were absolutely incredible.',
        image: 'https://picsum.photos/400/300?random=130',
        author: 'Marco Adventures',
        date: '2024-01-15',
        likes: 2156,
        views: 8900
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Watch Sunset in Oia',
        description: 'Experience the world-famous Santorini sunset from the best viewpoint',
        completed: false,
        category: 'cultural',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'free'
      },
      {
        id: '2',
        name: 'Visit Red Beach',
        description: 'Unique red volcanic sand beach with dramatic cliffs',
        completed: false,
        category: 'outdoor',
        difficulty: 'moderate',
        duration: '3 hours',
        cost: 'free'
      },
      {
        id: '3',
        name: 'Wine Tasting Tour',
        description: 'Sample local Assyrtiko wines at traditional wineries',
        completed: false,
        category: 'food',
        difficulty: 'easy',
        duration: '4 hours',
        cost: 'high'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Ambrosia Restaurant',
        description: 'Fine dining with caldera views and modern Greek cuisine',
        cuisine: 'Greek',
        price_range: '$$$$',
        rating: 4.9,
        image: 'https://picsum.photos/400/300?random=401',
        address: 'Oia, Santorini',
        specialties: ['Sea Bass', 'Santorini Fava', 'Local Wines', 'Sunset Views']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Catamaran Sunset Cruise',
        description: 'Sail around the caldera while watching the famous Santorini sunset',
        image: 'https://picsum.photos/400/300?random=501',
        category: 'unique',
        duration: '5 hours',
        booking_required: true
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Volcanic Origin',
        content: 'Santorini was formed by a massive volcanic eruption around 3,600 years ago, creating the distinctive caldera shape.',
        category: 'nature'
      }
    ]
  },
  {
    id: '3',
    name: 'Sahara Desert',
    slug: 'sahara-desert',
    country: 'Morocco',
    region: 'Merzouga',
    description: 'Experience the vastness and beauty of the world\'s largest hot desert. Camel treks, stargazing, and Berber culture await.',
    featured_image: 'https://picsum.photos/1200/800?random=140',
    rating: 4.7,
    visit_count: 22300,
    is_featured: true,
    created_at: '2024-01-05',
    images: [
      'https://picsum.photos/800/600?random=141',
      'https://picsum.photos/800/600?random=142',
      'https://picsum.photos/800/600?random=143',
      'https://picsum.photos/800/600?random=144',
      'https://picsum.photos/800/600?random=145'
    ],
    posts: [
      {
        id: '4',
        title: 'Camel Trek Adventure',
        excerpt: 'Three days in the desert with Berber guides. An unforgettable journey into the heart of the Sahara.',
        image: 'https://picsum.photos/400/300?random=150',
        author: 'Desert Explorer',
        date: '2024-01-12',
        likes: 1834,
        views: 6700
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Camel Trek to Erg Chebbi',
        description: 'Multi-day camel journey through the golden dunes',
        completed: false,
        category: 'adventure',
        difficulty: 'moderate',
        duration: '2-3 days',
        cost: 'medium'
      },
      {
        id: '2',
        name: 'Desert Stargazing',
        description: 'Experience the clearest night sky in the world',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'free'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Berber Camp Dining',
        description: 'Traditional Moroccan cuisine under the stars',
        cuisine: 'Moroccan',
        price_range: '$$',
        rating: 4.6,
        image: 'https://picsum.photos/400/300?random=601',
        address: 'Desert Camp, Merzouga',
        specialties: ['Tagine', 'Couscous', 'Mint Tea', 'Desert Bread']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Sunrise Hot Air Balloon',
        description: 'Float over the endless dunes at sunrise',
        image: 'https://picsum.photos/400/300?random=701',
        category: 'unique',
        duration: '3 hours',
        booking_required: true
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'World\'s Largest Hot Desert',
        content: 'The Sahara covers 9 million square kilometers, roughly the size of the United States.',
        category: 'nature'
      }
    ]
  },
  {
    id: '4',
    name: 'Peggy\'s Cove',
    slug: 'peggys-cove',
    country: 'Canada',
    region: 'Nova Scotia',
    description: 'A picturesque fishing village known for its iconic lighthouse and rugged coastal beauty. One of the most photographed locations in Canada.',
    featured_image: 'https://picsum.photos/1200/800?random=160',
    rating: 4.8,
    visit_count: 25600,
    is_featured: true,
    created_at: '2024-01-15',
    images: [
      'https://picsum.photos/800/600?random=161',
      'https://picsum.photos/800/600?random=162',
      'https://picsum.photos/800/600?random=163',
      'https://picsum.photos/800/600?random=164',
      'https://picsum.photos/800/600?random=165'
    ],
    posts: [
      {
        id: '5',
        title: 'Sunrise at the Lighthouse',
        excerpt: 'Captured the most incredible sunrise behind the iconic Peggy\'s Cove lighthouse. The golden hour light was absolutely magical.',
        image: 'https://picsum.photos/400/300?random=170',
        author: 'Sarah Photography',
        date: '2024-01-20',
        likes: 234,
        views: 1200
      },
      {
        id: '6',
        title: 'Local Fishing Culture',
        excerpt: 'Spent the morning with local fishermen learning about the traditional lobster fishing methods.',
        image: 'https://picsum.photos/400/300?random=171',
        author: 'Maritime Explorer',
        date: '2024-01-18',
        likes: 189,
        views: 890
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Visit Peggy\'s Point Lighthouse',
        description: 'Explore Canada\'s most famous lighthouse',
        completed: false,
        category: 'cultural',
        difficulty: 'easy',
        duration: '1 hour',
        cost: 'free'
      },
      {
        id: '2',
        name: 'Coastal Photography Walk',
        description: 'Capture the rugged Atlantic coastline',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'free'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Sou\'Wester Restaurant',
        description: 'Fresh seafood with ocean views',
        cuisine: 'Seafood',
        price_range: '$$',
        rating: 4.3,
        image: 'https://picsum.photos/400/300?random=801',
        address: 'Peggy\'s Cove, NS',
        specialties: ['Lobster Roll', 'Fish & Chips', 'Clam Chowder', 'Blueberry Pie']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Lighthouse Keeper Experience',
        description: 'Learn about maritime history and lighthouse operations',
        image: 'https://picsum.photos/400/300?random=901',
        category: 'cultural',
        duration: '1.5 hours',
        booking_required: false
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Postal Code H0H 0H0',
        content: 'The lighthouse has its own postal code and receives thousands of letters from around the world.',
        category: 'fun_fact'
      }
    ]
  },
  {
    id: '5',
    name: 'Tokyo',
    slug: 'tokyo',
    country: 'Japan',
    region: 'Kanto',
    description: 'A vibrant metropolis where ancient traditions meet cutting-edge technology. From serene temples to bustling districts, Tokyo offers endless discoveries.',
    featured_image: 'https://picsum.photos/1200/800?random=180',
    rating: 4.9,
    visit_count: 67800,
    is_featured: true,
    created_at: '2024-01-08',
    images: [
      'https://picsum.photos/800/600?random=181',
      'https://picsum.photos/800/600?random=182',
      'https://picsum.photos/800/600?random=183',
      'https://picsum.photos/800/600?random=184',
      'https://picsum.photos/800/600?random=185'
    ],
    posts: [
      {
        id: '7',
        title: 'Street Food Adventures',
        excerpt: 'Exploring Tokyo\'s incredible street food scene. From ramen to takoyaki, every bite is a revelation.',
        image: 'https://picsum.photos/400/300?random=190',
        author: 'Foodie Explorer',
        date: '2024-01-16',
        likes: 3421,
        views: 12400
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Visit Senso-ji Temple',
        description: 'Tokyo\'s oldest temple in historic Asakusa district',
        completed: false,
        category: 'cultural',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'free'
      },
      {
        id: '2',
        name: 'Explore Shibuya Crossing',
        description: 'Experience the world\'s busiest pedestrian crossing',
        completed: false,
        category: 'cultural',
        difficulty: 'easy',
        duration: '1 hour',
        cost: 'free'
      },
      {
        id: '3',
        name: 'Tsukiji Outer Market Food Tour',
        description: 'Sample fresh sushi and street food',
        completed: false,
        category: 'food',
        difficulty: 'easy',
        duration: '3 hours',
        cost: 'medium'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Jiro Dreams of Sushi',
        description: 'World-famous sushi restaurant by master Jiro Ono',
        cuisine: 'Japanese',
        price_range: '$$$$',
        rating: 4.9,
        image: 'https://picsum.photos/400/300?random=1001',
        address: 'Ginza, Tokyo',
        specialties: ['Omakase', 'Fresh Tuna', 'Sea Urchin', 'Traditional Sushi']
      },
      {
        id: '2',
        name: 'Ramen Yokocho',
        description: 'Traditional ramen alley with authentic local flavors',
        cuisine: 'Japanese',
        price_range: '$',
        rating: 4.6,
        image: 'https://picsum.photos/400/300?random=1002',
        address: 'Shinjuku, Tokyo',
        specialties: ['Tonkotsu Ramen', 'Miso Ramen', 'Gyoza', 'Beer']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Traditional Tea Ceremony',
        description: 'Learn the ancient art of Japanese tea ceremony',
        image: 'https://picsum.photos/400/300?random=1101',
        category: 'cultural',
        duration: '2 hours',
        booking_required: true
      },
      {
        id: '2',
        title: 'Robot Restaurant Show',
        description: 'Futuristic entertainment with robots and neon lights',
        image: 'https://picsum.photos/400/300?random=1102',
        category: 'unique',
        duration: '1.5 hours',
        booking_required: true
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Most Populous Metropolitan Area',
        content: 'Greater Tokyo is home to over 37 million people, making it the world\'s most populous metropolitan area.',
        category: 'fun_fact'
      },
      {
        id: '2',
        title: 'Vending Machine Capital',
        content: 'Tokyo has over 5 million vending machines - one for every 23 people!',
        category: 'fun_fact'
      }
    ]
  },
  {
    id: '6',
    name: 'Machu Picchu',
    slug: 'machu-picchu',
    country: 'Peru',
    region: 'Cusco',
    description: 'The ancient Incan citadel perched high in the Andes Mountains. A UNESCO World Heritage site and one of the New Seven Wonders of the World.',
    featured_image: 'https://picsum.photos/1200/800?random=200',
    rating: 4.9,
    visit_count: 34500,
    is_featured: true,
    created_at: '2024-01-12',
    images: [
      'https://picsum.photos/800/600?random=201',
      'https://picsum.photos/800/600?random=202',
      'https://picsum.photos/800/600?random=203',
      'https://picsum.photos/800/600?random=204',
      'https://picsum.photos/800/600?random=205'
    ],
    posts: [
      {
        id: '8',
        title: 'Inca Trail Journey',
        excerpt: 'Four days of hiking through cloud forests and ancient ruins. The sunrise over Machu Picchu was worth every step.',
        image: 'https://picsum.photos/400/300?random=210',
        author: 'Mountain Trekker',
        date: '2024-01-14',
        likes: 2876,
        views: 9800
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Hike the Inca Trail',
        description: 'Classic 4-day trek to Machu Picchu',
        completed: false,
        category: 'adventure',
        difficulty: 'hard',
        duration: '4 days',
        cost: 'high'
      },
      {
        id: '2',
        name: 'Climb Huayna Picchu',
        description: 'Steep hike for panoramic views of the citadel',
        completed: false,
        category: 'adventure',
        difficulty: 'hard',
        duration: '3 hours',
        cost: 'medium'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Sanctuary Lodge Restaurant',
        description: 'Fine dining with views of Machu Picchu',
        cuisine: 'Peruvian',
        price_range: '$$$$',
        rating: 4.5,
        image: 'https://picsum.photos/400/300?random=1201',
        address: 'Machu Picchu, Cusco',
        specialties: ['Quinoa Dishes', 'Alpaca', 'Pisco Sour', 'Andean Cuisine']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Sunrise at Machu Picchu',
        description: 'Watch the sun rise over the ancient citadel',
        image: 'https://picsum.photos/400/300?random=1301',
        category: 'unique',
        best_time: 'Early morning',
        duration: '2 hours',
        booking_required: true
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Lost City of the Incas',
        content: 'Machu Picchu was never discovered by Spanish conquistadors and remained hidden until American historian Hiram Bingham brought it to international attention in 1911.',
        category: 'history'
      }
    ]
  },
  {
    id: '7',
    name: 'Lofoten Islands',
    slug: 'lofoten-islands',
    country: 'Norway',
    region: 'Nordland',
    description: 'A spectacular archipelago in northern Norway, known for dramatic peaks rising directly from the sea, pristine beaches, and the midnight sun.',
    featured_image: 'https://picsum.photos/1200/800?random=220',
    rating: 4.9,
    visit_count: 18700,
    is_featured: true,
    created_at: '2024-01-06',
    images: [
      'https://picsum.photos/800/600?random=221',
      'https://picsum.photos/800/600?random=222',
      'https://picsum.photos/800/600?random=223',
      'https://picsum.photos/800/600?random=224',
      'https://picsum.photos/800/600?random=225'
    ],
    posts: [
      {
        id: '9',
        title: 'Northern Lights Photography',
        excerpt: 'Waited 3 hours in -15°C but it was absolutely worth it! The aurora forecast said weak activity but nature had other plans.',
        image: 'https://picsum.photos/400/300?random=230',
        author: 'Erik Larsson',
        date: '2024-01-14',
        likes: 3421,
        views: 11200
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Northern Lights Hunting',
        description: 'Chase the aurora borealis in the Arctic wilderness',
        completed: false,
        category: 'outdoor',
        difficulty: 'moderate',
        duration: '4-6 hours',
        cost: 'medium'
      },
      {
        id: '2',
        name: 'Midnight Sun Photography',
        description: 'Capture the sun that never sets during summer',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'free'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Anita\'s Seafood',
        description: 'Fresh Arctic seafood in a traditional fisherman\'s cabin',
        cuisine: 'Norwegian',
        price_range: '$$',
        rating: 4.7,
        image: 'https://picsum.photos/400/300?random=1401',
        address: 'Sakrisøy, Lofoten',
        specialties: ['King Crab', 'Arctic Char', 'Fish Soup', 'Stockfish']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Traditional Fishing Experience',
        description: 'Learn traditional Norwegian fishing methods with local fishermen',
        image: 'https://picsum.photos/400/300?random=1501',
        category: 'local',
        duration: '4 hours',
        booking_required: true
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Midnight Sun Phenomenon',
        content: 'From May to July, the sun never sets in Lofoten, providing 24 hours of daylight for photography and outdoor activities.',
        category: 'nature'
      }
    ]
  },
  {
    id: '8',
    name: 'Bali',
    slug: 'bali',
    country: 'Indonesia',
    region: 'Bali Province',
    description: 'The Island of the Gods offers a perfect blend of spiritual culture, stunning landscapes, and tropical paradise. From ancient temples to pristine beaches.',
    featured_image: 'https://picsum.photos/1200/800?random=240',
    rating: 4.8,
    visit_count: 89300,
    is_featured: true,
    created_at: '2024-01-04',
    images: [
      'https://picsum.photos/800/600?random=241',
      'https://picsum.photos/800/600?random=242',
      'https://picsum.photos/800/600?random=243',
      'https://picsum.photos/800/600?random=244',
      'https://picsum.photos/800/600?random=245'
    ],
    posts: [
      {
        id: '10',
        title: 'Temple Hopping Adventure',
        excerpt: 'Exploring the spiritual heart of Bali through its magnificent temples. Each one tells a unique story of devotion and artistry.',
        image: 'https://picsum.photos/400/300?random=250',
        author: 'Maya Patel',
        date: '2024-01-16',
        likes: 2876,
        views: 8900
      }
    ],
    activities: [
      {
        id: '1',
        name: 'Visit Tanah Lot Temple',
        description: 'Iconic temple perched on a rock formation in the sea',
        completed: false,
        category: 'cultural',
        difficulty: 'easy',
        duration: '2 hours',
        cost: 'low'
      },
      {
        id: '2',
        name: 'Sunrise Hike Mount Batur',
        description: 'Active volcano hike for spectacular sunrise views',
        completed: false,
        category: 'adventure',
        difficulty: 'moderate',
        duration: '6 hours',
        cost: 'medium'
      },
      {
        id: '3',
        name: 'Ubud Rice Terrace Walk',
        description: 'Explore the famous Jatiluwih rice terraces',
        completed: false,
        category: 'outdoor',
        difficulty: 'easy',
        duration: '3 hours',
        cost: 'low'
      }
    ],
    restaurants: [
      {
        id: '1',
        name: 'Locavore',
        description: 'Award-winning restaurant featuring modern Indonesian cuisine',
        cuisine: 'Indonesian',
        price_range: '$$$$',
        rating: 4.8,
        image: 'https://picsum.photos/400/300?random=1601',
        website: 'https://www.locavore.co.id',
        address: 'Ubud, Bali',
        specialties: ['Tasting Menu', 'Local Ingredients', 'Modern Indonesian', 'Wine Pairings']
      },
      {
        id: '2',
        name: 'Warung Babi Guling Ibu Oka',
        description: 'Famous local warung serving traditional Balinese roast pork',
        cuisine: 'Balinese',
        price_range: '$',
        rating: 4.5,
        image: 'https://picsum.photos/400/300?random=1602',
        address: 'Ubud, Bali',
        specialties: ['Babi Guling', 'Nasi Campur', 'Sambal', 'Local Spices']
      }
    ],
    experiences: [
      {
        id: '1',
        title: 'Traditional Balinese Cooking Class',
        description: 'Learn to cook authentic Balinese dishes with local families',
        image: 'https://picsum.photos/400/300?random=1701',
        category: 'cultural',
        duration: '4 hours',
        booking_required: true
      },
      {
        id: '2',
        title: 'Purification Ceremony at Tirta Empul',
        description: 'Participate in a traditional Hindu purification ritual',
        image: 'https://picsum.photos/400/300?random=1702',
        category: 'cultural',
        duration: '2 hours',
        booking_required: false
      }
    ],
    did_you_know: [
      {
        id: '1',
        title: 'Island of a Thousand Temples',
        content: 'Bali has over 20,000 temples and shrines, with each village required to have at least three temples.',
        category: 'culture'
      },
      {
        id: '2',
        title: 'Nyepi - Day of Silence',
        content: 'Once a year, the entire island observes Nyepi, a day of complete silence where no one is allowed outside, no lights are used, and even the airport closes.',
        category: 'culture'
      }
    ]
  }
]

// Helper function to get location by slug
export function getLocationBySlug(slug: string): Location | undefined {
  return locations.find(location => location.slug === slug)
}

// Helper function to get location by name (for backward compatibility)
export function getLocationByName(name: string): Location | undefined {
  return locations.find(location =>
    location.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(location.name.toLowerCase())
  )
}

/**
 * Get related locations for recommendations
 */
export function getRelatedLocations(currentLocationId: string, limit: number = 4): Location[] {
  return locations
    .filter(location => location.id !== currentLocationId)
    .slice(0, limit)
}

/**
 * Get locations by country for recommendations
 */
export function getLocationsByCountry(country: string, excludeId?: string, limit: number = 4): Location[] {
  return locations
    .filter(location =>
      location.country === country &&
      (excludeId ? location.id !== excludeId : true)
    )
    .slice(0, limit)
}

/**
 * Get featured locations for homepage
 */
export function getFeaturedLocations(limit: number = 8): Location[] {
  return locations
    .filter(location => location.is_featured)
    .slice(0, limit)
}

/**
 * Search locations by name, country, or region
 */
export function searchLocations(query: string, limit: number = 10): Location[] {
  const searchTerm = query.toLowerCase()
  return locations
    .filter(location =>
      location.name.toLowerCase().includes(searchTerm) ||
      location.country.toLowerCase().includes(searchTerm) ||
      location.region.toLowerCase().includes(searchTerm) ||
      location.description.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit)
}
