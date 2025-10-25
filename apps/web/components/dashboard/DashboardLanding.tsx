'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  MapPin,
  Camera,
  Users,
  TrendingUp,
  Calendar,
  ArrowRight,
  Star,
  Eye,
  Shield,
  Zap,
  PenLine,
  Heart,
  Check,
  StickyNote,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { UnifiedTripCard } from '@/components/trips/UnifiedTripCard'
import { getBrowserSupabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/utils/adminCheck'

const quickStats = [
  { label: 'Total Trips', value: '12', icon: MapPin, color: 'text-blue-600' },
  { label: 'Published', value: '8', icon: TrendingUp, color: 'text-green-600' },
  { label: 'Total Views', value: '15.2K', icon: Eye, color: 'text-purple-600' },
  { label: 'Followers', value: '234', icon: Users, color: 'text-orange-600' }
]

export function DashboardLanding() {
  const { user, profile } = useAuth()
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const adLoadedRef = useRef(false)

  // Check if user is admin
  const userIsAdmin = isAdmin(user?.email)

  useEffect(() => {
    if (user) {
      fetchRecentTrips()
    }
  }, [user])

  // Initialize Google Ads - only once
  useEffect(() => {
    // Skip if already loaded or in development strict mode double-render
    if (adLoadedRef.current) return

    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        adLoadedRef.current = true
      }
    } catch (error) {
      console.error('Error loading ad:', error)
    }
  }, [])

  const fetchRecentTrips = async () => {
    try {
      const supabase = getBrowserSupabase()
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          posts (id),
          share_links (id),
          trip_stats (total_views, unique_views)
        `)
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('Error fetching recent trips:', error)
      } else {
        // Transform data to include view_count
        const tripsWithViews = data.map(trip => ({
          ...trip,
          view_count: trip.trip_stats?.[0]?.total_views || 0
        }))
        setRecentTrips(tripsWithViews)
      }
    } catch (error) {
      console.error('Error fetching recent trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6">
        {/* Welcome Section - Compact */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Traveler'}!
            </h1>
            <p className="text-sm text-gray-600">
              Ready to share your next adventure?
            </p>
          </div>

          {/* Admin Buttons - Only visible to admins */}
          {userIsAdmin && (
            <div className="flex items-center gap-2">
              <Link href="/test-activity-images">
                <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">Image Test</span>
                </Button>
              </Link>
              <Link href="/dashboard/batch">
                <Button variant="outline" className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-600 font-medium">Batch Generation</span>
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2 border-red-200 hover:bg-red-50">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">Admin Dashboard</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions - With Clear CTAs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          <Link href="/dashboard/trips/new" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Create Trip</h3>
                  <p className="text-xs text-white/90">Plan adventure</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/my-wishlist" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-pink-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">My Wishlist</h3>
                  <p className="text-xs text-white/90">Dream places</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/my-visited" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">My Visited</h3>
                  <p className="text-xs text-white/90">Travel history</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/my-notes" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <StickyNote className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">My Notes</h3>
                  <p className="text-xs text-white/90">Travel memories</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/media" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Media</h3>
                  <p className="text-xs text-white/90">Photos & videos</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/live-feed" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Live Feed</h3>
                  <p className="text-xs text-white/90">Discover stories</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/blog" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-pink-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <PenLine className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Write Blog</h3>
                  <p className="text-xs text-white/90">Share stories</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/locations" className="group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-green-600 h-32 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400')] bg-cover bg-center opacity-20"></div>
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Explore</h3>
                  <p className="text-xs text-white/90">Find locations</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Overview - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <div>
                  <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Trips - 50% Width, 2 Columns */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Recent Trips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sleek Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Your Recent Trips</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Continue your travel journey</p>
                </div>
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Compact Content */}
            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : recentTrips.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No trips yet</h3>
                  <p className="text-xs text-gray-600 mb-3">Create your first trip!</p>
                  <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-8 text-xs">
                    <Link href="/dashboard/trips/new">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Trip
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentTrips.slice(0, 3).map((trip, index) => (
                    <Link
                      key={trip.id}
                      href={`/dashboard/trips/${trip.id}`}
                      className="block group"
                    >
                      <div className="relative overflow-hidden rounded-lg p-2.5 hover:bg-gray-50 transition-all border border-gray-100 hover:border-blue-200">
                        <div className="flex items-center gap-2.5">
                          {/* Smaller Trip Image/Icon */}
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {trip.cover_image ? (
                              <img
                                src={trip.cover_image}
                                alt={trip.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                index === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                index === 1 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                'bg-gradient-to-br from-pink-500 to-pink-600'
                              }`}>
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Compact Trip Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {trip.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                trip.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {trip.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>

                          <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Big "View All Trips" Button */}
                  <Link href="/dashboard/trips" className="block mt-2">
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all p-3 shadow-sm hover:shadow-md">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400')] bg-cover bg-center opacity-10"></div>
                      <div className="relative flex items-center justify-center gap-2 text-white">
                        <span className="text-sm font-bold">View All My Trips</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sleek Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Quick Stats</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your travel overview</p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <stat.icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                  </div>
                  <span className="text-base font-bold text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inspiration Section - Sleek */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="px-5 py-5 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Need Inspiration?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Explore trending destinations and discover travel stories
              </p>
              <Button asChild size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                <Link href="/locations">
                  Discover Destinations
                </Link>
              </Button>
            </div>
            <div className="hidden md:flex items-center justify-center flex-shrink-0 ml-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Google Ad - Compact Horizontal Banner */}
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-400 text-center mb-2">Advertisement</p>
            <div className="flex items-center justify-center min-h-[80px]">
              <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || 'ca-pub-5985120367077865'}
                data-ad-slot="1234567890"
                data-ad-format="horizontal"
                data-full-width-responsive="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
