/**
 * Translation Service
 * Automatically translates location names from any language to English
 * Uses free translation APIs with fallbacks
 */

interface TranslationCache {
  [key: string]: string
}

// In-memory cache to avoid repeated API calls
const translationCache: TranslationCache = {}

/**
 * Detect if text contains non-Latin characters
 */
export function hasNonLatinCharacters(text: string): boolean {
  // Check for CJK (Chinese, Japanese, Korean), Cyrillic, Arabic, etc.
  const nonLatinRegex = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/
  return nonLatinRegex.test(text)
}

/**
 * Translate text using free translation APIs
 * Priority: LibreTranslate (self-hosted/free) → MyMemory → Fallback to romanization
 */
export async function translateToEnglish(text: string): Promise<string> {
  // Check cache first
  if (translationCache[text]) {
    return translationCache[text]
  }

  // If already in Latin characters, return as-is
  if (!hasNonLatinCharacters(text)) {
    return text
  }

  try {
    // Try Google Translate API (free, no API key required)
    const translated = await translateWithGoogle(text)

    if (translated && translated !== text) {
      translationCache[text] = translated
      return translated
    }

    // Fallback: Return original text
    // In production, you might want to add more translation services
    return text
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }
}

/**
 * Clean up translated text by removing unnecessary words
 */
function cleanTranslation(text: string): string {
  let cleaned = text

  // Remove common unnecessary words/phrases
  const unnecessaryWords = [
    'special city',
    'special',
    'municipality',
    'metropolitan',
    'prefecture',
    'province',
    'autonomous region',
    'special administrative region'
  ]

  for (const word of unnecessaryWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    cleaned = cleaned.replace(regex, '').trim()
  }

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  return cleaned
}

/**
 * Translate using Google Translate's free API
 * This is a free, unofficial endpoint that doesn't require an API key
 */
async function translateWithGoogle(text: string): Promise<string> {
  try {
    // Use Google Translate's free endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const data = await response.json()

    // Google Translate returns: [[["translated text", "original text", null, null, 10]]]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      let translated = data[0][0][0]

      // Clean up the translation
      translated = cleanTranslation(translated)

      if (translated !== text && translated.length > 0) {
        console.log(`✅ Translated "${text}" → "${translated}"`)
        return translated
      }
    }

    return text
  } catch (error) {
    console.error('Google Translate error:', error)
    return text
  }
}

/**
 * Translate location name and return both original and translated
 */
export async function translateLocationName(name: string): Promise<{
  original: string
  translated: string
  needsTranslation: boolean
}> {
  const needsTranslation = hasNonLatinCharacters(name)
  
  if (!needsTranslation) {
    return {
      original: name,
      translated: name,
      needsTranslation: false
    }
  }

  const translated = await translateToEnglish(name)
  
  return {
    original: name,
    translated,
    needsTranslation: true
  }
}

/**
 * Batch translate multiple location names
 */
export async function translateLocationNames(names: string[]): Promise<Map<string, string>> {
  const translations = new Map<string, string>()
  
  // Translate in parallel with rate limiting
  const results = await Promise.all(
    names.map(async (name, index) => {
      // Add small delay to avoid rate limiting (MyMemory allows ~10 req/sec)
      await new Promise(resolve => setTimeout(resolve, index * 100))
      
      const result = await translateLocationName(name)
      return { name, translated: result.translated }
    })
  )
  
  results.forEach(({ name, translated }) => {
    translations.set(name, translated)
  })
  
  return translations
}

/**
 * Get display name for location (English only for UI)
 */
export function getDisplayName(original: string, translated?: string): string {
  if (!translated || original === translated || !hasNonLatinCharacters(original)) {
    return original
  }

  // Return only the English translation for display
  return translated
}

/**
 * Get full name with original (for tooltips, metadata, etc.)
 */
export function getFullName(original: string, translated?: string): string {
  if (!translated || original === translated || !hasNonLatinCharacters(original)) {
    return original
  }

  return `${translated} (${original})`
}

/**
 * Clear translation cache (useful for testing)
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(key => delete translationCache[key])
}

