import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import db from '../db';
import BottomNav from '../components/BottomNav';
import NotFound from '../components/NotFound';

export default function OrdinePage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [notFound, setNotFound] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart(slug || null);

    const [isConfirming, setIsConfirming] = useState(false);
    const [orderType, setOrderType] = useState<'tavolo' | 'asporto'>('tavolo');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [orderConfirmed, setOrderConfirmed] = useState<{ id: string, shortId: string, dailyNumber: number, queue: number, status: string } | null>(null);
    const [publicOrders, setPublicOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!restaurantId) return;

        // Initial fetch of active orders
        const fetchOrders = async () => {
            const { data } = await db.from('orders')
                .select('id, daily_order_number, status, updated_at')
                .eq('restaurant_id', restaurantId)
                .in('status', ['in_preparazione', 'pronto'])
                .order('updated_at', { ascending: false });

            if (data) setPublicOrders(data);
        };
        fetchOrders();

        // Realtime subscription for global order tracking
        const globalChannel = db.channel(`global_orders_${restaurantId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                (payload: any) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newOrder = payload.new;
                        setPublicOrders(prev => {
                            if (newOrder.status !== 'in_preparazione' && newOrder.status !== 'pronto') {
                                return prev.filter(o => o.id !== newOrder.id);
                            }
                            const exists = prev.find(o => o.id === newOrder.id);
                            if (exists) {
                                return prev.map(o => o.id === newOrder.id ? { ...o, ...newOrder } : o).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                            } else {
                                return [{ ...newOrder }, ...prev].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                            }
                        });
                    } else if (payload.eventType === 'DELETE') {
                        if (payload.old && payload.old.id) {
                            setPublicOrders(prev => prev.filter(o => o.id !== payload.old.id));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            db.removeChannel(globalChannel);
        };
    }, [restaurantId]);

    useEffect(() => {
        if (!orderConfirmed?.id || orderConfirmed.id.startsWith('DEMO')) return;

        const personalChannel = db.channel(`personal_tracking_${orderConfirmed.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderConfirmed.id}` },
                (payload) => {
                    if (payload.new && payload.new.status) {
                        setOrderConfirmed(prev => prev ? { ...prev, status: payload.new.status } : null);
                    }
                }
            )
            .subscribe();

        return () => {
            db.removeChannel(personalChannel);
        };
    }, [orderConfirmed?.id]);

    useEffect(() => {
        async function loadRestaurant() {
            if (!slug) return;
            const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
            if (!resData) {
                setNotFound(true);
                return;
            }
            setRestaurantId(resData.id);
        }
        loadRestaurant();
    }, [slug]);

    if (notFound) {
        return <NotFound />;
    }

    const handleConfirmOrder = async () => {
        if (!restaurantId || cart.length === 0) return;
        setIsConfirming(true);

        try {
            if (slug && (slug.toLowerCase() === 'demo' || slug === import.meta.env.VITE_DEMO_SLUG)) {
                await new Promise(res => setTimeout(res, 1500));
                clearCart();
                setOrderConfirmed({
                    id: 'DEMO-' + Date.now(),
                    shortId: 'DEMO',
                    dailyNumber: Math.floor(Math.random() * 50) + 1,
                    queue: Math.floor(Math.random() * 5),
                    status: 'in_attesa'
                });
                return;
            }

            // Calculate daily sequence number (Local timezone logic)
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

            const { data: todayOrders, error: maxSeqError } = await db.from('orders')
                .select('daily_order_number')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay)
                .not('daily_order_number', 'is', null)
                .order('daily_order_number', { ascending: false })
                .limit(1);

            if (maxSeqError) throw maxSeqError;

            let nextOrderNumber = 1;
            if (todayOrders && todayOrders.length > 0 && todayOrders[0].daily_order_number) {
                nextOrderNumber = todayOrders[0].daily_order_number + 1;
            }

            const { data: orderData, error: orderError } = await db.from('orders').insert({
                restaurant_id: restaurantId,
                table_number: orderType === 'tavolo' ? tableNumber : null,
                customer_name: orderType === 'asporto' ? customerName : null,
                order_type: orderType,
                daily_order_number: nextOrderNumber,
                total_price: totalPrice
            }).select().single();

            if (orderError) throw orderError;

            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await db.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            const { count: queueCount } = await db.from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .in('status', ['in_attesa', 'in_preparazione'])
                .lt('created_at', orderData.created_at);

            clearCart();
            setOrderConfirmed({
                id: orderData.id,
                shortId: orderData.id.split('-')[0].toUpperCase(),
                dailyNumber: nextOrderNumber,
                queue: queueCount || 0,
                status: 'in_attesa'
            });
        } catch (e: any) {
            alert("Errore durante la conferma dell'ordine: " + e.message);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased transition-colors duration-200">
            <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-[#008080]" />
                </button>
                <h1 className="font-serif text-[1.35rem] font-extrabold tracking-[0.2em] uppercase text-center flex-grow text-[#1A1A1A] dark:text-white leading-none mt-1">Il tuo Ordine</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow px-4 pt-6 pb-24 overflow-y-auto">
                {!orderConfirmed ? (
                    cart.length === 0 ? (
                        <div className="flex flex-col animate-fade-in pb-10">
                            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                <span className="text-6xl mb-4">🛒</span>
                                <p className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">Il tuo ordine è vuoto</p>
                                <p className="text-gray-600 dark:text-gray-400">Aggiungi dei prodotti dal menù per iniziare.</p>
                                <Link to={`/${slug}`} className="mt-6 bg-gradient-to-r from-[#008080] to-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                    Vai al Menù
                                </Link>
                            </div>

                            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-8 w-full max-w-2xl mx-auto">
                                <h3 className="text-lg font-serif font-extrabold tracking-widest text-center text-[#1A1A1A] dark:text-white uppercase mb-6">Stato Ordini in tempo reale</h3>
                                {publicOrders.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-gray-800">
                                        <p className="text-gray-500 dark:text-gray-400 italic font-medium">Nessun ordine in corso. Il tuo sarà il primo!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* IN PREPARAZIONE COLUMN */}
                                        <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl p-4 border border-orange-100/50 dark:border-orange-900/30">
                                            <h4 className="text-center font-bold text-orange-600 dark:text-orange-400 text-sm tracking-wider uppercase mb-4 border-b border-orange-200/50 dark:border-orange-900/50 pb-2">In Preparazione</h4>
                                            <div className="flex flex-col gap-3">
                                                {publicOrders.filter(o => o.status === 'in_preparazione').map(order => (
                                                    <div key={order.id} className="bg-white dark:bg-[#252525] p-3 rounded-xl shadow-sm text-center border border-orange-100 dark:border-gray-700 transform transition-all hover:-translate-y-0.5">
                                                        <span className="text-2xl font-black text-gray-800 dark:text-white">{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                                                    </div>
                                                ))}
                                                {publicOrders.filter(o => o.status === 'in_preparazione').length === 0 && (
                                                    <div className="text-center text-orange-400/50 py-4 text-xs font-bold uppercase">Vuoto</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* PRONTO COLUMN */}
                                        <div className="bg-[#008080]/5 dark:bg-[#008080]/10 rounded-2xl p-4 border border-[#008080]/10 dark:border-[#008080]/20">
                                            <h4 className="text-center font-bold text-[#008080] dark:text-teal-400 text-sm tracking-wider uppercase mb-4 border-b border-[#008080]/20 dark:border-[#008080]/40 pb-2">Pronto</h4>
                                            <div className="flex flex-col gap-3">
                                                {publicOrders.filter(o => o.status === 'pronto').map(order => (
                                                    <div key={order.id} className="bg-[#008080] dark:bg-teal-600 p-3 rounded-xl shadow-md text-center transform transition-all animate-pulse-slow border border-[#008080]">
                                                        <span className="text-2xl font-black text-white">{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                                                    </div>
                                                ))}
                                                {publicOrders.filter(o => o.status === 'pronto').length === 0 && (
                                                    <div className="text-center text-[#008080]/40 py-4 text-xs font-bold uppercase">Vuoto</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-lg mx-auto w-full animate-fade-in">
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center bg-white dark:bg-[#252525] p-3 rounded-2xl border border-transparent dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                        <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-gray-900 dark:text-white tracking-wide">{item.name}</h4>
                                            <span className="text-sm text-[#008080] font-bold">{item.price.toFixed(2)}€</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-full p-1 border border-gray-200 dark:border-gray-700">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 transition-colors hover:text-red-500">-</button>
                                            <span className="font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center font-bold text-[#008080] transition-colors hover:text-teal-700">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Totale*</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{totalItems} prodotto/i nel tuo ordine</p>
                                    </div>
                                    <span className="text-3xl font-bold text-[#008080] dark:text-[#008080]">€ {totalPrice.toFixed(2)}</span>
                                </div>

                                <div className="mb-6 space-y-4">
                                    <div className="flex bg-gray-100 dark:bg-[#1A1A1A] rounded-xl p-1">
                                        <button
                                            onClick={() => setOrderType('tavolo')}
                                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${orderType === 'tavolo' ? 'bg-white dark:bg-[#252525] text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            Al Tavolo
                                        </button>
                                        <button
                                            onClick={() => setOrderType('asporto')}
                                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${orderType === 'asporto' ? 'bg-white dark:bg-[#252525] text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            Da Asporto
                                        </button>
                                    </div>

                                    {orderType === 'tavolo' ? (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Numero Tavolo</label>
                                            <input
                                                type="text"
                                                placeholder="Es. 5"
                                                className="w-full p-4 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[#008080] dark:text-white shadow-sm transition-shadow text-center text-xl font-bold"
                                                value={tableNumber}
                                                onChange={e => setTableNumber(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Nome per il Ritiro</label>
                                            <input
                                                type="text"
                                                placeholder="Es. Mario Rossi"
                                                className="w-full p-4 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-[#008080] dark:text-white shadow-sm transition-shadow font-bold"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={clearCart}
                                        className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl transition-colors uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                                    >
                                        <span>🗑️</span> Svuota ordine
                                    </button>
                                    <button
                                        onClick={handleConfirmOrder}
                                        disabled={isConfirming}
                                        className="w-full bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100 border-none"
                                    >
                                        {isConfirming ? (
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <><span>🧾</span> Conferma ed Invia in Cucina</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full py-12 animate-fade-in">
                        <div className="max-w-md w-full text-center">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <span className="text-5xl">✓</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ordine Ricevuto!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">Il tuo ordine è stato inviato in cucina con successo.</p>

                            <div className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-[#008080]/10 rounded-bl-full"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#008080]/10 rounded-tr-full"></div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Numero Ordine</p>
                                <p className="text-6xl font-black text-[#008080] tracking-tighter">
                                    <span className="text-2xl text-[#008080]/50 align-top mr-1">#</span>
                                    {orderConfirmed.dailyNumber}
                                </p>
                                <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest">ID Ref: {orderConfirmed.shortId}</p>
                            </div>

                            <div className="space-y-4 mb-8 text-left">
                                {orderConfirmed.status === 'in_attesa' && (
                                    <div className="bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm transition-all duration-500">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-[#333] rounded-full flex items-center justify-center text-2xl flex-shrink-0 grayscale">👨‍🍳</div>
                                        <div>
                                            <p className="font-bold text-lg">In Coda</p>
                                            <p className="text-sm">In attesa che la cucina inizi la preparazione.</p>
                                            {orderConfirmed.queue > 0 && (
                                                <p className="text-xs text-[#008080] font-bold mt-1">⏳ Hai {orderConfirmed.queue} {orderConfirmed.queue === 1 ? 'ordine' : 'ordini'} davanti a te.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {orderConfirmed.status === 'in_preparazione' && (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 text-[#D84315] dark:text-[#FFB74D] border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 flex items-center gap-4 shadow-md transition-all duration-500 animate-pulse-slow">
                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-2xl flex-shrink-0">👨‍🍳</div>
                                        <div>
                                            <p className="font-bold text-lg">In Preparazione</p>
                                            <p className="text-sm text-orange-700 dark:text-orange-300">I cuochi stanno preparando il tuo ordine!</p>
                                        </div>
                                    </div>
                                )}
                                {orderConfirmed.status === 'pronto' && (
                                    <div className="bg-green-50 dark:bg-green-900/20 text-[#2E7D32] dark:text-[#81C784] border border-green-200 dark:border-green-900/50 rounded-2xl p-6 flex items-center gap-4 shadow-xl transition-all duration-500 animate-bounce">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">🛎️</div>
                                        <div>
                                            <p className="font-black text-xl mb-1 uppercase tracking-tight">Ordine Pronto!</p>
                                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Il tuo ordine è caldo e pronto per il ritiro.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                to={`/${slug}`}
                                className="inline-block w-full bg-[#008080] hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                            >
                                Torna al Menù
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
