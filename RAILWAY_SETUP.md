# Railway Deployment - Quick Reference

## ✅ Current Setup (2025-10-11)

**Build Method:** Dockerfile (configured in `railway.json`)  
**Status:** Environment variables working correctly during build

## 🔧 Configuration Files

### `railway.json`
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `Dockerfile`
- Uses Docker ARG to accept Railway env vars during build
- Converts ARG to ENV for Next.js build process
- **DO NOT REMOVE** the ARG declarations - they're critical for Railway

## 📝 Required Environment Variables

Set these in Railway → Variables tab:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
GROQ_API_KEY=<your-key>
NODE_ENV=production

# Optional
NEXT_PUBLIC_SITE_URL=<your-domain>
GEONAMES_USERNAME=travelblogr
PEXELS_API_KEY=<your-key>
UNSPLASH_ACCESS_KEY=<your-key>
```

## 🚀 Deployment Process

1. **Push to GitHub** → Railway auto-deploys
2. **Monitor build** → Check for "✅ All required environment variables are set"
3. **Verify deployment** → Test app functionality

## ⚠️ Important Rules

1. **After changing `NEXT_PUBLIC_*` vars** → Trigger rebuild (push commit or redeploy)
2. **Never edit Dockerfile ARG section** → Breaks Railway env var injection
3. **Use Dockerfile builder** → Don't switch to Nixpacks (loses env var support)

## 🔍 Troubleshooting

**"Missing required environment variables" during build:**
- ✅ Fixed! Dockerfile has ARG declarations
- Check Railway Variables tab to ensure vars are set
- Trigger rebuild after adding vars

**Build succeeds but app crashes:**
- Check server-side env vars (GROQ_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Check Railway logs for runtime errors

## 📚 Full Documentation

- **Complete guide:** `docs/DEPLOYMENT.md`
- **Deployment scripts:** `scripts/auto-deploy-railway.sh`

