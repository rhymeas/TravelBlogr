# 🧪 Manual Test Guide: Cached Counts

## Quick Tests in Supabase SQL Editor

---

## Test 1: Trip Likes ❤️

### **Step 1: Check Initial Count**
```sql
-- Pick any trip and check its like count
SELECT id, title, like_count 
FROM trips 
LIMIT 1;
```

**Expected:** You'll see a trip with `like_count` (probably 0)

---

### **Step 2: Add a Like**
```sql
-- Insert a like (replace the trip_id with the one from Step 1)
INSERT INTO trip_likes (trip_id, user_id)
VALUES (
  'YOUR_TRIP_ID_HERE',  -- Replace with actual trip ID
  auth.uid()
);
```

---

### **Step 3: Check Count Increased**
```sql
-- Check the same trip again
SELECT id, title, like_count 
FROM trips 
WHERE id = 'YOUR_TRIP_ID_HERE';
```

**Expected:** `like_count` should be **+1** from before! ✅

---

### **Step 4: Remove the Like**
```sql
-- Delete the like
DELETE FROM trip_likes 
WHERE trip_id = 'YOUR_TRIP_ID_HERE' 
  AND user_id = auth.uid();
```

---

### **Step 5: Check Count Decreased**
```sql
-- Check the trip one more time
SELECT id, title, like_count 
FROM trips 
WHERE id = 'YOUR_TRIP_ID_HERE';
```

**Expected:** `like_count` should be back to original! ✅

---

## Test 2: Trip Saves 🔖

### **Step 1: Check Initial Count**
```sql
SELECT id, title, save_count 
FROM trips 
LIMIT 1;
```

---

### **Step 2: Add a Save**
```sql
INSERT INTO trip_saves (trip_id, user_id)
VALUES (
  'YOUR_TRIP_ID_HERE',
  auth.uid()
);
```

---

### **Step 3: Check Count Increased**
```sql
SELECT id, title, save_count 
FROM trips 
WHERE id = 'YOUR_TRIP_ID_HERE';
```

**Expected:** `save_count` should be **+1**! ✅

---

### **Step 4: Remove the Save**
```sql
DELETE FROM trip_saves 
WHERE trip_id = 'YOUR_TRIP_ID_HERE' 
  AND user_id = auth.uid();
```

---

### **Step 5: Check Count Decreased**
```sql
SELECT id, title, save_count 
FROM trips 
WHERE id = 'YOUR_TRIP_ID_HERE';
```

**Expected:** `save_count` should be back to original! ✅

---

## Test 3: Location Ratings ⭐

### **Step 1: Check Initial Stats**
```sql
SELECT id, name, rating_count, average_rating 
FROM locations 
LIMIT 1;
```

---

### **Step 2: Add a Rating**
```sql
INSERT INTO location_ratings (location_id, user_id, rating, review)
VALUES (
  'YOUR_LOCATION_ID_HERE',
  auth.uid(),
  5,  -- 5-star rating
  'Amazing place!'
);
```

---

### **Step 3: Check Stats Updated**
```sql
SELECT id, name, rating_count, average_rating 
FROM locations 
WHERE id = 'YOUR_LOCATION_ID_HERE';
```

**Expected:** 
- `rating_count` should be **+1**
- `average_rating` should be updated! ✅

---

### **Step 4: Update the Rating**
```sql
UPDATE location_ratings 
SET rating = 3, review = 'Actually just okay'
WHERE location_id = 'YOUR_LOCATION_ID_HERE' 
  AND user_id = auth.uid();
```

---

### **Step 5: Check Average Changed**
```sql
SELECT id, name, rating_count, average_rating 
FROM locations 
WHERE id = 'YOUR_LOCATION_ID_HERE';
```

**Expected:** 
- `rating_count` stays the same
- `average_rating` should be lower! ✅

---

### **Step 6: Remove the Rating**
```sql
DELETE FROM location_ratings 
WHERE location_id = 'YOUR_LOCATION_ID_HERE' 
  AND user_id = auth.uid();
```

---

### **Step 7: Check Stats Decreased**
```sql
SELECT id, name, rating_count, average_rating 
FROM locations 
WHERE id = 'YOUR_LOCATION_ID_HERE';
```

**Expected:** Back to original stats! ✅

---

## Quick Verification Queries

### **Check All Triggers Exist**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%_count_trigger'
ORDER BY event_object_table;
```

**Expected:** Should see 3-4 triggers:
- `trip_like_count_trigger` on `trip_likes`
- `trip_save_count_trigger` on `trip_saves`
- `location_rating_stats_trigger` on `location_ratings`
- `activity_like_count_trigger` on `activity_likes` (if activities table exists)

---

### **Check All Counts Are Accurate**
```sql
-- Verify trip counts
SELECT 
  COUNT(*) as trips_with_wrong_counts
FROM trips t
WHERE t.like_count != (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id)
   OR t.save_count != (SELECT COUNT(*) FROM trip_saves WHERE trip_id = t.id);
```

**Expected:** `0` (zero trips with wrong counts) ✅

---

```sql
-- Verify location counts
SELECT 
  COUNT(*) as locations_with_wrong_counts
FROM locations l
WHERE l.rating_count != (SELECT COUNT(*) FROM location_ratings WHERE location_id = l.id);
```

**Expected:** `0` (zero locations with wrong counts) ✅

---

## 🎉 Success Criteria

If all tests pass, you should see:

✅ **Trip Likes:**
- Count increases when like is added
- Count decreases when like is removed
- Trigger works automatically (no manual UPDATE needed)

✅ **Trip Saves:**
- Count increases when save is added
- Count decreases when save is removed
- Trigger works automatically

✅ **Location Ratings:**
- Count increases when rating is added
- Average updates when rating changes
- Count decreases when rating is removed
- Trigger works automatically

✅ **Performance:**
- No manual counting needed
- Instant updates via triggers
- 100-1000x faster at scale!

---

## 🚀 Next Steps

Once all tests pass:

1. ✅ Migration is working perfectly!
2. ✅ Deploy code to Railway (already updated)
3. ✅ Test in production app
4. ✅ Monitor performance (should be much faster!)
5. ✅ Celebrate! 🎉

---

## 🐛 Troubleshooting

### **Error: "duplicate key value violates unique constraint"**
**Cause:** You already have a like/save/rating for this trip/location

**Fix:** Delete the existing one first:
```sql
DELETE FROM trip_likes WHERE trip_id = 'YOUR_ID' AND user_id = auth.uid();
```

### **Count doesn't update**
**Cause:** Trigger might not be working

**Fix:** Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trip_like_count_trigger';
```

If missing, re-run the migration.

### **Count is wrong**
**Cause:** Data was added before triggers were created

**Fix:** Re-initialize counts:
```sql
UPDATE trips t
SET like_count = (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id);
```

---

## ✅ Ready to Test!

Run the tests above in Supabase SQL Editor and verify everything works! 🚀

