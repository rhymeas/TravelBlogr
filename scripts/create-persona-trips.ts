/**
 * Script to create realistic trips and blog posts for team personas
 * Run with: npx tsx scripts/create-persona-trips.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Trip plans for each persona
const tripPlans = [
  {
    // Emma Chen - Adventure Seeker
    personaId: '063592b9-057e-44d8-a700-69380d4d8c2c',
    personaName: 'Emma Chen',
    trip: {
      title: 'Trekking the W Circuit in Torres del Paine, Patagonia',
      slug: 'patagonia-w-trek-torres-del-paine',
      description: 'An epic 5-day adventure through one of the most stunning landscapes on Earth!',
      start_date: '2024-11-15',
      end_date: '2024-11-20',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200',
      destination: 'Torres del Paine, Patagonia, Chile',
      trip_type: 'adventure',
      duration_days: 5,
      highlights: ['W Trek', 'Torres Base', 'Grey Glacier', 'Camping', 'Wildlife'],
      location_data: {
        start: 'Puerto Natales, Chile',
        end: 'Torres del Paine National Park, Chile',
        countries: ['Chile'],
        regions: ['Patagonia']
      }
    },
    blogPost: {
      title: 'Conquering Patagonia: My Epic W Trek Adventure!',
      slug: 'patagonia-w-trek-adventure',
      excerpt: 'Five days of jaw-dropping glaciers, turquoise lakes, and the most incredible sunrise of my life! Here\'s everything you need to know about trekking the W Circuit in Torres del Paine.',
      content: {
        destination: 'Torres del Paine National Park, Patagonia, Chile',
        introduction: 'OMG, where do I even start?! The W Trek in Torres del Paine has been on my bucket list FOREVER, and let me tell you - it absolutely lived up to the hype! Picture this: massive granite towers piercing the sky, electric blue glaciers, and winds so strong they literally knocked me off my feet (yes, really!). This 5-day trek pushed me to my limits and gave me some of the most incredible moments of my life. Let\'s dive in! 🏔️',
        highlights: [
          'Sunrise at the base of Torres del Paine - literally brought tears to my eyes!',
          'Getting up close and personal with Grey Glacier',
          'Spotting guanacos (they\'re like llamas but cooler!) everywhere',
          'Camping under the most insane starry skies',
          'Making friends with fellow trekkers from around the world'
        ],
        days: [
          {
            day_number: 1,
            title: 'Day 1: Puerto Natales to Las Torres Base Camp',
            description: 'Started the day with a hearty breakfast in Puerto Natales before catching the bus to the park. The anticipation was REAL! First day was all about getting to Las Torres base camp - about 8km of relatively easy hiking to warm up those legs. The views already had me stopping every five minutes to take photos!',
            activities: ['Bus from Puerto Natales', 'Registration at park entrance', 'Hike to Las Torres camp', 'Set up tent', 'Sunset viewing'],
            tips: 'Pro tip: Start early! The bus fills up fast, and you want to get to camp with plenty of daylight to set up your tent.'
          },
          {
            day_number: 2,
            title: 'Day 2: The Torres Base Viewpoint - The Big One!',
            description: 'Alarm at 4:30 AM because we wanted to catch sunrise at the base of the towers. This is THE iconic hike - 9km each way with a brutal boulder scramble at the end. But OH MY GOD, when those first rays of sunlight hit those granite towers and turned them golden-pink... I actually cried. No shame! This is what I came for! 😭✨',
            activities: ['Pre-dawn start', 'Steep ascent through forest', 'Boulder scramble', 'Sunrise at Torres base', 'Return to camp'],
            tips: 'Bring layers! It was freezing at 5 AM but I was sweating by 7 AM. Also, headlamp is essential for the early start!'
          },
          {
            day_number: 3,
            title: 'Day 3: Las Torres to Los Cuernos',
            description: 'Today was a long one - about 11km to Los Cuernos camp. But honestly? The scenery was so incredible that the kilometers just flew by! Walking alongside Lake Nordenskjöld with its crazy turquoise water and the Cuernos (horns) mountains in the background... pure magic! Saw tons of guanacos just chilling by the trail. They\'re so cute!',
            activities: ['Pack up camp', 'Hike along Lake Nordenskjöld', 'Wildlife spotting', 'Arrive at Los Cuernos', 'Relax by the lake'],
            tips: 'The wind can be INSANE on this section. I literally got blown sideways a few times! Trekking poles really helped with stability.'
          }
        ],
        practicalInfo: {
          bestTime: 'November to March (Patagonian summer) - I went in November and weather was perfect!',
          budget: 'Budget-friendly! Campsites are around $8-15/night. Bring your own food to save money. Total cost: ~$400 including bus, camping, and food.',
          packing: ['Sturdy hiking boots', 'Warm layers', 'Rain gear (essential!)', 'Sleeping bag rated to -5°C', 'Trekking poles', 'Headlamp', 'Water purification tablets']
        }
      },
      status: 'published',
      visibility: 'public',
      category: 'Adventure Travel',
      tags: ['hiking', 'patagonia', 'chile', 'trekking', 'budget travel', 'camping'],
      seo_title: 'W Trek Patagonia Guide: 5-Day Torres del Paine Adventure',
      seo_description: 'Complete guide to trekking the W Circuit in Torres del Paine, Patagonia. Budget tips, day-by-day itinerary, and everything you need to know!',
      published_at: new Date('2024-11-25').toISOString()
    }
  },
  {
    // Marcus Rodriguez - Luxury Traveler
    personaId: '7b60292f-9591-48c4-9b94-95ae32680e26',
    personaName: 'Marcus Rodriguez',
    trip: {
      title: 'A Week of Indulgence in Tuscany: Wine, Art, and La Dolce Vita',
      slug: 'tuscany-wine-country-luxury-week',
      description: 'Seven days exploring the rolling hills of Chianti, savoring world-class wines, and experiencing the finest Tuscan hospitality.',
      start_date: '2024-09-20',
      end_date: '2024-09-27',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200',
      destination: 'Chianti, Tuscany, Italy',
      trip_type: 'luxury',
      duration_days: 7,
      highlights: ['Wine Tasting', 'Castello di Brolio', 'Truffle Hunting', 'Michelin Dining', 'Hot Air Balloon'],
      location_data: {
        start: 'Florence, Italy',
        end: 'Siena, Italy',
        countries: ['Italy'],
        regions: ['Tuscany']
      }
    },
    blogPost: {
      title: 'The Art of Slow Travel: A Tuscan Wine Country Sojourn',
      slug: 'tuscany-wine-country-luxury-experience',
      excerpt: 'In the heart of Chianti, where centuries-old vineyards meet Renaissance splendor, I discovered the true meaning of la dolce vita. A week of exceptional wines, Michelin-starred dining, and the kind of beauty that lingers long after you\'ve returned home.',
      content: {
        destination: 'Chianti Region, Tuscany, Italy',
        introduction: 'There are journeys that nourish the soul, and then there are those rare experiences that fundamentally alter one\'s appreciation for the finer things in life. My week in Tuscany\'s Chianti region proved to be the latter. From the moment I arrived at my boutique villa overlooking endless rows of Sangiovese vines, I knew this would be something extraordinary. This is not merely a travel story—it is an invitation to slow down, to savor, to truly experience.',
        highlights: [
          'Private wine tasting at Castello di Brolio, birthplace of Chianti Classico',
          'Truffle hunting with a local tartufaio and his trained dogs',
          'Michelin-starred dinner at Osteria di Passignano',
          'Sunrise hot air balloon ride over the Chianti hills',
          'Hands-on pasta-making class with a nonna in Greve'
        ],
        days: [
          {
            day_number: 1,
            title: 'Arrival in Florence and Transfer to Villa Accommodation',
            description: 'The journey began in Florence, where I spent a leisurely morning at the Uffizi Gallery before my private driver whisked me away to my villa in the heart of Chianti. The property, a meticulously restored 16th-century farmhouse, offered panoramic views that seemed to stretch into eternity. That evening, I dined on the terrace as the sun painted the hills in shades of amber and gold—a fitting introduction to Tuscan splendor.',
            activities: ['Morning at Uffizi Gallery', 'Private transfer to Chianti', 'Villa check-in and orientation', 'Welcome aperitivo', 'Sunset dinner on terrace'],
            tips: 'Book your Uffizi tickets well in advance. The early morning slot (8:30 AM) offers a more intimate experience with the masterpieces.'
          },
          {
            day_number: 2,
            title: 'Castello di Brolio: Where Chianti Was Born',
            description: 'Today\'s highlight was an exclusive tour of Castello di Brolio, the historic estate where Baron Bettino Ricasoli perfected the Chianti Classico formula in the 19th century. Our sommelier guide led us through the ancient cellars, sharing stories that brought centuries of winemaking tradition to life. The vertical tasting of their Riserva wines, spanning multiple vintages, was nothing short of revelatory. Each glass told a story of terroir, patience, and uncompromising dedication to craft.',
            activities: ['Private castle tour', 'Vertical wine tasting', 'Lunch at castle restaurant', 'Gardens exploration', 'Return to villa for spa treatment'],
            tips: 'The castle\'s restaurant serves an exceptional bistecca alla fiorentina. Pair it with their Gran Selezione for an unforgettable combination.'
          },
          {
            day_number: 3,
            title: 'The Hunt for White Gold: Truffle Experience',
            description: 'Few experiences compare to the thrill of truffle hunting in the Tuscan woods. Accompanied by Giacomo, a third-generation tartufaio, and his remarkably skilled Lagotto Romagnolo, we ventured into the forest at dawn. The moment his dog unearthed our first white truffle—its intoxicating aroma filling the crisp morning air—I understood why these fungi command such reverence. We concluded with a lunch where our morning\'s discoveries were transformed into sublime dishes by a local chef.',
            activities: ['Dawn truffle hunting', 'Forest walk with tartufaio', 'Truffle-focused lunch', 'Afternoon wine tasting at boutique winery', 'Evening at leisure'],
            tips: 'White truffle season runs October through December. For the best experience, book with a reputable guide who works with certified truffle dogs.'
          }
        ],
        practicalInfo: {
          bestTime: 'September to October for harvest season, or April to June for spring blooms. I visited in late September—perfect weather and the vendemmia (grape harvest) in full swing.',
          budget: 'Luxury experience: €5,000-8,000 per person for the week, including boutique accommodation, private experiences, Michelin dining, and wine purchases.',
          packing: ['Smart casual attire for dinners', 'Comfortable walking shoes', 'Light jacket for evenings', 'Sun protection', 'Wine shipping arrangements']
        }
      },
      status: 'published',
      visibility: 'public',
      category: 'Luxury Travel',
      tags: ['tuscany', 'wine tourism', 'italy', 'luxury travel', 'fine dining', 'cultural experiences'],
      seo_title: 'Luxury Tuscany Wine Tour: A Week in Chianti Country',
      seo_description: 'Experience the finest of Tuscan wine country with this luxury travel guide. Michelin dining, private tastings, and authentic experiences in Chianti.',
      published_at: new Date('2024-10-05').toISOString()
    }
  },
  {
    // Yuki Tanaka - Cultural Explorer
    personaId: 'fc53dd48-6caf-473b-a660-2c389e8ab067',
    personaName: 'Yuki Tanaka',
    trip: {
      title: 'Through the Lens: Kyoto in Autumn',
      slug: 'kyoto-autumn-photography',
      description: 'A photographer\'s journey through ancient temples, hidden gardens, and the fleeting beauty of momiji season.',
      start_date: '2024-11-10',
      end_date: '2024-11-17',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
      destination: 'Kyoto, Japan',
      trip_type: 'cultural',
      duration_days: 7,
      highlights: ['Fushimi Inari', 'Tea Ceremony', 'Autumn Leaves', 'Temple Photography', 'Zen Meditation'],
      location_data: {
        start: 'Kyoto, Japan',
        end: 'Kyoto, Japan',
        countries: ['Japan'],
        regions: ['Kansai']
      }
    },
    blogPost: {
      title: 'Moments of Stillness: Finding Kyoto Through Autumn Leaves',
      slug: 'kyoto-autumn-photography-journey',
      excerpt: 'In the quiet spaces between temple bells and falling maple leaves, I discovered a Kyoto that exists beyond guidebooks—a city of subtle beauty, ancient rituals, and moments that ask us to simply be present.',
      content: {
        destination: 'Kyoto, Japan',
        introduction: 'There is a Japanese word, "ma," that describes the space between things—the pause between notes in music, the emptiness that gives form to a room. In Kyoto during momiji season, I found myself constantly aware of these spaces: the silence before a temple bell rings, the moment between a leaf letting go and touching the ground, the breath before a tea ceremony begins. This is not a story of seeing everything, but rather of seeing deeply.',
        highlights: [
          'Dawn at Fushimi Inari, when the torii gates belong only to the early risers',
          'Tea ceremony with a master who has practiced for forty years',
          'Photographing the maple corridor at Eikando Temple',
          'Chance encounter with a geiko in Gion at twilight',
          'Meditation session at a Zen temple in Arashiyama'
        ],
        days: [
          {
            day_number: 1,
            title: 'Arrival and the Art of Slowing Down',
            description: 'I arrived in Kyoto on a grey afternoon, the kind of weather that softens edges and deepens colors. My ryokan in Higashiyama was a study in simplicity—tatami mats, a low table, a scroll in the tokonoma alcove. That evening, I walked through Ninenzaka, the old stone-paved street, as shopkeepers prepared to close. A elderly woman sweeping her doorstep paused to point out the first maple leaves turning red. "Mada hayai," she said with a smile. Still early. But beautiful nonetheless.',
            activities: ['Check-in at traditional ryokan', 'Evening walk through Higashiyama', 'Dinner at local izakaya', 'Night photography in Gion'],
            tips: 'Stay in a traditional ryokan at least once. The ritual of kaiseki dinner and morning onsen sets a different rhythm for your days.'
          },
          {
            day_number: 2,
            title: 'Sacred Spaces: Fushimi Inari at Dawn',
            description: 'The alarm at 5 AM felt cruel until I stepped outside into the pre-dawn darkness. At Fushimi Inari, I was alone with the foxes and the ten thousand torii gates. As light began to filter through the vermillion tunnels, I understood why photographers chase these early hours. The gates seemed to glow from within. I climbed for two hours, stopping often—not from exhaustion, but from the need to simply witness. At the summit, the city spread below like a watercolor painting.',
            activities: ['Pre-dawn departure', 'Sunrise at Fushimi Inari', 'Mountain trail photography', 'Return for traditional breakfast', 'Rest and photo editing'],
            tips: 'Arrive before 6 AM to experience the shrine in solitude. Bring a tripod for low-light photography and wear comfortable shoes for the mountain trail.'
          },
          {
            day_number: 3,
            title: 'The Way of Tea',
            description: 'In a small tea house near Kiyomizu-dera, I participated in my first formal tea ceremony. Tanaka-sensei, who has practiced chanoyu for four decades, moved with a precision that seemed effortless. Every gesture had meaning—the way she turned the bowl, the angle of the whisk, the placement of the sweet. "Tea ceremony is not about drinking tea," she explained in careful English. "It is about creating a moment of peace in a chaotic world." For forty-five minutes, nothing existed except the sound of water boiling, the bitter matcha, and the present moment.',
            activities: ['Morning tea ceremony', 'Walk through Kiyomizu-dera', 'Lunch in Sannenzaka', 'Afternoon at Kodaiji Temple', 'Evening photography session'],
            tips: 'Book tea ceremonies in advance. Look for experiences with English explanation if you want to understand the deeper meaning behind each movement.'
          }
        ],
        practicalInfo: {
          bestTime: 'Mid-November for peak autumn colors. I visited November 10-17, which was perfect timing for the maple leaves.',
          budget: 'Moderate: ¥150,000-200,000 ($1,000-1,400) for the week including ryokan stays, experiences, meals, and local transport.',
          packing: ['Camera with multiple lenses', 'Tripod for low-light shots', 'Comfortable walking shoes', 'Layers for temperature changes', 'Respectful clothing for temples', 'Portable charger']
        }
      },
      status: 'published',
      visibility: 'public',
      category: 'Cultural Travel',
      tags: ['kyoto', 'japan', 'photography', 'cultural immersion', 'autumn', 'temples'],
      seo_title: 'Kyoto in Autumn: A Photographer\'s Cultural Journey',
      seo_description: 'Experience Kyoto\'s autumn beauty through mindful travel and photography. Temple visits, tea ceremony, and capturing the essence of momiji season.',
      published_at: new Date('2024-11-22').toISOString()
    }
  },
  {
    // Sophie Laurent - Family Travel Expert
    personaId: 'c97c8945-2183-443f-8066-196fb3446cac',
    personaName: 'Sophie Laurent',
    trip: {
      title: 'Barcelona with Kids: A Week of Gaudí, Beaches, and Gelato',
      slug: 'barcelona-family-vacation',
      description: 'Our family adventure through Barcelona—where art meets architecture, and every corner has something to delight kids and adults alike!',
      start_date: '2024-07-15',
      end_date: '2024-07-22',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
      destination: 'Barcelona, Spain',
      trip_type: 'family',
      duration_days: 7,
      highlights: ['Sagrada Família', 'Park Güell', 'Beach Day', 'Gothic Quarter', 'Magic Fountain'],
      location_data: {
        start: 'Barcelona, Spain',
        end: 'Barcelona, Spain',
        countries: ['Spain'],
        regions: ['Catalonia']
      }
    },
    blogPost: {
      title: 'Barcelona with Three Kids: Our Week of Magic, Mosaics, and Memories',
      slug: 'barcelona-family-travel-guide',
      excerpt: 'Taking three kids (ages 5, 8, and 11) to Barcelona? Here\'s how we made it work—from navigating Park Güell with a stroller to finding the best kid-friendly tapas. Spoiler: It was absolutely magical!',
      content: {
        destination: 'Barcelona, Spain',
        introduction: 'Let me be honest: when my husband first suggested Barcelona for our summer vacation, I had my doubts. Three kids, a foreign city, the heat of July... But you know what? It turned out to be one of our best family trips ever! Barcelona is like a giant playground designed by artists. The kids were mesmerized by Gaudí\'s whimsical buildings, we found amazing playgrounds tucked into every neighborhood, and yes, we ate gelato every single day. Here\'s everything we learned about making Barcelona work with kids!',
        highlights: [
          'The kids\' faces when they first saw Sagrada Família—pure wonder!',
          'Treasure hunt through Park Güell (I made a scavenger hunt sheet)',
          'Beach day at Barceloneta with sandcastle competitions',
          'Magic Fountain show at Montjuïc—free and spectacular!',
          'Chocolate museum where the kids made their own treats'
        ],
        days: [
          {
            day_number: 1,
            title: 'Arrival and Gothic Quarter Exploration',
            description: 'We arrived mid-morning and headed straight to our apartment in Eixample (highly recommend staying in an apartment with kids—having a kitchen and washing machine is a game-changer!). After settling in, we took a gentle walk through the Gothic Quarter. The narrow streets felt like a maze, and the kids loved pretending to be explorers. We stopped for churros and hot chocolate at a local café, which immediately won everyone over. Pro tip: Let the kids lead sometimes—they found the coolest little squares and fountains!',
            activities: ['Apartment check-in', 'Gothic Quarter walk', 'Churros break', 'Early dinner at family-friendly restaurant', 'Early bedtime to beat jet lag'],
            tips: 'Book an apartment with a washing machine! With kids, you\'ll need it. Also, bring a lightweight stroller even for older kids—those little legs get tired!'
          },
          {
            day_number: 2,
            title: 'Sagrada Família and Park Güell',
            description: 'Today was all about Gaudí! We started early at Sagrada Família (booked tickets for 9 AM to beat crowds). I was worried the kids would be bored, but they were absolutely captivated. My 8-year-old kept saying "It looks like a sandcastle!" The light through the stained glass windows was magical. Afterward, we took a taxi to Park Güell. I\'d created a scavenger hunt sheet with things to find (the mosaic dragon, the wavy bench, etc.), which kept everyone engaged. We had a picnic lunch with views over the city—perfect!',
            activities: ['Early Sagrada Família visit', 'Taxi to Park Güell', 'Scavenger hunt', 'Picnic lunch', 'Afternoon rest at apartment', 'Evening stroll on Las Ramblas'],
            tips: 'Book Sagrada Família tickets online in advance! Go early morning. For Park Güell, the free area is great for kids—you don\'t need to pay for the monumental zone unless you really want to.'
          },
          {
            day_number: 3,
            title: 'Beach Day at Barceloneta',
            description: 'Sometimes the best days are the simplest ones! We packed beach toys, sunscreen, and snacks, and spent the entire day at Barceloneta Beach. The kids built elaborate sandcastles, we swam in the Mediterranean, and I actually got to read a few pages of my book (miracle!). For lunch, we grabbed fresh fruit from a beachside vendor and had bocadillos from a nearby café. The kids made friends with other children on the beach—it\'s amazing how play transcends language barriers. We stayed until sunset, then walked along the boardwalk for dinner.',
            activities: ['Morning at Barceloneta Beach', 'Swimming and sandcastles', 'Beachside lunch', 'More beach time', 'Sunset walk', 'Seafood dinner on the boardwalk'],
            tips: 'Bring your own beach toys and snacks—beach vendors are pricey! Go early to get a good spot. The water is calm and perfect for kids. Don\'t forget reef-safe sunscreen!'
          }
        ],
        practicalInfo: {
          bestTime: 'April-June or September-October for milder weather. We went in July—hot but manageable with beach breaks and siestas!',
          budget: 'Family-friendly: €2,500-3,500 for a family of 5 for the week, including apartment rental, groceries, attractions, and eating out.',
          packing: ['Lightweight stroller', 'Beach toys', 'Sunscreen and hats', 'Comfortable walking shoes', 'Light layers for evenings', 'Snacks for hangry moments', 'First aid kit']
        }
      },
      status: 'published',
      visibility: 'public',
      category: 'Family Travel',
      tags: ['barcelona', 'spain', 'family travel', 'kids', 'city break', 'europe with kids'],
      seo_title: 'Barcelona with Kids: Complete Family Travel Guide',
      seo_description: 'Planning Barcelona with children? This complete guide covers kid-friendly attractions, practical tips, and how to make the most of your family vacation.',
      published_at: new Date('2024-07-28').toISOString()
    }
  },
  {
    // Alex Thompson - Digital Nomad
    personaId: '4e36a62a-be89-4d5f-a646-83790f7357fa',
    personaName: 'Alex Thompson',
    trip: {
      title: 'Two Months in Lisbon: Finding My Remote Work Rhythm',
      slug: 'lisbon-digital-nomad-2-months',
      description: 'How I set up my digital nomad base in Portugal\'s most charming city—coworking spaces, productivity hacks, and the perfect work-life balance.',
      start_date: '2024-10-01',
      end_date: '2024-11-30',
      status: 'published',
      is_public_template: true,
      cover_image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200',
      destination: 'Lisbon, Portugal',
      trip_type: 'digital-nomad',
      duration_days: 60,
      highlights: ['Coworking Spaces', 'Surf Sessions', 'Nomad Community', 'Work-Life Balance', 'Portuguese Culture'],
      location_data: {
        start: 'Lisbon, Portugal',
        end: 'Lisbon, Portugal',
        countries: ['Portugal'],
        regions: ['Lisbon']
      }
    },
    blogPost: {
      title: 'Lisbon Digital Nomad Guide: 2 Months of Remote Work in Portugal',
      slug: 'lisbon-digital-nomad-guide',
      excerpt: 'After testing 5 coworking spaces, finding the perfect apartment, and establishing my routine, here\'s everything you need to know about being a digital nomad in Lisbon. Spoiler: the pastel de nata breaks are mandatory.',
      content: {
        destination: 'Lisbon, Portugal',
        introduction: 'Lisbon has been on my digital nomad radar for years, and I finally made it happen—two full months working remotely from Portugal\'s capital. Between the reliable WiFi, affordable cost of living, thriving nomad community, and those incredible sunset views from Miradouro de Santa Catarina, Lisbon quickly became one of my favorite bases. Here\'s my honest breakdown of what it\'s really like to work remotely from Lisbon, including the coworking spaces I tested, my productivity setup, and how I balanced work with exploring this incredible city.',
        highlights: [
          'Found my perfect coworking space at Second Home with rooftop terrace',
          'Established a morning routine: surf at Carcavelos, work by 10 AM',
          'Built a solid network through Nomad List meetups',
          'Discovered the best cafés for focused work sessions',
          'Maintained US timezone meetings while enjoying European lifestyle'
        ],
        days: [
          {
            day_number: 1,
            title: 'Week 1: Setting Up and Finding My Rhythm',
            description: 'First week was all about logistics. I\'d booked an sleek in Príncipe Real for the first month—central location, great WiFi (tested it before booking!), and a proper desk setup. Spent the first few days testing coworking spaces: tried Second Home, Selina, Heden, and a few local spots. Second Home won for the vibe and the rooftop, but I kept a flexible membership to work from different spots. Also crucial: found my local café (Fábrica Coffee Roasters), grocery store (Pingo Doce), and gym (Urban Sports Club membership works here!).',
            activities: ['Apartment setup', 'Coworking space trials', 'Neighborhood exploration', 'SIM card and admin tasks', 'First client calls from new base'],
            tips: 'Get a local SIM immediately—MEO and Vodafone have good data plans. Test WiFi before committing to any accommodation. Join the Lisbon Digital Nomads Facebook group before arriving!'
          },
          {
            day_number: 2,
            title: 'Weeks 2-4: Establishing Routine and Productivity',
            description: 'By week two, I\'d found my groove. Mornings: wake at 7 AM, quick workout or surf session at Carcavelos (30min train), back by 9:30 AM, work from 10 AM-1 PM. Lunch break with a proper Portuguese meal, then afternoon work session 2-6 PM. This schedule let me handle US timezone meetings (usually 5-7 PM Lisbon time) while still having evenings free. Productivity was actually higher than when I was in Bali—the European work culture and reliable infrastructure made a huge difference. Plus, the nomad community here is super supportive.',
            activities: ['Morning surf sessions', 'Focused work blocks', 'Coworking networking events', 'Portuguese language exchange', 'Weekend trips to Sintra and Cascais'],
            tips: 'The 7-day Lisbon transport pass (€40) is worth it if you\'re commuting to beaches. Noise-canceling headphones are essential for café work. Book meeting rooms at coworking spaces for important calls.'
          },
          {
            day_number: 3,
            title: 'Weeks 5-8: Deep Work and Community Building',
            description: 'The second month was when Lisbon really felt like home. I\'d built a solid routine, made genuine friends in the nomad community, and even started a weekly accountability group with three other remote workers. We\'d meet every Monday at Second Home to set weekly goals, then Friday for a check-in (usually over wine at Time Out Market). My Portuguese improved enough to handle daily interactions, and I discovered the best spots for different types of work: Ler Devagar bookstore for creative work, Second Home for calls, Fábrica for deep focus. Also figured out the visa situation for longer stays—Portugal\'s D7 visa is very nomad-friendly.',
            activities: ['Established weekly routines', 'Accountability group meetings', 'Deeper client work', 'Portuguese lessons', 'Exploring neighborhoods: Alfama, Belém, LX Factory'],
            tips: 'Build a community—it makes all the difference. Use tools like Focusmate for accountability. Consider the Portugal Digital Nomad Visa if you want to stay longer than 90 days.'
          }
        ],
        practicalInfo: {
          bestTime: 'September-November or March-May for perfect weather and fewer tourists. I was there Oct-Nov—ideal temperatures for work and play.',
          budget: 'Moderate: €1,800-2,500/month including rent (€800-1,200), coworking (€200-300), food (€400-600), transport (€50), and fun money.',
          packing: ['Laptop + backup charger', 'Noise-canceling headphones', 'Portable monitor (optional but helpful)', 'European plug adapters', 'Light layers', 'Surf gear if you\'re into it']
        }
      },
      status: 'published',
      visibility: 'public',
      category: 'Digital Nomad',
      tags: ['lisbon', 'portugal', 'digital nomad', 'remote work', 'coworking', 'productivity'],
      seo_title: 'Lisbon Digital Nomad Guide: 2-Month Remote Work Experience',
      seo_description: 'Complete guide to working remotely from Lisbon. Coworking spaces, cost of living, productivity tips, and everything you need for digital nomad life in Portugal.',
      published_at: new Date('2024-12-05').toISOString()
    }
  }
]

async function createPersonaTrips() {
  console.log('🌍 Creating realistic trips and blog posts for team personas...\n')

  for (const plan of tripPlans) {
    console.log(`\n📝 Creating content for ${plan.personaName}...`)
    
    try {
      // 1. Create the trip
      console.log('  📍 Creating trip...')
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          ...plan.trip,
          user_id: plan.personaId
        })
        .select()
        .single()

      if (tripError) {
        console.error(`  ❌ Error creating trip:`, tripError.message)
        continue
      }

      console.log(`  ✅ Trip created: ${trip.id}`)

      // 2. Create the blog post
      console.log('  📄 Creating blog post...')
      const { data: blogPost, error: blogError } = await supabase
        .from('blog_posts')
        .insert({
          ...plan.blogPost,
          author_id: plan.personaId,
          trip_id: trip.id,
          content: plan.blogPost.content
        })
        .select()
        .single()

      if (blogError) {
        console.error(`  ❌ Error creating blog post:`, blogError.message)
        continue
      }

      console.log(`  ✅ Blog post created: ${blogPost.id}`)
      console.log(`  🔗 Slug: ${blogPost.slug}`)

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error)
    }
  }

  console.log('\n\n🎉 Content creation complete!\n')
  console.log('📊 Summary:')
  console.log('  - Emma Chen: Patagonia W Trek (Adventure)')
  console.log('  - Marcus Rodriguez: Tuscany Wine Country (Luxury)')
  console.log('  - Yuki Tanaka: Kyoto in Autumn (Cultural/Photography)')
  console.log('  - Sophie Laurent: Barcelona with Kids (Family Travel)')
  console.log('  - Alex Thompson: Lisbon Digital Nomad (Remote Work)')
  console.log('\n✨ Check your blog at /blog to see the posts!')
  console.log('🌐 Each post showcases a unique writing style and travel perspective!')
}

createPersonaTrips().catch(console.error)

