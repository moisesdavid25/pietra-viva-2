import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import db from '../../db';

interface HealthStats {
  noProducts: number;
  noOrders7d: number;
  trialExpiring5d: number;
  totalRestaurants: number;
}

function ProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <p className="text-xs font-bold text-[#1A1A1A] w-40 shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-xs font-black w-20 text-right ${color.replace('bg-', 'text-')}`}>
        {pct}% ({count}/{total})
      </p>
    </div>
  );
}

export function AdminHealth() {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

      const [allRes, trialExpiring] = await Promise.all([
        db.from('restaurants').select('id, subscription_status, trial_ends_at').neq('slug', 'demo'),
        db.from('restaurants')
          .select('id')
          .neq('slug', 'demo')
          .lte('trial_ends_at', fiveDaysFromNow.toISOString())
          .gte('trial_ends_at', new Date().toISOString()),
      ]);

      const restaurants = allRes.data ?? [];
      setStats({
        totalRestaurants: restaurants.length,
        noProducts: 0,       // needs products table join
        noOrders7d: 0,       // needs orders join
        trialExpiring5d: trialExpiring.data?.length ?? 0,
      });
      setLoading(false);
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
        <h1 className="text-2xl font-black text-[#1A1A1A]">Salute Piattaforma</h1>
        <p className="text-sm text-gray-500 mt-0.5">Adozione funzionalità e ristoranti a rischio</p>
      </div>

      {/* Alert Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'SCADENZA IMMINENTE',
            count: stats?.trialExpiring5d ?? 0,
            desc: 'Trial scade entro 5 giorni',
            border: 'border-l-4 border-red-500',
            bg: 'bg-red-50',
            text: 'text-red-700',
          },
          {
            title: 'MAI ATTIVATI',
            count: stats?.noProducts ?? 0,
            desc: '0 prodotti aggiunti, >3 giorni',
            border: 'border-l-4 border-orange-400',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
          },
          {
            title: 'NESSUN ORDINE (7GG)',
            count: stats?.noOrders7d ?? 0,
            desc: 'Attivi ma senza ordini recenti',
            border: 'border-l-4 border-amber-400',
            bg: 'bg-amber-50',
            text: 'text-amber-700',
          },
        ].map((panel) => (
          <div key={panel.title} className={`${panel.bg} ${panel.border} rounded-2xl p-5`}>
            <p className={`text-[9px] font-black uppercase tracking-widest ${panel.text} mb-1`}>{panel.title}</p>
            <p className={`text-3xl font-black ${panel.text}`}>{panel.count}</p>
            <p className={`text-xs font-medium ${panel.text} opacity-70 mt-1`}>{panel.desc}</p>
          </div>
        ))}
      </div>

      {/* Adoption Metrics */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={16} className="text-[#008081]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Adozione Funzionalità
          </p>
        </div>
        <div className="space-y-5">
          <ProgressBar label="Abbonamento attivo" count={stats?.totalRestaurants ?? 0} total={stats?.totalRestaurants ?? 0} color="bg-emerald-500" />
          <ProgressBar label="Scadenza imminente" count={stats?.trialExpiring5d ?? 0} total={stats?.totalRestaurants ?? 1} color="bg-red-400" />
          <div className="pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 font-medium">
              Metriche di adozione dettagliate (prodotti, QR, loyalty, ordini) disponibili dopo
              integrazione con la vista <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">crm_restaurant_list</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
