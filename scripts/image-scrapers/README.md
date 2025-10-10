# Social Media Image Scrapers - NO API KEYS! 🚀

Scrape high-quality images from Reddit, Twitter/X, Pinterest, and Flickr **WITHOUT API keys**.

## 🎯 Features

- ✅ **Reddit** - Public JSON API (no auth needed)
- ✅ **Pinterest** - Public search endpoints
- ✅ **Flickr** - Public feed API
- ✅ **Twitter/X** - Coming soon (requires browser automation)
- ✅ **No API keys required**
- ✅ **Free forever**
- ✅ **Full metadata** (author, score, timestamp, source URL)

## 📦 Installation

### Option 1: Python Script (Recommended)

```bash
cd scripts/image-scrapers
pip install -r requirements.txt
```

### Option 2: Node.js Service (Already Integrated)

The TypeScript service is already integrated in:
- `apps/web/lib/services/socialImageScraperService.ts`
- `apps/web/app/api/admin/fetch-location-images/route.ts`

## 🚀 Usage

### Python Script

```bash
# Basic usage
python scrape_social_images.py "Paris France" --max-images 20

# Specific platforms
python scrape_social_images.py "Tokyo Japan" --platforms reddit pinterest

# All platforms
python scrape_social_images.py "New York" --platforms reddit pinterest flickr --max-images 50
```

### Node.js API

The admin image gallery already uses this:

```typescript
import { fetchSocialImages } from '@/lib/services/socialImageScraperService'

const images = await fetchSocialImages('Paris France', 20)
// Returns: [{ url, title, author, platform, score, sourceUrl }, ...]
```

## 📊 Output Format

```json
{
  "query": "Paris France",
  "total_images": 45,
  "images": [
    {
      "url": "https://i.redd.it/abc123.jpg",
      "title": "Sunset over the Eiffel Tower",
      "author": "photographer_name",
      "author_url": "https://reddit.com/u/photographer_name",
      "platform": "Reddit",
      "score": 1234,
      "timestamp": "2024-01-15T10:30:00Z",
      "source_url": "https://reddit.com/r/itookapicture/comments/..."
    }
  ]
}
```

## 🔍 How It Works

### Reddit (NO API KEY!)
- Uses Reddit's **public JSON API**: `reddit.com/r/subreddit.json`
- Searches photography subreddits:
  - r/itookapicture
  - r/travelphotography
  - r/earthporn
  - r/cityporn
  - r/villageporn
  - r/architectureporn
- Filters out memes, selfies, and low-quality posts
- Sorts by upvotes (score)

### Pinterest (NO API KEY!)
- Uses Pinterest's **public search endpoint**
- Extracts high-resolution images (orig, 736x, 564x)
- Gets author info and save counts
- Direct links to original pins

### Flickr (NO API KEY!)
- Uses Flickr's **public feed API**
- No authentication required
- Gets large image sizes (_b suffix)
- Includes author and timestamp

### Twitter/X (Coming Soon)
- Requires browser automation (Puppeteer/Playwright)
- Or use **Twikit** library: `pip install twikit`
- Can scrape without API key using cookies

## 🎨 Quality Filters

The scrapers automatically filter out:
- ❌ Memes and jokes
- ❌ Selfies and portraits
- ❌ Low-quality images
- ❌ Irrelevant content

And prioritize:
- ✅ High-resolution images
- ✅ Landscape/cityscape photos
- ✅ High scores (upvotes/saves)
- ✅ Recent uploads

## 🌐 Integration with TravelBlogr

### Admin Image Gallery

1. Go to: `http://localhost:3000/admin/image-gallery`
2. Select a location
3. Images from **all sources** load automatically:
   - Pexels, Unsplash, Wikimedia (standard)
   - Reddit, Pinterest, Flickr (social)
4. Click "Add" to add images to location

### API Endpoint

```bash
POST /api/admin/fetch-location-images
{
  "locationName": "Paris France",
  "page": 1,
  "perPage": 20,
  "includeSocial": true
}
```

Response includes images from all sources, sorted by quality score.

## 🔧 Advanced Usage

### Custom Subreddits

Edit `socialImageScraperService.ts`:

```typescript
const subreddits = [
  'itookapicture',
  'travelphotography',
  'earthporn',
  'YOUR_CUSTOM_SUBREDDIT' // Add here
]
```

### Custom Filters

Edit the filter logic in `scrape_social_images.py`:

```python
# Add custom exclude keywords
exclude = ['meme', 'funny', 'joke', 'YOUR_KEYWORD']
```

### Rate Limiting

The scrapers include delays to avoid rate limiting:
- Reddit: Public API, very generous limits
- Pinterest: May require delays between requests
- Flickr: Public feed, no strict limits

## 📚 GitHub Repos Used

1. **YARS** (Reddit) - https://github.com/datavorous/yars
   - Yet Another Reddit Scraper
   - No API key needed
   - Scrapes posts, comments, images

2. **Twikit** (Twitter/X) - https://github.com/d60/twikit
   - Twitter API wrapper without API keys
   - Uses cookies for authentication
   - Can search, post, like, etc.

3. **pinterest-image-scrap** - https://github.com/iamatulsingh/pinterest-image-scrap
   - Scrapes Pinterest without API
   - Python 3.7+
   - Gets images, boards, pins

## 🚨 Legal & Ethical Considerations

- ✅ **Public data only** - All scrapers use publicly available data
- ✅ **Respect robots.txt** - Follow platform guidelines
- ✅ **Rate limiting** - Don't spam requests
- ✅ **Attribution** - Always credit original authors
- ⚠️ **Terms of Service** - Check platform ToS before commercial use
- ⚠️ **Copyright** - Respect image licenses and copyrights

## 🐛 Troubleshooting

### "No images found"
- Try different search terms
- Check if platforms are accessible
- Verify internet connection

### "HTTP 429 Too Many Requests"
- Add delays between requests
- Reduce max images per platform
- Wait a few minutes and retry

### "Module not found"
- Run: `pip install -r requirements.txt`
- Check Python version (3.7+)

## 🎯 Next Steps

1. **Test the scrapers:**
   ```bash
   python scrape_social_images.py "Your Location" --max-images 10
   ```

2. **Use in admin gallery:**
   - Go to `/admin/image-gallery`
   - Select a location
   - See social images mixed with standard sources

3. **Optional: Install advanced tools:**
   ```bash
   pip install twikit  # For Twitter/X
   pip install playwright  # For browser automation
   ```

## 📝 License

MIT License - Free to use, modify, and distribute.

## 🤝 Contributing

Found a better scraping method? Submit a PR!

---

**Made with ❤️ for TravelBlogr**

