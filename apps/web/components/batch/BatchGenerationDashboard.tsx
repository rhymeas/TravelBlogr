'use client'

/**
 * Batch Generation Dashboard
 * 
 * UI for batch content generation using GROQ batch API.
 * Follows design system - uses existing Card, Button, Badge components.
 * No custom CSS - only Tailwind utility classes.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Sparkles, FileText, Image as ImageIcon, Search,
  CheckCircle, Clock, AlertCircle, Loader2, TrendingUp,
  DollarSign, Zap, Calendar, Shield
} from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/lib/utils/adminCheck'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface BatchJob {
  id: string
  type: string
  status: string
  config: {
    sourceIds: string[]
    options: {
      autoPublish?: boolean
      includeAffiliate?: boolean
      seoOptimize?: boolean
    }
  }
  result: {
    totalItems: number
    successCount: number
    failureCount: number
    skippedCount: number
  } | null
  created_at: string
  completed_at: string | null
}

export function BatchGenerationDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrips, setSelectedTrips] = useState<string[]>([])
  const [useRandomPersona, setUseRandomPersona] = useState(false)

  // Check if user is admin
  const userIsAdmin = isAdmin(user?.email)
  const [availableTrips, setAvailableTrips] = useState<any[]>([])

  useEffect(() => {
    loadAvailableTrips()
    loadBatchJobs()
  }, [])

  const loadAvailableTrips = async () => {
    const supabase = getBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get all published trips with their blog post count
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        trip_type,
        destination
      `)
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (!trips) {
      setAvailableTrips([])
      return
    }

    // Filter out trips that already have blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('trip_id')
      .in('trip_id', trips.map(t => t.id))

    const tripIdsWithBlogs = new Set(blogPosts?.map(bp => bp.trip_id) || [])
    const tripsWithoutBlogs = trips.filter(trip => !tripIdsWithBlogs.has(trip.id))

    setAvailableTrips(tripsWithoutBlogs)
  }

  const loadBatchJobs = async () => {
    try {
      const response = await fetch('/api/batch/blog-posts')
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error loading batch jobs:', error)
    }
  }

  const handleGenerateBatch = async () => {
    if (selectedTrips.length === 0) {
      toast.error('Please select at least one trip')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/batch/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripIds: selectedTrips,
          autoPublish: false,
          includeAffiliate: true,
          seoOptimize: true,
          useRandomPersona: useRandomPersona
        })
      })

      const data = await response.json()

      if (data.success) {
        const personaMsg = useRandomPersona ? ' with random personas' : ''
        toast.success(`Batch job created for ${selectedTrips.length} trips${personaMsg}!`)
        setSelectedTrips([])
        setUseRandomPersona(false)
        loadBatchJobs()
        setActiveTab('history')
      } else {
        toast.error(data.error || 'Failed to create batch job')
      }
    } catch (error) {
      console.error('Error creating batch job:', error)
      toast.error('Failed to create batch job')
    } finally {
      setLoading(false)
    }
  }

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      in_progress: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Content Generation</h1>
          <p className="text-gray-600 mt-1">Generate blog posts from your trips automatically</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Button - Only visible to admins */}
          {userIsAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <span>Admin Dashboard</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">50% Cost Savings</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Trips</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{availableTrips.length}</p>
              </div>
              <FileText className="h-8 w-8 text-rausch-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Batch Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{jobs.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Generated Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {jobs.reduce((sum, job) => sum + (job.result?.successCount || 0), 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'generate'
              ? 'text-rausch-500 border-b-2 border-rausch-500'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Generate New
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-rausch-500 border-b-2 border-rausch-500'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Batch History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'generate' ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Trips to Convert</CardTitle>
            <CardDescription>
              Choose trips to automatically generate SEO-optimized blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableTrips.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No trips available for blog generation</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create some trips first or all your trips already have blog posts!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {availableTrips.map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => toggleTripSelection(trip.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTrips.includes(trip.id)
                          ? 'border-rausch-500 bg-rausch-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{trip.title}</h3>
                            {trip.trip_type && (
                              <Badge variant="secondary" className="text-xs">
                                {trip.trip_type}
                              </Badge>
                            )}
                          </div>
                          {trip.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {trip.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {trip.destination && (
                              <span className="flex items-center gap-1">
                                📍 {trip.destination}
                              </span>
                            )}
                            {trip.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(trip.start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedTrips.includes(trip.id) && (
                          <CheckCircle className="h-5 w-5 text-rausch-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Random Persona Option (Admin Only) */}
                  {userIsAdmin && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="randomPersona"
                        checked={useRandomPersona}
                        onChange={(e) => setUseRandomPersona(e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="randomPersona" className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium text-purple-900">
                          🎲 Use Random Persona
                        </span>
                        <p className="text-xs text-purple-700 mt-0.5">
                          Assign a random team member (Emma, Marcus, Yuki, Sophie, or Alex) to write each blog post instead of the trip owner
                        </p>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {selectedTrips.length} trip{selectedTrips.length !== 1 ? 's' : ''} selected
                      {useRandomPersona && <span className="ml-2 text-purple-600">• Random personas</span>}
                    </div>

                    <Button
                      onClick={handleGenerateBatch}
                      disabled={loading || selectedTrips.length === 0}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating Batch...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate {selectedTrips.length} Blog Post{selectedTrips.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No batch jobs yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create your first batch job to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getStatusIcon(job.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            Blog Posts from Trips
                          </h3>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{job.config.sourceIds.length} trips selected</p>
                          <p className="text-xs text-gray-500">
                            Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {job.result && (
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-green-600">
                              ✓ {job.result.successCount} success
                            </span>
                            {job.result.failureCount > 0 && (
                              <span className="text-red-600">
                                ✗ {job.result.failureCount} failed
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

