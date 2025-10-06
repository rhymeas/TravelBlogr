import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('slug, name, country, is_published')
    .order('name');

  if (error) {
    console.error('Error fetching locations:', error);
    return;
  }

  console.log('\n📍 Available Locations:\n');
  console.log('Published:');
  data?.filter(l => l.is_published).forEach(l => {
    console.log(`  ✅ ${l.slug.padEnd(30)} (${l.name}, ${l.country})`);
  });

  console.log('\nUnpublished:');
  data?.filter(l => !l.is_published).forEach(l => {
    console.log(`  ⏸️  ${l.slug.padEnd(30)} (${l.name}, ${l.country})`);
  });

  console.log(`\nTotal: ${data?.length || 0} locations`);
}

listLocations();

