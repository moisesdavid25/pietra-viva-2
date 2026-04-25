-- ─────────────────────────────────────────────────────────────────────────────
-- Backup system: automatic snapshots of restaurant menu data
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabla principal de backups
CREATE TABLE IF NOT EXISTS public.restaurant_backups (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    trigger_reason  TEXT        NOT NULL,   -- ej: "delete_section:Vino e Drinks"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    data            JSONB       NOT NULL    -- { categories:[], products:[], settings:[] }
);

CREATE INDEX IF NOT EXISTS idx_restaurant_backups_restaurant_created
    ON public.restaurant_backups (restaurant_id, created_at DESC);

-- 2. RLS
ALTER TABLE public.restaurant_backups ENABLE ROW LEVEL SECURITY;

-- El propietario del restaurante puede crear y ver sus propios backups
CREATE POLICY "owners_insert_backups" ON public.restaurant_backups
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "owners_select_backups" ON public.restaurant_backups
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

-- Los admins (user_roles.role = 'admin') pueden ver y gestionar todos los backups
CREATE POLICY "admins_all_backups" ON public.restaurant_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Función RPC de restauración (SECURITY DEFINER — solo admins)
CREATE OR REPLACE FUNCTION public.restore_restaurant_backup(p_backup_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_backup        RECORD;
    v_cat           JSONB;
    v_prod          JSONB;
    v_cats_count    INT := 0;
    v_prods_count   INT := 0;
BEGIN
    -- Solo admins
    IF NOT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    -- Obtener backup
    SELECT * INTO v_backup FROM restaurant_backups WHERE id = p_backup_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup non trovato: %', p_backup_id;
    END IF;

    -- Borrar datos actuales (productos primero por FK)
    DELETE FROM products  WHERE restaurant_id = v_backup.restaurant_id;
    DELETE FROM categories WHERE restaurant_id = v_backup.restaurant_id;

    -- Restaurar categorías con sus IDs originales
    FOR v_cat IN SELECT value FROM jsonb_array_elements(v_backup.data->'categories') LOOP
        INSERT INTO categories (
            id, restaurant_id, section, name, position, active, created_at
        ) VALUES (
            (v_cat->>'id')::UUID,
            v_backup.restaurant_id,
            v_cat->>'section',
            v_cat->>'name',
            COALESCE((v_cat->>'position')::INT, 0),
            COALESCE((v_cat->>'active')::BOOLEAN, true),
            COALESCE((v_cat->>'created_at')::TIMESTAMPTZ, now())
        )
        ON CONFLICT (id) DO UPDATE SET
            section  = EXCLUDED.section,
            name     = EXCLUDED.name,
            position = EXCLUDED.position,
            active   = EXCLUDED.active;
        v_cats_count := v_cats_count + 1;
    END LOOP;

    -- Restaurar productos con sus IDs originales
    FOR v_prod IN SELECT value FROM jsonb_array_elements(v_backup.data->'products') LOOP
        INSERT INTO products (
            id, restaurant_id, category_id, name, description,
            price, price_unit, image_url, sort_order, active, allergens, created_at
        ) VALUES (
            (v_prod->>'id')::UUID,
            v_backup.restaurant_id,
            (v_prod->>'category_id')::UUID,
            v_prod->>'name',
            COALESCE(v_prod->>'description', ''),
            (v_prod->>'price')::NUMERIC,
            NULLIF(v_prod->>'price_unit', ''),
            COALESCE(v_prod->>'image_url', ''),
            COALESCE((v_prod->>'sort_order')::INT, 0),
            COALESCE((v_prod->>'active')::BOOLEAN, true),
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(v_prod->'allergens')),
                ARRAY[]::TEXT[]
            ),
            COALESCE((v_prod->>'created_at')::TIMESTAMPTZ, now())
        )
        ON CONFLICT (id) DO UPDATE SET
            category_id = EXCLUDED.category_id,
            name        = EXCLUDED.name,
            description = EXCLUDED.description,
            price       = EXCLUDED.price,
            price_unit  = EXCLUDED.price_unit,
            image_url   = EXCLUDED.image_url,
            sort_order  = EXCLUDED.sort_order,
            active      = EXCLUDED.active,
            allergens   = EXCLUDED.allergens;
        v_prods_count := v_prods_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',             true,
        'categories_restored', v_cats_count,
        'products_restored',   v_prods_count
    );
END;
$$;
