# TravelBlogr Development Milestones

This document tracks major milestones, critical fixes, and architectural decisions that should never be forgotten or regressed.

---

## 🎯 Milestone 1: Brave API Image Pattern Fix (2025-01-27)

### **Critical Discovery**
Found and fixed a critical bug pattern across the entire codebase where Brave Search API image data was being consumed incorrectly.

### **The Problem**
Code was using `images[0].url` (source page URL) instead of `images[0].thumbnail` (actual Brave CDN image URL), causing images to fail loading.

**Example of broken URL:**
- ❌ `url`: `https://destinationlesstravel.com/lake-louise-gondola-vs-banff-gondola/` (webpage, not image)
- ✅ `thumbnail`: `https://imgs.search.brave.com/j3zEdaH-MTjI22pPal0vdlBTg2H9kn...` (actual image)

### **Impact**
- **V2 Trip Planner:** Hero images and day images broken
- **Test Pages:** Placeholder images instead of real images
- **Enrichment Scripts:** Storing broken URLs in database
- **Cron Jobs:** Continuously adding broken URLs

### **Files Fixed**
1. `apps/web/app/test/activities/page.tsx` (Line 123)
2. `apps/web/components/trip-planner-v2/ResultsView.tsx` (Line 1313)
3. `scripts/enrich-location-activities.ts` (Line 180)
4. `apps/web/app/api/cron/enrich-activities/route.ts` (Line 154)

### **The Rule (NEVER FORGET)**
```typescript
// ✅ ALWAYS use thumbnail first
const imageUrl = img.thumbnail || img.url

// ❌ NEVER use url first
const imageUrl = img.url || img.thumbnail  // WRONG!
```

### **Why This Matters**
- `thumbnail`: Brave CDN URL - 16:9 optimized, fast, reliable
- `url`: Source page URL - NOT an image, will fail

### **Documentation**
- **Full Audit:** `docs/BRAVE_API_IMAGE_AUDIT.md`
- **Test Page Improvements:** `docs/TEST_PAGE_IMPROVEMENTS.md`
- **Rules Updated:** `.augment/rules/imported/rules.md` (Lines 95-158)

### **Prevention Strategy**
- ✅ Added to codebase rules
- ✅ Code review checklist item
- ✅ Comprehensive documentation
- ✅ All existing code audited and fixed
- ⚠️ Future: Add ESLint rule to detect this pattern

---

## 🔐 Milestone 2: Real Supabase Authentication (2024-10-10)

### **Critical Decision**
Switched from mock authentication to real Supabase auth with proper client/server separation.

### **The Pattern**
```typescript
// ✅ Client-side (React components)
import { getBrowserSupabase } from '@/lib/supabase'
const supabase = getBrowserSupabase()

// ✅ Server-side (API routes)
import { createServerSupabase } from '@/lib/supabase'
const supabase = createServerSupabase()

// ❌ NEVER use createClientSupabase() directly
// ❌ NEVER create mock Supabase clients
```

### **The Rule (NEVER FORGET)**
- ALWAYS use real Supabase authentication
- NEVER mock authentication
- Use `getBrowserSupabase()` in client components
- Use `createServerSupabase()` in API routes

### **Documentation**
- **OAuth Setup:** `docs/OAUTH_SETUP.md`
- **OAuth Troubleshooting:** `docs/OAUTH_TROUBLESHOOTING.md`
- **Rules:** `.augment/rules/imported/rules.md`

---

## ⚡ Milestone 3: Upstash Redis Caching (Date TBD)

### **Critical Pattern**
ALWAYS invalidate Upstash cache FIRST, then Next.js cache.

### **The Rule (NEVER FORGET)**
```typescript
// ✅ CORRECT: Invalidate in order
await deleteCached(CacheKeys.location(slug))  // 1. Upstash FIRST
revalidatePath(`/locations/${slug}`)          // 2. Next.js SECOND

// ❌ WRONG: Only revalidating Next.js
revalidatePath(`/locations/${slug}`)  // Upstash cache still stale!
```

### **Why This Matters**
- Upstash is the data source cache
- Next.js is the page cache
- Must clear data source first, then page cache
- Otherwise: stale data persists

### **Documentation**
- **Rules:** `.augment/rules/imported/rules.md`

---

## 📊 Milestone 4: Cached Counts Pattern (Date TBD)

### **Critical Decision**
Use cached count columns instead of real-time COUNT(*) queries.

### **The Pattern**
```sql
-- ✅ Add cached count columns
ALTER TABLE trips ADD COLUMN like_count INTEGER DEFAULT 0;

-- ✅ Create triggers to maintain counts
CREATE TRIGGER trip_likes_count_trigger
  AFTER INSERT OR DELETE ON trip_likes
  FOR EACH ROW EXECUTE FUNCTION update_trip_like_count();
```

### **The Rule (NEVER FORGET)**
- NEVER query counts in real-time with COUNT(*)
- ALWAYS use cached columns with triggers
- Use GREATEST(count - 1, 0) to prevent negative counts

### **Why This Matters**
- 1,000 users viewing trip = 1,000 COUNT(*) queries (slow)
- 1,000 users viewing trip = 0 queries with cached counts (fast)
- 100-1000x performance improvement

### **Documentation**
- **Rules:** `.augment/rules/imported/rules.md`

---

## 🚀 Milestone 5: Railway Deployment Pattern (Date TBD)

### **Critical Knowledge**
`NEXT_PUBLIC_*` variables are baked into build at BUILD TIME, not runtime.

### **The Rule (NEVER FORGET)**
```bash
# ❌ Changing these requires REBUILD, not just restart
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ✅ These can be changed at runtime
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

### **Deployment Workflow**
1. Test locally: `npm run build && npm start`
2. Use feature branches (never push to main)
3. After changing `NEXT_PUBLIC_*`: Trigger rebuild
4. Monitor deployment for 10-15 minutes

### **Documentation**
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Rules:** `.augment/rules/imported/rules.md`

---

## 📝 How to Add a Milestone

When you discover a critical pattern, bug, or architectural decision:

1. **Document it here** with:
   - Date discovered
   - Problem description
   - Solution/pattern
   - Why it matters
   - Files affected
   - Prevention strategy

2. **Add to rules** (`.augment/rules/imported/rules.md`)

3. **Create detailed docs** in `docs/` folder

4. **Add code comments** at critical locations:
   ```typescript
   // CRITICAL: Use thumbnail first (Brave CDN URL) - See MILESTONES.md
   const imageUrl = img.thumbnail || img.url
   ```

5. **Update this file** with the milestone

---

## 🎯 Milestone Template

```markdown
## 🎯 Milestone X: [Title] ([Date])

### **Critical Discovery/Decision**
[What was discovered or decided]

### **The Problem**
[What was wrong or why this matters]

### **Impact**
[What was affected]

### **The Rule (NEVER FORGET)**
```typescript
// ✅ CORRECT pattern
// ❌ WRONG pattern
```

### **Why This Matters**
[Long-term implications]

### **Documentation**
- **File 1:** `path/to/doc.md`
- **File 2:** `path/to/doc.md`

### **Prevention Strategy**
- [ ] Added to rules
- [ ] Code review checklist
- [ ] Documentation created
- [ ] Existing code audited
```

---

## 🔍 Quick Reference

### Critical Patterns to NEVER Forget

1. **Brave Images:** `img.thumbnail || img.url` (NEVER `img.url` first)
2. **Supabase Auth:** Real auth only, no mocks
3. **Cache Invalidation:** Upstash FIRST, then Next.js
4. **Cached Counts:** Use columns + triggers, not COUNT(*)
5. **Deployment:** `NEXT_PUBLIC_*` = rebuild required

### When in Doubt

1. Check this file (MILESTONES.md)
2. Check rules (.augment/rules/imported/rules.md)
3. Check docs/ folder
4. Search codebase for similar patterns
5. Ask before changing critical patterns

---

## 📊 Statistics

- **Total Milestones:** 5
- **Critical Bugs Fixed:** 4 (Brave API)
- **Files Audited:** 15 (Brave API)
- **Documentation Created:** 10+ files
- **Rules Added:** 5+ sections

---

**Remember:** These milestones represent hard-won knowledge. Don't let them be forgotten or regressed! 🎯

