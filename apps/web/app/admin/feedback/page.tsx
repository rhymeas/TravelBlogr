'use client'

export const dynamic = 'force-dynamic'


import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { MessageSquare, User, Mail, Globe, Clock, CheckCircle, Archive, Loader2, X } from 'lucide-react'
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

    try {
      // First, try to load feedback without the join
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading feedback:', error)
        setFeedbacks([])
      } else {
        // Fetch profiles separately for each feedback with a user_id
        const feedbackWithProfiles = await Promise.all(
          (data || []).map(async (feedback) => {
            if (feedback.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', feedback.user_id)
                .single()

              return {
                ...feedback,
                profiles: profile
              }
            }
            return feedback
          })
        )
        setFeedbacks(feedbackWithProfiles)
      }
    } catch (err) {
      console.error('Exception loading feedback:', err)
      setFeedbacks([])
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
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-amber-100 text-amber-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'archived': return 'bg-gray-100 text-gray-700'
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user feedback and messages</p>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-lg font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">New:</span>
            <span className="text-lg font-semibold text-gray-900">{stats.new}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">In Progress:</span>
            <span className="text-lg font-semibold text-gray-900">{stats.in_progress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Resolved:</span>
            <span className="text-lg font-semibold text-gray-900">{stats.resolved}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex gap-2">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.replace('_', ' ').charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No feedback found</p>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-2">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                onClick={() => setSelectedFeedback(feedback)}
                className="bg-white hover:bg-gray-50 transition-all cursor-pointer group rounded-xl p-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
              >
                {/* Row Content */}
                <div className="flex items-center gap-3">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center group-hover:bg-gray-400 transition-colors">
                      <span className="text-xs font-semibold text-white">
                        {(feedback.profiles?.full_name || feedback.email || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {feedback.profiles?.full_name || feedback.email || 'Anonymous'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(feedback.status)}`}>
                          {feedback.status.replace('_', ' ')}
                        </span>
                        {feedback.page_url && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex-shrink-0">
                            {new URL(feedback.page_url).pathname.split('/')[1] || 'home'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(feedback.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-xs text-white line-clamp-1">
                      {feedback.message}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {feedback.status === 'new' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatus(feedback.id, 'in_progress')
                        }}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
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
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Feedback</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedFeedback.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Header Info - Compact */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-700">
                        {(selectedFeedback.profiles?.full_name || selectedFeedback.email || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {selectedFeedback.profiles?.full_name || selectedFeedback.email || 'Anonymous'}
                      </div>
                      {selectedFeedback.email && (
                        <div className="text-xs text-gray-500 truncate">{selectedFeedback.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedFeedback.page_url && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {new URL(selectedFeedback.page_url).pathname.split('/')[1] || 'home'}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Message</div>
                  <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedFeedback.message}
                  </div>
                </div>

                {/* Admin Response */}
                {selectedFeedback.admin_response && (
                  <div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Admin Response</div>
                    <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed pl-3 border-l-2 border-gray-300">
                      {selectedFeedback.admin_response}
                    </div>
                  </div>
                )}

                {/* Response Form */}
                {selectedFeedback.status !== 'resolved' && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Add Response</div>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
                      rows={3}
                    />
                    <button
                      onClick={submitResponse}
                      disabled={isSubmitting || !response.trim()}
                      className="mt-2 w-full px-3 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Response & Resolve'}
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
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

