import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://luqziqcerwpuipxdnquy.supabase.co',
  'sb_publishable_-0vCDdTYXhQYsres2TUJEg_7BZvU-IR'
);

async function check() {
    console.log('Fetching...');
    const { data: cData, error: cErr } = await supabase.from('categories').select('*').limit(1);
    const { data: mData, error: mErr } = await supabase.from('menus').select('*').limit(1);

    console.log('Categories error:', cErr?.message || 'None');
    console.log('Categories columns:', cData?.[0] ? Object.keys(cData[0]).join(', ') : 'no rows found');
    
    console.log('Menus error:', mErr?.message || 'None');
    console.log('Menus columns:', mData?.[0] ? Object.keys(mData[0]).join(', ') : 'no rows found');
}

check().catch(console.error);
