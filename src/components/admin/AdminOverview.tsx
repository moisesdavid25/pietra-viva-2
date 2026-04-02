import { useEffect, useState } from 'react';
import { TrendingUp, Store, Users, AlertTriangle, ChefHat, ArrowUpRight } from 'lucide-react';
import db from '../../db';

interface Stats {
  // Restaurantes (B2B owners)
  totalRestaurants: number;
  activeRestaurants: number;
  trialingRestaurants: number;
  pastDueRestaurants: number;
  newRestaurantsThisWeek: number;
  // End customers (clienti dei ristoranti)
  totalEndCustomers: number;
  newEndCustomersThisWeek: number;
}

function KPICard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  color,
  badge,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
  badge?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
          {badge && (
            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {badge}
            </span>
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-black text-[#1A1A1A] mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 font-medium">{sub}</p>}
      {trend !== undefined && trend > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
          <ArrowUpRight size={12} />+{trend} questa settimana
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3 flex items-center gap-2">
      <span className="flex-1 h-px bg-gray-100" />
      {children}
      <span className="flex-1 h-px bg-gray-100" />
    </p>
  );
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekIso = oneWeekAgo.toISOString();

        const [allRes, newRes, allCust, newCust] = await Promise.all([
          db.from('restaurants').select('id, subscription_tier').neq('slug', 'demo'),
          db.from('restaurants').select('id').neq('slug', 'demo').gte('created_at', weekIso),
          db.from('customers').select('id', { count: 'exact', head: true }),
          db.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', weekIso),
        ]);

        const restaurants = allRes.data ?? [];
        const paid = ['base', 'pro', 'enterprise'];
        setStats({
          totalRestaurants: restaurants.length,
          activeRestaurants: restaurants.filter(r => paid.includes(r.subscription_tier ?? '')).length,
          trialingRestaurants: restaurants.filter(r => !r.subscription_tier || r.subscription_tier === 'trial').length,
          pastDueRestaurants: 0, // richiede colonna subscription_status (Stripe)
          newRestaurantsThisWeek: newRes.data?.length ?? 0,
          totalEndCustomers: allCust.count ?? 0,
          newEndCustomersThisWeek: newCust.count ?? 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panoramica della piattaforma Leomenu</p>
      </div>

      {/* GROUP 1: Ristoratori (B2B) */}
      <SectionLabel>Ristoratori — clienti B2B di Leomenu</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ristoranti totali"
          value={stats?.totalRestaurants ?? 0}
          sub="Escluso account demo"
          trend={stats?.newRestaurantsThisWeek}
          icon={Store}
          color="bg-[#008081]"
          badge="B2B"
        />
        <KPICard
          label="Abbonamenti attivi"
          value={stats?.activeRestaurants ?? 0}
          sub={`${stats?.trialingRestaurants ?? 0} in prova trial`}
          icon={ChefHat}
          color="bg-violet-500"
          badge="Piano pagato"
        />
        <KPICard
          label="MRR mensile"
          value="—"
          sub="Attiva Stripe per monitorare"
          icon={TrendingUp}
          color="bg-emerald-500"
          badge="Stripe pendente"
        />
        <KPICard
          label="Pagamenti scaduti"
          value={stats?.pastDueRestaurants ?? 0}
          sub={stats?.pastDueRestaurants ? 'Richiedono attenzione' : 'Tutto in regola'}
          icon={AlertTriangle}
          color={stats?.pastDueRestaurants ? 'bg-red-500' : 'bg-gray-300'}
        />
      </div>

      {/* Subscription breakdown */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Stato abbonamenti ristoratori</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Attivi', value: stats?.activeRestaurants ?? 0, cls: 'bg-emerald-100 text-emerald-700' },
            { label: 'In prova', value: stats?.trialingRestaurants ?? 0, cls: 'bg-amber-100 text-amber-700' },
            { label: 'Scaduti', value: stats?.pastDueRestaurants ?? 0, cls: 'bg-red-100 text-red-700' },
            {
              label: 'Cancellati',
              value: Math.max(0,
                (stats?.totalRestaurants ?? 0)
                - (stats?.activeRestaurants ?? 0)
                - (stats?.trialingRestaurants ?? 0)
                - (stats?.pastDueRestaurants ?? 0)
              ),
              cls: 'bg-gray-100 text-gray-600',
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 ${item.cls}`}>
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-xs font-bold mt-0.5 opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GROUP 2: End Customers */}
      <SectionLabel>Clienti Finali — utenti dei ristoranti</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Clienti totali"
          value={stats?.totalEndCustomers ?? 0}
          sub="Registrati su tutti i ristoranti"
          trend={stats?.newEndCustomersThisWeek}
          icon={Users}
          color="bg-blue-500"
          badge="End users"
        />
        <KPICard
          label="Nuovi questa settimana"
          value={stats?.newEndCustomersThisWeek ?? 0}
          sub="Nuove registrazioni clienti (7gg)"
          icon={Users}
          color="bg-indigo-500"
        />
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-6 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Media clienti/ristorante</p>
          <p className="text-3xl font-black text-[#1A1A1A] mt-2">
            {stats?.totalRestaurants
              ? Math.round((stats.totalEndCustomers ?? 0) / stats.totalRestaurants)
              : 0}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-1">Media clienti per ristorante</p>
        </div>
      </div>

      {/* Stripe CTA */}
      <div className="bg-gradient-to-br from-[#008081]/5 to-white border border-[#008081]/20 rounded-3xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#008081] mb-2">Prossimo step — Integrazione Stripe</p>
        <p className="text-sm text-gray-600 font-medium">
          Integra Stripe per monitorare MRR, renewals e failed payments in tempo reale. Sblocca la sezione "MRR & Revenue".
        </p>
      </div>
    </div>
  );
}
