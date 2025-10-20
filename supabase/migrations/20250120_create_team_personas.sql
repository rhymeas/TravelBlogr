-- Migration: Create TravelBlogr Team Member Personas
-- Date: 2025-01-20
-- Purpose: Create diverse team members with unique writing styles for blog posts

-- Step 1: Add writing_style column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS writing_style JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS travel_preferences JSONB DEFAULT '{}'::jsonb;

-- Step 2: Create team member personas
-- Note: These will be created in auth.users first, then profiles via trigger

-- Persona 1: Emma Chen - The Adventure Seeker
-- Username: emma_chen
-- Writing Style: Energetic, enthusiastic, uses lots of exclamation marks
-- Expertise: Hiking, outdoor adventures, budget travel
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'emma.chen@travelblogr.com',
  crypt('TravelBlogr2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Persona 2: Marcus Rodriguez - The Luxury Traveler
-- Username: marcus_rodriguez
-- Writing Style: Sophisticated, detailed, focuses on experiences
-- Expertise: Luxury hotels, fine dining, wine tourism
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'marcus.rodriguez@travelblogr.com',
  crypt('TravelBlogr2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Persona 3: Yuki Tanaka - The Cultural Explorer
-- Username: yuki_tanaka
-- Writing Style: Thoughtful, reflective, storytelling approach
-- Expertise: Cultural immersion, local traditions, photography
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'yuki.tanaka@travelblogr.com',
  crypt('TravelBlogr2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Persona 4: Sophie Laurent - The Family Travel Expert
-- Username: sophie_laurent
-- Writing Style: Practical, warm, includes tips and advice
-- Expertise: Family travel, kid-friendly destinations, travel hacks
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'sophie.laurent@travelblogr.com',
  crypt('TravelBlogr2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Persona 5: Alex Thompson - The Digital Nomad
-- Username: alex_thompson
-- Writing Style: Casual, tech-savvy, includes productivity tips
-- Expertise: Remote work, coworking spaces, digital nomad lifestyle
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'alex.thompson@travelblogr.com',
  crypt('TravelBlogr2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Update profiles with detailed personas
-- (Profiles should be auto-created by trigger, but we'll update them with details)

-- Emma Chen - The Adventure Seeker
INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, role, writing_style, expertise, travel_preferences)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Emma Chen',
  'emma_chen',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  'Adventure enthusiast and outdoor lover. Always seeking the next adrenaline rush! 🏔️',
  'admin',
  '{
    "tone": "energetic",
    "personality": "enthusiastic",
    "characteristics": ["uses exclamation marks", "action-oriented", "motivational"],
    "writing_patterns": ["starts with exciting hooks", "includes personal anecdotes", "ends with calls to action"],
    "vocabulary": ["amazing", "incredible", "breathtaking", "epic", "unforgettable"],
    "sentence_structure": "short and punchy",
    "emoji_usage": "frequent"
  }'::jsonb,
  ARRAY['hiking', 'rock climbing', 'camping', 'budget travel', 'backpacking', 'outdoor adventures'],
  '{
    "budget_preference": "budget",
    "travel_style": "adventurous",
    "accommodation": "hostels and camping",
    "favorite_destinations": ["Patagonia", "Nepal", "New Zealand", "Iceland"],
    "travel_pace": "fast-paced"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  writing_style = EXCLUDED.writing_style,
  expertise = EXCLUDED.expertise,
  travel_preferences = EXCLUDED.travel_preferences;

-- Marcus Rodriguez - The Luxury Traveler
INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, role, writing_style, expertise, travel_preferences)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Marcus Rodriguez',
  'marcus_rodriguez',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  'Connoisseur of fine experiences and luxury travel. Life is too short for mediocre wine. 🍷',
  'admin',
  '{
    "tone": "sophisticated",
    "personality": "refined",
    "characteristics": ["detailed descriptions", "sensory language", "elegant prose"],
    "writing_patterns": ["sets the scene elaborately", "focuses on quality over quantity", "includes expert recommendations"],
    "vocabulary": ["exquisite", "refined", "impeccable", "sumptuous", "distinguished"],
    "sentence_structure": "long and flowing",
    "emoji_usage": "minimal and tasteful"
  }'::jsonb,
  ARRAY['luxury hotels', 'fine dining', 'wine tourism', 'spa retreats', 'first-class travel', 'gourmet experiences'],
  '{
    "budget_preference": "luxury",
    "travel_style": "leisurely",
    "accommodation": "5-star hotels and resorts",
    "favorite_destinations": ["French Riviera", "Tuscany", "Maldives", "Dubai"],
    "travel_pace": "slow and immersive"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  writing_style = EXCLUDED.writing_style,
  expertise = EXCLUDED.expertise,
  travel_preferences = EXCLUDED.travel_preferences;

-- Yuki Tanaka - The Cultural Explorer
INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, role, writing_style, expertise, travel_preferences)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Yuki Tanaka',
  'yuki_tanaka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
  'Photographer and cultural storyteller. Finding beauty in the everyday moments of travel. 📸',
  'admin',
  '{
    "tone": "thoughtful",
    "personality": "reflective",
    "characteristics": ["storytelling approach", "cultural insights", "philosophical observations"],
    "writing_patterns": ["begins with a moment or scene", "weaves in cultural context", "ends with reflection"],
    "vocabulary": ["authentic", "meaningful", "profound", "intimate", "timeless"],
    "sentence_structure": "varied and rhythmic",
    "emoji_usage": "selective and meaningful"
  }'::jsonb,
  ARRAY['photography', 'cultural immersion', 'local traditions', 'street food', 'art and architecture', 'language learning'],
  '{
    "budget_preference": "moderate",
    "travel_style": "cultural",
    "accommodation": "local guesthouses and boutique hotels",
    "favorite_destinations": ["Kyoto", "Morocco", "Peru", "India"],
    "travel_pace": "slow and observant"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  writing_style = EXCLUDED.writing_style,
  expertise = EXCLUDED.expertise,
  travel_preferences = EXCLUDED.travel_preferences;

-- Sophie Laurent - The Family Travel Expert
INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, role, writing_style, expertise, travel_preferences)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Sophie Laurent',
  'sophie_laurent',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'Mom of three and family travel advocate. Making memories one adventure at a time! 👨‍👩‍👧‍👦',
  'admin',
  '{
    "tone": "warm",
    "personality": "practical",
    "characteristics": ["helpful tips", "honest advice", "relatable experiences"],
    "writing_patterns": ["starts with a family scenario", "includes practical tips throughout", "ends with encouragement"],
    "vocabulary": ["family-friendly", "practical", "manageable", "enjoyable", "stress-free"],
    "sentence_structure": "clear and conversational",
    "emoji_usage": "friendly and relatable"
  }'::jsonb,
  ARRAY['family travel', 'kid-friendly activities', 'travel hacks', 'budget planning', 'educational travel', 'theme parks'],
  '{
    "budget_preference": "moderate",
    "travel_style": "family-oriented",
    "accommodation": "family suites and vacation rentals",
    "favorite_destinations": ["Orlando", "Barcelona", "Tokyo", "Costa Rica"],
    "travel_pace": "flexible with breaks"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  writing_style = EXCLUDED.writing_style,
  expertise = EXCLUDED.expertise,
  travel_preferences = EXCLUDED.travel_preferences;

-- Alex Thompson - The Digital Nomad
INSERT INTO public.profiles (id, full_name, username, avatar_url, bio, role, writing_style, expertise, travel_preferences)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Alex Thompson',
  'alex_thompson',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'Digital nomad and remote work enthusiast. Working from anywhere, living everywhere. 💻🌍',
  'admin',
  '{
    "tone": "casual",
    "personality": "tech-savvy",
    "characteristics": ["productivity tips", "tech recommendations", "lifestyle insights"],
    "writing_patterns": ["starts with a work-life scenario", "includes tools and resources", "ends with actionable advice"],
    "vocabulary": ["efficient", "flexible", "connected", "productive", "sustainable"],
    "sentence_structure": "conversational and direct",
    "emoji_usage": "tech and travel themed"
  }'::jsonb,
  ARRAY['remote work', 'coworking spaces', 'digital nomad lifestyle', 'productivity tools', 'visa requirements', 'cost of living'],
  '{
    "budget_preference": "budget to moderate",
    "travel_style": "nomadic",
    "accommodation": "coworking-friendly apartments",
    "favorite_destinations": ["Bali", "Lisbon", "Chiang Mai", "Medellín"],
    "travel_pace": "slow (1-3 months per location)"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  writing_style = EXCLUDED.writing_style,
  expertise = EXCLUDED.expertise,
  travel_preferences = EXCLUDED.travel_preferences;

-- Step 4: Add comments
COMMENT ON COLUMN profiles.writing_style IS 'JSONB containing tone, personality, characteristics, patterns, vocabulary, and structure';
COMMENT ON COLUMN profiles.expertise IS 'Array of travel expertise areas for this persona';
COMMENT ON COLUMN profiles.travel_preferences IS 'JSONB containing budget, style, accommodation, destinations, and pace preferences';

