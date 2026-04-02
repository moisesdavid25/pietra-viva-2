import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Users, ShoppingBag, Calendar } from 'lucide-react';
import db from '../../db';

interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_tier: string | null;
  user_id: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function AdminRestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      db.from('restaurants').select('id, name, slug, created_at, subscription_tier, user_id').eq('id', id).single(),
      db.from('customers').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
      db.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
    ]).then(([res, cust, ord]) => {
      if (res.data) setRestaurant(res.data as RestaurantDetail);
      setCustomerCount(cust.count ?? 0);
      setOrderCount(ord.count ?? 0);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Store size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-bold">Ristorante non trovato</p>
      </div>
    );
  }

  const tierKey = restaurant.subscription_tier ?? 'trial';
  const tierMap: Record<string, { label: string; cls: string }> = {
    trial:      { label: 'Trial',      cls: 'bg-amber-100 text-amber-700' },
    base:       { label: 'Base',       cls: 'bg-blue-100 text-blue-700' },
    pro:        { label: 'Pro',        cls: 'bg-violet-100 text-violet-700' },
    enterprise: { label: 'Enterprise', cls: 'bg-emerald-100 text-emerald-700' },
  };
  const { label: statusLabel, cls: statusCls } = tierMap[tierKey] ?? tierMap['trial'];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#008081] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Ristoranti
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Store size={22} className="text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{restaurant.name}</h1>
            <p className="text-xs text-gray-400 font-medium">/{restaurant.slug}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clienti', value: customerCount, icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Ordini Totali', value: orderCount, icon: ShoppingBag, color: 'text-[#008081] bg-teal-50' },
          { label: 'Piano', value: statusLabel, icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Registrato', value: formatDate(restaurant.created_at), icon: Calendar, color: 'text-gray-600 bg-gray-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
              <item.icon size={16} className={item.color.split(' ')[0]} />
            </div>
            <p className="text-xl font-black text-[#1A1A1A]">{item.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Trial info */}
      {tierKey === 'trial' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Account in prova (Trial)</p>
          <p className="text-sm text-amber-700 font-medium">
            Nessun piano attivo — attiva Stripe per monitorare la scadenza.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Azioni</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/${restaurant.slug}/gestione`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-colors"
          >
            Apri pannello ristorante ↗
          </a>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Estendi trial +7 giorni
          </button>
          <button className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
            Sospendi account
          </button>
        </div>
      </div>
    </div>
  );
}
