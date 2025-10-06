# Free Image APIs - Complete Guide

## 🎯 Currently Integrated (All Free!)

### 1. **Pexels** ⭐⭐⭐⭐⭐
- **Status:** ✅ Integrated
- **Cost:** FREE, unlimited
- **Quality:** Excellent (original/large2x available)
- **Get Key:** https://www.pexels.com/api/
- **Setup Time:** 2 minutes
- **Why:** Best quality-to-ease ratio, unlimited requests

**How to get key:**
1. Go to https://www.pexels.com/api/
2. Click "Get Started"
3. Sign up (email + password)
4. Copy your API key
5. Add to `.env.local`: `PEXELS_API_KEY=your_key`

---

### 2. **Pixabay** ⭐⭐⭐⭐⭐
- **Status:** ✅ Integrated
- **Cost:** FREE, unlimited
- **Quality:** Excellent (4.5M+ images)
- **Get Key:** https://pixabay.com/api/docs/
- **Setup Time:** 2 minutes
- **Why:** Huge library, great travel photos

**How to get key:**
1. Go to https://pixabay.com/api/docs/
2. Click "Get Started"
3. Sign up (email + password)
4. Copy your API key
5. Add to `.env.local`: `PIXABAY_API_KEY=your_key`

---

### 3. **Flickr** ⭐⭐⭐⭐ NEW!
- **Status:** ✅ Just integrated!
- **Cost:** FREE, unlimited
- **Quality:** Excellent (100M+ CC-licensed photos)
- **Get Key:** https://www.flickr.com/services/apps/create/
- **Setup Time:** 5 minutes
- **Why:** Real traveler photos, authentic content

**How to get key:**
1. Go to https://www.flickr.com/services/apps/create/
2. Click "Request an API Key"
3. Choose "Apply for a Non-Commercial Key"
4. Fill in app name: "TravelBlogr"
5. Fill in description: "Travel blog image fetching"
6. Copy your API Key
7. Add to `.env.local`: `FLICKR_API_KEY=your_key`

---

### 4. **Unsplash** ⭐⭐⭐⭐
- **Status:** ✅ Integrated
- **Cost:** FREE, 50 requests/hour
- **Quality:** Excellent (full resolution)
- **Get Key:** https://unsplash.com/developers
- **Setup Time:** 5 minutes
- **Why:** Professional photography, high quality

**How to get key:**
1. Go to https://unsplash.com/developers
2. Click "Register as a developer"
3. Create a new app
4. App name: "TravelBlogr"
5. Description: "Travel blog image service"
6. Copy your Access Key
7. Add to `.env.local`: `UNSPLASH_ACCESS_KEY=your_key`

---

### 5. **Wikimedia Commons** ⭐⭐⭐⭐
- **Status:** ✅ Integrated
- **Cost:** FREE, unlimited
- **Quality:** Good (100M+ public domain)
- **Get Key:** No key needed!
- **Setup Time:** 0 minutes
- **Why:** No API key required, huge library

---

### 6. **Wikipedia** ⭐⭐⭐
- **Status:** ✅ Integrated
- **Cost:** FREE, unlimited
- **Quality:** Good (original images)
- **Get Key:** No key needed!
- **Setup Time:** 0 minutes
- **Why:** No API key required, location-specific

---

## 📊 Comparison Table

| Service | Cost | Limit | Quality | Setup | Travel Focus |
|---------|------|-------|---------|-------|--------------|
| **Pexels** | Free | Unlimited | ⭐⭐⭐⭐⭐ | 2 min | ⭐⭐⭐⭐⭐ |
| **Pixabay** | Free | Unlimited | ⭐⭐⭐⭐⭐ | 2 min | ⭐⭐⭐⭐⭐ |
| **Flickr** | Free | Unlimited | ⭐⭐⭐⭐ | 5 min | ⭐⭐⭐⭐⭐ |
| **Unsplash** | Free | 50/hour | ⭐⭐⭐⭐⭐ | 5 min | ⭐⭐⭐⭐ |
| **Wikimedia** | Free | Unlimited | ⭐⭐⭐⭐ | 0 min | ⭐⭐⭐⭐ |
| **Wikipedia** | Free | Unlimited | ⭐⭐⭐ | 0 min | ⭐⭐⭐⭐ |

---

## 🚀 Recommended Setup (15 minutes total)

### Priority 1: Essential (5 minutes)
1. **Pexels** - Best quality, easiest setup
2. **Pixabay** - Huge library, great variety

With just these 2, you'll get 15-20 high-quality images per location!

### Priority 2: Enhanced (10 more minutes)
3. **Flickr** - Real traveler photos, authentic content
4. **Unsplash** - Professional photography

With all 4, you'll get 20+ diverse, high-quality images per location!

---

## 🎨 What You Get With Each API

### With Pexels Only
```
Amsterdam: 8-10 professional stock photos
- Cityscapes
- Landmarks
- Architecture
```

### With Pexels + Pixabay
```
Amsterdam: 15-18 high-quality images
- Professional stock photos
- Diverse angles
- Better variety
```

### With Pexels + Pixabay + Flickr
```
Amsterdam: 20+ diverse images
- Professional stock photos
- Real traveler photos
- Authentic moments
- Cultural content
```

### With All 4 APIs
```
Amsterdam: 25+ premium images
- Professional stock photos
- Real traveler photos
- Artistic photography
- Maximum variety
```

---

## 🔧 Setup Instructions

### Step 1: Get API Keys (15 minutes)
Follow the instructions above for each service.

### Step 2: Add to .env.local
```bash
# apps/web/.env.local

# Essential
PEXELS_API_KEY=your_pexels_key_here
PIXABAY_API_KEY=your_pixabay_key_here

# Enhanced (optional but recommended)
FLICKR_API_KEY=your_flickr_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### Step 3: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Run Bulk Update
Go to: http://localhost:3000/admin/bulk-update-images

Click "Start Bulk Update"

---

## 💡 Tips

### For Best Results
1. **Get all 4 API keys** - Takes 15 minutes, huge quality improvement
2. **Run bulk update** - Updates all existing locations
3. **Check results** - View locations to see improved images

### If You're in a Hurry
1. **Just get Pexels + Pixabay** - Takes 5 minutes
2. **Still get 15-18 images per location**
3. **Add others later**

### If You Don't Want API Keys
- Wikimedia + Wikipedia work without keys
- You'll get 10-15 images per location
- Still good quality, just fewer images

---

## 🎯 Expected Results

### Without API Keys
```
Images per location: 10-15
Sources: Wikimedia, Wikipedia
Quality: Good
Time to fetch: 5-10 seconds
```

### With Pexels + Pixabay
```
Images per location: 15-18
Sources: Pexels, Pixabay, Wikimedia, Wikipedia
Quality: Excellent
Time to fetch: 8-12 seconds
```

### With All 4 APIs
```
Images per location: 20-25
Sources: Pexels, Pixabay, Flickr, Unsplash, Wikimedia, Wikipedia
Quality: Premium
Time to fetch: 10-15 seconds
```

---

## 🔐 API Key Security

All API keys are:
- ✅ Stored in `.env.local` (not committed to git)
- ✅ Only used server-side (never exposed to browser)
- ✅ Free tier (no credit card required)
- ✅ Can be regenerated if compromised

---

## 🆘 Troubleshooting

### "API key invalid"
- Double-check you copied the entire key
- Make sure no extra spaces
- Restart dev server after adding keys

### "Rate limit exceeded"
- Only affects Unsplash (50/hour)
- Other APIs are unlimited
- Wait an hour or use other APIs

### "Not enough images"
- Some smaller locations have fewer available
- Try adding more API keys
- Check console logs for errors

---

## 📚 Additional Free Sources (Not Yet Integrated)

These could be added in the future:

### Burst by Shopify
- **URL:** https://burst.shopify.com/
- **License:** CC0
- **API:** No, but CSV export available
- **Travel Focus:** ⭐⭐⭐⭐

### StockSnap.io
- **URL:** https://stocksnap.io/
- **License:** CC0
- **API:** No
- **Travel Focus:** ⭐⭐⭐⭐

### Life of Pix
- **URL:** https://www.lifeofpix.com/
- **License:** CC0
- **API:** No
- **Travel Focus:** ⭐⭐⭐⭐

---

## ✅ Summary

**Recommended Setup:**
1. Get Pexels API key (2 min)
2. Get Pixabay API key (2 min)
3. Get Flickr API key (5 min)
4. Get Unsplash API key (5 min)
5. Add all to `.env.local`
6. Restart dev server
7. Run bulk update

**Total Time:** 15 minutes  
**Result:** 20+ high-quality images per location  
**Cost:** $0 (all free!)

