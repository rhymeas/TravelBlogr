# Admin Location Management Features

## Overview

This document describes the new admin-only features for managing locations in TravelBlogr:

1. **Refetch & Repopulate Button** - On location detail pages
2. **Delete Location Button** - In location card menus on /locations page
3. **Smart Fallback Image System** - Automatically fetches high-quality images

## Features

### 1. Refetch & Repopulate Location Data

**Location**: Location detail pages (`/locations/[slug]`)

**Button**: Admin-only "Refetch Data" button (amber/yellow styling)

**Functionality**:
- Refetches all location data using the new smart fallback system
- Updates featured image (Brave → Reddit → Backend Cache → User Uploads)
- Updates gallery images (20 images with smart fallback)
- Updates description from WikiVoyage/Wikipedia
- Updates restaurants and activities
- Repopulates the entire location with fresh data
- Prevents duplicate locations

**How to Use**:
1. Navigate to any location detail page
2. If you're an admin, you'll see the "Refetch Data" button (amber color)
3. Click the button
4. Confirm the action in the dialog
5. Wait for the refetch to complete
6. Page will refresh automatically with updated data

**API Endpoint**: `POST /api/admin/refetch-location`

**Request Body**:
```json
{
  "locationId": "uuid",
  "locationName": "Location Name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Location has been refetched and repopulated",
  "results": {
    "images": 20,
    "restaurants": 5,
    "activities": 8,
    "description": "Updated"
  }
}
```

### 2. Delete Location

**Location**: Location cards on `/locations` page (both grid and list views)

**Button**: Three-dot menu → "Delete Location" (red text)

**Functionality**:
- Admin-only delete function
- Deletes location and all related data:
  - Restaurants
  - Activities
  - Location images
  - Ratings
  - Comments
- Cascade deletion ensures data integrity
- Refreshes page after deletion

**How to Use**:
1. Navigate to `/locations` page
2. Find the location you want to delete
3. Click the three-dot menu (⋮) on the location card
4. Click "Delete Location"
5. Confirm the action in the dialog
6. Location will be deleted and page will refresh

**API Endpoint**: `POST /api/admin/delete-location`

**Request Body**:
```json
{
  "locationId": "uuid",
  "locationName": "Location Name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Location has been deleted",
  "deletedLocation": {
    "id": "uuid",
    "name": "Location Name",
    "slug": "location-slug"
  }
}
```

## Image Fetching Priority

The refetch system uses a smart fallback hierarchy:

1. **Brave Search API** (Primary) - Best quality images
2. **Reddit Ultra** (Secondary) - High-quality community images
3. **Backend Cache** (Tertiary) - Existing images < 1 month old
4. **User-Uploaded Images** (Quaternary) - Community contributions

This ensures locations always have high-quality images without placeholders.

## Admin Authentication

Both features require admin authentication. Admin users are identified by:
- Email in whitelist: `admin@travelblogr.com`, `rimas.albert@googlemail.com`
- Email containing "admin"

The `isAdmin()` function in `@/lib/utils/adminCheck.ts` handles this check.

## Implementation Details

### Files Modified

1. **apps/web/app/api/admin/refetch-location/route.ts** (NEW)
   - Handles refetch requests
   - Validates admin permissions
   - Fetches fresh data using smart fallback system
   - Updates database

2. **apps/web/app/api/admin/delete-location/route.ts** (NEW)
   - Handles delete requests
   - Validates admin permissions
   - Cascade deletes related data
   - Cleans up database

3. **apps/web/components/locations/LocationDetailTemplate.tsx**
   - Added "Refetch Data" button (admin-only)
   - Added `handleRefetch()` function
   - Added state management for refetch loading

4. **apps/web/components/locations/LocationsGrid.tsx**
   - Added "Delete Location" button to three-dot menus
   - Added `handleDelete()` function
   - Updated both grid and list view components
   - Added state management for delete loading

### Cache Invalidation

After refetch or delete operations:
1. Upstash Redis cache is invalidated (if applicable)
2. Next.js cache is revalidated
3. Page is refreshed to show updated data

## Error Handling

Both APIs include comprehensive error handling:
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

Errors are displayed to the user via alert dialogs.

## Testing

To test these features:

1. **Refetch API**:
   ```bash
   curl -X POST http://localhost:3002/api/admin/refetch-location \
     -H "Content-Type: application/json" \
     -d '{"locationId": "uuid", "locationName": "Test Location"}'
   ```

2. **Delete API**:
   ```bash
   curl -X POST http://localhost:3002/api/admin/delete-location \
     -H "Content-Type: application/json" \
     -d '{"locationId": "uuid", "locationName": "Test Location"}'
   ```

## Future Enhancements

- Batch refetch for multiple locations
- Scheduled refetch jobs
- Duplicate detection and merging
- Audit logging for admin actions
- Undo functionality for deletions

