import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end('Method not allowed');

  // Verify caller is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });

  const token = authHeader.slice(7);
  const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !caller) return res.status(401).json({ error: 'Invalid token' });

  // Verify admin role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
    .maybeSingle();
  if (roleData?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    // List all auth users
    const { data: listData, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const users = (listData?.users ?? []) as any[];

    // Get restaurant owner IDs to exclude them
    const { data: restaurants } = await supabase.from('restaurants').select('owner_id');
    const ownerIds = new Set((restaurants ?? []).map((r: any) => r.owner_id));

    // Get all customer records (one user can have multiple)
    const { data: customers } = await supabase
      .from('customers')
      .select('auth_user_id, name, preferences, restaurant_id, total_points');

    // Group customer records by auth_user_id
    const customersByUser = new Map<string, any[]>();
    for (const c of customers ?? []) {
      const arr = customersByUser.get(c.auth_user_id) ?? [];
      arr.push(c);
      customersByUser.set(c.auth_user_id, arr);
    }

    // Build result: loyalty users only (no restaurant owners, no admin)
    const loyaltyUsers = users
      .filter(u => !ownerIds.has(u.id) && u.id !== caller.id)
      .map(u => {
        const records = customersByUser.get(u.id) ?? [];
        const prefs = (records[0]?.preferences as Record<string, unknown>) ?? {};
        return {
          id: u.id,
          email: u.email ?? null,
          name: u.user_metadata?.first_name
            ? `${u.user_metadata.first_name} ${u.user_metadata.last_name ?? ''}`.trim()
            : (records[0]?.name ?? null),
          provider: (u.app_metadata?.provider as string) ?? 'email',
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at ?? null,
          has_fidelity: records.length > 0,
          restaurant_count: records.length,
          total_points: records.reduce((s: number, r: any) => s + (r.total_points ?? 0), 0),
          telefono: (records[0]?.preferences as any)?.whatsapp ?? null,
          data_nascita: prefs.data_nascita as string ?? null,
          sesso: prefs.sesso as string ?? null,
        };
      });

    res.json({ users: loyaltyUsers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[admin-auth-users]', msg);
    res.status(500).json({ error: msg });
  }
}
