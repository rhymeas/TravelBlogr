# 🔄 Auto-Update System Guide

## 🎯 Overview

The auto-update system intelligently refreshes location data without overloading the system.

### **Features:**
- ✅ **Smart Detection** - Checks if data is stale or missing
- ✅ **Background Updates** - Updates happen without blocking user
- ✅ **Rate Limiting** - 2-second delay between updates (no overload)
- ✅ **Queue System** - Processes updates one at a time
- ✅ **Auto-Refresh** - Page reloads when update completes
- ✅ **Quality Score** - Shows data completeness (0-100%)

---

## 📊 What Gets Updated

### **Automatic Checks:**
1. **Images** - Ensures 4-6 gallery images
2. **Descriptions** - Checks for complete descriptions (50+ chars)
3. **Travel Guide** - WikiVoyage link
4. **Metadata** - Population, timezone
5. **Activity Descriptions** - All activities have descriptions
6. **Staleness** - Data older than 7 days

### **Update Triggers:**
- ⏰ **Age**: Data older than 7 days
- 📸 **Images**: Less than 4 gallery images
- 📝 **Description**: Missing or too short
- 🗺️ **Travel Guide**: No WikiVoyage link
- 🎯 **Activities**: Missing descriptions
- 📊 **Metadata**: Missing population/timezone

---

## 🚀 How It Works

### **1. Page Load Detection**
```typescript
// Automatically checks on page load
useLocationAutoUpdate({
  locationId: location.id,
  locationName: location.name,
  enabled: true
})
```

### **2. Background Update**
```
User visits page
    ↓
Check if update needed (1 second delay)
    ↓
If needed: Trigger background update
    ↓
Show banner: "Updating location data..."
    ↓
Fetch missing data:
  - Images (4-6 minimum)
  - Descriptions
  - Travel guide
  - Activity descriptions
    ↓
Save to database
    ↓
Auto-refresh page (2 seconds)
    ↓
User sees updated data
```

### **3. Rate Limiting**
```
Update Queue:
- Location A → Wait 2 seconds → Location B → Wait 2 seconds → Location C

Prevents:
❌ API overload
❌ Database overload
❌ Rate limit errors
```

---

## 📁 Files Created

### **Core Services:**
1. ✅ `apps/web/lib/services/locationUpdateService.ts`
   - Smart update detection
   - Queue system
   - Activity description fixer
   - Update statistics

2. ✅ `apps/web/app/api/admin/update-location/route.ts`
   - Background update API
   - GET: Check if update needed
   - POST: Trigger update

3. ✅ `apps/web/hooks/useLocationAutoUpdate.ts`
   - React hook for auto-updates
   - Client-side quality check
   - Auto-refresh on complete

4. ✅ `apps/web/components/admin/LocationUpdateBanner.tsx`
   - Update status banner
   - Data quality badge
   - Manual update button

---

## 🎨 UI Components

### **1. Update Banner**
Shows when location is being updated:
```tsx
<LocationUpdateBanner 
  location={location} 
  enabled={true} 
/>
```

**Displays:**
- 🔄 "Updating location data..."
- ⏰ "Last updated X days ago"
- 📋 List of what's being updated
- ✅ Auto-dismissible

### **2. Quality Badge**
Shows data completeness score:
```tsx
<DataQualityBadge location={location} />
```

**Shows:**
- 🟢 Excellent (90-100%)
- 🟡 Good (70-89%)
- 🟠 Fair (50-69%)
- 🔴 Needs Update (0-49%)

### **3. Manual Update Button**
For admin to force update:
```tsx
<ManualUpdateButton location={location} />
```

---

## 🔧 Integration

### **Step 1: Add to Location Page**

Update `apps/web/app/locations/[slug]/page.tsx`:

```typescript
import { LocationUpdateBanner } from '@/components/admin/LocationUpdateBanner'

export default async function LocationPage({ params }: LocationPageProps) {
  const location = await getLocationBySlug(params.slug)
  
  return (
    <div>
      {/* Add update banner */}
      <LocationUpdateBanner location={location} enabled={true} />
      
      {/* Rest of page */}
      <LocationDetailTemplate location={location} />
    </div>
  )
}
```

### **Step 2: Add Quality Badge (Optional)**

In location header or admin panel:

```typescript
import { DataQualityBadge } from '@/components/admin/LocationUpdateBanner'

<div className="flex items-center gap-4">
  <h1>{location.name}</h1>
  <DataQualityBadge location={location} />
</div>
```

### **Step 3: Add Manual Update (Admin Only)**

In admin dashboard:

```typescript
import { ManualUpdateButton } from '@/components/admin/LocationUpdateBanner'

<div className="admin-panel">
  <h2>Location Management</h2>
  <ManualUpdateButton location={location} />
</div>
```

---

## 🧪 Testing

### **Test 1: Auto-Update on Page Load**
```bash
# 1. Visit a location page:
http://localhost:3000/locations/santorini

# 2. Check browser console for:
🔄 Auto-update triggered for Santorini
✅ Auto-update completed for Santorini

# 3. Page should auto-refresh after 2 seconds
```

### **Test 2: Manual Update**
```bash
# 1. Add ManualUpdateButton to page
# 2. Click "Update Location Data"
# 3. Watch for:
   - Button shows "Updating..."
   - Success message appears
   - Page refreshes
```

### **Test 3: Quality Score**
```bash
# 1. Add DataQualityBadge to page
# 2. Check score:
   - 100% = All data complete
   - <100% = Missing data (hover for details)
```

---

## 📊 Update Statistics

### **Check All Locations:**
```typescript
import { getUpdateStats } from '@/lib/services/locationUpdateService'

const stats = getUpdateStats(allLocations)

console.log(stats)
// {
//   total: 10,
//   needsUpdate: 3,
//   upToDate: 7,
//   stale: 1,
//   missingData: {
//     description: 2,
//     images: 3,
//     travel_guide: 1,
//     metadata: 2,
//     activity_descriptions: 5
//   }
// }
```

### **Batch Update:**
```typescript
import { batchUpdateLocations } from '@/lib/services/locationUpdateService'

// Update multiple locations (with rate limiting)
await batchUpdateLocations([
  { id: 'loc1', name: 'Santorini' },
  { id: 'loc2', name: 'Athens' },
  { id: 'loc3', name: 'Rome' }
])
```

---

## ⚙️ Configuration

### **Update Threshold**
Change how often locations are updated:

```typescript
// In locationUpdateService.ts
const UPDATE_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days

// Change to 3 days:
const UPDATE_THRESHOLD = 3 * 24 * 60 * 60 * 1000
```

### **Rate Limit**
Change delay between updates:

```typescript
// In locationUpdateService.ts
const RATE_LIMIT_DELAY = 2000 // 2 seconds

// Change to 5 seconds:
const RATE_LIMIT_DELAY = 5000
```

### **Disable Auto-Update**
```typescript
<LocationUpdateBanner 
  location={location} 
  enabled={false}  // Disable auto-update
/>
```

---

## 🐛 Troubleshooting

### **Issue: Updates not triggering**
**Solution:**
```bash
# Check browser console for errors
# Verify API endpoint is accessible:
curl http://localhost:3000/api/admin/update-location?locationId=xxx
```

### **Issue: Page not refreshing**
**Solution:**
```typescript
// Check if auto-refresh is enabled in hook
// Manually refresh: window.location.reload()
```

### **Issue: Too many updates**
**Solution:**
```typescript
// Increase UPDATE_THRESHOLD
// Increase RATE_LIMIT_DELAY
// Disable auto-update for some pages
```

---

## ✅ Summary

### **What You Get:**
- ✅ Automatic data refresh on page load
- ✅ Smart detection (only updates if needed)
- ✅ Rate limiting (no system overload)
- ✅ Queue system (one at a time)
- ✅ Quality scoring (0-100%)
- ✅ UI components (banner, badge, button)
- ✅ Manual update option (admin)

### **What Gets Fixed:**
- ✅ Missing images (ensures 4-6)
- ✅ Missing descriptions
- ✅ Missing travel guides
- ✅ Missing activity descriptions
- ✅ Stale data (>7 days old)

### **Performance:**
- ⏱️ 1-second delay before check
- ⏱️ 2-second delay between updates
- ⏱️ 2-second delay before refresh
- 🚀 Non-blocking (background updates)
- 💾 Cached (24 hours)

---

## 🎯 Next Steps

### **1. Integrate into Location Page (5 min)**
Add `LocationUpdateBanner` component

### **2. Test Auto-Update (2 min)**
Visit Santorini page and watch console

### **3. Optional: Add Quality Badge (2 min)**
Show data completeness score

### **4. Optional: Add Manual Update (2 min)**
For admin dashboard

---

**Total Setup Time:** 10 minutes
**Result:** Automatic data refresh system! 🔄🚀

