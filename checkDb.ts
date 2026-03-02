import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const db = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    // 1. Get user admin@pietraviva.it
    const { data: { users }, error: adminError } = await db.auth.admin?.listUsers() || {};
    // Wait, anon key can't use admin.listUsers. Let's just login to get the UUID.
    const { data: authData, error: authErr } = await db.auth.signInWithPassword({
        email: 'admin@pietraviva.it',
        password: 'admin123'
    });

    if (authErr) {
        console.error("Login Error:", authErr);
    } else {
        console.log("Logged in User ID:", authData.user.id);
    }

    // 2. Check restaurants table
    const { data: rests, error: restsErr } = await db.from('restaurants').select('*');
    if (restsErr) {
        console.error("Restaurants Error:", restsErr);
    } else {
        console.log("Restaurants in DB:", rests);
    }

    // 3. Fix Pietra Viva if needed
    if (authData?.user && rests) {
        let pietraViva = rests.find(r => r.name.toLowerCase().includes('pietra') || r.slug.includes('pietra'));
        if (pietraViva) {
            console.log("Found Pietra Viva:", pietraViva);
            if (pietraViva.user_id !== authData.user.id || pietraViva.slug !== 'pietra-viva') {
                console.log("Updating Pietra Viva mapping...");
                const { error: updateErr } = await db.from('restaurants')
                    .update({ user_id: authData.user.id, slug: 'pietra-viva' })
                    .eq('id', pietraViva.id);
                console.log("Update Error:", updateErr || "Success");
            } else {
                console.log("Pietra Viva is perfectly mapped!");
            }
        } else {
            console.log("Pietra viva not found in restaurants table!");
        }
    }
}

checkDb();
