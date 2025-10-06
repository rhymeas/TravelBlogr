# 🗺️ Itinerary Generator Setup

## Quick Start (5 minutes)

### 1. Get Groq API Key
- Go to https://console.groq.com
- Sign up (free, no credit card)
- Copy API key

### 2. Add to `.env.local`
```bash
GROQ_API_KEY=gsk_your_key_here
```

### 3. Test Backend
```bash
cd apps/web
npx tsx scripts/test-itinerary.ts
```

Should generate itinerary in ~2 seconds.

### 4. Test Frontend
```bash
npm run dev
```

Visit: http://localhost:3000/plan

---

## Usage

### Frontend
- Visit `/plan`
- Fill in: from, to, dates, interests
- Click "Generate Itinerary"
- Get AI-powered itinerary in 1-2 seconds

### API
```bash
curl -X POST http://localhost:3000/api/itineraries/generate \
  -H "Content-Type: application/json" \
  -d '{
    "from": "tokyo",
    "to": "kyoto",
    "startDate": "2025-05-15",
    "endDate": "2025-05-20",
    "interests": ["temples", "food"],
    "budget": "moderate"
  }'
```

---

## Features

✅ Free (Groq free tier)
✅ Fast (1-2 seconds)
✅ Smart (finds stops along route)
✅ Real data (your database)
✅ Clean code (DDD + Clean Architecture)

---

## Troubleshooting

**"GROQ_API_KEY not set"**
→ Add key to `.env.local`

**"Location not found"**
→ Check location slug exists in database

**Slow (>5 seconds)**
→ Check internet connection

---

## Cost

- **Free tier**: 14,400 requests/day
- **Supports**: ~10,000 users
- **Cost**: $0/month

---

## Next Steps

1. Add caching for similar requests
2. Add export (PDF, Google Maps)
3. Add user preferences
4. Add booking links

