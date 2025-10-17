'use client'

/**
 * Inline Affiliate Link Component
 * 
 * Contextual affiliate links embedded within content
 */

import { ExternalLink } from 'lucide-react'
import { trackAffiliateClick } from '@/lib/utils/affiliateLinks'

interface InlineAffiliateLinkProps {
  href: string
  provider: string
  children: React.ReactNode
  destination: string
  className?: string
}

export function InlineAffiliateLink({
  href,
  provider,
  children,
  destination,
  className = '',
}: InlineAffiliateLinkProps) {
  const handleClick = () => {
    trackAffiliateClick(provider, destination, 'inline_content_link')
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-rausch-500 hover:text-rausch-600 font-medium underline decoration-dotted underline-offset-2 transition-colors ${className}`}
    >
      {children}
      <ExternalLink className="h-3 w-3 inline" />
    </a>
  )
}

