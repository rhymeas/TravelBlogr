-- Migration 013: Trip Notes and Checklists
-- Links user-authored notes/checklists to trips and specific activities/locations

-- Trip Notes
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  location_name TEXT, -- fallback when id unknown
  activity_title TEXT, -- fallback when id unknown
  note_text TEXT NOT NULL,
  client_uid TEXT, -- client-generated id to prevent duplicates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, client_uid)
);

CREATE INDEX IF NOT EXISTS idx_trip_notes_user ON public.trip_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_trip ON public.trip_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_location ON public.trip_notes(location_id);
CREATE INDEX IF NOT EXISTS idx_trip_notes_activity ON public.trip_notes(activity_id);

ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own trip notes" ON public.trip_notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trip Checklists
CREATE TABLE IF NOT EXISTS public.trip_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  location_name TEXT,
  activity_title TEXT,
  checklist_items JSONB NOT NULL DEFAULT '[]',
  template_type TEXT,
  client_uid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, client_uid)
);

CREATE INDEX IF NOT EXISTS idx_trip_checklists_user ON public.trip_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_checklists_trip ON public.trip_checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_checklists_location ON public.trip_checklists(location_id);
CREATE INDEX IF NOT EXISTS idx_trip_checklists_activity ON public.trip_checklists(activity_id);

ALTER TABLE public.trip_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own trip checklists" ON public.trip_checklists FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trip_notes_updated_at ON public.trip_notes;
CREATE TRIGGER update_trip_notes_updated_at
  BEFORE UPDATE ON public.trip_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_checklists_updated_at ON public.trip_checklists;
CREATE TRIGGER update_trip_checklists_updated_at
  BEFORE UPDATE ON public.trip_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

