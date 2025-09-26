'use client'

import { useState } from 'react'
import { X, Globe, Users, Briefcase, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateShareLinkModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
}

export function CreateShareLinkModal({ onClose, onSubmit }: CreateShareLinkModalProps) {
  const [formData, setFormData] = useState({
    subdomain: '',
    title: '',
    description: '',
    settings: {
      showLocation: true,
      showDates: true,
      showPhotos: true,
      showComments: true,
      allowDownload: true,
      requirePassword: false,
      password: '',
      expiresAt: '',
      showPersonalInfo: true,
      showPrivateNotes: false,
      showExpenses: false,
      showContacts: true,
      watermarkPhotos: false,
      enableAnalytics: true,
      allowEmbedding: true,
      seoEnabled: true
    },
    customization: {
      theme: 'default',
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Inter',
      showBranding: true,
      customMessage: '',
      customCSS: '',
      socialLinks: {
        instagram: '',
        twitter: '',
        facebook: '',
        website: ''
      }
    }
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  const handleSubdomainChange = (value: string) => {
    const cleanValue = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63)

    setFormData(prev => ({ ...prev, subdomain: cleanValue }))
    setSubdomainAvailable(null)
  }

  const checkSubdomainAvailability = async () => {
    if (!formData.subdomain || formData.subdomain.length < 3) return

    setCheckingSubdomain(true)
    try {
      const response = await fetch(`/api/share-links/check-subdomain?subdomain=${formData.subdomain}`)
      const data = await response.json()
      setSubdomainAvailable(data.available)
    } catch (error) {
      console.error('Error checking subdomain:', error)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subdomain || formData.subdomain.length < 3) {
      alert('Subdomain must be at least 3 characters')
      return
    }

    if (subdomainAvailable === false) {
      alert('Subdomain is not available')
      return
    }

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

  const presetTemplates = [
    {
      id: 'public',
      name: 'Public',
      icon: Globe,
      description: 'Share with anyone on the internet',
      settings: {
        showPersonalInfo: false,
        showPrivateNotes: false,
        showExpenses: false,
        showContacts: false,
        watermarkPhotos: true,
        allowDownload: false
      }
    },
    {
      id: 'family',
      name: 'Family',
      icon: Heart,
      description: 'Share with family members',
      settings: {
        showPersonalInfo: true,
        showPrivateNotes: true,
        showExpenses: true,
        showContacts: true,
        watermarkPhotos: false,
        allowDownload: true
      }
    },
    {
      id: 'friends',
      name: 'Friends',
      icon: Users,
      description: 'Share with friends',
      settings: {
        showPersonalInfo: true,
        showPrivateNotes: false,
        showExpenses: false,
        showContacts: true,
        watermarkPhotos: false,
        allowDownload: true
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Briefcase,
      description: 'Share for business purposes',
      settings: {
        showPersonalInfo: false,
        showPrivateNotes: false,
        showExpenses: false,
        showContacts: false,
        watermarkPhotos: true,
        allowDownload: false
      },
      customization: {
        theme: 'professional',
        showBranding: false
      }
    }
  ]

  const applyTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      title: `${template.name} Link`,
      settings: { ...prev.settings, ...template.settings },
      customization: { ...prev.customization, ...template.customization }
    }))
    setCurrentStep(2)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create Share Link</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Choose a template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presetTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="w-full"
                >
                  Skip Templates - Custom Setup
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Settings */}
          {currentStep === 2 && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-medium">Basic Settings</h3>
              
              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom URL *
                </label>
                <div className="flex items-center">
                  <Input
                    value={formData.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    onBlur={checkSubdomainAvailability}
                    placeholder="mytrip"
                    className="flex-1"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-500">.travelblogr.com</span>
                </div>
                
                {checkingSubdomain && (
                  <p className="text-sm text-gray-500 mt-1">Checking availability...</p>
                )}
                
                {subdomainAvailable === true && (
                  <p className="text-sm text-green-600 mt-1">✓ Available</p>
                )}
                
                {subdomainAvailable === false && (
                  <p className="text-sm text-red-600 mt-1">✗ Not available</p>
                )}
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

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)}>
                  Next: Privacy Settings
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Privacy & Settings */}
          {currentStep === 3 && (
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
                    placeholder="Enter password"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <div className="space-x-2">
                  <Button type="submit" variant="outline">
                    Create Link
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(4)}>
                    Customize Design
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Customization */}
          {currentStep === 4 && (
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
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button type="submit">
                  Create Share Link
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
