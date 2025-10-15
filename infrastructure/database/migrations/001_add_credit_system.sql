-- =====================================================================
-- Credit System Migration
-- =====================================================================
-- Purpose: Add tables for credit-based AI usage monetization
-- Created: 2025-01-15
-- =====================================================================

-- =====================================================================
-- 1. USER CREDITS TABLE
-- =====================================================================
-- Stores user credit balances for AI itinerary generation
-- Credits can be purchased or earned through promotions

CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0 CHECK (credits_remaining >= 0),
  credits_purchased INTEGER NOT NULL DEFAULT 0 CHECK (credits_purchased >= 0),
  credits_used INTEGER NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" 
  ON user_credits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" 
  ON user_credits FOR UPDATE 
  USING (auth.uid() = user_id);

-- =====================================================================
-- 2. CREDIT TRANSACTIONS TABLE
-- =====================================================================
-- Audit trail for all credit purchases and usage

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for purchase, negative for usage
  type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  description TEXT,
  stripe_payment_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
  ON credit_transactions FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================================
-- 3. AI USAGE TRACKING TABLE
-- =====================================================================
-- Tracks monthly AI generation usage for free tier limits

CREATE TABLE IF NOT EXISTS ai_usage_monthly (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (e.g., 2025-01-01)
  generations_count INTEGER NOT NULL DEFAULT 0 CHECK (generations_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, month)
);

-- Index for fast monthly lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage_monthly(user_id, month);

-- RLS Policies
ALTER TABLE ai_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" 
  ON ai_usage_monthly FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================================
-- 4. HELPER FUNCTIONS
-- =====================================================================

-- Function to get current month's usage
CREATE OR REPLACE FUNCTION get_current_month_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_month DATE;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT COALESCE(generations_count, 0) INTO v_count
  FROM ai_usage_monthly
  WHERE user_id = p_user_id AND month = v_month;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment monthly usage
CREATE OR REPLACE FUNCTION increment_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_month DATE;
  v_new_count INTEGER;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);
  
  INSERT INTO ai_usage_monthly (user_id, month, generations_count)
  VALUES (p_user_id, v_month, 1)
  ON CONFLICT (user_id, month) 
  DO UPDATE SET 
    generations_count = ai_usage_monthly.generations_count + 1,
    updated_at = NOW()
  RETURNING generations_count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use credits
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO v_current_credits
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET 
    credits_remaining = credits_remaining - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'usage', p_description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR(50),
  p_stripe_payment_id VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Create user_credits record if doesn't exist
  INSERT INTO user_credits (user_id, credits_remaining, credits_purchased)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits_remaining = user_credits.credits_remaining + p_amount,
    credits_purchased = user_credits.credits_purchased + p_amount,
    last_purchase_date = NOW(),
    updated_at = NOW();
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_id)
  VALUES (
    p_user_id, 
    p_amount, 
    p_type, 
    CASE 
      WHEN p_type = 'purchase' THEN 'Purchased ' || p_amount || ' credits'
      WHEN p_type = 'bonus' THEN 'Bonus ' || p_amount || ' credits'
      ELSE 'Added ' || p_amount || ' credits'
    END,
    p_stripe_payment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 5. INITIAL DATA
-- =====================================================================

-- Create credits record for existing users (0 credits)
INSERT INTO user_credits (user_id, credits_remaining, credits_purchased, credits_used)
SELECT id, 0, 0, 0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- 6. TRIGGERS
-- =====================================================================

-- Auto-create credits record for new users
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_remaining, credits_purchased, credits_used)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits();

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Credit system tables created successfully:';
  RAISE NOTICE '  - user_credits';
  RAISE NOTICE '  - credit_transactions';
  RAISE NOTICE '  - ai_usage_monthly';
  RAISE NOTICE 'Helper functions created:';
  RAISE NOTICE '  - get_current_month_usage()';
  RAISE NOTICE '  - increment_monthly_usage()';
  RAISE NOTICE '  - use_credits()';
  RAISE NOTICE '  - add_credits()';
END $$;

