'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Lock, Globe, Check, Share2, Mail, MessageCircle, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface QuickShareModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  tripTitle: string
  existingShareLink?: {
    id: string
    subdomain: string
    settings: {
      requirePassword?: boolean
      passwordHash?: string
    }
  } | null
}

export function QuickShareModal({ 
  isOpen, 
  onClose, 
  tripId, 
  tripTitle,
  existingShareLink 
}: QuickShareModalProps) {
  const [subdomain, setSubdomain] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Auto-generate subdomain from trip title
  useEffect(() => {
    if (isOpen && !existingShareLink) {
      const autoSubdomain = tripTitle
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 63)
      setSubdomain(autoSubdomain)
    } else if (existingShareLink) {
      setSubdomain(existingShareLink.subdomain)
      setShareLink(`https://${existingShareLink.subdomain}.travelblogr.com`)
      setRequirePassword(!!existingShareLink.settings?.requirePassword)
      generateQRCode(`https://${existingShareLink.subdomain}.travelblogr.com`)
    }
  }, [isOpen, tripTitle, existingShareLink])

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2B5F9E',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleCreateShareLink = async () => {
    if (!subdomain || subdomain.length < 3) {
      toast.error('Subdomain must be at least 3 characters')
      return
    }

    if (requirePassword) {
      if (!password || password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
    }

    setIsCreating(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subdomain,
          title: tripTitle,
          password: requirePassword ? password : null,
          settings: {
            requirePassword,
            showLocation: true,
            showDates: true,
            showPhotos: true,
            showComments: true,
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create share link')
      }

      const data = await response.json()
      const url = `https://${data.shareLink.subdomain}.travelblogr.com`
      setShareLink(url)
      await generateQRCode(url)
      toast.success('Share link created!')
    } catch (error: any) {
      console.error('Error creating share link:', error)
      toast.error(error.message || 'Failed to create share link')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string, label: string = 'Link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const shareVia = async (method: 'email' | 'whatsapp' | 'twitter') => {
    if (!shareLink) return

    const text = `Check out my trip: ${tripTitle}`
    const url = shareLink

    switch (method) {
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(tripTitle)}&body=${encodeURIComponent(`${text}\n\n${url}${requirePassword ? `\n\nPassword: ${password}` : ''}`)}`)
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}${requirePassword ? `\nPassword: ${password}` : ''}`)}`)
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#2B5F9E20' }}>
              <Share2 className="h-5 w-5" style={{ color: '#2B5F9E' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Share Trip</h2>
              <p className="text-xs text-gray-600">{tripTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!shareLink ? (
            <>
              {/* Subdomain Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Trip URL
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">https://</span>
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="my-trip"
                  />
                  <span className="text-sm text-gray-500">.travelblogr.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be your unique trip URL
                </p>
              </div>

              {/* Password Protection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Password Protection
                  </label>
                  <button
                    onClick={() => setRequirePassword(!requirePassword)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      requirePassword ? "bg-blue-600" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        requirePassword ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {requirePassword && (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Visitors will need this password to view your trip
                    </p>
                  </div>
                )}
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShareLink}
                disabled={isCreating || !subdomain}
                className="w-full py-3 rounded-lg font-medium text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: isCreating || !subdomain ? undefined : '#2B5F9E' }}
              >
                {isCreating ? 'Creating...' : 'Create Share Link'}
              </button>
            </>
          ) : (
            <>
              {/* Share Link Created */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Share link created!</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password Display */}
              {requirePassword && password && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Password Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(password, 'Password')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Share this password with people you want to give access to
                  </p>
                </div>
              )}

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-3">Scan QR Code</p>
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-lg shadow-md" />
                </div>
              )}

              {/* Share Via */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Share via</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => shareVia('email')}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="h-6 w-6 text-gray-600" />
                    <span className="text-xs text-gray-600">Email</span>
                  </button>
                  <button
                    onClick={() => shareVia('whatsapp')}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageCircle className="h-6 w-6 text-green-600" />
                    <span className="text-xs text-gray-600">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => shareVia('twitter')}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-6 w-6 text-blue-400" />
                    <span className="text-xs text-gray-600">Twitter</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

