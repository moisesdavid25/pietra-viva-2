const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

supabase.from('categories').select('id, name, section').limit(15).then(res => {
  if (res.error) {
    console.error(res.error);
    return;
  }
  console.log(JSON.stringify(res.data, null, 2));
});
