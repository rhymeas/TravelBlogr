import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function publishAllLocations() {
  console.log('📢 Publishing all locations...\n');

  const { data, error } = await supabase
    .from('locations')
    .update({ is_published: true })
    .eq('is_published', false)
    .select('slug, name, country');

  if (error) {
    console.error('❌ Error publishing locations:', error);
    return;
  }

  console.log('✅ Successfully published locations:\n');
  data?.forEach(l => {
    console.log(`  ✅ ${l.slug.padEnd(30)} (${l.name}, ${l.country})`);
  });

  console.log(`\n🎉 Total published: ${data?.length || 0} locations`);
}

publishAllLocations();

