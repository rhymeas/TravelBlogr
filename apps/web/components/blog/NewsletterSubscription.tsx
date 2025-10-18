'use client'

/**
 * NewsletterSubscription - Email capture component
 * Integrates with Supabase for email storage
 * Uses existing Input and Button components
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface NewsletterSubscriptionProps {
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  variant?: 'default' | 'compact' | 'inline'
  className?: string
  onSuccess?: (email: string) => void
}

export function NewsletterSubscription({
  title = 'Subscribe To Get The Latest News About Us',
  description = 'Subscribe to our newsletter to get the latest travel tips, destination guides, and exclusive offers.',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  variant = 'default',
  className,
  onSuccess
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to subscribe')
      }

      setSubscribed(true)
      toast.success('Successfully subscribed to newsletter!')
      
      if (onSuccess) {
        onSuccess(email)
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setEmail('')
        setSubscribed(false)
      }, 3000)
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-rausch-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || subscribed}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || subscribed}
            className="whitespace-nowrap"
          >
            {loading ? 'Subscribing...' : subscribed ? 'Subscribed!' : buttonText}
          </Button>
        </form>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn('flex gap-2 max-w-md', className)}>
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || subscribed}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading || subscribed}
        >
          {loading ? 'Subscribing...' : subscribed ? <CheckCircle className="h-4 w-4" /> : buttonText}
        </Button>
      </form>
    )
  }

  // Default variant - full featured
  return (
    <div className={cn(
      'bg-gradient-to-r from-rausch-50 to-orange-50 rounded-2xl p-8 md:p-12',
      className
    )}>
      <div className="max-w-3xl mx-auto text-center space-y-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md">
          <Mail className="h-8 w-8 text-rausch-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                type="email"
                placeholder={placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || subscribed}
                className="w-full h-12 pl-4 pr-4 bg-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || subscribed}
              size="lg"
              className="h-12 px-8 whitespace-nowrap"
            >
              {loading ? (
                'Subscribing...'
              ) : subscribed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Subscribed!
                </>
              ) : (
                buttonText
              )}
            </Button>
          </div>
        </form>

        {/* Success/Error Messages */}
        {subscribed && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Thank you for subscribing! Check your email for confirmation.
            </span>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-xs text-gray-500">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  )
}

/**
 * NewsletterPopup - Modal version for exit intent or timed popup
 */
interface NewsletterPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function NewsletterPopup({
  isOpen,
  onClose,
  title = 'Don\'t Miss Out!',
  description = 'Get the latest travel tips and exclusive deals delivered to your inbox.'
}: NewsletterPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <AlertCircle className="h-5 w-5" />
        </button>

        <NewsletterSubscription
          title={title}
          description={description}
          variant="compact"
          onSuccess={onClose}
        />
      </div>
    </div>
  )
}

