# Planning Authentication Flow with Form Persistence

## 🎯 Overview

Implemented a seamless authentication flow for the trip planning feature that **preserves user input** across login/signup and even page reloads. Users never lose their carefully entered trip details!

## ✨ Key Features

1. **Form Data Persistence** - Saves to localStorage before showing auth modal
2. **Custom Auth Modal** - Beautiful, planning-specific authentication UI
3. **Auto-Restore** - Automatically restores form data after successful login
4. **Survives Reload** - Data persists even if user refreshes the page
5. **24-Hour Expiry** - Saved data expires after 24 hours for security

## 🔄 User Flow

### Scenario 1: User Not Logged In

```
1. User goes to /plan
   ↓
2. Fills in locations: "Hamburg" → "Berlin"
   ↓
3. Selects dates: June 1-5, 2025
   ↓
4. Toggles Pro Mode ON
   ↓
5. Clicks "Generate plan"
   ↓
6. ✅ Form data saved to localStorage
   ↓
7. Custom auth modal appears
   ↓
8. User signs up/signs in
   ↓
9. ✅ Form data automatically restored
   ↓
10. ✅ Plan generation starts automatically
```

### Scenario 2: User Refreshes Page During Auth

```
1. User fills in planning form
   ↓
2. Clicks "Generate plan"
   ↓
3. Form data saved, auth modal appears
   ↓
4. User accidentally refreshes page
   ↓
5. Page reloads, user signs in
   ↓
6. ✅ Form data still restored from localStorage
   ↓
7. User can click "Generate plan" again
```

### Scenario 3: User Already Logged In

```
1. User goes to /plan
   ↓
2. Fills in locations and dates
   ↓
3. Clicks "Generate plan"
   ↓
4. ✅ Plan generates immediately (no auth modal)
```

## 📦 Implementation

### 1. Form Storage Utility

**File**: `apps/web/lib/utils/planningFormStorage.ts`

```typescript
export interface PlanningFormData {
  locations: Array<{
    value: string
    label?: string
    coordinates?: { lat: number; lng: number }
  }>
  startDate: string | null
  endDate: string | null
  proMode: boolean
  preferences?: {
    budget?: string
    travelStyle?: string
    interests?: string[]
  }
}

// Save form data
savePlanningFormData(data: PlanningFormData): void

// Get saved data (returns null if expired)
getPlanningFormData(): PlanningFormData | null

// Clear saved data
clearPlanningFormData(): void

// Check if data exists
hasSavedPlanningFormData(): boolean
```

**Features**:
- ✅ Stores data in localStorage
- ✅ Timestamps data for expiry checking
- ✅ 24-hour expiry time
- ✅ Automatic cleanup of expired data
- ✅ Error handling for localStorage failures

### 2. Reusing SignInModal with Custom Hero

**File**: `apps/web/components/auth/SignInModal.tsx`

**Design**:
We reuse the existing `SignInModal` component but pass custom `heroContent` to customize the left side for the planning flow.

**Custom Hero Content**:
- **Title**: "Your Trip Plan is Waiting!"
- **Subtitle**: "Sign in to unlock AI-powered itinerary generation and save your perfect trip."
- **Features**:
  - 🛡️ Shield icon: "Your Input is Saved - We've saved your locations and dates!"
  - ✨ Sparkles icon: "15 Free Credits - 10 regular + 5 pro mode + 2 manual trips"

**Props**:
```typescript
interface HeroContent {
  title: string
  subtitle: string
  features?: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
}

interface SignInModalProps {
  isOpen: boolean
  onClose: (userSignedIn?: boolean) => void
  redirectTo?: string
  heroContent?: HeroContent  // Optional custom hero
}
```

**Benefits**:
- ✅ Maintains consistent look across app
- ✅ Reuses existing auth logic
- ✅ Customizable hero content per use case
- ✅ Same Google OAuth integration
- ✅ Same form validation and error handling

### 3. Updated Itinerary Generator

**File**: `apps/web/components/itinerary/ItineraryGenerator.tsx`

**Changes**:

1. **Added imports**:
```typescript
import { SignInModal } from '@/components/auth/SignInModal'
import { Shield, Sparkles } from 'lucide-react'
import {
  savePlanningFormData,
  getPlanningFormData,
  clearPlanningFormData
} from '@/lib/utils/planningFormStorage'
```

2. **Added state**:
```typescript
const [showPlanningAuthModal, setShowPlanningAuthModal] = useState(false)
```

3. **Restore saved data on mount**:
```typescript
useEffect(() => {
  const savedData = getPlanningFormData()
  if (savedData) {
    // Restore locations
    setLocations(savedData.locations.map(...))
    
    // Restore dates
    setDateRange({
      startDate: new Date(savedData.startDate),
      endDate: new Date(savedData.endDate)
    })
    
    // Restore pro mode
    setProMode(savedData.proMode)
    
    toast.success('Your trip details have been restored!')
    clearPlanningFormData()
  }
}, [])
```

4. **Updated handleGenerate**:
```typescript
const handleGenerate = async () => {
  // Validation first
  if (filledLocations.length < 2) {
    setError('Please enter at least a starting location and destination')
    return
  }
  
  if (!dateRange) {
    setError('Please select travel dates')
    return
  }
  
  // Check auth - save data before showing modal
  if (!isAuthenticated) {
    savePlanningFormData({
      locations: filledLocations.map(...),
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      proMode,
      preferences: { budget, interests }
    })
    
    toast.success('Your trip details have been saved!')
    setShowPlanningAuthModal(true)
    return
  }
  
  // Continue with generation...
}
```

5. **Added modal to JSX with custom hero**:
```tsx
<SignInModal
  isOpen={showPlanningAuthModal}
  onClose={(userSignedIn) => {
    setShowPlanningAuthModal(false)
    if (userSignedIn) {
      setTimeout(() => handleGenerate(), 500)
    }
  }}
  heroContent={{
    title: "Your Trip Plan is Waiting!",
    subtitle: "Sign in to unlock AI-powered itinerary generation and save your perfect trip.",
    features: [
      {
        icon: <Shield className="h-5 w-5" />,
        title: "Your Input is Saved",
        description: "We've saved your locations and dates - you won't lose anything!"
      },
      {
        icon: <Sparkles className="h-5 w-5" />,
        title: "15 Free Credits",
        description: "New users get 10 regular plans + 5 pro mode AI generations and 2 manual trip plans for free"
      }
    ]
  }}
/>
```

## 🎨 UI/UX Details

### Custom Auth Modal Design

```
┌─────────────────────────────────────────────────────────┐
│  [X]                                                    │
│  ┌──────────────────┬──────────────────────────────┐   │
│  │                  │                              │   │
│  │  🌟 Sparkles     │  Create Account              │   │
│  │                  │                              │   │
│  │  Your Trip Plan  │  Get 15 free credits to      │   │
│  │  is Waiting!     │  start planning amazing      │   │
│  │                  │  trips                       │   │
│  │  Sign in to      │                              │   │
│  │  unlock AI-      │  [Continue with Google]      │   │
│  │  powered...      │                              │   │
│  │                  │  ─── Or continue with ───    │   │
│  │  🛡️ Your Input   │                              │   │
│  │  is Saved        │  Full Name: [________]       │   │
│  │  We've saved     │  Email: [________]           │   │
│  │  your locations  │  Password: [________] 👁️     │   │
│  │  and dates!      │  Confirm: [________] 👁️      │   │
│  │                  │                              │   │
│  │  ✨ 15 Free      │  [Create Account & Continue] │   │
│  │  Credits         │                              │   │
│  │  10 regular +    │  Already have an account?    │   │
│  │  5 pro mode      │  Sign in                     │   │
│  │                  │                              │   │
│  └──────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Toast Messages

1. **When saving data**:
   ```
   ✅ Your trip details have been saved!
   ```

2. **When restoring data**:
   ```
   ✅ Your trip details have been restored!
   ```

3. **After successful signup**:
   ```
   ✅ Account created! Your trip plan is ready to generate.
   ```

4. **After successful signin**:
   ```
   ✅ Welcome back! Generating your trip plan...
   ```

## 🔒 Security & Privacy

### Data Expiry

- **Expiry Time**: 24 hours
- **Auto-Cleanup**: Expired data is automatically removed
- **Timestamp**: Each save includes a timestamp for age checking

### What's Stored

```json
{
  "locations": [
    {
      "value": "Hamburg, Germany",
      "label": "Hamburg, Germany",
      "coordinates": { "lat": 53.5511, "lng": 9.9937 }
    },
    {
      "value": "Berlin, Germany",
      "label": "Berlin, Germany",
      "coordinates": { "lat": 52.5200, "lng": 13.4050 }
    }
  ],
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-06-05T00:00:00.000Z",
  "proMode": true,
  "preferences": {
    "budget": "moderate",
    "interests": ["art", "food", "history"]
  }
}
```

### What's NOT Stored

- ❌ User credentials (email, password)
- ❌ Authentication tokens
- ❌ Personal information
- ❌ Payment details

## 🧪 Testing

### Test Case 1: Basic Flow

1. **Go to `/plan` (not logged in)**
2. Fill in:
   - From: "Hamburg, Germany"
   - To: "Berlin, Germany"
   - Dates: June 1-5, 2025
   - Pro Mode: ON
3. Click "Generate plan"
4. ✅ Toast: "Your trip details have been saved!"
5. ✅ Custom auth modal appears
6. Sign up with new account
7. ✅ Toast: "Account created! Your trip plan is ready to generate."
8. ✅ Toast: "Your trip details have been restored!"
9. ✅ Form shows Hamburg → Berlin, June 1-5, Pro Mode ON
10. ✅ Plan generation starts automatically

### Test Case 2: Page Refresh

1. Fill in planning form
2. Click "Generate plan"
3. Auth modal appears
4. **Refresh the page** (Cmd+R / Ctrl+R)
5. Page reloads
6. Sign in
7. ✅ Form data should be restored
8. Click "Generate plan" again
9. ✅ Plan should generate

### Test Case 3: Data Expiry

1. Fill in planning form
2. Click "Generate plan"
3. **Wait 25 hours** (or manually change timestamp in localStorage)
4. Refresh page
5. Sign in
6. ✅ Form should be empty (data expired)
7. ❌ No "restored" toast message

### Test Case 4: Already Logged In

1. **Sign in first**
2. Go to `/plan`
3. Fill in locations and dates
4. Click "Generate plan"
5. ✅ Plan generates immediately
6. ❌ No auth modal shown
7. ❌ No data saved to localStorage

## 📊 localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `travelblogr_planning_form_data` | JSON string | Stores form data |
| `travelblogr_planning_form_timestamp` | Unix timestamp | Tracks save time |

## 🔧 Debugging

### Check Saved Data

```javascript
// In browser console
const data = localStorage.getItem('travelblogr_planning_form_data')
console.log(JSON.parse(data))

const timestamp = localStorage.getItem('travelblogr_planning_form_timestamp')
const age = Date.now() - parseInt(timestamp)
console.log(`Data age: ${age / 1000 / 60} minutes`)
```

### Clear Saved Data

```javascript
// In browser console
localStorage.removeItem('travelblogr_planning_form_data')
localStorage.removeItem('travelblogr_planning_form_timestamp')
```

### Force Expiry

```javascript
// Set timestamp to 25 hours ago
const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000)
localStorage.setItem('travelblogr_planning_form_timestamp', twentyFiveHoursAgo.toString())
```

## 🚀 Future Enhancements

### Potential Improvements

1. **Cloud Sync** - Save to user's account instead of localStorage
2. **Multiple Drafts** - Allow users to save multiple trip plans
3. **Auto-Save** - Save on every input change (debounced)
4. **Offline Support** - Full offline planning with service workers
5. **Share Draft** - Generate shareable link for draft plans

### Migration Path

If we move to cloud storage:

```typescript
// Instead of localStorage
savePlanningFormData(data)

// Use API
await fetch('/api/planning/drafts', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

## ✅ Checklist

- [x] Form storage utility created
- [x] Custom planning auth modal designed
- [x] Save form data before showing auth
- [x] Restore form data after login
- [x] Handle page refresh
- [x] 24-hour expiry implemented
- [x] Toast notifications added
- [x] Auto-generate after auth success
- [x] Type-safe implementation
- [x] Documentation complete

---

**Implementation Date**: 2025-10-17  
**Status**: ✅ Complete  
**Next Steps**: Test with real users, monitor localStorage usage

