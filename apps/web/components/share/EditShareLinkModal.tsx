'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface EditShareLinkModalProps {
  shareLink: any
  onClose: () => void
  onSubmit: (updates: any) => void
}

export function EditShareLinkModal({ shareLink, onClose, onSubmit }: EditShareLinkModalProps) {
  const [formData, setFormData] = useState({
    title: shareLink.title || '',
    description: shareLink.description || '',
    settings: {
      showLocation: shareLink.settings?.showLocation ?? true,
      showDates: shareLink.settings?.showDates ?? true,
      showPhotos: shareLink.settings?.showPhotos ?? true,
      showComments: shareLink.settings?.showComments ?? true,
      allowDownload: shareLink.settings?.allowDownload ?? true,
      requirePassword: shareLink.settings?.requirePassword ?? false,
      password: '',
      expiresAt: shareLink.settings?.expiresAt || '',
      showPersonalInfo: shareLink.settings?.showPersonalInfo ?? true,
      showPrivateNotes: shareLink.settings?.showPrivateNotes ?? false,
      showExpenses: shareLink.settings?.showExpenses ?? false,
      showContacts: shareLink.settings?.showContacts ?? true,
      watermarkPhotos: shareLink.settings?.watermarkPhotos ?? false,
      enableAnalytics: shareLink.settings?.enableAnalytics ?? true,
      allowEmbedding: shareLink.settings?.allowEmbedding ?? true,
      seoEnabled: shareLink.settings?.seoEnabled ?? true
    },
    customization: {
      theme: shareLink.customization?.theme || 'default',
      primaryColor: shareLink.customization?.primaryColor || '#3b82f6',
      backgroundColor: shareLink.customization?.backgroundColor || '#ffffff',
      textColor: shareLink.customization?.textColor || '#1f2937',
      fontFamily: shareLink.customization?.fontFamily || 'Inter',
      showBranding: shareLink.customization?.showBranding ?? true,
      customMessage: shareLink.customization?.customMessage || '',
      customCSS: shareLink.customization?.customCSS || '',
      socialLinks: {
        instagram: shareLink.customization?.socialLinks?.instagram || '',
        twitter: shareLink.customization?.socialLinks?.twitter || '',
        facebook: shareLink.customization?.socialLinks?.facebook || '',
        website: shareLink.customization?.socialLinks?.website || ''
      }
    },
    is_active: shareLink.is_active
  })

  const [currentStep, setCurrentStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Hash password if provided
    let processedData = { ...formData }
    if (formData.settings.requirePassword && formData.settings.password) {
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(formData.settings.password, 10)
      processedData.settings = {
        ...formData.settings,
        passwordHash,
        password: undefined // Remove plain text password
      }
    }

    onSubmit(processedData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Share Link</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Settings */}
          {currentStep === 1 && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-medium">Basic Settings</h3>
              
              {/* Subdomain (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom URL
                </label>
                <div className="flex items-center">
                  <Input
                    value={shareLink.subdomain}
                    disabled
                    className="flex-1 bg-gray-50"
                  />
                  <span className="ml-2 text-sm text-gray-500">.travelblogr.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Subdomain cannot be changed after creation
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="My Amazing Trip"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of this share link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium">Link is active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Inactive links cannot be accessed by visitors
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <div></div>
                <Button type="button" onClick={() => setCurrentStep(2)}>
                  Next: Privacy Settings
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Privacy & Settings */}
          {currentStep === 2 && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-medium">Privacy & Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Content Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Content</h4>
                  
                  {[
                    { key: 'showLocation', label: 'Show locations' },
                    { key: 'showDates', label: 'Show dates' },
                    { key: 'showPhotos', label: 'Show photos' },
                    { key: 'showComments', label: 'Show comments' },
                    { key: 'showPersonalInfo', label: 'Show personal info' },
                    { key: 'showPrivateNotes', label: 'Show private notes' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings[key as keyof typeof formData.settings] as boolean}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, [key]: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Access Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Access</h4>
                  
                  {[
                    { key: 'allowDownload', label: 'Allow downloads' },
                    { key: 'watermarkPhotos', label: 'Watermark photos' },
                    { key: 'enableAnalytics', label: 'Enable analytics' },
                    { key: 'allowEmbedding', label: 'Allow embedding' },
                    { key: 'seoEnabled', label: 'SEO enabled' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings[key as keyof typeof formData.settings] as boolean}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, [key]: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Protection */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.settings.requirePassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, requirePassword: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium">Password protect this link</span>
                </label>
                
                {formData.settings.requirePassword && (
                  <Input
                    type="password"
                    value={formData.settings.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, password: e.target.value }
                    }))}
                    placeholder="Enter new password (leave blank to keep current)"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.settings.expiresAt}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, expiresAt: e.target.value }
                  }))}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <div className="space-x-2">
                  <Button type="submit" variant="outline">
                    Save Changes
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(3)}>
                    Customize Design
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customization */}
          {currentStep === 3 && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-medium">Design Customization</h3>
              
              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={formData.customization.primaryColor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customization: { ...prev.customization, primaryColor: e.target.value }
                    }))}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={formData.customization.backgroundColor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customization: { ...prev.customization, backgroundColor: e.target.value }
                    }))}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={formData.customization.textColor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customization: { ...prev.customization, textColor: e.target.value }
                    }))}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message
                </label>
                <textarea
                  value={formData.customization.customMessage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customization: { ...prev.customization, customMessage: e.target.value }
                  }))}
                  placeholder="A personal message to show at the top of your trip"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Social Links */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.customization.socialLinks).map(([platform, url]) => (
                    <div key={platform}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {platform}
                      </label>
                      <Input
                        type="url"
                        value={url as string}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customization: {
                            ...prev.customization,
                            socialLinks: {
                              ...prev.customization.socialLinks,
                              [platform]: e.target.value
                            }
                          }
                        }))}
                        placeholder={`https://${platform}.com/username`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Branding */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.customization.showBranding}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customization: { ...prev.customization, showBranding: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">Show "Powered by TravelBlogr" branding</span>
                </label>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
