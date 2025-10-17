# Implementation Quick Reference Guide
## CMS UX - Location Copying & Attribution System

---

## 🎯 Core Concepts

### Location Copying Flow
```
User discovers location in community
         ↓
Clicks "Copy to Trip" button
         ↓
LocationCopyModal opens
         ↓
User selects target trip
         ↓
POST /api/locations/{id}/copy
         ↓
New location instance created with:
- original_location_id (reference to source)
- creator_id (original creator)
- current_owner_id (trip owner)
- visibility_status (private/public/shared)
         ↓
Location added to trip
         ↓
Attribution automatically displayed
```

### Location Editing Flow
```
User opens copied location in trip
         ↓
Clicks "Edit" button
         ↓
LocationEditModal opens showing:
- Original location (read-only)
- User's version (editable)
- Locked fields (permission-based)
         ↓
User makes changes
         ↓
PATCH /api/locations/{id}/edit
         ↓
Changes validated against permissions
         ↓
Version history entry created
         ↓
Changes saved
         ↓
Attribution updated with modification chain
```

---

## 📊 Database Schema Changes

### New Fields in `locations` Table
```sql
original_location_id UUID REFERENCES locations(id)
creator_id UUID REFERENCES auth.users(id)
current_owner_id UUID REFERENCES auth.users(id)
visibility_status VARCHAR(20) -- 'private', 'public', 'shared'
modification_permissions JSONB -- {"name": true, "notes": true, ...}
is_deleted BOOLEAN DEFAULT FALSE
```

### New Tables

**location_versions**
```sql
id UUID PRIMARY KEY
location_id UUID REFERENCES locations(id)
version_number INTEGER
created_by UUID REFERENCES auth.users(id)
changes JSONB -- {"field": "old_value" -> "new_value"}
created_at TIMESTAMPTZ
```

**location_attribution**
```sql
id UUID PRIMARY KEY
location_id UUID REFERENCES locations(id)
original_creator_id UUID REFERENCES auth.users(id)
current_owner_id UUID REFERENCES auth.users(id)
modification_chain JSONB -- [{user, timestamp, changes}, ...]
created_at TIMESTAMPTZ
```

---

## 🔌 API Endpoints

### Copy Location
```
POST /api/locations/{id}/copy

Request:
{
  "tripId": "uuid",
  "customizations": {
    "name": "optional",
    "notes": "optional"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "new-location-id",
    "original_location_id": "original-id",
    "trip_id": "trip-id"
  }
}
```

### Edit Location
```
PATCH /api/locations/{id}/edit

Request:
{
  "updates": {
    "name": "new name",
    "notes": "new notes",
    "duration": "2 hours"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "location-id",
    "version": 2,
    "updated_at": "2025-10-16T..."
  }
}
```

### Get Version History
```
GET /api/locations/{id}/versions

Response:
{
  "success": true,
  "data": [
    {
      "version": 1,
      "created_by": "creator-name",
      "created_at": "2025-10-01T...",
      "changes": {"name": "Original"}
    },
    {
      "version": 2,
      "created_by": "user-name",
      "created_at": "2025-10-16T...",
      "changes": {"notes": "Added notes"}
    }
  ]
}
```

---

## 🎨 Component Structure

### LocationCopyModal
```tsx
<LocationCopyModal
  location={location}
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={onSuccess}
/>
```

**Props:**
- `location`: Location object to copy
- `isOpen`: Modal visibility
- `onClose`: Close handler
- `onSuccess`: Success callback

**Features:**
- Location preview
- Trip selector
- Permission display
- Copy confirmation

### LocationEditModal
```tsx
<LocationEditModal
  location={location}
  isOpen={isOpen}
  onClose={onClose}
  onSave={onSave}
/>
```

**Props:**
- `location`: Location to edit
- `isOpen`: Modal visibility
- `onClose`: Close handler
- `onSave`: Save callback

**Features:**
- Original vs. user version
- Locked field indicators
- Real-time validation
- Version tracking

### AttributionDisplay
```tsx
<AttributionDisplay
  location={location}
  showHistory={true}
/>
```

**Props:**
- `location`: Location with attribution
- `showHistory`: Show version history

**Features:**
- Creator badge
- Modification chain
- Timestamps
- Creator link

---

## 🔐 Permission Levels

### Full Public
- Anyone can copy
- Anyone can modify all fields
- No restrictions

### Copy with Attribution
- Anyone can copy
- Can modify custom fields only
- Requires creator credit
- Core fields locked

### Copy No Modify
- Anyone can copy
- Cannot edit core details
- Only notes/custom fields editable
- Locked fields clearly marked

### View Only
- Can see location
- Cannot copy
- Cannot edit
- Read-only access

### Private
- Not visible to community
- Only owner can see
- Cannot be copied
- Personal use only

---

## 📋 Checklist for Implementation

### Week 1: Database
- [ ] Create migration file
- [ ] Add new fields to locations table
- [ ] Create location_versions table
- [ ] Create location_attribution table
- [ ] Add indexes
- [ ] Add RLS policies
- [ ] Test in Supabase

### Week 2: API
- [ ] Implement POST /api/locations/{id}/copy
- [ ] Implement PATCH /api/locations/{id}/edit
- [ ] Implement GET /api/locations/{id}/versions
- [ ] Update GET /api/locations/search
- [ ] Add error handling
- [ ] Write unit tests

### Week 3: Frontend
- [ ] Build LocationCopyModal
- [ ] Build LocationEditModal
- [ ] Build AttributionDisplay
- [ ] Update LocationCard
- [ ] Add copy button
- [ ] Add edit button

### Week 4: Integration
- [ ] Create service layer
- [ ] Integration testing
- [ ] UAT testing
- [ ] Documentation
- [ ] Deployment

---

## 🚀 Deployment Steps

1. **Pre-deployment:**
   - [ ] Run all tests
   - [ ] Check TypeScript compilation
   - [ ] Review code changes
   - [ ] Backup database

2. **Deployment:**
   - [ ] Deploy database migration
   - [ ] Deploy API endpoints
   - [ ] Deploy frontend components
   - [ ] Verify in staging

3. **Post-deployment:**
   - [ ] Monitor error logs
   - [ ] Check performance metrics
   - [ ] Verify user flows
   - [ ] Collect feedback

---

## 📞 Support & Troubleshooting

### Common Issues

**Copy fails with "Permission denied"**
- Check RLS policies
- Verify user authentication
- Check trip ownership

**Edit shows "Field locked"**
- Check permission level
- Verify modification_permissions JSONB
- Check user role

**Attribution not showing**
- Check location_attribution table
- Verify creator_id is set
- Check RLS policies

**Version history empty**
- Check location_versions table
- Verify version tracking is enabled
- Check timestamps

---

## 📚 Documentation Links

- **API Docs:** `/docs/API_LOCATION_COPY.md`
- **Component Docs:** `/docs/COMPONENTS_LOCATION.md`
- **Database Schema:** `/infrastructure/database/migrations/008_*.sql`
- **UX Evaluation:** `/CMS_UX_EVALUATION.md`
- **Implementation Plan:** `/CMS_UX_IMPLEMENTATION_PLAN.md`

---

## 🎓 Learning Resources

- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Next.js API Routes:** https://nextjs.org/docs/api-routes/introduction
- **React Hooks:** https://react.dev/reference/react/hooks
- **TypeScript:** https://www.typescriptlang.org/docs/

---

## 📞 Contact & Questions

**Questions about implementation?**
- Check this quick reference first
- Review detailed task breakdown
- Consult UX evaluation document
- Ask team lead

**Found a bug?**
- Document the issue
- Create GitHub issue
- Add to sprint backlog
- Assign to developer

---

**Last Updated:** 2025-10-16  
**Version:** 1.0  
**Status:** Ready for Implementation

