# 🎥 Self-Hosted Hero Videos Guide

**Goal:** Download, optimize, and upload hero videos to Supabase for faster, more reliable loading.

---

## 📋 Step-by-Step Guide

### **Step 1: Download Videos from Pexels**

1. **Go to Pexels and download the videos:**

   - Lagoon: https://www.pexels.com/video/28167396/
   - Beach: https://www.pexels.com/video/33323673/
   - Caribbean: https://www.pexels.com/video/4135118/
   - City: https://www.pexels.com/video/2282013/
   - Snow: https://www.pexels.com/video/1858244/
   - Desert: https://www.pexels.com/video/2055060/

2. **Download the SD or HD version** (we'll optimize them next)

3. **Save to a folder:** `scripts/hero-videos/`

---

### **Step 2: Optimize Videos with FFmpeg**

#### **Option A: Install FFmpeg**

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from: https://ffmpeg.org/download.html
```

#### **Option B: Use Online Tool**

If you don't want to install FFmpeg, use:
- **CloudConvert:** https://cloudconvert.com/mp4-converter
- **FreeConvert:** https://www.freeconvert.com/video-compressor

**Settings for online tools:**
- Resolution: 640x360 (SD) or 854x480 (480p)
- Bitrate: 500-800 kbps
- Format: MP4 (H.264)

#### **Option C: FFmpeg Commands (Recommended)**

Create a script to optimize all videos at once:

```bash
#!/bin/bash
# Save as: scripts/optimize-videos.sh

cd scripts/hero-videos

# Optimize each video
for video in *.mp4; do
  echo "Optimizing $video..."
  
  ffmpeg -i "$video" \
    -vf scale=640:360 \
    -c:v libx264 \
    -crf 28 \
    -preset slow \
    -c:a aac \
    -b:a 96k \
    -movflags +faststart \
    "optimized_${video}"
  
  echo "✅ Done: optimized_${video}"
done

echo "🎉 All videos optimized!"
```

**Run the script:**
```bash
chmod +x scripts/optimize-videos.sh
./scripts/optimize-videos.sh
```

**Expected results:**
- Original: 10-50MB → Optimized: 1-3MB
- Quality: Still looks great at 640x360
- Load time: 2-5 seconds on 4G

---

### **Step 3: Rename Videos**

Rename the optimized videos to match our naming:

```
optimized_video1.mp4 → lagoon.mp4
optimized_video2.mp4 → beach.mp4
optimized_video3.mp4 → caribbean.mp4
optimized_video4.mp4 → city.mp4
optimized_video5.mp4 → snow.mp4
optimized_video6.mp4 → desert.mp4
```

**Folder structure:**
```
scripts/
└── hero-videos/
    ├── lagoon.mp4
    ├── beach.mp4
    ├── caribbean.mp4
    ├── city.mp4
    ├── snow.mp4
    └── desert.mp4
```

---

### **Step 4: Extract Poster Images (Optional)**

Extract a frame from each video to use as poster:

```bash
#!/bin/bash
# Save as: scripts/extract-posters.sh

cd scripts/hero-videos
mkdir -p posters

for video in *.mp4; do
  name="${video%.mp4}"
  echo "Extracting poster from $video..."
  
  ffmpeg -i "$video" \
    -ss 00:00:02 \
    -vframes 1 \
    -q:v 2 \
    "posters/${name}.jpg"
  
  echo "✅ Done: posters/${name}.jpg"
done

echo "🎉 All posters extracted!"
```

**Run:**
```bash
chmod +x scripts/extract-posters.sh
./scripts/extract-posters.sh
```

---

### **Step 5: Upload to Supabase**

#### **Option A: Use Upload Script (Automated)**

```bash
# Install dependencies
npm install tsx

# Run upload script
npx tsx scripts/upload-hero-videos.ts
```

The script will:
1. Create `hero-videos` bucket in Supabase
2. Upload all videos
3. Upload poster images
4. Generate configuration code
5. Print URLs for you to use

#### **Option B: Manual Upload via Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your TravelBlogr project

2. **Create Storage Bucket:**
   - Storage → Create bucket
   - Name: `hero-videos`
   - Public: ✅ Yes
   - File size limit: 10MB

3. **Upload Videos:**
   - Click on `hero-videos` bucket
   - Upload each video file
   - Note the public URL for each

4. **Upload Posters:**
   - Create folder: `posters`
   - Upload poster images

---

### **Step 6: Update Code with New URLs**

After uploading, you'll get URLs like:
```
https://[project-id].supabase.co/storage/v1/object/public/hero-videos/lagoon.mp4
https://[project-id].supabase.co/storage/v1/object/public/hero-videos/beach.mp4
...
```

Update `apps/web/app/page.tsx`:

```typescript
const HERO_VIDEOS = [
  {
    id: 'lagoon',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/lagoon.mp4',
    fallbackImage: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/posters/lagoon.jpg',
    poster: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/posters/lagoon.jpg',
    credit: 'Taryn Elliott',
    theme: 'forest'
  },
  {
    id: 'beach',
    url: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/beach.mp4',
    fallbackImage: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/posters/beach.jpg',
    poster: 'https://nchhcxokrzabbkvhzsor.supabase.co/storage/v1/object/public/hero-videos/posters/beach.jpg',
    credit: 'Taryn Elliott',
    theme: 'beach'
  },
  // ... rest of videos
]
```

---

## 💰 Cost Estimate

### **Supabase Storage Pricing:**

- **Storage:** $0.021/GB/month
- **Bandwidth:** $0.09/GB

### **Example Calculation:**

**6 videos × 2MB each = 12MB total**

**Monthly costs:**
- Storage: 0.012GB × $0.021 = **$0.00025/month** (basically free)
- Bandwidth (1000 views/month): 12MB × 1000 = 12GB × $0.09 = **$1.08/month**

**Free tier includes:**
- 1GB storage (you're using 0.012GB)
- 2GB bandwidth/month (covers ~166 views)

**Verdict:** Extremely cheap! Even with 10,000 views/month, it's only ~$10.

---

## 🚀 Performance Comparison

### **Before (Pexels URLs):**
```
❌ File size: 20-50MB
❌ Load time: 15-30s on 4G
❌ Rate limiting possible
❌ CORS issues
❌ URLs may expire
```

### **After (Self-Hosted):**
```
✅ File size: 1-3MB (90% smaller)
✅ Load time: 2-5s on 4G (80% faster)
✅ No rate limiting
✅ No CORS issues
✅ URLs never expire
✅ Full control
```

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Create folder
mkdir -p scripts/hero-videos

# 2. Download videos from Pexels (manually)

# 3. Optimize videos
cd scripts/hero-videos
for video in *.mp4; do
  ffmpeg -i "$video" -vf scale=640:360 -crf 28 -preset slow -movflags +faststart "opt_${video}"
done

# 4. Upload to Supabase
npx tsx scripts/upload-hero-videos.ts

# 5. Update page.tsx with new URLs

# 6. Test and deploy!
```

---

## ✅ Checklist

- [ ] FFmpeg installed (or using online tool)
- [ ] Videos downloaded from Pexels
- [ ] Videos optimized (1-3MB each)
- [ ] Videos renamed correctly
- [ ] Poster images extracted (optional)
- [ ] Supabase bucket created
- [ ] Videos uploaded to Supabase
- [ ] URLs copied
- [ ] Code updated with new URLs
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Verified loading speed

---

## 🔧 Troubleshooting

### **Videos still slow?**
- Reduce resolution to 480x270
- Increase CRF to 30-32 (smaller file, lower quality)
- Trim video length to 5-10 seconds

### **Upload script fails?**
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Verify bucket name is correct
- Check file paths are correct

### **Videos don't play?**
- Verify URLs are public
- Check bucket is set to public
- Test URL directly in browser

---

## 📝 Summary

**Yes, self-hosting is definitely worth it!**

**Benefits:**
- ✅ 80-90% faster loading
- ✅ More reliable (no external dependencies)
- ✅ Cheaper in the long run
- ✅ Full control over quality and optimization
- ✅ No rate limiting or CORS issues

**Effort:**
- 30-60 minutes one-time setup
- Very low ongoing maintenance

**Recommendation:** Do it! The performance improvement is significant and the cost is minimal.


