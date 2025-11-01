# OAuth Authentication Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TravelBlogr OAuth Flow                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User       │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Clicks "Sign in with Google"
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Sign In Page (/auth/signin)                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ supabase.auth.signInWithOAuth({                                │ │
│  │   provider: 'google',                                          │ │
│  │   options: {                                                   │ │
│  │     redirectTo: 'http://localhost:3000/auth/callback'          │ │
│  │   }                                                            │ │
│  │ })                                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 2. Redirect to Google
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Google OAuth Consent Screen                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  TravelBlogr wants to access:                                  │ │
│  │  • Your email address                                          │ │
│  │  • Your profile information                                    │ │
│  │                                                                │ │
│  │  [Cancel]  [Allow]                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 3. User approves
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Supabase Auth Server                                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Receives authorization code from Google                      │ │
│  │ • Exchanges code for access token                              │ │
│  │ • Creates/updates user in auth.users                           │ │
│  │ • Generates Supabase session tokens                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 4. Redirect with tokens in URL hash
                           │    /auth/callback#access_token=...&refresh_token=...
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Callback Page (/auth/callback)                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 1. Parse hash params (access_token, refresh_token)             │ │
│  │ 2. Supabase client auto-processes tokens                       │ │
│  │ 3. Wait 1 second for session establishment                     │ │
│  │ 4. Redirect to /dashboard                                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 5. Supabase client sets session
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Supabase Client (Browser)                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Stores tokens in localStorage                                │ │
│  │ • Sets up auto-refresh                                         │ │
│  │ • Fires onAuthStateChange event                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 6. SIGNED_IN event
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AuthContext (React)                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ onAuthStateChange((event, session) => {                        │ │
│  │   if (event === 'SIGNED_IN' && session?.user) {                │ │
│  │     // Fetch user profile from database                        │ │
│  │     const profile = await fetchProfile(session.user.id)        │ │
│  │                                                                │ │
│  │     // Update React state                                      │ │
│  │     setState({ user, profile, session })                       │ │
│  │   }                                                            │ │
│  │ })                                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 7. Fetch profile
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Database (Supabase)                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ auth.users                                                     │ │
│  │ ├─ id: 111cbe07-16b1-4c04-8cdb-1f808cfddbc4                   │ │
│  │ ├─ email: rimas.albert@googlemail.com                          │ │
│  │ └─ raw_user_meta_data:                                         │ │
│  │    ├─ full_name: "Rhymeas"                                │ │
│  │    └─ avatar_url: "https://lh3.googleusercontent.com/..."      │ │
│  │                                                                │ │
│  │ ▼ Trigger: on_auth_user_created                                │ │
│  │                                                                │ │
│  │ public.profiles                                                │ │
│  │ ├─ id: 111cbe07-16b1-4c04-8cdb-1f808cfddbc4                   │ │
│  │ ├─ full_name: "Rhymeas"                                   │ │
│  │ ├─ avatar_url: "https://lh3.googleusercontent.com/..."         │ │
│  │ └─ username: null                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ 8. Profile data returned
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Dashboard (/dashboard)                                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Header                                                  │ │ │
│  │  │  ┌────────┐                                              │ │ │
│  │  │  │ [RA] ▼ │  ← Avatar displays (with fallback to        │ │ │
│  │  │  └────────┘     initials if image fails)                │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  Welcome back, Rhymeas!                                   │ │
│  │                                                                │ │
│  │  [Create Trip]  [My Trips]  [Settings]                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User       │
│ (Logged In)  │
└──────────────┘
```

---

## Key Components

### 1. Supabase Client Configuration
```typescript
{
  auth: {
    persistSession: true,      // Store session in localStorage
    autoRefreshToken: true,    // Auto-refresh before expiry
    detectSessionInUrl: true,  // Process OAuth hash params
  }
}
```

### 2. AuthContext Listener
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Handles: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION
})
```

### 3. Database Trigger
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                        │
└─────────────────────────────────────────────────────────────┘

Sign In
   │
   ├─► Create Session
   │      │
   │      ├─► Store in localStorage
   │      │      └─► Key: sb-{project-id}-auth-token
   │      │
   │      ├─► Set expiry (1 hour)
   │      │
   │      └─► Start auto-refresh timer
   │
   ├─► Fire SIGNED_IN event
   │      │
   │      └─► AuthContext updates state
   │
   └─► User authenticated ✅

Auto-Refresh (every 50 minutes)
   │
   ├─► Request new tokens from Supabase
   │
   ├─► Update localStorage
   │
   ├─► Fire TOKEN_REFRESHED event
   │
   └─► Session extended ✅

Sign Out
   │
   ├─► Clear localStorage
   │
   ├─► Fire SIGNED_OUT event
   │      │
   │      └─► AuthContext clears state
   │
   └─► User logged out ✅
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Scenarios                          │
└─────────────────────────────────────────────────────────────┘

OAuth Error from Google
   │
   ├─► Redirect to /auth/callback?error=...
   │
   ├─► Display error message
   │
   └─► Redirect to /auth/signin after 2s

Session Expired
   │
   ├─► Auto-refresh fails
   │
   ├─► Fire SIGNED_OUT event
   │
   └─► Redirect to /auth/signin

Avatar Load Failure
   │
   ├─► onError handler triggered
   │
   ├─► Hide broken image
   │
   └─► Show initials fallback

Profile Not Found
   │
   ├─► fetchProfile returns null
   │
   ├─► Fallback to user.user_metadata
   │
   └─► Display name and avatar from OAuth data
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
└─────────────────────────────────────────────────────────────┘

Client Request
   │
   ├─► Include JWT in Authorization header
   │      └─► Bearer {access_token}
   │
   ├─► Supabase validates JWT
   │      ├─► Check signature
   │      ├─► Check expiry
   │      └─► Extract user ID
   │
   ├─► Row Level Security (RLS)
   │      ├─► Check auth.uid() = user_id
   │      └─► Allow/Deny based on policy
   │
   └─► Return data ✅

Token Storage
   │
   ├─► localStorage (client-side)
   │      ├─► Access token (1 hour)
   │      └─► Refresh token (persistent)
   │
   ├─► Never expose service role key
   │
   └─► HTTPS only in production
```

---

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Timeline                       │
└─────────────────────────────────────────────────────────────┘

0ms     User clicks "Sign in with Google"
        │
100ms   Redirect to Google
        │
        ├─► User approves (variable time)
        │
2000ms  Redirect to /auth/callback
        │
2100ms  Parse hash params
        │
2200ms  Supabase processes tokens
        │
3000ms  Wait for session (1s delay)
        │
3100ms  Redirect to /dashboard
        │
3200ms  Fetch profile from database
        │
3300ms  Render dashboard with avatar
        │
        ✅ Total: ~3.3 seconds
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Sources                           │
└─────────────────────────────────────────────────────────────┘

Google OAuth
   │
   ├─► email
   ├─► full_name
   ├─► avatar_url (picture)
   ├─► email_verified
   └─► provider_id
      │
      ▼
Supabase auth.users
   │
   ├─► id (UUID)
   ├─► email
   ├─► raw_user_meta_data
   │      ├─► full_name
   │      ├─► avatar_url
   │      └─► email_verified
   └─► created_at
      │
      ▼ (Trigger)
      │
public.profiles
   │
   ├─► id (references auth.users)
   ├─► full_name
   ├─► avatar_url
   ├─► username (null initially)
   ├─► bio (null initially)
   ├─► created_at
   └─► updated_at
      │
      ▼
React State (AuthContext)
   │
   ├─► user (from session)
   ├─► profile (from database)
   ├─► session (from Supabase)
   └─► loading, error
      │
      ▼
UI Components
   │
   ├─► Header (avatar, name)
   ├─► Dashboard (welcome message)
   └─► Settings (profile form)
```

---

**Last Updated**: 2025-01-13  
**Status**: ✅ Production Ready

