-- Affiliate Tracking Tables
-- Track affiliate clicks, conversions, and revenue for blog posts and trips

-- Affiliate Clicks Table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES cms_posts(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'booking', 'sleek', 'getyourguide', 'viator', etc.
    location_name VARCHAR(255),
    context VARCHAR(100), -- 'blog_post', 'trip_template', 'location_page', etc.
    click_url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate Conversions Table
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES cms_posts(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    booking_id VARCHAR(255), -- External booking reference
    commission_amount DECIMAL(10, 2),
    commission_currency VARCHAR(3) DEFAULT 'USD',
    booking_value DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2), -- Percentage (e.g., 8.5 for 8.5%)
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator Earnings Table (70/30 split)
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversion_id UUID REFERENCES affiliate_conversions(id) ON DELETE SET NULL,
    post_id UUID REFERENCES cms_posts(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    total_commission DECIMAL(10, 2) NOT NULL, -- Total commission from provider
    creator_share DECIMAL(10, 2) NOT NULL, -- 70% of total_commission
    platform_share DECIMAL(10, 2) NOT NULL, -- 30% of total_commission
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_affiliate_clicks_user_id ON affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_post_id ON affiliate_clicks(post_id);
CREATE INDEX idx_affiliate_clicks_trip_id ON affiliate_clicks(trip_id);
CREATE INDEX idx_affiliate_clicks_provider ON affiliate_clicks(provider);
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);

CREATE INDEX idx_affiliate_conversions_user_id ON affiliate_conversions(user_id);
CREATE INDEX idx_affiliate_conversions_post_id ON affiliate_conversions(post_id);
CREATE INDEX idx_affiliate_conversions_trip_id ON affiliate_conversions(trip_id);
CREATE INDEX idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX idx_affiliate_conversions_created_at ON affiliate_conversions(created_at);

CREATE INDEX idx_creator_earnings_user_id ON creator_earnings(user_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_creator_earnings_created_at ON creator_earnings(created_at);

-- RLS Policies

-- Affiliate Clicks: Public can insert (for tracking), users can view their own
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track clicks"
    ON affiliate_clicks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own clicks"
    ON affiliate_clicks FOR SELECT
    USING (auth.uid() = user_id);

-- Affiliate Conversions: Only admins can manage, users can view their own
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions"
    ON affiliate_conversions FOR SELECT
    USING (auth.uid() = user_id);

-- Creator Earnings: Users can view their own earnings
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
    ON creator_earnings FOR SELECT
    USING (auth.uid() = user_id);

-- Function to calculate creator earnings when conversion is confirmed
CREATE OR REPLACE FUNCTION calculate_creator_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create earnings record when conversion is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        INSERT INTO creator_earnings (
            user_id,
            conversion_id,
            post_id,
            trip_id,
            total_commission,
            creator_share,
            platform_share,
            currency,
            status
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.post_id,
            NEW.trip_id,
            NEW.commission_amount,
            NEW.commission_amount * 0.70, -- 70% to creator
            NEW.commission_amount * 0.30, -- 30% to platform
            NEW.commission_currency,
            'available'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate earnings
CREATE TRIGGER on_conversion_confirmed
    AFTER INSERT OR UPDATE ON affiliate_conversions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_creator_earnings();

-- Function to track affiliate click
CREATE OR REPLACE FUNCTION track_affiliate_click(
    p_user_id UUID,
    p_post_id UUID,
    p_trip_id UUID,
    p_provider VARCHAR,
    p_location_name VARCHAR,
    p_context VARCHAR,
    p_click_url TEXT,
    p_referrer TEXT,
    p_user_agent TEXT,
    p_session_id VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_click_id UUID;
BEGIN
    INSERT INTO affiliate_clicks (
        user_id,
        post_id,
        trip_id,
        provider,
        location_name,
        context,
        click_url,
        referrer,
        user_agent,
        session_id
    ) VALUES (
        p_user_id,
        p_post_id,
        p_trip_id,
        p_provider,
        p_location_name,
        p_context,
        p_click_url,
        p_referrer,
        p_user_agent,
        p_session_id
    ) RETURNING id INTO v_click_id;
    
    RETURN v_click_id;
END;
$$ LANGUAGE plpgsql;

