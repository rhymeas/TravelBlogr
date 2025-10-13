'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Globe,
  MapPin,
  Menu,
  Search,
  Calendar,
  Users,
  Star,
  Heart,
  Camera,
  Compass,
  TrendingUp,
  Award,
  Shield,
  Zap,
  ChevronRight,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TripCard } from '@/components/ui/TripCard'
import { FeaturedLocations } from '@/components/landing/FeaturedLocations'
import { DashboardLanding } from '@/components/dashboard/DashboardLanding'
import { PublicDestinationSearch } from '@/components/search/PublicDestinationSearch'
import { useAuth } from '@/hooks/useAuth'



// Trip data with detailed information
const tripExamples = [
  {
    id: '1',
    name: 'Banff National Park', // Updated to match our location data
    dates: 'Sep 18-19',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=entropy',
    imageAlt: 'Banff National Park mountain landscape',
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
    image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400&h=300&fit=crop&crop=entropy',
    imageAlt: 'Santorini white buildings and blue domes',
    description: 'Greek island paradise with stunning sunsets, traditional villages, and volcanic beaches.',
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
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=entropy',
    imageAlt: 'Tokyo cityscape at sunset',
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
  }
]

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show dashboard for authenticated users (don't wait for loading)
  if (isAuthenticated && !isLoading) {
    return <DashboardLanding />
  }

  // Show public landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white">

      <main>
        {/* Hero Section - Airbnb Style with Image Background */}
        <section className="relative h-[600px] lg:h-[700px]">
          {/* Hero Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=entropy"
              alt="Beautiful travel destination"
              fill
              className="object-cover"
              priority
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
          </div>

          {/* Search Card Overlay */}
          <div className="relative h-full flex items-center">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
              <div className="max-w-md">
                {/* White Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <h1 className="text-3xl font-bold text-airbnb-black mb-2">
                    Share Your Journey,
                    <br />
                    Plan Your Next Adventure
                  </h1>
                  <p className="text-sm text-airbnb-gray mb-6">
                    Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips.
                  </p>

                  {/* Public Destination Search - Original Functionality */}
                  <div className="mb-4">
                    <PublicDestinationSearch
                      placeholder="Where do you want to go? Search destinations..."
                      showTrending={true}
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs text-airbnb-gray pt-4 border-t border-gray-200">
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

        {/* Gallery CTA - Prominent */}
        <section className="py-12 bg-gradient-to-r from-rausch-50 to-babu-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ✨ Need Inspiration?
              </h2>
              <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
                Check out our curated collection of family-friendly travel guides.
                See real itineraries and get ideas for your next adventure!
              </p>
              <Button asChild size="lg" className="bg-rausch-500 hover:bg-rausch-600 text-white">
                <Link href="/trips-library" className="flex items-center gap-2">
                  <Compass className="h-5 w-5" />
                  View Sample Travel Guides
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Cards - Below Hero */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="h-6 w-6" />,
                  title: "Keep it flexible",
                  description: "Homes with flexible cancellation make it easy to rethink your booking if your plans change."
                },
                {
                  icon: <Star className="h-6 w-6" />,
                  title: "Get the amenities you want",
                  description: "Hot tubs, pools, BBQs—discover dozens of great extras that fit your needs."
                },
                {
                  icon: <Heart className="h-6 w-6" />,
                  title: "Read real reviews",
                  description: "Find homes you'll love based on the great experiences of people who've stayed there."
                }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-airbnb-black mb-2">{feature.title}</h3>
                  <p className="text-sm text-airbnb-gray">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Travel Trip Examples - Timeline Style */}
        <section className="py-12 bg-white">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-airbnb-black mb-3">
                Real Stories, Perfect Plans
              </h2>
              <p className="text-base text-airbnb-dark-gray max-w-3xl mx-auto">
                Discover how our community shares detailed travel experiences that become invaluable planning resources. Each timeline story includes everything you need to recreate or customize the experience.
              </p>
            </div>

            {/* Timeline Layout */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-teal-300 h-full hidden lg:block"></div>

              {/* Trip Cards */}
              <div className="space-y-8">
                {tripExamples.map((trip, index) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    position={index % 2 === 0 ? 'left' : 'right'}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Locations */}
        <FeaturedLocations />

        {/* Categories - Airbnb Style */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-airbnb-black mb-12 text-center">
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
                    <h3 className="font-semibold text-airbnb-black mb-1 group-hover:text-rausch-500 transition-colors">{category.name}</h3>
                    <p className="text-sm text-airbnb-gray">{category.count}</p>
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
              <h2 className="text-3xl lg:text-4xl font-bold text-airbnb-black mb-4">
                Plan your perfect trip
              </h2>
              <p className="text-lg text-airbnb-dark-gray max-w-2xl mx-auto">
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
                  <h3 className="text-xl font-semibold text-airbnb-black mb-3">{step.title}</h3>
                  <p className="text-airbnb-dark-gray">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Social Proof */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-airbnb-black mb-4">
                Where Sharing Meets Planning
              </h2>
              <p className="text-lg text-airbnb-dark-gray">
                Join 25K+ travelers sharing authentic experiences and planning amazing trips
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  location: "Vancouver, Canada",
                  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=150",
                  rating: 5,
                  text: "TravelBlogr helped me discover hidden gems in Japan that I never would have found otherwise. The local recommendations were spot-on!"
                },
                {
                  name: "Marcus Rodriguez",
                  location: "Barcelona, Spain",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=150",
                  rating: 5,
                  text: "The planning tools made organizing our family trip to Patagonia so much easier. Everything was perfectly coordinated!"
                },
                {
                  name: "Emma Thompson",
                  location: "London, UK",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=150",
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
                  <p className="text-airbnb-dark-gray mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-airbnb-black">{testimonial.name}</p>
                      <p className="text-sm text-airbnb-gray">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Safety - Airbnb Style */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-airbnb-black mb-4">
                Travel with confidence
              </h2>
              <p className="text-lg text-airbnb-dark-gray">
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
                  <h3 className="text-xl font-semibold text-airbnb-black mb-3">{feature.title}</h3>
                  <p className="text-airbnb-dark-gray">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Airbnb Style */}
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
                  Share Your Story
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
