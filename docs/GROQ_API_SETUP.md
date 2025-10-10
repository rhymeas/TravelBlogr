# Groq API Setup for TravelBlogr

## Why Groq?

TravelBlogr uses Groq's AI models to automatically generate compelling location descriptions. Groq offers:

- ✅ **Free tier** with generous limits
- ✅ **Fast inference** (much faster than OpenAI)
- ✅ **Multiple models** to choose from
- ✅ **No credit card required** for free tier

## Setup Instructions

### 1. Get Your Groq API Key

1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy your new API key (starts with `gsk_`)

### 2. Add to Environment Variables

Open `.env.local` and add:

```bash
# Groq API for AI-generated location descriptions
GROQ_API_KEY=gsk_your_actual_key_here

# Optional: Choose a different model (default: llama-3.3-70b-versatile)
# GROQ_MODEL=llama-4-scout
```

### 3. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Available Models

Based on Groq's model page, here are the recommended models for TravelBlogr:

### Recommended: `llama-3.3-70b-versatile` (Default)
- **Best for:** Creative, engaging descriptions
- **Speed:** Very fast
- **Quality:** Excellent
- **Cost:** Free tier available
- **Use case:** Perfect for travel descriptions

### Alternative: `llama-4-scout`
- **Best for:** Latest model with improved quality
- **Speed:** Fast
- **Quality:** Potentially better than 3.3
- **Cost:** Check Groq pricing
- **Use case:** If you want the newest model

### Alternative: `qwen-3-32b`
- **Best for:** Multilingual content
- **Speed:** Very fast
- **Quality:** Good
- **Cost:** Free tier available
- **Use case:** If you need better non-English support

## How It Works

When a new location is created during trip planning:

```typescript
// 1. Location discovered from GeoNames/Nominatim
const geoData = await discoverLocation("Tokyo")

// 2. Translate name to English
const translatedName = await translateLocationName(geoData.name)

// 3. Generate AI description
const description = await generateLocationDescription(
  translatedName,
  country,
  region
)
// Result: "Tokyo is Japan's bustling capital, blending ultramodern 
// skyscrapers with historic temples and traditional culture..."

// 4. Save to database
await supabase.from('locations').insert({
  name: translatedName,
  description: description,
  // ... other fields
})
```

## Example Descriptions

### With AI (Groq):
```
Vilnius is the capital and largest city of Lithuania, known for its 
baroque architecture, medieval Old Town, and vibrant cultural scene.
```

### Without AI (Fallback):
```
Vilnius is a city in Lithuania.
```

## Troubleshooting

### Error: "Invalid API Key"

**Problem:** Your API key is invalid or expired.

**Solution:**
1. Go to https://console.groq.com/keys
2. Delete the old key
3. Create a new key
4. Update `.env.local` with the new key
5. Restart the dev server

### Error: "Rate Limit Exceeded"

**Problem:** You've exceeded the free tier limits.

**Solution:**
1. Wait for the rate limit to reset (usually 1 minute)
2. Or upgrade to a paid plan at https://console.groq.com/settings/billing

### Error: "GROQ_API_KEY not found"

**Problem:** Environment variable not set.

**Solution:**
1. Check `.env.local` exists in project root
2. Add `GROQ_API_KEY=gsk_your_key_here`
3. Restart dev server

### Descriptions Not Generating

**Problem:** API calls failing silently.

**Solution:**
1. Check the terminal/console for error messages
2. Verify API key is correct
3. Test API key with curl:

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

## Testing

Test AI description generation:

```bash
export $(cat .env.local | grep -v '^#' | xargs) && npx tsx -e "
const groqApiKey = process.env.GROQ_API_KEY;

async function test() {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${groqApiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ 
        role: 'user', 
        content: 'Write a 2-sentence description of Paris, France for travelers.' 
      }],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  const data = await response.json();
  console.log('✅ API Response:', data.choices[0].message.content);
}

test();
"
```

Expected output:
```
✅ API Response: Paris is the romantic capital of France, renowned for 
its iconic Eiffel Tower, world-class museums like the Louvre, and 
charming cafes along the Seine River...
```

## Cost Estimation

### Free Tier (Groq)
- **Requests:** 30 requests/minute
- **Tokens:** 6,000 tokens/minute
- **Cost:** $0

### Typical Usage
- **Per location:** ~200 tokens (~$0.00001 with paid tier)
- **100 locations:** ~20,000 tokens (~$0.001 with paid tier)
- **1000 locations:** ~200,000 tokens (~$0.01 with paid tier)

**Conclusion:** Even with 1000 locations, the cost is negligible!

## Alternative: Manual Descriptions

If you don't want to use AI, the system will fall back to basic descriptions:

```typescript
// Fallback description
const description = `${locationName} is a city in ${country}${region ? `, ${region}` : ''}.`
```

You can then manually edit descriptions in the database or CMS.

## Model Comparison

| Model | Speed | Quality | Multilingual | Free Tier |
|-------|-------|---------|--------------|-----------|
| llama-3.3-70b-versatile | ⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |
| llama-4-scout | ⚡⚡ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ |
| qwen-3-32b | ⚡⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| gpt-oss-120b | ⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |

## Switching Models

To use a different model, add to `.env.local`:

```bash
# Use Llama 4 Scout (newest)
GROQ_MODEL=llama-4-scout

# Or use Qwen 3 (best multilingual)
GROQ_MODEL=qwen-3-32b

# Or use GPT OSS 120B (largest)
GROQ_MODEL=gpt-oss-120b
```

Then restart the dev server.

## Summary

1. ✅ Get API key from https://console.groq.com/keys
2. ✅ Add to `.env.local`: `GROQ_API_KEY=gsk_your_key_here`
3. ✅ Restart dev server
4. ✅ AI descriptions will be generated automatically for new locations!

**Free, fast, and high-quality AI descriptions for your travel blog!** 🚀

