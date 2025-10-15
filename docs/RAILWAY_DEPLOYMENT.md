# Railway Deployment Guide - TravelBlogr

## Overview
TravelBlogr is deployed on **Railway** (not Vercel). This guide covers deployment, environment variables, and troubleshooting.

---

## 🚂 Quick Deploy

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected
- Supabase project set up

### 1. Connect GitHub Repository

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `rhymeas/TravelBlogr`
5. Railway auto-detects Next.js and configures build

### 2. Configure Environment Variables

In Railway Dashboard → Your Project → Variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI (Required for trip planner)
GROQ_API_KEY=your_groq_api_key_here

# Image APIs (Optional but recommended)
PEXELS_API_KEY=your_pexels_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here

# Location Data (Optional)
GEONAMES_USERNAME=travelblogr

# Environment
NODE_ENV=production
```

### 3. Deploy

Railway automatically deploys on every push to `main` branch.

**Manual Deploy:**
```bash
git push origin main
```

Railway will:
1. Build Next.js app
2. Run migrations (if any)
3. Deploy to production
4. Generate public URL

---

## 🔧 Build Configuration

Railway auto-detects these from `package.json`:

```json
{
  "scripts": {
    "build": "next build apps/web",
    "start": "next start apps/web",
    "dev": "next dev apps/web"
  }
}
```

**Build Settings in Railway:**
- **Root Directory:** Leave blank (auto-detected)
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Install Command:** `npm install`

---

## 🌐 Custom Domain Setup

### 1. Generate Railway Domain

Railway → Settings → Networking → Generate Domain

You'll get: `travelblogr-production.up.railway.app`

### 2. Add Custom Domain

Railway → Settings → Networking → Custom Domain

Add: `travelblogr.com`

### 3. Configure DNS (GoDaddy)

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: @
Value: travelblogr-production.up.railway.app
TTL: 1 Hour
```

**Option B: A Record**
```
Type: A
Name: @
Value: [Railway IP from dashboard]
TTL: 1 Hour
```

**WWW Subdomain:**
```
Type: CNAME
Name: www
Value: travelblogr-production.up.railway.app
TTL: 1 Hour
```

### 4. Wait for DNS Propagation

- **Time:** 5-30 minutes (usually)
- **Check:** `nslookup travelblogr.com`

---

## 🔐 Environment Variables Guide

### Critical Variables (App Won't Work Without These)

#### `NEXT_PUBLIC_SUPABASE_URL`
- **What:** Your Supabase project URL
- **Where:** Supabase Dashboard → Settings → API
- **Example:** `https://nchhcxokrzabbkvhzsor.supabase.co`
- **Note:** Must start with `NEXT_PUBLIC_` to be available in browser

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **What:** Public anonymous key for client-side queries
- **Where:** Supabase Dashboard → Settings → API
- **Example:** `eyJhbGciOiJIUzI1NiIs...`
- **Note:** Safe to expose in browser (has RLS protection)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **What:** Admin key for server-side operations
- **Where:** Supabase Dashboard → Settings → API
- **Example:** `eyJhbGciOiJIUzI1NiIs...`
- **⚠️ CRITICAL:** Never expose in browser! Server-side only!

### Optional Variables

#### `GROQ_API_KEY`
- **What:** AI API for trip itinerary generation
- **Where:** https://console.groq.com
- **Required for:** `/plan` trip planner
- **Free tier:** 30 requests/minute

#### `PEXELS_API_KEY`
- **What:** Free stock photos for locations
- **Where:** https://www.pexels.com/api/
- **Fallback:** Uses Unsplash if not set

#### `UNSPLASH_ACCESS_KEY`
- **What:** Free stock photos for locations
- **Where:** https://unsplash.com/developers
- **Fallback:** Uses placeholder images if not set

---

## 🚀 Deployment Workflow

### Automatic Deployment (Recommended)

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Shows logs in dashboard
```

### Manual Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

## 📊 Monitoring & Logs

### View Logs

Railway Dashboard → Your Project → Deployments → View Logs

**Common log patterns:**
```
✓ Ready in XXXms          # App started successfully
⨯ Error: ...              # Build/runtime error
⚠ Warning: ...            # Non-critical issues
```

### Health Check

Railway automatically monitors:
- **HTTP Status:** Checks if app responds
- **Build Status:** Tracks build success/failure
- **Resource Usage:** CPU, Memory, Network

---

## 🐛 Troubleshooting

### Issue: "Application Error"

**Cause:** Missing environment variables or build failure

**Fix:**
1. Check Railway logs for errors
2. Verify all required env vars are set
3. Check `NEXT_PUBLIC_*` vars are set correctly
4. Trigger rebuild: Settings → Redeploy

### Issue: "502 Bad Gateway"

**Cause:** App crashed or not responding

**Fix:**
1. Check logs for crash errors
2. Verify `npm start` works locally
3. Check port configuration (Railway auto-assigns)
4. Restart deployment

### Issue: "Build Failed"

**Cause:** TypeScript errors, missing dependencies

**Fix:**
1. Run `npm run build` locally first
2. Fix TypeScript errors
3. Check `package.json` dependencies
4. Push fix to GitHub

### Issue: "Environment Variables Not Working"

**Cause:** `NEXT_PUBLIC_*` vars require rebuild

**Fix:**
1. Add/change env vars in Railway
2. Trigger rebuild (not just restart!)
3. Wait for new deployment
4. Test again

---

## 🔄 Rollback Procedure

### Quick Rollback

Railway Dashboard → Deployments → Previous Deployment → "⋮" → Redeploy

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## 📈 Performance Optimization

### Build Time

- **Current:** ~2-3 minutes
- **Optimize:** Use Railway's build cache
- **Tip:** Minimize dependencies

### Response Time

- **Target:** < 500ms for most pages
- **Monitor:** Railway metrics dashboard
- **Optimize:** 
  - Enable Next.js caching
  - Use ISR for static pages
  - Optimize images with Next/Image

### Resource Usage

- **Memory:** ~512MB typical
- **CPU:** Minimal (serverless)
- **Scaling:** Railway auto-scales

---

## 🎯 Best Practices

### 1. Environment Variables

✅ **DO:**
- Use `NEXT_PUBLIC_` for browser-accessible vars
- Keep secrets in Railway dashboard only
- Document all required vars

❌ **DON'T:**
- Commit `.env.local` to git
- Expose service role keys in browser
- Hardcode API keys in code

### 2. Deployment

✅ **DO:**
- Test locally before pushing
- Use feature branches for big changes
- Monitor logs after deployment

❌ **DON'T:**
- Push directly to main without testing
- Deploy during high traffic
- Ignore build warnings

### 3. Database

✅ **DO:**
- Run migrations before deploying
- Test migrations on staging first
- Backup before major changes

❌ **DON'T:**
- Run destructive migrations in production
- Skip migration testing
- Forget to update RLS policies

---

## 📞 Support

### Railway Support
- **Docs:** https://docs.railway.app
- **Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

### TravelBlogr Issues
- **GitHub:** https://github.com/rhymeas/TravelBlogr/issues
- **Docs:** `/docs` folder in repo

---

## ✅ Deployment Checklist

Before deploying:

- [ ] `npm run build` succeeds locally
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] All env vars documented
- [ ] Database migrations tested
- [ ] Critical features tested locally

After deploying:

- [ ] Railway shows "Deployed" status
- [ ] Public URL loads without errors
- [ ] No errors in browser console
- [ ] User auth works
- [ ] Critical features tested
- [ ] Monitor logs for 10-15 minutes

---

**Last Updated:** 2025-10-14
**Railway Project:** TravelBlogr Production
**Status:** ✅ Active

