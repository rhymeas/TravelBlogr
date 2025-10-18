# 🚀 Quick Integration Guide

## 1️⃣ Add Credits Dashboard to User Dashboard

```tsx
// apps/web/app/dashboard/page.tsx
import { CreditsUsageCard } from '@/components/dashboard/CreditsUsageCard'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credits Card */}
        <CreditsUsageCard />
        
        {/* Other dashboard cards */}
        <div className="bg-white rounded-xl border p-6">
          {/* Your other content */}
        </div>
      </div>
    </div>
  )
}
```

---

## 2️⃣ Add Trip Planner CTAs to Location Pages

```tsx
// apps/web/app/locations/[slug]/page.tsx
import { TripPlannerCTAs } from '@/components/locations/TripPlannerCTAs'

export default async function LocationPage({ params }: { params: { slug: string } }) {
  // Fetch location data
  const location = await getLocationBySlug(params.slug)
  
  return (
    <div className="container mx-auto p-6">
      {/* Location header, images, description, etc. */}
      
      <div className="mt-8">
        <TripPlannerCTAs
          locationName={location.name}
          locationSlug={location.slug}
          latitude={location.latitude}
          longitude={location.longitude}
        />
      </div>
      
      {/* Rest of location content */}
    </div>
  )
}
```

---

## 3️⃣ POI Display (Already Integrated!)

POIs automatically display in the trip planning modal when available in `structuredContext.poisByLocation`.

**No additional integration needed!** ✅

The POISection component is already integrated into `ItineraryModal.tsx` and will automatically show when POI data is present.

---

## 4️⃣ Mobile Swipe (Already Integrated!)

Swipe gestures are already integrated into the trip planning modal.

**No additional integration needed!** ✅

Users can:
- Swipe left → Next location
- Swipe right → Previous location
- Use navigation arrows on mobile

---

## 🎨 Styling Tips

### Match Your Brand Colors

**Credits Dashboard:**
```tsx
// Customize colors in CreditsUsageCard.tsx
className="bg-gradient-to-r from-teal-500 to-teal-600"  // Change teal to your brand color
```

**Location CTAs:**
```tsx
// Customize in TripPlannerCTAs.tsx
className="bg-gradient-to-br from-teal-50 to-blue-50"   // "Plan TO" button
className="bg-gradient-to-br from-purple-50 to-pink-50" // "Plan FROM" button
```

### Adjust Spacing

```tsx
// Add more space around components
<div className="mt-8 mb-8">  // Increase margins
  <CreditsUsageCard />
</div>
```

---

## 🧪 Test Your Integration

### 1. Credits Dashboard
```bash
# Navigate to dashboard
http://localhost:3000/dashboard

# Should see:
✅ Credits card with stats
✅ Progress bar animation
✅ Warning banner (if low on credits)
✅ Buy Credits button
```

### 2. Location CTAs
```bash
# Navigate to any location page
http://localhost:3000/locations/paris-france

# Should see:
✅ Two gradient buttons (TO and FROM)
✅ Hover animations
✅ Click redirects to /plan with pre-filled data
```

### 3. Mobile Experience
```bash
# Open trip planner on mobile device or resize browser
http://localhost:3000/plan

# Generate a trip, then:
✅ Swipe left/right to navigate
✅ See navigation arrows at top
✅ Responsive layout
✅ Touch-optimized buttons
```

### 4. POI Display
```bash
# Generate a trip with POIs
http://localhost:3000/plan

# In location tabs:
✅ POI section appears (if data available)
✅ Category filtering works
✅ Click "Open in Maps" works
```

---

## 🚀 Deploy to Production

```bash
# 1. Test locally
npm run build
npm start

# 2. Commit changes
git add .
git commit -m "feat: add credits dashboard and location CTAs"

# 3. Push to main
git push origin main

# 4. Railway auto-deploys
# Monitor at: https://railway.app
```

---

## 📊 Monitor Usage

### Credits System
```typescript
// Check user credits programmatically
import { getCreditStats } from '@/lib/services/creditService'

const stats = await getCreditStats(userId)
console.log(stats)
// {
//   totalPurchased: 20,
//   totalUsed: 15,
//   remaining: 5,
//   monthlyUsage: 15,
//   remainingFree: 5
// }
```

### Track Conversions
```typescript
// Track when users click location CTAs
onClick={() => {
  // Analytics event
  analytics.track('location_cta_clicked', {
    location: locationName,
    type: 'plan_to' // or 'plan_from'
  })
  
  // Navigate
  router.push(`/plan?to=${locationName}`)
}}
```

---

## 🎯 Common Customizations

### Change Free Tier Limit
```typescript
// apps/web/lib/services/creditService.ts
export const FREE_TIER_MONTHLY_LIMIT_AUTH = 20  // Change to your limit
```

### Customize Warning Threshold
```tsx
// apps/web/components/dashboard/CreditsUsageCard.tsx
const isLowOnCredits = data.remaining < 3  // Change threshold
```

### Add Custom CTA Buttons
```tsx
// Add a third button to TripPlannerCTAs
<button
  onClick={() => router.push(`/plan?multi=${locationName}`)}
  className="..."
>
  Plan Multi-City Trip
</button>
```

---

## 💡 Pro Tips

1. **Lazy Load Components**
   ```tsx
   import dynamic from 'next/dynamic'
   
   const CreditsUsageCard = dynamic(
     () => import('@/components/dashboard/CreditsUsageCard'),
     { ssr: false }
   )
   ```

2. **Add Loading States**
   ```tsx
   <Suspense fallback={<CreditsCardSkeleton />}>
     <CreditsUsageCard />
   </Suspense>
   ```

3. **Cache Credit Stats**
   ```tsx
   // Use SWR for automatic caching
   import useSWR from 'swr'
   
   const { data: stats } = useSWR(
     `/api/credits/${userId}`,
     fetcher,
     { revalidateOnFocus: false }
   )
   ```

---

## 🆘 Troubleshooting

### Credits Not Loading
```typescript
// Check Supabase connection
const { data, error } = await supabase
  .from('user_credits')
  .select('*')
  .eq('user_id', userId)

console.log({ data, error })
```

### Location CTAs Not Redirecting
```typescript
// Check URL parameters
const searchParams = useSearchParams()
console.log('from:', searchParams.get('from'))
console.log('to:', searchParams.get('to'))
```

### Swipe Not Working
```typescript
// Check touch events
const swipeHandlers = useSwipe({
  onSwipedLeft: () => console.log('Swiped left!'),
  onSwipedRight: () => console.log('Swiped right!')
})

// Apply to element
<div {...swipeHandlers}>Content</div>
```

---

## 📚 Full Documentation

- **Implementation Guide:** `docs/TRIP_PLANNER_IMPLEMENTATION.md`
- **Visual Guide:** `docs/VISUAL_IMPLEMENTATION_GUIDE.md`
- **Component APIs:** See individual component files

---

## ✅ Integration Checklist

- [ ] Add CreditsUsageCard to dashboard
- [ ] Add TripPlannerCTAs to location pages
- [ ] Test mobile swipe gestures
- [ ] Verify POI display works
- [ ] Test URL parameter pre-filling
- [ ] Check responsive design on mobile
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Deploy to production
- [ ] Monitor analytics

---

**Need help?** Check the full documentation or contact the development team.

