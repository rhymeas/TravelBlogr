# How to Gracefully Remove TravelBlogr from Vercel

## Why We're Leaving Vercel

Vercel is optimized for serverless/edge deployments, but TravelBlogr needs:
- ✅ Long-running processes (web scraping with Puppeteer/Crawlee)
- ✅ Flexible cron jobs (every 6-12 hours, not just daily)
- ✅ No execution timeouts
- ✅ Large deployment sizes (Puppeteer = 300MB)

Railway.app provides all of this at $5/month.

---

## Step-by-Step Removal Process

### 1. Verify Railway Deployment is Working

**Before removing from Vercel**, make sure Railway is fully operational:

- [ ] Railway app is deployed and accessible
- [ ] All environment variables are set
- [ ] Authentication works (Google OAuth)
- [ ] Database connections work (Supabase)
- [ ] Image uploads work (Supabase Storage)
- [ ] Cron jobs are configured

**Test URL**: https://your-app.railway.app

---

### 2. Update Supabase OAuth Redirect URLs

Go to Supabase Dashboard → Authentication → URL Configuration:

**Remove Vercel URLs:**
```
https://travel-blogr.vercel.app
https://travel-blogr-*.vercel.app
```

**Add Railway URLs:**
```
https://your-app.railway.app
https://travelblogr.up.railway.app (or your custom domain)
```

**Site URL**: Update to your Railway URL

---

### 3. Update Any External Services

If you have any external services pointing to Vercel URLs:

- [ ] Cron job services (cron-job.org, etc.)
- [ ] Webhooks
- [ ] API integrations
- [ ] Social media links

Update all to point to Railway URLs.

---

### 4. Delete Vercel Project

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/travel-blogr/travel-blogr
2. Click "Settings" tab
3. Scroll to bottom → "Delete Project"
4. Type project name to confirm: `travel-blogr`
5. Click "Delete"

**Option B: Via Vercel CLI**

```bash
npx vercel remove travel-blogr --yes
```

---

### 5. Clean Up Local Vercel Files

```bash
# Remove Vercel configuration
rm -rf .vercel/

# Remove vercel.json (Railway doesn't need it)
rm vercel.json

# Commit the cleanup
git add -A
git commit -m "Remove Vercel configuration, migrated to Railway.app"
git push origin feature/modern-modal-redesign
```

---

### 6. Unlink Vercel CLI (Optional)

If you don't plan to use Vercel for other projects:

```bash
npx vercel logout
```

---

## Rollback Plan (Just in Case)

If something goes wrong with Railway:

1. **Keep Vercel project for 24-48 hours** before deleting
2. Vercel deployments are immutable - old ones stay accessible
3. Can redeploy to Vercel anytime from GitHub

---

## Cost Comparison

| Platform | Cost | What You Get |
|----------|------|--------------|
| **Vercel Hobby** | Free | ❌ Can't run Puppeteer, daily cron only |
| **Vercel Pro** | $20/month | ❌ Still serverless limitations |
| **Railway Starter** | $5/month | ✅ Everything works, 500 hours/month |
| **Railway Pro** | $20/month | ✅ Unlimited hours, priority support |

**Recommendation**: Start with Railway Starter ($5/month)

---

## Timeline

- **Now**: Deploy to Railway, test thoroughly
- **24 hours**: Monitor Railway deployment
- **48 hours**: If stable, remove from Vercel
- **1 week**: Delete Vercel project permanently

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

