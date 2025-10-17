# Feedback System Setup Guide

## Quick Setup (3 Steps)

### Step 1: Run Database Migrations

The combined SQL is already copied to your clipboard! Just:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. **Paste** (Cmd+V) - this includes both migrations:
   - Add `role` column to profiles
   - Create `feedback` table with RLS policies
3. Click **Run**

### Step 2: Make Yourself Admin

After running the migrations, run this SQL (replace with your user ID):

```sql
UPDATE profiles SET role = 'admin' WHERE id = '111cbe07-16b1-4c04-8cdb-1f808cfddbc4';
```

To find your user ID:
```sql
SELECT id, email, full_name FROM profiles WHERE email = 'your-email@example.com';
```

### Step 3: Test It!

**Desktop:**
- Look for the blue "Feedback" button in the bottom-right corner
- Click it and send test feedback

**Mobile:**
- Tap the blue "+" button in bottom nav
- Select "Leave Feedback"
- Send test feedback

**Admin Panel:**
- Go to `/admin/feedback`
- You should see your test feedback
- Try responding to it

---

## What Was Added

### 1. Desktop Feedback Button
- **File:** `apps/web/components/feedback/FeedbackButton.tsx`
- **Location:** Fixed bottom-right corner (desktop only)
- **Color:** TravelBlogr blue (#2B5F9E)
- **Visibility:** Hidden on mobile (< 1024px)

### 2. Mobile Feedback Option
- **File:** `apps/web/components/mobile/MobileActionMenu.tsx`
- **Location:** "+" button → "Leave Feedback"
- **Works for:** Guests and authenticated users

### 3. Admin Dashboard
- **URL:** `/admin/feedback`
- **Features:**
  - View all feedback with stats
  - Filter by status (new, in progress, resolved)
  - Click to view details
  - Add admin responses
  - Mark as resolved

### 4. Database Tables
- **profiles.role** - User role (user, admin, moderator)
- **feedback** - Feedback submissions with RLS

---

## Troubleshooting

### "Column role does not exist"
✅ **Fixed!** Run the migrations from Step 1 above.

### "Permission denied for table feedback"
- Check RLS policies are enabled
- Verify you're admin: `SELECT role FROM profiles WHERE id = auth.uid();`

### Feedback button not showing on desktop
- Check screen width is ≥ 1024px
- Check browser console for errors
- Verify `FeedbackButton` is imported in `layout.tsx`

### Can't access admin panel
- Verify you ran: `UPDATE profiles SET role = 'admin' WHERE id = 'your-id';`
- Check you're logged in
- Try logging out and back in

---

## Files Modified

1. ✅ `apps/web/app/layout.tsx` - Added FeedbackButton
2. ✅ `apps/web/components/feedback/FeedbackButton.tsx` - New desktop button
3. ✅ `apps/web/components/feedback/FeedbackModal.tsx` - Shared modal
4. ✅ `apps/web/components/mobile/MobileActionMenu.tsx` - Mobile integration
5. ✅ `apps/web/app/api/feedback/route.ts` - API endpoint
6. ✅ `apps/web/app/admin/feedback/page.tsx` - Admin dashboard
7. ✅ `supabase/migrations/20250116_add_role_to_profiles.sql` - Add role column
8. ✅ `supabase/migrations/20250116_create_feedback_table.sql` - Create feedback table

---

## Next Steps

After setup is complete:

1. **Test the flow** - Send feedback from both mobile and desktop
2. **Check admin panel** - Verify you can see and respond to feedback
3. **Customize** - Adjust button position, colors, or text as needed
4. **Monitor** - Check `/admin/feedback` regularly for user feedback

---

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify migrations ran successfully
3. Check browser console for client-side errors
4. Verify RLS policies are enabled

