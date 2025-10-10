# Railway.app Deployment Guide for TravelBlogr

## 1. Create Project on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select: `rhymeas/TravelBlogr`
4. Railway will auto-detect Next.js

## 2. Configure Build Settings

Railway should auto-detect, but verify:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `apps/web` (if monorepo detection fails)

## 3. Add Environment Variables

Go to your project → Variables tab → Add all these:

```
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GROQ_API_KEY=<your-groq-key>
GEONAMES_USERNAME=travelblogr
PEXELS_API_KEY=<your-pexels-key>
UNSPLASH_ACCESS_KEY=<your-unsplash-key>
NODE_ENV=production
```

## 4. Deploy

Click "Deploy" - Railway will:
- Install all dependencies (including Puppeteer)
- Build your Next.js app
- Start the server
- Give you a public URL

## 5. Set up Cron Jobs

Railway doesn't have built-in cron, but you can:

**Option A: Use Railway's Cron plugin**
1. Add "Cron" service to your project
2. Configure schedules

**Option B: Use external cron service**
- Use cron-job.org (free)
- Point to your Railway URLs:
  - https://your-app.railway.app/api/cron/sync-weather
  - https://your-app.railway.app/api/cron/fix-missing-images
  - etc.

## 6. Custom Domain (Optional)

Settings → Domains → Add custom domain
- Point your DNS to Railway
- SSL certificate auto-generated

