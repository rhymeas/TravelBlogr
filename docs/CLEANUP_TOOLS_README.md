# TravelBlogr Location Cleanup Tools

## Overview

Complete toolkit for cleaning up location names in the TravelBlogr database. Removes region/country concatenation that was added during earlier auto-fill operations.

## Problem Statement

Older locations have concatenated names:
- ❌ "Banff Lake Louise Canada"
- ❌ "Hallstatt Austria"  
- ❌ "Santorini Greece"

Should be:
- ✅ "Banff Lake Louise"
- ✅ "Hallstatt"
- ✅ "Santorini"

## Solution

Three complementary tools for different use cases:

| Tool | Use Case | Access |
|------|----------|--------|
| **Web UI** | Manual cleanup, visual preview | `/test/location-cleanup` |
| **API** | Programmatic access, integration | `POST /api/admin/cleanup-locations` |
| **Script** | Batch processing, automation | `npx ts-node scripts/cleanup-location-names.ts` |

## Quick Start

### 1. Web UI (Recommended for First-Time Users)

```
1. Go to http://localhost:3000/test/location-cleanup
2. Adjust options (dry-run, limit, verbose)
3. Click "Preview Cleanup" to see changes
4. Review results
5. Click "Apply Cleanup" to make changes
```

### 2. API (For Integration)

```bash
# Preview changes
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=50"

# Apply changes
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false"
```

### 3. Script (For Automation)

```bash
# Preview changes
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 50

# Apply changes
npx ts-node scripts/cleanup-location-names.ts
```

## Features

✅ **Three Access Methods** - Web UI, API, CLI script
✅ **Dry-Run Mode** - Preview changes without modifying database
✅ **Batch Processing** - Limit to N locations for testing
✅ **Verbose Logging** - Optional detailed output
✅ **Admin Authentication** - Secure access control
✅ **Error Handling** - Comprehensive error reporting
✅ **Idempotent** - Safe to run multiple times
✅ **Fast** - Processes 100+ locations in seconds

## Cleanup Logic

The script removes:

1. **Country suffix** - "Banff Lake Louise Canada" → "Banff Lake Louise"
2. **Region suffix** - "Banff, Alberta Canada" → "Banff"
3. **Trailing punctuation** - "Hallstatt, " → "Hallstatt"

Preserves already-clean names (no change if not needed).

## Workflow

### Step 1: Preview Changes

Always start with dry-run:

```bash
# Web UI: Check "Dry Run" checkbox
# API: Add ?dryRun=true
# Script: Add --dry-run flag
```

### Step 2: Review Results

Check the output:
- ✅ Total locations
- ✅ How many need cleanup
- ✅ Sample of changes
- ✅ Cleanup rate

### Step 3: Apply Changes

Once satisfied:

```bash
# Web UI: Uncheck "Dry Run" checkbox
# API: Add ?dryRun=false
# Script: Remove --dry-run flag
```

### Step 4: Verify

Confirm in database:

```sql
SELECT id, name, country, region 
FROM locations 
WHERE name LIKE '% %' 
LIMIT 10;
```

## Options

### Dry Run
- **Default**: true (preview only)
- **Purpose**: Show changes without modifying database
- **Web UI**: Checkbox "Dry Run"
- **API**: `?dryRun=true` or `?dryRun=false`
- **Script**: `--dry-run` flag

### Limit
- **Default**: null (all locations)
- **Purpose**: Process only N locations
- **Web UI**: Number input "Limit"
- **API**: `?limit=50`
- **Script**: `--limit 50`

### Verbose
- **Default**: false (summary only)
- **Purpose**: Show detailed logs
- **Web UI**: Checkbox "Verbose Output"
- **API**: `?verbose=true`
- **Script**: `--verbose` flag

## Examples

### Clean first 50 locations (preview)
```bash
# Web UI
Set limit to 50, check dry-run, click "Preview Cleanup"

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=50"

# Script
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 50
```

### Clean all locations (apply changes)
```bash
# Web UI
Leave limit empty, uncheck dry-run, click "Apply Cleanup"

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false"

# Script
npx ts-node scripts/cleanup-location-names.ts
```

### Clean with verbose output
```bash
# Web UI
Check "Verbose Output", click "Preview Cleanup"

# API
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&verbose=true"

# Script
npx ts-node scripts/cleanup-location-names.ts --dry-run --verbose
```

## Performance

- **Small** (< 100 locations): < 5 seconds
- **Medium** (100-1000 locations): 10-30 seconds
- **Large** (1000+ locations): 1-2 minutes

## Safety

✅ Dry-run mode never modifies database
✅ Each location validated before update
✅ Failed updates logged and reported
✅ Original names preserved in logs
✅ Can be run multiple times (idempotent)
✅ Admin authentication required
✅ Comprehensive error handling

## Files

```
scripts/
  └── cleanup-location-names.ts          # CLI script

apps/web/app/api/admin/
  └── cleanup-locations/
      └── route.ts                       # API endpoint

apps/web/app/test/
  └── location-cleanup/
      └── page.tsx                       # Web UI

docs/
  ├── CLEANUP_TOOLS_README.md            # This file
  ├── LOCATION_CLEANUP_GUIDE.md          # Detailed guide
  └── LOCATION_CLEANUP_SUMMARY.md        # Summary
```

## Troubleshooting

### "Unauthorized" Error
- Ensure logged in as admin
- Check email in admin whitelist

### "Forbidden" Error
- Account lacks admin permissions
- Contact admin for access

### Script Won't Run
```bash
npm install -g ts-node
# or
npx ts-node scripts/cleanup-location-names.ts
```

### Database Connection Error
- Check `.env.local` has Supabase credentials
- Verify network connectivity
- Ensure Supabase project accessible

## Automation

Run cleanup automatically on schedule:

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * cd /path/to/TravelBlogr && npx ts-node scripts/cleanup-location-names.ts >> /var/log/location-cleanup.log 2>&1
```

## Support

For issues:
1. Check detailed guide: `docs/LOCATION_CLEANUP_GUIDE.md`
2. Review script logs
3. Contact development team

## Next Steps

1. **Test with small batch** - Run with `--limit 50` first
2. **Review results** - Check preview output
3. **Apply to all** - Run without limit when confident
4. **Monitor** - Watch for issues
5. **Verify** - Query database to confirm

---

**Last Updated**: 2025-10-24
**Status**: ✅ Ready for Production

