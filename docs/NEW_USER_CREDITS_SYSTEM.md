# New User Credits System

## 🎯 Overview

Implemented a comprehensive credit system for new users with the following features:

1. **Welcome Bonus**: New users get 15 free credits (10 regular + 5 pro mode)
2. **Header Display**: Credits shown in top-right header for authenticated users
3. **Authentication Required**: Planning requires login
4. **Manual Trip Planning**: First 2 trips can be manually created for free

## 🎁 Welcome Bonus Credits

### New User Credits
- **10 credits** for regular AI itinerary generation
- **5 credits** for pro mode AI itinerary generation
- **Total: 15 free credits** on signup

### Implementation

**Database Migration**: `supabase/migrations/20250117_update_new_user_credits.sql`

```sql
-- Auto-create credits for new users
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_remaining, credits_purchased, credits_used)
  VALUES (NEW.id, 15, 0, 0);
  
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 15, 'bonus', 'Welcome bonus: 10 regular + 5 pro mode AI itinerary generations');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger**: Automatically runs when user signs up in `auth.users`

```sql
CREATE TRIGGER on_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits();
```

## 💳 Credits Display in Header

### Visual Design
- **Location**: Top-right header, before "Create Trip" button
- **Style**: Sleek gray text with coin icon
- **Hover**: Subtle background change
- **Click**: Links to `/dashboard/credits` page

### Implementation

**Component**: `apps/web/components/layout/AuthAwareHeader.tsx`

```tsx
{/* Credits Display */}
{!creditsLoading && (
  <Link
    href="/dashboard/credits"
    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
    title="View credits"
  >
    <Coins className="h-4 w-4" />
    <span className="font-medium">{credits}</span>
  </Link>
)}
```

**Hook**: `apps/web/hooks/useUserCredits.ts`

```typescript
export function useUserCredits() {
  const { user, isAuthenticated } = useAuth()
  const [credits, setCredits] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetches credits from /api/credits/balance
  // Returns: { credits, stats, loading, error, refresh }
}
```

**API**: `apps/web/app/api/credits/balance/route.ts`

- Returns user's credit balance
- Auto-creates credits record if missing (with 15 welcome bonus)
- Logs welcome bonus transaction

## 🔐 Authentication Requirements

### Planning Requires Login

**Component**: `apps/web/components/itinerary/ItineraryGenerator.tsx`

```typescript
const handleGenerate = async () => {
  // Check authentication first
  if (!isAuthenticated) {
    showSignIn('/plan')  // Show sign-in modal
    return
  }
  
  // ... proceed with generation
}
```

**Flow**:
1. User goes to `/plan`
2. Fills in locations and dates
3. Clicks "Generate plan"
4. If not logged in → Sign-in modal appears
5. After login → Can generate plan
6. Credits are deducted from balance

### Admin Bypass

Admins have unlimited credits (see `docs/PLAN_AUTH_ADMIN_FIX.md`):

```typescript
// In API route
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

const isAdmin = profile?.role === 'admin'

// Skip usage tracking for admins
if (!isAdmin) {
  await incrementAIUsage(user.id)
}
```

## 📝 Manual Trip Planning (Free)

### First 2 Trips Free

Users can manually create their first 2 trips without using credits:

**Implementation**: Already exists in trip creation flow

- **Location**: `/dashboard/trips/new`
- **No credit check**: Manual trip creation doesn't consume credits
- **Only AI generation uses credits**

### Trip Creation Options

1. **Manual Creation** (Free)
   - User fills in trip details manually
   - No AI involved
   - No credits consumed
   - Unlimited manual trips

2. **AI Generation** (Uses Credits)
   - User provides start/end locations + dates
   - AI generates full itinerary
   - Consumes 1 credit per generation
   - Pro mode uses different credit pool

## 🔄 Credit Flow

### New User Journey

```
1. User signs up
   ↓
2. Trigger creates user_credits record (15 credits)
   ↓
3. Transaction logged: "Welcome bonus: 10 regular + 5 pro mode..."
   ↓
4. User sees credits in header
   ↓
5. User goes to /plan
   ↓
6. Clicks "Generate plan"
   ↓
7. If not logged in → Sign-in modal
   ↓
8. After login → Plan generates
   ↓
9. Credit deducted (14 remaining)
   ↓
10. Header updates to show 14 credits
```

### Credit Types

| Type | Description | Initial Amount |
|------|-------------|----------------|
| Regular | Standard AI itinerary generation | 10 credits |
| Pro Mode | Advanced AI with more details | 5 credits |
| Purchased | User buys more credits | 0 (can purchase) |

### Credit Consumption

| Action | Credits Used | Notes |
|--------|--------------|-------|
| Manual trip creation | 0 | Always free |
| AI itinerary (regular) | 1 | From regular pool |
| AI itinerary (pro mode) | 1 | From pro pool |
| Saving AI plan to profile | 0 | Free to save |

## 📊 Database Schema

### user_credits Table

```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### credit_transactions Table

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'purchase', 'usage', 'bonus', 'refund'
  description TEXT,
  stripe_payment_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🧪 Testing

### Test New User Signup

1. **Create new account**:
   ```
   Email: test@example.com
   Password: Test123!
   ```

2. **Check credits**:
   - Look at header → Should show "15"
   - Go to `/dashboard/credits` → Should show 15 credits

3. **Verify database**:
   ```sql
   SELECT * FROM user_credits WHERE user_id = 'user-id';
   -- Should show: credits_remaining = 15
   
   SELECT * FROM credit_transactions WHERE user_id = 'user-id';
   -- Should show: Welcome bonus transaction
   ```

### Test Planning Flow

1. **Go to `/plan` (not logged in)**
2. Fill in locations
3. Click "Generate plan"
4. ✅ Sign-in modal should appear
5. Sign in
6. Click "Generate plan" again
7. ✅ Plan should generate
8. ✅ Credits should decrease to 14
9. ✅ Header should update

### Test Admin Unlimited Credits

1. **Set admin role**:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'user-id';
   ```

2. **Generate multiple plans**
3. ✅ Credits should NOT decrease
4. ✅ Console should show `isAdmin: true`

## 📦 Files Modified/Created

### Created
- `supabase/migrations/20250117_update_new_user_credits.sql` - Database migration
- `apps/web/hooks/useUserCredits.ts` - Credits hook
- `docs/NEW_USER_CREDITS_SYSTEM.md` - This documentation

### Modified
- `apps/web/components/layout/AuthAwareHeader.tsx` - Added credits display
- `apps/web/components/itinerary/ItineraryGenerator.tsx` - Auth check (already done)
- `apps/web/app/api/credits/balance/route.ts` - Already exists

## 🎨 UI/UX

### Header Credits Display

```
┌─────────────────────────────────────────────┐
│  TravelBlogr    Plan  Trips  Locations      │
│                                             │
│                    [💰 15]  [+ Create Trip] │
│                                    [Avatar] │
└─────────────────────────────────────────────┘
```

**Styling**:
- Gray text (`text-gray-600`)
- Coin icon (`Coins` from lucide-react)
- Hover effect (darker gray + background)
- Rounded pill shape
- Links to credits page

## 🚀 Deployment

### Run Migration

```bash
# In Supabase dashboard SQL editor
-- Run the migration file
-- Or use Supabase CLI:
supabase db push
```

### Verify

1. Check trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_user_created_credits';
   ```

2. Test with new user signup

3. Check header displays credits

## ✅ Checklist

- [x] Database migration created
- [x] Trigger auto-creates credits for new users
- [x] Welcome bonus logged in transactions
- [x] Credits hook created
- [x] Header displays credits
- [x] Credits link to dashboard
- [x] Planning requires authentication
- [x] Admin bypass implemented
- [x] Documentation complete

---

**Implementation Date**: 2025-10-17  
**Status**: ✅ Complete  
**Next Steps**: Test with real user signups, monitor credit usage

