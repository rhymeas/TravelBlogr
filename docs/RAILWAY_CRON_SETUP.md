# 🤖 Railway Cron Jobs Setup Guide

## Overview

TravelBlogr uses automated cron jobs to maintain data quality and freshness. Since you're on **Railway Pro**, you have access to cron jobs at no extra cost!

---

## 📋 Configured Cron Jobs

| Job | Schedule | Frequency | What It Does |
|-----|----------|-----------|--------------|
| **cleanup-cache** | `0 2 * * *` | Daily at 2 AM | Deletes expired cache entries to save database space |
| **sync-weather** | `0 */6 * * *` | Every 6 hours | Updates weather data for all locations |
| **fix-missing-images** | `0 6 * * *` | Daily at 6 AM | Finds locations without images and fetches them |
| **fix-missing-regions** | `0 12 * * *` | Daily at noon | Fixes locations with missing region data |
| **location-health-check** | `0 18 * * *` | Daily at 6 PM | Replaces placeholder images, fixes descriptions |

---

## 🚀 Setup Instructions

### Option 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - Open https://railway.app/dashboard
   - Select your TravelBlogr project

2. **Add Cron Secret (Security):**
   - Click on your service
   - Go to "Variables" tab
   - Add new variable:
     ```
     CRON_SECRET=your-random-secret-here
     ```
   - Generate a random secret:
     ```bash
     openssl rand -base64 32
     ```

3. **Enable Cron Jobs:**
   - Go to "Settings" tab
   - Scroll to "Cron Jobs" section
   - Click "Add Cron Job"
   - For each job, add:

   **Job 1: Cleanup Cache**
   ```
   Name: cleanup-cache
   Schedule: 0 2 * * *
   Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/cleanup-cache -H "Authorization: Bearer $CRON_SECRET"
   ```

   **Job 2: Sync Weather**
   ```
   Name: sync-weather
   Schedule: 0 */6 * * *
   Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/sync-weather -H "Authorization: Bearer $CRON_SECRET"
   ```

   **Job 3: Fix Missing Images**
   ```
   Name: fix-missing-images
   Schedule: 0 6 * * *
   Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/fix-missing-images -H "Authorization: Bearer $CRON_SECRET"
   ```

   **Job 4: Fix Missing Regions**
   ```
   Name: fix-missing-regions
   Schedule: 0 12 * * *
   Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/fix-missing-regions -H "Authorization: Bearer $CRON_SECRET"
   ```

   **Job 5: Location Health Check**
   ```
   Name: location-health-check
   Schedule: 0 18 * * *
   Command: curl -X GET https://$RAILWAY_PUBLIC_DOMAIN/api/cron/location-health-check -H "Authorization: Bearer $CRON_SECRET"
   ```

4. **Save and Deploy:**
   - Click "Save" for each cron job
   - Railway will automatically start running them on schedule

---

### Option 2: Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Link Project:**
   ```bash
   railway link
   ```

4. **Add Cron Secret:**
   ```bash
   railway variables set CRON_SECRET=$(openssl rand -base64 32)
   ```

5. **Deploy with Cron Config:**
   ```bash
   railway up
   ```

---

## 🔐 Security

All cron jobs are protected with a `CRON_SECRET` environment variable. This prevents unauthorized access to your cron endpoints.

**To generate a secure secret:**
```bash
openssl rand -base64 32
```

**Add to Railway:**
```bash
railway variables set CRON_SECRET=your-generated-secret
```

---

## 📊 Monitoring Cron Jobs

### View Logs

1. **Railway Dashboard:**
   - Go to your service
   - Click "Deployments" tab
   - Click on latest deployment
   - View logs for cron job execution

2. **Railway CLI:**
   ```bash
   railway logs
   ```

### Expected Log Output

**Successful execution:**
```
🔧 [CRON] Starting automated image fix job...
📍 [CRON] Found 3 locations without images
  ✅ Vilnius: Fetched 1 image
  ✅ Tokyo: Fetched 1 image
  ✅ Paris: Fetched 1 image
✅ [CRON] Job complete: {success: 3, failed: 0}
```

**No work needed:**
```
✅ [CRON] No locations need region updates
```

---

## 🧪 Manual Testing

You can trigger cron jobs manually to test them:

```bash
# Test cleanup-cache
curl -X GET https://your-app.railway.app/api/cron/cleanup-cache \
  -H "Authorization: Bearer your-cron-secret"

# Test sync-weather
curl -X GET https://your-app.railway.app/api/cron/sync-weather \
  -H "Authorization: Bearer your-cron-secret"

# Test fix-missing-images
curl -X GET https://your-app.railway.app/api/cron/fix-missing-images \
  -H "Authorization: Bearer your-cron-secret"

# Test fix-missing-regions
curl -X GET https://your-app.railway.app/api/cron/fix-missing-regions \
  -H "Authorization: Bearer your-cron-secret"

# Test location-health-check
curl -X GET https://your-app.railway.app/api/cron/location-health-check \
  -H "Authorization: Bearer your-cron-secret"
```

---

## 📅 Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 2 * * *` - Every day at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * 0` - Every Sunday at midnight

---

## 🎯 Customizing Schedules

You can adjust the schedules based on your needs:

**More frequent weather updates:**
```
0 */3 * * *  # Every 3 hours instead of 6
```

**Less frequent image fixes:**
```
0 6 * * 0  # Only on Sundays at 6 AM
```

**Hourly cache cleanup:**
```
0 * * * *  # Every hour
```

---

## 🐛 Troubleshooting

### Cron Job Not Running

1. **Check Railway logs:**
   ```bash
   railway logs --filter cron
   ```

2. **Verify CRON_SECRET is set:**
   ```bash
   railway variables
   ```

3. **Test endpoint manually:**
   ```bash
   curl -X GET https://your-app.railway.app/api/cron/sync-weather \
     -H "Authorization: Bearer $CRON_SECRET" -v
   ```

### 401 Unauthorized Error

- **Cause:** CRON_SECRET mismatch
- **Fix:** Regenerate and update the secret:
  ```bash
  railway variables set CRON_SECRET=$(openssl rand -base64 32)
  ```

### 500 Internal Server Error

- **Cause:** API endpoint error
- **Fix:** Check Railway logs for detailed error message
  ```bash
  railway logs
  ```

---

## 💡 Best Practices

1. ✅ **Monitor logs weekly** - Check for errors or failures
2. ✅ **Adjust schedules** - Based on your traffic patterns
3. ✅ **Test before deploying** - Use manual triggers to verify
4. ✅ **Keep secrets secure** - Never commit CRON_SECRET to git
5. ✅ **Review performance** - Ensure cron jobs don't slow down your app

---

## 📈 Expected Impact

With cron jobs enabled, you'll see:

- ✅ **Better image coverage** - Locations always have images
- ✅ **Fresh weather data** - Updated every 6 hours
- ✅ **Cleaner database** - Expired cache removed automatically
- ✅ **Higher quality data** - Placeholder images replaced
- ✅ **Better SEO** - Complete location data for Google

---

## 🚀 Next Steps

1. Generate CRON_SECRET and add to Railway
2. Enable all 5 cron jobs in Railway dashboard
3. Monitor logs for first 24 hours
4. Adjust schedules if needed
5. Enjoy automated maintenance! 🎉

