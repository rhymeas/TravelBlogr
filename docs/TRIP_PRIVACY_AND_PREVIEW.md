# Trip Privacy & Preview Mode Implementation

## Overview

This document describes the implementation of trip privacy settings and preview mode functionality for TravelBlogr.

## Features Implemented

### 1. **Always-Visible Preview/View Button**
- The "View Public Page" / "Preview Trip" button is now visible for ALL trip statuses (draft, published, archived)
- Button text changes based on trip status:
  - **Published trips**: "View Public Page"
  - **Draft/Archived trips**: "Preview Trip"
- Preview mode adds `?preview=true` query parameter to the URL

### 2. **Privacy Settings**
Four privacy levels are now available for trips:

#### **Public** (Default)
- Anyone with the link can view the trip
- Trip appears in public listings when published
- Icon: Globe 🌐

#### **Private**
- Only the trip owner can view
- Trip does not appear in public listings
- Icon: Lock 🔒

#### **Family Members**
- Only designated family members can view
- Owner can specify email addresses of family members
- Icon: Users 👥

#### **Password Protected**
- Requires a password to view
- Owner sets a custom password
- Viewers must enter password to access
- Icon: Key 🔑

### 3. **Preview Mode**
- Accessible via `?preview=true` query parameter
- Shows a yellow banner: "Preview Mode - Only you can see this trip"
- Does not track views in analytics
- Only accessible by trip owner
- Works for all trip statuses (draft, published, archived)

## Database Changes

### New Columns Added to `trips` Table

```sql
-- Privacy setting
privacy VARCHAR(50) DEFAULT 'public' 
  CHECK (privacy IN ('public', 'private', 'family', 'password'))

-- Password for password-protected trips
privacy_password VARCHAR(255)

-- Array of user IDs who can access family-only trips
family_members UUID[]
```

### Migration Script

Run the migration script to add privacy columns:

```bash
# In Supabase SQL Editor, run:
infrastructure/database/add-trip-privacy.sql
```

## New Components

### 1. **TripPrivacyModal** (`apps/web/components/trips/TripPrivacyModal.tsx`)

Modal for managing trip privacy settings:
- Radio button selection for privacy levels
- Password input for password-protected trips
- Family member email input for family-only trips
- Real-time validation and error handling

**Usage:**
```tsx
<TripPrivacyModal
  isOpen={showPrivacyModal}
  onClose={() => setShowPrivacyModal(false)}
  tripId={trip.id}
  currentPrivacy={trip.privacy || 'public'}
  onUpdate={(privacy) => setTrip({ ...trip, privacy })}
/>
```

### 2. **TripPasswordForm** (`apps/web/components/trips/TripPasswordForm.tsx`)

Password entry form for password-protected trips:
- Clean, centered UI with lock icon
- Password verification via API
- Session storage for authenticated access
- Error handling and loading states

**Usage:**
```tsx
<TripPasswordForm tripSlug={trip.slug} />
```

## API Routes

### **POST /api/trips/verify-password**

Verifies password for password-protected trips.

**Request:**
```json
{
  "slug": "trip-slug",
  "password": "user-entered-password"
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "error": "Incorrect password"
}
```

## Updated Pages

### 1. **Trip Detail Page** (`apps/web/app/dashboard/trips/[tripId]/page.tsx`)

**Changes:**
- Added privacy settings button with dynamic icon based on current privacy level
- "View Public Page" button now always visible (changes to "Preview Trip" for drafts)
- Links to `/trips/[slug]` instead of `/trips-library/[slug]`
- Added `?preview=true` parameter for non-published trips
- Integrated TripPrivacyModal component

**New Buttons:**
```tsx
{/* Privacy Settings */}
<button onClick={() => setShowPrivacyModal(true)}>
  {/* Icon changes based on privacy level */}
  <span className="capitalize">{trip.privacy || 'Public'}</span>
</button>

{/* Preview/View Public Page */}
<Link href={`/trips/${trip.slug}${trip.status !== 'published' ? '?preview=true' : ''}`}>
  <button>
    {trip.status === 'published' ? 'View Public Page' : 'Preview Trip'}
  </button>
</Link>
```

### 2. **Public Trip Page** (`apps/web/app/trips/[slug]/page.tsx`)

**Changes:**
- Added privacy access control logic
- Preview mode detection via `searchParams.preview`
- Password-protected trip handling
- Access denied page for unauthorized users
- Preview mode banner for owners
- View tracking disabled in preview mode

**Access Control Logic:**
```typescript
const canAccess = () => {
  if (isOwner) return true
  if (isPreviewMode && !isOwner) return false
  
  switch (tripData.privacy) {
    case 'public':
      return tripData.status === 'published'
    case 'private':
      return isOwner
    case 'family':
      return isOwner || (user && tripData.family_members?.includes(user.id))
    case 'password':
      return false // Handled separately
    default:
      return tripData.status === 'published'
  }
}
```

## User Flow

### Setting Privacy

1. User navigates to trip detail page (`/dashboard/trips/[tripId]`)
2. Clicks privacy button (shows current privacy level)
3. Privacy modal opens with 4 options
4. User selects privacy level:
   - **Password**: Enter password (min 4 characters)
   - **Family**: Enter comma-separated email addresses
   - **Public/Private**: No additional input needed
5. Clicks "Save Changes"
6. Privacy settings updated in database
7. Button updates to show new privacy level

### Previewing a Trip

1. User navigates to trip detail page
2. Clicks "Preview Trip" button (for drafts) or "View Public Page" (for published)
3. New tab opens with trip at `/trips/[slug]?preview=true`
4. Yellow banner shows "Preview Mode - Only you can see this trip"
5. Trip displays exactly as it would appear to public viewers
6. Views are not tracked in analytics

### Accessing Password-Protected Trip

1. Visitor navigates to `/trips/[slug]` for password-protected trip
2. Password entry form displays
3. Visitor enters password
4. Password verified via API
5. If correct: Trip displays normally
6. If incorrect: Error message shown

### Accessing Family-Only Trip

1. Family member (logged in) navigates to `/trips/[slug]`
2. System checks if user ID is in `family_members` array
3. If yes: Trip displays normally
4. If no: Access denied page shown

## Security Considerations

### Current Implementation

- **Password Storage**: Passwords are stored in plain text (NOT RECOMMENDED for production)
- **Session Storage**: Password stored in browser session storage after verification
- **RLS Policies**: Existing Row Level Security policies still apply

### Production Recommendations

1. **Hash Passwords**: Use bcrypt or similar to hash passwords before storing
2. **JWT Tokens**: Issue JWT tokens instead of storing passwords in session storage
3. **Rate Limiting**: Add rate limiting to password verification endpoint
4. **Audit Logging**: Log access attempts for privacy-protected trips
5. **HTTPS Only**: Ensure all traffic uses HTTPS in production

## Testing Checklist

- [ ] Create trip with each privacy level
- [ ] Verify privacy button shows correct icon and label
- [ ] Test preview mode for draft trips
- [ ] Test preview mode for published trips
- [ ] Test password-protected trip access (correct password)
- [ ] Test password-protected trip access (incorrect password)
- [ ] Test family-only trip access (authorized user)
- [ ] Test family-only trip access (unauthorized user)
- [ ] Test private trip access (owner)
- [ ] Test private trip access (non-owner)
- [ ] Verify preview mode banner displays
- [ ] Verify views not tracked in preview mode
- [ ] Test privacy modal save functionality
- [ ] Test password validation (min 4 characters)
- [ ] Test family member email input

## Future Enhancements

1. **Expiring Links**: Add time-limited access for password-protected trips
2. **Access Logs**: Track who accessed the trip and when
3. **Share Permissions**: Allow owners to grant temporary access
4. **Email Invitations**: Send email invites to family members
5. **Password Strength**: Enforce stronger password requirements
6. **Two-Factor Auth**: Add 2FA for sensitive trips
7. **Watermarks**: Add watermarks to preview mode images
8. **Download Protection**: Prevent downloading of images in certain privacy modes

## Troubleshooting

### "View Public Page" button shows 404

**Cause**: Trip doesn't have a slug or slug is incorrect

**Solution**: 
1. Check trip has a valid slug in database
2. Verify slug matches URL pattern
3. Check RLS policies allow access

### Privacy modal doesn't save

**Cause**: Database permissions or validation error

**Solution**:
1. Check browser console for errors
2. Verify user owns the trip
3. Check Supabase logs for RLS policy violations
4. Ensure privacy column exists in database

### Password form doesn't accept password

**Cause**: API route error or password mismatch

**Solution**:
1. Check `/api/trips/verify-password` route is accessible
2. Verify password matches exactly (case-sensitive)
3. Check browser console and network tab for errors
4. Verify trip has `privacy_password` set in database

## Related Files

- `infrastructure/database/add-trip-privacy.sql` - Database migration
- `apps/web/components/trips/TripPrivacyModal.tsx` - Privacy settings modal
- `apps/web/components/trips/TripPasswordForm.tsx` - Password entry form
- `apps/web/app/api/trips/verify-password/route.ts` - Password verification API
- `apps/web/app/dashboard/trips/[tripId]/page.tsx` - Trip detail page
- `apps/web/app/trips/[slug]/page.tsx` - Public trip page

