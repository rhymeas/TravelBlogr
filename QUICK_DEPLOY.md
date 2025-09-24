# ⚡ DEPLOY IN 5 MINUTES

## 1. Push to GitHub (30 seconds)
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

## 2. Deploy to Railway (2 minutes)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. "New Project" → "Deploy from GitHub repo" → Select your repo
3. "New" → "Database" → "PostgreSQL" (auto-connects)

## 3. Set Environment Variables (2 minutes)
In Railway dashboard → Variables tab:

**Required Variables:**
```
ADMIN_TOKEN=your-secure-random-token-here
NODE_ENV=production
```

**For Google Cloud Storage (optional - can add later):**
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
PUBLIC_OBJECT_SEARCH_PATHS=bucket-name/public
PRIVATE_OBJECT_DIR=bucket-name/private
```

## 4. Done! ✅
Your app will be live at: `https://your-app-name.up.railway.app`

## Quick Google Cloud Storage Setup (if needed)
1. [Google Cloud Console](https://console.cloud.google.com) → New Project
2. APIs & Services → Enable "Cloud Storage API"
3. Storage → Create Bucket (name: `your-app-storage`)
4. IAM → Service Accounts → Create → Role: "Storage Admin"
5. Create Key (JSON) → Copy entire JSON content
6. Paste JSON as `GOOGLE_SERVICE_ACCOUNT_KEY` in Railway

**Cost: $5/month total (Railway) + ~$0.50/month (Google Storage)**
