# Admin Location Quick Edit Feature

## Overview
Added admin-only three-dots menu on location cards for quick editing and deleting locations on the fly.

## Features

### 1. ✅ Admin Three-Dots Menu
**Location:** `/locations` page (both Grid and List views)

**Visibility:** Only visible to users with `role: 'admin'` in their profile

**Actions:**
- **Edit Location** - Opens full edit modal
- **Delete Location** - (Can be added to menu)

### 2. ✅ Location Edit Modal
**File:** `apps/web/components/admin/LocationEditModal.tsx`

**Features:**
- Full location editing capabilities
- Update all location fields:
  - Name
  - Slug (URL)
  - Country & Region
  - Latitude & Longitude
  - Description
  - Published status
  - Featured status
- Delete location with confirmation
- Real-time updates to Supabase
- Success/error alerts

### 3. ✅ Integration Points

**LocationsGrid Component:**
- Added `isAdmin` prop to LocationCard and LocationListItem
- Added `onEdit` callback to open edit modal
- Three-dots menu appears in top-right corner of cards
- Menu has backdrop click-to-close
- Refresh mechanism after edits

## How It Works

### For Admins:

1. **Navigate to `/locations`**
2. **See three-dots icon** (⋮) in top-right of each location card
3. **Click three-dots** to open menu
4. **Click "Edit Location"** to open full edit modal
5. **Make changes** to any field
6. **Click "Save Changes"** to update
7. **Or click "Delete"** to remove location (with confirmation)

### For Regular Users:
- No three-dots menu visible
- Normal location cards with rating badge

## Files Modified/Created

### Created:
1. ✅ `apps/web/components/admin/LocationEditModal.tsx` - Full edit modal

### Modified:
1. ✅ `apps/web/components/locations/LocationsGrid.tsx`
   - Added admin menu to LocationCard
   - Added admin menu to LocationListItem
   - Added LocationEditModal integration
   - Added refresh mechanism

## UI/UX Design

### Three-Dots Menu (Grid View):
```
┌─────────────────────────┐
│ [Location Image]    [⋮] │ ← Three dots in top-right
│                          │
│ Location Name            │
│ Country, Region          │
└─────────────────────────┘
```

**Menu Dropdown:**
```
┌──────────────────┐
│ ✏️ Edit Location │
└──────────────────┘
```

### Edit Modal:
```
┌────────────────────────────────────┐
│ Edit Location                  [X] │
├────────────────────────────────────┤
│                                    │
│ 📍 Location Name                   │
│ [Paris, France              ]      │
│                                    │
│ URL Slug                           │
│ [paris-france               ]      │
│                                    │
│ 🌍 Country      Region             │
│ [France    ]    [Île-de-France]    │
│                                    │
│ Latitude        Longitude          │
│ [48.8566   ]    [2.3522       ]    │
│                                    │
│ 📄 Description                     │
│ [                           ]      │
│ [                           ]      │
│                                    │
│ ☑ Published (visible to public)    │
│ ☐ Featured (show on homepage)      │
│                                    │
├────────────────────────────────────┤
│ [🗑️ Delete]    [Cancel] [💾 Save] │
└────────────────────────────────────┘
```

## Security

### Role-Based Access:
- Only users with `profile.role === 'admin'` can see/use this feature
- Regular users see normal location cards
- Database operations use authenticated Supabase client

### Permissions:
- Edit: Updates location in `locations` table
- Delete: Removes location (with CASCADE for related data)

## Testing

### Test as Admin:
1. Make sure your user has `role: 'admin'` in profiles table:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```
2. Go to `/locations`
3. See three-dots menu on each card
4. Click to edit a location
5. Make changes and save
6. Verify changes appear immediately

### Test as Regular User:
1. Sign in as non-admin user
2. Go to `/locations`
3. Should NOT see three-dots menu
4. Should see normal rating badge instead

## Database Schema

### Profiles Table (needs role column):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE profiles ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin', 'moderator'));
```

### Locations Table:
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100),
  region VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Future Enhancements

### Phase 2 (Optional):
- [ ] Bulk edit multiple locations
- [ ] Location image upload in modal
- [ ] Activity/Restaurant quick add
- [ ] Location analytics in modal
- [ ] Duplicate location feature
- [ ] Location history/audit log

### Phase 3 (Optional):
- [ ] Inline editing (edit directly on card)
- [ ] Drag-to-reorder locations
- [ ] Quick filters (published/unpublished)
- [ ] Export location data
- [ ] Import locations from CSV

## Troubleshooting

### "Three-dots menu not showing"
- Check if user has `role: 'admin'` in profiles table
- Verify profile is loaded in useAuth hook
- Check browser console for errors

### "Edit modal not opening"
- Check browser console for errors
- Verify LocationEditModal is imported
- Check if onEdit callback is passed correctly

### "Changes not saving"
- Check Supabase connection
- Verify user has UPDATE permissions on locations table
- Check browser console for API errors

### "Delete not working"
- Verify CASCADE is set up for related tables
- Check if location has dependencies
- Review RLS policies on locations table

---

**Admin location editing is now fully functional! 🎉**

