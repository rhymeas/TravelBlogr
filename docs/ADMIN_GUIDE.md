# 🎛️ TravelBlogr Admin Guide

**Complete guide to managing your TravelBlogr platform**

---

## 🚪 Accessing the Admin Dashboard

**URL:** `https://your-app.up.railway.app/admin`

**Requirements:**
- Must be signed in
- Email must contain "admin" OR equal "admin@travelblogr.com"

**Navigation:**
- Desktop: Full sidebar navigation
- Mobile: Collapsible menu with hamburger icon

---

## 📊 Dashboard Overview

**Path:** `/admin`

### **Quick Stats**
- **Locations:** Total locations in database
- **Users:** Total registered users
- **Trips:** Total trips created
- **AI Requests:** Total itinerary generations

### **Quick Actions**
- Launch Crawler
- Run Auto-Fill
- View AI Monitoring
- Manage Images
- View Users
- Check Analytics
- Track Costs

### **System Status**
- All services: Operational ✅
- Database: Connected ✅
- AI: Available ✅

---

## 🤖 AI Monitoring

**Path:** `/admin/ai-monitoring`

### **Purpose**
Track and monitor all AI-powered features (itinerary generation, content creation).

### **Features**

**With Helicone (Optional):**
- Real-time request tracking
- Latency monitoring
- Cost tracking
- Error logging
- Request history

**Without Helicone:**
- Setup instructions displayed
- Links to Helicone signup
- Benefits explanation

### **Setup**
1. Sign up at https://helicone.ai (free)
2. Get API key from dashboard
3. Add to Railway: `HELICONE_API_KEY=sk-helicone-xxx`
4. Restart deployment
5. Refresh admin page

### **Best Practices**
- Monitor daily during high-traffic periods
- Check for error spikes
- Review latency trends
- Stay within free tier (100K req/month)

---

## 🌐 Content Crawler

**Path:** `/admin/crawler`

### **Purpose**
Manually trigger data fetching for locations (restaurants, weather, etc.).

### **Features**

**Weather Sync:**
- Fetch current weather for any location
- Updates location's weather data
- Uses OpenWeather API

**How to Use:**
1. Enter location ID (UUID from database)
2. Click "Sync Weather Data"
3. Wait for success message
4. Check location page for updated weather

**Restaurant Crawler:**
- Fetch restaurant data for locations
- Uses web scraping/APIs
- Populates location's restaurant list

### **Best Practices**
- Run weather sync weekly for popular locations
- Crawl restaurants for new locations immediately
- Monitor for rate limits
- Check results on location pages

### **Troubleshooting**
- **Error: Location not found** → Verify location ID
- **Error: API rate limit** → Wait 1 hour, try again
- **No data returned** → Check location has valid coordinates

---

## ✍️ Auto-Fill System

**Path:** `/admin/auto-fill`

### **Purpose**
Automatically populate location content (descriptions, activities, tips).

### **Features**

**Content Generation:**
- Wikipedia descriptions
- Activity suggestions
- Travel tips
- Did you know facts

**How to Use:**
1. Enter location name or ID
2. Select content types to generate
3. Click "Auto-Fill Content"
4. Review generated content
5. Approve or edit

### **Best Practices**
- Review AI-generated content before publishing
- Edit for brand voice and accuracy
- Add local insights manually
- Update seasonally

### **Quality Control**
- ✅ Fact-check all generated content
- ✅ Ensure family-friendly language
- ✅ Remove any promotional content
- ✅ Add personal touches

---

## 🖼️ Image Management

**Path:** `/admin/images`

### **Purpose**
Manage location images, validate URLs, and optimize storage.

### **Features**

**Quick Actions:**
- Refresh image cache
- Validate all image URLs
- Clean up broken links
- Optimize image sizes

**Image Sources:**
- Pexels API
- Unsplash API
- Wikipedia/Wikimedia
- User uploads (Supabase Storage)

### **Best Practices**
- Run validation monthly
- Remove broken image URLs
- Prefer high-quality sources
- Use CDN for performance

### **Storage Limits**
- Supabase free tier: 1GB
- Monitor usage in `/admin/costs`
- Clean up unused images regularly

---

## 👥 User Management

**Path:** `/admin/users`

### **Purpose**
View and manage registered users.

### **Features** (Coming Soon)
- User list with stats
- Search and filter
- User activity logs
- Ban/suspend users
- Export user data

### **Current Status**
Placeholder page - full features in development.

---

## 📈 Analytics

**Path:** `/admin/analytics`

### **Purpose**
Track platform usage and growth metrics.

### **Features** (Coming Soon)
- User growth charts
- Location popularity
- Trip creation trends
- AI usage statistics
- Geographic distribution

### **Current Status**
Placeholder page - full features in development.

---

## 💰 Cost Tracking

**Path:** `/admin/costs`

### **Purpose**
Monitor all service costs and free tier usage.

### **Services Tracked**

**Groq API:**
- Status: Free tier
- Usage: Unlimited (rate-limited)
- Cost: $0/month

**Helicone:**
- Status: Free tier
- Limit: 100K requests/month
- Cost: $0/month

**Supabase:**
- Storage: 1GB free
- Bandwidth: 2GB/month free
- Cost: $0/month

**Railway:**
- Credits: $5/month free
- Usage: ~$3-4/month typical
- Cost: $0/month (within free tier)

### **Alerts**
- Warning when approaching limits
- Recommendations for optimization
- Upgrade suggestions (if needed)

### **Best Practices**
- Check weekly
- Monitor trends
- Optimize before hitting limits
- Plan for growth

---

## 🔧 Common Admin Tasks

### **Adding a New Location**

1. **Create location in database:**
   - Use Supabase Table Editor
   - Add: name, country, region, coordinates

2. **Fetch images:**
   - Visit `/admin/images`
   - Run image fetch for location

3. **Auto-fill content:**
   - Visit `/admin/auto-fill`
   - Generate description and activities

4. **Sync weather:**
   - Visit `/admin/crawler`
   - Run weather sync

5. **Verify:**
   - Visit location page
   - Check all content displays correctly

---

### **Managing Sample Gallery**

1. **Add new sample guide:**
   - Insert into `sample_travel_guides` table
   - Add days to `sample_guide_days` table

2. **Update existing guide:**
   - Edit in Supabase Table Editor
   - Update cover image URL
   - Modify highlights array

3. **Monitor performance:**
   - Check view counts
   - See which guides are popular
   - Update based on user feedback

---

### **Monitoring AI Usage**

1. **Daily checks:**
   - Visit `/admin/ai-monitoring`
   - Review request count
   - Check for errors

2. **Weekly analysis:**
   - Review latency trends
   - Identify slow requests
   - Optimize prompts if needed

3. **Monthly review:**
   - Total requests vs. free tier limit
   - Plan for scaling if needed
   - Review cost projections

---

## 🚨 Troubleshooting

### **Can't Access Admin**
- Verify email contains "admin"
- Clear browser cache
- Try incognito mode
- Check Railway logs for errors

### **Stats Not Updating**
- Refresh page
- Check database connection
- Verify Supabase is online
- Review Railway deployment logs

### **Crawler Failing**
- Check API keys are set
- Verify location has coordinates
- Review rate limits
- Check Railway logs for errors

### **Images Not Loading**
- Validate image URLs
- Check Supabase Storage
- Verify CDN is working
- Test image sources directly

---

## 📚 Additional Resources

- **Setup Guide:** `docs/ZERO_COST_SETUP.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Database Schema:** `infrastructure/database/migrations/`
- **API Documentation:** Check individual route files

---

## ✅ Admin Checklist

**Daily:**
- [ ] Check dashboard stats
- [ ] Review AI monitoring (if Helicone configured)
- [ ] Monitor error logs

**Weekly:**
- [ ] Run weather sync for popular locations
- [ ] Validate image URLs
- [ ] Review user growth
- [ ] Check cost tracking

**Monthly:**
- [ ] Clean up unused images
- [ ] Update sample gallery content
- [ ] Review analytics trends
- [ ] Plan for scaling

---

## 🎯 Best Practices

1. **Regular Monitoring**
   - Check admin dashboard daily
   - Review metrics weekly
   - Plan improvements monthly

2. **Content Quality**
   - Always review AI-generated content
   - Maintain family-friendly standards
   - Update seasonal information

3. **Performance**
   - Monitor free tier limits
   - Optimize before hitting caps
   - Plan for growth

4. **Security**
   - Keep admin access restricted
   - Monitor user activity
   - Review logs regularly

5. **User Experience**
   - Test all features regularly
   - Fix issues promptly
   - Gather user feedback

---

**Questions?** Review the code or check Railway logs for detailed error messages.

