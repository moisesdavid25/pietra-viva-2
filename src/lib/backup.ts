import db from '../db';

const MAX_BACKUPS_PER_RESTAURANT = 30;

export async function createBackupSnapshot(
    restaurantId: string,
    triggerReason: string,
): Promise<void> {
    try {
        const [{ data: categories }, { data: products }, { data: settings }] = await Promise.all([
            db.from('categories').select('*').eq('restaurant_id', restaurantId),
            db.from('products').select('*').eq('restaurant_id', restaurantId),
            db.from('settings').select('*').eq('restaurant_id', restaurantId),
        ]);

        await db.from('restaurant_backups').insert({
            restaurant_id: restaurantId,
            trigger_reason: triggerReason,
            data: {
                categories: categories ?? [],
                products:   products   ?? [],
                settings:   settings   ?? [],
            },
        });

        // Mantener solo los últimos N backups
        const { data: old } = await db
            .from('restaurant_backups')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .range(MAX_BACKUPS_PER_RESTAURANT, 9999);

        if (old && old.length > 0) {
            await db.from('restaurant_backups')
                .delete()
                .in('id', old.map((b: { id: string }) => b.id));
        }
    } catch (err) {
        // Nunca bloquear la operación principal si el backup falla
        console.warn('[Backup] Failed to create snapshot:', err);
    }
}
