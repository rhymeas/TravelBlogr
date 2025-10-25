# GPT-OSS 20B Testing Guide - Step by Step

## Quick Summary
Testing if **GPT-OSS 20B** (50% cheaper) can replace **GPT-OSS 120B** while maintaining quality.

---

## 🚀 How to Test

### Step 1: Start the Dev Server
```bash
npm run dev
```

### Step 2: Navigate to Test Page
Open: `http://localhost:3000/test/groq-reasoning`

### Step 3: Configure for Test 3 (10-day Complex Trip)

**Settings**:
- Model: **GPT-OSS 20B** ← SELECT THIS
- Temperature: **0.1**
- Max Tokens: **2500**
- JSON Mode: **ON** (toggle the checkbox)
- Reasoning: OFF (uncheck)

**Prompt** (copy-paste):
```
Plan a 10-day overland adventure from Rio de Janeiro to Buenos Aires with these stops:
- Rio de Janeiro (2 days)
- Paraty (1 day)
- São Paulo (2 days)
- Curitiba (1 day)
- Foz do Iguaçu (1 day)
- Puerto Iguazú (1 day)
- Posadas (1 day)

Include:
- Day-by-day itinerary
- Travel times between stops
- 3 activities per stay day
- Realistic travel modes (car/bus)
- Accommodation suggestions

Return as valid JSON with days array.
```

### Step 4: Click "Send Request"

### Step 5: Analyze Results

**Check These**:
- ✅ **Days Generated**: Should be exactly 10
- ✅ **Geographic Progression**: Rio → Paraty → São Paulo → Curitiba → Foz do Iguaçu → Puerto Iguazú → Posadas → Buenos Aires
- ✅ **Travel Times**: Should include hours (e.g., "4h", "6h")
- ✅ **Activities**: Each stay day should have 3+ activities
- ✅ **Valid JSON**: Should parse without errors
- ✅ **Tokens Used**: Check in response (should be < 5000)
- ✅ **Response Time**: Check in response (should be 4-6 seconds)

---

## 📊 Comparison Test

### Run Test 3 Twice

**First Run**:
1. Model: **GPT-OSS 20B**
2. Run test
3. **Record**:
   - Tokens used
   - Response time
   - Quality (1-10)
   - Any issues

**Second Run**:
1. Model: **GPT-OSS 120B**
2. Run same test
3. **Record**:
   - Tokens used
   - Response time
   - Quality (1-10)
   - Any issues

### Compare Results

```
Metric              | 20B      | 120B     | Winner
--------------------|----------|----------|--------
Tokens Used         | [X]      | [X]      | [?]
Response Time       | [X]s     | [X]s     | [?]
Quality Score       | [X]/10   | [X]/10   | [?]
Cost (relative)     | 1x       | 2x       | 20B ✅
```

---

## ✅ Quality Checklist

For each test, verify:

- [ ] All 10 days present (not truncated)
- [ ] Days numbered 1-10
- [ ] Dates sequential
- [ ] Geographic progression correct
- [ ] Travel times realistic (2-8 hours)
- [ ] Activities have descriptions
- [ ] No hallucinations (fake locations)
- [ ] Valid JSON (no parse errors)
- [ ] Accommodations mentioned
- [ ] Budget considerations included

---

## 🎯 Success Criteria

### PASS (Use 20B)
- ✅ All 10 days generated
- ✅ Proper progression
- ✅ Quality ≥ 8/10
- ✅ Tokens < 5000
- ✅ No major issues

### CONDITIONAL (Use 20B for most, 120B for very complex)
- ⚠️ All 10 days generated
- ⚠️ Proper progression
- ⚠️ Quality 6-7/10
- ⚠️ Tokens < 5500
- ⚠️ Minor issues (occasional hallucinations)

### FAIL (Keep 120B)
- ❌ Missing days
- ❌ Wrong progression
- ❌ Quality < 6/10
- ❌ Tokens > 6000
- ❌ Major issues (hallucinations, invalid JSON)

---

## 📝 Results Template

Copy and fill this in:

```
TEST RESULTS - GPT-OSS 20B vs 120B
===================================

TEST CASE: 10-day Rio → Buenos Aires
DATE: [TODAY]
TESTER: [YOUR NAME]

GPT-OSS 20B RESULTS:
- Days Generated: [X]/10
- Geographic Progression: [✅/⚠️/❌]
- Travel Times: [✅/⚠️/❌]
- Activities: [✅/⚠️/❌]
- Valid JSON: [✅/❌]
- Tokens Used: [X]
- Response Time: [X]s
- Quality Score: [X]/10
- Issues: [NONE / LIST ISSUES]

GPT-OSS 120B RESULTS:
- Days Generated: [X]/10
- Geographic Progression: [✅/⚠️/❌]
- Travel Times: [✅/⚠️/❌]
- Activities: [✅/⚠️/❌]
- Valid JSON: [✅/❌]
- Tokens Used: [X]
- Response Time: [X]s
- Quality Score: [X]/10
- Issues: [NONE / LIST ISSUES]

COMPARISON:
- 20B is [X]% cheaper
- 20B is [X]% faster/slower
- Quality difference: [SAME / SLIGHTLY LOWER / MUCH LOWER]

RECOMMENDATION:
[ ] Use 20B for all complex trips (50% cost savings!)
[ ] Use 20B for most trips, 120B for very complex
[ ] Keep 120B as default (20B not ready)

NOTES:
[ANY ADDITIONAL OBSERVATIONS]
```

---

## 🔧 If You Want to Test Other Cases

### Test 4: Very Complex (14 days, 1800km)
**Prompt**:
```
Plan a 14-day overland adventure from Rio de Janeiro to Buenos Aires with these stops:
- Rio de Janeiro (2 days)
- Paraty (1 day)
- São Paulo (2 days)
- Curitiba (1 day)
- Foz do Iguaçu (1 day)
- Puerto Iguazú (1 day)
- Posadas (1 day)
- Corrientes (1 day)
- Rosario (1 day)
- Buenos Aires (2 days)

Include day-by-day itinerary, travel times, 3 activities per stay day, and realistic travel modes.
Return as valid JSON.
```

**Expected**: 14 days with proper progression

---

## 💡 Tips

1. **Use JSON Mode**: Toggle "JSON Mode" ON for structured output
2. **Lower Temperature**: Use 0.1 for more deterministic results
3. **Reduce Max Tokens**: Use 2500 to test token efficiency
4. **Check Logs**: Browser console shows detailed logs
5. **Compare Side-by-Side**: Run both models with same prompt

---

## 📞 Questions?

If you encounter issues:
1. Check browser console for errors
2. Verify API keys are set
3. Check Groq API status
4. Try with different temperature/tokens
5. Check response in "Analysis" panel

---

## 🎉 After Testing

Once you have results:
1. **Document findings** in this file
2. **Update code** if 20B works
3. **Deploy** to production
4. **Monitor** token usage and costs
5. **Plan Phase 2** optimizations

---

## Expected Cost Savings

If 20B works:
```
Current (120B):  $0.68/month for complex trips
With 20B:        $0.34/month for complex trips
SAVINGS:         $0.34/month (50% reduction!)

Annual savings:  $4.08 (50% cheaper reasoning model)
```

Plus Phase 1 optimizations already saved $4.12/month!

**Total potential**: $8.20/month savings (70% reduction)

