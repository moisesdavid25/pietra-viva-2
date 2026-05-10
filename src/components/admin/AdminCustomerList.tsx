import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Star, Store, UserX, Shield, Globe } from 'lucide-react';
import db from '../../db';

interface Customer {
  id: string;
  name: string;
  whatsapp: string | null;
  total_points: number;
  created_at: string;
  restaurant_id: string;
  preferences: Record<string, unknown> | null;
  restaurant: { id: string; name: string; slug: string } | null;
}

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  provider: string;
  created_at: string;
  last_sign_in: string | null;
  has_fidelity: boolean;
  restaurant_count: number;
  total_points: number;
  data_nascita: string | null;
  sesso: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateShort(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

async function getSessionToken(): Promise<string | null> {
  const { data } = await db.auth.getSession();
  return data.session?.access_token ?? null;
}

export function AdminCustomerList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fidelity' | 'tutti'>('fidelity');

  // ── Fidelity customers (from customers table)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [search, setSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');

  // ── All auth users (from API)
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authSearch, setAuthSearch] = useState('');
  const [authLoaded, setAuthLoaded] = useState(false);

  // Load fidelity customers
  useEffect(() => {
    db.from('customers')
      .select(`id, name, whatsapp, total_points, created_at, restaurant_id, preferences,
               restaurant:restaurants(id, name, slug)`)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('AdminCustomerList:', error.message);
        setCustomers((data as unknown as Customer[]) ?? []);
        setLoadingCustomers(false);
      });
  }, []);

  // Load all auth users when tab is opened
  useEffect(() => {
    if (activeTab !== 'tutti' || authLoaded) return;
    setLoadingAuth(true);
    getSessionToken().then(async token => {
      if (!token) { setLoadingAuth(false); return; }
      const base = import.meta.env.VITE_API_BASE_URL ?? '';
      const res = await fetch(`${base}/api/admin-auth-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAuthUsers(json.users ?? []);
        setAuthLoaded(true);
      } else {
        console.error('admin-auth-users:', await res.text());
      }
      setLoadingAuth(false);
    });
  }, [activeTab, authLoaded]);

  // Unique restaurants for filter
  const restaurants = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => {
      if (c.restaurant) map.set(c.restaurant.id, c.restaurant.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const email = (c.preferences as any)?.email ?? '';
      const matchSearch =
        !search ||
        (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.whatsapp ?? '').includes(search) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        (c.restaurant?.name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchRestaurant =
        restaurantFilter === 'all' || c.restaurant?.id === restaurantFilter;
      return matchSearch && matchRestaurant;
    });
  }, [customers, search, restaurantFilter]);

  const filteredAuth = useMemo(() => {
    if (!authSearch) return authUsers;
    const q = authSearch.toLowerCase();
    return authUsers.filter(u =>
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q)
    );
  }, [authUsers, authSearch]);

  // KPIs
  const totalPoints = customers.reduce((s, c) => s + (c.total_points || 0), 0);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const newThisWeek = customers.filter((c) => c.created_at >= oneWeekAgo).length;
  const topRestaurant = restaurants
    .map((r) => ({ ...r, count: customers.filter((c) => c.restaurant?.id === r.id).length }))
    .sort((a, b) => b.count - a.count)[0];

  const withoutFidelity = authUsers.filter(u => !u.has_fidelity).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Clienti</h1>
        <p className="text-sm text-gray-500 mt-0.5">Utenti del programma fedeltà e registrati all'app</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clienti Fidelity', value: customers.length, icon: Users, color: 'bg-blue-500', sub: 'su tutti i ristoranti' },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('fidelity')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'fidelity' ? 'bg-white text-[#008081] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Clienti Fidelity <span className="ml-1 text-[11px] font-black">{customers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('tutti')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tutti' ? 'bg-white text-[#008081] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tutti gli utenti
          {authLoaded && withoutFidelity > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">{withoutFidelity} senza fidelity</span>
          )}
        </button>
      </div>

      {/* ── TAB: FIDELITY CUSTOMERS ── */}
      {activeTab === 'fidelity' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, email, telefono o ristorante..."
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

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingCustomers ? (
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
                      {['Cliente', 'Email', 'Contatto', 'Ristorante', 'Punti', 'Registrato'].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const email = (c.preferences as any)?.email ?? null;
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#008081]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-black text-[#008081]">{initials(c.name || '?')}</span>
                              </div>
                              <p className="text-sm font-bold text-[#1A1A1A]">{c.name || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium max-w-[180px] truncate">
                            {email ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                            {c.whatsapp || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {c.restaurant ? (
                              <button
                                onClick={() => navigate(`/leomenu-admin/restaurants/${c.restaurant!.id}`)}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#008081] hover:underline"
                              >
                                <Store size={11} />
                                {c.restaurant.name}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-sm font-black text-amber-600">
                              <Star size={11} className="text-amber-400" fill="currentColor" />
                              {(c.total_points || 0).toLocaleString('it-IT')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(c.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: TUTTI GLI UTENTI ── */}
      {activeTab === 'tutti' && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 leading-relaxed flex gap-3">
            <span className="text-lg flex-shrink-0">ℹ️</span>
            <div>
              <strong>Utenti senza fidelity</strong> — Questi utenti si sono registrati nell'app ma non hanno ancora aderito al programma fedeltà di nessun ristorante. Esistono in Supabase Auth ma non hanno attività fidelity.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={authSearch}
                onChange={(e) => setAuthSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008081]/30 focus:border-[#008081]"
              />
            </div>
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{filteredAuth.length} utenti</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingAuth ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
              </div>
            ) : filteredAuth.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <UserX size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-bold">Nessun utente trovato</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Utente', 'Email', 'Accesso', 'Fidelity', 'Punti', 'Registrato', 'Ultimo accesso'].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuth.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-black text-gray-500">
                                {initials(u.name || u.email || '?')}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-[#1A1A1A]">{u.name || <span className="text-gray-400 font-normal">—</span>}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium max-w-[200px] truncate">
                          {u.email ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            {u.provider === 'google' ? (
                              <><Globe size={11} className="text-blue-400" /> Google</>
                            ) : (
                              <><Shield size={11} className="text-gray-400" /> Email</>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.has_fidelity ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                              ✓ {u.restaurant_count} ristoranti
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-500">
                              Nessuna
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.total_points > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm font-black text-amber-600">
                              <Star size={11} className="text-amber-400" fill="currentColor" />
                              {u.total_points.toLocaleString('it-IT')}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateShort(u.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateShort(u.last_sign_in)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
