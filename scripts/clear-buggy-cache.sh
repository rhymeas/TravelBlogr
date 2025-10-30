#!/bin/bash

# Clear buggy Upstash cache keys with ::: pattern
# These were created when options = { tripType: undefined, context: undefined }

UPSTASH_URL="https://massive-colt-27827.upstash.io"
UPSTASH_TOKEN="AWyzAAIncDI5ZjI1MmU4ZGIxZTg0OTUwYWJmMTVjMjZjZGU1NWE5Y3AyMjc4Mjc"

echo "🔍 Finding buggy cache keys with ::: pattern..."

# Get all keys with ::: pattern
KEYS=$(curl -s "${UPSTASH_URL}/keys/activity:*:::*" \
  -H "Authorization: Bearer ${UPSTASH_TOKEN}" \
  | jq -r '.result[]')

COUNT=$(echo "$KEYS" | wc -l | tr -d ' ')

echo "Found $COUNT buggy cache keys"
echo ""

if [ "$COUNT" -eq "0" ]; then
  echo "✅ No buggy cache keys found!"
  exit 0
fi

echo "Sample keys:"
echo "$KEYS" | head -5
echo "..."
echo ""

read -p "Delete all $COUNT keys? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo "🗑️  Deleting $COUNT keys..."

# Delete each key
DELETED=0
while IFS= read -r key; do
  if [ -n "$key" ]; then
    curl -s "${UPSTASH_URL}/del/${key}" \
      -H "Authorization: Bearer ${UPSTASH_TOKEN}" > /dev/null
    DELETED=$((DELETED + 1))
    if [ $((DELETED % 10)) -eq 0 ]; then
      echo "  Deleted $DELETED/$COUNT keys..."
    fi
  fi
done <<< "$KEYS"

echo "✅ Deleted $DELETED keys!"
echo ""
echo "Remaining activity keys:"
curl -s "${UPSTASH_URL}/keys/activity:*" \
  -H "Authorization: Bearer ${UPSTASH_TOKEN}" \
  | jq -r '.result | length'

