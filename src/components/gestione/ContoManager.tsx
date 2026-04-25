import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, ShoppingBag, Users,
  CheckCircle2, RefreshCw, Receipt,
} from 'lucide-react';
import db from '../../db';
import { useToast } from '../Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type ZoneTable = { id: string; name: string; pax: number };
type Zone      = { id: string; name: string; tables: ZoneTable[] };

type OrderItem = {
  id: string; quantity: number; price_at_time: number; notes?: string;
  product: { name: string } | null;
};
type Order = {
  id: string; status: string; total_price: number; created_at: string;
  table_number: string | null; order_type: string; customer_name: string | null;
  order_items: OrderItem[];
};

// Aggregated item across multiple orders for the same table
type AggItem = { name: string; quantity: number; total: number };

// ── Zone colour palette (same as QR section) ──────────────────────────────────

const ZONE_COLORS = [
  { card: 'bg-blue-50   dark:bg-blue-900/10   border-blue-100   dark:border-blue-900/30',   badge: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300'   },
  { card: 'bg-amber-50  dark:bg-amber-900/10  border-amber-100  dark:border-amber-900/30',  badge: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300'  },
  { card: 'bg-rose-50   dark:bg-rose-900/10   border-rose-100   dark:border-rose-900/30',   badge: 'bg-rose-100   dark:bg-rose-900/30   text-rose-700   dark:text-rose-400'   },
  { card: 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30', badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  { card: 'bg-green-50  dark:bg-green-900/10  border-green-100  dark:border-green-900/30',  badge: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300'  },
  { card: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
];

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_PRIORITY: Record<string, number> = { in_attesa: 0, in_preparazione: 1, pronto: 2, conto: 3 };
const STATUS_LABEL: Record<string, string>    = { in_attesa: 'In attesa', in_preparazione: 'In preparazione', pronto: 'Pronto', conto: 'Conto richiesto' };
const STATUS_CLS: Record<string, string>      = {
  in_attesa:       'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  in_preparazione: 'bg-blue-100   text-blue-600   dark:bg-blue-900/20   dark:text-blue-400',
  pronto:          'bg-green-100  text-green-700  dark:bg-green-900/20  dark:text-green-400',
  conto:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
};

function worstStatus(orders: Order[]): string {
  return orders.reduce((worst, o) => {
    return (STATUS_PRIORITY[o.status] ?? 99) < (STATUS_PRIORITY[worst] ?? 99) ? o.status : worst;
  }, 'pronto');
}

function aggregateItems(orders: Order[]): AggItem[] {
  const map = new Map<string, AggItem>();
  orders.forEach(o => o.order_items.forEach(item => {
    const name = item.product?.name || '—';
    const ex = map.get(name);
    if (ex) { ex.quantity += item.quantity; ex.total += item.price_at_time * item.quantity; }
    else map.set(name, { name, quantity: item.quantity, total: item.price_at_time * item.quantity });
  }));
  return Array.from(map.values());
}

function fmt(n: number) { return `€${n.toFixed(2)}`; }

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ContoManager({ restaurantId }: { restaurantId: string }) {
  const { showToast, ToastContainer } = useToast();
  const [zones, setZones]       = useState<Zone[]>([]);
  const [coperto, setCoperto]   = useState(0);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [closing, setClosing]   = useState<string | null>(null);

  // ── Data load ──────────────────────────────────────────────────────────────

  const fetchOrders = async () => {
    const { data } = await db.from('orders')
      .select('id, status, total_price, created_at, table_number, order_type, customer_name, order_items(id, quantity, price_at_time, notes, product:products(name))')
      .eq('restaurant_id', restaurantId)
      .neq('status', 'consegnato')
      .order('created_at', { ascending: true });
    if (data) setOrders(data as unknown as Order[]);
  };

  useEffect(() => {
    if (!restaurantId) return;
    let mounted = true;

    (async () => {
      const [{ data: saleData }, { data: settingsData }] = await Promise.all([
        db.from('settings').select('value').eq('restaurant_id', restaurantId).eq('key', 'sale').maybeSingle(),
        db.from('settings').select('key,value').eq('restaurant_id', restaurantId).in('key', ['coperto_price']),
      ]);
      if (!mounted) return;
      if (saleData?.value) {
        try {
          const parsed = typeof saleData.value === 'string' ? JSON.parse(saleData.value) : saleData.value;
          if (Array.isArray(parsed)) setZones(parsed);
        } catch (_) {}
      }
      if (settingsData) {
        const copertoRow = settingsData.find(r => r.key === 'coperto_price');
        if (copertoRow) setCoperto(parseFloat(copertoRow.value) || 0);
      }
      await fetchOrders();
      if (mounted) setLoading(false);
    })();

    const ch = db.channel(`conto-manager-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchOrders())
      .subscribe();

    return () => { mounted = false; db.removeChannel(ch); };
  }, [restaurantId]);

  // ── Close table ────────────────────────────────────────────────────────────

  const handleChiudiTavolo = async (tableKey: string) => {
    setClosing(tableKey);
    await db.from('orders')
      .update({ status: 'consegnato' })
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableKey)
      .neq('status', 'consegnato');
    await fetchOrders();
    setClosing(null);
    setExpanded(prev => { const next = new Set(prev); next.delete(tableKey); return next; });
    showToast('✅ Tavolo chiuso', 'success');
  };

  const handleChiudiAsporto = async (orderId: string) => {
    setClosing(orderId);
    await db.from('orders').update({ status: 'consegnato' }).eq('id', orderId);
    await fetchOrders();
    setClosing(null);
    showToast('✅ Ordine consegnato', 'success');
  };

  const toggleExpand = (key: string) =>
    setExpanded(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  // ── Derived data ───────────────────────────────────────────────────────────

  const asportoOrders = orders.filter(o => o.order_type === 'asporto');
  const totalAttivi = zones.flatMap(z => z.tables).filter(t => {
    const key = `${zones.find(z => z.tables.includes(t))?.name} · T${t.name}`;
    return orders.some(o => o.table_number === key);
  }).length;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Conto</h2>
          <p className="text-sm text-gray-500 font-bold mt-0.5">
            {totalAttivi > 0 ? `${totalAttivi} tavoli attivi` : 'Nessun tavolo attivo'}{asportoOrders.length > 0 ? ` · ${asportoOrders.length} asporto` : ''}
          </p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#008081] transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tavoli per zona ─────────────────────────────────────────────────── */}
      {zones.map((zone, zi) => {
        const color = ZONE_COLORS[zi % ZONE_COLORS.length];
        const activeTables = zone.tables.filter(t =>
          orders.some(o => o.table_number === `${zone.name} · T${t.name}`)
        );

        if (activeTables.length === 0) return null;

        return (
          <div key={zone.id}>
            <div className="flex items-center gap-2 px-1 mb-3">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${color.badge}`}>
                {zone.name}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">{activeTables.length} attivi</span>
            </div>

            <div className="space-y-3">
              {zone.tables.map(table => {
                const tableKey = `${zone.name} · T${table.name}`;
                const tableOrders = orders.filter(o => o.table_number === tableKey);
                if (tableOrders.length === 0) return null;

                const status  = worstStatus(tableOrders);
                const items   = aggregateItems(tableOrders);
                const subtotal = tableOrders.reduce((s, o) => s + (o.total_price || 0), 0);
                const copertoTotal = coperto > 0 ? coperto * (table.pax || 2) : 0;
                const totale  = subtotal + copertoTotal;
                const turni   = tableOrders.length;
                const piatti  = tableOrders.reduce((s, o) => s + o.order_items.reduce((ss, i) => ss + i.quantity, 0), 0);
                const isOpen  = expanded.has(tableKey);
                const isClosing = closing === tableKey;

                return (
                  <div key={table.id} className={`rounded-2xl border shadow-sm overflow-hidden ${color.card}`}>
                    {/* Card header — clickable to expand */}
                    <button
                      onClick={() => toggleExpand(tableKey)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:brightness-95 transition-all"
                    >
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-lg text-gray-900 dark:text-white">Mesa {table.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_CLS[status] || STATUS_CLS.in_attesa}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          {turni} {turni === 1 ? 'turno' : 'turni'} · {piatti} piatti · {table.pax}p
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg text-[#008081]">{fmt(totale)}</p>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-0.5" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-0.5" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-white/40 dark:border-white/10 bg-white dark:bg-[#1C1C1C]">
                        {/* Items aggregati */}
                        <div className="px-4 py-3 space-y-1.5">
                          {items.map(item => (
                            <div key={item.name} className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-[#008081] w-5 shrink-0">{item.quantity}×</span>
                              <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200 flex-grow">{item.name}</span>
                              <span className="text-[11px] font-black text-gray-500">{fmt(item.total)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Coperto */}
                        {copertoTotal > 0 && (
                          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-500">Coperto ({table.pax}p × {fmt(coperto)})</span>
                            <span className="text-[11px] font-black text-gray-500">{fmt(copertoTotal)}</span>
                          </div>
                        )}

                        {/* Totale */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#181818]">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Totale</span>
                          <span className="text-xl font-black text-[#008081]">{fmt(totale)}</span>
                        </div>

                        {/* Chiudi tavolo */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => handleChiudiTavolo(tableKey)}
                            disabled={!!isClosing}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#008081] hover:bg-[#006666] active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all disabled:opacity-60"
                          >
                            {isClosing ? (
                              <><RefreshCw className="w-4 h-4 animate-spin" /> Chiusura...</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4" /> Chiudi Tavolo</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state tavoli */}
      {zones.every(z => z.tables.every(t => !orders.some(o => o.table_number === `${z.name} · T${t.name}`))) && asportoOrders.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-gray-100 dark:border-gray-800 p-16 flex flex-col items-center gap-4 text-center">
          <Receipt className="w-12 h-12 text-gray-200 dark:text-gray-700" />
          <p className="font-black text-gray-400 text-sm uppercase tracking-widest">Nessun conto attivo</p>
          <p className="text-xs text-gray-400 max-w-xs">Le mesas con ordini attivi appariranno qui.</p>
        </div>
      )}

      {/* ── Da Asporto ──────────────────────────────────────────────────────── */}
      {asportoOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Da Asporto
            </span>
            <span className="text-[10px] text-gray-400 font-bold">{asportoOrders.length} ordini</span>
          </div>

          <div className="space-y-3">
            {asportoOrders.map(order => {
              const isOpen = expanded.has(order.id);
              const isClosing = closing === order.id;
              const time = new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={order.id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:brightness-95 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-black text-sm text-gray-900 dark:text-white">{order.customer_name || 'Asporto'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{time} · {order.order_items.reduce((s, i) => s + i.quantity, 0)} piatti</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-[#008081]">{fmt(order.total_price)}</p>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-0.5" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-0.5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-amber-100 dark:border-amber-900/30 bg-white dark:bg-[#1C1C1C]">
                      <div className="px-4 py-3 space-y-1.5">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-[#008081] w-5 shrink-0">{item.quantity}×</span>
                            <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200 flex-grow">{item.product?.name || '—'}</span>
                            <span className="text-[11px] font-black text-gray-500">{fmt(item.price_at_time * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => handleChiudiAsporto(order.id)}
                          disabled={!!isClosing}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-[#008081] hover:bg-[#006666] active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all disabled:opacity-60"
                        >
                          {isClosing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Aggiornamento...</> : <><CheckCircle2 className="w-4 h-4" /> Consegnato</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
