import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, Clock, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Award, Flame, Activity, Lightbulb, GitBranch,
} from 'lucide-react';
import db from '../../db';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { restaurantId: string; }
type TimeRange = 'oggi' | 'settimana' | 'mese' | 'anno';

interface SparkPoint { v: number; }

// ── TrendIndicator ────────────────────────────────────────────────────────────

const TrendIndicator = ({ value }: { value: number }) => {
  const pos = value >= 0;
  const cls = pos
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
    : 'text-red-500 bg-red-50 dark:bg-red-900/20';
  const Icon = pos ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {pos ? '+' : ''}{value.toFixed(1)}% <Icon className="w-3.5 h-3.5 -mt-0.5" />
    </span>
  );
};

// ── MiniSparkline ─────────────────────────────────────────────────────────────

const MiniSparkline = ({ data, color = '#008081' }: { data: SparkPoint[]; color?: string }) => (
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#sg-${color.replace('#', '')})`} dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// ── AffinityMatrix ────────────────────────────────────────────────────────────

const AffinityMatrix = ({
  products, matrix,
}: { products: string[]; matrix: number[][] }) => {
  const maxVal = Math.max(...matrix.flat().filter(v => v >= 0), 1);
  return (
    <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-sm text-[#1A1A1A] dark:text-white uppercase tracking-widest">Product Affinity</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Prodotti ordinati insieme più spesso</p>
        </div>
        <GitBranch className="w-4 h-4 text-gray-400" />
      </div>
      {products.length < 2 ? (
        <p className="text-xs text-gray-400 text-center py-6">Dati insufficienti — servono almeno 2 prodotti per ordine.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-bold border-collapse">
            <thead>
              <tr>
                <th className="w-24 p-1" />
                {products.map(p => (
                  <th key={p} className="p-1 text-center text-gray-400 font-black truncate max-w-[60px]" title={p}>
                    {p.length > 7 ? p.slice(0, 7) + '…' : p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((rowProd, ri) => (
                <tr key={rowProd}>
                  <td className="p-1 text-gray-500 font-black truncate max-w-[90px] pr-2 text-right" title={rowProd}>
                    {rowProd.length > 9 ? rowProd.slice(0, 9) + '…' : rowProd}
                  </td>
                  {matrix[ri].map((val, ci) => {
                    const isDiag = val < 0;
                    const intensity = isDiag ? 0 : val / maxVal;
                    return (
                      <td key={ci} className="p-0.5">
                        <div
                          title={isDiag ? rowProd : `${rowProd} + ${products[ci]}: ${val}×`}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto font-black transition-opacity ${isDiag ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          style={isDiag ? {} : { backgroundColor: `rgba(0,128,129,${0.08 + intensity * 0.82})` }}
                        >
                          {isDiag ? (
                            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 block" />
                          ) : (
                            <span className={`text-[9px] ${intensity > 0.5 ? 'text-white' : 'text-[#008081]'}`}>
                              {val > 0 ? val : ''}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── InsightsCard ──────────────────────────────────────────────────────────────

const InsightsCard = ({ insights }: { insights: string[] }) => (
  <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/10 dark:to-[#1C1C1C] p-6 rounded-3xl border border-[#008081]/20 dark:border-teal-800/30 shadow-sm">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#008081]/10 flex items-center justify-center">
        <Lightbulb className="w-4 h-4 text-[#008081]" />
      </div>
      <div>
        <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest">Leomenu Intelligence</p>
        <p className="text-[10px] text-gray-400">Insight calcolati dai tuoi dati</p>
      </div>
    </div>
    {insights.length === 0 ? (
      <p className="text-xs text-gray-400">Nessun dato sufficiente per generare insight. Crea più ordini.</p>
    ) : (
      <ul className="space-y-2.5">
        {insights.map((ins, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#008081] flex-shrink-0 mt-0.5">▸</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed">{ins}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function BusinessIntelligence({ restaurantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<any[] | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('oggi');
  const fetchedAt = useRef<number>(0);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
      const { data } = await db
        .from('orders')
        .select('id, total_price, created_at, customer_name, order_items(quantity, product:products(name))')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', oneYearAgo)
        .order('created_at', { ascending: false });
      setRawOrders(data || []);
      fetchedAt.current = Date.now();
      setLoading(false);
    }
    if (restaurantId) fetchOrders();
  }, [restaurantId]);

  const data = useMemo(() => {
    if (!rawOrders) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

    // ── time range boundaries ─────────────────────────────────────────────
    let currentStart = new Date(), previousStart = new Date(), previousEnd = new Date();
    let chartTitle = 'Andamento';

    const hoursMap = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, hour: i, ricavi: 0, count: 0 }));
    const weekMap = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfToday.getTime() - (6 - i) * 86400000);
      return { name: d.toLocaleDateString('it-IT', { weekday: 'short' }), dateStr: d.toISOString().split('T')[0], ricavi: 0, count: 0 };
    });
    const monthMap = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, ricavi: 0, count: 0 }));
    const yearMap = months.map(m => ({ name: m, ricavi: 0, count: 0 }));

    if (timeRange === 'oggi') {
      currentStart = startOfToday;
      previousStart = new Date(startOfToday.getTime() - 86400000);
      previousEnd = startOfToday;
      chartTitle = 'Revenue Operations Ogni Ora (Oggi)';
    } else if (timeRange === 'settimana') {
      currentStart = new Date(startOfToday.getTime() - 6 * 86400000);
      previousStart = new Date(currentStart.getTime() - 7 * 86400000);
      previousEnd = currentStart;
      chartTitle = 'Andamento a 7 Giorni (Trailing)';
    } else if (timeRange === 'mese') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = currentStart;
      chartTitle = 'Liquidità Giornaliera (Mese Corrente)';
    } else {
      currentStart = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = currentStart;
      chartTitle = 'Cashflow Annuale Consolidato';
    }

    // ── sparkline: last 7 days ────────────────────────────────────────────
    const spark7Days = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(startOfToday.getTime() - (6 - i) * 86400000),
      dateStr: '',
      rev: 0,
      orders: 0,
    }));
    spark7Days.forEach(d => { d.dateStr = d.date.toISOString().split('T')[0]; });

    // ── product affinity ──────────────────────────────────────────────────
    const pairCounts = new Map<string, number>();
    const productCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    // ── main loop ─────────────────────────────────────────────────────────
    let ricaviCurr = 0, ordiniCurr = 0;
    let ricaviPrev = 0, ordiniPrev = 0;

    rawOrders.forEach(o => {
      const d = new Date(o.created_at);
      const isCurr = d >= currentStart;
      const isPrev = d >= previousStart && d < previousEnd;

      // sparkline (always, last 7 days)
      const dStr = d.toISOString().split('T')[0];
      const spDay = spark7Days.find(x => x.dateStr === dStr);
      if (spDay) { spDay.rev += o.total_price; spDay.orders += 1; }

      if (isCurr) {
        ricaviCurr += o.total_price;
        ordiniCurr += 1;
        const hour = d.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;

        const items: string[] = (o.order_items || [])
          .map((item: any) => item.product?.name as string | undefined)
          .filter((n): n is string => Boolean(n));

        items.forEach(name => { productCounts[name] = (productCounts[name] || 0) + 1; });

        // affinity pairs
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const pair = [items[i], items[j]].sort().join('||');
            pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
          }
        }

        if (timeRange === 'oggi') {
          hoursMap[hour].ricavi += o.total_price;
          hoursMap[hour].count += 1;
        } else if (timeRange === 'settimana') {
          const wItem = weekMap.find(x => x.dateStr === dStr);
          if (wItem) { wItem.ricavi += o.total_price; wItem.count += 1; }
        } else if (timeRange === 'mese') {
          const day = d.getDate() - 1;
          if (day >= 0 && day < daysInMonth) { monthMap[day].ricavi += o.total_price; monthMap[day].count += 1; }
        } else {
          yearMap[d.getMonth()].ricavi += o.total_price;
          yearMap[d.getMonth()].count += 1;
        }
      } else if (isPrev) {
        ricaviPrev += o.total_price;
        ordiniPrev += 1;
      }
    });

    const getTrend = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;
    const ricaviTrend = getTrend(ricaviCurr, ricaviPrev);
    const ordiniTrend = getTrend(ordiniCurr, ordiniPrev);
    const aovCurr = ordiniCurr > 0 ? ricaviCurr / ordiniCurr : 0;
    const aovPrev = ordiniPrev > 0 ? ricaviPrev / ordiniPrev : 0;
    const aovTrend = getTrend(aovCurr, aovPrev);

    let maxHour = 0, oraPunta = '--:--';
    Object.entries(hourCounts).forEach(([h, c]) => { if (c > maxHour) { maxHour = c; oraPunta = `${h}:00`; } });

    let chartData: any[] = [];
    let heatmapData: any[] = [];
    if (timeRange === 'oggi') {
      chartData = hoursMap.filter(h => h.ricavi > 0 || (h.hour >= 11 && h.hour <= 23));
      heatmapData = hoursMap.filter(h => h.hour >= 11 && h.hour <= 23);
    } else if (timeRange === 'settimana') {
      chartData = weekMap.map(w => ({ name: w.name, ricavi: +w.ricavi.toFixed(2), count: w.count }));
      heatmapData = weekMap;
    } else if (timeRange === 'mese') {
      chartData = monthMap.map(m => ({ name: m.name, ricavi: +m.ricavi.toFixed(2), count: m.count }));
      heatmapData = monthMap;
    } else {
      chartData = yearMap.map(y => ({ name: y.name, ricavi: +y.ricavi.toFixed(2), count: y.count }));
      heatmapData = yearMap;
    }

    const topProdotti = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));

    // ── sparkline data for KPI cards ──────────────────────────────────────
    const sparkRev: SparkPoint[] = spark7Days.map(d => ({ v: d.rev }));
    const sparkOrders: SparkPoint[] = spark7Days.map(d => ({ v: d.orders }));
    const sparkAov: SparkPoint[] = spark7Days.map(d => ({ v: d.orders > 0 ? d.rev / d.orders : 0 }));

    // ── product affinity matrix (top 6 products) ──────────────────────────
    const topAffProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n]) => n);
    const affinityMatrix: number[][] = topAffProducts.map((a, ri) =>
      topAffProducts.map((b, ci) => {
        if (ri === ci) return -1;
        return pairCounts.get([a, b].sort().join('||')) || 0;
      })
    );

    // ── natural language insights ─────────────────────────────────────────
    const insights: string[] = [];
    if (topProdotti[0]) {
      insights.push(`"${topProdotti[0].name}" è il prodotto più venduto con ${topProdotti[0].count} ordini in questo periodo.`);
    }
    if (Math.abs(ricaviTrend) >= 5 && ricaviPrev > 0) {
      insights.push(ricaviTrend > 0
        ? `Ricavi in crescita del ${ricaviTrend.toFixed(1)}% rispetto al periodo precedente. Ottimo andamento.`
        : `Ricavi in calo del ${Math.abs(ricaviTrend).toFixed(1)}%. Considera una promozione sui prodotti top.`
      );
    }
    if (oraPunta !== '--:--' && maxHour > 0) {
      insights.push(`L'ora di punta è ${oraPunta} con ${maxHour} operazioni. Pianifica il personale di conseguenza.`);
    }
    if (aovCurr > 0 && aovTrend > 5) {
      insights.push(`Lo scontrino medio è cresciuto del ${aovTrend.toFixed(1)}% (€${aovCurr.toFixed(2)}). I clienti stanno spendendo di più.`);
    }
    // affinity insight
    if (pairCounts.size > 0) {
      const topPair = [...pairCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      const [a, b] = topPair[0].split('||');
      insights.push(`Chi ordina "${a}" tende anche a ordinare "${b}" (${topPair[1]} volte). Considera un bundle.`);
    }

    return {
      ricaviCurr, ricaviTrend,
      ordiniCurr, ordiniTrend,
      aovCurr, aovTrend,
      oraPunta, maxHour,
      chartData, heatmapData, chartTitle,
      topProdotti,
      sparkRev, sparkOrders, sparkAov,
      topAffProducts, affinityMatrix,
      insights,
    };
  }, [rawOrders, timeRange]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS: { id: TimeRange; label: string }[] = [
    { id: 'oggi', label: '1D' }, { id: 'settimana', label: '7D' },
    { id: 'mese', label: '1M' }, { id: 'anno', label: '1Y' },
  ];
  const maxHeatmap = Math.max(...data.heatmapData.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header + Time Range ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">Intelligence & Analytics</h2>
          <p className="text-sm font-bold text-gray-500">Monitoraggio KPI operativi in tempo reale.</p>
        </div>
        <div className="bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-xl flex shadow-inner shrink-0 relative">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setTimeRange(tab.id)}
              className={`relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 z-10 w-20 text-center ${timeRange === tab.id ? 'text-[#1A1A1A] dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
          <div className="absolute top-1 bottom-1 w-20 bg-white dark:bg-[#262626] rounded-lg shadow-sm transition-transform duration-300 z-0"
            style={{ transform: `translateX(${TABS.findIndex(t => t.id === timeRange) * 100}%)` }} />
        </div>
      </div>

      {/* ── KPI Cards with Sparklines ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: 'Gross Revenue', value: `€${data.ricaviCurr.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, trend: data.ricaviTrend, Icon: DollarSign, color: '#008081', spark: data.sparkRev, sub: undefined },
          { label: 'Total Orders', value: data.ordiniCurr.toLocaleString('it-IT'), trend: data.ordiniTrend, Icon: ShoppingBag, color: '#2563EB', spark: data.sparkOrders, sub: undefined },
          { label: 'AOV (Avg Ticket)', value: `€${data.aovCurr.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, trend: data.aovTrend, Icon: TrendingUp, color: '#A855F7', spark: data.sparkAov, sub: undefined },
          { label: 'Peak Velocity', value: data.oraPunta, trend: undefined, sub: `${data.maxHour} ops/hr`, Icon: Flame, color: '#F97316', spark: null },
        ] as { label: string; value: string; trend: number | undefined; Icon: React.ElementType; color: string; spark: SparkPoint[] | null; sub: string | undefined }[]).map(({ label, value, trend, Icon, color, spark, sub }) => (
          <div key={label} className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            {spark && <MiniSparkline data={[...spark]} color={color} />}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Icon className="w-16 h-16" style={{ color }} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
              {trend !== undefined && <TrendIndicator value={trend} />}
            </div>
            <div className="flex items-end gap-2 relative z-10">
              <p className="text-3xl font-black text-[#1A1A1A] dark:text-white leading-none">{value}</p>
              {sub && <p className="text-xs font-bold mb-1 leading-none" style={{ color }}>{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart + Heatmap + Top Sellers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-lg text-[#1A1A1A] dark:text-white">{data.chartTitle}</h3>
            <span className="w-8 h-8 rounded-full bg-[#008081]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#008081]" />
            </span>
          </div>
          <div className="h-[280px] w-full">
            {data.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" opacity={timeRange === 'mese' ? 0.3 : 0.8} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(v: number) => `€${v > 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                  <Tooltip cursor={{ fill: 'rgba(0,128,129,0.04)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1A1A1A', fontWeight: '900' }}
                    itemStyle={{ color: '#008081' }}
                    formatter={(v: number) => [`€${v.toFixed(2)}`, 'Ricavi']}
                    labelStyle={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }} />
                  <Bar dataKey="ricavi" fill="#1A1A1A" radius={[4, 4, 4, 4]}
                    barSize={timeRange === 'mese' ? 8 : timeRange === 'oggi' ? 20 : 32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400 font-bold text-sm bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl">
                  Nessun dato finanziario per questo periodo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap + Top Sellers (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Heatmap */}
          <div className="bg-[#1A1A1A] text-white p-6 rounded-3xl shadow-sm border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-[#008081]">Velocity Heatmap</h3>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex gap-1.5 flex-wrap justify-between">
              {data.heatmapData.map((d: any, i: number) => {
                const intensity = d.count === 0 ? 0.05 : Math.max(0.15, d.count / maxHeatmap);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 group relative">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#008081] transition-opacity duration-300"
                      style={{ opacity: intensity }} title={`${d.name}: ${d.count} ordini`} />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-6 text-[9px] font-black uppercase tracking-widest text-gray-500">
              <span>Bassa (0)</span>
              <div className="w-24 h-1.5 bg-gradient-to-r from-[#1A1A1A] to-[#008081] rounded-full mx-2" />
              <span>Alta ({maxHeatmap})</span>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl flex-1 border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-sm text-[#1A1A1A] dark:text-white uppercase tracking-widest">Top Sellers</h3>
              <Award className="w-4 h-4 text-gray-400" />
            </div>
            {data.topProdotti.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-xs font-bold bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">Nessun ordine</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topProdotti.map((prod, idx) => (
                  <div key={prod.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 w-[70%]">
                      <span className={`w-5 font-black text-right text-sm ${idx === 0 ? 'text-[#008081]' : 'text-gray-300'}`}>{idx + 1}.</span>
                      <span className="font-bold text-sm text-[#1A1A1A] dark:text-gray-200 truncate group-hover:text-[#008081] transition-colors">{prod.name}</span>
                    </div>
                    <div className="w-[30%] text-right border-b border-dotted border-gray-200 dark:border-gray-800 group-hover:border-[#008081] transition-colors">
                      <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-[#262626] px-2 py-0.5 rounded-md relative bottom-[-5px]">
                        {prod.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Affinity Matrix ── */}
      <AffinityMatrix products={data.topAffProducts} matrix={data.affinityMatrix} />

      {/* ── Leomenu Intelligence Insights ── */}
      <InsightsCard insights={data.insights} />

    </div>
  );
}
