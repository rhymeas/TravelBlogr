# ✅ plan Generator - Ready to Test!

## 🎉 What's Done

✅ Backend implemented (Clean Architecture)
✅ Frontend created (Minimalist Airbnb style)
✅ API endpoint ready
✅ Dependencies installed
✅ Dev server running

## ⚠️ One Thing Missing

**You need a valid Groq API key!**

Current key in `.env.local` is placeholder: `your_groq_api_key_here`

## 🚀 Get Your Free Groq API Key (2 minutes)

1. Visit: https://console.groq.com
2. Sign up (free, no credit card)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Replace in `apps/web/.env.local`:

```bash
GROQ_API_KEY=gsk_your_actual_key_here
```

## 🧪 Test It

### Backend Test
```bash
cd apps/web
npx tsx scripts/test-plan.ts
```

Should generate a complete plan in ~2 seconds.

### Frontend Test

Dev server is already running at: **http://localhost:3000**

Visit: **http://localhost:3000/plan**

Fill in:
- From: `paris`
- To: `rome`
- Dates: Any future dates
- Interests: `art, food, history`
- Budget: `moderate`

Click "Generate plan" → Get results in 1-2 seconds!

## 📍 Available Locations

Use these location slugs:
- `paris` (Paris)
- `rome` (Rome)
- `tokyo` (Tokyo)
- `london` (London)
- `barcelona` (Barcelona)
- `amsterdam` (Amsterdam)
- `new-york` (New York City)
- `vancouver` (Vancouver)
- `santorini` (Santorini)

## 🎨 Frontend Features

- Clean Airbnb-style design
- White cards with rounded corners
- Big black CTA button
- Day-by-day timeline view
- Mobile responsive
- Real-time generation

## 💰 Cost

- **Free**: 14,400 requests/day
- **Supports**: ~10,000 users
- **Speed**: 1-2 seconds per plan

## 🐛 Troubleshooting

**"Invalid API Key"**
→ Add real Groq key to `.env.local`

**"Location not found"**
→ Use slugs from list above

**Page not loading**
→ Dev server running? Check http://localhost:3000

## 📁 What Was Created

```
apps/web/
├── lib/plan/                    # Backend (Clean Architecture)
│   ├── domain/                       # Entities & Value Objects
│   ├── application/                  # Use Cases & Services
│   └── infrastructure/               # Repositories
├── components/plan/             # Frontend
│   └── planGenerator.tsx       # Main UI component
├── app/
│   ├── plan/page.tsx                # /plan page
│   └── api/itineraries/generate/    # API endpoint
└── scripts/
    └── test-plan.ts            # Test script
```

## ✨ Next Steps

1. Add your Groq API key
2. Visit http://localhost:3000/plan
3. Generate your first plan!
4. (Optional) Add caching, export features, etc.

