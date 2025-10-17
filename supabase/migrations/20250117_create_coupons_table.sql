-- Coupons Table
-- Allows admins to create discount codes and special offers

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('discount', 'credits', 'unlimited')),
  
  -- Discount details
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER CHECK (discount_amount >= 0),
  
  -- Credit bonus
  bonus_credits INTEGER CHECK (bonus_credits >= 0),
  
  -- Unlimited access
  unlimited_days INTEGER CHECK (unlimited_days > 0),
  
  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited uses
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon Redemptions Table
-- Tracks who used which coupons
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What was granted
  credits_granted INTEGER DEFAULT 0,
  discount_applied INTEGER DEFAULT 0,
  unlimited_until TIMESTAMPTZ,
  
  -- Metadata
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate redemptions
  UNIQUE(coupon_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, valid_until);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);

-- Function to validate and redeem coupon
CREATE OR REPLACE FUNCTION redeem_coupon(
  p_user_id UUID,
  p_coupon_code VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_user_redemptions INTEGER;
  v_credits_to_grant INTEGER := 0;
  v_unlimited_until TIMESTAMPTZ;
  v_result JSON;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
  
  -- Check if coupon exists and is valid
  IF v_coupon.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired coupon code'
    );
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This coupon has reached its maximum number of uses'
    );
  END IF;
  
  -- Check user redemption limit
  SELECT COUNT(*) INTO v_user_redemptions
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  
  IF v_user_redemptions >= v_coupon.max_uses_per_user THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already used this coupon'
    );
  END IF;
  
  -- Apply coupon based on type
  IF v_coupon.type = 'credits' THEN
    v_credits_to_grant := v_coupon.bonus_credits;
    
    -- Add credits to user
    UPDATE user_credits
    SET credits_remaining = credits_remaining + v_credits_to_grant,
        credits_purchased = credits_purchased + v_credits_to_grant,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (
      p_user_id,
      v_credits_to_grant,
      'bonus',
      'Coupon: ' || v_coupon.code || ' - ' || COALESCE(v_coupon.description, 'Bonus credits')
    );
    
  ELSIF v_coupon.type = 'unlimited' THEN
    v_unlimited_until := NOW() + (v_coupon.unlimited_days || ' days')::INTERVAL;
    
    -- Update user profile with unlimited access
    UPDATE profiles
    SET unlimited_until = v_unlimited_until,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
  
  -- Record redemption
  INSERT INTO coupon_redemptions (
    coupon_id,
    user_id,
    credits_granted,
    unlimited_until
  ) VALUES (
    v_coupon.id,
    p_user_id,
    v_credits_to_grant,
    v_unlimited_until
  );
  
  -- Increment coupon usage
  UPDATE coupons
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_coupon.id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'type', v_coupon.type,
    'credits_granted', v_credits_to_grant,
    'unlimited_until', v_unlimited_until,
    'description', v_coupon.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unlimited_until column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlimited_until TIMESTAMPTZ;

-- Create index for unlimited access check
CREATE INDEX IF NOT EXISTS idx_profiles_unlimited ON profiles(unlimited_until) WHERE unlimited_until IS NOT NULL;

-- Sample coupons for testing (admin can create these via API)
-- INSERT INTO coupons (code, type, bonus_credits, description, created_by)
-- VALUES ('WELCOME10', 'credits', 10, 'Welcome bonus - 10 free credits', NULL);

-- INSERT INTO coupons (code, type, unlimited_days, description, max_uses, created_by)
-- VALUES ('UNLIMITED30', 'unlimited', 30, '30 days unlimited access', 100, NULL);

COMMENT ON TABLE coupons IS 'Coupon codes for discounts, credits, and unlimited access';
COMMENT ON TABLE coupon_redemptions IS 'Tracks coupon usage by users';
COMMENT ON FUNCTION redeem_coupon IS 'Validates and redeems a coupon code for a user';

