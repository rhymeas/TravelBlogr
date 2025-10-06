# Quick Start: High-Quality Images

## 🚀 5-Minute Setup

### Step 1: Get Free API Keys (3 minutes)

#### Pexels (Recommended - Unlimited)
1. Go to https://www.pexels.com/api/
2. Click "Get Started"
3. Sign up (free)
4. Copy your API key

#### Pixabay (Recommended - Unlimited)
1. Go to https://pixabay.com/api/docs/
2. Click "Get Started"
3. Sign up (free)
4. Copy your API key

#### Unsplash (Optional - 50/hour)
1. Go to https://unsplash.com/developers
2. Click "Register as a developer"
3. Create a new app
4. Copy your Access Key

### Step 2: Add Keys to .env.local (1 minute)

Open `apps/web/.env.local` and add:

```bash
# Image APIs (all free!)
PEXELS_API_KEY=your_pexels_key_here
PIXABAY_API_KEY=your_pixabay_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### Step 3: Update Existing Locations (1 minute to start)

```bash
npx tsx scripts/update-images-high-quality.ts
```

This will:
- ✅ Fetch 20 high-res images per location
- ✅ Use better search terms
- ✅ Update your database
- ⏱️ Takes ~5-10 seconds per location

## 📊 What You'll Get

### Before
```
Amsterdam:
- Featured: Low-res thumbnail (640x480)
- Gallery: 6 mixed-quality images
- Search: "Amsterdam" (generic)
```

### After
```
Amsterdam:
- Featured: High-res aerial photo (2000x1333)
- Gallery: 20 professional cityscape photos
- Search: "Amsterdam cityscape", "Amsterdam skyline", etc.
```

## 🎯 Results

### Image Quality
- **Resolution:** 2000px+ width (vs 640px before)
- **Count:** 20 images (vs 6 before)
- **Relevance:** Location-specific (vs generic before)

### Example URLs

**Before (Low Quality):**
```
https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Amsterdam_airphoto.jpg/640px-Amsterdam_airphoto.jpg
```

**After (High Quality):**
```
https://upload.wikimedia.org/wikipedia/commons/a/af/Amsterdam_airphoto.jpg
```

Notice: No `/thumb/` and no `/640px-` = full resolution!

## 🔍 Verify Results

1. **Check Console Logs**
   ```
   ✅ Pexels ORIGINAL: Found for "Amsterdam cityscape"
   ✅ Wikimedia HIGH-RES: 2000x1333 for "Amsterdam aerial view"
   🎉 Total unique HIGH QUALITY images: 23
   ```

2. **Check Database**
   - Open Supabase dashboard
   - Go to `locations` table
   - Check `gallery_images` array length (should be ~20)
   - Check image URLs (should be high-res)

3. **Check Website**
   - Go to http://localhost:3000/locations/amsterdam/photos
   - Images should be sharp and high-resolution
   - Should have 20 images in gallery

## 🐛 Common Issues

### Issue: "No API key found"
**Solution:** Make sure keys are in `apps/web/.env.local` and restart dev server

### Issue: "Only found 5 images"
**Solution:** 
- Check if all 3 API keys are set
- Verify keys are valid
- Check console for API errors

### Issue: "Images still low quality"
**Solution:**
- Clear browser cache
- Run update script again
- Check image URLs in database (should not contain `/thumb/` or `/640px-`)

## 📈 Performance

### API Rate Limits
- **Pexels:** Unlimited ✅
- **Pixabay:** Unlimited ✅
- **Unsplash:** 50 requests/hour ⚠️
- **Wikimedia:** Unlimited ✅
- **Wikipedia:** Unlimited ✅

### Script Performance
- **Per Location:** ~5-10 seconds
- **10 Locations:** ~1-2 minutes
- **50 Locations:** ~5-10 minutes

### Caching
- Images cached for 24 hours
- Reduces API calls
- Faster subsequent requests

## 🎉 Success Checklist

- [ ] Got API keys from Pexels, Pixabay, Unsplash
- [ ] Added keys to `.env.local`
- [ ] Ran `npx tsx scripts/update-images-high-quality.ts`
- [ ] Verified console shows "HIGH-RES" and "ORIGINAL" logs
- [ ] Checked database has 20 images per location
- [ ] Verified website shows high-quality images
- [ ] Images are location-specific (not generic)

## 🚀 Next Steps

### For New Locations
The enhanced service is now integrated into:
- Auto-fill API (creates new locations)
- Refresh images API (updates existing)
- Update location API (background updates)

New locations will automatically get high-quality images!

### For Manual Override
Users can paste custom image URLs in CMS, which take priority over auto-fetched images.

### For Further Customization
Edit `apps/web/lib/services/enhancedImageService.ts`:
- Add more search terms
- Adjust quality thresholds
- Add new image sources

## 📚 Full Documentation

For detailed information, see:
- `IMAGE_QUALITY_IMPROVEMENTS.md` - Complete summary
- `docs/IMAGE_QUALITY_GUIDE.md` - Detailed guide

## 💡 Tips

1. **Start with major cities** - They have more available images
2. **Check console logs** - Shows which APIs are working
3. **Use all 3 APIs** - Better variety and more images
4. **Be patient** - Script takes time but results are worth it
5. **Cache is your friend** - Images cached for 24 hours

---

**Ready?** Run the script and watch your image quality improve! 🎨

