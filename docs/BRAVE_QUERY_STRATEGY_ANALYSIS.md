# Brave API Query Strategy Analysis

**Date:** 2025-01-27  
**Test Case:** Kicking Horse Mountain Resort, Golden, BC (ski resort)

---

## 📊 Iteration 2 Results Summary

### **Success Rate: 10/10 (100%)**

| Rating | Count | Percentage |
|--------|-------|------------|
| ✅ Excellent | 5 | 50% |
| ✓ Good | 4 | 40% |
| ✗ Poor | 1 | 10% |

---

## 🏆 Excellent Strategies (5/10)

### **Pattern Analysis:**

1. **Activity Name Only** ⭐⭐⭐
   - Query: `"Kicking Horse Mountain Resort"`
   - **Why it works:** Simple, direct, no geographic confusion
   - **Use case:** Well-known POIs with unique names

2. **Activity + Location + Type** ⭐
   - Query: `"Kicking Horse Mountain Resort Golden, BC ski resort"`
   - **Why it works:** Full context, specific location + type
   - **Use case:** When you have all information available

3. **Activity "in" Location** 🆕
   - Query: `"Kicking Horse Mountain Resort in Golden, BC"`
   - **Why it works:** Natural language, clear geographic context
   - **Use case:** General purpose, works for most POIs

4. **Activity + City Only** 🆕
   - Query: `"Kicking Horse Mountain Resort Golden"`
   - **Why it works:** Removes province ambiguity, city is enough
   - **Use case:** When city name is distinctive

5. **Activity + City + Type (No Province)** 🆕
   - Query: `"Kicking Horse Mountain Resort Golden ski resort"`
   - **Why it works:** City + type without province confusion
   - **Use case:** When you want type context but avoid province

---

## ✓ Good Strategies (4/10)

### **Pattern Analysis:**

1. **Activity "at" Location** ⭐⭐⭐
   - Query: `"Kicking Horse Mountain Resort at Golden, BC"`
   - **Why it's good:** Natural language, but "at" might be less common
   - **Limitation:** Slightly less accurate than "in"

2. **Activity + Type (No Location)** 🆕
   - Query: `"Kicking Horse Mountain Resort ski resort"`
   - **Why it's good:** Type provides context, works without location
   - **Limitation:** Less specific than with location

3. **Activity + Province Only** 🆕
   - Query: `"Kicking Horse Mountain Resort BC"`
   - **Why it's good:** Province-level works for unique names
   - **Limitation:** Too broad for common names

4. **Activity "located in" Location** 🆕
   - Query: `"Kicking Horse Mountain Resort located in Golden, BC"`
   - **Why it's good:** Very explicit, verbose
   - **Limitation:** Might be too wordy, "in" is simpler

---

## ✗ Poor Strategies (1/10)

### **Pattern Analysis:**

1. **Type + City (Generic Fallback)** ❌
   - Query: `"ski resort Golden"`
   - **Why it failed:** Shows OTHER ski resorts in Golden, CO (USA)!
   - **Problem:** Geographic ambiguity without activity name
   - **Lesson:** NEVER use generic type + city without activity name

---

## 🎯 Key Insights

### **What Works Best:**

1. **Activity name is CRITICAL** - Never drop it
2. **City alone is often enough** - Province can cause issues
3. **Natural language "in" > "at"** - More common phrasing
4. **Type is helpful but optional** - Works with or without
5. **Simpler is often better** - Don't over-specify

### **What Doesn't Work:**

1. **Generic queries without activity name** - Geographic confusion
2. **"at" preposition** - Less accurate than "in"
3. **Verbose phrasing** - "located in" is unnecessary

### **Geographic Hierarchy Findings:**

```
Activity Name Only (Excellent) ✅
    ↓ (if ambiguous)
Activity + City (Excellent) ✅
    ↓ (if still ambiguous)
Activity + City + Type (Excellent) ✅
    ↓ (alternative)
Activity "in" City, Province (Excellent) ✅
    ↓ (fallback)
Activity + Province (Good) ✓
    ↓ (NEVER)
Type + City (Poor) ❌
```

---

## 🚀 Recommended Production Strategy

### **Tier 1: Primary Strategies (Try First)**

```typescript
// 1. Activity Name Only (if unique)
`${activityName}`

// 2. Activity + City (if city is distinctive)
`${activityName} ${city}`

// 3. Activity "in" Location (natural language)
`${activityName} in ${city}, ${province}`
```

### **Tier 2: Enhanced Strategies (If Tier 1 fails)**

```typescript
// 4. Activity + City + Type
`${activityName} ${city} ${type}`

// 5. Activity + Location + Type
`${activityName} ${city}, ${province} ${type}`
```

### **Tier 3: Fallback Strategies (Last resort)**

```typescript
// 6. Activity + Type (no location)
`${activityName} ${type}`

// 7. Activity + Province
`${activityName} ${province}`
```

### **❌ NEVER USE:**

```typescript
// Generic queries without activity name
`${type} ${city}` // ❌ Geographic confusion!
```

---

## 📈 Iteration 3 Strategy

Based on these findings, Iteration 3 will test:

1. **Variations of excellent patterns** with different POI types
2. **Edge cases:** Common names, ambiguous locations, international POIs
3. **Optimization:** Remove redundant words, test minimal queries
4. **Fallback logic:** Test hierarchical approach with real examples

### **Test Cases for Iteration 3:**

- **Well-known POI:** Eiffel Tower, Paris
- **Common name:** Central Park, New York
- **Ambiguous location:** Springfield (multiple cities)
- **International:** Taj Mahal, Agra, India
- **Small POI:** Local restaurant or attraction

---

## 💡 Implementation Recommendations

### **Smart Query Builder:**

```typescript
function buildBraveQuery(
  activityName: string,
  location: string,
  type?: string
): string[] {
  const city = location.split(',')[0]?.trim()
  const province = location.split(',')[1]?.trim()
  
  // Return array of queries to try in order
  return [
    // Tier 1: Excellent strategies
    activityName,                                    // #1
    `${activityName} ${city}`,                      // #2
    `${activityName} in ${location}`,               // #3
    
    // Tier 2: Enhanced strategies (if type provided)
    ...(type ? [
      `${activityName} ${city} ${type}`,            // #4
      `${activityName} ${location} ${type}`,        // #5
    ] : []),
    
    // Tier 3: Fallback strategies
    ...(type ? [`${activityName} ${type}`] : []),   // #6
    ...(province ? [`${activityName} ${province}`] : []) // #7
  ]
}
```

### **Usage:**

```typescript
const queries = buildBraveQuery(
  'Kicking Horse Mountain Resort',
  'Golden, BC',
  'ski resort'
)

// Try each query until we get good results
for (const query of queries) {
  const images = await searchBraveImages(query, 5)
  if (images.length >= 3) {
    return images // Success!
  }
}
```

---

## 📊 Success Metrics

### **Iteration 2 Performance:**

- **Total Strategies Tested:** 10
- **Success Rate:** 100% (all returned images)
- **Excellent Rate:** 50% (5/10 strategies)
- **Good Rate:** 40% (4/10 strategies)
- **Poor Rate:** 10% (1/10 strategies)

### **Improvement from Iteration 1:**

- **Success Rate:** 50% → 100% (+50%)
- **Strategies Refined:** Removed failing patterns, added natural language
- **Geographic Handling:** Better city/province separation

---

## 🎯 Next Steps

1. **Create Iteration 3** with diverse test cases
2. **Test hierarchical fallback** with real POIs
3. **Implement smart query builder** in production
4. **Add caching** for successful query patterns
5. **Monitor performance** in production with real user data

---

**Conclusion:** We've identified 5 excellent strategies that work reliably. The key is to keep the activity name, use simple geographic context (city > province), and avoid generic queries. Natural language "in" works better than "at", and simpler queries often outperform complex ones.

