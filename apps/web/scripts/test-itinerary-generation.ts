import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testplanGeneration() {
  console.log('\n🧪 Testing plan Generation API\n');
  console.log('=' .repeat(60));

  const testRequest = {
    from: 'paris',
    to: 'rome',
    startDate: '2025-11-01',
    endDate: '2025-11-07',
    interests: ['art', 'food', 'history'],
    budget: 'moderate'
  };

  console.log('📝 Request:', JSON.stringify(testRequest, null, 2));
  console.log('\n🚀 Calling API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! plan generated!\n');
      console.log('📋 Title:', data.plan?.title);
      console.log('📝 Summary:', data.plan?.summary?.substring(0, 100) + '...');
      console.log('📅 Days:', data.plan?.days?.length);
      console.log('💰 Cost:', data.plan?.totalCostEstimate);
      console.log('\n🎉 Groq AI is working perfectly!\n');
    } else {
      console.log('❌ ERROR:', response.status, response.statusText);
      console.log('\n📋 Response:', JSON.stringify(data, null, 2));
      
      if (data.error?.includes('Invalid API Key')) {
        console.log('\n🔧 The API key is still not working.');
        console.log('   Try restarting the dev server manually:');
        console.log('   1. Stop the server (Ctrl+C)');
        console.log('   2. Run: rm -rf .next');
        console.log('   3. Run: npm run dev');
      }
      console.log('\n');
    }
  } catch (error: any) {
    console.log('❌ ERROR: Failed to call API');
    console.log('   Message:', error.message);
    console.log('\n   Make sure the dev server is running on http://localhost:3000\n');
  }
}

testplanGeneration();

