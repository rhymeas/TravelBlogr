# Location Name Cleanup Guide

## Overview

This guide explains how to clean up location names in the TravelBlogr database by removing region/country concatenation that was added during earlier auto-fill operations.

### Problem

Older locations may have names like:
- "Banff Lake Louise Canada"
- "Hallstatt Austria"
- "Santorini Greece"

### Solution

Clean up to just the location name:
- "Banff Lake Louise"
- "Hallstatt"
- "Santorini"

With country stored separately in the `country` field.

## Two Methods

### Method 1: API Endpoint (Recommended for Web UI)

**Easiest way** - Use the admin API endpoint directly from the browser or curl.

#### Dry Run (Preview Changes)

```bash
curl -X POST http://localhost:3000/api/admin/cleanup-locations?dryRun=true \
  -H "Content-Type: application/json"
```

#### Live Run (Apply Changes)

```bash
curl -X POST http://localhost:3000/api/admin/cleanup-locations?dryRun=false \
  -H "Content-Type: application/json"
```

#### With Options

```bash
# Limit to 50 locations
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=50" \
  -H "Content-Type: application/json"

# Show verbose output
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&verbose=true" \
  -H "Content-Type: application/json"
```

#### Response Example

```json
{
  "success": true,
  "message": "DRY RUN: Would update 42 locations",
  "results": {
    "total": 100,
    "needsCleanup": 42,
    "alreadyClean": 58,
    "updated": 0,
    "failed": 0,
    "changes": [
      {
        "id": "uuid-1",
        "oldName": "Banff Lake Louise Canada",
        "newName": "Banff Lake Louise",
        "changed": true,
        "reason": "Removed country suffix: \"Canada\""
      },
      {
        "id": "uuid-2",
        "oldName": "Hallstatt Austria",
        "newName": "Hallstatt",
        "changed": true,
        "reason": "Removed country suffix: \"Austria\""
      }
    ]
  },
  "dryRun": true
}
```

### Method 2: TypeScript Script (For Batch Processing)

**Best for** - Large-scale cleanup, automation, or CI/CD pipelines.

#### Prerequisites

```bash
# Install dependencies (if not already installed)
npm install ts-node typescript @types/node
```

#### Dry Run (Preview)

```bash
npx ts-node scripts/cleanup-location-names.ts --dry-run
```

#### Live Run (Apply Changes)

```bash
npx ts-node scripts/cleanup-location-names.ts
```

#### With Options

```bash
# Limit to 50 locations
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 50

# Show verbose output
npx ts-node scripts/cleanup-location-names.ts --dry-run --verbose

# Combine options
npx ts-node scripts/cleanup-location-names.ts --limit 100 --verbose
```

#### Output Example

```
🧹 Location Name Cleanup Script
================================
Mode: 🔍 DRY RUN (no changes)
Limit: 50

📍 Fetching locations from database...
✅ Found 50 locations

📊 Analysis Results:
====================
Total locations: 50
Need cleanup: 42
Already clean: 8
Cleanup rate: 84.0%

📋 Sample of changes (first 5):
================================
1. "Banff Lake Louise Canada" → "Banff Lake Louise"
   Removed country suffix: "Canada"
2. "Hallstatt Austria" → "Hallstatt"
   Removed country suffix: "Austria"
3. "Santorini Greece" → "Santorini"
   Removed country suffix: "Greece"
4. "Tokyo, Japan" → "Tokyo"
   Removed country suffix: "Japan"
5. "Paris France" → "Paris"
   Removed country suffix: "France"
... and 37 more

🔍 DRY RUN: No changes made
Run without --dry-run to apply changes
```

## Cleanup Logic

The cleanup script uses the following logic:

1. **Check if name ends with country** - Remove it
   - "Banff Lake Louise Canada" → "Banff Lake Louise"

2. **Check if name ends with region** - Remove it
   - "Banff, Alberta Canada" → "Banff"

3. **Remove trailing commas and spaces**
   - "Hallstatt, " → "Hallstatt"

4. **Preserve already-clean names**
   - "Banff" → "Banff" (no change)

## Workflow

### Step 1: Preview Changes

Always start with a dry run to see what will be changed:

```bash
# API method
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=true&limit=100"

# Script method
npx ts-node scripts/cleanup-location-names.ts --dry-run --limit 100
```

### Step 2: Review Results

Check the output to ensure:
- ✅ Cleanup rate is reasonable (typically 50-90%)
- ✅ Sample changes look correct
- ✅ No unexpected removals

### Step 3: Apply Changes

Once satisfied with the preview, apply the changes:

```bash
# API method
curl -X POST "http://localhost:3000/api/admin/cleanup-locations?dryRun=false"

# Script method
npx ts-node scripts/cleanup-location-names.ts
```

### Step 4: Verify Results

Check the database to confirm changes were applied:

```sql
SELECT id, name, country, region 
FROM locations 
WHERE name LIKE '% %' 
LIMIT 10;
```

## Best Practices

1. **Always do a dry run first** - Never apply changes without previewing
2. **Start with a limit** - Test with `--limit 50` before running on all locations
3. **Run during off-peak hours** - Minimize impact on users
4. **Monitor the process** - Watch for errors or unexpected behavior
5. **Keep backups** - Ensure you have database backups before cleanup
6. **Use verbose mode** - For debugging or detailed logging

## Troubleshooting

### "Unauthorized" Error

**Problem**: API returns 401 Unauthorized

**Solution**: 
- Ensure you're logged in as an admin user
- Check that your email is in the admin whitelist (`admin@travelblogr.com`, `rimas.albert@googlemail.com`)

### "Forbidden" Error

**Problem**: API returns 403 Forbidden

**Solution**:
- Your user account doesn't have admin permissions
- Contact an admin to grant permissions

### Script Won't Run

**Problem**: `ts-node: command not found`

**Solution**:
```bash
npm install -g ts-node
# or
npx ts-node scripts/cleanup-location-names.ts
```

### Database Connection Error

**Problem**: Script can't connect to Supabase

**Solution**:
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that Supabase project is accessible
- Verify network connectivity

## Performance

- **Small cleanup** (< 100 locations): < 5 seconds
- **Medium cleanup** (100-1000 locations): 10-30 seconds
- **Large cleanup** (1000+ locations): 1-2 minutes

## Safety

- ✅ Dry run mode shows changes without modifying database
- ✅ Each location is validated before update
- ✅ Failed updates are logged and reported
- ✅ Original names are preserved in logs
- ✅ Can be run multiple times safely (idempotent)

## Automation

To run cleanup automatically on a schedule:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/TravelBlogr && npx ts-node scripts/cleanup-location-names.ts >> /var/log/location-cleanup.log 2>&1
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the script logs for error messages
3. Contact the development team

