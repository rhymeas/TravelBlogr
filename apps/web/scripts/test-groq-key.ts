import { config } from 'dotenv';
import { resolve } from 'path';
import Groq from 'groq-sdk';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testGroqKey() {
  console.log('\n🔑 Testing Groq API Key\n');
  console.log('=' .repeat(60));

  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('❌ ERROR: No valid Groq API key found!');
    console.log('\n📝 Steps to fix:');
    console.log('1. Go to: https://console.groq.com/keys');
    console.log('2. Sign in (free, no credit card)');
    console.log('3. Click "Create API Key"');
    console.log('4. Copy the key (starts with gsk_)');
    console.log('5. Add to .env.local: GROQ_API_KEY=gsk_your_actual_key');
    console.log('\n');
    return;
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('\n🧪 Testing API connection...\n');

  try {
    const groq = new Groq({ apiKey });
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Groq!" in exactly 5 words.'
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 50
    });

    console.log('✅ SUCCESS! Groq API is working!');
    console.log('\n📨 Response:');
    console.log(response.choices[0]?.message?.content);
    console.log('\n📊 Usage:');
    console.log(`   Tokens: ${response.usage?.total_tokens}`);
    console.log(`   Model: ${response.model}`);
    console.log('\n🎉 Your Groq API key is valid and working!\n');

  } catch (error: any) {
    console.log('❌ ERROR: API call failed!');
    console.log('\n🔍 Error details:');
    console.log(`   Status: ${error.status || 'N/A'}`);
    console.log(`   Message: ${error.message || 'Unknown error'}`);
    
    if (error.status === 401) {
      console.log('\n❌ INVALID API KEY!');
      console.log('\n📝 This means:');
      console.log('   - The key in .env.local is incorrect');
      console.log('   - The key may have been revoked');
      console.log('   - You need to create a new key');
      console.log('\n🔧 Fix:');
      console.log('   1. Go to: https://console.groq.com/keys');
      console.log('   2. Delete old key (if exists)');
      console.log('   3. Create new API key');
      console.log('   4. Update .env.local with new key');
      console.log('   5. Restart dev server: npm run dev');
    }
    console.log('\n');
  }
}

testGroqKey();

