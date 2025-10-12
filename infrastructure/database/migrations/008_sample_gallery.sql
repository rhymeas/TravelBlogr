-- Sample Travel Guides Gallery
-- Simple structure for showcasing example travel guides to inspire users

CREATE TABLE IF NOT EXISTS public.sample_travel_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  trip_type TEXT NOT NULL, -- 'family', 'adventure', 'beach', 'cultural', 'road-trip'
  highlights TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample guide days (itinerary)
CREATE TABLE IF NOT EXISTS public.sample_guide_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.sample_travel_guides(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activities TEXT[] NOT NULL DEFAULT '{}',
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, day_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sample_guides_slug ON public.sample_travel_guides(slug);
CREATE INDEX IF NOT EXISTS idx_sample_guides_type ON public.sample_travel_guides(trip_type);
CREATE INDEX IF NOT EXISTS idx_sample_guide_days_guide ON public.sample_guide_days(guide_id);

-- Enable RLS (public read-only)
ALTER TABLE public.sample_travel_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_guide_days ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view sample guides"
  ON public.sample_travel_guides
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view sample guide days"
  ON public.sample_guide_days
  FOR SELECT
  USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_sample_guide_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sample_guide_updated_at
  BEFORE UPDATE ON public.sample_travel_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_sample_guide_updated_at();

-- Insert sample data (family-friendly examples)
INSERT INTO public.sample_travel_guides (title, slug, description, cover_image, destination, duration_days, trip_type, highlights, is_featured) VALUES
(
  'Family Adventure in Tokyo',
  'family-tokyo-adventure',
  'A magical 7-day journey through Tokyo with kids - from anime museums to traditional temples, this guide shows you how to experience Japan''s capital with the whole family.',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
  'Tokyo, Japan',
  7,
  'family',
  ARRAY['TeamLab Borderless Museum', 'Ghibli Museum', 'Tokyo Disneyland', 'Sensoji Temple', 'Shibuya Crossing'],
  true
),
(
  'European Road Trip: Paris to Rome',
  'europe-road-trip-paris-rome',
  'An unforgettable 14-day road trip through Europe''s most iconic cities. Perfect for families who love history, art, and amazing food.',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
  'Paris to Rome',
  14,
  'road-trip',
  ARRAY['Eiffel Tower', 'Swiss Alps', 'Venice Canals', 'Colosseum', 'Tuscan Countryside'],
  true
),
(
  'Beach Paradise: Maldives Family Getaway',
  'maldives-beach-family',
  'Relax and recharge with 5 days in paradise. Kid-friendly resorts, snorkeling adventures, and unforgettable sunsets.',
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
  'Maldives',
  5,
  'beach',
  ARRAY['Snorkeling with sea turtles', 'Private beach time', 'Sunset dolphin cruise', 'Kids club activities'],
  true
),
(
  'Adventure Seekers: New Zealand South Island',
  'new-zealand-adventure',
  'For families who love the outdoors! 10 days of hiking, wildlife, and breathtaking landscapes in New Zealand.',
  'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200',
  'New Zealand',
  10,
  'adventure',
  ARRAY['Milford Sound cruise', 'Queenstown adventures', 'Glacier hiking', 'Wildlife spotting'],
  false
);

-- Insert sample itinerary for Tokyo guide
INSERT INTO public.sample_guide_days (guide_id, day_number, title, description, activities, tips) VALUES
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  1,
  'Arrival & Shibuya Exploration',
  'Land in Tokyo and dive straight into the energy of Shibuya. Watch the famous scramble crossing, explore trendy shops, and enjoy your first authentic ramen.',
  ARRAY['Shibuya Crossing photo op', 'Hachiko statue visit', 'Shibuya Sky observation deck', 'Dinner at Ichiran Ramen'],
  'Book airport transfer in advance. Kids love the Shibuya crossing - go at sunset for best photos!'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  2,
  'TeamLab Borderless & Odaiba',
  'Spend the morning at the mesmerizing TeamLab Borderless digital art museum. Afternoon at Odaiba beach and shopping.',
  ARRAY['TeamLab Borderless Museum', 'Odaiba Seaside Park', 'DiverCity Tokyo Plaza', 'Gundam statue'],
  'Book TeamLab tickets online in advance - they sell out! Bring comfortable shoes for walking.'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  3,
  'Ghibli Museum & Harajuku',
  'Morning at the magical Ghibli Museum (book months in advance!). Afternoon exploring Harajuku''s quirky fashion and crepes.',
  ARRAY['Ghibli Museum tour', 'Inokashira Park', 'Harajuku Takeshita Street', 'Meiji Shrine'],
  'Ghibli Museum requires advance booking - book as soon as tickets open! No photos inside.'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  4,
  'Tokyo Disneyland',
  'Full day at Tokyo Disneyland - one of the best Disney parks in the world! Unique attractions and incredible attention to detail.',
  ARRAY['Tokyo Disneyland', 'Popcorn bucket collecting', 'Character meet & greets', 'Evening parade'],
  'Arrive at opening for shortest lines. Download the Tokyo Disney Resort app for wait times.'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  5,
  'Asakusa & Traditional Tokyo',
  'Experience old Tokyo at Sensoji Temple, try traditional snacks on Nakamise Street, and take a river cruise.',
  ARRAY['Sensoji Temple', 'Nakamise Shopping Street', 'Sumida River cruise', 'Tokyo Skytree'],
  'Visit Sensoji early morning to avoid crowds. Try the fortune slips (omikuji) for 100 yen!'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  6,
  'Akihabara & Pokemon Center',
  'Anime and gaming paradise! Explore Akihabara''s electronics shops, visit the Pokemon Center, and enjoy themed cafes.',
  ARRAY['Pokemon Center Mega Tokyo', 'Akihabara Electric Town', 'Maid cafe experience', 'Retro gaming shops'],
  'Kids will love the Pokemon Center - budget extra time and money for souvenirs!'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'family-tokyo-adventure'),
  7,
  'Last Day Shopping & Departure',
  'Final souvenir shopping in Ginza or Tokyo Station. Enjoy one last amazing meal before heading to the airport.',
  ARRAY['Tokyo Station character street', 'Ginza shopping', 'Airport limousine bus', 'Departure'],
  'Pack snacks for the flight - Japanese convenience stores have amazing options!'
);

-- Insert sample itinerary for Europe road trip
INSERT INTO public.sample_guide_days (guide_id, day_number, title, description, activities, tips) VALUES
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'europe-road-trip-paris-rome'),
  1,
  'Paris: Eiffel Tower & Seine River',
  'Start your European adventure in the City of Light. Visit the iconic Eiffel Tower and take a sunset cruise on the Seine.',
  ARRAY['Eiffel Tower visit', 'Seine River cruise', 'Trocadéro Gardens', 'Dinner in Le Marais'],
  'Book Eiffel Tower tickets online to skip lines. Evening is magical with the tower lights!'
),
(
  (SELECT id FROM public.sample_travel_guides WHERE slug = 'europe-road-trip-paris-rome'),
  2,
  'Paris: Louvre & Champs-Élysées',
  'Explore the world''s largest art museum and stroll down the famous Champs-Élysées.',
  ARRAY['Louvre Museum', 'Arc de Triomphe', 'Champs-Élysées shopping', 'Ladurée macarons'],
  'Louvre is huge - focus on highlights with kids. Get macarons at Ladurée!'
);

-- Add view count trigger
CREATE OR REPLACE FUNCTION increment_sample_guide_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sample_travel_guides
  SET view_count = view_count + 1
  WHERE id = NEW.guide_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.sample_travel_guides IS 'Sample travel guides to inspire users and showcase the platform';
COMMENT ON TABLE public.sample_guide_days IS 'Day-by-day itinerary for sample travel guides';

