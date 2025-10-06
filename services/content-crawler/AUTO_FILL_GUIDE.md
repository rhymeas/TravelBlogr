# 🪄 Auto-Fill Content System - Quick Guide

## 100% FREE - No Cost!

Automatically populate location pages with restaurants, activities, images, and descriptions.

---

## 🆓 What's Free

| API | Cost | Limits |
|-----|------|--------|
| **OpenStreetMap** | FREE | Unlimited |
| **Wikipedia** | FREE | Unlimited |
| **Unsplash** | FREE | 50/hour (optional) |
| **OpenWeatherMap** | FREE | 1000/day |

---

## 🚀 Setup (2 minutes)

### 1. Get OpenWeatherMap Key (Required)
```
1. Go to: https://openweathermap.org/api
2. Sign up (free)
3. Copy API key
4. Add to .env.local:
   OPENWEATHER_API_KEY=your_key
```

### 2. Get Unsplash Key (Optional)
```
1. Go to: https://unsplash.com/developers
2. Create app (free)
3. Copy Access Key
4. Add to .env.local:
   UNSPLASH_ACCESS_KEY=your_key
```

**Note:** Unsplash is optional - system has fallback images!

---

## 📝 How to Use

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Open Admin Page
```
http://localhost:3000/admin/auto-fill
```

### Step 3: Enter Location
```
Location Name: Banff National Park
Latitude: 51.4968
Longitude: -115.9281
```

### Step 4: Click "Auto-Fill"
Wait 10-30 seconds...

### Step 5: Review Results
```
✅ 45 restaurants
✅ 23 activities  
✅ 10 images
✅ Description
✅ Weather
```

Done! 🎉

---

## 🔍 Finding Coordinates

**Google Maps:**
1. Right-click location
2. Click coordinates to copy

**LatLong.net:**
1. Go to https://www.latlong.net/
2. Search location
3. Copy coordinates

---

## 💡 Tips

- Use specific names: "Banff National Park" not "Banff"
- Cities have more data than rural areas
- Check Wikipedia exists for location first
- Review auto-filled content before publishing

---

## ⚠️ Limits

- OpenWeatherMap: 1000 calls/day
- Unsplash: 50 calls/hour (has fallback)
- OpenStreetMap: Unlimited
- Wikipedia: Unlimited

---

## 🐛 Troubleshooting

**No restaurants found?**
- Try larger radius (edit code)
- Rural areas have less data

**No images?**
- Unsplash key missing (uses fallback)
- Rate limit hit (wait 1 hour)

**No description?**
- Location not on Wikipedia
- Try different name spelling

---

## 📁 Files Created

```
services/content-crawler/clients/
├── openStreetMapClient.ts  ← Restaurants & activities
├── unsplashClient.ts       ← Images
├── wikipediaClient.ts      ← Descriptions
└── weatherClient.ts        ← Weather

apps/web/app/
├── admin/auto-fill/page.tsx        ← UI
└── api/admin/auto-fill/route.ts    ← API
```

---

## ✅ What Gets Auto-Filled

**Restaurants:**
- Name, cuisine, address
- Phone, website, hours
- GPS coordinates

**Activities:**
- Tourist attractions
- Museums, parks, viewpoints
- Natural landmarks

**Images:**
- 10 high-quality photos
- Landscape orientation
- Auto-set featured image

**Description:**
- Rich text from Wikipedia
- Historical facts
- Key information

**Weather:**
- Current conditions
- Temperature, humidity
- Wind speed

---

That's it! Simple, free, and fast. 🚀

