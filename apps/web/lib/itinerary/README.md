# 🗺️ Itinerary Generation System

AI-powered travel itinerary generator using **Groq** (free, fast) and **Clean Architecture** principles.

## 🏗️ Architecture

Following **Domain-Driven Design (DDD)** and **Clean Architecture**:

```
lib/itinerary/
├── domain/                          # Business logic (pure, no dependencies)
│   ├── entities/
│   │   └── Itinerary.ts            # Core business entity
│   └── value-objects/
│       └── RouteInfo.ts            # Immutable value object
│
├── application/                     # Use cases & services
│   ├── use-cases/
│   │   └── GenerateItineraryUseCase.ts  # Main orchestrator
│   └── services/
│       ├── RouteCalculatorService.ts    # Route calculation logic
│       └── GroqAIService.ts             # AI integration
│
└── infrastructure/                  # External dependencies
    └── repositories/
        └── LocationRepository.ts    # Data access layer
```

## 🚀 Features

- ✅ **Free & Fast**: Uses Groq API (free tier: 14,400 req/day)
- ✅ **Smart Routing**: Finds stops along the way automatically
- ✅ **Real Data**: Uses YOUR database (activities, restaurants)
- ✅ **Clean Code**: Follows SOLID principles
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Testable**: Dependency injection, easy to mock

## 📋 Setup

### 1. Get Groq API Key (FREE)

1. Go to https://console.groq.com
2. Sign up (no credit card required)
3. Create API key
4. Add to `.env.local`:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### 2. Install Dependencies

```bash
cd apps/web
npm install groq-sdk
```

### 3. Test It

```bash
npx tsx scripts/test-itinerary.ts
```

## 🔌 API Usage

### Endpoint

```
POST /api/itineraries/generate
```

### Request

```json
{
  "from": "tokyo",
  "to": "kyoto",
  "startDate": "2025-05-15",
  "endDate": "2025-05-20",
  "interests": ["temples", "food"],
  "budget": "moderate"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "5-Day Tokyo to Kyoto Adventure",
    "summary": "Experience the best of Japan...",
    "days": [
      {
        "day": 1,
        "date": "2025-05-15",
        "location": "Tokyo",
        "type": "stay",
        "items": [
          {
            "time": "09:00",
            "title": "Senso-ji Temple",
            "type": "activity",
            "duration": 2,
            "description": "Visit Tokyo's oldest temple...",
            "costEstimate": 0
          }
        ]
      }
    ],
    "totalCostEstimate": 500,
    "tips": ["Book JR Pass in advance", "..."],
    "stats": {
      "totalDays": 5,
      "stayDays": 4,
      "travelDays": 1,
      "locations": ["Tokyo", "Kyoto"],
      "totalActivities": 12,
      "totalMeals": 15,
      "averageCostPerDay": 100
    }
  },
  "meta": {
    "generationTimeMs": 1500,
    "generatedAt": "2025-01-06T12:00:00Z"
  }
}
```

## 💻 Code Examples

### Using the Use Case Directly

```typescript
import { GenerateItineraryUseCase } from '@/lib/itinerary/application/use-cases/GenerateItineraryUseCase'

const useCase = new GenerateItineraryUseCase()

const result = await useCase.execute({
  from: 'tokyo',
  to: 'kyoto',
  startDate: '2025-05-15',
  endDate: '2025-05-20',
  interests: ['temples', 'food'],
  budget: 'moderate'
})

if (result.success) {
  console.log(result.itinerary.toJSON())
}
```

### Using the API

```typescript
const response = await fetch('/api/itineraries/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'tokyo',
    to: 'kyoto',
    startDate: '2025-05-15',
    endDate: '2025-05-20',
    interests: ['temples', 'food'],
    budget: 'moderate'
  })
})

const data = await response.json()
```

## 🧪 Testing

### Unit Tests (TODO)

```bash
npm test lib/itinerary
```

### Integration Test

```bash
npx tsx scripts/test-itinerary.ts
```

## 📊 Performance

- **Generation Time**: 1-2 seconds
- **Cost**: $0 (free tier)
- **Rate Limit**: 14,400 requests/day (Groq free tier)
- **Scalability**: Free up to 10,000 users

## 🔧 Configuration

### Environment Variables

```bash
# Required
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Already configured
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Customization

**Max stops along route**:
```typescript
// In GenerateItineraryUseCase.ts
const routeInfo = await this.routeCalculator.calculateRoute(
  command.from,
  command.to,
  3 // Change this number
)
```

**AI model**:
```typescript
// In GroqAIService.ts
model: 'llama-3.1-8b-instant' // or 'llama-3.1-70b-versatile'
```

**Max activities per location**:
```typescript
// In LocationRepository.ts
.slice(0, 15) // Change this number
```

## 🐛 Troubleshooting

### "GROQ_API_KEY is not set"

Add your Groq API key to `.env.local`:
```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### "Location not found"

Make sure the location slug exists in your database:
```sql
SELECT slug FROM locations WHERE is_published = true;
```

### "Not enough days for this route"

The route requires more days. Either:
- Extend the trip duration
- Choose closer locations

### Slow generation (> 5 seconds)

- Check your internet connection
- Groq free tier may be slower during peak times
- Consider upgrading to paid tier

## 📈 Scaling

### Free Tier Limits

- **Groq**: 14,400 requests/day
- **Supports**: ~10,000 active users
- **Cost**: $0/month

### When to Upgrade

When you exceed 10,000 users:
- **Groq Paid**: $0.05-$0.10 per 1M tokens (~$50-100/month)
- **Self-host**: Llama 3.1 8B on GPU ($100-250/month)

## 🎯 Next Steps

1. ✅ **Add caching**: Cache similar requests
2. ✅ **Add frontend UI**: Build itinerary generator page
3. ✅ **Add user preferences**: Save user interests
4. ✅ **Add export**: PDF, Google Maps, etc.
5. ✅ **Add booking links**: Hotels, activities

## 📚 Resources

- [Groq Documentation](https://console.groq.com/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

## 🤝 Contributing

Follow the project's coding standards:
- Use Clean Architecture principles
- Write tests for new features
- Follow TypeScript best practices
- Document public APIs

