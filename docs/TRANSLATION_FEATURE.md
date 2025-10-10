# Automatic Translation Feature

## Overview

TravelBlogr now automatically translates location names from any language into English (or user's preferred language). This ensures users can understand location names regardless of the original script (Chinese, Korean, Japanese, Arabic, Cyrillic, etc.).

## Features

✅ **Automatic Detection** - Detects non-Latin characters in location names  
✅ **Free Translation API** - Uses MyMemory Translation API (no API key required)  
✅ **Smart Caching** - Caches translations to avoid repeated API calls  
✅ **Dual Display** - Shows both translated and original names  
✅ **React Hooks** - Easy-to-use hooks for frontend components  
✅ **Batch Translation** - Translate multiple locations efficiently  
✅ **Visual Indicators** - Shows 🌐 icon for translated content  

## How It Works

### Backend (Automatic)

When a new location is created via `LocationDiscoveryService`:

1. **Detection**: Checks if location name contains non-Latin characters
2. **Translation**: Calls MyMemory API to translate to English
3. **Storage**: Saves as "English Translation (Original Name)"
4. **Slug Generation**: Uses translated name for URL-friendly slug

Example:
```
Input:  长海县
Output: Changhai County (长海县)
Slug:   changhai-county
```

### Frontend (Manual)

Use React hooks or components to display translated names:

```tsx
import { TranslatedLocationName } from '@/components/ui/TranslatedLocationName'

// Automatic translation with original in parentheses
<TranslatedLocationName name="서울특별시" />
// Output: Seoul (서울특별시)

// Translation only
<TranslatedLocationName name="東京" showOriginal={false} />
// Output: Tokyo
```

## API Endpoints

### Translate Single Text

```bash
# GET request
GET /api/translate?text=长海县

# POST request
POST /api/translate
{
  "text": "长海县"
}

# Response
{
  "success": true,
  "data": {
    "original": "长海县",
    "translated": "Changhai County",
    "needsTranslation": true
  }
}
```

### Batch Translation

```bash
POST /api/translate
{
  "texts": ["长海县", "서울특별시", "東京"]
}

# Response
{
  "success": true,
  "data": {
    "长海县": "Changhai County",
    "서울특별시": "Seoul",
    "東京": "Tokyo"
  }
}
```

## React Hooks

### `useLocationTranslation`

Translate a single location name:

```tsx
import { useLocationTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { original, translated, displayName, isTranslating, needsTranslation } 
    = useLocationTranslation('长海县')

  return (
    <div>
      <p>Original: {original}</p>
      <p>Translated: {translated}</p>
      <p>Display: {displayName}</p>
      {isTranslating && <Spinner />}
    </div>
  )
}
```

### `useLocationTranslations`

Translate multiple location names:

```tsx
import { useLocationTranslations } from '@/hooks/useTranslation'

function LocationList({ locations }: { locations: string[] }) {
  const translations = useLocationTranslations(locations)

  return (
    <ul>
      {locations.map(loc => {
        const result = translations.get(loc)
        return <li key={loc}>{result?.displayName || loc}</li>
      })}
    </ul>
  )
}
```

## Components

### `TranslatedLocationName`

Pre-built component for displaying translated location names:

```tsx
import { TranslatedLocationName } from '@/components/ui/TranslatedLocationName'

// Default: Shows "Translation (Original)"
<TranslatedLocationName name="长海县" />

// Translation only
<TranslatedLocationName name="长海县" showOriginal={false} />

// With loading indicator
<TranslatedLocationName name="长海县" showLoadingIndicator />

// Custom styling
<TranslatedLocationName name="长海县" className="text-2xl font-bold" />
```

### `TranslationBadge`

Shows a small badge indicating content was translated:

```tsx
import { TranslationBadge } from '@/components/ui/TranslatedLocationName'

<span>
  Seoul
  <TranslationBadge show={true} />
</span>
```

## Supported Languages

The translation service detects and translates:

- **CJK**: Chinese (中文), Japanese (日本語), Korean (한국어)
- **Cyrillic**: Russian (Русский), Ukrainian, Bulgarian, etc.
- **Arabic**: Arabic (العربية), Persian, Urdu
- **Indic**: Hindi (हिन्दी), Bengali, Tamil, etc.
- **Other**: Thai, Hebrew, Greek, and more

Latin-based languages (English, French, Spanish, German, etc.) are **not translated**.

## Translation Service Details

### MyMemory API

- **Provider**: MyMemory Translation API
- **Cost**: FREE (1000 words/day for anonymous usage)
- **Rate Limit**: ~10 requests/second
- **Accuracy**: Good for location names and short phrases
- **No API Key**: Works without authentication

### Caching Strategy

Translations are cached in-memory to minimize API calls:

```typescript
// First call: API request
await translateToEnglish('长海县') // → API call → "Changhai County"

// Second call: Cached
await translateToEnglish('长海县') // → Cache hit → "Changhai County"
```

Clear cache if needed:
```typescript
import { clearTranslationCache } from '@/lib/services/translationService'
clearTranslationCache()
```

## Testing

### Test Page

Visit `/test-translation` to see the translation feature in action:

```bash
npm run dev
# Open http://localhost:3000/test-translation
```

### Unit Tests

```bash
npm test -- translationService.test.ts
```

## Integration Examples

### Itinerary Modal

The itinerary modal automatically shows translated location names:

```tsx
// CompactHeader.tsx
const formatted = formatLocationDisplay(group.location)

<span title={formatted.originalName}>
  {formatted.main}
  {formatted.needsTranslation && <span>🌐</span>}
</span>
```

### Location Discovery

When creating locations from external APIs:

```typescript
// LocationDiscoveryService.ts
const translationResult = await translateLocationName(geoData.name)
const displayName = translationResult.needsTranslation 
  ? `${translationResult.translated} (${translationResult.original})`
  : geoData.name

// Save to database
await supabase.from('locations').insert({
  name: displayName,
  slug: slugify(translationResult.translated)
})
```

## Future Enhancements

- [ ] User language preference (translate to French, Spanish, etc.)
- [ ] Offline translation using local dictionaries
- [ ] Translation quality indicators
- [ ] Alternative translation providers (Google Translate, DeepL)
- [ ] Translation history and suggestions
- [ ] Phonetic pronunciation guides

## Troubleshooting

### Translation Not Working

1. **Check API availability**: MyMemory API might be down
2. **Rate limiting**: Wait a few seconds between requests
3. **Network issues**: Check internet connection
4. **Cache issues**: Clear translation cache

### Incorrect Translations

1. **Short names**: Single characters may not translate well
2. **Proper nouns**: Some names are transliterated, not translated
3. **Context**: Location names may have multiple meanings

### Performance Issues

1. **Batch requests**: Use `translateLocationNames()` for multiple items
2. **Caching**: Translations are cached automatically
3. **Lazy loading**: Use hooks to translate on-demand

## API Reference

See full API documentation in:
- `apps/web/lib/services/translationService.ts`
- `apps/web/hooks/useTranslation.ts`
- `apps/web/components/ui/TranslatedLocationName.tsx`

