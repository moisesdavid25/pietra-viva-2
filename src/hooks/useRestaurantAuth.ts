import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../db';

interface UseRestaurantAuthReturn {
  isAuthenticated: boolean;
  restaurantId: string | null;
  restaurantSlug: string;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  subscriptionTier: string;
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

  useEffect(() => {
    db.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthenticated(true);
        db.from('restaurants')
          .select('id, slug, name, subscription_tier')
          .eq('user_id', data.user.id)
          .neq('slug', 'demo')
          .limit(1)
          .maybeSingle()
          .then(({ data: resData }) => {
            if (resData) {
              setRestaurantId(resData.id);
              setRestaurantSlug(resData.slug);
              setRestaurantName(resData.name);
              setSubscriptionTier(resData.subscription_tier || 'trial');
            } else {
              navigate('/onboarding');
            }
          });
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await db.auth.signOut();
    window.location.href = '/';
  };

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
      if (restaurantId) {
        // CASCADE FK in DB handles products, categories, orders, settings automatically
        await db.from('restaurants').delete().eq('id', restaurantId);
      }
      await db.auth.signOut();
      navigate('/');
    } catch (err: any) {
      onError('❌ Errore durante eliminazione: ' + err.message);
    }
  };

  return {
    isAuthenticated,
    restaurantId,
    restaurantSlug,
    restaurantName,
    setRestaurantName,
    subscriptionTier,
    handleLogout,
    handleDeleteAccount,
  };
}
