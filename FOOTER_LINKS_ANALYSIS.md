# Footer Links Analysis & Action Plan

## 📊 Current State

### ✅ Pages That EXIST

**Product:**
- ✅ Features (#features) - Anchor link on home page
- ✅ How it Works (#how-it-works) - Anchor link on home page
- ✅ Examples (/examples) - `apps/web/app/examples/page.tsx`
- ✅ Pricing (/pricing) - `apps/web/app/pricing/page.tsx`

**Support:**
- ❌ Help Center (/help) - MISSING
- ❌ Contact Us (/contact) - MISSING
- ❌ Status (/status) - MISSING
- ❌ API Docs (/docs) - MISSING

**Company:**
- ❌ About (/about) - MISSING
- ❌ Blog (/blog) - MISSING
- ❌ Careers (/careers) - MISSING
- ❌ Press (/press) - MISSING

**Legal:**
- ✅ Privacy (/privacy) - `apps/web/app/privacy/page.tsx`
- ✅ Terms (/terms) - `apps/web/app/terms/page.tsx`
- ✅ Cookie Policy (/cookies) - `apps/web/app/cookies/page.tsx`
- ✅ GDPR (/gdpr) - `apps/web/app/gdpr/page.tsx`

---

## 🎯 Recommended Actions

### Option 1: Remove Non-Essential Links (RECOMMENDED)
For an MVP/early-stage product, remove links that aren't critical:

**Keep:**
- Product: Features, How it Works, Examples, Pricing
- Support: Contact Us (create simple page)
- Legal: Privacy, Terms, Cookie Policy, GDPR

**Remove:**
- Support: Help Center, Status, API Docs (not needed yet)
- Company: About, Blog, Careers, Press (not needed yet)

### Option 2: Create Simple "Coming Soon" Pages
Create placeholder pages for all missing links.

### Option 3: Create Contact Modal Only
Keep all links but make non-existent ones open a "Contact Us" modal.

---

## 🚀 Implementation Plan (Option 1 - RECOMMENDED)

### 1. Create Contact Page
Simple contact form page at `/contact`

### 2. Update Footer Links
Remove unnecessary links, keep only:
- Product: Features, How it Works, Examples, Pricing
- Support: Contact Us
- Legal: Privacy, Terms, Cookie Policy, GDPR

### 3. Simplify Footer Structure
Reduce from 4 columns to 3 columns for cleaner look.

---

## 📝 Missing Pages Summary

**Critical (Should Create):**
- `/contact` - Contact form page

**Not Critical (Can Remove):**
- `/help` - Help Center (can add later when we have docs)
- `/status` - System status (not needed for MVP)
- `/docs` - API docs (not needed unless we have public API)
- `/about` - About page (nice to have, but not critical)
- `/blog` - Blog (can add later)
- `/careers` - Careers (not needed unless hiring)
- `/press` - Press kit (not needed for MVP)

---

## 🔧 Issue 1: Trips Library Dropdown

**Problem:** Dropdown might not show on deployed app

**Possible Causes:**
1. CSS hover states not working on mobile
2. Z-index issues with other elements
3. Deployment build issue

**Solution:**
- Add click handler as fallback for mobile
- Ensure proper z-index
- Test on deployed app

