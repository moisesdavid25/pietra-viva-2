import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).end('Method not allowed');

  const userId = await getAuthenticatedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    // Restaurant data is deleted by CASCADE FK on restaurants.user_id → auth.users.id
    // We call deleteUser which removes the auth.users record, triggering the cascade.
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[delete-account]', msg);
    res.status(500).json({ error: msg });
  }
}
