DO $$
DECLARE
    pv_id UUID;
    demo_id UUID;
    new_cat_id UUID;
    cat_record RECORD;
BEGIN
    -- 1. Get Pietra Viva ID
    SELECT id INTO pv_id FROM restaurants WHERE slug = 'pietra-viva' LIMIT 1;
    IF pv_id IS NULL THEN
        RAISE EXCEPTION 'pietra-viva not found';
    END IF;

    -- 2. Cleanup existing demo
    SELECT id INTO demo_id FROM restaurants WHERE slug = 'demo' LIMIT 1;
    IF demo_id IS NOT NULL THEN
        DELETE FROM restaurants WHERE id = demo_id;
    END IF;

    -- 3. Clone restaurant with McDonald's style fields
    INSERT INTO restaurants (user_id, name, type, slug, numero_coperti, telefono, indirizzo, citta, provincia, cap, paese, sondaggio_tipo_menu, scoperto_tramite)
    SELECT user_id, 'Demo Leomenu', type, 'demo', numero_coperti, telefono, indirizzo, citta, provincia, cap, paese, sondaggio_tipo_menu, scoperto_tramite
    FROM restaurants WHERE id = pv_id
    RETURNING id INTO demo_id;

    -- 4. Clone categories and products
    FOR cat_record IN SELECT * FROM categories WHERE restaurant_id = pv_id LOOP
        -- Categories use 'section'
        INSERT INTO categories (restaurant_id, section, name)
        VALUES (demo_id, cat_record.section, cat_record.name)
        RETURNING id INTO new_cat_id;

        -- Products DO NOT have 'section' column, so we exclude it here to avoid error 42703
        INSERT INTO products (restaurant_id, category_id, name, description, price, image_url)
        SELECT demo_id, new_cat_id, name, description, price, image_url
        FROM products WHERE category_id = cat_record.id;
    END LOOP;

    -- 5. Clone settings
    INSERT INTO settings (restaurant_id, key, value)
    SELECT demo_id, key, value
    FROM settings WHERE restaurant_id = pv_id;

END $$;
