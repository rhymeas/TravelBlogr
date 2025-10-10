# 🚀 TravelBlogr Deployment Checklist

## Before Pushing to Railway

Use this checklist to catch deployment issues **locally** before they hit Railway.

### ✅ Pre-Commit Checks (Automated)

These run automatically when you commit (via Husky):

- [ ] TypeScript type check passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)

### ✅ Pre-Push Checks (Manual - Run These!)

**Before pushing to GitHub/Railway, run these commands:**

```bash
# Navigate to web app
cd apps/web

# 1. Full production build test
npm run build

# 2. Check for any warnings
npm run build 2>&1 | grep -i "warning"

# 3. Verify environment variables are set
cat .env.local | grep -E "SUPABASE|NEXT_PUBLIC"
```

### ✅ Code Quality Checklist

**API Routes:**
- [ ] All Supabase clients initialized **inside** route handlers (not at module level)
- [ ] All routes have `export const dynamic = 'force-dynamic'` if they use database/auth
- [ ] All routes have `export const runtime = 'nodejs'` for server-only code

**Client Components:**
- [ ] No `document`/`window` access outside `useEffect` or `typeof window !== 'undefined'` checks
- [ ] All client components have `'use client'` directive at the top
- [ ] Dynamic imports use `{ ssr: false }` for browser-only components

**TypeScript:**
- [ ] All new dependencies have `@types/*` packages installed
- [ ] No `any` types (use proper types or `unknown`)
- [ ] All imports resolve correctly

**Environment Variables:**
- [ ] All required env vars are set in Railway dashboard
- [ ] `.env.local` matches production environment (for local testing)
- [ ] No secrets committed to git

### ✅ Railway-Specific Checks

**Before deploying:**
- [ ] Railway environment variables are up to date
- [ ] `nixpacks.toml` includes all system dependencies (Chromium, fonts, etc.)
- [ ] `Dockerfile` is up to date (if using Docker instead of Nixpacks)
- [ ] Build command is correct: `cd apps/web && npm run build`
- [ ] Start command is correct: `cd apps/web && npm start`

### ✅ Post-Deployment Checks

**After Railway deployment succeeds:**
- [ ] Check Railway logs for errors: `railway logs`
- [ ] Test Railway URL: `https://[your-app].up.railway.app`
- [ ] Test API routes: `/api/featured`, `/api/locations/search`
- [ ] Test admin routes (if applicable): `/admin/*`
- [ ] Verify custom domain works: `www.travelblogr.com`
- [ ] Check Supabase connection works
- [ ] Test image uploads and storage

---

## 🎯 Quick Commands Reference

### Local Development

```bash
# Start dev server
npm run dev

# Type check (real-time)
npx tsc --watch --noEmit

# Full production build test
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Test build with Railway environment
railway run npm run build

# View logs
railway logs

# Deploy manually
railway up
```

### Git Workflow

```bash
# Check what will be committed
git status

# Add files
git add .

# Commit (triggers pre-commit hooks)
git commit -m "feat: your feature"

# Push (triggers Railway deployment)
git push origin feature/your-branch
```

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module" errors

**Solution:**
```bash
cd apps/web
npm install
npm run build
```

### Issue: "supabaseUrl is required"

**Solution:** Check that Supabase client is initialized **inside** route handler:
```typescript
// ❌ Wrong
const supabase = createClient(...)
export async function POST() { ... }

// ✅ Correct
export async function POST() {
  const supabase = createServerSupabase()
  ...
}
```

### Issue: "document is not defined"

**Solution:** Use client component or check for browser:
```typescript
// Option 1: Client component
'use client'

// Option 2: Browser check
if (typeof document !== 'undefined') {
  document.body.style.overflow = 'hidden'
}

// Option 3: Dynamic import
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### Issue: TypeScript errors in production but not locally

**Solution:** Run production build locally:
```bash
npm run build
```

This catches all issues that Railway will encounter.

---

## 📊 Deployment Success Metrics

**Healthy Deployment:**
- ✅ Build completes in < 5 minutes
- ✅ No TypeScript errors
- ✅ No critical warnings
- ✅ Server starts successfully
- ✅ Health check passes
- ✅ All API routes respond

**Unhealthy Deployment:**
- ❌ Build timeout (> 10 minutes)
- ❌ TypeScript compilation errors
- ❌ Missing environment variables
- ❌ Server crashes on startup
- ❌ 502/503 errors on routes

---

## 🎓 Best Practices

1. **Always run `npm run build` locally before pushing**
2. **Use pre-commit hooks** (already set up!)
3. **Test with production environment variables** (`.env.local`)
4. **Monitor Railway logs** after deployment
5. **Keep dependencies up to date** (`npm outdated`)
6. **Document new environment variables** in this checklist
7. **Test API routes** with tools like Postman/Insomnia
8. **Use TypeScript strict mode** (already enabled)

---

## 🚨 Emergency Rollback

If deployment fails and you need to rollback:

```bash
# Via Railway Dashboard
1. Go to Deployments tab
2. Find last working deployment
3. Click "Redeploy"

# Via Git
git revert HEAD
git push origin feature/your-branch
```

---

## 📝 Notes

- Pre-commit hooks run automatically on `git commit`
- They check TypeScript types and linting
- If checks fail, commit is blocked
- Fix issues and try committing again
- To skip hooks (emergency only): `git commit --no-verify`

**Remember:** 30 seconds of local checks saves hours of Railway build cycles! 🚀

