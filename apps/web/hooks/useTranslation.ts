/**
 * React Hook for Translation
 * Provides client-side translation capabilities
 */

import { useState, useEffect } from 'react'
import { translateLocationName, hasNonLatinCharacters, getDisplayName } from '@/lib/services/translationService'

interface TranslationResult {
  original: string
  translated: string
  displayName: string
  isTranslating: boolean
  needsTranslation: boolean
}

/**
 * Hook to translate a single location name
 */
export function useLocationTranslation(locationName: string | undefined): TranslationResult {
  const [result, setResult] = useState<TranslationResult>({
    original: locationName || '',
    translated: locationName || '',
    displayName: locationName || '',
    isTranslating: false,
    needsTranslation: false
  })

  useEffect(() => {
    if (!locationName) {
      setResult({
        original: '',
        translated: '',
        displayName: '',
        isTranslating: false,
        needsTranslation: false
      })
      return
    }

    // Check if translation is needed
    const needsTranslation = hasNonLatinCharacters(locationName)
    
    if (!needsTranslation) {
      setResult({
        original: locationName,
        translated: locationName,
        displayName: locationName,
        isTranslating: false,
        needsTranslation: false
      })
      return
    }

    // Translate asynchronously
    setResult(prev => ({ ...prev, isTranslating: true }))
    
    translateLocationName(locationName)
      .then(translationResult => {
        const displayName = getDisplayName(translationResult.original, translationResult.translated)
        
        setResult({
          original: translationResult.original,
          translated: translationResult.translated,
          displayName,
          isTranslating: false,
          needsTranslation: translationResult.needsTranslation
        })
      })
      .catch(error => {
        console.error('Translation error:', error)
        setResult({
          original: locationName,
          translated: locationName,
          displayName: locationName,
          isTranslating: false,
          needsTranslation: true
        })
      })
  }, [locationName])

  return result
}

/**
 * Hook to translate multiple location names
 */
export function useLocationTranslations(locationNames: string[]): Map<string, TranslationResult> {
  const [results, setResults] = useState<Map<string, TranslationResult>>(new Map())
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (locationNames.length === 0) {
      setResults(new Map())
      return
    }

    setIsTranslating(true)

    // Translate all names in parallel
    Promise.all(
      locationNames.map(async (name) => {
        const needsTranslation = hasNonLatinCharacters(name)
        
        if (!needsTranslation) {
          return {
            name,
            result: {
              original: name,
              translated: name,
              displayName: name,
              isTranslating: false,
              needsTranslation: false
            }
          }
        }

        const translationResult = await translateLocationName(name)
        const displayName = getDisplayName(translationResult.original, translationResult.translated)

        return {
          name,
          result: {
            original: translationResult.original,
            translated: translationResult.translated,
            displayName,
            isTranslating: false,
            needsTranslation: translationResult.needsTranslation
          }
        }
      })
    )
      .then(translatedResults => {
        const newResults = new Map<string, TranslationResult>()
        translatedResults.forEach(({ name, result }) => {
          newResults.set(name, result)
        })
        setResults(newResults)
        setIsTranslating(false)
      })
      .catch(error => {
        console.error('Batch translation error:', error)
        setIsTranslating(false)
      })
  }, [locationNames.join(',')])

  return results
}

/**
 * Simple utility hook to check if text needs translation
 */
export function useNeedsTranslation(text: string | undefined): boolean {
  if (!text) return false
  return hasNonLatinCharacters(text)
}

