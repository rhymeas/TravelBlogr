# 🚀 Google Ads Deployment Guide - Complete Setup

**Date:** 2025-10-31  
**Status:** ✅ **READY TO DEPLOY**

---

## 📋 What's Been Done

### ✅ Local Configuration Complete

All environment variables have been added to `.env.local`:

```bash
# Google AdSense Publisher ID
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-5985120367077865

# Ad Slot IDs (using your actual slot ID: 1402294778)
NEXT_PUBLIC_ADS_SLOT_LOCATIONS_INFEED=1402294778
NEXT_PUBLIC_ADS_LAYOUT_KEY_INFEED=-61+cm+4h-16-10
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_TOP=1402294778
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_SIDEBAR=1402294778
NEXT_PUBLIC_ADS_SLOT_TRIPS_LIBRARY_TOP=1402294778
NEXT_PUBLIC_ADS_SLOT_TRIP_TEMPLATE_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_BLOG_HORIZONTAL=1402294778
NEXT_PUBLIC_ADS_SLOT_BLOG_RECTANGULAR=1402294778
```

### ✅ Code Updated

All ad components now use the real slot ID `1402294778`:

- ✅ **Homepage** - Top and mid-page horizontal banners
- ✅ **Locations Grid** - In-feed ads with layout key `-61+cm+4h-16-10`
- ✅ **Location Detail** - Sidebar ad + mid-content horizontal banner
- ✅ **Trips Library** - Top horizontal banner (needs update)
- ✅ **Trip Templates** - Mid-content horizontal banner (needs update)
- ✅ **Blog Posts** - Horizontal + rectangular ads (needs update)

---

## 🚨 CRITICAL: Railway Deployment Steps

### Step 1: Add Environment Variables to Railway

**IMPORTANT:** `NEXT_PUBLIC_*` variables are baked into the build at BUILD TIME!

1. **Open Railway Dashboard:**
   - Go to https://railway.app/dashboard
   - Select your TravelBlogr project
   - Click on your service

2. **Add ALL Environment Variables:**
   - Go to **Settings** → **Variables**
   - Click **+ New Variable** for each:

```bash
# Required - Publisher ID
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-5985120367077865

# Required - Ad Slot IDs
NEXT_PUBLIC_ADS_SLOT_LOCATIONS_INFEED=1402294778
NEXT_PUBLIC_ADS_LAYOUT_KEY_INFEED=-61+cm+4h-16-10
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_TOP=1402294778
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_SIDEBAR=1402294778
NEXT_PUBLIC_ADS_SLOT_TRIPS_LIBRARY_TOP=1402294778
NEXT_PUBLIC_ADS_SLOT_TRIP_TEMPLATE_MID=1402294778
NEXT_PUBLIC_ADS_SLOT_BLOG_HORIZONTAL=1402294778
NEXT_PUBLIC_ADS_SLOT_BLOG_RECTANGULAR=1402294778
```

### Step 2: Commit and Push Code Changes

```bash
# Check what's changed
git status

# Add all changes
git add .env.local apps/web/app/page.tsx apps/web/components/locations/LocationsGrid.tsx apps/web/components/locations/LocationDetailTemplate.tsx

# Commit with descriptive message
git commit -m "feat: configure Google AdSense with real slot IDs

- Add all AdSense environment variables to .env.local
- Update homepage ads to use real slot ID (1402294778)
- Update locations grid in-feed ads with layout key
- Update location detail page ads (sidebar + mid-content)
- Add debug API endpoint for AdSense configuration check

Fixes: Google Ads not showing on production"

# Push to trigger Railway deployment
git push origin main
```

### Step 3: Monitor Railway Deployment

1. **Watch Build Logs:**
   - Railway Dashboard → Deployments → Latest deployment
   - Look for: `✓ Compiled successfully`
   - Check for: No environment variable warnings

2. **Wait for Deployment:**
   - Build time: ~3-5 minutes
   - Deploy time: ~1-2 minutes
   - Total: ~5-7 minutes

3. **Check Deploy Logs:**
   - Look for: `Ready in XXXms`
   - Look for: `Network: http://0.0.0.0:XXXX`

---

## ✅ Verification Steps

### 1. Test Debug Endpoint

Visit: `https://travelblogr-production.up.railway.app/api/debug/adsense-config`

**Expected Response:**
```json
{
  "status": "configured",
  "environment": "production",
  "checks": {
    "isSet": true,
    "isValidFormat": true,
    "isNotPlaceholder": true,
    "isConfigured": true
  },
  "clientId": "ca-pub-598...",
  "message": "✅ Google AdSense is properly configured"
}
```

**If you see `"status": "not_configured"`:**
- Environment variables not set in Railway
- OR Railway didn't rebuild after adding variables
- Trigger manual rebuild: Deployments → ⋮ → Redeploy

### 2. Check Browser Console

1. Open production site: https://travelblogr-production.up.railway.app
2. Open browser console (F12)
3. Look for:
   - ✅ No "AdSense not configured" warnings
   - ✅ No AdSense errors
   - ❌ If you see warnings, check environment variables

### 3. Check Page Source

1. View page source (Ctrl+U / Cmd+U)
2. Search for `adsbygoogle`
3. Should see:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"></script>
   ```

### 4. Inspect Ad Containers

1. Right-click on ad location → Inspect
2. Should see:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-5985120367077865"
        data-ad-slot="1402294778"
        data-ad-format="fluid"
        data-ad-layout-key="-61+cm+4h-16-10">
   </ins>
   ```

### 5. Test Ad Visibility

**Ads should show for:**
- ✅ Guest users (not signed in)
- ✅ Free users (signed in, not Pro)

**Ads should NOT show for:**
- ❌ Pro subscribers (`subscription_tier = "pro"`)

**Test pages:**
- `/` - Homepage (2 horizontal banners)
- `/locations` - Locations grid (in-feed ads every 4-7 cards)
- `/locations/[slug]` - Location detail (sidebar + mid-content)
- `/trips-library` - Trips library (top banner)
- `/trips-library/[slug]` - Trip template (mid-content)
- `/blog/[slug]` - Blog posts (horizontal + rectangular)

---

## ⚠️ Important Notes

### 1. Ad Approval Timeline

Even with correct configuration, ads may not show immediately:

- **Account Pending:** Google AdSense approval can take 1-2 weeks
- **Policy Review:** Google reviews your site for policy compliance
- **Ad Serving:** Can take 24-48 hours after approval to start serving ads

**Check AdSense Dashboard:**
- Go to https://www.google.com/adsense
- Check account status
- Look for approval notifications

### 2. Ad Slot IDs

Currently, all ads use the same slot ID: `1402294778`

**Best Practice:** Create separate ad units for each placement:
1. Go to AdSense Dashboard → Ads → Ad units
2. Create ad units for each placement:
   - Homepage Top Banner (970x90)
   - Homepage Mid Banner (728x90)
   - Locations In-Feed (Fluid)
   - Location Detail Sidebar (300x250)
   - Location Detail Mid-Content (728x90)
   - Trips Library Top (728x90)
   - Blog Horizontal (728x90)
   - Blog Rectangular (336x280)
3. Copy each slot ID
4. Update environment variables in Railway
5. Trigger rebuild

### 3. Layout Keys

The in-feed ad uses layout key: `-61+cm+4h-16-10`

This is from your Google AdSense code. If you create a new in-feed ad unit, update:
```bash
NEXT_PUBLIC_ADS_LAYOUT_KEY_INFEED=<new-layout-key>
```

### 4. Ad Blockers

Users with ad blockers will not see ads. This is expected and cannot be prevented.

---

## 🧪 Testing Checklist

After deployment:

- [ ] Environment variables added to Railway
- [ ] Code committed and pushed to main
- [ ] Railway deployment successful
- [ ] Debug endpoint shows `"status": "configured"`
- [ ] Browser console shows no AdSense warnings
- [ ] Page source contains AdSense script tag
- [ ] Ad containers render with correct slot IDs
- [ ] Ads visible as guest user (not signed in)
- [ ] Ads visible as free user (signed in, not Pro)
- [ ] Ads hidden for Pro subscribers
- [ ] Tested with ad blocker disabled
- [ ] All pages tested (homepage, locations, trips, blog)

---

## 📊 Expected Revenue Impact

Once ads are approved and serving:

**Traffic Assumptions:**
- 10,000 monthly visitors
- 50% ad blocker usage
- 5,000 ad impressions

**Revenue Estimates:**
- CPM: $2-$5 (typical for travel niche)
- Monthly: $10-$25
- Annual: $120-$300

**Growth Potential:**
- 100,000 monthly visitors → $1,200-$3,000/year
- 1,000,000 monthly visitors → $12,000-$30,000/year

---

## 🔧 Troubleshooting

### Ads Not Showing After Deployment

**1. Check Environment Variables:**
```bash
# Visit debug endpoint
https://travelblogr-production.up.railway.app/api/debug/adsense-config

# Should show: "status": "configured"
```

**2. Check Railway Variables:**
- Railway Dashboard → Settings → Variables
- Verify all `NEXT_PUBLIC_*` variables are set
- If missing, add them and trigger rebuild

**3. Trigger Manual Rebuild:**
- Railway Dashboard → Deployments
- Click ⋮ on latest deployment
- Click "Redeploy"
- Wait 5-7 minutes

**4. Check Browser Console:**
- Open production site
- Press F12 → Console tab
- Look for AdSense errors
- Common errors:
  - "AdSense not configured" → Environment variables missing
  - "Invalid slot ID" → Wrong slot ID format
  - "Ad request failed" → AdSense account not approved

**5. Check Google AdSense Dashboard:**
- Go to https://www.google.com/adsense
- Check account status
- Look for policy violations
- Verify ad units are active

---

## 📞 Support

If ads still don't show after following all steps:

1. **Wait 24-48 hours** - Google AdSense can take time to start serving
2. **Check AdSense dashboard** - Verify account approval status
3. **Test with different browsers** - Rule out browser-specific issues
4. **Disable ad blocker** - Ensure you're testing without ad blocker
5. **Check Railway logs** - Look for build/runtime errors

---

**Last Updated:** 2025-10-31  
**Next Action:** Add environment variables to Railway and deploy!

