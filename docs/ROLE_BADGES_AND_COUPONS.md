# Role Badges & Coupon System

## 🎯 Overview

Implemented a comprehensive role badge system and coupon functionality for TravelBlogr:

1. **Role Badges** - Visual badges next to user avatars showing their role/status
2. **Coupon System** - Admin-created coupons for credits, discounts, and unlimited access
3. **Credits Page Redesign** - Beautiful Apple-like modal design with coupon redemption

## 🏷️ Role Badges

### Supported Roles

| Role | Badge Icon | Color | Description |
|------|-----------|-------|-------------|
| **Admin** | 🛡️ Shield | Red → Pink gradient | Full system access |
| **Moderator** | 👑 Crown | Blue → Purple gradient | Content moderation |
| **Plus** | ⚡ Zap | Yellow → Orange gradient | Premium subscription |
| **Unlimited** | ⚡ Zap | Yellow → Orange gradient | Temporary unlimited access |

### Badge Display Locations

1. **Desktop Header** - Small badge on bottom-right of avatar
2. **Mobile Menu** - Badge on avatar + text label below name
3. **User Dropdown** - Shows role in user menu

### Visual Design

```tsx
// Badge appears as small icon overlay on avatar
<div className="relative">
  <img src={avatar} className="h-8 w-8 rounded-full" />
  
  {/* Role Badge */}
  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-full p-0.5 shadow-lg ring-2 ring-white">
    <Shield className="h-3 w-3 text-white" />
  </div>
</div>
```

### How It Works

1. **Profile Data** - Role stored in `profiles.role` column
2. **Unlimited Access** - Checked via `profiles.unlimited_until` timestamp
3. **Priority** - Unlimited access badge takes precedence over role badge
4. **Auto-Detection** - Badge automatically appears when role is set

### Setting User Roles

```sql
-- Make user an admin
UPDATE profiles SET role = 'admin' WHERE id = 'user-id';

-- Make user a moderator
UPDATE profiles SET role = 'moderator' WHERE id = 'user-id';

-- Grant unlimited access for 30 days
UPDATE profiles 
SET unlimited_until = NOW() + INTERVAL '30 days' 
WHERE id = 'user-id';
```

## 🎟️ Coupon System

### Coupon Types

1. **Credits** - Grant bonus credits to user
2. **Unlimited** - Grant unlimited access for X days
3. **Discount** - Percentage or fixed amount discount (future)

### Database Schema

```sql
-- Coupons table
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'credits', 'unlimited', 'discount'
  
  -- Credit bonus
  bonus_credits INTEGER,
  
  -- Unlimited access
  unlimited_days INTEGER,
  
  -- Discount (future)
  discount_percent INTEGER,
  discount_amount INTEGER,
  
  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Redemptions tracking
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID REFERENCES auth.users(id),
  credits_granted INTEGER DEFAULT 0,
  unlimited_until TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);
```

### Creating Coupons (Admin)

```sql
-- Example: 10 free credits
INSERT INTO coupons (code, type, bonus_credits, description, max_uses)
VALUES ('WELCOME10', 'credits', 10, 'Welcome bonus - 10 free credits', 1000);

-- Example: 30 days unlimited access
INSERT INTO coupons (code, type, unlimited_days, description, max_uses)
VALUES ('UNLIMITED30', 'unlimited', 30, '30 days unlimited access', 100);

-- Example: Friend & family code
INSERT INTO coupons (code, type, bonus_credits, description, max_uses_per_user)
VALUES ('FRIEND25', 'credits', 25, 'Friend & family bonus', 1);

-- Example: Limited time offer
INSERT INTO coupons (
  code, type, bonus_credits, description, 
  valid_from, valid_until, max_uses
)
VALUES (
  'SUMMER2025', 'credits', 50, 'Summer 2025 special offer',
  '2025-06-01', '2025-08-31', 500
);
```

### Coupon Validation Rules

1. **Active** - `is_active = true`
2. **Valid Date Range** - Current date between `valid_from` and `valid_until`
3. **Usage Limit** - `current_uses < max_uses` (if set)
4. **Per-User Limit** - User hasn't exceeded `max_uses_per_user`
5. **Unique Redemption** - User can't redeem same coupon twice (unless limit > 1)

### Redemption Flow

```
1. User enters coupon code
   ↓
2. API validates coupon
   ↓
3. Check usage limits
   ↓
4. Apply coupon benefits:
   - Credits: Add to user_credits
   - Unlimited: Set unlimited_until
   - Discount: Apply to next purchase
   ↓
5. Record redemption
   ↓
6. Increment usage counter
   ↓
7. Show success message
```

### API Endpoint

**POST** `/api/coupons/redeem`

```typescript
// Request
{
  "code": "WELCOME10"
}

// Response (success)
{
  "success": true,
  "type": "credits",
  "creditsGranted": 10,
  "description": "Welcome bonus - 10 free credits"
}

// Response (error)
{
  "success": false,
  "error": "Invalid or expired coupon code"
}
```

## 💳 Credits Page Redesign

### New Design Features

1. **Hero Section** - Beautiful gradient with animated heart icon
2. **Current Balance** - Large, prominent credit display
3. **Coupon Field** - Purple gradient section for redeeming codes
4. **Credit Packs** - 3-column grid with emoji icons
5. **Benefits Section** - What users get with credits

### Visual Design

```
┌─────────────────────────────────────────────┐
│  ❤️ (animated)                              │
│  Continue Your Journey                      │
│  Your wanderlust knows no bounds...         │
│  (Gradient: Pink → Orange → Blue)           │
├─────────────────────────────────────────────┤
│  Your Current Balance                       │
│  15 Credits                        ✨       │
├─────────────────────────────────────────────┤
│  🎁 Have a Coupon Code?                     │
│  Redeem your code for bonus credits...      │
│  [Enter coupon code]  [Redeem]              │
│  (Purple gradient background)               │
├─────────────────────────────────────────────┤
│  Choose Your Pack                           │
│                                             │
│  🌱 Starter    ✨ Explorer    🚀 Adventurer │
│  10 Credits    25 Credits     50 Credits    │
│  $15           $30 POPULAR    $50           │
│  [Purchase]    [Purchase]     [Purchase]    │
├─────────────────────────────────────────────┤
│  What You Get                               │
│  ✓ AI-powered itineraries                   │
│  ✓ Unlimited manual trips                   │
│  ✓ Credits never expire                     │
└─────────────────────────────────────────────┘
```

### Coupon Redemption UI

```tsx
<form onSubmit={handleRedeemCoupon}>
  <Input
    type="text"
    placeholder="Enter coupon code"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
    className="uppercase"
  />
  <Button type="submit" disabled={isRedeeming}>
    {isRedeeming ? 'Redeeming...' : 'Redeem'}
  </Button>
</form>
```

### Success Messages

- **Credits**: "🎉 10 credits added to your account!"
- **Unlimited**: "🚀 Unlimited access granted until Aug 31, 2025!"
- **Discount**: "💰 Discount applied!"

## 🧪 Testing

### Test Role Badges

1. **Set admin role:**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

2. **Refresh page**
3. **Check header** - Should see red shield badge on avatar
4. **Open mobile menu** - Should see badge + "Admin" label

### Test Unlimited Access

1. **Grant unlimited access:**
   ```sql
   UPDATE profiles 
   SET unlimited_until = NOW() + INTERVAL '30 days' 
   WHERE id = 'your-user-id';
   ```

2. **Refresh page**
3. **Check header** - Should see yellow/orange zap badge
4. **Badge should say "Plus"**

### Test Coupon Redemption

1. **Create test coupon:**
   ```sql
   INSERT INTO coupons (code, type, bonus_credits, description)
   VALUES ('TEST10', 'credits', 10, 'Test coupon - 10 credits');
   ```

2. **Go to** `/dashboard/credits`
3. **Enter code** "TEST10"
4. **Click Redeem**
5. **Should see** "🎉 10 credits added to your account!"
6. **Credits should increase** by 10

### Test Coupon Limits

1. **Try redeeming same coupon again**
2. **Should see error** "You have already used this coupon"

### Test Expired Coupon

1. **Create expired coupon:**
   ```sql
   INSERT INTO coupons (
     code, type, bonus_credits, 
     valid_until, is_active
   )
   VALUES (
     'EXPIRED', 'credits', 10,
     '2024-01-01', true
   );
   ```

2. **Try redeeming** "EXPIRED"
3. **Should see error** "Invalid or expired coupon code"

## 📊 Admin Coupon Management

### Useful Queries

```sql
-- View all active coupons
SELECT code, type, description, current_uses, max_uses, valid_until
FROM coupons
WHERE is_active = true
ORDER BY created_at DESC;

-- View coupon redemptions
SELECT 
  c.code,
  p.full_name,
  p.email,
  cr.credits_granted,
  cr.unlimited_until,
  cr.redeemed_at
FROM coupon_redemptions cr
JOIN coupons c ON c.id = cr.coupon_id
JOIN profiles p ON p.id = cr.user_id
ORDER BY cr.redeemed_at DESC;

-- Deactivate coupon
UPDATE coupons SET is_active = false WHERE code = 'OLDCODE';

-- Check coupon usage
SELECT 
  code,
  current_uses,
  max_uses,
  ROUND((current_uses::DECIMAL / NULLIF(max_uses, 0)) * 100, 2) as usage_percent
FROM coupons
WHERE max_uses IS NOT NULL
ORDER BY usage_percent DESC;
```

## 🔐 Security

### Coupon Code Best Practices

1. **Use uppercase** - Codes are case-insensitive (converted to uppercase)
2. **Avoid patterns** - Don't use sequential codes (PROMO1, PROMO2, etc.)
3. **Random generation** - Use secure random strings
4. **Limit uses** - Set `max_uses` to prevent abuse
5. **Expiry dates** - Always set `valid_until` for promotions

### Example Secure Code Generation

```javascript
// Generate random coupon code
function generateCouponCode(prefix = '', length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars
  let code = prefix
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Example: SUMMER-X7K9P2M4
const code = generateCouponCode('SUMMER-', 8)
```

## 📦 Files Created/Modified

### Created:
- `supabase/migrations/20250117_create_coupons_table.sql` - Coupon database schema
- `apps/web/app/api/coupons/redeem/route.ts` - Coupon redemption API
- `docs/ROLE_BADGES_AND_COUPONS.md` - This documentation

### Modified:
- `apps/web/contexts/AuthContext.tsx` - Added `role` and `unlimited_until` to Profile
- `apps/web/components/layout/AuthAwareHeader.tsx` - Added role badges
- `apps/web/app/dashboard/credits/page.tsx` - Redesigned with coupon field

---

**Implementation Date**: 2025-10-17  
**Status**: ✅ Complete  
**Next Steps**: Create admin UI for coupon management

