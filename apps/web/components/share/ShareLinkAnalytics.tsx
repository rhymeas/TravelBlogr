'use client'

import { useEffect } from 'react'

interface ShareLinkAnalyticsProps {
  shareLinkId: string
  subdomain: string
}

export function ShareLinkAnalytics({ shareLinkId, subdomain }: ShareLinkAnalyticsProps) {
  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shareLinkId,
            subdomain,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href
          })
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()

    // Track time on page
    const startTime = Date.now()
    
    const trackTimeOnPage = () => {
      const timeSpent = Date.now() - startTime
      
      fetch('/api/analytics/time-spent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareLinkId,
          timeSpent,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error)
    }

    // Track when user leaves
    const handleBeforeUnload = () => {
      trackTimeOnPage()
    }

    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      trackTimeOnPage()
    }
  }, [shareLinkId, subdomain])

  return null // This component doesn't render anything
}
