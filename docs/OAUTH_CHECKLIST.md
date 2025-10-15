# OAuth Implementation Checklist

Use this checklist when implementing or debugging OAuth authentication.

---

## 🔧 Initial Setup

### Supabase Configuration

- [ ] **Enable Google Provider**
  - Go to Supabase Dashboard → Authentication → Providers
  - Enable Google
  - Add Client ID from Google Cloud Console
  - Add Client Secret from Google Cloud Console

- [ ] **Configure Redirect URLs**
  - Go to Supabase Dashboard → Authentication → URL Configuration
  - Set Site URL: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
  - Add Redirect URLs:
    - `http://localhost:3000/auth/callback`
    - `https://yourdomain.com/auth/callback`
    - `https://your-project.supabase.co/auth/v1/callback`

- [ ] **Create Profiles Table**
  ```sql
  CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **Enable Row Level Security**
  ```sql
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);
  
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
  ```

- [ ] **Create Profile Trigger**
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      NOW(), NOW()
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

### Google Cloud Console

- [ ] **Create Project**
  - Go to [Google Cloud Console](https://console.cloud.google.com/)
  - Create new project or select existing

- [ ] **Enable Google+ API**
  - Go to APIs & Services → Library
  - Search for "Google+ API"
  - Click Enable

- [ ] **Configure OAuth Consent Screen**
  - Go to APIs & Services → OAuth consent screen
  - Choose External user type
  - Fill in:
    - App name: `TravelBlogr`
    - User support email: your email
    - Developer contact: your email
  - Add scopes:
    - `userinfo.email`
    - `userinfo.profile`
  - Add test users (for development)

- [ ] **Create OAuth Credentials**
  - Go to APIs & Services → Credentials
  - Create Credentials → OAuth client ID
  - Application type: Web application
  - Name: `TravelBlogr Web Client`
  - Authorized JavaScript origins:
    - `http://localhost:3000`
    - `https://yourdomain.com`
    - `https://your-project.supabase.co`
  - Authorized redirect URIs:
    - `http://localhost:3000/auth/callback`
    - `https://yourdomain.com/auth/callback`
    - `https://your-project.supabase.co/auth/v1/callback`
  - Save Client ID and Client Secret

### Environment Variables

- [ ] **Set Environment Variables**
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

- [ ] **Verify Variables Loaded**
  ```javascript
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  ```

---

## 💻 Code Implementation

### Supabase Client

- [ ] **Configure Client** (`apps/web/lib/supabase.ts`)
  ```typescript
  export function getBrowserSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // ✅ Critical for OAuth!
        }
      }
    )
  }
  ```

### AuthContext

- [ ] **Use onAuthStateChange** (NOT getSession)
  ```typescript
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, session, loading: false })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])
  ```

- [ ] **DON'T call getSession() on mount** (causes hanging)

### OAuth Callback Page

- [ ] **Simplify Callback** (`apps/web/app/auth/callback/page.tsx`)
  ```typescript
  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      
      if (accessToken) {
        // ✅ Let Supabase handle session automatically
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/dashboard')
      }
    }
    handleCallback()
  }, [router])
  ```

- [ ] **DON'T call setSession() manually** (causes hanging)

### Sign In Button

- [ ] **Implement Sign In** (`apps/web/app/auth/signin/page.tsx`)
  ```typescript
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) console.error('OAuth error:', error)
  }
  ```

### Avatar Display

- [ ] **Fix Avatar Loading** (`apps/web/components/layout/AuthAwareHeader.tsx`)
  ```typescript
  <img
    src={profile?.avatar_url || user?.user_metadata?.avatar_url}
    alt={profile?.full_name || user?.email}
    className="h-8 w-8 rounded-full object-cover"
    referrerPolicy="no-referrer"  // ✅ Critical for Google images!
    crossOrigin="anonymous"
    onError={(e) => {
      // Fallback to initials
    }}
  />
  ```

### Next.js Configuration

- [ ] **Add Image Domain** (`apps/web/next.config.js`)
  ```javascript
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // ✅ Google avatars
      },
    ]
  }
  ```

---

## 🧪 Testing

### Local Testing

- [ ] **Clear Browser Data**
  - Clear cache and cookies
  - Clear localStorage: `localStorage.clear()`
  - Use incognito/private window

- [ ] **Test Sign In Flow**
  - [ ] Click "Sign in with Google"
  - [ ] Redirected to Google consent screen
  - [ ] Approve access
  - [ ] Redirected to /auth/callback
  - [ ] See "Completing sign in..." spinner
  - [ ] Redirected to /dashboard
  - [ ] Avatar displays correctly
  - [ ] No errors in console

- [ ] **Verify Database**
  ```sql
  -- Check user created
  SELECT * FROM auth.users WHERE email = 'your-email@gmail.com';
  
  -- Check profile created
  SELECT * FROM profiles WHERE id = 'user-id-here';
  ```

- [ ] **Test Session Persistence**
  - [ ] Refresh page
  - [ ] User still logged in
  - [ ] Avatar still displays

- [ ] **Test Sign Out**
  - [ ] Click sign out
  - [ ] Redirected to home page
  - [ ] Session cleared
  - [ ] Can sign in again

### Production Testing

- [ ] **Update Redirect URLs**
  - [ ] Google Cloud Console → Credentials
  - [ ] Supabase Dashboard → URL Configuration
  - [ ] Add production domain

- [ ] **Set Production Environment Variables**
  ```bash
  NEXT_PUBLIC_SITE_URL=https://yourdomain.com
  ```

- [ ] **Test on Production**
  - [ ] OAuth flow works
  - [ ] HTTPS enforced
  - [ ] Avatar loads over HTTPS
  - [ ] No CORS errors

---

## 🐛 Debugging

### Common Issues

- [ ] **"getSession timeout after 3s"**
  - ✅ Remove `getSession()` call on mount
  - ✅ Use `onAuthStateChange` instead

- [ ] **Avatar 403 Error**
  - ✅ Add `referrerPolicy="no-referrer"` to `<img>`
  - ✅ Add `crossOrigin="anonymous"`

- [ ] **"Invalid redirect URL"**
  - ✅ Check redirect URLs in Supabase match exactly
  - ✅ Check redirect URIs in Google Cloud Console

- [ ] **Profile is null**
  - ✅ Check trigger exists and is enabled
  - ✅ Add fallback to `user.user_metadata`

- [ ] **Redirect loop**
  - ✅ Check for errors in console
  - ✅ Verify `detectSessionInUrl: true` in client config

### Debug Commands

- [ ] **Check Session**
  ```javascript
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Session:', session)
  ```

- [ ] **Check localStorage**
  ```javascript
  console.log('Auth token:', localStorage.getItem('sb-nchhcxokrzabbkvhzsor-auth-token'))
  ```

- [ ] **Check Profile**
  ```sql
  SELECT * FROM profiles WHERE id = 'user-id-here';
  ```

- [ ] **Check Trigger**
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  ```

---

## 📚 Documentation

- [ ] **Read Setup Guide**: `docs/OAUTH_SETUP.md`
- [ ] **Read Troubleshooting**: `docs/OAUTH_TROUBLESHOOTING.md`
- [ ] **Review Flow Diagram**: `docs/OAUTH_FLOW_DIAGRAM.md`
- [ ] **Check Changelog**: `docs/CHANGELOG_OAUTH.md`

---

## ✅ Final Verification

- [ ] OAuth sign-in works
- [ ] Profile created automatically
- [ ] Avatar displays correctly
- [ ] Session persists on refresh
- [ ] Sign out works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Code is clean (no debug logs)
- [ ] Documentation is complete
- [ ] Tests pass

---

**Last Updated**: 2025-01-13  
**Status**: Ready for Production ✅

