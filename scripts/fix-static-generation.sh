#!/bin/bash

# Fix static generation errors by adding 'export const dynamic = "force-dynamic"' to all client pages

echo "🔧 Fixing static generation errors..."

# Find all page.tsx files that start with 'use client' but don't have 'export const dynamic'
find apps/web/app -name "page.tsx" -type f | while read file; do
  # Check if file starts with 'use client'
  if head -n 1 "$file" | grep -q "'use client'"; then
    # Check if it already has 'export const dynamic'
    if ! grep -q "export const dynamic" "$file"; then
      echo "  Fixing: $file"
      # Create temp file with the fix
      {
        echo "'use client'"
        echo ""
        echo "export const dynamic = 'force-dynamic'"
        echo ""
        tail -n +2 "$file"
      } > "$file.tmp"
      mv "$file.tmp" "$file"
    fi
  fi
done

echo "✅ Done! All client pages now have dynamic export."

