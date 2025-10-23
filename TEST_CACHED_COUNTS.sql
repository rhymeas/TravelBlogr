-- ============================================================================
-- Test Script: Cached Counts Migration
-- ============================================================================
-- Run this in Supabase SQL Editor to verify everything works!

-- ============================================================================
-- TEST 1: Verify Tables Exist
-- ============================================================================

SELECT 
  'Tables Created' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('trip_likes', 'trip_saves', 'location_ratings', 'activities');

-- ============================================================================
-- TEST 2: Verify Columns Added
-- ============================================================================

SELECT 
  'Trips Columns' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns 
WHERE table_name = 'trips' 
  AND column_name IN ('like_count', 'save_count');

SELECT 
  'Locations Columns' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name IN ('rating_count', 'average_rating');

-- ============================================================================
-- TEST 3: Verify Triggers Created
-- ============================================================================

SELECT 
  'Triggers Created' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%_count_trigger';

-- ============================================================================
-- TEST 4: Verify RLS Policies
-- ============================================================================

SELECT 
  'RLS Policies' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_policies 
WHERE tablename IN ('trip_likes', 'trip_saves', 'location_ratings');

-- ============================================================================
-- TEST 5: Test Trip Like Trigger
-- ============================================================================

-- Get a test trip (or create one if none exist)
DO $$
DECLARE
  test_trip_id UUID;
  test_user_id UUID;
  initial_count INTEGER;
  after_insert_count INTEGER;
  after_delete_count INTEGER;
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Get or create a test trip
  SELECT id INTO test_trip_id FROM trips LIMIT 1;
  
  IF test_trip_id IS NULL THEN
    -- Create a test trip if none exist
    INSERT INTO trips (user_id, title, slug, status)
    VALUES (test_user_id, 'Test Trip', 'test-trip-' || gen_random_uuid(), 'draft')
    RETURNING id INTO test_trip_id;
  END IF;
  
  -- Get initial count
  SELECT like_count INTO initial_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'Initial like count: %', initial_count;
  
  -- Delete any existing test like
  DELETE FROM trip_likes WHERE trip_id = test_trip_id AND user_id = test_user_id;
  
  -- Insert a like
  INSERT INTO trip_likes (trip_id, user_id)
  VALUES (test_trip_id, test_user_id)
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  
  -- Check count increased
  SELECT like_count INTO after_insert_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'After insert like count: %', after_insert_count;
  
  IF after_insert_count > initial_count THEN
    RAISE NOTICE '✅ TEST PASS: Like count increased from % to %', initial_count, after_insert_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Like count did not increase';
  END IF;
  
  -- Delete the like
  DELETE FROM trip_likes WHERE trip_id = test_trip_id AND user_id = test_user_id;
  
  -- Check count decreased
  SELECT like_count INTO after_delete_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'After delete like count: %', after_delete_count;
  
  IF after_delete_count < after_insert_count THEN
    RAISE NOTICE '✅ TEST PASS: Like count decreased from % to %', after_insert_count, after_delete_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Like count did not decrease';
  END IF;
  
END $$;

-- ============================================================================
-- TEST 6: Test Trip Save Trigger
-- ============================================================================

DO $$
DECLARE
  test_trip_id UUID;
  test_user_id UUID;
  initial_count INTEGER;
  after_insert_count INTEGER;
  after_delete_count INTEGER;
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Get a test trip
  SELECT id INTO test_trip_id FROM trips LIMIT 1;
  
  IF test_trip_id IS NULL THEN
    RAISE WARNING 'No trips found for testing';
    RETURN;
  END IF;
  
  -- Get initial count
  SELECT save_count INTO initial_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'Initial save count: %', initial_count;
  
  -- Delete any existing test save
  DELETE FROM trip_saves WHERE trip_id = test_trip_id AND user_id = test_user_id;
  
  -- Insert a save
  INSERT INTO trip_saves (trip_id, user_id)
  VALUES (test_trip_id, test_user_id)
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  
  -- Check count increased
  SELECT save_count INTO after_insert_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'After insert save count: %', after_insert_count;
  
  IF after_insert_count > initial_count THEN
    RAISE NOTICE '✅ TEST PASS: Save count increased from % to %', initial_count, after_insert_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Save count did not increase';
  END IF;
  
  -- Delete the save
  DELETE FROM trip_saves WHERE trip_id = test_trip_id AND user_id = test_user_id;
  
  -- Check count decreased
  SELECT save_count INTO after_delete_count FROM trips WHERE id = test_trip_id;
  RAISE NOTICE 'After delete save count: %', after_delete_count;
  
  IF after_delete_count < after_insert_count THEN
    RAISE NOTICE '✅ TEST PASS: Save count decreased from % to %', after_insert_count, after_delete_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Save count did not decrease';
  END IF;
  
END $$;

-- ============================================================================
-- TEST 7: Test Location Rating Trigger
-- ============================================================================

DO $$
DECLARE
  test_location_id UUID;
  test_user_id UUID;
  initial_count INTEGER;
  initial_avg DECIMAL(3,2);
  after_insert_count INTEGER;
  after_insert_avg DECIMAL(3,2);
  after_delete_count INTEGER;
  after_delete_avg DECIMAL(3,2);
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Get a test location
  SELECT id INTO test_location_id FROM locations LIMIT 1;
  
  IF test_location_id IS NULL THEN
    RAISE WARNING 'No locations found for testing';
    RETURN;
  END IF;
  
  -- Get initial stats
  SELECT rating_count, average_rating 
  INTO initial_count, initial_avg 
  FROM locations WHERE id = test_location_id;
  
  RAISE NOTICE 'Initial rating count: %, average: %', initial_count, initial_avg;
  
  -- Delete any existing test rating
  DELETE FROM location_ratings WHERE location_id = test_location_id AND user_id = test_user_id;
  
  -- Insert a rating
  INSERT INTO location_ratings (location_id, user_id, rating, review)
  VALUES (test_location_id, test_user_id, 5, 'Test review')
  ON CONFLICT (location_id, user_id) DO NOTHING;
  
  -- Check stats updated
  SELECT rating_count, average_rating 
  INTO after_insert_count, after_insert_avg 
  FROM locations WHERE id = test_location_id;
  
  RAISE NOTICE 'After insert rating count: %, average: %', after_insert_count, after_insert_avg;
  
  IF after_insert_count > initial_count THEN
    RAISE NOTICE '✅ TEST PASS: Rating count increased from % to %', initial_count, after_insert_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Rating count did not increase';
  END IF;
  
  -- Delete the rating
  DELETE FROM location_ratings WHERE location_id = test_location_id AND user_id = test_user_id;
  
  -- Check stats updated
  SELECT rating_count, average_rating 
  INTO after_delete_count, after_delete_avg 
  FROM locations WHERE id = test_location_id;
  
  RAISE NOTICE 'After delete rating count: %, average: %', after_delete_count, after_delete_avg;
  
  IF after_delete_count < after_insert_count THEN
    RAISE NOTICE '✅ TEST PASS: Rating count decreased from % to %', after_insert_count, after_delete_count;
  ELSE
    RAISE WARNING '❌ TEST FAIL: Rating count did not decrease';
  END IF;
  
END $$;

-- ============================================================================
-- TEST 8: Verify All Counts Are Accurate
-- ============================================================================

-- Check trips
SELECT 
  'Trip Counts Accurate' as test,
  COUNT(*) as mismatches,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM trips t
WHERE t.like_count != (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id)
   OR t.save_count != (SELECT COUNT(*) FROM trip_saves WHERE trip_id = t.id);

-- Check locations
SELECT 
  'Location Counts Accurate' as test,
  COUNT(*) as mismatches,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM locations l
WHERE l.rating_count != (SELECT COUNT(*) FROM location_ratings WHERE location_id = l.id);

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  '🎉 ALL TESTS COMPLETE!' as message,
  'Check the Messages tab for detailed results' as note;

