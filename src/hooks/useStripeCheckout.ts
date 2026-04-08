import { useState } from 'react';
import db from '../db';

const PRICE_IDS = {
  mensile:    'price_1TJu471OtlBFS4a5EWfn6XOi',
  semestrale: 'price_1TJu701OtlBFS4a50PJvWBGI',
  annuale:    'price_1TJu7u1OtlBFS4a5zRuVahso',
} as const;

export type PlanKey = keyof typeof PRICE_IDS;

export function useStripeCheckout() {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (plan: PlanKey, restaurantId: string) => {
    setLoading(plan);
    setError(null);

    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICE_IDS[plan],
          restaurantId,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore checkout');

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return { startCheckout, loading, error };
}
