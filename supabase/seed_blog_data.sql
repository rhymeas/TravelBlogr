-- Seed Data for TravelBlogr Blog/CMS System
-- Run this after applying migrations to populate test data

-- ============================================
-- 1. Blog Stats (Homepage)
-- ============================================
INSERT INTO blog_stats (stat_label, stat_value, icon, color, display_order)
VALUES
  ('Trips Planned', '10,000+', 'map', 'blue', 1),
  ('Destinations', '500+', 'globe', 'green', 2),
  ('Happy Travelers', '50,000+', 'users', 'purple', 3),
  ('Countries Covered', '150+', 'flag', 'orange', 4)
ON CONFLICT (stat_label) DO NOTHING;

-- ============================================
-- 2. Featured Destinations
-- ============================================
INSERT INTO blog_destinations (name, slug, country, description, image_url, is_featured, is_trending, stats)
VALUES
  (
    'Paris',
    'paris',
    'France',
    'The City of Light - Experience world-class museums, iconic landmarks, and exquisite cuisine in the heart of Europe.',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    true,
    true,
    '{"visitors": "15M+", "attractions": "200+", "rating": "4.8"}'::jsonb
  ),
  (
    'Tokyo',
    'tokyo',
    'Japan',
    'Where ancient tradition meets cutting-edge technology. Explore temples, taste incredible food, and experience unique culture.',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    true,
    true,
    '{"visitors": "12M+", "attractions": "150+", "rating": "4.9"}'::jsonb
  ),
  (
    'Bali',
    'bali',
    'Indonesia',
    'Tropical paradise with stunning beaches, lush rice terraces, ancient temples, and vibrant culture.',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    true,
    false,
    '{"visitors": "6M+", "attractions": "100+", "rating": "4.7"}'::jsonb
  ),
  (
    'New York',
    'new-york',
    'USA',
    'The city that never sleeps. Experience world-class entertainment, diverse neighborhoods, and iconic landmarks.',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    true,
    true,
    '{"visitors": "60M+", "attractions": "300+", "rating": "4.6"}'::jsonb
  ),
  (
    'Barcelona',
    'barcelona',
    'Spain',
    'Mediterranean charm meets Gaudí''s architectural masterpieces. Enjoy beaches, tapas, and vibrant nightlife.',
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    true,
    false,
    '{"visitors": "9M+", "attractions": "120+", "rating": "4.8"}'::jsonb
  ),
  (
    'Dubai',
    'dubai',
    'UAE',
    'Futuristic skyline, luxury shopping, and desert adventures. Experience the blend of tradition and modernity.',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    true,
    true,
    '{"visitors": "16M+", "attractions": "80+", "rating": "4.7"}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. Testimonials
-- ============================================
INSERT INTO blog_testimonials (
  content,
  author_name,
  author_role,
  author_location,
  author_avatar,
  rating,
  trip_reference,
  is_featured,
  status
)
VALUES
  (
    'TravelBlogr made planning our 2-week European adventure so easy! The AI suggestions were spot-on, and we discovered hidden gems we would have never found otherwise.',
    'Sarah Johnson',
    'Travel Blogger',
    'San Francisco, USA',
    'https://i.pravatar.cc/150?img=1',
    5,
    'Europe Adventure 2024',
    true,
    'approved'
  ),
  (
    'As a solo traveler, I was nervous about planning my first international trip. TravelBlogr gave me the confidence and tools I needed. The community support was amazing!',
    'Michael Chen',
    'Software Engineer',
    'Singapore',
    'https://i.pravatar.cc/150?img=12',
    5,
    'Japan Solo Trip',
    true,
    'approved'
  ),
  (
    'The affiliate links saved me so much money on accommodations and tours. Plus, I love that I can share my trips and help others plan their adventures!',
    'Emma Rodriguez',
    'Content Creator',
    'Barcelona, Spain',
    'https://i.pravatar.cc/150?img=5',
    5,
    'Southeast Asia Backpacking',
    true,
    'approved'
  ),
  (
    'I''ve used many travel planning tools, but TravelBlogr is by far the best. The itinerary generator is incredibly smart, and the blog feature lets me document my journeys beautifully.',
    'David Kim',
    'Photographer',
    'Seoul, South Korea',
    'https://i.pravatar.cc/150?img=15',
    5,
    'South America Expedition',
    true,
    'approved'
  ),
  (
    'Planning our honeymoon was stress-free thanks to TravelBlogr. The recommendations were perfect for couples, and we created memories that will last a lifetime!',
    'Lisa & James Wilson',
    'Newlyweds',
    'London, UK',
    'https://i.pravatar.cc/150?img=8',
    5,
    'Maldives Honeymoon',
    true,
    'approved'
  ),
  (
    'As a family of five, planning trips can be overwhelming. TravelBlogr helped us find kid-friendly activities and accommodations that fit our budget. Highly recommend!',
    'Maria Garcia',
    'Teacher',
    'Madrid, Spain',
    'https://i.pravatar.cc/150?img=9',
    5,
    'Family Trip to Orlando',
    false,
    'approved'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Sample Blog Posts (requires user_id)
-- ============================================
-- Note: Replace 'YOUR_USER_ID' with actual user ID from auth.users
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

-- Example blog post (commented out - uncomment and replace user_id)
/*
INSERT INTO cms_posts (
  title,
  slug,
  content,
  excerpt,
  status,
  visibility,
  featured_image,
  tags,
  category,
  author_id,
  published_at,
  seo_title,
  seo_description
)
VALUES
  (
    'Ultimate Guide to Planning Your First Solo Trip',
    'ultimate-guide-solo-trip',
    '<h2>Introduction</h2><p>Solo travel is one of the most rewarding experiences you can have...</p>',
    'Everything you need to know about planning your first solo adventure, from choosing destinations to staying safe.',
    'published',
    'public',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
    ARRAY['solo travel', 'travel tips', 'beginner guide'],
    'Travel Tips',
    'YOUR_USER_ID',
    NOW(),
    'Ultimate Guide to Solo Travel - TravelBlogr',
    'Complete guide to planning your first solo trip. Learn how to choose destinations, stay safe, and make the most of traveling alone.'
  ),
  (
    '10 Hidden Gems in Southeast Asia You Must Visit',
    '10-hidden-gems-southeast-asia',
    '<h2>Discover the Undiscovered</h2><p>Southeast Asia is full of incredible destinations...</p>',
    'Move beyond the tourist hotspots and discover these amazing hidden gems in Southeast Asia.',
    'published',
    'public',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
    ARRAY['southeast asia', 'hidden gems', 'destinations'],
    'Destinations',
    'YOUR_USER_ID',
    NOW() - INTERVAL '2 days',
    '10 Hidden Gems in Southeast Asia - TravelBlogr',
    'Discover 10 amazing hidden gems in Southeast Asia that most tourists miss. From secret beaches to ancient temples.'
  ),
  (
    'How to Travel Europe on a Budget: Complete Guide',
    'travel-europe-budget-guide',
    '<h2>Budget Travel Tips</h2><p>Traveling Europe doesn''t have to break the bank...</p>',
    'Learn how to explore Europe without spending a fortune. Tips on accommodation, transportation, and food.',
    'published',
    'public',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200',
    ARRAY['europe', 'budget travel', 'travel tips'],
    'Travel Tips',
    'YOUR_USER_ID',
    NOW() - INTERVAL '5 days',
    'Travel Europe on a Budget - Complete Guide',
    'Complete guide to budget travel in Europe. Save money on accommodation, transportation, food, and activities.'
  )
ON CONFLICT (slug) DO NOTHING;
*/

-- ============================================
-- 5. Newsletter Subscriptions (Test Data)
-- ============================================
INSERT INTO newsletter_subscriptions (email, status, source)
VALUES
  ('test1@example.com', 'active', 'blog_homepage'),
  ('test2@example.com', 'active', 'blog_post'),
  ('test3@example.com', 'active', 'blog_homepage')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Blog seed data inserted successfully!';
  RAISE NOTICE '📊 Stats: 4 entries';
  RAISE NOTICE '🌍 Destinations: 6 entries';
  RAISE NOTICE '💬 Testimonials: 6 entries';
  RAISE NOTICE '📧 Newsletter: 3 test subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  To add sample blog posts:';
  RAISE NOTICE '1. Get your user ID: SELECT id FROM auth.users LIMIT 1;';
  RAISE NOTICE '2. Uncomment the blog posts section above';
  RAISE NOTICE '3. Replace YOUR_USER_ID with your actual user ID';
  RAISE NOTICE '4. Run this script again';
END $$;

