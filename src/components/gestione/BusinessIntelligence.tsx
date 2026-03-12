import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, Award, Flame } from 'lucide-react';
import db from '../../db';

interface Props {
    restaurantId: string;
}

type TimeRange = 'oggi' | 'settimana' | 'mese' | 'anno';

const TrendIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    const color = isPositive ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] sm:text-xs font-bold ${color}`}>
            {isPositive ? '+' : ''}{value.toFixed(1)}% <Icon className="w-3 h-3" />
        </span>
    );
};

export default function BusinessIntelligence({ restaurantId }: Props) {
    const [loading, setLoading] = useState(true);
    const [rawOrders, setRawOrders] = useState<any[] | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('oggi');

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            const { data } = await db.from('orders').select(`
                id, total_price, created_at,
                order_items(quantity, product:products(name))
            `).eq('restaurant_id', restaurantId);
            setRawOrders(data || []);
            setLoading(false);
        }
        fetchOrders();
    }, [restaurantId]);

    const data = useMemo(() => {
        if (!rawOrders) return null;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let currentStart = new Date();
        let previousStart = new Date();
        let previousEnd = new Date();
        let chartTitle = 'Andamento';

        // Pre-build chart structures
        const hoursMap = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, ricavi: 0 }));

        const weekMap: { name: string, dateStr: string, ricavi: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(startOfToday.getTime() - i * 86400000);
            weekMap.push({
                name: d.toLocaleDateString('it-IT', { weekday: 'short' }),
                dateStr: new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0],
                ricavi: 0
            });
        }

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthMap = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, ricavi: 0 }));

        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const yearMap = months.map(m => ({ name: m, ricavi: 0 }));

        // Determine ranges
        if (timeRange === 'oggi') {
            currentStart = startOfToday;
            previousStart = new Date(startOfToday.getTime() - 86400000);
            previousEnd = startOfToday;
            chartTitle = 'Andamento Oggi (Ore)';
        } else if (timeRange === 'settimana') {
            currentStart = new Date(startOfToday.getTime() - 6 * 86400000);
            previousStart = new Date(currentStart.getTime() - 7 * 86400000);
            previousEnd = currentStart;
            chartTitle = 'Andamento 7 Giorni';
        } else if (timeRange === 'mese') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            previousEnd = currentStart;
            chartTitle = 'Andamento Mensile (Giorni)';
        } else if (timeRange === 'anno') {
            currentStart = new Date(now.getFullYear(), 0, 1);
            previousStart = new Date(now.getFullYear() - 1, 0, 1);
            previousEnd = currentStart;
            chartTitle = 'Andamento Annuale (Mesi)';
        }

        let ricaviCurr = 0, ordiniCurr = 0;
        let ricaviPrev = 0, ordiniPrev = 0;
        const hourCounts: Record<string, number> = {};
        const productCounts: Record<string, number> = {};

        rawOrders.forEach(o => {
            const d = new Date(o.created_at);
            const isCurrent = d >= currentStart;
            const isPrevious = d >= previousStart && d < previousEnd;

            if (isCurrent) {
                ricaviCurr += o.total_price;
                ordiniCurr += 1;

                o.order_items?.forEach((item: any) => {
                    const name = item.product?.name || 'Prodotto eliminato';
                    productCounts[name] = (productCounts[name] || 0) + item.quantity;
                });

                const hour = d.getHours();
                const hourKey = `${hour}:00`;
                hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;

                if (timeRange === 'oggi') {
                    hoursMap[hour].ricavi += o.total_price;
                } else if (timeRange === 'settimana') {
                    const dStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    const item = weekMap.find(x => x.dateStr === dStr);
                    if (item) item.ricavi += o.total_price;
                } else if (timeRange === 'mese') {
                    const dayNum = d.getDate();
                    if (dayNum - 1 >= 0 && dayNum - 1 < daysInMonth) {
                        monthMap[dayNum - 1].ricavi += o.total_price;
                    }
                } else if (timeRange === 'anno') {
                    const monthNum = d.getMonth();
                    yearMap[monthNum].ricavi += o.total_price;
                }
            } else if (isPrevious) {
                ricaviPrev += o.total_price;
                ordiniPrev += 1;
            }
        });

        const getTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const ricaviTrend = getTrend(ricaviCurr, ricaviPrev);
        const ordiniTrend = getTrend(ordiniCurr, ordiniPrev);
        const ticketMedioCurr = ordiniCurr > 0 ? ricaviCurr / ordiniCurr : 0;
        const ticketMedioPrev = ordiniPrev > 0 ? ricaviPrev / ordiniPrev : 0;
        const ticketTrend = getTrend(ticketMedioCurr, ticketMedioPrev);

        let maxCount = -1;
        let oraPunta = '--:--';
        Object.entries(hourCounts).forEach(([h, count]) => {
            if (count > maxCount) {
                maxCount = count;
                oraPunta = h;
            }
        });

        let chartData: any[] = [];
        if (timeRange === 'oggi') {
            chartData = hoursMap.filter(h => h.ricavi > 0 || (parseInt(h.name) >= 12 && parseInt(h.name) <= 23));
        } else if (timeRange === 'settimana') {
            chartData = weekMap.map(w => ({ name: w.name, ricavi: Number(w.ricavi.toFixed(2)) }));
        } else if (timeRange === 'mese') {
            chartData = monthMap.map(m => ({ name: m.name, ricavi: Number(m.ricavi.toFixed(2)) }));
        } else if (timeRange === 'anno') {
            chartData = yearMap.map(y => ({ name: y.name, ricavi: Number(y.ricavi.toFixed(2)) }));
        }

        const topProdotti = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

        const labels = {
            oggi: { ricavi: 'Ricavi Oggi', ordini: 'Ordini Oggi' },
            settimana: { ricavi: 'Ricavi 7 Giorni', ordini: 'Ordini 7 Giorni' },
            mese: { ricavi: 'Ricavi Mese', ordini: 'Ordini Mese' },
            anno: { ricavi: 'Ricavi Anno', ordini: 'Ordini Anno' }
        };

        return {
            ricaviCurr, ricaviTrend,
            ordiniCurr, ordiniTrend,
            ticketMedio: ticketMedioCurr, ticketTrend,
            oraPunta, oraPuntaCount: maxCount,
            chartData, chartTitle,
            topProdotti,
            uiLabels: labels[timeRange]
        };
    }, [rawOrders, timeRange]);

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">

            {/* Time Range Selector */}
            <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-6 shadow-inner w-full sm:w-min whitespace-nowrap overflow-x-auto snap-x hidden-scrollbar">
                {[
                    { id: 'oggi' as TimeRange, label: 'Giorno' },
                    { id: 'settimana' as TimeRange, label: 'Settimana' },
                    { id: 'mese' as TimeRange, label: 'Mese' },
                    { id: 'anno' as TimeRange, label: 'Anno' }
                ].map(range => (
                    <button
                        key={range.id}
                        onClick={() => setTimeRange(range.id)}
                        className={`flex-1 min-w-[80px] px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 snap-center ${timeRange === range.id
                            ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-premium transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* 2x2 KPI Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Ricavi */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-4 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <TrendIndicator value={data.ricaviTrend} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-0.5">{data.uiLabels.ricavi}</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">€{data.ricaviCurr.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ordini */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-4 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <TrendIndicator value={data.ordiniTrend} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-0.5">{data.uiLabels.ordini}</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">{data.ordiniCurr}</p>
                    </div>
                </div>

                {/* Ticket Medio */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-4 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <TrendIndicator value={data.ticketTrend} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-0.5">Ticket Medio</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">€{data.ticketMedio.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ora di Punta */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-4 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                            <Clock className="w-5 h-5" />
                        </div>
                        {data.oraPuntaCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mt-1">
                                <Flame className="w-3 h-3" /> Max
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-0.5">Ora di Punta</p>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">{data.oraPunta}</p>
                    </div>
                </div>
            </div>

            {/* Andamento & Top Prodotti */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Andamento Chart */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-5 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest">{data.chartTitle}</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(value) => `€${value}`} width={40} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0, 128, 128, 0.05)' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1A1A1A', color: '#fff', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#008080' }}
                                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ricavi']}
                                />
                                <Bar dataKey="ricavi" fill="#5F27CD" radius={[4, 4, 4, 4]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Prodotti */}
                <div className="bg-[#FBFBFB] dark:bg-[#262626] p-5 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Top 3 Prodotti</h3>
                        <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    {data.topProdotti.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium p-4 text-center">Nessun prodotto venduto nel periodo selezionato</div>
                    ) : (
                        <div className="space-y-3 flex-1">
                            {data.topProdotti.map((prod, idx) => (
                                <div key={prod.name} className="flex items-center justify-between p-3 rounded-2xl bg-[#FBFBFB] dark:bg-[#1A1A1A] shadow-sm transition-transform hover:-translate-y-0.5 border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                            ${idx === 0 ? 'bg-orange-100 text-[#FF9F43] dark:bg-orange-900/30' :
                                                idx === 1 ? 'bg-blue-100 text-[#00D2D3] dark:bg-blue-900/30' :
                                                    'bg-purple-100 text-[#5F27CD] dark:bg-purple-900/30'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 line-clamp-1">{prod.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-gray-800 dark:text-gray-200">{prod.count}</span>
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest -mt-1">Venduti</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
