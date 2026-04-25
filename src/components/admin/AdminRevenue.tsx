import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, ArrowUpRight, Calendar, CreditCard, Users, BarChart3 } from 'lucide-react';
import db from '../../db';

// Monthly revenue per plan (billing / months in cycle)
const PLAN_MRR: Record<string, number> = {
  mensile:    29,    // €29/mese
  semestrale: 22,    // €132 / 6 mesi
  annuale:    17,    // €204 / 12 mesi
};

const PLAN_LABELS: Record<string, string> = {
  mensile:    'Mensile',
  semestrale: 'Semestrale',
  annuale:    'Annuale',
};

const PLAN_COLORS: Record<string, string> = {
  mensile:    'bg-blue-500',
  semestrale: 'bg-violet-500',
  annuale:    'bg-emerald-500',
};

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  created_at: string;
}

function formatEur(n: number) {
  return `€${n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function KPICard({ label, value, sub, icon: Icon, color, badge }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; badge?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
          {badge && <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{badge}</span>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-black text-[#1A1A1A] mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 font-medium">{sub}</p>}
    </div>
  );
}

export function AdminRevenue() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.from('restaurants')
      .select('id, name, slug, subscription_tier, subscription_status, subscription_ends_at, created_at')
      .neq('slug', 'demo')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRestaurants((data as Restaurant[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
      </div>
    );
  }

  const paid = restaurants.filter(r => r.subscription_tier && r.subscription_tier !== 'trial');
  const active = paid.filter(r => r.subscription_status === 'active' || r.subscription_status === 'trialing' || !r.subscription_status);
  const pastDue = paid.filter(r => r.subscription_status === 'past_due');

  // MRR = sum of monthly equivalents for active paid plans
  const mrr = active.reduce((sum, r) => sum + (PLAN_MRR[r.subscription_tier!] ?? 0), 0);
  const arr = mrr * 12;
  const arpu = active.length > 0 ? Math.round(mrr / active.length) : 0;

  // Plan breakdown
  const planCounts: Record<string, number> = {};
  const planRevenue: Record<string, number> = {};
  active.forEach(r => {
    const tier = r.subscription_tier!;
    planCounts[tier] = (planCounts[tier] ?? 0) + 1;
    planRevenue[tier] = (planRevenue[tier] ?? 0) + (PLAN_MRR[tier] ?? 0);
  });

  // Renewals in next 30 days
  const now = Date.now();
  const in30 = now + 30 * 86_400_000;
  const renewalsSoon = paid
    .filter(r => r.subscription_ends_at)
    .filter(r => {
      const t = new Date(r.subscription_ends_at!).getTime();
      return t >= now && t <= in30;
    })
    .sort((a, b) => new Date(a.subscription_ends_at!).getTime() - new Date(b.subscription_ends_at!).getTime());

  // Recent upgrades (last 10 paid, ordered by created_at desc)
  const recentUpgrades = paid.slice(0, 8);

  const maxPlanRevenue = Math.max(...Object.values(planRevenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">MRR & Revenue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitoraggio del fatturato ricorrente mensile</p>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="MRR"
          value={formatEur(mrr)}
          sub="Fatturato mensile ricorrente"
          icon={TrendingUp}
          color="bg-emerald-500"
          badge="Monthly Recurring"
        />
        <KPICard
          label="ARR"
          value={formatEur(arr)}
          sub="Proiezione annuale"
          icon={BarChart3}
          color="bg-[#008081]"
          badge="Annual Run Rate"
        />
        <KPICard
          label="Abbonati attivi"
          value={active.length}
          sub={pastDue.length > 0 ? `${pastDue.length} pagamenti scaduti` : 'Tutti in regola'}
          icon={Users}
          color={pastDue.length > 0 ? 'bg-red-500' : 'bg-violet-500'}
        />
        <KPICard
          label="ARPU"
          value={formatEur(arpu)}
          sub="Revenue media per abbonato"
          icon={CreditCard}
          color="bg-blue-500"
          badge="Per user"
        />
      </div>

      {/* ── Past Due Alert ────────────────────────────────────────────────────── */}
      {pastDue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-700">
              {pastDue.length} {pastDue.length === 1 ? 'pagamento scaduto' : 'pagamenti scaduti'}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {pastDue.map(r => r.name).join(', ')} — verifica su Stripe Dashboard
            </p>
          </div>
        </div>
      )}

      {/* ── Plan Breakdown ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">Distribuzione piani</p>
        {Object.keys(PLAN_MRR).length > 0 && active.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nessun abbonamento attivo</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(PLAN_MRR).map(([tier, monthlyPrice]) => {
              const count = planCounts[tier] ?? 0;
              const rev   = planRevenue[tier] ?? 0;
              const pct   = Math.round((rev / maxPlanRevenue) * 100);
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${PLAN_COLORS[tier]}`} />
                      <span className="text-sm font-bold text-gray-700">{PLAN_LABELS[tier]}</span>
                      <span className="text-xs text-gray-400">{count} {count === 1 ? 'abbonato' : 'abbonati'} · €{monthlyPrice}/mese</span>
                    </div>
                    <span className="text-sm font-black text-gray-800">{formatEur(rev)}<span className="text-xs font-normal text-gray-400">/mese</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${PLAN_COLORS[tier]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Upcoming Renewals ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={14} className="text-[#008081]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Rinnovi prossimi 30 giorni ({renewalsSoon.length})
            </p>
          </div>
          {renewalsSoon.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
              <Calendar size={28} className="opacity-30" />
              <p className="text-xs font-medium">Nessun rinnovo imminente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {renewalsSoon.map(r => {
                const days = daysUntil(r.subscription_ends_at!);
                const urgent = days <= 7;
                return (
                  <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${urgent ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{r.name}</p>
                      <p className="text-[11px] text-gray-400">{PLAN_LABELS[r.subscription_tier!] ?? r.subscription_tier} · {formatDate(r.subscription_ends_at!)}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
                      {days}gg
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Upgrades ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={14} className="text-[#008081]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Abbonati ({paid.length})
            </p>
          </div>
          {paid.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
              <Users size={28} className="opacity-30" />
              <p className="text-xs font-medium">Nessun abbonamento attivo</p>
              <p className="text-[10px] text-center">I ristoranti che sottoscrivono un piano appariranno qui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentUpgrades.map(r => {
                const tier = r.subscription_tier!;
                const statusColors: Record<string, string> = {
                  active:    'bg-emerald-100 text-emerald-700',
                  trialing:  'bg-blue-100 text-blue-700',
                  past_due:  'bg-red-100 text-red-700',
                  canceled:  'bg-gray-100 text-gray-500',
                };
                const statusLabels: Record<string, string> = {
                  active:   'Attivo',
                  trialing: 'Trial',
                  past_due: 'Scaduto',
                  canceled: 'Cancellato',
                };
                const statusKey = r.subscription_status ?? 'active';
                return (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                      <p className="text-[11px] text-gray-400">{PLAN_LABELS[tier] ?? tier} · {formatEur(PLAN_MRR[tier] ?? 0)}/mese</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-lg ml-2 ${statusColors[statusKey] ?? 'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[statusKey] ?? statusKey}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue Forecast ──────────────────────────────────────────────────── */}
      {active.length > 0 && (
        <div className="bg-gradient-to-br from-[#008081]/5 to-white border border-[#008081]/20 rounded-3xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#008081] mb-4">Proiezione revenue</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Questo mese',    value: mrr },
              { label: 'Prossimi 3 mesi', value: mrr * 3 },
              { label: 'Prossimi 6 mesi', value: mrr * 6 },
              { label: 'Prossimi 12 mesi', value: arr },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-xl font-black text-[#008081]">{formatEur(item.value)}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            * Proiezione basata sul MRR attuale senza considerare churn o nuovi abbonamenti
          </p>
        </div>
      )}
    </div>
  );
}
