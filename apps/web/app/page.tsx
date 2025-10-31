'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  Globe,
  MapPin,
  Menu,
  Search,
  Calendar,
  Users,
  Star,
  Camera,
  Compass,
  TrendingUp,
  Award,
  Shield,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TripCard } from '@/components/ui/TripCard'
import { FeaturedLocations } from '@/components/landing/FeaturedLocations'
import { PublicDestinationSearch } from '@/components/search/PublicDestinationSearch'
import { useAuth } from '@/hooks/useAuth'
import { HorizontalBannerAd } from '@/components/ads/HorizontalBannerAd'

import { FAQ as MarketingFAQ } from '@/components/marketing/FAQ'

// ✅ Self-hosted videos on Supabase - Fast & Reliable!
// Videos uploaded to: https://supabase.com/dashboard/project/nchhcxokrzabbkvhzsor/storage/buckets/images/uploads
const HERO_VIDEOS = [
  {
    id: 'caribbean',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/4135118-sd_960_540_30fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/4135118/pexels-photo-4135118.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/4135118/pexels-photo-4135118.jpeg?auto=compress&cs=tinysrgb&w=800',
    credit: 'Taryn Elliott',
    theme: 'tropical'
  },
  {
    id: 'city',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/2282013-sd_640_338_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/2282013/pexels-photo-2282013.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/2282013/pexels-photo-2282013.jpeg?auto=compress&cs=tinysrgb&w=800',
    credit: 'Kelly',
    theme: 'urban'
  },
  {
    id: 'snow',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/1858244-sd_640_338_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/1858244/pexels-photo-1858244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/1858244/pexels-photo-1858244.jpeg?auto=compress&cs=tinysrgb&w=800',
    credit: 'Taryn Elliott',
    theme: 'winter'
  },
  {
    id: 'desert',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/2055060-sd_640_268_25fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/2055060/pexels-photo-2055060.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/2055060/pexels-photo-2055060.jpeg?auto=compress&cs=tinysrgb&w=800',
    credit: 'Taryn Elliott',
    theme: 'desert'
  },
  {
    id: 'nature',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/images/uploads/14190583_960_540_24fps.mp4',
    fallbackImage: 'https://images.pexels.com/videos/14190583/pexels-photo-14190583.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    poster: 'https://images.pexels.com/videos/14190583/pexels-photo-14190583.jpeg?auto=compress&cs=tinysrgb&w=800',
    credit: 'Pexels',
    theme: 'nature'
  }
]



// Trip data with detailed information - optimized images
const tripExamples = [
  {
    id: '1',
    name: 'Banff National Park', // Updated to match our location data
    dates: 'Sep 18-19',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&q=70&auto=format',
    imageAlt: 'Banff National Park mountain landscape',
    daysStay: 2,
    accommodation: {
      name: 'Mountain Lodge',
      nights: 2
    },
    restaurants: [
      { name: 'The Bison Restaurant' },
      { name: 'Three Ravens Restaurant' }
    ],
    activities: [
      { name: 'Lake Louise hiking' },
      { name: 'Moraine Lake photography' }
    ],
    didYouKnow: 'Banff was Canada\'s first national park, established in 1885!'
  },
  {
    id: '2',
    name: 'Santorini', // Updated to match our location data
    dates: 'Sep 19-21',
    image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400&h=300&fit=crop&q=70&auto=format',
    imageAlt: 'Santorini white buildings and blue domes',
    description: 'Greek island paradise with stunning sunsets, traditional villages, and volcanic beaches.',
    daysStay: 3,
    accommodation: {
      name: 'Cliffside Villa',
      nights: 2,
      link: '#'
    },
    restaurants: [
      { name: 'Ambrosia Restaurant' },
      { name: 'Selene Restaurant' }
    ],
    activities: [
      { name: 'Sunset watching in Oia' },
      { name: 'Wine tasting tours' }
    ],
    didYouKnow: 'Santorini\'s unique architecture was designed to withstand earthquakes and strong winds.'
  },
  {
    id: '3',
    name: 'Tokyo', // Updated to match our location data
    dates: 'Sep 21-22',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop&q=70&auto=format',
    imageAlt: 'Tokyo cityscape at sunset',
    daysStay: 1,
    accommodation: {
      name: 'Modern Tokyo Hotel',
      nights: 1
    },
    restaurants: [
      { name: 'Sushi Jiro' },
      { name: 'Ramen Yokocho' }
    ],
    activities: [
      { name: 'Temple visits' },
      { name: 'Street food tours' }
    ],
    didYouKnow: 'Tokyo has more Michelin-starred restaurants than any other city in the world!'
  },
  {
    id: '4',
    name: 'Machu Picchu',
    dates: 'Sep 22-24',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=300&fit=crop&q=70&auto=format',
    imageAlt: 'Machu Picchu ancient ruins',
    description: 'Ancient Incan citadel set high in the Andes Mountains, a UNESCO World Heritage site.',
    daysStay: 2,
    accommodation: {
      name: 'Sacred Valley Lodge',
      nights: 2
    },
    restaurants: [
      { name: 'Indio Feliz' },
      { name: 'Café Inkaterra' }
    ],
    activities: [
      { name: 'Sunrise at Machu Picchu' },
      { name: 'Inca Trail hiking' }
    ],
    didYouKnow: 'Machu Picchu was built around 1450 and abandoned just over 100 years later during the Spanish conquest.'
  }
]

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Log auth state changes for debugging
  useEffect(() => {
    console.log('🏠 HomePage - Auth state:', { mounted, isAuthenticated, isLoading })
  }, [mounted, isAuthenticated, isLoading])

  // Handle video errors - fallback to image
  const handleVideoError = (videoId: string) => {
    console.warn(`Video failed to load: ${videoId}, falling back to image`)
    setVideoErrors(prev => ({ ...prev, [videoId]: true }))
  }

  // Handle video loaded
  const handleVideoLoaded = (videoId: string) => {
    console.log(`Video loaded successfully: ${videoId}`)
  }

  // Rotate hero videos every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // REMOVED: Dashboard redirect logic
  // The home page now shows the public landing page for everyone
  // Authenticated users can access dashboard at /dashboard
  // This allows OAuth callback to redirect users back to the page they were on

  // Show public landing page
  console.log('📄 Showing public landing page (auth:', isAuthenticated, ')')
  return (
    <div className="min-h-screen bg-white">

      <main>
        {/* Hero Section - Video Background */}
        <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
          {/* Hero Videos - Rotating */}
          <div className="absolute inset-0">
            {HERO_VIDEOS.map((video, index) => (
              <div
                key={video.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Show fallback image if video failed to load */}
                {videoErrors[video.id] ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${video.fallbackImage || video.poster})` }}
                  />
                ) : (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={video.poster}
                    className="w-full h-full object-cover"
                    preload={index === 0 ? 'auto' : 'metadata'}
                    onError={() => handleVideoError(video.id)}
                    onLoadedData={() => handleVideoLoaded(video.id)}
                    onCanPlay={() => handleVideoLoaded(video.id)}
                  >
                    <source src={video.url} type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
          </div>

          {/* Video Credit */}
          <div className="absolute bottom-4 right-4 z-10 text-white/60 text-xs flex items-center gap-1">
            <span>Video by</span>
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/80 transition-colors underline"
            >
              {HERO_VIDEOS[currentImageIndex].credit}
            </a>
            <span>on Pexels</span>
          </div>

          {/* Search Card Overlay */}
          <div className="relative h-full flex items-center">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
              <div className="max-w-[496px]">
                {/* White Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <h1 className="text-3xl font-bold text-sleek-black mb-2">
                    Plan Your Next Adventure,
                    <br />
                    Share Your Journey
                  </h1>
                  <p className="text-sm text-sleek-gray mb-6">
                    Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips.
                  </p>

                  {/* Public Destination Search - Original Functionality */}
                  <div className="mb-4">
                    <PublicDestinationSearch
                      placeholder="Where do you want to go?"
                      showTrending={true}
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs text-sleek-gray pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>2,500+ destinations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>50K+ travelers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>4.9 rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Planner CTA - Focused on AI planning and sharing */}
        <section className="py-14 bg-gradient-to-r from-babu-50 via-rausch-50 to-lima-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Copy */}
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                  Plan smarter with AI. Share your journey as you go.
                </h2>
                <p className="text-base lg:text-lg text-gray-700 mb-6 max-w-xl">
                  Get a complete itinerary in seconds—route, travel times, pacing, budget ideas and highlights. Save, update and share your trip with friends and the community.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-rausch-500 hover:bg-rausch-600 text-white px-6 py-5">
                    <Link href="/plan" className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Plan your trip
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-6 py-5">
                    <Link href="/trips-library" className="flex items-center gap-2">
                      <Compass className="h-5 w-5" />
                      See examples
                    </Link>
                  </Button>
                  <Link href="/live-feed" className="text-sm text-rausch-700 hover:underline flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Live feed
                  </Link>
                </div>
              </div>

              {/* Mini feature list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-rausch-600" />
                    <h3 className="font-semibold text-gray-900">Fast & affordable</h3>
                  </div>
                  <p className="text-sm text-gray-600">Rule-based + free data sources keep it snappy and low-cost.</p>
                </div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-babu-700" />
                    <h3 className="font-semibold text-gray-900">Dates & pacing</h3>
                  </div>
                  <p className="text-sm text-gray-600">A→B with stops, travel hours/day, and flexible timing.</p>
                </div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-lima-700" />
                    <h3 className="font-semibold text-gray-900">Community-powered</h3>
                  </div>
                  <p className="text-sm text-gray-600">Real stories and tips fuel better planning.</p>
                </div>
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="h-5 w-5 text-rose-600" />
                    <h3 className="font-semibold text-gray-900">Share as you go</h3>
                  </div>
                  <p className="text-sm text-gray-600">Auto trip pages, subdomains, and quick sharing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Horizontal Ad - After Hero */}
        <HorizontalBannerAd
          slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_TOP || '1402294778'}
          page="homepage"
          size="large"
        />

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-10">
              <h3 className="text-2xl lg:text-3xl font-bold text-sleek-black mb-3">How it works</h3>
              <p className="text-base text-sleek-dark-gray max-w-3xl mx-auto">From idea to shareable trip in minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-rausch-600" />
                  <h4 className="font-semibold text-gray-900">1) Tell us where & when</h4>
                </div>
                <p className="text-sm text-gray-600">Enter locations, dates, travel mode and pace. We auto-resolve places worldwide.</p>
              </div>
              <div className="rounded-2xl border p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-5 w-5 text-babu-700" />
                  <h4 className="font-semibold text-gray-900">2) Get your itinerary</h4>
                </div>
                <p className="text-sm text-gray-600">Route, daily plan, travel times, budget hints, highlights and images.</p>
              </div>
              <div className="rounded-2xl border p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <Camera className="h-5 w-5 text-lima-700" />
                  <h4 className="font-semibold text-gray-900">3) Share your journey</h4>
                </div>
                <p className="text-sm text-gray-600">Auto trip pages with subdomain links, live feed posts, and comments.</p>
              </div>
            </div>

            {/* Key benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="rounded-2xl border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-rose-600" />
                  <h4 className="font-semibold text-gray-900">Free data sources first</h4>
                </div>
                <p className="text-sm text-gray-600">OpenTripMap, WikiVoyage, OpenWeather and community data  fast and low-cost.</p>
              </div>
              <div className="rounded-2xl border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-rausch-600" />
                  <h4 className="font-semibold text-gray-900">Community insights</h4>
                </div>
                <p className="text-sm text-gray-600">Real stories, rankings and comments improve every plan.</p>
              </div>
              <div className="rounded-2xl border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-5 w-5 text-babu-700" />
                  <h4 className="font-semibold text-gray-900">Snappy performance</h4>
                </div>
                <p className="text-sm text-gray-600">Optimized fetch, caching and zero storage image strategy for speed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Travel Trip Examples - Timeline Style */}
        <section className="py-12 bg-white">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-sleek-black mb-3">
                This is how your trip could look like
              </h2>
              <p className="text-base text-sleek-dark-gray max-w-3xl mx-auto">
                Discover how our community shares detailed travel experiences that become invaluable planning resources. Each timeline story includes everything you need to recreate or customize the experience.
              </p>
            </div>

            {/* Timeline Layout */}
            <div className="relative mt-8 lg:mt-24">
              {/* Desktop Timeline Line - starts from first card at title level */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-teal-300 top-3 bottom-0 hidden lg:block"></div>

              {/* Trip Cards */}
              <div className="space-y-0 lg:space-y-0">
                {tripExamples.map((trip, index) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    position={index % 2 === 0 ? 'left' : 'right'}
                    index={index}
                    isLastCard={index === tripExamples.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Locations */}
        <FeaturedLocations />

        {/* Horizontal Ad - Mid-page */}
        <HorizontalBannerAd
          slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_MID || '1402294778'}
          page="homepage"
          size="standard"
        />

        {/* Categories - sleek Style */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-sleek-black mb-12 text-center">
              Browse by category
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { icon: "🏔️", name: "Mountains", count: "1,247 places", filter: "mountains" },
                { icon: "🏖️", name: "Beaches", count: "892 places", filter: "beaches" },
                { icon: "🏛️", name: "Historical", count: "634 places", filter: "historical" },
                { icon: "🌲", name: "Nature", count: "2,156 places", filter: "nature" },
                { icon: "🏙️", name: "Cities", count: "1,834 places", filter: "cities" },
                { icon: "🎨", name: "Culture", count: "967 places", filter: "culture" }
              ].map((category, index) => (
                <Link key={index} href={`/locations?category=${category.filter}`} className="group cursor-pointer">
                  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-center group-hover:scale-105">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-sleek-black mb-1 group-hover:text-rausch-500 transition-colors">{category.name}</h3>
                    <p className="text-sm text-sleek-gray">{category.count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Travel Planning Focus */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-sleek-black mb-4">
                Plan your perfect trip
              </h2>
              <p className="text-lg text-sleek-dark-gray max-w-2xl mx-auto">
                From discovery to memories, we make travel planning simple and inspiring
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Compass className="h-8 w-8 text-rausch-500" />,
                  title: "Discover",
                  description: "Explore unique destinations and hidden gems recommended by fellow travelers and local experts."
                },
                {
                  icon: <Calendar className="h-8 w-8 text-rausch-500" />,
                  title: "Plan",
                  description: "Create detailed itineraries, book experiences, and organize your trip with our smart planning tools."
                },
                {
                  icon: <Camera className="h-8 w-8 text-rausch-500" />,
                  title: "Share",
                  description: "Document your journey and inspire others with beautiful stories and authentic travel experiences."
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-sleek-black mb-3">{step.title}</h3>
                  <p className="text-sleek-dark-gray">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Social Proof */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-sleek-black mb-4">
                Where Sharing Meets Planning
              </h2>
              <p className="text-lg text-sleek-dark-gray">
                Join 25K+ travelers sharing authentic experiences and planning amazing trips
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  location: "Vancouver, Canada",
                  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&q=70&auto=format",
                  rating: 5,
                  text: "TravelBlogr helped me discover hidden gems in Japan that I never would have found otherwise. The local recommendations were spot-on!"
                },
                {
                  name: "Marcus Rodriguez",
                  location: "Barcelona, Spain",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=70&auto=format",
                  rating: 5,
                  text: "The planning tools made organizing our family trip to Patagonia so much easier. Everything was perfectly coordinated!"
                },
                {
                  name: "Emma Thompson",
                  location: "London, UK",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=70&auto=format",
                  rating: 5,
                  text: "I love sharing my travel stories here. The community is so supportive and I've made friends from all over the world!"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sleek-dark-gray mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        quality={70}
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sleek-black">{testimonial.name}</p>
                      <p className="text-sm text-sleek-gray">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Safety - sleek Style */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-sleek-black mb-4">
                Travel with confidence
              </h2>
              <p className="text-lg text-sleek-dark-gray">
                Your safety and satisfaction are our top priorities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="h-8 w-8 text-green-500" />,
                  title: "Verified Reviews",
                  description: "All reviews are from real travelers who have visited these destinations."
                },
                {
                  icon: <Award className="h-8 w-8 text-blue-500" />,
                  title: "Expert Curation",
                  description: "Our team of travel experts carefully curates every destination and experience."
                },
                {
                  icon: <Zap className="h-8 w-8 text-purple-500" />,
                  title: "24/7 Support",
                  description: "Get help whenever you need it with our round-the-clock customer support."
                }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-sleek-black mb-3">{feature.title}</h3>
                  <p className="text-sleek-dark-gray">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

        {/* Marketing FAQ (reusable) */}
        <MarketingFAQ />

        </section>

        {/* Final CTA - sleek Style */}
        <section className="py-20 bg-gradient-to-r from-rausch-500 to-rausch-600">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Share to Inspire, Plan to Explore
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers sharing authentic experiences and planning amazing trips through our community. Your stories inspire others, their experiences guide your adventures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-rausch-500 hover:bg-gray-100 font-semibold">
                <Link href="/auth/signup">
                   Share Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-rausch-500">
                <Link href="/locations">
                  Plan Your Trip
                </Link>
              </Button>
            </div>

            {/* App Download */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-white/80 mb-4">Get the mobile app</p>
              <div className="flex justify-center gap-4">
                <div className="bg-black rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-800 transition-colors">
                  <div className="text-white">
                    <div className="text-xs">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </div>
                <div className="bg-black rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-800 transition-colors">
                  <div className="text-white">
                    <div className="text-xs">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
