# GPT-OSS 20B Testing Plan

## Objective
Test if GPT-OSS 20B maintains quality while being 50% cheaper than GPT-OSS 120B

## Model Comparison

| Model | Cost | Speed | Reasoning | Use Case |
|-------|------|-------|-----------|----------|
| llama-3.3-70b-versatile | $0.07/1M | ⚡⚡⚡ | ⭐⭐ | Simple trips |
| openai/gpt-oss-20b | $0.10/1M | ⚡⚡ | ⭐⭐⭐ | **Complex trips (NEW)** |
| openai/gpt-oss-120b | $0.20/1M | ⚡ | ⭐⭐⭐⭐ | Very complex trips |

---

## Test Cases

### Test 1: Simple Trip (3 days, 300km)
**Route**: Rio → Paraty → São Paulo  
**Expected**: All 3 days generated with activities

```
Model: llama-3.3-70b-versatile
Expected tokens: 2000-2500
Expected time: 2-3 seconds
```

### Test 2: Medium Trip (7 days, 800km)
**Route**: Rio → Paraty → São Paulo → Curitiba  
**Expected**: All 7 days with proper progression

```
Model: llama-3.3-70b-versatile
Expected tokens: 3000-3500
Expected time: 3-4 seconds
```

### Test 3: Complex Trip (10 days, 1200km) - GPT-OSS 20B TEST
**Route**: Rio → Paraty → São Paulo → Curitiba → Foz do Iguaçu  
**Expected**: All 10 days with travel days and activities

```
Model: openai/gpt-oss-20b (NEW)
Expected tokens: 3500-4500
Expected time: 4-6 seconds
Expected cost: 50% cheaper than 120B
```

### Test 4: Very Complex Trip (14 days, 1800km) - GPT-OSS 120B COMPARISON
**Route**: Rio → Paraty → São Paulo → Curitiba → Foz do Iguaçu → Puerto Iguazú → Posadas → Corrientes → Rosario → Buenos Aires  
**Expected**: All 14 days with proper geographic progression

```
Model: openai/gpt-oss-120b (BASELINE)
Expected tokens: 4500-5500
Expected time: 5-7 seconds
Expected cost: Baseline
```

---

## Testing Procedure

### Step 1: Update Code
- ✅ Changed default reasoning model to `openai/gpt-oss-20b`
- ✅ Fallback to `openai/gpt-oss-120b` if 20B not available

### Step 2: Test via /test/groq-reasoning Page
1. Navigate to `/test/groq-reasoning`
2. Select model: **GPT-OSS 20B**
3. Set temperature: **0.1**
4. Set max_tokens: **2500**
5. Enable JSON Mode: **ON**
6. Paste prompt for Test 3 (10-day trip)
7. Click "Send Request"

### Step 3: Analyze Results
Check for:
- ✅ All 10 days generated
- ✅ Proper geographic progression
- ✅ Travel times included
- ✅ Activities per day
- ✅ Valid JSON
- ✅ Token count
- ✅ Response time

### Step 4: Compare with 120B
1. Switch model to **GPT-OSS 120B**
2. Run same test
3. Compare:
   - Token usage
   - Response time
   - Quality
   - Cost

---

## Success Criteria

### Quality (Must Pass)
- ✅ All days generated (no truncation)
- ✅ Proper geographic progression
- ✅ Realistic travel times
- ✅ 3+ activities per stay day
- ✅ Valid JSON output
- ✅ No hallucinations

### Performance (Should Pass)
- ⚡ Tokens: < 5000 (same as 120B)
- ⚡ Time: 4-6 seconds (acceptable)
- ⚡ Cost: 50% cheaper than 120B

### Comparison (Must Show)
- 📊 20B vs 120B token usage
- 📊 20B vs 120B response time
- 📊 20B vs 120B quality
- 📊 Cost savings

---

## Expected Outcomes

### Scenario A: 20B Works Great (BEST CASE)
- ✅ Same quality as 120B
- ✅ Similar token usage
- ✅ 50% cheaper
- ✅ **Action**: Use 20B for all complex trips

### Scenario B: 20B Works OK (ACCEPTABLE)
- ✅ Slightly lower quality (minor issues)
- ✅ Similar token usage
- ✅ 50% cheaper
- ✅ **Action**: Use 20B for most trips, 120B for very complex

### Scenario C: 20B Doesn't Work (WORST CASE)
- ❌ Lower quality (missing days, hallucinations)
- ❌ More tokens needed
- ❌ **Action**: Keep 120B as default, use 20B only for simple trips

---

## Test Results Template

```
TEST CASE: [Name]
Model: [Model]
Temperature: 0.1
Max Tokens: 2500
JSON Mode: ON

RESULTS:
- Days Generated: [X]/[Y]
- Geographic Progression: [✅/⚠️/❌]
- Travel Times: [✅/⚠️/❌]
- Activities: [✅/⚠️/❌]
- Valid JSON: [✅/❌]
- Tokens Used: [X]
- Response Time: [X]s
- Cost: $[X]

QUALITY SCORE: [X]/10
RECOMMENDATION: [Use/Don't Use]
```

---

## Implementation Plan

### If 20B Works (Scenario A)
```typescript
// Update default model
private selectOptimalModel(tripDays: number, routeKm: number): string {
  if (tripDays <= 5 && routeKm <= 500) {
    return 'llama-3.3-70b-versatile'
  }
  
  // Use 20B for all complex trips (50% cheaper!)
  if (tripDays >= 10 || routeKm >= 1500) {
    return 'openai/gpt-oss-20b' // 50% cheaper than 120B
  }
  
  return 'llama-3.3-70b-versatile'
}
```

### If 20B Works OK (Scenario B)
```typescript
// Use 20B for most trips, 120B for very complex
private selectOptimalModel(tripDays: number, routeKm: number): string {
  if (tripDays <= 5 && routeKm <= 500) {
    return 'llama-3.3-70b-versatile'
  }
  
  // Use 20B for complex trips
  if (tripDays >= 10 && tripDays <= 12 && routeKm <= 1500) {
    return 'openai/gpt-oss-20b' // 50% cheaper
  }
  
  // Use 120B for very complex trips
  if (tripDays > 12 || routeKm > 1500) {
    return 'openai/gpt-oss-120b' // Better reasoning
  }
  
  return 'llama-3.3-70b-versatile'
}
```

---

## Cost Impact

### Current (with 120B)
```
1000 trips/month:
- 300 simple (versatile): 300 × 2500 = 750K tokens
- 500 medium (versatile): 500 × 3500 = 1.75M tokens
- 200 complex (120B): 200 × 4500 = 900K tokens
Total: 3.4M tokens = $0.68/month
```

### With 20B (Scenario A)
```
1000 trips/month:
- 300 simple (versatile): 300 × 2500 = 750K tokens
- 500 medium (versatile): 500 × 3500 = 1.75M tokens
- 200 complex (20B): 200 × 4500 = 900K tokens
Total: 3.4M tokens = $0.34/month (50% cheaper!)
```

---

## Next Steps

1. **Run Test 3** with GPT-OSS 20B on `/test/groq-reasoning`
2. **Compare with 120B** using same test case
3. **Document results** in this file
4. **Make decision** based on quality vs cost
5. **Update code** if 20B works
6. **Deploy** to production

