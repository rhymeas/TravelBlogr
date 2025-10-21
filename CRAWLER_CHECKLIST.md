# ✅ Content Crawler Setup Checklist

Quick checklist to get your content crawler up and running.

---

## 📦 Installation

- [ ] **Install crawler dependencies**
  ```bash
  npm run crawler:install
  ```

- [ ] **Install Playwright browsers**
  ```bash
  npm run crawler:setup
  ```

---

## 🔑 API Keys & Secrets

- [ ] **Get OpenWeatherMap API key**
  - Go to https://openweathermap.org/api
  - Sign up for free account
  - Copy API key from dashboard

- [ ] **Generate security secrets**
  ```bash
  # Generate CRON_SECRET
  openssl rand -base64 32
  
  # Generate ADMIN_SECRET
  openssl rand -base64 32
  ```

- [ ] **Update .env.local**
  ```env
  OPENWEATHER_API_KEY=your-key-here
  CRON_SECRET=your-cron-secret
  ADMIN_SECRET=your-admin-secret
  ```

---

## 🗄️ Database Setup

- [ ] **Run migration in Supabase**
  1. Open Supabase Dashboard → SQL Editor
  2. Copy `infrastructure/database/migrations/003_crawler_tables.sql`
  3. Paste and execute

- [ ] **Verify tables created**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND (table_name LIKE 'location_%' OR table_name = 'crawler_logs');
  ```
  
  Should see:
  - `location_weather`
  - `location_restaurants`
  - `location_activities`
  - `crawler_logs`

---

## 🧪 Local Testing

- [ ] **Start dev server**
  ```bash
  npm run dev
  ```

- [ ] **Test admin dashboard**
  - Navigate to http://localhost:3000/admin/crawler
  - Should see weather sync and restaurant crawler forms

- [ ] **Test weather sync (single location)**
  1. Get a location ID from your database
  2. Get latitude/longitude for that location
  3. Fill in the weather sync form
  4. Click "Sync Weather for Location"
  5. Check for success message

- [ ] **Verify data in Supabase**
  ```sql
  SELECT * FROM location_weather ORDER BY updated_at DESC LIMIT 5;
  ```

---

## 🚀 Deployment

- [ ] **Deploy to  do-not-use-this-anymore-no-vercel-we-use-railway-now**
  ```bash
   do-not-use-this-anymore-no-vercel-we-use-railway-now --prod
  ```

- [ ] **Set environment variables in  do-not-use-this-anymore-no-vercel-we-use-railway-now**
  Go to Project Settings → Environment Variables and add:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENWEATHER_API_KEY`
  - `CRON_SECRET`
  - `ADMIN_SECRET`

- [ ] **Verify cron job is configured**
  - Go to  do-not-use-this-anymore-no-vercel-we-use-railway-now Dashboard → Your Project → Cron Jobs
  - Should see: `/api/cron/sync-weather` scheduled for `0 */6 * * *`

- [ ] **Test production endpoint**
  ```bash
  curl -X POST https://your-app. do-not-use-this-anymore-no-vercel-we-use-railway-now.app/api/cron/sync-weather \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

---

## 🔍 Verification

- [ ] **Check first cron execution**
  - Wait for next scheduled time (00:00, 06:00, 12:00, or 18:00 UTC)
  - Check  do-not-use-this-anymore-no-vercel-we-use-railway-now cron logs
  - Verify weather data updated in Supabase

- [ ] **Test restaurant crawler**
  1. Find a restaurant website with Schema.org markup
  2. Use admin dashboard to crawl it
  3. Check `location_restaurants` table for new entry

- [ ] **Review crawler logs**
  ```sql
  SELECT * FROM crawler_logs ORDER BY started_at DESC LIMIT 10;
  ```

---

## 📊 Monitoring (First Week)

- [ ] **Day 1:** Check cron job ran successfully
- [ ] **Day 2:** Verify weather data is updating
- [ ] **Day 3:** Test restaurant crawler with 5-10 URLs
- [ ] **Day 4:** Review error logs and fix any issues
- [ ] **Day 5:** Mark verified restaurants as `is_verified = true`
- [ ] **Day 7:** Review API usage (should be well under 1,000 calls/day)

---

## 🎯 Success Criteria

✅ Weather data updates automatically every 6 hours  
✅ Restaurant crawler successfully extracts data from websites  
✅ Admin dashboard is accessible and functional  
✅ No errors in  do-not-use-this-anymore-no-vercel-we-use-railway-now cron logs  
✅ Data appears correctly in Supabase tables  
✅ API usage is within free tier limits  

---

## 🆘 Troubleshooting

If something doesn't work, check:

1. **Environment variables are set correctly**
   - In `.env.local` for local development
   - In  do-not-use-this-anymore-no-vercel-we-use-railway-now Dashboard for production

2. **Database migration ran successfully**
   - All 4 tables should exist
   - RLS policies should be enabled

3. **API keys are valid**
   - Test OpenWeatherMap key: https://api.openweathermap.org/data/2.5/weather?lat=51.1784&lon=-115.5708&appid=YOUR_KEY

4. **Secrets match**
   - `CRON_SECRET` in  do-not-use-this-anymore-no-vercel-we-use-railway-now must match what you use in curl commands
   - `ADMIN_SECRET` for admin dashboard access

5. **Check logs**
   -  do-not-use-this-anymore-no-vercel-we-use-railway-now function logs
   - Supabase `crawler_logs` table
   - Browser console (for admin dashboard)

---

## 📚 Documentation

- **Detailed Setup:** [CRAWLER_SETUP.md](CRAWLER_SETUP.md)
- **Implementation Summary:** [CRAWLER_IMPLEMENTATION_SUMMARY.md](CRAWLER_IMPLEMENTATION_SUMMARY.md)
- **Service README:** [services/content-crawler/README.md](services/content-crawler/README.md)

---

## 🎉 You're Done!

Once all checkboxes are ticked, your content crawler is fully operational!

**Next:** Start adding restaurant URLs to crawl and watch your location data grow automatically. 🚀

