-- Update New User Credits
-- Give new users 10 regular credits + 5 pro mode credits on signup

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_created_credits ON auth.users;
DROP FUNCTION IF EXISTS create_user_credits();

-- Create updated function that gives new users free credits
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_credits record with 15 free credits (10 regular + 5 pro)
  INSERT INTO user_credits (
    user_id, 
    credits_remaining, 
    credits_purchased, 
    credits_used
  )
  VALUES (
    NEW.id, 
    15,  -- 10 regular + 5 pro mode credits
    0,   -- Not purchased, these are bonus credits
    0    -- No credits used yet
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log the bonus credits transaction
  INSERT INTO credit_transactions (
    user_id, 
    amount, 
    type, 
    description
  )
  VALUES (
    NEW.id,
    15,
    'bonus',
    'Welcome bonus: 10 regular + 5 pro mode AI itinerary generations'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits();

-- Grant existing users the same welcome bonus (if they don't have credits yet)
-- This is a one-time migration for existing users
INSERT INTO user_credits (user_id, credits_remaining, credits_purchased, credits_used)
SELECT 
  id, 
  15,  -- 10 regular + 5 pro mode credits
  0,   -- Not purchased
  0    -- No credits used yet
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- Log bonus for existing users who just got credits
INSERT INTO credit_transactions (user_id, amount, type, description)
SELECT 
  id,
  15,
  'bonus',
  'Welcome bonus: 10 regular + 5 pro mode AI itinerary generations'
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM credit_transactions WHERE type = 'bonus' AND description LIKE 'Welcome bonus%'
);

-- Comment for documentation
COMMENT ON FUNCTION create_user_credits() IS 
'Automatically creates user_credits record with 15 free credits (10 regular + 5 pro mode) when a new user signs up';

