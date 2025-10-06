import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testGeoNames() {
  console.log('\n🌍 Testing GeoNames API\n');
  console.log('=' .repeat(60));

  const username = process.env.GEONAMES_USERNAME;
  
  if (!username) {
    console.log('❌ ERROR: GEONAMES_USERNAME not found in .env.local');
    return;
  }

  console.log(`✅ Username: ${username}`);
  console.log('\n🧪 Testing API access...\n');

  try {
    // Test with a simple query
    const testCity = 'Tokyo';
    const url = `http://api.geonames.org/searchJSON?q=${testCity}&maxRows=1&username=${username}&featureClass=P&orderby=population`;
    
    console.log(`📡 Calling: ${url}\n`);
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status) {
      console.log('❌ ERROR: GeoNames API returned an error');
      console.log(`   Code: ${data.status.value}`);
      console.log(`   Message: ${data.status.message}\n`);
      
      if (data.status.value === 10) {
        console.log('🔧 This means your account is not activated yet.');
        console.log('   Steps to fix:');
        console.log('   1. Check your email for activation link');
        console.log('   2. Click the activation link');
        console.log('   3. Go to: https://www.geonames.org/manageaccount');
        console.log('   4. Enable "Free Web Services"');
        console.log('   5. Wait 5 minutes for changes to propagate');
        console.log('   6. Run this test again\n');
      } else if (data.status.value === 18 || data.status.value === 19) {
        console.log('🔧 Daily limit exceeded or service not enabled.');
        console.log('   Go to: https://www.geonames.org/manageaccount');
        console.log('   Enable "Free Web Services"\n');
      }
      return;
    }

    if (data.geonames && data.geonames.length > 0) {
      const result = data.geonames[0];
      console.log('✅ SUCCESS! GeoNames API is working!\n');
      console.log('📍 Test Result:');
      console.log(`   Name: ${result.name}`);
      console.log(`   Country: ${result.countryName}`);
      console.log(`   Coordinates: ${result.lat}, ${result.lng}`);
      console.log(`   Population: ${result.population?.toLocaleString()}`);
      console.log('\n🎉 Your GeoNames account is fully configured!\n');
      console.log('📊 Limits:');
      console.log('   - 20,000 requests per day');
      console.log('   - 1,000 requests per hour');
      console.log('   - Completely FREE\n');
    } else {
      console.log('⚠️  No results found, but API is accessible.');
      console.log('   This might mean the service is enabled but needs time to activate.\n');
    }

  } catch (error: any) {
    console.log('❌ ERROR: Failed to call GeoNames API');
    console.log(`   ${error.message}\n`);
  }
}

testGeoNames();

