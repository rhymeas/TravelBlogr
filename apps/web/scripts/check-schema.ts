import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data[0]) {
    console.log('\n📋 Locations table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n📝 Sample row:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema();

