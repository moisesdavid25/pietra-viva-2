import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const desserts = [
    { name: 'Ferrero Rocher', desc: 'Mousse al cioccolato al latte, Crema Conquistador con nocciole, Biscuit classico, Glassa pinguino al cioccolato con nocciole.' },
    { name: 'Croccante Amarena', desc: 'Mousse cioccolato bianco e vaniglia, Amarene sciroppate, Biscuit classico, Glassa pinguino + granella amaretti.' },
    { name: 'Rocher al Pistacchio', desc: 'Mousse al pistacchio, Inserto croccante al pistacchio, Biscuit classico, Glassa Rocher al pistacchio.' },
    { name: 'Kinder Bueno', desc: 'Bavarese nocciola e Cioccolato bianco, Crema latte e Nocciola, biscuit al cacao, Glassa pinguino.' },
    { name: 'Ananas e Coco', desc: "Ananas fresca, Succo d'ananas, Cioccolata al latte, Cocco rapé." },
    { name: 'Cheesecake al cioccolato bianco, limone e frutti di bosco', desc: 'Mousse Cheesecake cioccolato bianco e limone, Inserto ai frutti di bosco, Glassa a specchio.' },
    { name: 'Snickers', desc: 'Mousse cioccolato al latte, Caramello salato agli arachidi, Biscuit classico.' },
    { name: 'Tiramisù', desc: 'Crema tiramisù pastorizzata, Gel al caffè, Biscuit classico, Glassa pinguino al cioccolato.' },
    { name: 'Limoncé', desc: 'Mousse al limone e cioccolato bianco, Gel di limone, Glassa a specchio, Biscuit al limoncello.' },
    { name: 'Raffaello', desc: 'Mousse cioccolato bianco e cocco, Rice Crispies al cioccolato bianco e cocco, Biscuit classico, Glassa pinguino bianca e cocco Rapè.' },
    { name: 'Nutella Biscuits', desc: 'Mousse al cioccolato bianco, Biscuit classico, Caramello salato, Glassa pinguino al cioccolato + Nutella.' },
    { name: 'Ricotta e Pera', desc: 'Mousse di ricotta, Composta di pere, Biscuit classico, Glassa rocher.' }
];

async function seedDesserts() {
    try {
        console.log('Fetching Pietra Viva restaurant ID...');
        const { data: res, error: resError } = await supabase.from('restaurants').select('id').eq('slug', 'pietra-viva').single();
        if (resError) throw resError;

        const restaurantId = res.id;
        console.log(`Restaurant ID: ${restaurantId}`);

        console.log('Inserting Dessert category...');
        const { data: category, error: catError } = await supabase.from('categories')
            .insert({
                restaurant_id: restaurantId,
                section: 'Dessert',
                name: 'I Nostri Dolci'
            })
            .select()
            .single();

        if (catError) throw catError;
        const categoryId = category.id;
        console.log(`Created Category ID: ${categoryId}`);

        console.log('Inserting products...');
        const productsToInsert = desserts.map((d, index) => ({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name: d.name,
            description: d.desc,
            price: 0.00,
            price_unit: null,
            image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800&h=600', // Default dessert placeholder
            sort_order: index
        }));

        const { error: prodError } = await supabase.from('products').insert(productsToInsert);
        if (prodError) throw prodError;

        console.log('Setting default homepage image for Dessert section...');
        await supabase.from('settings').upsert({
            restaurant_id: restaurantId,
            key: 'home_image_dessert',
            value: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800&h=400'
        });

        console.log('Success! Dessert category and 12 products inserted.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

seedDesserts();
