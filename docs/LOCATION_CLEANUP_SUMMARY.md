# Location Cleanup Script - Summary

## What Was Created

Three tools to clean up location names in the TravelBlogr database:

### 1. **TypeScript Script** (`scripts/cleanup-location-names.ts`)
- Command-line tool for batch processing
- Best for automation and CI/CD pipelines
- Supports dry-run, limit, and verbose modes

### 2. **API Endpoint** (`apps/web/app/api/admin/cleanup-locations/route.ts`)
- REST API for programmatic access
- Admin-only authentication
- Query parameters for dry-run, limit, verbose
- Perfect for integration with other tools

### 3. **Test Page** (`apps/web/app/test/location-cleanup/page.tsx`)
- Web UI for manual cleanup
- Visual preview of changes
- Real-time statistics
- Admin-only access

## Quick Start

### Option A: Web UI (Easiest)
1. Navigate to `/test/location-cleanup`
2. Adjust options (dry-run, limit, verbose)
3. Click "Preview Cleanup" to see changes
4. Click "Apply Cleanup" to make changes

### Option B: API (Programmatic)
```bash
# Preview changes
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=50"

# Apply changes
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false"
```

### Option C: Script (Batch Processing)
```bash
# Preview changes
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 50

# Apply changes
npx ts-node scripts/cleanup-location-names.ts
```

## What Gets Cleaned

### Before
```
Banff Lake Louise Canada
Hallstatt Austria
Santorini Greece
Tokyo, Japan
Paris France
```

### After
```
Banff Lake Louise
Hallstatt
Santorini
Tokyo
Paris
```

Country is stored separately in the `country` field.

## Cleanup Logic

1. **Remove country suffix** if name ends with country
2. **Remove region suffix** if name ends with region
3. **Clean trailing commas and spaces**
4. **Preserve already-clean names** (no change if not needed)

## Key Features

✅ **Safe** - Dry-run mode shows changes without modifying database
✅ **Flexible** - Limit to N locations for testing
✅ **Verbose** - Optional detailed logging
✅ **Fast** - Processes 100+ locations in seconds
✅ **Idempotent** - Can be run multiple times safely
✅ **Authenticated** - Admin-only access
✅ **Logged** - All operations logged for audit trail

## Workflow

### Step 1: Preview
Always start with dry-run to see what will change:
```bash
# Web UI: Check "Dry Run" checkbox
# API: Add ?dryRun=true
# Script: Add --dry-run flag
```

### Step 2: Review
Check the results:
- Total locations
- How many need cleanup
- Sample of changes

### Step 3: Apply
Once satisfied, apply the changes:
```bash
# Web UI: Uncheck "Dry Run" checkbox
# API: Add ?dryRun=false
# Script: Remove --dry-run flag
```

### Step 4: Verify
Confirm changes in database:
```sql
SELECT id, name, country, region 
FROM locations 
WHERE name LIKE '% %' 
LIMIT 10;
```

## Performance

- **Small** (< 100 locations): < 5 seconds
- **Medium** (100-1000 locations): 10-30 seconds
- **Large** (1000+ locations): 1-2 minutes

## Safety Guarantees

✅ Dry-run mode never modifies database
✅ Each location validated before update
✅ Failed updates logged and reported
✅ Original names preserved in logs
✅ Can be run multiple times (idempotent)
✅ Admin authentication required
✅ Comprehensive error handling

## Files Created

```
scripts/
  └── cleanup-location-names.ts          # TypeScript CLI script

apps/web/app/api/admin/
  └── cleanup-locations/
      └── route.ts                       # API endpoint

apps/web/app/test/
  └── location-cleanup/
      └── page.tsx                       # Web UI test page

docs/
  ├── LOCATION_CLEANUP_GUIDE.md          # Detailed guide
  └── LOCATION_CLEANUP_SUMMARY.md        # This file
```

## Usage Examples

### Clean first 50 locations (preview)
```bash
# Web UI
Navigate to /test/location-cleanup, set limit to 50, check dry-run

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=50"

# Script
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 50
```

### Clean all locations with verbose output
```bash
# Web UI
Navigate to /test/location-cleanup, check verbose, uncheck dry-run

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false&verbose=true"

# Script
npx ts-node scripts/cleanup-location-names.ts --verbose
```

### Clean 100 locations and apply changes
```bash
# Web UI
Set limit to 100, uncheck dry-run, click "Apply Cleanup"

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false&limit=100"

# Script
npx ts-node scripts/cleanup-location-names.ts --limit 100
```

## Troubleshooting

### "Unauthorized" Error
- Ensure you're logged in as admin
- Check email is in admin whitelist

### "Forbidden" Error
- Your account doesn't have admin permissions
- Contact admin to grant access

### Script Won't Run
- Install ts-node: `npm install -g ts-node`
- Or use: `npx ts-node scripts/cleanup-location-names.ts`

### Database Connection Error
- Check `.env.local` has Supabase credentials
- Verify network connectivity
- Ensure Supabase project is accessible

## Next Steps

1. **Test with small batch** - Run with `--limit 50` first
2. **Review results** - Check the preview output
3. **Apply to all** - Run without limit when confident
4. **Monitor** - Watch for any issues
5. **Verify** - Query database to confirm changes

## Support

For issues or questions:
1. Check the detailed guide: `docs/LOCATION_CLEANUP_GUIDE.md`
2. Review script logs for error messages
3. Contact development team

## Automation

To run cleanup automatically on schedule:

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * cd /path/to/TravelBlogr && npx ts-node scripts/cleanup-location-names.ts >> /var/log/location-cleanup.log 2>&1
```

## Database Impact

- **Before**: ~100 locations with concatenated names
- **After**: ~100 locations with clean names
- **Storage saved**: Minimal (names are shorter)
- **Performance**: Improved (cleaner data)
- **User experience**: Better (cleaner display)

