# ⚡ TravelBlogr Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js 20+ installed
- Git installed
- Supabase account (free tier)
- Railway account (optional, for deployment)

---

## 📦 Initial Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/rhymeas/TravelBlogr.git
cd TravelBlogr

# Install dependencies
cd apps/web
npm install --legacy-peer-deps
```

### 2. Environment Variables

Create `.env.local` in `apps/web/`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Image APIs (Optional - for location images)
PEXELS_API_KEY=your_pexels_key
UNSPLASH_ACCESS_KEY=your_unsplash_key

# AI (Optional - for itinerary generation)
GROQ_API_KEY=your_groq_key
```

**Get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy URL and keys

### 3. Database Setup

Run the Supabase migrations (if available):

```bash
# Using Supabase CLI
supabase db push

# Or manually run SQL from /supabase/migrations/
```

**Required tables:**
- `profiles` - User profiles
- `locations` - Travel locations
- `trips` - User trips
- `trip_posts` - Trip blog posts
- `location_ratings` - User ratings
- `location_comments` - User comments

### 4. Start Development

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Type checker (recommended!)
npm run type-check:watch
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🎯 Development Workflow

### Daily Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Start type checker (in another terminal)
npm run type-check:watch

# 3. Code your feature

# 4. Before committing
npm run pre-deploy

# 5. Commit & push
git add .
git commit -m "feat: your feature"
git push
```

### Pre-Commit Hooks (Automatic)

When you commit, these checks run automatically:
- ✅ TypeScript type checking
- ✅ ESLint linting

If they fail, the commit is blocked. Fix the errors and try again!

---

## 🚀 Deployment to Railway

### 1. Install Railway CLI

```bash
npm i -g @railway/cli
railway login
```

### 2. Link to Project

```bash
railway link
# Select your TravelBlogr project
```

### 3. Set Environment Variables

In Railway dashboard:
1. Go to your project
2. Click "Variables"
3. Add all variables from `.env.local`

### 4. Deploy

```bash
# Option 1: Push to GitHub (auto-deploys)
git push origin main

# Option 2: Deploy directly
railway up
```

### 5. Monitor Deployment

```bash
# Watch logs in real-time
railway logs --follow
```

---

## 📁 Project Structure

```
TravelBlogr/
├── apps/
│   └── web/                    # Next.js 14 App
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Auth pages
│       │   ├── (dashboard)/    # Dashboard pages
│       │   ├── api/            # API routes
│       │   └── locations/      # Location pages
│       ├── components/         # React components
│       ├── lib/                # Utilities & services
│       │   ├── supabase/       # Supabase helpers
│       │   └── services/       # Business logic
│       ├── hooks/              # Custom React hooks
│       └── types/              # TypeScript types
├── .husky/                     # Git hooks
├── DEPLOYMENT_CHECKLIST.md     # Pre-deploy checklist
├── DEVELOPMENT_WORKFLOW.md     # Development guide
└── QUICK_START.md             # This file
```

---

## 🔧 Common Commands

### Development

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
npm run type-check:watch # Watch mode type checking
npm run pre-deploy       # Run all checks before deploy
```

### Railway

```bash
railway login            # Login to Railway
railway link             # Link to project
railway up               # Deploy
railway logs             # View logs
railway logs --follow    # Watch logs
railway run npm run build # Test build with Railway env
railway variables        # List environment variables
```

### Git

```bash
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit (runs pre-commit hooks)
git push                 # Push to remote
git checkout -b feature/name # Create feature branch
```

---

## 🎨 Key Features

### Authentication
- Email/password sign up
- OAuth (Google, GitHub)
- Session management
- Protected routes

### Trip Planning
- Create trips with itineraries
- Add locations to trips
- Upload trip photos
- Share trips publicly

### Location Discovery
- Search locations worldwide
- View location details
- Rate and comment on locations
- Community-driven content

### Live Feed
- Social media-style feed
- Recent trip posts
- Location updates
- Community activity

### Admin Panel
- Manage locations
- Update images
- Run crawlers
- View analytics

---

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
cd apps/web
rm -rf node_modules
npm install --legacy-peer-deps
```

### "Type errors" in development

```bash
# Check types
npm run type-check

# Watch for errors
npm run type-check:watch
```

### "Build fails on Railway"

```bash
# Test build locally
npm run build

# Test with Railway environment
railway run npm run build

# Check Railway logs
railway logs
```

### "Supabase connection fails"

1. Check `.env.local` has correct credentials
2. Verify Supabase project is active
3. Check network/firewall settings
4. Test connection in Supabase dashboard

### "Images not loading"

1. Check image API keys in `.env.local`
2. Verify Supabase Storage is configured
3. Check CORS settings in Supabase
4. Test image URLs directly

---

## 📚 Documentation

- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-deploy checks
- [Development Workflow](./DEVELOPMENT_WORKFLOW.md) - Detailed workflow guide
- [Rules](./rules.md) - Architecture & coding standards

---

## 🆘 Getting Help

### Common Issues

1. **Type errors** → Run `npm run type-check`
2. **Build fails** → Run `npm run pre-deploy`
3. **Railway fails** → Check `railway logs`
4. **Supabase errors** → Verify environment variables

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✅ Success Checklist

You're ready to develop when:
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] `.env.local` configured
- [ ] Supabase project set up
- [ ] Dev server runs (`npm run dev`)
- [ ] Type checker runs (`npm run type-check:watch`)
- [ ] Pre-commit hooks work (try a test commit)

You're ready to deploy when:
- [ ] `npm run pre-deploy` passes
- [ ] Railway project linked
- [ ] Environment variables set in Railway
- [ ] Test build succeeds locally
- [ ] All features tested locally

---

**Happy coding! 🚀**

Need help? Check the [Development Workflow](./DEVELOPMENT_WORKFLOW.md) guide!

