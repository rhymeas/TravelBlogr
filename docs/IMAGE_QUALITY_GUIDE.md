# Image Quality Guide

## Overview

TravelBlogr now uses an **Enhanced Image Service** that fetches high-quality, location-specific images with strict quality controls.

## Key Improvements

### 1. **High Resolution Images**
- Minimum resolution: **1200x800px**
- Preferred resolution: **2000px+ width**
- Landscape orientation preferred (aspect ratio 1.2:1 to 2:1)

### 2. **Better Search Terms**
Instead of generic searches, we now use location-specific terms:
- `{location} cityscape`
- `{location} skyline`
- `{location} aerial view`
- `{location} landmark`
- `{location} architecture`
- `{location} panorama`
- `{location} historic district`
- `{location} tourist attractions`

This filters out irrelevant images like random people or generic landscapes.

### 3. **Quality Sources Priority**

#### Tier 1: Premium Stock Photos (Best Quality)
1. **Pexels** - Unlimited, high-res originals
2. **Unsplash** - 50/hour, full resolution
3. **Pixabay** - Unlimited, large images with size filters

#### Tier 2: Free Encyclopedia Images
4. **Wikimedia Commons** - High-res versions (2000px)
5. **Wikipedia** - Original images

### 4. **Gallery Size**
- **20 images per location** (up from 6)
- Diverse search terms ensure variety
- Deduplication prevents repeats

## API Keys Required

Add these to your `.env.local`:

```bash
# Recommended (all free)
PEXELS_API_KEY=your_key_here          # Get at: pexels.com/api
PIXABAY_API_KEY=your_key_here         # Get at: pixabay.com/api
UNSPLASH_ACCESS_KEY=your_key_here     # Get at: unsplash.com/developers

# Optional (no key needed)
# Wikimedia Commons - works without API key
# Wikipedia - works without API key
```

## Getting API Keys (All Free!)

### Pexels (Recommended)
1. Go to https://www.pexels.com/api/
2. Sign up (free)
3. Get your API key instantly
4. **Unlimited requests** ✅

### Pixabay (Recommended)
1. Go to https://pixabay.com/api/docs/
2. Sign up (free)
3. Get your API key instantly
4. **Unlimited requests** ✅

### Unsplash
1. Go to https://unsplash.com/developers
2. Create an app (free)
3. Get your Access Key
4. **50 requests/hour** (sufficient for most use cases)

## Usage

### Update All Locations with High-Quality Images

```bash
npx tsx scripts/update-images-high-quality.ts
```

This will:
- Fetch 1 high-res featured image per location
- Fetch 20 high-res gallery images per location
- Use better search terms for location-specific content
- Filter out low-quality images
- Update your database

### Manual Image Override

Users can always override images via CMS:
1. Go to location edit page
2. Paste custom image URL
3. Save - custom URL takes priority

## Image Quality Checks

The service automatically:
- ✅ Requests high-resolution versions (2000px+)
- ✅ Filters by minimum dimensions (1200x800)
- ✅ Prefers landscape orientation
- ✅ Uses location-specific search terms
- ✅ Deduplicates results
- ✅ Caches for 24 hours

## Examples

### Before (Low Quality)
```
Search: "Amsterdam"
Result: Random person standing in front of water
Resolution: 640x480px
Source: Generic thumbnail
```

### After (High Quality)
```
Search: "Amsterdam cityscape", "Amsterdam aerial view", "Amsterdam skyline"
Result: Professional aerial photo of Amsterdam canals
Resolution: 2000x1333px
Source: Pexels original or Wikimedia high-res
```

## Troubleshooting

### Issue: Still getting low-quality images

**Solution:**
1. Make sure API keys are set in `.env.local`
2. Run the high-quality update script
3. Check console logs for API errors

### Issue: Not enough images (less than 20)

**Solution:**
1. Verify all API keys are working
2. Check API rate limits (Unsplash: 50/hour)
3. Some smaller locations may have fewer available images

### Issue: Images not location-specific

**Solution:**
1. The enhanced service uses 15+ search terms per location
2. If still generic, manually add custom URLs via CMS
3. Consider contributing better images to Wikimedia Commons

## Performance

- **Caching:** 24-hour cache per location
- **Rate Limiting:** 2-second delay between locations
- **Parallel Fetching:** Multiple APIs queried simultaneously
- **Fallback Chain:** Tries 5 sources before giving up

## Future Improvements

- [ ] AI-based image relevance scoring
- [ ] Automatic image cropping/optimization
- [ ] User-submitted image moderation
- [ ] Integration with Google Places Photos (if budget allows)
- [ ] CDN integration for faster loading

## Contributing

To improve image quality:
1. Add more search term variations in `generateLocationSearchTerms()`
2. Add new free image APIs
3. Improve quality filters
4. Submit high-quality images to Wikimedia Commons

## Support

For issues or questions:
- Check console logs for API errors
- Verify API keys are valid
- Ensure rate limits aren't exceeded
- Open an issue on GitHub

