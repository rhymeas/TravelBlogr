# Cleanup Script: Remove "Travel to" Locations

## Overview

This script removes all locations with "Travel to" in their titles from the database. It focuses **ONLY on /locations cards** and their direct user interactions.

**EXCLUDES:**
- ❌ Blog posts (`location_posts`) - **NOT deleted** - Blog content is preserved
- ❌ Trips library data - **NOT affected**
- ❌ Private trips - **NOT affected**

## What Gets Deleted

The script removes records from the following tables:

1. **`locations`** - Main location records (/locations cards)
2. **`location_ratings`** - User ratings on location pages
3. **`location_views`** - Pixel tracking on location pages
4. **`location_comments`** - Community comments on location pages
5. **`location_media`** - User-uploaded images on location pages
6. **`location_tips`** - User tips on location pages
7. **`location_category_assignments`** - Category relationships
8. **`user_locations`** - User wishlists/customizations

## Prerequisites

1. **Environment Variables** - Ensure these are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies** - Install required packages:
   ```bash
   npm install
   ```

## Usage

### Dry Run (Recommended First)

Preview what will be deleted without actually deleting anything:

```bash
npm run cleanup:travel-to-locations:dry-run
```

This will:
- ✅ Show all locations that match "Travel to"
- ✅ Count all related records
- ✅ Display total records to be deleted
- ❌ NOT delete any data

### Execute Deletion (With Confirmation)

Delete locations with interactive confirmation:

```bash
npm run cleanup:travel-to-locations
```

This will:
1. Find all "Travel to" locations
2. Count related records
3. Display summary
4. **Ask for confirmation** (y/N)
5. Delete if confirmed

### Execute Deletion (Skip Confirmation)

⚠️ **USE WITH EXTREME CAUTION** - Deletes without asking:

```bash
npm run cleanup:travel-to-locations -- --confirm
```

## Example Output

### Dry Run Example

```
╔════════════════════════════════════════════════════════════════╗
║  Cleanup Script: Remove "Travel to" Locations                 ║
╚════════════════════════════════════════════════════════════════╝

🔍 DRY RUN MODE - No data will be deleted

🔍 Searching for locations with "Travel to" in their titles...

📊 Found 3 location(s) to delete:

1. Travel to Paris
   Slug: travel-to-paris
   Country: France
   Created: 1/15/2025
   Ratings: 5 | Views: 120

2. Travel to Tokyo
   Slug: travel-to-tokyo
   Country: Japan
   Created: 1/20/2025
   Ratings: 3 | Views: 85

3. Travel to New York
   Slug: travel-to-new-york
   Country: United States
   Created: 1/25/2025
   Ratings: 8 | Views: 200

📊 Counting related records...

📊 Total records to be deleted:

   Locations:                     3
   Location Ratings:              16
   Location Views:                405
   Location Comments:             12
   Location Media:                24
   Location Tips:                 9
   Location Category Assignments: 8
   User Locations:                15
   ─────────────────────────────────────────────────
   TOTAL:                         492

   ℹ️  NOTE: Blog posts (location_posts) are NOT deleted

✅ DRY RUN COMPLETE - No data was deleted
```

### Actual Deletion Example

```
╔════════════════════════════════════════════════════════════════╗
║  Cleanup Script: Remove "Travel to" Locations                 ║
╚════════════════════════════════════════════════════════════════╝

🔍 Searching for locations with "Travel to" in their titles...

📊 Found 3 location(s) to delete:

[... location list ...]

📊 Total records to be deleted:

   Locations:                     3
   Location Ratings:              16
   Location Views:                405
   Location Comments:             12
   Location Media:                24
   Location Tips:                 9
   Location Category Assignments: 8
   User Locations:                15
   ─────────────────────────────────────────────────
   TOTAL:                         492

   ℹ️  NOTE: Blog posts (location_posts) are NOT deleted

⚠️  WARNING: This action cannot be undone!

Are you sure you want to delete these locations? (y/N): y

🗑️  Deleting locations...

   Deleting: Travel to Paris...
   ✅ Deleted successfully

   Deleting: Travel to Tokyo...
   ✅ Deleted successfully

   Deleting: Travel to New York...
   ✅ Deleted successfully

╔════════════════════════════════════════════════════════════════╗
║  Deletion Summary                                              ║
╚════════════════════════════════════════════════════════════════╝

✅ Successfully deleted 3 location(s)

📊 Records deleted:

   Locations:                     3
   Location Ratings:              16
   Location Views:                405
   Location Comments:             12
   Location Media:                24
   Location Tips:                 9
   Location Category Assignments: 8
   User Locations:                15
   ─────────────────────────────────────────────────
   TOTAL:                         492

   ℹ️  NOTE: Blog posts (location_posts) were preserved

✅ Script completed successfully
```

## Safety Features

1. **Dry Run Mode** - Test before executing
2. **Interactive Confirmation** - Requires explicit "y" or "yes"
3. **Detailed Preview** - Shows exactly what will be deleted
4. **Service Role Key** - Bypasses RLS for complete cleanup
5. **Transaction Safety** - Each location deleted independently
6. **Error Handling** - Continues on errors, reports failures

## Common Scenarios

### Scenario 1: Check if any "Travel to" locations exist

```bash
npm run cleanup:travel-to-locations:dry-run
```

If output shows "No locations found", you're good!

### Scenario 2: Clean up test data

```bash
# First, preview
npm run cleanup:travel-to-locations:dry-run

# Then, delete with confirmation
npm run cleanup:travel-to-locations
```

### Scenario 3: Automated cleanup (CI/CD)

```bash
# Skip confirmation for automated scripts
npm run cleanup:travel-to-locations -- --confirm
```

## Troubleshooting

### Error: Missing environment variables

**Problem:**
```
❌ Missing required environment variables:
   SUPABASE_URL: ❌
   SUPABASE_SERVICE_ROLE_KEY: ❌
```

**Solution:**
1. Check `.env.local` file exists
2. Ensure variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Restart terminal/IDE

### Error: Permission denied

**Problem:**
```
❌ Error fetching locations: permission denied for table locations
```

**Solution:**
- Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Service role key bypasses RLS policies

### Error: Table does not exist

**Problem:**
```
❌ Error: relation "location_ratings" does not exist
```

**Solution:**
- Run database migrations first
- Some tables may not exist in your schema (script handles this gracefully)

## Best Practices

1. **Always run dry-run first** - Preview before deleting
2. **Backup database** - Take snapshot before bulk deletions
3. **Run during low traffic** - Minimize user impact
4. **Monitor logs** - Check for errors during execution
5. **Verify results** - Query database after to confirm

## Database Impact

### Performance
- Deletes are executed sequentially (not in parallel)
- Each location deletion is independent
- Typical speed: ~1-2 seconds per location

### Cascade Deletes
The script manually deletes related records because:
- Ensures complete cleanup
- Provides detailed statistics
- Handles tables without CASCADE constraints

## Related Scripts

- `scripts/enrich-location-activities.ts` - Enrich location data
- `scripts/upstash-cache-inspector.ts` - Manage cache
- `scripts/enhance-existing-trips.ts` - Enhance trip data

## Support

For issues or questions:
1. Check this README
2. Review script output/errors
3. Check Supabase dashboard for data state
4. Contact development team

---

**Last Updated:** 2025-01-31
**Script Version:** 1.0.0
**Author:** TravelBlogr Development Team

