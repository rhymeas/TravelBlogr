import Link from 'next/link'
import { MapPin, Star, Eye, Camera, ArrowRight } from 'lucide-react'

const sampleLocations = [
  {
    id: 1,
    name: 'Paris, France',
    region: 'Île-de-France',
    country: 'France',
    rating: 4.8,
    visitCount: 1234,
    postCount: 45,
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop',
    description: 'The City of Light offers endless romance, world-class museums, and incredible cuisine.'
  },
  {
    id: 2,
    name: 'Tokyo, Japan',
    region: 'Kantō',
    country: 'Japan',
    rating: 4.9,
    visitCount: 987,
    postCount: 32,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    description: 'A fascinating blend of ultra-modern and traditional, from neon-lit skyscrapers to ancient temples.'
  },
  {
    id: 3,
    name: 'Santorini, Greece',
    region: 'South Aegean',
    country: 'Greece',
    rating: 4.7,
    visitCount: 756,
    postCount: 28,
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
    description: 'Stunning sunsets, white-washed buildings, and crystal-clear waters make this island paradise unforgettable.'
  },
  {
    id: 4,
    name: 'New York City, USA',
    region: 'New York',
    country: 'United States',
    rating: 4.6,
    visitCount: 2156,
    postCount: 67,
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
    description: 'The city that never sleeps offers world-class dining, Broadway shows, and iconic landmarks.'
  },
  {
    id: 5,
    name: 'Bali, Indonesia',
    region: 'Lesser Sunda Islands',
    country: 'Indonesia',
    rating: 4.8,
    visitCount: 1543,
    postCount: 89,
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop',
    description: 'Tropical paradise with lush rice terraces, ancient temples, and pristine beaches.'
  },
  {
    id: 6,
    name: 'Machu Picchu, Peru',
    region: 'Cusco',
    country: 'Peru',
    rating: 4.9,
    visitCount: 432,
    postCount: 23,
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=600&fit=crop',
    description: 'Ancient Incan citadel perched high in the Andes Mountains, a true wonder of the world.'
  }
]

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-300 shadow-airbnb-light">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-title-medium text-airbnb-black font-semibold">TravelBlogr</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <Link href="/locations" className="text-body-large font-medium text-rausch-500 py-2 px-3 rounded-lg bg-rausch-50">
              Locations
            </Link>
            <Link href="/live-feed" className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-3 rounded-lg hover:bg-gray-50">
              Live Feed
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-3">
            <Link href="/auth/signin" className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary text-body-large font-semibold px-6 py-3 rounded-airbnb-small hover:scale-105 transition-transform">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-display-large text-airbnb-black mb-4">
              Discover Amazing Destinations
            </h1>
            <p className="text-body-large text-airbnb-dark-gray max-w-2xl mx-auto leading-relaxed">
              Explore travel stories and experiences from destinations around the world. Get inspired for your next adventure.
            </p>
          </div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sampleLocations.map((location) => (
              <div key={location.id} className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden group">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm rounded-airbnb-small px-3 py-1 text-body-small font-semibold text-airbnb-black shadow-airbnb-light flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {location.rating}
                    </div>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-airbnb-small flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {location.visitCount}
                    </div>
                    <div className="bg-black/70 backdrop-blur-sm text-white text-body-small px-2 py-1 rounded-airbnb-small flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {location.postCount}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-2">
                    <h3 className="text-title-small text-airbnb-black font-semibold mb-1 group-hover:text-rausch-500 transition-colors">
                      {location.name}
                    </h3>
                    <div className="flex items-center gap-1 text-body-medium text-airbnb-dark-gray">
                      <MapPin className="h-4 w-4" />
                      <span>{location.region}, {location.country}</span>
                    </div>
                  </div>

                  <p className="text-body-medium text-airbnb-dark-gray leading-relaxed mb-4">
                    {location.description}
                  </p>

                  <Link
                    href={`/locations/${location.id}`}
                    className="text-body-medium font-semibold text-rausch-500 hover:text-rausch-600 transition-colors flex items-center gap-1"
                  >
                    Explore destination
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-display-small text-airbnb-black mb-4">
              Share Your Own Travel Stories
            </h2>
            <p className="text-body-large text-airbnb-dark-gray mb-8 max-w-2xl mx-auto leading-relaxed">
              Join our community of travelers and share your adventures with the world.
            </p>
            <Link 
              href="/auth/signup"
              className="btn-primary px-8 py-4 text-body-large font-semibold rounded-airbnb-small hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Start Sharing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
