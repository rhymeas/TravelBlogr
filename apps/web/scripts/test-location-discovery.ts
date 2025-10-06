import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { LocationDiscoveryService } from '../lib/itinerary/infrastructure/services/LocationDiscoveryService';

async function testLocationDiscovery() {
  const service = new LocationDiscoveryService();

  console.log('\n🧪 Testing Location Discovery Service\n');
  console.log('=' .repeat(60));

  // Test 1: Find existing location (Paris)
  console.log('\n📍 Test 1: Finding "paris" (should exist in database)');
  const paris = await service.findOrCreateLocation('paris');
  if (paris) {
    console.log(`✅ Found: ${paris.name}, ${paris.country} (${paris.latitude}, ${paris.longitude})`);
  } else {
    console.log('❌ Not found');
  }

  // Test 2: Find existing location (Rome)
  console.log('\n📍 Test 2: Finding "rome" (should exist in database)');
  const rome = await service.findOrCreateLocation('rome');
  if (rome) {
    console.log(`✅ Found: ${rome.name}, ${rome.country} (${rome.latitude}, ${rome.longitude})`);
  } else {
    console.log('❌ Not found');
  }

  // Test 3: Create new location (Sunshine Coast)
  console.log('\n📍 Test 3: Finding "sunshine coast" (should create from GeoNames)');
  const sunshineCoast = await service.findOrCreateLocation('sunshine coast');
  if (sunshineCoast) {
    console.log(`✅ Found/Created: ${sunshineCoast.name}, ${sunshineCoast.country} (${sunshineCoast.latitude}, ${sunshineCoast.longitude})`);
  } else {
    console.log('❌ Not found');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests complete!\n');
}

testLocationDiscovery();

