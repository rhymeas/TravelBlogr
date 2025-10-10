/**
 * TranslatedLocationName Component
 * Displays location names with automatic translation
 */

'use client'

import { useLocationTranslation } from '@/hooks/useTranslation'
import { Loader2 } from 'lucide-react'

interface TranslatedLocationNameProps {
  name: string
  className?: string
  showOriginal?: boolean // Whether to show original name in parentheses
  showLoadingIndicator?: boolean
}

export function TranslatedLocationName({
  name,
  className = '',
  showOriginal = true,
  showLoadingIndicator = false
}: TranslatedLocationNameProps) {
  const { displayName, isTranslating, needsTranslation, original, translated } = useLocationTranslation(name)

  if (isTranslating && showLoadingIndicator) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span>{name}</span>
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </span>
    )
  }

  if (!needsTranslation) {
    return <span className={className}>{name}</span>
  }

  if (showOriginal) {
    return (
      <span className={className} title={`Original: ${original}`}>
        {displayName}
      </span>
    )
  }

  // Show only translated version
  return (
    <span className={className} title={`Original: ${original}`}>
      {translated}
    </span>
  )
}

/**
 * Inline translation badge component
 * Shows a small badge indicating the text was translated
 */
export function TranslationBadge({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      Translated
    </span>
  )
}

