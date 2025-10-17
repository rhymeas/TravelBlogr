# TravelBlogr Feedback System

## Overview

Simple, custom feedback system that allows users to send feedback about the product. Feedback is stored in Supabase and can be managed through the admin panel.

## Features

- ✅ **Mobile & Desktop Modal** - Clean feedback form accessible from anywhere
- ✅ **Guest & Authenticated Users** - Anyone can send feedback
- ✅ **Admin Dashboard** - View, filter, and respond to feedback
- ✅ **Status Management** - Track feedback (new, in progress, resolved, archived)
- ✅ **Email Collection** - Optional email for follow-up
- ✅ **Page Context** - Automatically captures page URL and user agent
- ✅ **No External Dependencies** - Built with Supabase, no third-party services

## User Flow

### Sending Feedback

1. User clicks "+" button in mobile bottom nav (or desktop equivalent)
2. Selects "Leave Feedback" from action menu
3. Fills out feedback form:
   - Message (required)
   - Email (optional for guests, auto-filled for authenticated users)
4. Submits feedback
5. Receives success confirmation

### Admin Management

1. Admin navigates to `/admin/feedback`
2. Views feedback dashboard with stats:
   - Total feedback count
   - New, In Progress, Resolved counts
3. Filters feedback by status
4. Clicks on feedback to view details
5. Can:
   - Mark as "In Progress"
   - Mark as "Resolved"
   - Add admin response
   - View user info, page URL, timestamp

## Database Schema

```sql
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  admin_response TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

## Files Created

### Components
- `apps/web/components/feedback/FeedbackModal.tsx` - Feedback form modal

### API Routes
- `apps/web/app/api/feedback/route.ts` - POST endpoint to submit feedback

### Admin Pages
- `apps/web/app/admin/feedback/page.tsx` - Admin dashboard for managing feedback

### Database
- `supabase/migrations/20250116_create_feedback_table.sql` - Database migration

## Setup Instructions

### 1. Run Database Migration

Copy the SQL from `supabase/migrations/20250116_create_feedback_table.sql` and run it in your Supabase SQL Editor:

```bash
# SQL is already copied to clipboard!
# Just paste it into Supabase SQL Editor and run
```

Or manually:
1. Go to Supabase Dashboard → SQL Editor
2. Paste the migration SQL
3. Click "Run"

### 2. Test the Feature

**Mobile:**
1. Open app on mobile or resize browser to < 1024px width
2. Tap the blue "+" button in bottom nav
3. Select "Leave Feedback"
4. Fill out and submit

**Desktop:**
- Same flow (will need to add desktop trigger button)

**Admin:**
1. Navigate to `/admin/feedback`
2. View and manage feedback

## Row Level Security (RLS)

The feedback table has the following RLS policies:

- **Anyone can submit feedback** - Guests and authenticated users
- **Users can view their own feedback** - If authenticated
- **Admins can view all feedback** - Requires `role = 'admin'` in profiles table
- **Admins can update feedback** - Add responses, change status

## Future Enhancements

- [ ] Email notifications to admins when new feedback arrives
- [ ] Email responses to users when admin replies
- [ ] Feedback categories (bug, feature request, general)
- [ ] Screenshot attachment support
- [ ] Feedback voting/upvoting system
- [ ] Public feedback board for feature requests
- [ ] Integration with project management tools (Linear, Jira)

## API Reference

### POST /api/feedback

Submit new feedback.

**Request Body:**
```json
{
  "message": "string (required)",
  "email": "string (optional)",
  "user_id": "uuid (optional, auto-filled if authenticated)",
  "page_url": "string (optional, auto-captured)",
  "user_agent": "string (optional, auto-captured)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "string",
    "status": "new",
    "created_at": "timestamp"
  }
}
```

## Troubleshooting

### Feedback not submitting
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies are enabled

### Admin can't see feedback
- Verify user has `role = 'admin'` in profiles table
- Check RLS policies in Supabase

### Migration fails
- Check if table already exists
- Verify Supabase connection
- Check for syntax errors in SQL

## Support

For issues or questions, check:
- Supabase Dashboard → Table Editor → feedback
- Browser console for errors
- Network tab for API call failures

