# 🚀 Get More Images - Add Free API Keys

Your image system is working now with Wikipedia and Lorem Picsum, but you can get **10x more real images** by adding free API keys!

---

## 🎯 Current Status

✅ **Working Now**: 1-2 real images + placeholders
🚀 **With API Keys**: 20-40+ real images per location!

---

## 📸 Add Pixabay (Easiest & Best!)

### **Why Pixabay?**
- ✅ **Completely FREE** - No credit card required
- ✅ **Unlimited requests** - No rate limits
- ✅ **High quality** - Professional stock photos
- ✅ **Easy signup** - Takes 2 minutes

### **How to Get Key**

1. **Go to Pixabay**
   ```
   https://pixabay.com/api/docs/
   ```

2. **Sign Up** (free, no credit card)
   - Click "Get Started"
   - Create account with email
   - Verify email

3. **Get Your API Key**
   - After login, scroll to "Your API Key"
   - Copy the key (looks like: `12345678-abc123def456...`)

4. **Add to Your Project**
   
   Open `.env.local` and add:
   ```bash
   PIXABAY_API_KEY=your_key_here
   ```

5. **Restart Dev Server**
   ```bash
   npm run dev
   ```

6. **Refresh Images**
   ```bash
   curl -X POST http://localhost:3000/api/admin/refresh-images \
     -H "Content-Type: application/json" \
     -d '{"locationSlug": "amsterdam"}'
   ```

**Expected Result**: 10-15 real images from Pixabay!

---

## 📸 Add Pexels (Also Great!)

### **Why Pexels?**
- ✅ **Completely FREE** - No credit card required
- ✅ **Unlimited requests** - No rate limits
- ✅ **High quality** - Professional photos
- ✅ **Easy signup** - Takes 2 minutes

### **How to Get Key**

1. **Go to Pexels**
   ```
   https://www.pexels.com/api/
   ```

2. **Sign Up** (free)
   - Click "Get Started"
   - Create account

3. **Get Your API Key**
   - After login, go to "Your API Key"
   - Copy the key

4. **Add to Your Project**
   
   Open `.env.local` and add:
   ```bash
   PEXELS_API_KEY=your_key_here
   ```

5. **Restart & Refresh** (same as above)

**Expected Result**: 10-15 more real images from Pexels!

---

## 📸 Add Unsplash (Optional)

### **Why Unsplash?**
- ✅ **FREE** - No credit card required
- ⚠️ **50 requests/hour** - Rate limited
- ✅ **Highest quality** - Curated photos
- ✅ **Easy signup** - Takes 5 minutes

### **How to Get Key**

1. **Go to Unsplash**
   ```
   https://unsplash.com/developers
   ```

2. **Sign Up** (free)
   - Create account
   - Verify email

3. **Create an App**
   - Click "New Application"
   - Accept terms
   - Fill in app details:
     - Name: "TravelBlogr"
     - Description: "Travel blog application"

4. **Get Your Access Key**
   - Copy the "Access Key" (not Secret Key)

5. **Add to Your Project**
   
   Open `.env.local` and add:
   ```bash
   UNSPLASH_ACCESS_KEY=your_key_here
   ```

6. **Restart & Refresh** (same as above)

**Expected Result**: 10-15 more real images from Unsplash!

---

## 🎉 Final Result

### **With All 3 API Keys**

Your `.env.local` should look like:
```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Image APIs (add these)
PIXABAY_API_KEY=your_pixabay_key
PEXELS_API_KEY=your_pexels_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

### **Expected Images Per Location**
- Pixabay: 10-15 images
- Pexels: 10-15 images
- Unsplash: 10-15 images
- Wikipedia: 1-3 images
- **Total Pool**: 30-45+ images
- **Displayed**: Best 6 images

---

## 🔍 Verify It's Working

### **Check Console Logs**

After adding keys, you should see:
```
🔍 AGGRESSIVE MODE: Fetching images from ALL sources for: "Amsterdam"
📸 Querying Pixabay API...
📸 Querying Pexels API...
📸 Querying Unsplash API...
📸 Querying Wikipedia/Wikimedia...
✅ Pixabay: 15 images
✅ Pexels: 12 images
✅ Unsplash: 10 images
✅ Wikipedia: Found image for "Amsterdam"
🎉 Total unique images from all sources: 38
📦 Returning 6 images (38 real + 0 placeholders)
```

### **Check Browser**

Visit http://localhost:3000/locations/amsterdam

You should see:
- ✅ No broken images
- ✅ No 503 errors
- ✅ High-quality photos
- ✅ Variety of images

---

## ⚡ Quick Commands

### **Restart Dev Server**
```bash
npm run dev
```

### **Refresh Single Location**
```bash
curl -X POST http://localhost:3000/api/admin/refresh-images \
  -H "Content-Type: application/json" \
  -d '{"locationSlug": "amsterdam"}'
```

### **Refresh All Locations** (if you have many)
```bash
# You can create a script to loop through all locations
for location in amsterdam paris london; do
  curl -X POST http://localhost:3000/api/admin/refresh-images \
    -H "Content-Type: application/json" \
    -d "{\"locationSlug\": \"$location\"}"
  sleep 2
done
```

---

## 🎯 Recommended Setup

### **Minimum** (Working Now)
- ✅ Wikipedia
- ✅ Lorem Picsum
- **Result**: 1-2 real images + placeholders

### **Good** (5 minutes)
- ✅ Wikipedia
- ✅ Pixabay
- ✅ Lorem Picsum
- **Result**: 10-15 real images

### **Better** (10 minutes)
- ✅ Wikipedia
- ✅ Pixabay
- ✅ Pexels
- ✅ Lorem Picsum
- **Result**: 20-30 real images

### **Best** (15 minutes)
- ✅ Wikipedia
- ✅ Pixabay
- ✅ Pexels
- ✅ Unsplash
- ✅ Lorem Picsum
- **Result**: 30-45+ real images

---

## 🚀 Next Steps

1. ✅ **System is working now** with free sources
2. 🔄 **Add Pixabay key** (5 minutes) - Biggest improvement!
3. 🔄 **Add Pexels key** (5 minutes) - More variety
4. 🔄 **Add Unsplash key** (5 minutes) - Highest quality
5. 🎉 **Enjoy 40+ images per location!**

---

## 📝 Notes

- **No Credit Card Required** - All APIs are completely free
- **No Rate Limits** - Pixabay and Pexels are unlimited
- **Production Ready** - All APIs are stable and reliable
- **Easy to Remove** - Just delete the env variable if needed

---

**Made with ❤️ for TravelBlogr**

