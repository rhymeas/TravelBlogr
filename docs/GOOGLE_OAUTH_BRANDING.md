# Google OAuth Branding Fix

## ✅ Legal Pages Now Live!

All required legal pages are now available:
- ✅ Privacy Policy: https://travelblogr-production.up.railway.app/privacy
- ✅ Terms of Service: https://travelblogr-production.up.railway.app/terms
- ✅ Cookie Policy: https://travelblogr-production.up.railway.app/cookies
- ✅ GDPR Compliance: https://travelblogr-production.up.railway.app/gdpr

---

## Problem
Google OAuth shows "nchhcxokrzabbkvhzsor.supabase.co" instead of "TravelBlogr"

## Solution

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your project: **TravelBlogr**
3. If you don't see it, click the project dropdown (top left) and search for "TravelBlogr"

### Step 2: Configure OAuth Consent Screen
1. Navigate to: **APIs & Services → OAuth consent screen**
2. Click **"EDIT APP"** button

### Step 3: Update App Information

#### **App Information Section:**
```
App name: TravelBlogr
User support email: brushmaster3000@gmail.com (or your email)
App logo: (optional - upload 120x120px PNG logo)
```

#### **App Domain Section:**
```
Application home page: https://travelblogr-production.up.railway.app
Application privacy policy: https://travelblogr-production.up.railway.app/privacy
Application terms of service: https://travelblogr-production.up.railway.app/terms
```

#### **Authorized Domains:**
```
nchhcxokrzabbkvhzsor.supabase.co
travelblogr-production.up.railway.app
railway.app
```

#### **Developer Contact Information:**
```
Email addresses: brushmaster3000@gmail.com
```

### Step 4: Save Changes
1. Click **"SAVE AND CONTINUE"**
2. Review scopes (should have email, profile, openid)
3. Click **"SAVE AND CONTINUE"** again
4. Review test users (add yourself if in Testing mode)
5. Click **"BACK TO DASHBOARD"**

### Step 5: Verify Changes
1. Log out of TravelBlogr
2. Click "Sign in with Google"
3. You should now see:
   ```
   Choose an account
   to continue to TravelBlogr
   ```
   Instead of:
   ```
   Choose an account
   to continue to nchhcxokrzabbkvhzsor.supabase.co
   ```

## Current Settings (from your screenshot)

✅ **Already configured:**
- Authorized domain 1: `nchhcxokrzabbkvhzsor.supabase.co`
- Authorized domain 2: `travelblogr-production.up.railway.app`
- Authorized domain 3: `travelblogr.com`
- Authorized domain 4: `railway.app`

❌ **Missing:**
- App name: Still showing default
- App logo: Not set
- Privacy policy URL: Not set
- Terms of service URL: Not set

## What to Update

Go to the **"Branding"** section (left sidebar) and update:

1. **Application name:** `TravelBlogr`
2. **Application logo:** Upload a 120x120px PNG (optional but recommended)
3. **Application home page:** `https://travelblogr-production.up.railway.app`
4. **Application privacy policy link:** `https://travelblogr-production.up.railway.app/privacy`
5. **Application terms of service link:** `https://travelblogr-production.up.railway.app/terms`

Then click **"Save"** at the bottom.

## Notes

- Changes take effect immediately (no waiting period)
- You may need to clear browser cache or use incognito mode to see changes
- If app is in "Testing" mode, only test users can sign in
- For public access, you'll need to publish the app (requires verification)

## Troubleshooting

**Still seeing old name?**
- Clear browser cache
- Try incognito/private browsing mode
- Wait 5-10 minutes for changes to propagate

**Can't find the project?**
- Check if you're logged into the correct Google account
- The project might be under a different organization
- Check Supabase dashboard for the Google OAuth Client ID, then search for it in Google Cloud Console

**Verification required?**
- If you want public access (not just test users), you'll need to submit for verification
- For now, keep it in "Testing" mode and add specific test users
- Verification can take 1-2 weeks

## Privacy Policy & Terms (Quick Setup)

You need these pages for Google OAuth. I can create simple placeholder pages:

### Option 1: Create placeholder pages
```bash
# I can create these for you:
/app/privacy/page.tsx
/app/terms/page.tsx
```

### Option 2: Use external links
- Use a privacy policy generator: https://www.privacypolicygenerator.info/
- Use a terms generator: https://www.termsofservicegenerator.net/

Let me know if you want me to create simple placeholder pages!

