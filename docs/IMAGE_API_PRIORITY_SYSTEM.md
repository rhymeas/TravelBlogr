# TravelBlogr Image API Priority System & Error Handling

## 🎯 Overview

TravelBlogr uses a **hierarchical image fetching system** with graceful error handling for API failures, rate limiting, and timeouts.

---

## 🥇 Image Source Priority

### **Priority #1: Brave Search API** (FANTASTIC high-quality images)
- **Status:** Primary source
- **Quality:** Excellent - curated search results
- **Speed:** Fast
- **Cost:** Free (with rate limits)
- **Fallback:** If rate-limited or unavailable → Reddit ULTRA

### **Priority #2: Reddit ULTRA** (10 STRICT FILTERS)
- **Status:** Secondary source
- **Quality:** Excellent - community travel photography
- **Filters:** 10 strict filters to remove non-environment content
- **Cost:** Free (no API key needed)
- **Fallback:** If no results → Pexels/Unsplash

### **Priority #3-7: Pexels, Unsplash, Wikimedia, Wikipedia, Openverse**
- **Status:** Tertiary sources
- **Quality:** Good - stock photos and cultural images
- **Cost:** Free
- **Fallback:** If all fail → Country-specific curated images

### **Fallback: Country-Specific Curated Images**
- **Status:** Last resort
- **Quality:** Good - pre-selected high-quality images
- **Cost:** Free
- **Fallback:** If all fail → Gradient placeholder

---

## ⚠️ Graceful Error Handling

### **Rate Limiting (HTTP 429)**
```
Brave API returns 429 → Too Many Requests
├─ Log: "⚠️ API Rate Limited"
├─ Status: rate-limited
├─ Action: Skip to Reddit ULTRA
└─ Message: "Try again in a few minutes"
```

### **Timeout/Unavailable (ECONNREFUSED, ETIMEDOUT)**
```
API unreachable → Connection refused
├─ Log: "⚠️ API Timeout/Unavailable"
├─ Status: error
├─ Action: Skip to next priority source
└─ Message: "API unavailable, trying fallback"
```

### **Invalid Response**
```
API returns invalid data → Parse error
├─ Log: "❌ Fetch error"
├─ Status: error
├─ Action: Skip to next priority source
└─ Message: "Invalid response, trying fallback"
```

---

## 📊 Implementation Details

### **Cleanup Script** (`scripts/fix-corrupted-featured-images.ts`)

**Strategy 1: Use Valid Gallery Images**
```typescript
// If location has valid gallery images, use first one
const validGalleryImage = galleryImages.find(img => isValidImageUrl(img))
if (validGalleryImage) {
  // Use this image as featured
}
```

**Strategy 2: Fetch Fresh Images (HIGH-PRIORITY)**
```typescript
// If no valid gallery images, fetch fresh using Brave → Reddit → Fallback
try {
  const freshImage = await fetchLocationImageHighQuality(
    location.name,
    undefined,
    location.region,
    location.country
  )
  // Use fresh image
} catch (error) {
  // Graceful error handling
  if (error.includes('429')) {
    // Rate limited - try again later
  } else if (error.includes('timeout')) {
    // Unavailable - use fallback
  }
}
```

### **Enhanced Image Service** (`apps/web/lib/services/enhancedImageService.ts`)

**Parallel Fetching with Scoring**
```typescript
// Fetch from ALL sources in parallel
const allCandidates = []

// Brave API (score: priority + 20)
fetchBraveImages(name, 10)
  .then(urls => {
    urls.forEach(url => {
      allCandidates.push({
        url,
        source: 'Brave API',
        score: priority + 20  // HIGHEST
      })
    })
  })

// Reddit ULTRA (score: priority + 18)
fetchRedditImages(name, 5)
  .then(urls => {
    urls.forEach(url => {
      allCandidates.push({
        url,
        source: 'Reddit ULTRA',
        score: priority + 18  // Second highest
      })
    })
  })

// Pexels (score: priority + 15)
// Unsplash (score: priority + 9)
// Wikimedia (score: priority + 7)
// Wikipedia (score: priority + 5)
// Openverse (score: priority + 3)

// Select best image by score
const bestImage = allCandidates.sort((a, b) => b.score - a.score)[0]
```

---

## 🔍 API Health Monitoring

### **Health Check Output**
```
🔍 API Health Status:
   Brave API: OK - Ready
   Reddit ULTRA: OK - Ready
```

### **Rate Limit Detection**
```
⚠️ WARNING: One or more APIs are rate-limited!
   This is normal - APIs have usage limits.
   Graceful fallback to lower-priority sources (Pexels, Unsplash, etc.)
   Try running this script again in a few minutes.
```

### **Unavailability Detection**
```
⚠️ WARNING: One or more APIs are unavailable!
   Check your internet connection or API status pages.
   Graceful fallback to lower-priority sources (Pexels, Unsplash, etc.)
```

---

## 🚀 Usage Examples

### **Fetch Single Featured Image**
```typescript
import { fetchLocationImageHighQuality } from '@/lib/services/enhancedImageService'

const image = await fetchLocationImageHighQuality(
  'Marrakesh',
  undefined,
  'Marrakech-Safi',
  'Morocco'
)
// Returns: Best image from Brave → Reddit → Pexels → ... → Fallback
```

### **Fetch Gallery (20+ images)**
```typescript
import { fetchLocationGalleryHighQuality } from '@/lib/services/enhancedImageService'

const images = await fetchLocationGalleryHighQuality(
  'Marrakesh',
  20,
  'Marrakech-Safi',
  'Morocco'
)
// Returns: Mix of Brave + Reddit + Pexels + ... images
```

### **Smart Fallback with Backend Cache**
```typescript
import { fetchLocationGalleryWithSmartFallback } from '@/lib/services/enhancedImageService'

const images = await fetchLocationGalleryWithSmartFallback(
  locationId,
  'Marrakesh',
  20,
  'Marrakech-Safi',
  'Morocco'
)
// Returns: Brave → Reddit → Backend Cache (< 1mo) → User Uploads
```

---

## 📈 Performance Impact

### **Before (No Priority System)**
- Random image sources
- No error handling
- Slow fallbacks
- Inconsistent quality

### **After (Priority System)**
- Brave API first (fantastic quality)
- Reddit ULTRA second (community photos)
- Graceful fallback chain
- Consistent quality
- Fast error recovery

---

## 🔧 Configuration

### **Environment Variables**
```bash
# Brave Search API (free, no key needed)
BRAVE_SEARCH_API_KEY=optional

# Pexels (free tier: 200/hour)
PEXELS_API_KEY=your_key

# Unsplash (free tier: 50/hour)
UNSPLASH_API_KEY=your_key

# Wikimedia (free, no key needed)
# Wikipedia (free, no key needed)
# Openverse (free, no key needed)
# Reddit (free, no key needed)
```

---

## 🎯 Best Practices

1. **Always use high-priority sources first** - Brave API and Reddit ULTRA
2. **Implement graceful error handling** - Don't crash on API failures
3. **Log API health status** - Monitor which APIs are working
4. **Use parallel fetching** - Fetch from multiple sources simultaneously
5. **Cache results** - Avoid repeated API calls for same location
6. **Validate URLs** - Check for non-Latin characters, invalid formats
7. **Provide fallbacks** - Always have a fallback image ready

---

## 📝 Monitoring

### **Check API Status**
```bash
# Run cleanup script to check API health
npx tsx scripts/fix-corrupted-featured-images.ts

# Output shows:
# ✅ Brave API: OK - Ready
# ✅ Reddit ULTRA: OK - Ready
```

### **Monitor Logs**
```
🥇 PRIORITY #1: Brave Search API for "Marrakesh"...
✅ Brave API: Found 10 fantastic images for "Marrakesh"

🥈 PRIORITY #2: Reddit ULTRA for "Marrakesh"...
✅ Reddit ULTRA: Found 5 ULTRA-FILTERED images for "Marrakesh"

🥉 PRIORITY #3: Pexels for "Marrakesh cityscape"...
✅ Pexels: 15/15 valid images for "Marrakesh cityscape"
```

---

**Status:** ✅ PRODUCTION READY

All APIs have graceful error handling and fallback chains to ensure images always load.

