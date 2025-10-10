/**
 * Translation Service Tests
 */

import { 
  hasNonLatinCharacters, 
  translateToEnglish, 
  translateLocationName,
  getDisplayName,
  clearTranslationCache
} from '../translationService'

describe('Translation Service', () => {
  beforeEach(() => {
    clearTranslationCache()
  })

  describe('hasNonLatinCharacters', () => {
    it('should detect Chinese characters', () => {
      expect(hasNonLatinCharacters('长海县')).toBe(true)
      expect(hasNonLatinCharacters('北京')).toBe(true)
    })

    it('should detect Korean characters', () => {
      expect(hasNonLatinCharacters('서울특별시')).toBe(true)
      expect(hasNonLatinCharacters('부산')).toBe(true)
    })

    it('should detect Japanese characters', () => {
      expect(hasNonLatinCharacters('東京')).toBe(true)
      expect(hasNonLatinCharacters('大阪')).toBe(true)
    })

    it('should detect Cyrillic characters', () => {
      expect(hasNonLatinCharacters('Москва')).toBe(true)
    })

    it('should detect Arabic characters', () => {
      expect(hasNonLatinCharacters('القاهرة')).toBe(true)
    })

    it('should return false for Latin characters', () => {
      expect(hasNonLatinCharacters('Vancouver')).toBe(false)
      expect(hasNonLatinCharacters('New York')).toBe(false)
      expect(hasNonLatinCharacters('Paris')).toBe(false)
    })

    it('should return false for mixed Latin with accents', () => {
      expect(hasNonLatinCharacters('São Paulo')).toBe(false)
      expect(hasNonLatinCharacters('Zürich')).toBe(false)
    })
  })

  describe('translateToEnglish', () => {
    it('should return Latin text as-is', async () => {
      const result = await translateToEnglish('Vancouver')
      expect(result).toBe('Vancouver')
    })

    it('should translate Chinese text', async () => {
      const result = await translateToEnglish('长海县')
      // Should return some English translation
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    }, 10000) // Increase timeout for API call

    it('should translate Korean text', async () => {
      const result = await translateToEnglish('서울특별시')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    }, 10000)

    it('should use cache for repeated translations', async () => {
      const text = '东京'
      const result1 = await translateToEnglish(text)
      const result2 = await translateToEnglish(text)
      
      expect(result1).toBe(result2)
    }, 10000)
  })

  describe('translateLocationName', () => {
    it('should return original for Latin text', async () => {
      const result = await translateLocationName('Vancouver')
      
      expect(result.original).toBe('Vancouver')
      expect(result.translated).toBe('Vancouver')
      expect(result.needsTranslation).toBe(false)
    })

    it('should translate non-Latin text', async () => {
      const result = await translateLocationName('长海县')
      
      expect(result.original).toBe('长海县')
      expect(result.translated).toBeTruthy()
      expect(result.needsTranslation).toBe(true)
      expect(result.translated).not.toBe('长海县')
    }, 10000)
  })

  describe('getDisplayName', () => {
    it('should return original if no translation needed', () => {
      const result = getDisplayName('Vancouver', 'Vancouver')
      expect(result).toBe('Vancouver')
    })

    it('should return original if translation is same', () => {
      const result = getDisplayName('Paris', 'Paris')
      expect(result).toBe('Paris')
    })

    it('should combine translated and original for non-Latin', () => {
      const result = getDisplayName('长海县', 'Changhai County')
      expect(result).toBe('Changhai County (长海县)')
    })

    it('should return original if no translation provided', () => {
      const result = getDisplayName('Vancouver')
      expect(result).toBe('Vancouver')
    })
  })
})

