# Brave API Query Strategy - Iteration 3 Analysis

**Date:** 2025-01-27  
**Test Cases:** Kicking Horse Mountain Resort (Golden, BC) + Sun Peaks Resort (Kamloops, BC)

---

## 📊 Combined Results Summary

### **Kicking Horse (Iteration 2):**
- Success Rate: 10/10 (100%)
- Excellent: 5/10 (50%)
- Good: 4/10 (40%)
- Poor: 1/10 (10%)

### **Sun Peaks (Iteration 3):**
- Success Rate: 8/10 (80%)
- Excellent: 2/10 (20%)
- Good: 6/10 (60%)
- Failed: 2/10 (20%)

---

## 🏆 Top Performers (Excellent Ratings)

### **From Kicking Horse:**
1. ✅ Activity Name Only
2. ✅ Activity + Location + Type
3. ✅ Activity "in" Location
4. ✅ Activity + City Only
5. ✅ Activity + City + Type (No Province)

### **From Sun Peaks:**
1. ✅ Activity + Full Location + Type (with comma!)
2. ✅ Activity "near" City

---

## 🔍 Critical Patterns Discovered

### **Pattern 1: Comma Placement is CRITICAL**

```typescript
// ❌ FAILS: No comma between location and type
"Sun Peaks Resort Kamloops ski resort" → 0 images

// ✅ WORKS: Comma separates location from type
"Sun Peaks Resort Kamloops, BC ski resort" → 5 images
"Kicking Horse Mountain Resort Golden ski resort" → 5 images (Excellent)
```

**Why the difference?**
- Kicking Horse: "Golden" is distinctive, less ambiguity
- Sun Peaks: "Kamloops" + "ski resort" without comma = word soup

**Rule:** When adding type to query, ALWAYS include comma in location:
- `Activity + City, Province + Type` ✅
- `Activity + City + Type` ❌ (can fail)

---

### **Pattern 2: Province Abbreviation Alone Fails**

```typescript
// ❌ FAILS: Province abbreviation without city
"Sun Peaks Resort BC" → 0 images
"Kicking Horse Mountain Resort BC" → 5 images (Good)
```

**Why the difference?**
- Kicking Horse: More well-known, "BC" provides enough context
- Sun Peaks: Less well-known, needs city for context

**Rule:** Province alone is unreliable. Use city or full location.

---

### **Pattern 3: Natural Language "near" is Excellent**

```typescript
// ✅ EXCELLENT: "near" proximity language
"Sun Peaks Resort near Kamloops" → 5 images (Excellent)
"Kicking Horse Mountain Resort at Golden, BC" → 5 images (Good)
```

**Why "near" works better than "at"?**
- "near" is more common in travel/tourism context
- "at" is less natural for geographic locations

**Rule:** Use "near" for proximity, "in" for containment.

---

### **Pattern 4: Activity Name Only Works for Well-Known POIs**

```typescript
// ✅ WORKS: Well-known POIs
"Kicking Horse Mountain Resort" → 5 images (Excellent)
"Sun Peaks Resort" → 5 images (Good)
```

**Rule:** Start with activity name only. If POI is well-known, this is sufficient.

---

## 📈 Refined Production Strategy

Based on both tests, here's the optimized hierarchical approach:

### **Tier 1: Primary Strategies (Try First)**

```typescript
// 1. Activity Name Only (if unique/well-known)
`${activityName}`

// 2. Activity "near" City (natural language, excellent rating)
`${activityName} near ${city}`

// 3. Activity "in" Full Location (natural language)
`${activityName} in ${location}`
```

### **Tier 2: Enhanced Strategies (If Tier 1 insufficient)**

```typescript
// 4. Activity + City (simple, works well)
`${activityName} ${city}`

// 5. Activity + Full Location + Type (with comma!)
`${activityName} ${location} ${type}`
```

### **Tier 3: Fallback Strategies (Last resort)**

```typescript
// 6. Activity + Type Only (no location)
`${activityName} ${type}`

// 7. Activity + City + Type (risky without comma)
// Only use if city is very distinctive
`${activityName} ${city} ${type}`
```

### **❌ AVOID (Unreliable)**

```typescript
// Province alone (fails for lesser-known POIs)
`${activityName} ${province}`

// City + Type without comma (word soup)
`${activityName} ${city} ${type}` // Use Tier 2 #5 instead
```

---

## 🎯 Key Learnings

### **1. Punctuation Matters**
- Commas help Brave parse query structure
- `Location, Type` > `Location Type`

### **2. Natural Language Wins**
- "near" > "at" (proximity)
- "in" works well (containment)

### **3. Simplicity Often Best**
- Activity name alone works for well-known POIs
- Don't over-specify if not needed

### **4. Context Dependency**
- Well-known POIs: Simpler queries work
- Lesser-known POIs: Need more context (city, province)

### **5. Geographic Hierarchy**
- City > Province (more specific, less ambiguous)
- Full location (City, Province) > City alone (when needed)

---

## 🚀 Next Testing Phase

### **Diverse POI Types to Test:**

1. **Restaurant (Small POI):**
   - "Earls Kitchen + Bar, Kamloops, BC"
   - Expected: Needs full location context

2. **Natural Attraction:**
   - "Paul Lake, Kamloops, BC"
   - Expected: May need province for disambiguation

3. **International (Famous):**
   - "Eiffel Tower, Paris, France"
   - Expected: Name alone should work

4. **International (Lesser-known):**
   - "Taj Mahal, Agra, India"
   - Expected: May need city context

5. **Common Name (Ambiguous):**
   - "Central Park, New York, USA"
   - Expected: Needs city to avoid other Central Parks

6. **Activity/Experience:**
   - "Gondola Ride, Venice, Italy"
   - Expected: Needs city for context

7. **Museum:**
   - "Louvre Museum, Paris, France"
   - Expected: Name alone may work

8. **Beach:**
   - "Bondi Beach, Sydney, Australia"
   - Expected: Name alone may work

9. **Local Restaurant (Unknown):**
   - "Joe's Diner, Springfield, USA"
   - Expected: Will likely fail (too generic)

10. **Hiking Trail:**
    - "Inca Trail, Cusco, Peru"
    - Expected: Needs city context

---

## 📊 Success Metrics

### **Iteration 2 (Kicking Horse):**
- Total Strategies: 10
- Success Rate: 100%
- Excellent Rate: 50%
- Good Rate: 40%
- Poor Rate: 10%

### **Iteration 3 (Sun Peaks):**
- Total Strategies: 10
- Success Rate: 80%
- Excellent Rate: 20%
- Good Rate: 60%
- Failed Rate: 20%

### **Combined Insights:**
- **Most Reliable:** Activity Name Only, Activity "near" City, Activity "in" Location
- **Most Risky:** Province alone, City + Type without comma
- **Best for Production:** Tier 1 strategies with Tier 2 fallback

---

## 💡 Implementation Recommendations

### **Smart Query Builder v2:**

```typescript
function buildBraveQuery(
  activityName: string,
  location: string,
  type?: string,
  isWellKnown: boolean = false
): string[] {
  const city = location.split(',')[0]?.trim()
  const province = location.split(',')[1]?.trim()
  
  // Tier 1: Primary strategies
  const tier1 = [
    activityName,                                    // Works for well-known POIs
    `${activityName} near ${city}`,                 // Excellent rating
    `${activityName} in ${location}`,               // Natural language
  ]
  
  // Tier 2: Enhanced strategies
  const tier2 = [
    `${activityName} ${city}`,                      // Simple, reliable
    ...(type ? [`${activityName} ${location} ${type}`] : []), // With comma!
  ]
  
  // Tier 3: Fallback strategies
  const tier3 = [
    ...(type ? [`${activityName} ${type}`] : []),   // Type only
  ]
  
  // If well-known, prioritize simple queries
  if (isWellKnown) {
    return [...tier1, ...tier2, ...tier3]
  }
  
  // If lesser-known, prioritize context-rich queries
  return [tier1[1], tier1[2], ...tier2, tier1[0], ...tier3]
}
```

### **Usage:**

```typescript
// Well-known POI
const queries1 = buildBraveQuery(
  'Eiffel Tower',
  'Paris, France',
  'landmark',
  true // isWellKnown
)
// Returns: ["Eiffel Tower", "Eiffel Tower near Paris", ...]

// Lesser-known POI
const queries2 = buildBraveQuery(
  'Sun Peaks Resort',
  'Kamloops, BC',
  'ski resort',
  false // isWellKnown
)
// Returns: ["Sun Peaks Resort near Kamloops", "Sun Peaks Resort in Kamloops, BC", ...]
```

---

## 🎯 Conclusion

We've identified clear patterns for optimal Brave API queries:

1. **Start simple** - Activity name alone for well-known POIs
2. **Add natural language** - "near" and "in" work excellently
3. **Use proper punctuation** - Commas matter for complex queries
4. **Avoid ambiguity** - Province alone is unreliable
5. **Context is key** - Lesser-known POIs need more geographic detail

**Next:** Test with diverse international POIs to validate these patterns globally.

