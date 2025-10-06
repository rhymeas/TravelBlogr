# 🔧 Fix All Issues - Complete Guide

## ✅ What I Fixed

### 1. **Table Name Errors** ✅
- ❌ Was looking for: `location_restaurants`, `location_activities`
- ✅ Now using: `restaurants`, `activities`
- **Files Updated:**
  - `apps/web/lib/supabase/locationQueries.ts`

### 2. **Placeholder Images** ✅
- ❌ Was using: `.jpg` files (don't exist)
- ✅ Now using: `.svg` files (created)
- **Files Updated:**
  - `apps/web/lib/mappers/locationMapper.ts`
  - `apps/web/public/placeholder-*.svg` (created)

### 3. **Country Names** ⚠️ (Needs SQL Update)
- ❌ Some locations have: "Unknown", "España", "Italia", "Nederland"
- ✅ Should be: "Japan", "Spain", "Italy", "Netherlands"
- **Solution:** Run SQL script (see below)

---

## 🚀 Quick Fix Steps

### **Step 1: Run SQL to Fix Country Names**

Open Supabase SQL Editor:
```
https://supabase.com/dashboard/project/nchhcxokrzabbkvhzsor/sql/new
```

Copy and paste this SQL:
```sql
-- Fix country names
UPDATE locations SET country = 'Japan' WHERE name = 'Tokyo' AND country = 'Unknown';
UPDATE locations SET country = 'France' WHERE name = 'Paris' AND country = 'Unknown';
UPDATE locations SET country = 'United States' WHERE name = 'new york' AND country = 'Unknown';
UPDATE locations SET country = 'Spain' WHERE name = 'Barcelona';
UPDATE locations SET country = 'United Kingdom' WHERE name = 'London';
UPDATE locations SET country = 'Canada' WHERE name = 'vancouver';
UPDATE locations SET country = 'Italy' WHERE name = 'Rome';
UPDATE locations SET country = 'Netherlands' WHERE name = 'Amsterdam';

-- Capitalize names
UPDATE locations SET name = 'New York' WHERE slug = 'new-york';
UPDATE locations SET name = 'Vancouver' WHERE slug = 'vancouver';

-- Show results
SELECT id, name, slug, country, region FROM locations ORDER BY name;
```

Click **"Run"** ✅

---

### **Step 2: Restart Dev Server**

The server is already running, but let's restart to clear any cache:

```bash
# Kill current server (Ctrl+C in terminal)
# Then restart:
cd apps/web
npm run dev
```

---

### **Step 3: Test Location Pages**

Try these URLs:
```
✅ http://localhost:3000/locations/rome
✅ http://localhost:3000/locations/tokyo
✅ http://localhost:3000/locations/paris
✅ http://localhost:3000/locations/barcelona
✅ http://localhost:3000/locations/vancouver
```

**Expected Results:**
- ✅ Pages load (no white screen)
- ✅ Correct country names in breadcrumbs
- ✅ SVG placeholder images (gray boxes with icons)
- ✅ 50 restaurants, 50 activities
- ✅ "Load More" buttons working

---

## 🎯 For Production: Add Real Images

### **Option 1: Pexels API (Recommended - Unlimited & Free)**

1. **Get API Key** (2 minutes):
   ```
   https://www.pexels.com/api/
   ```

2. **Add to `.env.local`:**
   ```bash
   PEXELS_API_KEY=your_key_here
   ```

3. **Update Auto-Fill API:**
   Add this to `apps/web/app/api/admin/auto-fill/route.ts` after line 358:

   ```typescript
   // Fetch images from Pexels (if API key is set)
   const pexelsKey = process.env.PEXELS_API_KEY
   if (pexelsKey && !imagesCount) {
     try {
       const pexelsResponse = await fetch(
         `https://api.pexels.com/v1/search?query=${encodeURIComponent(locationName)}&per_page=10`,
         { headers: { 'Authorization': pexelsKey } }
       )

       if (pexelsResponse.ok) {
         const pexelsData = await pexelsResponse.json()
         const images = pexelsData.photos.map((photo: any) => photo.src.large)

         if (images.length > 0) {
           await supabase
             .from('locations')
             .update({
               featured_image: images[0],
               gallery_images: images
             })
             .eq('id', location.id)

           imagesCount = images.length
           console.log(`✅ Saved ${imagesCount} images from Pexels`)
         }
       }
     } catch (error) {
       console.error('Error fetching Pexels images:', error)
     }
   }
   ```

4. **Test:**
   ```
   http://localhost:3000/admin/auto-fill
   ```
   - Enter: "Lofoten Islands"
   - Click: "Auto-Fill Content"
   - Result: ✅ Real images from Pexels!

---

### **Option 2: Unsplash API (Already Integrated)**

1. **Get API Key:**
   ```
   https://unsplash.com/developers
   ```

2. **Add to `.env.local`:**
   ```bash
   UNSPLASH_ACCESS_KEY=your_key_here
   ```

3. **Restart server** - it's already integrated!

---

## 🐛 Troubleshooting

### **Issue: "lofoten-islands" not found**
**Solution:** Location doesn't exist yet. Create it:
```
http://localhost:3000/admin/auto-fill
```
- Enter: "Lofoten Islands"
- Click: "Auto-Fill Content"
- Wait 30 seconds
- Visit: `http://localhost:3000/locations/lofoten-islands`

---

### **Issue: Images still broken**
**Possible causes:**
1. SVG files not created → Check `apps/web/public/placeholder-*.svg`
2. Browser cache → Hard refresh (Ctrl+Shift+R)
3. Next.js cache → Restart server

**Fix:**
```bash
# Verify SVG files exist
ls -la apps/web/public/placeholder-*.svg

# If missing, create them:
cd apps/web/public
cat > placeholder-location.svg << 'EOF'
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="800" fill="#e5e7eb"/>
  <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">📍 Location</text>
</svg>
EOF

cat > placeholder-restaurant.svg << 'EOF'
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#fef3c7"/>
  <text x="50%" y="50%" font-family="Arial" font-size="36" fill="#d97706" text-anchor="middle" dominant-baseline="middle">🍽️ Restaurant</text>
</svg>
EOF

cat > placeholder-activity.svg << 'EOF'
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#dbeafe"/>
  <text x="50%" y="50%" font-family="Arial" font-size="36" fill="#2563eb" text-anchor="middle" dominant-baseline="middle">🎯 Activity</text>
</svg>
EOF
```

---

### **Issue: Breadcrumbs still show wrong country**
**Solution:** Run the SQL script from Step 1 above

---

### **Issue: Pages still white screen**
**Check server logs:**
```bash
# Look for errors in terminal where server is running
# Common errors:
# - "location_restaurants" → Fixed ✅
# - "Cannot coerce result" → Run SQL to fix countries
# - "PGRST116" → Location doesn't exist (create it)
```

---

## 📊 Summary of Changes

| Issue | Status | Solution |
|-------|--------|----------|
| Wrong table names | ✅ Fixed | Updated `locationQueries.ts` |
| Missing placeholder images | ✅ Fixed | Created SVG files |
| Wrong country names | ⚠️ Needs SQL | Run SQL script |
| Lofoten Islands missing | ⚠️ Create it | Use auto-fill |
| No real images | 💡 Optional | Add Pexels/Unsplash API |

---

## ✅ Final Checklist

- [ ] Run SQL script to fix country names
- [ ] Restart dev server
- [ ] Test Rome page: `http://localhost:3000/locations/rome`
- [ ] Verify breadcrumbs show "Italy" not "Italia"
- [ ] Verify images load (SVG placeholders)
- [ ] Test "Load More" buttons
- [ ] (Optional) Add Pexels API for real images
- [ ] Create Lofoten Islands location via auto-fill

---

**Everything is ready! Just run the SQL and restart the server.** 🚀

