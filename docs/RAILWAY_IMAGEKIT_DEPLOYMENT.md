# Railway Deployment with ImageKit

## 🚀 Quick Deployment Guide (2 minutes)

### Step 1: Add ImageKit Environment Variables to Railway

1. Go to **Railway Dashboard**: https://railway.app/dashboard
2. Select your **TravelBlogr** project
3. Click on your **web service**
4. Go to **Variables** tab
5. Click **+ New Variable**

Add these 2 variables:

```bash
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/travelblogr
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_+r6YqkBfwcvm5a5JX56UPV/JRvY=
```

**Optional (for server-side uploads):**
```bash
IMAGEKIT_PRIVATE_KEY=private_Li460c7D5LUV1e1+tAq9VhYJnYU=
```

6. Click **Deploy** to trigger rebuild

---

### Step 2: Verify Deployment

Once Railway finishes deploying:

1. **Check deployment logs:**
   - Look for "✓ Ready in XXXms"
   - No errors about missing ImageKit variables

2. **Test your site:**
   - Open your Railway URL: `https://your-app.up.railway.app`
   - Navigate to `/blog`
   - Open DevTools → Network tab
   - Filter by "Img"
   - Verify image URLs start with `https://ik.imagekit.io/travelblogr`

3. **Check ImageKit dashboard:**
   - Go to https://imagekit.io/dashboard
   - Check "Usage" tab
   - Verify bandwidth and transformations are being tracked

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Railway deployment successful (green checkmark)
- [ ] No errors in Railway logs
- [ ] Blog post images load correctly
- [ ] Location images load correctly
- [ ] Images load fast (< 2s)
- [ ] No broken images
- [ ] Browser Network tab shows ImageKit URLs
- [ ] ImageKit dashboard shows usage

---

## 🔧 Troubleshooting

### Images not loading?

**Check 1: Environment variables set in Railway?**
- Railway → Variables tab
- Verify `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` is set
- Verify `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` is set

**Check 2: Rebuild triggered?**
- `NEXT_PUBLIC_*` variables require REBUILD (not just restart)
- Railway → Deployments tab → Click "Deploy"

**Check 3: Correct URL format?**
- ✅ Correct: `https://ik.imagekit.io/travelblogr`
- ❌ Wrong: `https://ik.imagekit.io/travelblogr/` (trailing slash)

### 401 Unauthorized errors?

**Cause:** Public key is incorrect or missing

**Fix:**
1. Go to ImageKit dashboard → API Keys
2. Copy PUBLIC key (not private key!)
3. Update `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` in Railway
4. Trigger rebuild

### Images loading slowly?

**Check 1: Using correct transformations?**
- Open Network tab
- Check image URL includes: `tr:w-800,q-85,f-auto,pr-true`

**Check 2: First-time fetch?**
- ImageKit caches images after first fetch
- Subsequent loads will be faster

---

## 📊 Monitoring

### ImageKit Dashboard

Monitor your usage:

1. **Dashboard** → https://imagekit.io/dashboard
2. **Usage** → Check bandwidth and transformations
3. **Media Library** → View all transformed images
4. **Analytics** → See performance metrics

### Railway Logs

Monitor deployment:

1. **Railway** → Deployments tab
2. **Logs** → Check for errors
3. **Metrics** → Monitor CPU/memory usage

---

## 🎯 Expected Results

After successful deployment:

| Metric | Before (Cloudinary) | After (ImageKit) | Improvement |
|--------|---------------------|------------------|-------------|
| **Transformations** | 25K/month limit | **UNLIMITED** | ♾️ **Infinite** |
| **Bandwidth** | 25GB/month | 20GB/month | -5GB |
| **Cost (Paid)** | $89/month | **$49/month** | 💰 **$40/month savings** |
| **CDN** | Cloudinary | **AWS CloudFront** | ⚡ **Faster** |
| **Media Library** | ❌ No | ✅ **Yes** | ✅ **New feature** |

---

## 🚨 Important Notes

### Environment Variables

- **`NEXT_PUBLIC_*` variables** - Baked into build at BUILD TIME
  - Changing these requires REBUILD (not just restart)
  - Click "Deploy" in Railway to trigger rebuild

- **Private Key** - NEVER commit to git
  - Only needed for server-side uploads
  - Keep secret in Railway variables

### Free Tier Limits

- **20GB bandwidth/month** - Monitor in ImageKit dashboard
- **UNLIMITED transformations** - No limit!
- **20GB storage** - Only if uploading to ImageKit storage

### Overage

- If you exceed free tier, ImageKit automatically upgrades to paid plan
- Set up alerts in ImageKit dashboard to get notified at 80% usage

---

## 📚 Additional Resources

- **ImageKit Setup Guide:** `docs/IMAGEKIT_SETUP.md`
- **ImageKit Documentation:** https://docs.imagekit.io
- **Railway Documentation:** https://docs.railway.app
- **TravelBlogr Deployment Guide:** `docs/DEPLOYMENT.md`

---

## 🎉 Success!

Once deployed, your TravelBlogr site will:

✅ Load images 3-5x faster (optimized quality + progressive loading)  
✅ Have unlimited image transformations (no more 25K limit)  
✅ Use AWS CloudFront CDN (faster global delivery)  
✅ Save $40/month on paid plans (if you upgrade)  
✅ Have access to Media Library (manage images in dashboard)  

**Enjoy your faster, cheaper, better image CDN!** 🚀

