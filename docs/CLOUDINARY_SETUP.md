# 🚀 Cloudinary CDN Setup Guide

## Why Cloudinary?

TravelBlogr uses **Cloudinary** as a global CDN for images to achieve maximum performance while keeping costs at **$0**.

### Benefits:
- ✅ **Global CDN** - 200+ edge locations worldwide
- ✅ **Automatic Optimization** - WebP/AVIF format conversion
- ✅ **Image Transformations** - Resize, crop, quality on-the-fly
- ✅ **Zero Cost** - Free tier: 25GB/month bandwidth, 25K transformations
- ✅ **Works with Railway** - No changes to deployment needed

---

## 📋 Setup Steps (5 minutes)

### Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Fill in your details (no credit card required)
4. Verify your email

### Step 2: Get Your Cloud Name

1. Log in to [Cloudinary Console](https://console.cloudinary.com/)
2. On the dashboard, you'll see:
   ```
   Cloud name: your-cloud-name
   API Key: 123456789012345
   API Secret: *********************
   ```
3. **Copy your Cloud Name** (you only need this, not the API keys!)

### Step 3: Add to Environment Variables

#### **Local Development:**

1. Open `apps/web/.env.local`
2. Add this line:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```
3. Replace `your-cloud-name` with your actual cloud name

#### **Railway Deployment:**

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your TravelBlogr project
3. Click **"Variables"** tab
4. Click **"+ New Variable"**
5. Add:
   - **Variable:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **Value:** `your-cloud-name`
6. Click **"Add"**

**IMPORTANT:** After adding the variable, you MUST trigger a rebuild:
```bash
# Option 1: Push a commit
git commit --allow-empty -m "Add Cloudinary CDN"
git push origin main

# Option 2: Manual redeploy in Railway dashboard
# Click "Deployments" → Latest deployment → "⋮" → "Redeploy"
```

---

## ✅ Verify Setup

### Test Locally:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)

3. Visit: http://localhost:3000/locations

4. Check Network tab → Filter by "Images"

5. You should see URLs like:
   ```
   https://res.cloudinary.com/your-cloud-name/image/fetch/...
   ```

### Test on Railway:

1. Visit your Railway deployment URL

2. Open browser console (F12)

3. Check Network tab → Images

4. Verify Cloudinary URLs are being used

---

## 📊 Monitor Usage

### Check Your Usage:

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Click **"Reports"** → **"Usage"**
3. You'll see:
   - **Bandwidth:** X GB / 25 GB
   - **Transformations:** X / 25,000
   - **Storage:** X GB / 10 GB

### Typical TravelBlogr Usage:

- **Bandwidth:** ~3-5 GB/month (1,000 page views)
- **Transformations:** ~10,000/month
- **Storage:** 0 GB (we don't upload, just fetch)

**You'll stay well within the free tier!** ✅

---

## 🎯 How It Works

### Before (Slow):
```
User Request
    ↓
Railway Server (US/EU)
    ↓
External Image Source (Unsplash, Pexels, etc.)
    ↓
User receives image (2-4 seconds)
```

### After (Fast):
```
User Request
    ↓
Cloudinary CDN (nearest edge location)
    ↓ (cached or fetches from source)
External Image Source
    ↓
Cloudinary optimizes (WebP/AVIF, resize)
    ↓
User receives optimized image (200-500ms)
```

### What Happens:

1. **First Request:**
   - Cloudinary fetches from original source
   - Optimizes format (WebP/AVIF)
   - Resizes to requested width
   - Caches at edge locations
   - Serves to user

2. **Subsequent Requests:**
   - Served from edge cache (instant!)
   - No fetching from original source
   - No transformation needed

---

## 🔧 Advanced Configuration (Optional)

### Custom Transformations:

```typescript
import { getCDNUrl } from '@/lib/image-cdn'

// Custom width and quality
const url = getCDNUrl(originalUrl, { 
  width: 1200, 
  quality: 90 
})

// Force specific format
const url = getCDNUrl(originalUrl, { 
  format: 'webp' 
})
```

### Presets:

```typescript
import { getCDNUrlWithPreset } from '@/lib/image-cdn'

// Use predefined presets
const thumbnailUrl = getCDNUrlWithPreset(originalUrl, 'thumbnail') // 200px
const cardUrl = getCDNUrlWithPreset(originalUrl, 'card')           // 800px
const heroUrl = getCDNUrlWithPreset(originalUrl, 'hero')           // 1920px
```

---

## 🐛 Troubleshooting

### Images not loading through Cloudinary:

**Check 1:** Verify environment variable is set
```bash
# Local
echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Railway
railway variables
```

**Check 2:** Verify cloud name is correct
- Should NOT include `https://` or `.cloudinary.com`
- Just the cloud name: `travelblogr` or `my-cloud-123`

**Check 3:** Rebuild after adding variable
```bash
git commit --allow-empty -m "Rebuild for env vars"
git push origin main
```

### Images still slow:

**Check 1:** Verify Cloudinary URLs in Network tab
- Should see: `res.cloudinary.com/your-cloud-name/...`
- If not, check browser console for errors

**Check 2:** Check Cloudinary dashboard
- Reports → Usage → Bandwidth
- Should see increasing usage

**Check 3:** Clear browser cache
```
Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### "Invalid cloud name" error:

- Make sure cloud name doesn't have spaces or special characters
- Should be lowercase letters, numbers, hyphens only
- Example: `travelblogr` ✅
- Example: `Travel Blogr` ❌

---

## 💰 Cost Breakdown

### Free Tier Limits:
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Storage:** 10 GB (not used by TravelBlogr)
- **Credits:** $0/month

### When You'll Need to Upgrade:
- **>25 GB bandwidth** = ~8,000 page views/month
- **>25K transformations** = ~25,000 unique images/month

**For most TravelBlogr sites, free tier is enough!** ✅

### Paid Plans (if needed):
- **Plus:** $89/month - 75 GB bandwidth, 75K transformations
- **Advanced:** $224/month - 150 GB bandwidth, 150K transformations

---

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Image Transformations Guide](https://cloudinary.com/documentation/image_transformations)
- [Fetch Remote Images](https://cloudinary.com/documentation/fetch_remote_images)
- [Next.js Integration](https://cloudinary.com/documentation/next_integration)

---

## ✅ Summary

**Setup Time:** 5 minutes
**Cost:** $0/month
**Performance Gain:** 80% faster image loading
**Global Coverage:** 200+ edge locations

**Perfect for Railway deployment - no changes needed, just faster images!** 🚀

