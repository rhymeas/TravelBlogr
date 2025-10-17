'use client'

import { useState, useEffect } from 'react'
import { X, Lock, Globe, Users, Key, Info } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface TripPrivacyModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  currentPrivacy: string
  onUpdate: (privacy: string) => void
}

type PrivacyOption = 'public' | 'private' | 'family' | 'password'

export function TripPrivacyModal({
  isOpen,
  onClose,
  tripId,
  currentPrivacy,
  onUpdate
}: TripPrivacyModalProps) {
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyOption>(
    (currentPrivacy as PrivacyOption) || 'public'
  )
  const [password, setPassword] = useState('')
  const [familyEmails, setFamilyEmails] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedPrivacy((currentPrivacy as PrivacyOption) || 'public')
      setPassword('')
      setFamilyEmails('')
    }
  }, [isOpen, currentPrivacy])

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const updateData: any = {
        privacy: selectedPrivacy,
        updated_at: new Date().toISOString()
      }

      // Handle password-protected trips
      if (selectedPrivacy === 'password') {
        if (!password || password.length < 4) {
          toast.error('Password must be at least 4 characters')
          return
        }
        updateData.privacy_password = password
      } else {
        updateData.privacy_password = null
      }

      // Handle family-only trips
      if (selectedPrivacy === 'family') {
        if (familyEmails.trim()) {
          // Convert emails to user IDs (simplified - in production, validate emails)
          const emails = familyEmails.split(',').map(e => e.trim()).filter(Boolean)
          
          // Fetch user IDs from emails
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', emails)

          if (usersError) {
            console.error('Error fetching users:', usersError)
            toast.error('Failed to find some users')
            return
          }

          updateData.family_members = users?.map(u => u.id) || []
        } else {
          updateData.family_members = []
        }
      } else {
        updateData.family_members = null
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)

      if (error) throw error

      toast.success('Privacy settings updated!')
      onUpdate(selectedPrivacy)
      onClose()
    } catch (error: any) {
      console.error('Error updating privacy:', error)
      toast.error(error.message || 'Failed to update privacy settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const privacyOptions = [
    {
      value: 'public' as PrivacyOption,
      icon: Globe,
      label: 'Public',
      description: 'Anyone with the link can view this trip',
      color: 'text-green-600'
    },
    {
      value: 'private' as PrivacyOption,
      icon: Lock,
      label: 'Private',
      description: 'Only you can view this trip',
      color: 'text-gray-600'
    },
    {
      value: 'family' as PrivacyOption,
      icon: Users,
      label: 'Family Members',
      description: 'Only designated family members can view',
      color: 'text-blue-600'
    },
    {
      value: 'password' as PrivacyOption,
      icon: Key,
      label: 'Password Protected',
      description: 'Requires a password to view',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Control who can view your trip</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Privacy Options */}
          <div className="space-y-3">
            {privacyOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedPrivacy === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedPrivacy(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-rausch-500 bg-rausch-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-rausch-500' : option.color}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 bg-rausch-500 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Password Input (shown when password-protected is selected) */}
          {selectedPrivacy === 'password' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  Set a password that viewers will need to enter to access your trip
                </div>
              </div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 4 characters)"
                className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Family Members Input (shown when family is selected) */}
          {selectedPrivacy === 'family' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Enter email addresses of family members who can view this trip (comma-separated)
                </div>
              </div>
              <textarea
                value={familyEmails}
                onChange={(e) => setFamilyEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={3}
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-rausch-500 hover:bg-rausch-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

