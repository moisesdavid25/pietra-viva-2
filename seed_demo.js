import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cloneRestaurant() {
    try {
        console.log("Fetching pietra-viva...");
        const { data: pv, error: pvErr } = await supabase.from('restaurants').select('*').eq('slug', 'pietra-viva').single();
        if (pvErr) throw pvErr;

        console.log("Checking if demo exists...");
        const { data: existingDemo } = await supabase.from('restaurants').select('id').eq('slug', 'demo').single();
        if (existingDemo) {
            console.log("Demo already exists. Deleting...");
            await supabase.from('restaurants').delete().eq('id', existingDemo.id);
        }

        console.log("Creating demo restaurant...");
        const demoRes = { ...pv };
        delete demoRes.id;
        delete demoRes.created_at;
        demoRes.slug = 'demo';
        demoRes.name = 'Demo Leomenu';

        const { data: newDemo, error: demoErr } = await supabase.from('restaurants').insert(demoRes).select().single();
        if (demoErr) throw demoErr;

        console.log("Cloning categories...");
        const { data: cats, error: catsErr } = await supabase.from('categories').select('*').eq('restaurant_id', pv.id);
        if (catsErr) throw catsErr;

        if (cats && cats.length > 0) {
            const catIdMap = {};
            for (const cat of cats) {
                const oldId = cat.id;
                delete cat.id;
                delete cat.created_at;
                cat.restaurant_id = newDemo.id;
                const { data: newCat, error: newCatErr } = await supabase.from('categories').insert(cat).select().single();
                if (newCatErr) throw newCatErr;
                catIdMap[oldId] = newCat.id;
            }

            console.log("Cloning products...");
            const { data: products, error: prodErr } = await supabase.from('products').select('*').eq('restaurant_id', pv.id);
            if (prodErr) throw prodErr;

            if (products && products.length > 0) {
                const newProducts = products.map(p => {
                    delete p.id;
                    delete p.created_at;
                    p.restaurant_id = newDemo.id;
                    p.category_id = catIdMap[p.category_id] || p.category_id;
                    return p;
                });
                await supabase.from('products').insert(newProducts);
            }
        }

        console.log("Cloning settings...");
        const { data: settings, error: setErr } = await supabase.from('settings').select('*').eq('restaurant_id', pv.id);
        if (setErr) throw setErr;

        if (settings && settings.length > 0) {
            const newSettings = settings.map(s => {
                delete s.id;
                delete s.created_at;
                s.restaurant_id = newDemo.id;
                return s;
            });
            await supabase.from('settings').insert(newSettings);
        }

        console.log("Done cloning pietro-viva to demo!");
    } catch (e) {
        console.error("Error:", e);
    }
}

cloneRestaurant();
