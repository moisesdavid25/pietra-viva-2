import React, { useState } from 'react';
import { Users, Award, Gift, ScanLine, TrendingUp, AlertTriangle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  auth_user_id: string;
  total_points: number;
  created_at: string;
  // Populated by DB trigger on loyalty_transactions INSERT (see migration fase4_crm.sql).
  // Never use created_at for churn detection — a customer registered 60 days ago
  // but who visited yesterday is NOT at risk.
  last_visited_at?: string | null;
}

interface Reward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  image_url: string;
}

interface Props {
  customers: Customer[];
  rewards: Reward[];
  loading: boolean;
  onScannerOpen: () => void;
}

type Segment = 'all' | 'vip' | 'active' | 'at_risk';

const MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
const AT_RISK_DAYS = 30;

function getLevel(points: number) {
  if (points >= 2500) return { label: 'Reserve', emoji: '💎', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', multiplier: '1.7×' };
  if (points >= 500) return { label: 'Gold', emoji: '⭐', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', multiplier: '1.2×' };
  return { label: 'Green', emoji: '🌿', color: 'bg-[#008081]/10 text-[#008081] dark:bg-[#008081]/20', multiplier: '1.0×' };
}

function isAtRisk(customer: Customer): boolean {
  const activityDate = customer.last_visited_at ?? customer.created_at;
  const daysSince = (Date.now() - new Date(activityDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > AT_RISK_DAYS && customer.total_points < 50;
}

function getWhatsAppLink(whatsapp: string, name: string, points: number, rewards: Reward[], atRisk: boolean) {
  const clean = whatsapp.replace(/\D/g, '');
  const level = getLevel(points);
  const unlocked = rewards.filter(r => points >= r.points_required).sort((a, b) => b.points_required - a.points_required);
  let msg: string;
  if (atRisk) {
    msg = `Ciao ${name}! 😊 Ci manchi! Torna a trovarci e ricevi un omaggio speciale. Ti aspettiamo!`;
  } else if (unlocked.length > 0) {
    msg = `Ciao ${name}, come nostro Cliente ${level.label} ${level.emoji}! Hai sbloccato "${unlocked[0].name}"! Ti aspettiamo!`;
  } else {
    msg = `Ciao ${name}, come nostro Cliente ${level.label} ${level.emoji}! Hai ${points} stelle fedeltà. Vieni a trovarci!`;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SEGMENTS = [
  { id: 'all' as Segment, label: 'Tutti' },
  { id: 'vip' as Segment, label: '💎 Reserve' },
  { id: 'active' as Segment, label: '⭐ Gold' },
  { id: 'at_risk' as Segment, label: '⚠️ A Rischio' },
];

export default function ClientClassification({ customers, rewards, loading, onScannerOpen }: Props) {
  const [segment, setSegment] = useState<Segment>('all');

  const greenRevenue = (customers.filter(c => c.total_points < 500).reduce((s, c) => s + c.total_points, 0) / 10).toFixed(0);
  const goldRevenue = (customers.filter(c => c.total_points >= 500 && c.total_points < 2500).reduce((s, c) => s + c.total_points, 0) / 10).toFixed(0);
  const reserveRevenue = (customers.filter(c => c.total_points >= 2500).reduce((s, c) => s + c.total_points, 0) / 10).toFixed(0);
  const totalRevenue = parseInt(greenRevenue) + parseInt(goldRevenue) + parseInt(reserveRevenue) || 1;
  const premiumPct = Math.round(((parseInt(goldRevenue) + parseInt(reserveRevenue)) / totalRevenue) * 100);

  const atRiskCount = customers.filter(isAtRisk).length;

  const filteredCustomers = customers.filter(c => {
    if (segment === 'vip') return c.total_points >= 2500;
    if (segment === 'active') return c.total_points >= 500 && c.total_points < 2500;
    if (segment === 'at_risk') return isAtRisk(c);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#008081]" />
          <div>
            <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Clienti VIP</h3>
            <p className="text-xs text-gray-500">{customers.length} iscritti{atRiskCount > 0 && <span className="text-orange-500 font-bold ml-1">· {atRiskCount} a rischio</span>}</p>
          </div>
        </div>
        <button
          onClick={onScannerOpen}
          className="flex items-center gap-2 bg-[#008081] text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all"
        >
          <ScanLine className="w-4 h-4" /> Scanner QR
        </button>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Fatturato Stimato per Livello
        </h4>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-[#008081]/5 border border-[#008081]/20 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold text-[#008081] uppercase mb-1">Green 🌿</p>
            <p className="text-base font-black text-[#008081]">€{greenRevenue}</p>
          </div>
          <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">Gold ⭐</p>
            <p className="text-base font-black text-yellow-700 dark:text-yellow-400">€{goldRevenue}</p>
          </div>
          <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Reserve 💎</p>
            <p className="text-base font-black text-purple-700 dark:text-purple-400">€{reserveRevenue}</p>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${premiumPct}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">{premiumPct}% Gold + Reserve</p>
      </div>

      {/* Segment Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              segment === s.id
                ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-black border-transparent'
                : s.id === 'at_risk' && atRiskCount > 0
                  ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/10 dark:border-orange-800 dark:text-orange-400'
                  : 'bg-white dark:bg-[#262626] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {s.label}{s.id === 'at_risk' && atRiskCount > 0 ? ` (${atRiskCount})` : ''}
          </button>
        ))}
      </div>

      {/* At-Risk Alert Banner */}
      {segment === 'at_risk' && filteredCustomers.length > 0 && (
        <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
            Questi clienti non ti visitano da oltre {AT_RISK_DAYS} giorni. Invia un messaggio WhatsApp per riconquistarli!
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#008081]" />
          <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">Classifica</h4>
          <span className="text-xs text-gray-400 ml-auto">{filteredCustomers.length} clienti</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-6 h-6 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {segment === 'at_risk' ? 'Nessun cliente a rischio. Ottimo!' : 'Nessun cliente in questo segmento.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredCustomers.map((c, i) => {
              const level = getLevel(c.total_points);
              const atRisk = isAtRisk(c);
              const lifetimeSpend = (c.total_points / 10).toFixed(0);
              return (
                <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 && segment === 'all' ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''} ${atRisk ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>
                  <div className="w-7 text-center flex-shrink-0">
                    {i < 3 && segment === 'all' ? <span className="text-base">{MEDALS[i]}</span> : <span className="text-xs font-black text-gray-400">#{i + 1}</span>}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#008081]/10 flex items-center justify-center font-black text-[#008081] text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-sm text-[#1A1A1A] dark:text-white truncate flex items-center gap-1.5">
                      {c.name}
                      {atRisk
                        ? <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">A Rischio ⚠️</span>
                        : <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${level.color}`}>{level.label}</span>
                      }
                    </p>
                    <p className="text-[10px] text-gray-400">Spesa: <span className="font-bold text-gray-600 dark:text-gray-300">€{lifetimeSpend}</span></p>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ${level.color}`}>
                    {level.emoji} {c.total_points}
                  </span>
                  {c.whatsapp ? (
                    <a
                      href={getWhatsAppLink(c.whatsapp, c.name, c.total_points, rewards, atRisk)}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        atRisk
                          ? 'border border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white dark:bg-orange-900/20 dark:border-orange-800'
                          : 'border border-[#008081]/20 bg-[#008081]/5 text-[#008081] hover:bg-[#008081] hover:text-white'
                      }`}
                    >
                      <WaIcon />
                    </a>
                  ) : <div className="w-8 h-8 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


