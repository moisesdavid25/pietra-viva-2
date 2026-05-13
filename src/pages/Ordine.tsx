import { ArrowLeft, ShoppingBag, Trash2, FileText, X, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import db from '../db';
import BottomNav from '../components/BottomNav';
import NotFound from '../components/NotFound';

// Generates a 4-digit numeric pickup code (1000–9999)
function generatePickupCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
}

export default function OrdinePage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [notFound, setNotFound] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, addNote, totalItems, totalPrice } = useCart(slug || null);

    const [isConfirming, setIsConfirming] = useState(false);
    const [orderType, setOrderType] = useState<'tavolo' | 'asporto'>('tavolo');
    const [tableNumber, setTableNumber] = useState('');
    const [tableFromQR, setTableFromQR] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [orderConfirmed, setOrderConfirmed] = useState<{ id: string; shortId: string; dailyNumber: number; queue: number; status: string; pickup_code?: string; order_type?: string } | null>(null);

    // ── Fidelity session detection ───────────────────────────────────────
    const [fidelityUser, setFidelityUser] = useState<{ id: string; name: string } | null>(null);
    useEffect(() => {
        db.auth.getUser().then(({ data }) => {
            if (!data.user) return;
            const first = data.user.user_metadata?.first_name || '';
            const last  = data.user.user_metadata?.last_name  || '';
            const name  = `${first} ${last}`.trim() || data.user.email?.split('@')[0] || '';
            setFidelityUser({ id: data.user.id, name });
        });
    }, []);
    const [publicOrders, setPublicOrders] = useState<any[]>([]);

    // Note modal state
    const [noteOpen, setNoteOpen] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    // ── Realtime order queue ─────────────────────────────────────────────
    useEffect(() => {
        if (!restaurantId) return;
        const fetchOrders = async () => {
            const { data } = await db.from('orders')
                .select('id, daily_order_number, status, created_at')
                .eq('restaurant_id', restaurantId)
                .in('status', ['in_preparazione', 'pronto'])
                .order('created_at', { ascending: false });
            if (data) setPublicOrders(data);
        };
        fetchOrders();

        const ch = db.channel(`global_orders_${restaurantId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload: any) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const o = payload.new;
                    setPublicOrders(prev => {
                        if (o.status !== 'in_preparazione' && o.status !== 'pronto') return prev.filter(x => x.id !== o.id);
                        const exists = prev.find(x => x.id === o.id);
                        const next = exists ? prev.map(x => x.id === o.id ? { ...x, ...o } : x) : [o, ...prev];
                        return next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    });
                } else if (payload.eventType === 'DELETE' && payload.old?.id) {
                    setPublicOrders(prev => prev.filter(x => x.id !== payload.old.id));
                }
            }).subscribe();
        return () => { db.removeChannel(ch); };
    }, [restaurantId]);

    // ── Realtime personal order tracking ────────────────────────────────
    useEffect(() => {
        if (!orderConfirmed?.id || orderConfirmed.id.startsWith('DEMO')) return;
        const ch = db.channel(`personal_${orderConfirmed.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderConfirmed.id}` }, (payload) => {
                if (payload.new?.status) setOrderConfirmed(prev => prev ? { ...prev, status: payload.new.status } : null);
            }).subscribe();
        return () => { db.removeChannel(ch); };
    }, [orderConfirmed?.id]);

    useEffect(() => {
        if (!slug) return;
        db.from('restaurants').select('id').eq('slug', slug).single().then(({ data }) => {
            if (!data) setNotFound(true);
            else setRestaurantId(data.id);
        });
    }, [slug]);

    // ── Detect table from QR URL or sessionStorage ───────────────────────
    useEffect(() => {
        if (!slug) return;
        const tavolo = searchParams.get('tavolo') || sessionStorage.getItem(`leomenu_tavolo_${slug}`);
        if (!tavolo) return;
        setTableNumber(tavolo);
        setOrderType('tavolo');
        setTableFromQR(true);
    }, [searchParams, slug]);

    if (notFound) return <NotFound />;

    // ── Note helpers ─────────────────────────────────────────────────────
    const openNote = (cartItemId: string, currentNote: string) => {
        setNoteOpen(cartItemId);
        setNoteText(currentNote || '');
    };
    const saveNote = () => {
        if (noteOpen) addNote(noteOpen, noteText.trim());
        setNoteOpen(null);
        setNoteText('');
    };

    // ── Confirm order ────────────────────────────────────────────────────
    const handleConfirmOrder = async () => {
        if (!restaurantId || cart.length === 0) return;
        setIsConfirming(true);
        try {
            if (slug && (slug.toLowerCase() === 'demo' || slug === import.meta.env.VITE_DEMO_SLUG)) {
                await new Promise(res => setTimeout(res, 1500));
                clearCart();
                const demoCode = orderType === 'asporto' ? generatePickupCode() : undefined;
                setOrderConfirmed({ id: 'DEMO-' + Date.now(), shortId: 'DEMO', dailyNumber: Math.floor(Math.random() * 50) + 1, queue: Math.floor(Math.random() * 5), status: 'in_attesa', pickup_code: demoCode, order_type: orderType });
                return;
            }

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

            const { data: todayOrders } = await db.from('orders').select('daily_order_number')
                .eq('restaurant_id', restaurantId).gte('created_at', startOfDay).lte('created_at', endOfDay)
                .not('daily_order_number', 'is', null).order('daily_order_number', { ascending: false }).limit(1);

            const nextOrderNumber = (todayOrders && todayOrders.length > 0 && todayOrders[0].daily_order_number)
                ? todayOrders[0].daily_order_number + 1 : 1;

            // Pickup code only for asporto orders
            const pickupCode = orderType === 'asporto' ? generatePickupCode() : null;

            const { data: orderData, error: orderError } = await db.from('orders').insert({
                restaurant_id: restaurantId,
                table_number: orderType === 'tavolo' ? tableNumber : null,
                customer_name: fidelityUser?.name || (orderType === 'asporto' ? customerName : null),
                order_type: orderType,
                daily_order_number: nextOrderNumber,
                total_price: totalPrice,
                auth_user_id: fidelityUser?.id || null,
                pickup_code: pickupCode,
            }).select().single();

            if (orderError) throw orderError;

            const orderItems = cart.map((item: any) => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price,
                customizations: item.customizations || {}
            }));
            const { error: itemsError } = await db.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            const { count: queueCount } = await db.from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .in('status', ['in_attesa', 'in_preparazione'])
                .lt('created_at', orderData.created_at);

            clearCart();
            setOrderConfirmed({ id: orderData.id, shortId: orderData.id.split('-')[0].toUpperCase(), dailyNumber: nextOrderNumber, queue: queueCount || 0, status: 'in_attesa', pickup_code: pickupCode || undefined, order_type: orderType });

            // Save session to localStorage for Cronologia
            if (slug && orderType === 'tavolo' && tableNumber) {
                const sessionKey = `leomenu_session_${slug}`;
                const existingRaw = localStorage.getItem(sessionKey);
                const existing = existingRaw ? JSON.parse(existingRaw) : null;
                // Reset session if table number changed — orders from different tables must not mix
                const base = (existing && existing.tableNumber === tableNumber) ? existing : { orderIds: [] };
                localStorage.setItem(sessionKey, JSON.stringify({
                    tableNumber,
                    orderIds: [...(base.orderIds || []), orderData.id],
                    startedAt: base.startedAt || new Date().toISOString(),
                }));
            }
        } catch (e: any) {
            alert("Errore durante la conferma dell'ordine: " + e.message);
        } finally {
            setIsConfirming(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────
    return (
        <div className="bg-[#F5F5F5] dark:bg-[#111] text-[#1A1A1A] dark:text-white font-sans min-h-screen flex flex-col antialiased">

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-[#008081]" />
                    </button>
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#008081]" />
                        <h1 className="font-black text-base tracking-[0.15em] uppercase text-[#1A1A1A] dark:text-white">
                            Il tuo Ordine
                        </h1>
                        {totalItems > 0 && !orderConfirmed && (
                            <span className="bg-[#008081] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <div className="w-9" />
                </div>
            </header>

            <main className="flex-grow pb-28 max-w-2xl mx-auto w-full px-4">

                {/* ── Order confirmed ── */}
                {orderConfirmed ? (
                    <div className="py-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-[#008081]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-[#008081]" />
                            </div>
                            <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white">Ordine Inviato!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Il tuo ordine è stato ricevuto dalla cucina</p>
                        </div>

                        {/* Order number card */}
                        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-8 mb-4 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Numero Ordine</p>
                            <p className="text-7xl font-black text-[#008081] tracking-tighter">
                                <span className="text-3xl text-[#008081]/40 align-top mr-1">#</span>
                                {orderConfirmed.dailyNumber}
                            </p>
                            <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest">Ref: {orderConfirmed.shortId}</p>
                        </div>

                        {/* Pickup code — only for asporto */}
                        {orderConfirmed.pickup_code && orderConfirmed.order_type === 'asporto' && (
                            <div className="bg-[#008081] rounded-3xl p-7 mb-6 text-center shadow-lg relative overflow-hidden">
                                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                                <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />
                                <p className="text-xs font-black text-white/70 uppercase tracking-widest mb-3 relative z-10">
                                    🎟️ Codice Ritiro
                                </p>
                                <p className="text-6xl font-black text-white tracking-[0.35em] mb-4 relative z-10 font-mono">
                                    {orderConfirmed.pickup_code}
                                </p>
                                <p className="text-sm text-white/75 leading-relaxed relative z-10">
                                    Mostra questo codice al bancone<br />per ritirare il tuo ordine
                                </p>
                            </div>
                        )}

                        {/* Status */}
                        <div className="mb-8">
                            {orderConfirmed.status === 'in_attesa' && (
                                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-5 flex items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1A1A1A] dark:text-white">In attesa</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">La cucina riceverà presto il tuo ordine</p>
                                        {orderConfirmed.queue > 0 && (
                                            <p className="text-xs text-[#008081] font-bold mt-1">
                                                {orderConfirmed.queue} {orderConfirmed.queue === 1 ? 'ordine' : 'ordini'} davanti a te
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {orderConfirmed.status === 'in_preparazione' && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 flex items-center gap-4 border border-orange-200 dark:border-orange-900/50 shadow-sm">
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-2xl flex-shrink-0">👨‍🍳</div>
                                    <div>
                                        <p className="font-bold text-orange-700 dark:text-orange-300">In Preparazione</p>
                                        <p className="text-sm text-orange-600 dark:text-orange-400">I cuochi stanno preparando il tuo ordine!</p>
                                    </div>
                                </div>
                            )}
                            {orderConfirmed.status === 'pronto' && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 flex items-center gap-4 border border-green-200 dark:border-green-900/50 shadow-md">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🛎️</div>
                                    <div>
                                        <p className="font-black text-green-700 dark:text-green-300 text-lg">Ordine Pronto!</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">Il tuo ordine è pronto per il ritiro</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Queue panel */}
                        {publicOrders.length > 0 && (
                            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Stato ordini in tempo reale</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">In preparazione</p>
                                        <div className="flex flex-wrap gap-2">
                                            {publicOrders.filter(o => o.status === 'in_preparazione').map(o => (
                                                <span key={o.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-black text-sm px-3 py-1.5 rounded-xl">#{o.daily_order_number}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest mb-2">Pronti</p>
                                        <div className="flex flex-wrap gap-2">
                                            {publicOrders.filter(o => o.status === 'pronto').map(o => (
                                                <span key={o.id} className="bg-[#008081] text-white font-black text-sm px-3 py-1.5 rounded-xl">#{o.daily_order_number}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link to={`/${slug}`} className="block w-full bg-[#008081] text-white font-black py-4 rounded-2xl text-center shadow-lg hover:bg-[#006666] active:scale-[0.98] transition-all">
                            Torna al Menù
                        </Link>
                    </div>

                ) : cart.length === 0 ? (

                    /* ── Empty state ── */
                    <div className="py-16 animate-fade-in">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="w-9 h-9 text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-xl font-black text-[#1A1A1A] dark:text-white mb-1">Il tuo ordine è vuoto</p>
                            <p className="text-sm text-gray-400">Aggiungi prodotti dal menù per iniziare</p>
                            <Link to={`/${slug}`} className="inline-block mt-6 bg-[#008081] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#006666] active:scale-[0.98] transition-all">
                                Vai al Menù
                            </Link>
                        </div>

                        {/* Real-time queue even when empty */}
                        {publicOrders.length > 0 && (
                            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Stato ordini in tempo reale</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">In preparazione</p>
                                        <div className="flex flex-wrap gap-2">
                                            {publicOrders.filter(o => o.status === 'in_preparazione').map(o => (
                                                <span key={o.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-black text-sm px-3 py-1.5 rounded-xl">#{o.daily_order_number}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest mb-2">Pronti</p>
                                        <div className="flex flex-wrap gap-2">
                                            {publicOrders.filter(o => o.status === 'pronto').map(o => (
                                                <span key={o.id} className="bg-[#008081] text-white font-black text-sm px-3 py-1.5 rounded-xl">#{o.daily_order_number}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                ) : (

                    /* ── Cart with items ── */
                    <div className="pt-5 pb-6 animate-fade-in">

                        {/* Items list */}
                        <div className="space-y-3 mb-6">
                            {cart.map((item: any) => (
                                <div key={item.cartItemId} className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                                    <div className="flex gap-3">
                                        {/* Image */}
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 bg-gray-100"
                                        />

                                        {/* Content */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-bold text-[#1A1A1A] dark:text-white leading-tight">{item.name}</h4>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => removeFromCart(item.cartItemId)}
                                                    className="p-1 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex-shrink-0 -mr-1 -mt-0.5"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Extras */}
                                            {item.customizations?.added?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.customizations.added.map((a: any, i: number) => (
                                                        <span key={i} className="text-[10px] font-bold bg-[#008081]/10 text-[#008081] px-2 py-0.5 rounded-md">
                                                            + {a.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Note (if exists) */}
                                            {item.customizations?.notes && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1 leading-snug">
                                                    "{item.customizations.notes}"
                                                </p>
                                            )}

                                            {/* Price + controls */}
                                            <div className="flex items-center justify-between mt-2.5">
                                                <span className="text-[#008081] font-black text-sm">
                                                    €{(item.price * item.quantity).toFixed(2)}
                                                </span>
                                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-full px-3 py-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                                        className="w-6 h-6 flex items-center justify-center font-black text-gray-500 hover:text-red-500 transition-colors"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="font-black w-4 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => addToCart({ ...item })}
                                                        className="w-6 h-6 flex items-center justify-center font-black text-[#008081] hover:text-teal-700 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note button */}
                                    <button
                                        onClick={() => openNote(item.cartItemId, item.customizations?.notes || '')}
                                        className="mt-3 w-full flex items-center gap-2 text-xs text-gray-400 hover:text-[#008081] transition-colors border-t border-gray-50 dark:border-gray-800 pt-3"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{item.customizations?.notes ? 'Modifica nota' : 'Aggiungi una nota'}</span>
                                        <ChevronRight className="w-3 h-3 ml-auto" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Subtotale ({totalItems} {totalItems === 1 ? 'prodotto' : 'prodotti'})</span>
                                <span className="font-bold text-[#1A1A1A] dark:text-white">€{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800 mt-3">
                                <span className="font-black text-[#1A1A1A] dark:text-white">Totale</span>
                                <span className="text-2xl font-black text-[#008081]">€{totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Order type */}
                        <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tipo di ordine</p>
                            <div className="flex bg-gray-100 dark:bg-[#111] rounded-2xl p-1 mb-4">
                                <button
                                    onClick={() => setOrderType('tavolo')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${orderType === 'tavolo' ? 'bg-white dark:bg-[#252525] text-[#008081] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Al Tavolo
                                </button>
                                <button
                                    onClick={() => setOrderType('asporto')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${orderType === 'asporto' ? 'bg-white dark:bg-[#252525] text-[#008081] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Da Asporto
                                </button>
                            </div>

                            {orderType === 'tavolo' ? (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Numero tavolo</label>
                                    {tableFromQR ? (
                                        <div className="w-full p-4 bg-[#008081]/5 border border-[#008081]/30 rounded-2xl flex items-center justify-center gap-3">
                                            <Lock className="w-4 h-4 text-[#008081]" />
                                            <span className="text-2xl font-black text-[#008081]">{tableNumber}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#008081] bg-[#008081]/10 px-2 py-0.5 rounded-full">QR Tavolo</span>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Es. 5"
                                                value={tableNumber}
                                                onChange={e => setTableNumber(e.target.value)}
                                                className={`w-full p-4 bg-gray-50 dark:bg-[#111] border rounded-2xl outline-none focus:ring-2 dark:text-white text-center text-2xl font-black transition-all ${
                                                    !tableNumber.trim() ? 'border-red-300 dark:border-red-800 focus:ring-red-400/30' : 'border-gray-100 dark:border-gray-800 focus:ring-[#008081]'
                                                }`}
                                            />
                                            {!tableNumber.trim() && (
                                                <p className="text-xs font-bold text-red-500 mt-1.5">⚠ Obbligatorio — inserisci il numero del tuo tavolo</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Nome per il ritiro
                                    </label>
                                    {fidelityUser ? (
                                        /* Authenticated fidelity user — locked field */
                                        <div className="w-full p-4 bg-[#008081]/5 border border-[#008081]/30 rounded-2xl flex items-center gap-3">
                                            <span className="text-[#008081] text-xl">🌿</span>
                                            <div className="flex-1">
                                                <p className="font-black text-[#1A1A1A] dark:text-white text-base">{fidelityUser.name}</p>
                                                <p className="text-[10px] text-[#008081] font-bold uppercase tracking-wider mt-0.5">Profilo Fidelity verificato</p>
                                            </div>
                                            <Lock className="w-4 h-4 text-[#008081] flex-shrink-0" />
                                        </div>
                                    ) : (
                                        /* Anonymous user — editable field */
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Es. Mario Rossi"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                                className={`w-full p-4 bg-gray-50 dark:bg-[#111] border rounded-2xl outline-none focus:ring-2 dark:text-white font-bold transition-all ${
                                                    !customerName.trim() ? 'border-red-300 dark:border-red-800 focus:ring-red-400/30' : 'border-gray-100 dark:border-gray-800 focus:ring-[#008081]'
                                                }`}
                                            />
                                            {!customerName.trim() && (
                                                <p className="text-xs font-bold text-red-500 mt-1.5">⚠ Obbligatorio — inserisci il tuo nome per il ritiro</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <button
                            onClick={clearCart}
                            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 hover:text-red-500 py-3 transition-colors mb-3"
                        >
                            <Trash2 className="w-4 h-4" /> Svuota ordine
                        </button>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isConfirming || (orderType === 'tavolo' ? !tableNumber.trim() : (!fidelityUser && !customerName.trim()))}
                            className="w-full bg-[#008081] hover:bg-[#006666] text-white font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {isConfirming ? (
                                <span className="mx-auto flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Invio in corso...
                                </span>
                            ) : (
                                <>
                                    <span>Conferma ed Invia</span>
                                    <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-black">€{totalPrice.toFixed(2)}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>

            <BottomNav />

            {/* ── Note modal ── */}
            {noteOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setNoteOpen(null)}
                >
                    <div
                        className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#008081]" />
                                <h3 className="font-black text-[#1A1A1A] dark:text-white">Nota per il piatto</h3>
                            </div>
                            <button onClick={() => setNoteOpen(null)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Inserisci la tua richiesta..."
                            rows={3}
                            autoFocus
                            className="w-full p-4 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#008081] resize-none transition-all"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setNoteOpen(null)}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={saveNote}
                                className="flex-1 py-3 rounded-2xl bg-[#008081] text-white text-sm font-black hover:bg-[#006666] active:scale-[0.98] transition-all shadow-md"
                            >
                                Salva nota
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
