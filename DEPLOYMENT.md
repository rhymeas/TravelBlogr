# 🚀 Railway Deployment Guide

## Quick Start (5 minutes to production!)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect Node.js and start building

### Step 3: Add Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway automatically connects it to your app

### Step 4: Set Environment Variables
In Railway dashboard → Variables tab, add:

```
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
PUBLIC_OBJECT_SEARCH_PATHS=your-bucket/public
PRIVATE_OBJECT_DIR=your-bucket/private
ADMIN_TOKEN=your-secure-random-token
NODE_ENV=production
```

### Step 5: Run Database Migration
In Railway dashboard → Settings → Deploy Logs, wait for build to complete, then:
1. Go to your app URL
2. The app will automatically initialize the database on first run

## Google Cloud Storage Setup

### Quick Setup (2 minutes):
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Cloud Storage API
4. Create a storage bucket:
   - Name: `your-app-name-storage`
   - Location: `us-central1` (cheapest)
   - Access control: Fine-grained
5. Create service account:
   - IAM & Admin → Service Accounts → Create
   - Role: Storage Admin
   - Create key (JSON format)
6. Copy the entire JSON content for `GOOGLE_SERVICE_ACCOUNT_KEY`

### Environment Variables for Railway:
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
PUBLIC_OBJECT_SEARCH_PATHS=your-bucket-name/public
PRIVATE_OBJECT_DIR=your-bucket-name/private
ADMIN_TOKEN=generate-a-secure-random-string
```

## Cost Breakdown
- **Railway**: $5/month (includes app hosting + PostgreSQL)
- **Google Cloud Storage**: ~$0.50/month (for typical usage)
- **Total**: ~$5.50/month

## Post-Deployment Checklist
- [ ] App loads at Railway URL
- [ ] Database connection works
- [ ] Image uploads work
- [ ] Admin panel accessible
- [ ] All API endpoints respond

## Troubleshooting
- **Build fails**: Check build logs in Railway dashboard
- **Database connection error**: Ensure PostgreSQL service is running
- **Image upload fails**: Verify Google Cloud Storage credentials
- **404 errors**: Check if build completed successfully

## Custom Domain (Optional)
1. Railway dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. SSL certificate is automatic

Your app will be live at: `https://your-app-name.up.railway.app`
