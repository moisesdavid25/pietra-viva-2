import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const db = createClient(supabaseUrl, supabaseKey);

async function checkAnon() {
    const { data: resData, error: resError } = await db.from('restaurants').select('*');
    console.log("All Restaurants:", resData);

    const { data: singleData, error: singleError } = await db.from('restaurants').select('id, name').eq('slug', 'pietra-viva').single();
    console.log("Single Fetch Error:", singleError);
    console.log("Single Fetch Data:", singleData);
}

checkAnon();
