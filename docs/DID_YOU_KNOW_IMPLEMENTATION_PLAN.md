# "Did You Know?" Facts Implementation Plan

**Date:** 2025-10-16  
**Status:** 📋 PLANNED  
**Feature:** AI-Generated Location Facts for Trip Planning

---

## 🎯 Overview

Add **1 random AI-generated "Did You Know?" fact** per location in the trip planning flow. These facts will:
- Be generated automatically during itinerary creation (1 fact per location)
- Display in the ItineraryModal results view
- Be saved when user accepts the trip
- Appear on final trip detail pages
- Optionally be saved to location detail pages for community benefit

**Simplified Approach:** Instead of 3-5 facts, we generate just 1 interesting fact per location to keep the UI clean and focused.

---

## 📊 Architecture

### Data Flow

```
User Creates Itinerary
    ↓
AI Generates Itinerary + Location Facts (Groq API)
    ↓
Facts Displayed in ItineraryModal
    ↓
User Accepts/Saves Trip
    ↓
Facts Saved to Database (trip_posts or trips table)
    ↓
Facts Displayed on Trip Detail Pages
    ↓
(Optional) Facts Saved to Locations Table for Community
```

### Integration Points

1. **AI Generation** - `GroqAIService.ts` & `EnhancedGroqAIService.ts`
2. **Data Model** - `Itinerary.ts` domain entity
3. **Results Display** - `ItineraryModal.tsx` component
4. **Database Storage** - Trip save flow
5. **Trip Pages** - Trip detail page display
6. **Location Pages** - Location detail page display (optional)

---

## 🗂️ Data Model Changes

### 1. Update `ItineraryDay` Interface

**File:** `apps/web/lib/itinerary/domain/entities/Itinerary.ts`

```typescript
export interface LocationFact {
  id: string
  title: string
  content: string
  category: 'history' | 'culture' | 'nature' | 'fun_fact' | 'local_tip'
  icon?: string
}

export interface ItineraryDay {
  day: number
  date: string
  location: string
  locationMetadata?: {
    name: string
    country: string
    region: string
    continent: string
    latitude: number
    longitude: number
  }
  type: 'stay' | 'travel'
  items: ItineraryItem[]
  travelInfo?: {
    from: string
    to: string
    distance: number
    duration: number
    mode: string
  }
  didYouKnow?: LocationFact // ✨ NEW FIELD - Single fact (not array)
}
```

### 2. Update AI Response Schema

**Files:** `GroqAIService.ts` & `EnhancedGroqAIService.ts`

Add to JSON schema in AI prompt:

```json
{
  "days": [
    {
      "day": 1,
      "date": "2025-05-15",
      "location": "Tokyo",
      "type": "stay",
      "items": [...],
      "didYouKnow": [
        {
          "id": "fact-1",
          "title": "World's Busiest Intersection",
          "content": "Shibuya Crossing sees up to 3,000 people cross at once during peak times, making it the world's busiest pedestrian crossing.",
          "category": "fun_fact"
        },
        {
          "id": "fact-2",
          "title": "Ancient Meets Modern",
          "content": "Tokyo has over 100 Michelin-starred restaurants, more than any other city in the world, blending traditional Japanese cuisine with modern innovation.",
          "category": "culture"
        }
      ]
    }
  ]
}
```

---

## 🤖 AI Prompt Updates

### GroqAIService.ts Changes

Add to the prompt (around line 400):

```typescript
📚 LOCATION FACTS REQUIREMENT (NEW):
For EACH location in the itinerary, generate 3-5 "Did You Know?" facts that are:
- Interesting and educational
- Relevant to travelers
- Specific to the location (not generic)
- Categorized as: history, culture, nature, fun_fact, or local_tip
- Concise (1-2 sentences each)

Example facts for Paris:
- History: "The Eiffel Tower was originally intended to be temporary, built for the 1889 World's Fair and scheduled for demolition in 1909."
- Culture: "Paris has over 400 parks and gardens, earning it the nickname 'City of Light' not just for its Enlightenment history but also its beauty."
- Local Tip: "Most museums in Paris are free on the first Sunday of each month, including the Louvre and Musée d'Orsay."

CRITICAL: Facts must be:
✅ Accurate and verifiable
✅ Interesting to travelers
✅ Specific to the location
✅ Properly categorized
❌ NOT generic or obvious
❌ NOT promotional or commercial
```

### EnhancedGroqAIService.ts Changes

Add similar section to the Pro Mode prompt (around line 200):

```typescript
═══════════════════════════════════════════════════════════════
LOCATION FACTS GENERATION (PRO MODE)
═══════════════════════════════════════════════════════════════
For each location, generate 3-5 high-quality "Did You Know?" facts:

1. FACT CATEGORIES:
   - history: Historical events, landmarks, origins
   - culture: Local customs, traditions, cuisine, arts
   - nature: Geography, wildlife, natural phenomena
   - fun_fact: Surprising statistics, records, trivia
   - local_tip: Insider knowledge, money-saving tips, best times to visit

2. QUALITY CRITERIA:
   - Must be specific to the location (not generic)
   - Must be interesting and memorable
   - Must be relevant to travelers
   - Must be accurate and verifiable
   - Should enhance the travel experience

3. EXAMPLES:
   Barcelona:
   - history: "The Sagrada Familia has been under construction since 1882 and is expected to be completed in 2026, 144 years after it began."
   - culture: "Catalans have their own language, Catalan, which is distinct from Spanish and is the official language of the region."
   - local_tip: "Visit Park Güell early in the morning (before 9am) to avoid crowds and enjoy the best light for photos."

   Kyoto:
   - nature: "Kyoto is home to over 1,600 Buddhist temples and 400 Shinto shrines, many nestled in bamboo forests and mountain valleys."
   - fun_fact: "Kyoto was the capital of Japan for over 1,000 years (794-1868) and was spared from bombing in WWII to preserve its cultural heritage."
```

---

## 🎨 UI Implementation

### 1. ItineraryModal Display

**File:** `apps/web/components/itinerary/ItineraryModal.tsx`

Add after the location image/description (around line 575):

```tsx
{/* Did You Know? Facts */}
{currentLocation.didYouKnow && currentLocation.didYouKnow.length > 0 && (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
    <div className="flex items-center gap-2 mb-4">
      <Info className="h-5 w-5 text-blue-600" />
      <h4 className="text-sm font-semibold text-gray-900">
        Did You Know?
      </h4>
    </div>
    <div className="space-y-3">
      {currentLocation.didYouKnow.map((fact: any) => (
        <div
          key={fact.id}
          className="border-l-2 border-blue-400 pl-4 py-2"
        >
          <div className="flex items-start justify-between mb-1">
            <h5 className="text-sm font-semibold text-gray-900">
              {fact.title}
            </h5>
            <span className="text-xs text-blue-600 font-medium ml-3 flex-shrink-0 capitalize">
              {fact.category.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            {fact.content}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

### 2. Trip Detail Page Display

**File:** `apps/web/app/dashboard/trips/[tripId]/page.tsx`

For each location/post in the trip, display facts using the existing `LocationDidYouKnow` component:

```tsx
{post.didYouKnow && post.didYouKnow.length > 0 && (
  <LocationDidYouKnow
    locationSlug={post.location_id}
    didYouKnow={post.didYouKnow}
    locationName={post.location || post.title}
  />
)}
```

---

## 💾 Database Changes

### Option 1: Store in `trip_posts` Table (Recommended)

Add `did_you_know` JSONB column to `trip_posts` table:

```sql
ALTER TABLE trip_posts
ADD COLUMN did_you_know JSONB DEFAULT '[]';

COMMENT ON COLUMN trip_posts.did_you_know IS 'AI-generated location facts in format: [{"id": "...", "title": "...", "content": "...", "category": "..."}]';
```

### Option 2: Store in `trips` Table

Add `location_facts` JSONB column to `trips` table:

```sql
ALTER TABLE trips
ADD COLUMN location_facts JSONB DEFAULT '{}';

COMMENT ON COLUMN trips.location_facts IS 'Location facts by location name: {"Tokyo": [{"id": "...", "title": "...", ...}], "Kyoto": [...]}';
```

### Option 3: Store in `locations` Table (Community Benefit)

When a trip is saved, also save facts to the `locations` table for community benefit:

```sql
-- Assuming locations table already has did_you_know JSONB column
-- If not, add it:
ALTER TABLE locations
ADD COLUMN did_you_know JSONB DEFAULT '[]';

-- Deduplication logic needed to avoid duplicate facts
```

---

## 🔄 Implementation Steps

### Phase 1: Data Model & AI Generation (Days 1-2)

1. ✅ Update `Itinerary.ts` domain entity with `LocationFact` interface
2. ✅ Update `ItineraryDay` interface to include `didYouKnow` field
3. ✅ Update `GroqAIService.ts` prompt to request facts
4. ✅ Update `EnhancedGroqAIService.ts` prompt to request facts
5. ✅ Add validation for facts in AI response parsing
6. ✅ Test AI generation with sample itineraries

### Phase 2: UI Display (Days 3-4)

1. ✅ Update `ItineraryModal.tsx` to display facts
2. ✅ Style facts section with proper design
3. ✅ Add icons and category labels
4. ✅ Test responsive design
5. ✅ Test with different fact counts (0, 1, 3, 5)

### Phase 3: Database Storage (Day 5)

1. ✅ Add database migration for `did_you_know` column
2. ✅ Update trip save flow to store facts
3. ✅ Update trip retrieval to include facts
4. ✅ Test data persistence

### Phase 4: Trip Detail Pages (Day 6)

1. ✅ Update trip detail page to display facts
2. ✅ Integrate with `LocationDidYouKnow` component
3. ✅ Test facts display in trip context

### Phase 5: Location Pages (Optional, Day 7)

1. ✅ Implement logic to save facts to locations table
2. ✅ Add deduplication logic
3. ✅ Update location detail pages to show AI + CMS facts
4. ✅ Test community benefit flow

### Phase 6: Testing & QA (Day 8)

1. ✅ End-to-end testing of complete flow
2. ✅ Test with various locations and trip types
3. ✅ Verify fact quality and relevance
4. ✅ Performance testing
5. ✅ Bug fixes and refinements

---

## 🎯 Success Criteria

- [ ] AI generates 3-5 relevant facts per location
- [ ] Facts display correctly in ItineraryModal
- [ ] Facts are saved when trip is accepted
- [ ] Facts display on trip detail pages
- [ ] Facts are high-quality and accurate
- [ ] No performance degradation
- [ ] Backward compatible with existing trips
- [ ] Mobile responsive design

---

## 🚀 Future Enhancements

1. **User Contributions**: Allow users to add their own facts
2. **Fact Voting**: Community voting on fact quality
3. **Fact Sources**: Add source citations for facts
4. **Fact Translations**: Multi-language support
5. **Fact Categories Filter**: Filter facts by category
6. **Fact Sharing**: Share individual facts on social media
7. **AI Fact Verification**: Use multiple AI models to verify facts

---

## 📝 Notes

- Facts should be generated during itinerary creation, not as a separate step
- Facts should be cached with the itinerary to avoid regeneration
- Consider rate limiting to prevent AI API abuse
- Monitor AI costs for fact generation
- Ensure facts are family-friendly and culturally sensitive

