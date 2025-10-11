# 🚀 TravelBlogr Deployment Guide

> **Last Updated:** 2025-10-11  
> **Status:** ✅ Production Ready (Railway)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Railway Deployment](#railway-deployment)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Troubleshooting](#troubleshooting)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Accounts
- ✅ **Supabase** - Database & Auth (https://supabase.com)
- ✅ **Railway** - Hosting platform (https://railway.app)
- ✅ **GitHub** - Code repository (https://github.com)
- ✅ **Domain Registrar** - GoDaddy, Namecheap, etc. (optional)

### Required API Keys
- ✅ **Supabase URL & Keys** - From Supabase Dashboard
- ✅ **Groq API Key** - Free tier (https://console.groq.com)
- ✅ **Pexels API Key** - Free (https://www.pexels.com/api/)
- ✅ **Unsplash Access Key** - Free (https://unsplash.com/developers)
- ✅ **GeoNames Username** - Free (https://www.geonames.org)

---

## Environment Variables

### Critical Variables (REQUIRED)

These **MUST** be set in Railway for the app to work:

```bash
# Supabase Configuration (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.travelblogr.com
NODE_ENV=production

# AI Services
GROQ_API_KEY=gsk_...

# Location Data
GEONAMES_USERNAME=your_username

# Image Services
PEXELS_API_KEY=...
UNSPLASH_ACCESS_KEY=...
```

### ⚠️ Important Notes

1. **`NEXT_PUBLIC_*` variables are baked into the build** - Changing them requires a rebuild
2. **Never commit `.env.local` to git** - It's in `.gitignore` for security
3. **Service role key is SECRET** - Only use server-side, never expose to client
4. **Dockerfile handles env vars automatically** - Railway env vars are passed as ARG during build

---

## Railway Deployment

### Step 1: Initial Setup

1. **Connect GitHub Repository**
   ```
   Railway Dashboard → New Project → Deploy from GitHub
   → Select: rhymeas/TravelBlogr
   → Select branch: main (or feature/modern-modal-redesign)
   ```

2. **Configure Build Settings**
   - **Builder**: Dockerfile (configured in `railway.json`)
   - **Root Directory**: Leave blank (auto-detected)
   - **Build Command**: Handled by Dockerfile
   - **Start Command**: `npm start` (configured in `railway.json`)
   - **Port**: `3000` (exposed in Dockerfile, Railway auto-detects)

### Step 2: Add Environment Variables

**Method 1: Raw Editor (Recommended)**

1. Go to your service → **"Variables"** tab
2. Click **"RAW Editor"** button
3. Paste all variables (format: `KEY=value`, one per line)
4. Click **"Update Variables"**

**Method 2: Individual Variables**

1. Click **"+ New Variable"**
2. Add each variable one by one
3. Click **"Add"** for each

### Step 3: Enable Public Domain

1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway creates: `your-app-production.up.railway.app`

### Step 4: Trigger Deployment

**Option A: Automatic (on git push)**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**Option B: Manual Redeploy**
1. Go to **"Deployments"** tab
2. Click **"⋮"** menu on latest deployment
3. Click **"Redeploy"**

### Step 5: Monitor Build

1. Click on the running deployment
2. Watch **"Build Logs"** tab
3. Wait for: `✓ Compiled successfully`
4. Check **"Deploy Logs"** tab
5. Look for: `✓ Ready in XXXms`

---

## Custom Domain Setup

### Step 1: Add Domain in Railway

1. Go to **"Settings"** → **"Networking"**
2. Under **"Custom Domains"**, click **"+ Custom Domain"**
3. Enter: `travelblogr.com`
4. Railway shows CNAME target: `your-app-production.up.railway.app`

### Step 2: Configure DNS (GoDaddy Example)

**For Root Domain (`travelblogr.com`):**

1. Go to GoDaddy → DNS Management
2. **Option A: CNAME Flattening (Recommended)**
   - Type: `CNAME`
   - Name: `@`
   - Value: `your-app-production.up.railway.app`
   - TTL: `600` (10 minutes)

3. **Option B: A Record (If CNAME not supported)**
   - Contact Railway support for static IP
   - Type: `A`
   - Name: `@`
   - Value: `Railway IP address`

**For WWW Subdomain (`www.travelblogr.com`):**

1. Add another custom domain in Railway: `www.travelblogr.com`
2. In GoDaddy:
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-app-production.up.railway.app`
   - TTL: `600`

### Step 3: Wait for DNS Propagation

- **Typical time**: 5-30 minutes
- **Max time**: 24-48 hours
- **Check status**: https://dnschecker.org

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Cause:** Environment variables not set or not rebuilt after adding them.

**Fix:**
1. Verify variables in Railway → Variables tab
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. Trigger a **rebuild** (not just restart):
   ```bash
   # Push a small change to trigger rebuild
   git commit --allow-empty -m "Trigger rebuild"
   git push
   ```

### Error: "502 Bad Gateway"

**Cause:** App crashed or not responding.

**Fix:**
1. Check **Deploy Logs** for errors
2. Look for: `Error:`, `ECONNREFUSED`, `Port already in use`
3. Verify `PORT` environment variable is NOT set (Railway auto-detects)
4. Check Supabase connection is working

### Error: "Not Found - The train has not arrived"

**Cause:** Public domain not generated.

**Fix:**
1. Go to Settings → Networking
2. Click **"Generate Domain"**
3. Wait 1-2 minutes for domain to provision

### Error: "Application error: a client-side exception"

**Cause:** Missing environment variables in client-side code.

**Fix:**
1. Check browser console for exact error
2. Verify all `NEXT_PUBLIC_*` variables are set
3. **Rebuild** the app (not just restart)

### Build Fails: "npm ERR! code ELIFECYCLE"

**Cause:** TypeScript errors or missing dependencies.

**Fix:**
1. Check build logs for specific error
2. Run locally: `npm run build`
3. Fix TypeScript errors
4. Commit and push

---

## Post-Deployment Checklist

### Immediate Checks (First 5 Minutes)

- [ ] Railway deployment shows **"Deployed"** with green checkmark
- [ ] Railway domain works: `https://your-app-production.up.railway.app`
- [ ] No errors in browser console
- [ ] Homepage loads correctly
- [ ] Can navigate to `/locations`, `/dashboard`

### Functionality Tests (First Hour)

- [ ] User registration works
- [ ] User login works
- [ ] Can create a trip
- [ ] Can add locations to trip
- [ ] Images load correctly
- [ ] Location search works
- [ ] Itinerary generator works (if enabled)

### Custom Domain Checks (First 24 Hours)

- [ ] Custom domain resolves: `https://www.travelblogr.com`
- [ ] SSL certificate is active (🔒 in browser)
- [ ] Both `travelblogr.com` and `www.travelblogr.com` work
- [ ] Redirects work correctly

### Performance Checks

- [ ] Page load time < 3 seconds
- [ ] Images optimized and loading fast
- [ ] No console errors or warnings
- [ ] Mobile responsive design works

### Security Checks

- [ ] HTTPS enforced (no HTTP access)
- [ ] Environment variables not exposed in client code
- [ ] Service role key not in browser
- [ ] CORS configured correctly
- [ ] Rate limiting works (if enabled)

---

## Deployment Best Practices

### 1. Always Test Locally First

```bash
# Build production version locally
npm run build

# Test production build
npm start

# Visit http://localhost:3000
```

### 2. Use Feature Branches

```bash
# Never push directly to main
git checkout -b feature/new-feature

# Test thoroughly
npm run build
npm test

# Merge via PR
git push origin feature/new-feature
```

### 3. Monitor After Deployment

- Check Railway logs for 10-15 minutes after deploy
- Watch for errors, warnings, or unusual behavior
- Test critical user flows immediately

### 4. Rollback Plan

If deployment fails:

1. **Quick rollback in Railway:**
   - Deployments tab → Previous deployment → "⋮" → "Redeploy"

2. **Git rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.travelblogr.com
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **DNS Checker**: https://dnschecker.org

---

**Last Deployed:** Check Railway dashboard  
**Current Version:** Check `package.json`  
**Deployment Platform:** Railway  
**Domain Registrar:** GoDaddy

