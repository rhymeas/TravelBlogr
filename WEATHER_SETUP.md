# ☁️ Weather Setup Guide (Optional)

## 🆓 Get FREE OpenWeatherMap API Key

### **Step 1: Create Account**
1. Go to: https://openweathermap.org/api
2. Click **"Sign Up"** (top right)
3. Fill in:
   - Username
   - Email
   - Password
4. Click **"Create Account"**
5. **Verify your email** (check inbox)

### **Step 2: Get API Key**
1. After email verification, **log in**
2. Go to: https://home.openweathermap.org/api_keys
3. You'll see a **default API key** already created
4. **Copy the API key** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### **Step 3: Add to Environment Variables**

Open `.env.local` and `apps/web/.env.local` and add:

```bash
# OpenWeatherMap API (FREE - 1000 calls/day)
OPENWEATHER_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual API key.

### **Step 4: Restart Server**

```bash
# Stop server (Ctrl+C in terminal)
cd apps/web
npm run dev
```

### **Step 5: Test!**

Go to http://localhost:3000/admin/auto-fill and create a new location. You should now see weather data!

---

## 📊 Free Tier Limits:

- ✅ **1,000 API calls per day** (FREE forever)
- ✅ **Current weather data**
- ✅ **No credit card required**

**That's enough for:**
- 1,000 locations per day
- Or updating weather for 1,000 locations daily

---

## 🌤️ What Weather Data You Get:

- Temperature (°C)
- Weather description (e.g., "clear sky", "light rain")
- Humidity (%)
- Wind speed (m/s)
- Timestamp of when data was fetched

---

## ⚠️ Important Notes:

1. **API Key Activation:** New API keys take ~10 minutes to activate
2. **Rate Limits:** Don't exceed 1,000 calls/day on free tier
3. **Caching:** Weather data is saved to database, so you don't need to fetch it every time

---

## 🔧 Troubleshooting:

### **Problem: "Invalid API key"**
- **Solution:** Wait 10 minutes after creating account for key to activate

### **Problem: "401 Unauthorized"**
- **Solution:** Check that API key is correctly copied to `.env.local`

### **Problem: Weather still not showing**
- **Solution:** Make sure you restarted the dev server after adding the key

---

**Once set up, weather will automatically be fetched for every new location!** ☁️

