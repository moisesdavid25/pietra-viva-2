import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Star, Store, UserX } from 'lucide-react';
import db from '../../db';

interface Customer {
  id: string;
  name: string;
  whatsapp: string | null;
  total_points: number;
  created_at: string;
  restaurant_id: string;
  restaurant: { id: string; name: string; slug: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AdminCustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');

  useEffect(() => {
    db.from('customers')
      .select(`
        id, name, whatsapp, total_points, created_at, restaurant_id,
        restaurant:restaurants(id, name, slug)
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('AdminCustomerList:', error.message);
        setCustomers((data as Customer[]) ?? []);
        setLoading(false);
      });
  }, []);

  // Unique restaurants for filter dropdown
  const restaurants = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => {
      if (c.restaurant) map.set(c.restaurant.id, c.restaurant.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.whatsapp ?? '').includes(search) ||
        (c.restaurant?.name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchRestaurant =
        restaurantFilter === 'all' || c.restaurant?.id === restaurantFilter;
      return matchSearch && matchRestaurant;
    });
  }, [customers, search, restaurantFilter]);

  // KPIs
  const totalPoints = customers.reduce((s, c) => s + (c.total_points || 0), 0);
  const oneWeekAgo  = new Date(Date.now() - 7 * 86400_000).toISOString();
  const newThisWeek = customers.filter((c) => c.created_at >= oneWeekAgo).length;
  const topRestaurant = restaurants
    .map((r) => ({
      ...r,
      count: customers.filter((c) => c.restaurant?.id === r.id).length,
    }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Clienti</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Utenti iscritti alla loyalty card dei ristoranti
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clienti Totali', value: customers.length, icon: Users, color: 'bg-blue-500', sub: 'su tutti i ristoranti' },
          { label: 'Nuovi questa settimana', value: newThisWeek, icon: Users, color: 'bg-emerald-500', sub: 'ultimi 7 giorni' },
          { label: 'Punti Totali Emessi', value: totalPoints.toLocaleString('it-IT'), icon: Star, color: 'bg-amber-500', sub: 'somma loyalty points' },
          {
            label: 'Top Ristorante',
            value: topRestaurant?.name ?? '—',
            icon: Store,
            color: 'bg-[#008081]',
            sub: topRestaurant ? `${topRestaurant.count} clienti` : 'nessun dato',
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={14} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A1A1A] truncate">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, telefono o ristorante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008081]/30 focus:border-[#008081]"
          />
        </div>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008081]/30 text-gray-600"
        >
          <option value="all">Tutti i ristoranti</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <span className="text-[11px] text-gray-400 font-medium">{filtered.length} risultati</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <UserX size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Nessun cliente trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Cliente', 'Contatto', 'Ristorante', 'Punti', 'Registrato'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#008081]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-black text-[#008081]">
                            {initials(c.name || '?')}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{c.name || '—'}</p>
                      </div>
                    </td>

                    {/* Contatto */}
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                      {c.whatsapp || '—'}
                    </td>

                    {/* Ristorante */}
                    <td className="px-4 py-3">
                      {c.restaurant ? (
                        <button
                          onClick={() => navigate(`/leomenu-admin/restaurants/${c.restaurant!.id}`)}
                          className="group flex items-center gap-1.5 text-xs font-bold text-[#008081] hover:underline"
                        >
                          <Store size={11} />
                          {c.restaurant.name}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Punti */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm font-black text-amber-600">
                        <Star size={11} className="text-amber-400" fill="currentColor" />
                        {(c.total_points || 0).toLocaleString('it-IT')}
                      </span>
                    </td>

                    {/* Registrato */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 leading-relaxed">
        <strong>Nota:</strong> Questa lista mostra i clienti iscritti alla <strong>loyalty card</strong> dei ristoranti.
        Gli utenti registrati come <em>customer</em> senza aver scansionato un QR non appaiono qui — esistono
        in Supabase Auth ma non hanno attività sui ristoranti.
      </div>
    </div>
  );
}
