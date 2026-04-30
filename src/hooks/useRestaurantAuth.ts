import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../db';
import { unregisterSession, logAuthEvent } from '../lib/sessionSecurity';

interface UseRestaurantAuthReturn {
  isAuthenticated: boolean;
  restaurantId: string | null;
  restaurantSlug: string;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: (onError: (msg: string) => void) => Promise<void>;
}

export function useRestaurantAuth(): UseRestaurantAuthReturn {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('trial');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    db.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) { navigate('/login'); return; }

      // Fix #9 — Require confirmed email before granting dashboard access
      // (Supabase can be configured to require confirmation; this is a client-side extra guard)
      if (user.email_confirmed_at === null && user.app_metadata?.provider === 'email') {
        db.auth.signOut();
        navigate('/login?motivo=email-non-confermata');
        return;
      }

      setIsAuthenticated(true);
      db.from('restaurants')
        .select('id, slug, name, subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .neq('slug', 'demo')
        .limit(1)
        .maybeSingle()
        .then(({ data: resData }) => {
          if (resData) {
            setRestaurantId(resData.id);
            setRestaurantSlug(resData.slug);
            setRestaurantName(resData.name);
            setSubscriptionTier(resData.subscription_tier || 'trial');
            setSubscriptionStatus(resData.subscription_status ?? null);
          } else {
            navigate('/onboarding');
          }
        });
    });
  }, [navigate]);

  // Fix #3 + #7 — Logout: clean up session record + audit log
  const handleLogout = async () => {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        await unregisterSession(user.id);
        await logAuthEvent(user.id, 'logout');
      }
    } catch { /* non-fatal */ }
    await db.auth.signOut();
    window.location.href = '/';
  };

  // Fix #5 + #7 — Delete account: call server-side API to delete the auth user
  const handleDeleteAccount = async (onError: (msg: string) => void) => {
    const firstConfirm = window.confirm(
      'Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.'
    );
    if (!firstConfirm) return;
    const secondConfirm = window.confirm(
      'CONFERMA FINALE: Tutti i dati (prodotti, categorie, ordini) verranno eliminati permanentemente. Procedere?'
    );
    if (!secondConfirm) return;

    try {
      const { data: { session } } = await db.auth.getSession();
      if (!session?.user) throw new Error('Sessione non valida');

      const userId = session.user.id;

      // Audit log before deletion
      await logAuthEvent(userId, 'account_deleted', { restaurant_id: restaurantId });

      // Call server-side endpoint that uses service_role to delete the auth user
      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(err.error || 'Errore durante l\'eliminazione');
      }

      await db.auth.signOut();
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      onError('❌ ' + msg);
    }
  };

  return {
    isAuthenticated,
    restaurantId,
    restaurantSlug,
    restaurantName,
    setRestaurantName,
    subscriptionTier,
    subscriptionStatus,
    handleLogout,
    handleDeleteAccount,
  };
}
