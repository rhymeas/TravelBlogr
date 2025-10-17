'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { MessageSquare, User, Mail, Globe, Clock, CheckCircle, Archive, Loader2 } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'

interface Feedback {
  id: string
  user_id: string | null
  email: string | null
  message: string
  page_url: string | null
  user_agent: string | null
  status: 'new' | 'in_progress' | 'resolved' | 'archived'
  admin_response: string | null
  admin_user_id: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  profiles?: {
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadFeedback()
  }, [filter])

  const loadFeedback = async () => {
    setIsLoading(true)
    const supabase = getBrowserSupabase()

    let query = supabase
      .from('feedback')
      .select(`
        *,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading feedback:', error)
    } else {
      setFeedbacks(data || [])
    }

    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: Feedback['status']) => {
    const supabase = getBrowserSupabase()
    
    const updates: any = { status }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)

    if (!error) {
      loadFeedback()
      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, status, ...updates })
      }
    }
  }

  const submitResponse = async () => {
    if (!selectedFeedback || !response.trim()) return

    setIsSubmitting(true)
    const supabase = getBrowserSupabase()

    const { error } = await supabase
      .from('feedback')
      .update({
        admin_response: response.trim(),
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', selectedFeedback.id)

    if (!error) {
      setResponse('')
      setSelectedFeedback(null)
      loadFeedback()
    }

    setIsSubmitting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    in_progress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Feedback</h1>
          <p className="text-gray-600">Manage and respond to user feedback</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">New</div>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f.replace('_', ' ').charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No feedback found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {feedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedFeedback(feedback)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {feedback.profiles?.full_name || feedback.email || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                    {feedback.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Message */}
                <p className="text-gray-700 mb-4 line-clamp-3">{feedback.message}</p>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {feedback.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {feedback.email}
                    </div>
                  )}
                  {feedback.page_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {new URL(feedback.page_url).pathname}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {feedback.status === 'new' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateStatus(feedback.id, 'in_progress')
                      }}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium hover:bg-yellow-200"
                    >
                      Start
                    </button>
                  )}
                  {feedback.status !== 'resolved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateStatus(feedback.id, 'resolved')
                      }}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">From</div>
                  <div className="text-gray-900">
                    {selectedFeedback.profiles?.full_name || selectedFeedback.email || 'Anonymous'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Message</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.message}</div>
                </div>

                {selectedFeedback.admin_response && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Admin Response</div>
                    <div className="text-gray-900 bg-green-50 p-4 rounded-lg">{selectedFeedback.admin_response}</div>
                  </div>
                )}

                {selectedFeedback.status !== 'resolved' && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Add Response</div>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                    <button
                      onClick={submitResponse}
                      disabled={isSubmitting || !response.trim()}
                      className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Response & Resolve'}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

