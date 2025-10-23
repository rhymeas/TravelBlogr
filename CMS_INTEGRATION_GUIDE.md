# CMS Integration Guide
## How to Use the New Trip CMS Components

---

## Quick Start

### Option 1: Replace Existing CMS (Recommended)

In `apps/web/app/dashboard/trips/[tripId]/page.tsx`:

```tsx
// 1. Import the new CMS
import { TripCMS } from '@/components/trips/TripCMS'

// 2. Replace the old CMS component
// OLD:
// <TripCMSEditor ... />
// or
// <TripCMSEditorV2 ... />

// NEW:
<TripCMS
  tripId={trip.id}
  userId={user.id}
  trip={trip}
  posts={trip.posts || []}
  onUpdate={fetchTrip}
  canEdit={canEdit}
/>
```

### Option 2: Use Modals Independently

You can use the modals in any component:

```tsx
import { TripEditModal } from '@/components/trips/TripEditModal'
import { PostEditModal } from '@/components/trips/PostEditModal'

function MyComponent() {
  const [showTripEdit, setShowTripEdit] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowTripEdit(true)}>
        Edit Trip
      </button>
      
      <TripEditModal
        isOpen={showTripEdit}
        onClose={() => setShowTripEdit(false)}
        trip={trip}
        onUpdate={handleUpdate}
      />
    </>
  )
}
```

---

## Component API Reference

### TripCMS

**Props:**
```typescript
interface TripCMSProps {
  tripId: string        // Trip ID
  userId: string        // Current user ID
  trip: any            // Trip object from Supabase
  posts: Post[]        // Array of posts/locations
  onUpdate: () => void // Callback after updates
  canEdit: boolean     // Whether user can edit
}
```

**Example:**
```tsx
<TripCMS
  tripId="123e4567-e89b-12d3-a456-426614174000"
  userId="user-123"
  trip={tripData}
  posts={tripData.posts || []}
  onUpdate={() => fetchTrip()}
  canEdit={trip.user_id === user.id}
/>
```

---

### TripEditModal

**Props:**
```typescript
interface TripEditModalProps {
  isOpen: boolean      // Modal visibility
  onClose: () => void  // Close handler
  trip: any           // Trip object
  onUpdate: () => void // Callback after save
}
```

**Example:**
```tsx
<TripEditModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  trip={trip}
  onUpdate={refreshTrip}
/>
```

---

### PostEditModal

**Props:**
```typescript
interface PostEditModalProps {
  isOpen: boolean          // Modal visibility
  onClose: () => void      // Close handler
  tripId: string          // Trip ID
  userId: string          // Current user ID
  post?: Post | null      // Post to edit (null for new)
  onUpdate: () => void    // Callback after save
  nextOrderIndex: number  // Order index for new posts
}
```

**Example (Add New):**
```tsx
<PostEditModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  tripId={trip.id}
  userId={user.id}
  post={null}
  onUpdate={refreshTrip}
  nextOrderIndex={posts.length + 1}
/>
```

**Example (Edit Existing):**
```tsx
<PostEditModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  tripId={trip.id}
  userId={user.id}
  post={selectedPost}
  onUpdate={refreshTrip}
  nextOrderIndex={posts.length + 1}
/>
```

---

### Modal (Generic)

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean              // Modal visibility
  onClose: () => void          // Close handler
  title: string                // Modal title
  children: ReactNode          // Modal content
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean    // Show X button
  closeOnOverlayClick?: boolean // Close on backdrop click
  footer?: ReactNode           // Footer content
}
```

**Example:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="My Modal"
  size="lg"
  footer={
    <ModalFooter
      onCancel={onClose}
      onConfirm={handleSave}
      confirmText="Save"
    />
  }
>
  <p>Modal content here</p>
</Modal>
```

---

## Integration Steps

### Step 1: Update Trip Detail Page

File: `apps/web/app/dashboard/trips/[tripId]/page.tsx`

```tsx
// Add import at top
import { TripCMS } from '@/components/trips/TripCMS'

// Find the section where TripCMSEditor or TripCMSEditorV2 is used
// Replace with:
{canEdit && (
  <TripCMS
    tripId={trip.id}
    userId={user.id}
    trip={trip}
    posts={trip.posts || []}
    onUpdate={fetchTrip}
    canEdit={canEdit}
  />
)}
```

### Step 2: Test the Integration

1. Navigate to a trip detail page
2. Click "Edit Trip" button
3. Modify trip details
4. Save and verify changes
5. Click "Add Location" button
6. Add a new location
7. Edit an existing location
8. Delete a location

### Step 3: Remove Old Components (Optional)

Once you've verified the new CMS works:

```bash
# Backup old components
mv apps/web/components/trips/TripCMSEditor.tsx apps/web/components/trips/TripCMSEditor.tsx.backup
mv apps/web/components/trips/TripCMSEditorV2.tsx apps/web/components/trips/TripCMSEditorV2.tsx.backup

# Or delete them
rm apps/web/components/trips/TripCMSEditor.tsx
rm apps/web/components/trips/TripCMSEditorV2.tsx
```

---

## Customization

### Change Modal Sizes

```tsx
<TripEditModal
  // ... other props
  size="xl" // sm, md, lg, xl, full
/>
```

### Custom Footer Buttons

```tsx
<Modal
  // ... other props
  footer={
    <>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
      <Button onClick={handleDelete} variant="danger">Delete</Button>
    </>
  }
>
```

### Disable Overlay Click

```tsx
<Modal
  // ... other props
  closeOnOverlayClick={false}
/>
```

---

## Styling

All components use Tailwind CSS and follow the existing design system:

- **Primary Color:** `rausch-600` (sleek red)
- **Hover States:** `hover:bg-rausch-700`
- **Borders:** `border-gray-200`
- **Text:** `text-gray-900` (headings), `text-gray-600` (body)

### Override Styles

```tsx
<TripCMS
  // ... props
  className="custom-class"
/>
```

---

## Error Handling

All components include error handling:

```tsx
try {
  // Save operation
  await supabase.from('trips').update(...)
  toast.success('Trip updated successfully')
} catch (error) {
  console.error('Error updating trip:', error)
  toast.error('Failed to update trip')
}
```

---

## Loading States

All save operations show loading states:

```tsx
<Button
  onClick={handleSave}
  disabled={saving}
>
  {saving ? 'Saving...' : 'Save Changes'}
</Button>
```

---

## Validation

Forms validate required fields:

```tsx
<ModalFooter
  onConfirm={handleSave}
  confirmDisabled={!formData.title || !formData.destination}
/>
```

---

## Accessibility

All components are accessible:

- ✅ ARIA labels and roles
- ✅ Keyboard navigation (Escape to close)
- ✅ Focus management
- ✅ Screen reader support

---

## Troubleshooting

### Modal doesn't open
- Check `isOpen` prop is true
- Verify no z-index conflicts
- Check console for errors

### Changes don't save
- Verify `onUpdate` callback is called
- Check Supabase RLS policies
- Check network tab for errors

### Images don't upload
- Verify ImageUpload component exists
- Check Supabase storage bucket permissions
- Verify user is authenticated

---

## Migration Checklist

- [ ] Import new TripCMS component
- [ ] Replace old CMS component
- [ ] Test trip editing
- [ ] Test location adding
- [ ] Test location editing
- [ ] Test location deleting
- [ ] Test image uploads
- [ ] Test validation
- [ ] Test error handling
- [ ] Test on mobile
- [ ] Remove old components
- [ ] Update documentation

---

## Support

For issues or questions:
1. Check this guide
2. Review component source code
3. Check browser console for errors
4. Verify Supabase configuration

---

## Example: Full Integration

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getBrowserSupabase } from '@/lib/supabase'
import { TripCMS } from '@/components/trips/TripCMS'

export default function TripDetailPage({ params }: { params: { tripId: string } }) {
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTrip = async () => {
    const supabase = getBrowserSupabase()
    const { data } = await supabase
      .from('trips')
      .select(`
        *,
        posts (*)
      `)
      .eq('id', params.tripId)
      .single()
    
    setTrip(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTrip()
  }, [params.tripId])

  if (loading) return <div>Loading...</div>
  if (!trip) return <div>Trip not found</div>

  const canEdit = trip.user_id === user?.id

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <TripCMS
        tripId={trip.id}
        userId={user.id}
        trip={trip}
        posts={trip.posts || []}
        onUpdate={fetchTrip}
        canEdit={canEdit}
      />
    </div>
  )
}
```

---

**Ready to integrate!** 🚀

