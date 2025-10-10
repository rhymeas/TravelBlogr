# 🎯 TravelBlogr Development Workflow

## The "Vibe Coding But Safe" Workflow

This workflow lets you code freely while catching deployment issues **locally** in seconds instead of hours on Railway.

---

## 🚀 Daily Development Setup

### Terminal Setup (Recommended)

Open **3 terminals** for optimal development:

#### **Terminal 1: Dev Server**
```bash
cd apps/web
npm run dev
```
- Hot reload on file changes
- Runs on `http://localhost:3000`
- Lenient error handling (good for rapid iteration)

#### **Terminal 2: Type Checker (Real-Time)**
```bash
cd apps/web
npm run type-check:watch
```
- **Catches type errors as you code**
- Updates every time you save a file
- Shows errors in < 1 second
- **This is your safety net!** 🛡️

#### **Terminal 3: Commands**
```bash
# Use this for git, npm install, etc.
```

---

## 📝 Coding Workflow

### 1. **Start Your Feature**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Start dev server + type checker
npm run dev                    # Terminal 1
npm run type-check:watch       # Terminal 2
```

### 2. **Code Freely (Vibe Mode)** 🎨

- Write code in your editor
- Dev server auto-reloads
- Type checker shows errors in real-time
- Fix type errors as they appear (or ignore temporarily)

**Pro Tip:** Keep an eye on Terminal 2 - if you see red errors, fix them before moving on!

### 3. **Before Committing (30-Second Check)** ✅

```bash
# Run the pre-deploy script (checks everything)
npm run pre-deploy
```

This runs:
1. ✅ Type check
2. ✅ Linting
3. ✅ Production build

**If this passes, Railway will succeed!** 🎉

### 4. **Commit & Push**

```bash
git add .
git commit -m "feat: your feature description"
# ⚡ Pre-commit hooks run automatically (type-check + lint)

git push origin feature/your-feature-name
# 🚀 Railway deployment starts
```

---

## 🎯 Quick Reference Commands

### Development

```bash
# Start dev server
npm run dev

# Type check (one-time)
npm run type-check

# Type check (watch mode - recommended!)
npm run type-check:watch

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

### Pre-Deployment

```bash
# Run ALL checks (type-check + lint + build)
npm run pre-deploy

# If this passes, you're good to push! ✅
```

### Production Build Testing

```bash
# Test production build locally
npm run build

# Start production server locally
npm run start
```

---

## 🔧 Common Scenarios

### Scenario 1: "I want to code fast without interruptions"

**Solution:**
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Type checker (watch mode)
npm run type-check:watch

# Code freely, glance at Terminal 2 occasionally
# Fix type errors when convenient
# Before committing: npm run pre-deploy
```

### Scenario 2: "I'm about to push to Railway"

**Solution:**
```bash
# Run the full pre-deploy check
npm run pre-deploy

# If it passes:
git add .
git commit -m "feat: your feature"
git push

# If it fails:
# Fix the errors shown
# Run npm run pre-deploy again
# Repeat until it passes
```

### Scenario 3: "I added a new npm package"

**Solution:**
```bash
# Install the package
npm install package-name

# If it's a JavaScript library, install types
npm install --save-dev @types/package-name

# Check if types are available
npm search @types/package-name

# Test the build
npm run build
```

### Scenario 4: "I'm getting weird TypeScript errors"

**Solution:**
```bash
# Clean build cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Run type check
npm run type-check

# If still failing, check:
# 1. Is the import path correct?
# 2. Do you have @types/* installed?
# 3. Is tsconfig.json correct?
```

### Scenario 5: "Pre-commit hooks are blocking my commit"

**Solution:**
```bash
# See what's failing
git commit -m "your message"
# Read the error output

# Fix the errors
npm run type-check  # See type errors
npm run lint        # See lint errors

# Try committing again
git commit -m "your message"

# Emergency bypass (use sparingly!)
git commit --no-verify -m "your message"
```

---

## 🎨 Best Practices

### ✅ DO:

1. **Run `npm run type-check:watch` while coding**
   - Catches errors in real-time
   - Saves hours of debugging

2. **Run `npm run pre-deploy` before pushing**
   - Simulates Railway build
   - Catches 95% of deployment issues

3. **Keep Terminal 2 visible**
   - Glance at it occasionally
   - Fix type errors as they appear

4. **Use `.env.local` for local development**
   - Matches production environment
   - Prevents "works locally, fails in production"

5. **Test production builds locally**
   - Run `npm run build` before pushing
   - Catches build-time issues

### ❌ DON'T:

1. **Don't skip `npm run pre-deploy`**
   - 30 seconds now saves hours later

2. **Don't ignore type errors**
   - They'll fail on Railway
   - Fix them early

3. **Don't use `--no-verify` habitually**
   - Pre-commit hooks are there to help
   - Only bypass in emergencies

4. **Don't commit without testing**
   - At minimum: `npm run type-check`
   - Ideally: `npm run pre-deploy`

5. **Don't push directly to main**
   - Use feature branches
   - Test before merging

---

## 🚨 Troubleshooting

### "Type check is slow"

**Solution:**
```bash
# Use incremental compilation
npm run type-check:watch

# Or check specific files
npx tsc --noEmit path/to/file.ts
```

### "Pre-commit hooks take too long"

**Solution:**
```bash
# Edit .husky/pre-commit
# Remove the build step if it's too slow
# Keep type-check and lint
```

### "I need to commit broken code temporarily"

**Solution:**
```bash
# Use WIP commits on feature branch
git commit --no-verify -m "WIP: work in progress"

# Fix before merging to main
npm run pre-deploy
git commit -m "fix: resolve type errors"
```

### "Railway build fails but local build works"

**Possible causes:**
1. Environment variables missing in Railway
2. Different Node version
3. Missing system dependencies (Chromium, fonts)
4. Build timeout (increase in Railway settings)

**Solution:**
```bash
# Test with Railway CLI
railway run npm run build

# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

---

## 📊 Workflow Comparison

### ❌ Old Workflow (Painful)
```
Code → Commit → Push → Railway fails → Debug → Fix → Push → Railway fails → ...
⏱️ Time: Hours per deployment
😫 Frustration: High
```

### ✅ New Workflow (Smooth)
```
Code → Type-check (watch) → Pre-deploy → Commit → Push → Railway succeeds ✅
⏱️ Time: 30 seconds of checks
😊 Frustration: Low
```

---

## 🎓 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Next.js 14
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### Railway
- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)

---

## 💡 Pro Tips

1. **Use VS Code TypeScript features**
   - Hover over variables to see types
   - Cmd+Click to jump to definitions
   - Use auto-import (Cmd+.)

2. **Set up keyboard shortcuts**
   - Run type-check: `Cmd+Shift+B`
   - Run build: Custom task

3. **Use Git aliases**
   ```bash
   git config alias.pd '!npm run pre-deploy && git push'
   # Now: git pd (runs pre-deploy + push)
   ```

4. **Monitor Railway deployments**
   - Install Railway CLI
   - Run `railway logs --follow` during deployment
   - See errors in real-time

5. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   npm run pre-deploy  # Test after updates
   ```

---

## 🎯 Success Metrics

**You're doing it right if:**
- ✅ Type checker runs in background while coding
- ✅ You run `npm run pre-deploy` before every push
- ✅ Railway deployments succeed on first try
- ✅ You catch errors locally, not on Railway
- ✅ Deployment time is < 5 minutes

**You need to adjust if:**
- ❌ Railway builds fail frequently
- ❌ You're debugging type errors on Railway
- ❌ You skip pre-deploy checks
- ❌ You use `--no-verify` often
- ❌ Deployments take > 10 minutes

---

**Remember: 30 seconds of local checks saves hours of Railway debugging!** 🚀✨

Happy coding! 🎨

