# ⚡ Railway Cron Jobs - Quick Start

## 🎯 Your Generated CRON_SECRET

```
CGVlFPM5V5Tbp/MynMc9yciJIJPlb1VabxZW+6H6MEY=
```

**⚠️ IMPORTANT:** Add this to Railway immediately, then delete this file!

---

## 🚀 Setup (5 Minutes)

### Step 1: Add CRON_SECRET to Railway

1. Go to https://railway.app/dashboard
2. Select **TravelBlogr** project
3. Click on your service
4. Go to **Variables** tab
5. Click **New Variable**
6. Add:
   - **Name:** `CRON_SECRET`
   - **Value:** `CGVlFPM5V5Tbp/MynMc9yciJIJPlb1VabxZW+6H6MEY=`
7. Click **Add**

### Step 2: Enable Cron Jobs

Go to **Settings** → **Cron Jobs** → **Add Cron Job**

Add these 5 jobs:

#### 1. Cleanup Cache (Daily at 2 AM)
```
Name: cleanup-cache
Schedule: 0 2 * * *
Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/cleanup-cache -H "Authorization: Bearer $CRON_SECRET"
```

#### 2. Sync Weather (Every 6 Hours)
```
Name: sync-weather
Schedule: 0 */6 * * *
Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/sync-weather -H "Authorization: Bearer $CRON_SECRET"
```

#### 3. Fix Missing Images (Daily at 6 AM)
```
Name: fix-missing-images
Schedule: 0 6 * * *
Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/fix-missing-images -H "Authorization: Bearer $CRON_SECRET"
```

#### 4. Fix Missing Regions (Daily at Noon)
```
Name: fix-missing-regions
Schedule: 0 12 * * *
Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/fix-missing-regions -H "Authorization: Bearer $CRON_SECRET"
```

#### 5. Location Health Check (Daily at 6 PM)
```
Name: location-health-check
Schedule: 0 18 * * *
Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/location-health-check -H "Authorization: Bearer $CRON_SECRET"
```

### Step 3: Test One Job

```bash
# Replace with your Railway domain
curl -X GET https://your-app.railway.app/api/cron/cleanup-cache \
  -H "Authorization: Bearer CGVlFPM5V5Tbp/MynMc9yciJIJPlb1VabxZW+6H6MEY="
```

Expected response:
```json
{
  "success": true,
  "deletedCount": 0,
  "timestamp": "2025-10-22T..."
}
```

### Step 4: Monitor Logs

```bash
# View logs in Railway dashboard
# Or use CLI:
railway logs
```

---

## 📊 What Each Job Does

| Job | Benefit |
|-----|---------|
| **cleanup-cache** | Saves database space by removing old cache |
| **sync-weather** | Keeps weather data fresh (updated every 6 hours) |
| **fix-missing-images** | Ensures all locations have images |
| **fix-missing-regions** | Completes location data |
| **location-health-check** | Replaces placeholders, improves quality |

---

## ✅ Verification Checklist

- [ ] CRON_SECRET added to Railway variables
- [ ] All 5 cron jobs created in Railway
- [ ] Tested one job manually (got 200 OK response)
- [ ] Checked logs (no errors)
- [ ] Deleted this file (contains secret!)

---

## 🎉 Done!

Your cron jobs are now running automatically! They'll:

- ✅ Keep your data fresh
- ✅ Fix missing images
- ✅ Maintain data quality
- ✅ Save you manual work

**Next:** Monitor logs for 24 hours to ensure everything works smoothly.

**Full docs:** See `docs/RAILWAY_CRON_SETUP.md` for detailed information.

