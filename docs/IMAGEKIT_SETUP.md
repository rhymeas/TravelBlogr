# ImageKit.io Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create ImageKit Account

1. Go to https://imagekit.io
2. Click "Sign Up Free"
3. Create account with email or GitHub
4. Verify your email

### Step 2: Get Your Credentials

Once logged in:

1. **Dashboard** → Click your profile icon (top right)
2. **Developer Options** → Click "API Keys"
3. Copy these 3 values:

```
URL Endpoint: https://ik.imagekit.io/YOUR_IMAGEKIT_ID
Public Key: public_xxxxxxxxxxxxxxxxxxxxx
Private Key: private_xxxxxxxxxxxxxxxxxxxxx (keep secret!)
```

### Step 3: Update Environment Variables

**Local Development (.env.local):**

```bash
# ImageKit.io Configuration
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/YOUR_IMAGEKIT_ID
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxxxxxxx
```

**Railway Production:**

1. Go to Railway dashboard
2. Select your project → Variables
3. Add these variables:
   - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` = `https://ik.imagekit.io/YOUR_IMAGEKIT_ID`
   - `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` = `public_xxxxxxxxxxxxxxxxxxxxx`
4. Click "Deploy" to trigger rebuild

### Step 4: Test Locally

```bash
# Restart dev server
npm run dev

# Open browser
http://localhost:3000/blog

# Check browser console - should see ImageKit URLs:
# https://ik.imagekit.io/YOUR_ID/tr:w-800,q-85,f-auto/...
```

### Step 5: Deploy to Railway

```bash
git add -A
git commit -m "feat: Migrate from Cloudinary to ImageKit"
git push origin main
```

Railway will auto-deploy with new ImageKit configuration.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Blog post images load correctly
- [ ] Location images load correctly
- [ ] Image quality is sharp and clear
- [ ] Images load fast (< 2s)
- [ ] No broken images
- [ ] Browser console shows ImageKit URLs (not Cloudinary)

**Check Network Tab:**
- Open DevTools → Network tab
- Filter by "Img"
- Verify URLs start with `https://ik.imagekit.io/`

---

## 📊 ImageKit Dashboard

Monitor your usage:

1. **Dashboard** → https://imagekit.io/dashboard
2. **Media Library** → View all transformed images
3. **Usage** → Check bandwidth and transformations
4. **Analytics** → See performance metrics

---

## 🆚 ImageKit vs Cloudinary

| Feature | Cloudinary Free | ImageKit Free | Winner |
|---------|----------------|---------------|--------|
| Bandwidth | 25GB/month | 20GB/month | Cloudinary |
| Transformations | 25K/month | **UNLIMITED** | ✅ ImageKit |
| Storage | Unlimited | 20GB | Cloudinary |
| Media Library | ❌ No | ✅ Yes | ✅ ImageKit |
| Paid Plan | $89/month | **$49/month** | ✅ ImageKit |
| CDN | Cloudinary | **AWS CloudFront** | ✅ ImageKit |

---

## 🔧 Troubleshooting

### Images not loading?

**Check 1: Environment variables set?**
```bash
echo $NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
echo $NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
```

**Check 2: Correct URL format?**
- ✅ Correct: `https://ik.imagekit.io/abc123`
- ❌ Wrong: `https://ik.imagekit.io/abc123/` (trailing slash)

**Check 3: Public key correct?**
- Should start with `public_`
- Copy from ImageKit dashboard → API Keys

### Images loading slowly?

**Check 1: Using correct transformations?**
- Open Network tab
- Check image URL includes: `tr:w-800,q-85,f-auto,pr-true`

**Check 2: Progressive loading enabled?**
- Should see `pr-true` in URL
- Images should load blurry → sharp

### 401 Unauthorized errors?

**Cause:** Public key is incorrect or missing

**Fix:**
1. Go to ImageKit dashboard → API Keys
2. Copy PUBLIC key (not private key!)
3. Update `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
4. Restart dev server / redeploy

---

## 📚 ImageKit Documentation

- **Getting Started:** https://docs.imagekit.io/getting-started
- **Image Transformations:** https://docs.imagekit.io/features/image-transformations
- **URL Structure:** https://docs.imagekit.io/features/image-transformations/resize-crop-and-other-transformations
- **Performance:** https://docs.imagekit.io/features/performance-and-optimization

---

## 🎯 Next Steps

1. ✅ **Monitor usage** - Check dashboard weekly
2. ✅ **Optimize images** - Use Media Library to manage images
3. ✅ **Set up alerts** - Get notified at 80% of free tier
4. ✅ **Upgrade when needed** - $49/month for 100GB bandwidth

---

## 💡 Pro Tips

1. **Use Media Library** - Upload frequently used images to ImageKit storage (faster than fetch URLs)
2. **Enable Auto-Optimization** - ImageKit automatically converts to WebP/AVIF
3. **Use Named Transformations** - Create presets in dashboard for consistent sizing
4. **Monitor Performance** - Use ImageKit analytics to track load times
5. **Set up Webhooks** - Get notified when images are uploaded/transformed

---

## 🚨 Important Notes

- **Private Key:** NEVER commit private key to git (only needed for server-side uploads)
- **Public Key:** Safe to expose in client-side code (read-only access)
- **URL Endpoint:** Unique to your account, safe to expose
- **Free Tier:** 20GB bandwidth/month, unlimited transformations
- **Overage:** Automatically upgrades to paid plan if you exceed free tier

---

## 📞 Support

- **ImageKit Support:** support@imagekit.io
- **Documentation:** https://docs.imagekit.io
- **Community:** https://community.imagekit.io
- **Status Page:** https://status.imagekit.io

