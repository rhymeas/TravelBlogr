'use client'

/**
 * Social Share Component
 * 
 * Share blog posts and trips on social media platforms.
 * Supports Twitter, Facebook, LinkedIn, WhatsApp, and copy link.
 */

import { useState } from 'react'
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Link as LinkIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  hashtags?: string[]
  variant?: 'buttons' | 'dropdown' | 'modal'
  className?: string
}

export function SocialShare({
  url,
  title,
  description,
  hashtags = [],
  variant = 'buttons',
  className = ''
}: SocialShareProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ')

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtagString ? `&hashtags=${hashtags.join(',')}` : ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
    setShowDropdown(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error)
      }
    } else {
      setShowDropdown(!showDropdown)
    }
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-600 mr-2">Share:</span>
        
        <button
          onClick={() => handleShare('twitter')}
          className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-5 w-5" />
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-5 w-5" />
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className="p-2 rounded-full hover:bg-blue-50 text-blue-700 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-5 w-5" />
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </button>

        <button
          onClick={handleCopyLink}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <LinkIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <Card className="absolute right-0 mt-2 w-48 p-2 z-50 shadow-lg">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                <Twitter className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Twitter</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Facebook</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                <span className="text-sm">LinkedIn</span>
              </button>

              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">WhatsApp</span>
              </button>

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Copy link</span>
                  </>
                )}
              </button>
            </Card>
          </>
        )}
      </div>
    )
  }

  return null
}

/**
 * Compact Share Button
 * Just a share icon that opens native share or dropdown
 */
export function ShareButton({
  url,
  title,
  description,
  className = ''
}: Omit<SocialShareProps, 'variant'>) {
  return (
    <SocialShare
      url={url}
      title={title}
      description={description}
      variant="dropdown"
      className={className}
    />
  )
}

