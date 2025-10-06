# TravelBlogr Test Account

## Test Credentials

For testing and demonstration purposes, use the following test account:

**Email:** `test@example.com`  
**Password:** `password123`

## How to Use

1. Navigate to the sign-in page: `/auth/signin`
2. Enter the test credentials above, or click "Use test credentials" button
3. Click "Sign in" to authenticate
4. You will be redirected to the dashboard with full access

## Test Account Features

The test account provides access to all authenticated features:

- ✅ **Dashboard Access** - View personalized dashboard
- ✅ **Trip Management** - Create, edit, and manage trips
- ✅ **Media Upload** - Upload and manage travel photos
- ✅ **Live Feed** - Access to Following/Discover tabs
- ✅ **Location Features** - Save locations, add to wishlist, write reviews
- ✅ **Profile Management** - Update profile information
- ✅ **Settings** - Access to user settings

## Test Account Profile

The test account comes with the following profile data:

```json
{
  "id": "test-user-id",
  "full_name": "Test User",
  "email": "test@example.com",
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Demo Mode

For any other email/password combination, the system will work in demo mode:
- Any credentials will be accepted
- A generic "Demo User" profile will be created
- All features will be available

## Authentication Flow

1. **Sign In Page** - Shows test credentials prominently
2. **Credential Validation** - Validates test account password
3. **Session Creation** - Creates mock session with proper user data
4. **Dashboard Redirect** - Redirects to authenticated dashboard
5. **Feature Access** - Full access to all authenticated features

## Development Notes

- The authentication system is currently using mock data
- Real Supabase integration is prepared but not active
- All user data is temporary and resets on page refresh
- Perfect for testing UI/UX flows without backend setup

## Testing

Run the authentication tests:

```bash
npm test auth.test.ts
```

The test suite validates:
- ✅ Successful login with test credentials
- ✅ Failed login with wrong password
- ✅ Demo mode functionality
- ✅ Profile data accuracy
- ✅ Email/password validation

## Security Notes

⚠️ **Important:** This is a development/demo authentication system only.
- Do not use in production
- Passwords are not encrypted
- Sessions are not persistent
- No real security measures are implemented

For production deployment, integrate with Supabase authentication or another secure auth provider.
