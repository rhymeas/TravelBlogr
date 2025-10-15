'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { User, Mail, Camera, Save, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const supabase = getBrowserSupabase()
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      
      // Refresh the page to update the profile in AuthContext
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    onClose()
    router.back()
  }

  if (!isOpen || !user) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </h3>

              <div className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="mb-2">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="mb-2">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your username will be used in your public profile URL
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="mb-2">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Brief description for your public profile
                  </p>
                </div>

                {/* Avatar */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4" />
                    Profile Picture
                  </Label>
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                      <img
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-rausch-500 text-white rounded-full flex items-center justify-center text-xl font-medium">
                        {fullName ? fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                        <p>Profile picture from Google</p>
                      ) : (
                        <p>No profile picture</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Account ID</span>
                  <span className="text-gray-900 font-mono text-xs">{user.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Sign-in Method</span>
                  <span className="text-gray-900">
                    {user.app_metadata?.provider === 'google' ? 'Google OAuth' : 'Email'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Account Created</span>
                  <span className="text-gray-900">
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            <Button
              onClick={handleClose}
              variant="outline"
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-rausch-500 hover:bg-rausch-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

