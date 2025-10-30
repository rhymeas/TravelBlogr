-- Create reservations table for storing imported booking confirmations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Reservation details
  provider VARCHAR(50),  -- 'booking.com', 'airbnb', 'ryanair', 'expedia', etc.
  type VARCHAR(50) NOT NULL,  -- 'accommodation', 'flight', 'car_rental', 'activity'
  name TEXT NOT NULL,    -- Hotel name, flight number, activity name, etc.
  
  -- Dates/times
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Location
  location TEXT,
  address TEXT,
  
  -- Booking info
  confirmation_number TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Additional details (JSON for flexibility)
  details JSONB DEFAULT '{}',
  
  -- Raw data for reference
  raw_email_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reservations_trip_id ON reservations(trip_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_type ON reservations(type);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);

-- RLS Policies
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Users can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reservations
CREATE POLICY "Users can insert own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations
CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reservations
CREATE POLICY "Users can delete own reservations"
  ON reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

