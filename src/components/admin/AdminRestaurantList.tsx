import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Store } from 'lucide-react';
import db from '../../db';

type SubscriptionTier = 'trial' | 'base' | 'pro' | 'enterprise' | null;

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_tier: SubscriptionTier;
}

const TIER_LABELS: Record<string, { label: string; cls: string }> = {
  trial:      { label: 'Trial',    cls: 'bg-amber-100 text-amber-700' },
  base:       { label: 'Base',     cls: 'bg-blue-100 text-blue-700' },
  pro:        { label: 'Pro',      cls: 'bg-violet-100 text-violet-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-emerald-100 text-emerald-700' },
  unknown:    { label: 'Trial',    cls: 'bg-amber-100 text-amber-700' },
};

function tierKey(tier: SubscriptionTier): string {
  return tier ?? 'unknown';
}

function TierPill({ tier }: { tier: SubscriptionTier }) {
  const { label, cls } = TIER_LABELS[tierKey(tier)];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminRestaurantList() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    db.from('restaurants')
      .select('id, name, slug, created_at, subscription_tier')
      .neq('slug', 'demo')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('AdminRestaurantList:', error.message);
        setRestaurants((data as Restaurant[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.slug.toLowerCase().includes(search.toLowerCase());
      const matchTier =
        statusFilter === 'all' || tierKey(r.subscription_tier) === statusFilter;
      return matchSearch && matchTier;
    });
  }, [restaurants, search, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Ristoranti</h1>
          <p className="text-sm text-gray-500 mt-0.5">{restaurants.length} totali sulla piattaforma</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008081]/30 focus:border-[#008081]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'trial', 'base', 'pro'].map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                statusFilter === t
                  ? 'bg-[#008081] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Tutti' : TIER_LABELS[t]?.label ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Store size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Nessun ristorante trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Piano', 'Nome & Slug', 'Abbonamento', 'Clienti', 'Registrato', ''].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/leomenu-admin/restaurants/${r.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <TierPill tier={r.subscription_tier} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#1A1A1A]">{r.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">/{r.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${TIER_LABELS[tierKey(r.subscription_tier)].cls}`}>
                        {TIER_LABELS[tierKey(r.subscription_tier)].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-medium">
                      —
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
