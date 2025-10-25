/**
 * Content Translation Service
 * Uses GROQ AI to translate non-English content to English
 * Includes language detection and quality translation
 */

import { createGroqClient } from '@/lib/groq'

export interface TranslationResult {
  originalText: string
  translatedText: string
  detectedLanguage: string
  wasTranslated: boolean
  confidence: number
}

/**
 * Detect if text contains non-English characters
 */
function hasNonEnglishCharacters(text: string): boolean {
  // Check for non-Latin characters (Cyrillic, Arabic, Chinese, Japanese, Korean, etc.)
  const nonLatinRegex = /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/
  return nonLatinRegex.test(text)
}

/**
 * Detect if text is likely in English
 */
function isLikelyEnglish(text: string): boolean {
  // If text has non-English characters, it's not English
  if (hasNonEnglishCharacters(text)) {
    return false
  }

  // Check for common English words
  const commonEnglishWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she'
  ]

  const words = text.toLowerCase().split(/\s+/)
  const englishWordCount = words.filter(word => 
    commonEnglishWords.includes(word.replace(/[^a-z]/g, ''))
  ).length

  // If at least 20% of words are common English words, consider it English
  return englishWordCount / words.length >= 0.2
}

/**
 * Translate content using GROQ AI
 */
export async function translateContent(
  text: string,
  entityId: string,
  entityType: string
): Promise<TranslationResult> {
  // Skip if text is empty or too short
  if (!text || text.trim().length < 3) {
    return {
      originalText: text,
      translatedText: text,
      detectedLanguage: 'en',
      wasTranslated: false,
      confidence: 1.0
    }
  }

  // Skip if already in English
  if (isLikelyEnglish(text)) {
    console.log(`✅ Text is already in English, skipping translation`)
    return {
      originalText: text,
      translatedText: text,
      detectedLanguage: 'en',
      wasTranslated: false,
      confidence: 1.0
    }
  }

  try {
    console.log(`🌐 Translating ${entityType} (${entityId}): "${text.substring(0, 50)}..."`)

    const groq = createGroqClient()

    const prompt = `You are a professional translator. Translate the following text to English.

IMPORTANT RULES:
1. Detect the source language
2. Translate to natural, fluent English
3. Preserve the original meaning and tone
4. For location names, use the commonly accepted English name if one exists
5. For activity names, translate descriptively but keep proper nouns

Text to translate:
"${text}"

Respond in JSON format:
{
  "detectedLanguage": "language code (e.g., 'de', 'fr', 'es', 'ja')",
  "translatedText": "the English translation",
  "confidence": number between 0 and 1
}

If the text is already in English, return:
{
  "detectedLanguage": "en",
  "translatedText": "${text}",
  "confidence": 1.0
}`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in travel content. Provide accurate, natural translations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // Low temperature for consistent translations
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from GROQ')
    }

    // Parse JSON response
    const result = JSON.parse(response)

    const wasTranslated = result.detectedLanguage !== 'en'

    if (wasTranslated) {
      console.log(`✅ Translated from ${result.detectedLanguage}: "${result.translatedText.substring(0, 50)}..."`)
    }

    return {
      originalText: text,
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
      wasTranslated,
      confidence: result.confidence || 0.8
    }

  } catch (error) {
    console.error('Translation error:', error)
    
    // Return original text on error
    return {
      originalText: text,
      translatedText: text,
      detectedLanguage: 'unknown',
      wasTranslated: false,
      confidence: 0.0
    }
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: Array<{ text: string; entityId: string; entityType: string }>
): Promise<Map<string, TranslationResult>> {
  const results = new Map<string, TranslationResult>()

  for (const item of texts) {
    try {
      const result = await translateContent(item.text, item.entityId, item.entityType)
      results.set(item.entityId, result)

      // Rate limiting to avoid API throttling
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`Failed to translate ${item.entityType} (${item.entityId}):`, error)
    }
  }

  return results
}

/**
 * Detect language of text using GROQ
 */
export async function detectLanguage(text: string): Promise<string> {
  if (isLikelyEnglish(text)) {
    return 'en'
  }

  try {
    const groq = createGroqClient()

    const prompt = `Detect the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'de', 'fr', 'es', 'ja', 'zh', 'ar', 'ru').

Text: "${text}"

Language code:`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 10
    })

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase()
    return response || 'unknown'

  } catch (error) {
    console.error('Language detection error:', error)
    return 'unknown'
  }
}

