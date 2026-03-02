import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const db = createClient(supabaseUrl, supabaseKey);

async function checkAnon() {
    const { data: resData, error: resError } = await db.from('restaurants').select('*').eq('slug', 'pietra-viva');
    console.log("Anon Fetch Error:", resError);
    console.log("Anon Fetch Data:", resData);

    // Also try fetch by id
    const { data: resIdData, error: resIdError } = await db.from('restaurants').select('id, slug, name').eq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Anon ID Fetch Error:", resIdError);
    console.log("Anon ID Fetch Data:", resIdData);
}

checkAnon();
