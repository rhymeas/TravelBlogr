# 🚀 Supabase Setup Guide for TravelBlogr

Complete step-by-step guide to set up Supabase for the auto-fill feature.

---

## ✅ Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with:
   - **GitHub** (recommended - fastest) ⭐
   - Or email/password

---

## ✅ Step 2: Create New Project

1. After signing in, click **"New Project"** (green button)
2. Fill in the project details:
   ```
   Name: TravelBlogr
   Database Password: [Create a strong password - SAVE THIS!]
   Region: [Choose closest to you]
   Pricing Plan: Free
   ```
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for setup to complete

---

## ✅ Step 3: Get Your API Keys

1. Once ready, click **Settings** (⚙️ icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see three important values:

   **📋 Copy these:**
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - KEEP SECRET!)

---

## ✅ Step 4: Update Environment Variables

1. Open the file `.env.local` in your project root
2. Replace the placeholder values with your Supabase credentials:

```bash
# Paste your values here:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save the file** (Cmd+S / Ctrl+S)

---

## ✅ Step 5: Create Database Tables

1. In Supabase Dashboard, click **"SQL Editor"** (📝 icon in left sidebar)
2. Click **"New query"**
3. Open the file `infrastructure/database/setup-quick.sql` in your code editor
4. **Copy ALL the SQL code** from that file
5. **Paste it** into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
7. You should see: ✅ Success messages

**What this creates:**
- ✅ `locations` table (for location pages)
- ✅ `restaurants` table (auto-filled from OpenStreetMap)
- ✅ `activities` table (auto-filled from OpenStreetMap)
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Auto-update timestamps

---

## ✅ Step 6: Verify Tables Were Created

1. In Supabase Dashboard, click **"Table Editor"** (📊 icon in left sidebar)
2. You should see three tables:
   - ✅ `locations`
   - ✅ `restaurants`
   - ✅ `activities`

---

## ✅ Step 7: Restart Your Dev Server

1. Stop the current dev server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   cd apps/web
   npm run dev
   ```
3. Wait for it to start (should show: `Ready in X.Xs`)

---

## ✅ Step 8: Test the Auto-Fill Feature!

1. Open your browser to: **http://localhost:3000/admin/auto-fill**
2. Type a location name: `Tokyo` or `Banff National Park`
3. Click **"Auto-Fill Content"**
4. You should see:
   - ✅ Location geocoded
   - ✅ Saved to database
   - ✅ Success message with coordinates

---

## 🎉 Success! What's Next?

Once the basic setup works, you can:

1. **Add more free APIs:**
   - OpenWeatherMap (weather data)
   - Unsplash (images)
   - Wikipedia (descriptions)

2. **View your data:**
   - Go to Supabase Dashboard > Table Editor
   - Click on `locations` table
   - See your auto-filled locations!

3. **Customize:**
   - Edit location descriptions
   - Add custom images
   - Publish locations

---

## 🆘 Troubleshooting

### Problem: "supabaseUrl is required" error

**Solution:** Make sure you:
1. Saved the `.env.local` file
2. Restarted the dev server
3. The values don't have quotes around them

### Problem: "Failed to create location in database"

**Solution:** Check that:
1. You ran the SQL setup script
2. The tables exist in Supabase Table Editor
3. Your service_role key is correct

### Problem: Tables not showing in Supabase

**Solution:**
1. Make sure you clicked "Run" in SQL Editor
2. Check for error messages in the SQL Editor
3. Try running the script again

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Dashboard:** https://supabase.com/dashboard
- **TravelBlogr Full Schema:** `infrastructure/database/schema.sql`

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**
- ✅ `.env.local` is in `.gitignore` (won't be committed to git)
- ✅ Never share your `service_role` key publicly
- ✅ The `anon` key is safe to use in frontend code
- ✅ Row Level Security (RLS) is enabled for protection

---

## ✨ Quick Reference

**Supabase Dashboard:** https://supabase.com/dashboard

**Your Project URL:** (from Step 3)
```
https://xxxxx.supabase.co
```

**Environment Variables Location:**
```
.env.local (in project root)
```

**Database Setup Script:**
```
infrastructure/database/setup-quick.sql
```

**Auto-Fill Admin Page:**
```
http://localhost:3000/admin/auto-fill
```

---

**Need help?** Check the troubleshooting section above or review the error messages in your browser console.

