import { ArrowLeft, RotateCcw, Package, ClipboardList, Trash2, LogOut } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useCart } from '../hooks/useCart';
import db from '../db';
import BottomNav from '../components/BottomNav';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  in_attesa:       { label: 'In attesa',       cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
  in_preparazione: { label: 'In preparazione', cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  pronto:          { label: 'Pronto',          cls: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  consegnato:      { label: 'Servito',         cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
};

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  notes?: string;
  product: { id: string; name: string; image_url?: string } | null;
}
interface Order {
  id: string;
  status: string;
  created_at: string;
  total_price: number;
  table_number: string | null;
  order_items: OrderItem[];
}
interface TableSession {
  tableNumber: string;
  orderIds: string[];
  startedAt: string;
}

export default function CronologiaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart(slug || null);

  const sessionKey = `leomenu_session_${slug}`;
  const [session, setSession] = useState<TableSession | null>(() =>
    JSON.parse(localStorage.getItem(`leomenu_session_${slug}`) || 'null')
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [showExitModal, setShowExitModal] = useState(false);

  const fetchOrders = useCallback(async (ids: string[]) => {
    if (!ids.length) { setLoading(false); return; }
    const { data } = await db.from('orders')
      .select('id, status, created_at, total_price, table_number, order_items(id, quantity, price_at_time, notes, product:products(id, name, image_url))')
      .in('id', ids)
      .order('created_at', { ascending: true });
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!slug) return;
    db.from('restaurants').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setRestaurantId(data.id);
    });
    const s: TableSession | null = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    setSession(s);
    if (s?.orderIds?.length) fetchOrders(s.orderIds);
    else setLoading(false);
  }, [slug]);

  // Realtime: aggiorna stato ordini in tempo reale
  useEffect(() => {
    if (!restaurantId || !session?.orderIds?.length) return;
    const ch = db.channel(`cronologia_${restaurantId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any) => {
        if (session.orderIds.includes(payload.new?.id)) {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
        }
      })
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [restaurantId, session?.orderIds?.join(',')]);

  const handleReorder = (item: OrderItem) => {
    if (!item.product) return;
    addToCart({ id: item.product.id, name: item.product.name, price: item.price_at_time, image_url: item.product.image_url || '', price_unit: null });
    setAddedItems(p => ({ ...p, [item.id]: true }));
    setTimeout(() => setAddedItems(p => ({ ...p, [item.id]: false })), 1500);
  };

  const handleClearSession = () => {
    sessionStorage.removeItem(`leomenu_tavolo_${slug}`);
    localStorage.removeItem(sessionKey);
    navigate(`/${slug}`);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const formatAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'adesso';
    if (m < 60) return `${m} min fa`;
    return `${Math.floor(m / 60)}h fa`;
  };

  const totalSpent = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const readyCount = orders.filter(o => o.status === 'pronto').length;
  const totalDishes = orders.reduce((s, o) => s + (o.order_items?.reduce((ss, i) => ss + i.quantity, 0) || 0), 0);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!session?.orderIds?.length) {
    return (
      <div className="bg-[#F5F5F5] dark:bg-[#111] min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#008081]" />
            </button>
            <h1 className="font-black text-sm tracking-widest uppercase text-[#1A1A1A] dark:text-white">Il mio ordine</h1>
          </div>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center gap-4 px-6 text-center pb-24">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ClipboardList className="w-9 h-9 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-black text-gray-400 text-lg">Nessun ordine ancora</p>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Scansiona il QR del tuo tavolo per ordinare e vedere qui il tuo storico.
          </p>
          <Link to={`/${slug}`} className="mt-2 bg-[#008081] text-white font-black px-6 py-3 rounded-2xl hover:bg-[#006666] transition-colors">
            Vai al menù
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#111] min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#008081]" />
          </button>
          <div className="flex-grow">
            <h1 className="font-black text-sm tracking-widest uppercase text-[#1A1A1A] dark:text-white leading-tight">Il mio ordine</h1>
            <p className="text-[10px] font-bold text-[#008081]">
              Tavolo {session.tableNumber} · {orders.length} {orders.length === 1 ? 'turno' : 'turni'}
            </p>
          </div>
          {readyCount > 0 && (
            <span className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
              {readyCount} pronto!
            </span>
          )}
        </div>
      </header>

      <main className="flex-grow pb-28 max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {orders.map((order, idx) => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_attesa;
              const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
              return (
                <div key={order.id} className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                  {/* Turno header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-gray-800 dark:text-white">Turno {idx + 1}</p>
                        {order.table_number && (
                          <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                            Tavolo {order.table_number}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {formatTime(order.created_at)} · {itemCount} {itemCount === 1 ? 'piatto' : 'piatti'} · {formatAgo(order.created_at)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product?.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{item.product?.name || '—'}</p>
                          {item.notes && <p className="text-[11px] text-gray-400 italic truncate">"{item.notes}"</p>}
                          <p className="text-[11px] font-bold text-[#008081] mt-0.5">
                            €{(item.price_at_time * item.quantity).toFixed(2)} · ×{item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => handleReorder(item)}
                          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                            addedItems[item.id]
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-[#008081]/10 hover:text-[#008081]'
                          }`}
                        >
                          {addedItems[item.id] ? '✓' : <><RotateCcw className="w-3 h-3" />&nbsp;Riordina</>}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal turno */}
                  <div className="px-5 py-2.5 bg-gray-50 dark:bg-[#181818] flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400">Subtotale turno</span>
                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">€{(order.total_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}

            {/* Grand total */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm px-5 py-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Totale sessione</span>
                <span className="text-2xl font-black text-[#008081]">€{totalSpent.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {orders.length} {orders.length === 1 ? 'turno' : 'turni'} · {totalDishes} piatti · Tavolo {session.tableNumber}
              </p>
            </div>

            {/* End session */}
            <button onClick={() => setShowExitModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" /> Fine sessione al tavolo
            </button>
          </>
        )}
      </main>

      <BottomNav />

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex flex-col items-center gap-3 mb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Fine sessione?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  La sessione del <span className="font-bold text-gray-700 dark:text-gray-300">Tavolo {session.tableNumber}</span> verrà chiusa e il tuo storico ordini cancellato.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-2xl font-black text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleClearSession}
                className="flex-1 py-3 rounded-2xl font-black text-sm bg-red-500 hover:bg-red-600 text-white transition-colors active:scale-95"
              >
                Sì, esci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
