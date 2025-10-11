# 🚀 Deployment Quick Reference

> **Quick commands and checklists for TravelBlogr deployment**

---

## 🔥 Emergency Commands

### Force Rebuild (After Env Var Changes)
```bash
git commit --allow-empty -m "Trigger rebuild for env vars"
git push
```

### Quick Rollback
```bash
# In Railway: Deployments → Previous → "⋮" → Redeploy
# OR via Git:
git revert HEAD
git push origin main
```

### Check Deployment Status
```bash
# Railway Dashboard → Deployments → View Logs
# Look for: "✓ Ready in XXXms"
```

---

## ✅ Pre-Deployment Checklist

```bash
# 1. Test locally
npm run build
npm start

# 2. Run checks
npm run type-check
npm run lint

# 3. Review changes
git diff
git status

# 4. Commit
git add <files>
git commit -m "feat: description"

# 5. Push
git push origin feature/branch-name
```

---

## 🔑 Required Environment Variables

### Copy to Railway Variables Tab:

```bash
# Supabase (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site Config
NEXT_PUBLIC_SITE_URL=https://www.travelblogr.com
NODE_ENV=production

# AI & APIs
GROQ_API_KEY=gsk_...
GEONAMES_USERNAME=travelblogr
PEXELS_API_KEY=...
UNSPLASH_ACCESS_KEY=...
```

---

## 🐛 Common Errors & Quick Fixes

### "Missing Supabase environment variables"
```bash
# 1. Check Railway → Variables tab
# 2. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
# 3. Trigger rebuild:
git commit --allow-empty -m "Rebuild"
git push
```

### "502 Bad Gateway"
```bash
# 1. Check Railway → Deploy Logs
# 2. Look for errors after "Ready in XXXms"
# 3. Verify Supabase connection
# 4. Check PORT is NOT set in env vars
```

### "Not Found - train has not arrived"
```bash
# 1. Railway → Settings → Networking
# 2. Click "Generate Domain"
# 3. Wait 1-2 minutes
```

### Build Fails
```bash
# 1. Run locally first:
npm run build

# 2. Fix TypeScript errors
# 3. Commit and push
```

---

## 🌐 DNS Configuration (GoDaddy)

### Root Domain (travelblogr.com)
```
Type: CNAME
Name: @
Value: travelblogr-production.up.railway.app
TTL: 600
```

### WWW Subdomain (www.travelblogr.com)
```
Type: CNAME
Name: www
Value: travelblogr-production.up.railway.app
TTL: 600
```

### Check DNS Propagation
```
https://dnschecker.org
```

---

## 📊 Post-Deployment Tests

### Immediate (First 5 min)
- [ ] Railway shows "Deployed" ✅
- [ ] `https://your-app-production.up.railway.app` loads
- [ ] No console errors
- [ ] Homepage renders

### Functionality (First hour)
- [ ] User registration works
- [ ] User login works
- [ ] Create trip works
- [ ] Add locations works
- [ ] Images load

### Performance
- [ ] Page load < 3s
- [ ] Images optimized
- [ ] Mobile responsive

---

## 🔄 Deployment Workflow

### Feature Development
```bash
# 1. Create branch
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...

# 3. Test locally
npm run dev
npm run build
npm start

# 4. Commit
git add .
git commit -m "feat: add new feature"

# 5. Push
git push origin feature/new-feature

# 6. Create PR → Review → Merge to main
```

### Hotfix
```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. Fix bug
# ... code ...

# 3. Test
npm run build

# 4. Commit and push
git add .
git commit -m "fix: critical bug"
git push origin hotfix/critical-bug

# 5. Merge to main immediately
```

---

## 🎯 Railway Dashboard Quick Links

### Monitor Deployment
```
Railway → Your Service → Deployments → Latest → View Logs
```

### Update Environment Variables
```
Railway → Your Service → Variables → RAW Editor
```

### Configure Domain
```
Railway → Your Service → Settings → Networking
```

### Redeploy
```
Railway → Your Service → Deployments → "⋮" → Redeploy
```

---

## 📞 Support Resources

- **Full Guide:** [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Railway Docs:** https://docs.railway.app
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs

---

## 🔐 Security Reminders

- ❌ Never commit `.env.local`
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ✅ Use `NEXT_PUBLIC_*` only for safe client-side vars
- ✅ Keep secrets in Railway Variables tab
- ✅ Use HTTPS for all production traffic

---

**Last Updated:** 2025-10-11  
**Platform:** Railway  
**Domain:** travelblogr.com

