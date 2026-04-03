import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, X, Edit2, Menu as MenuIcon, Users, ShoppingBag, Receipt, Check, Wine, Utensils, Pizza, CakeSlice, Beef, ArrowLeft, Link } from 'lucide-react';
import db from '../db';
import { useCart, CartItem } from '../hooks/useCart';

type OrderType = 'tavolo' | 'asporto';
type Session = { type: OrderType; name: string } | null;
type Product = { id: string; name: string; description: string; price: number; price_unit: string|null; image_url: string; category_id: string; base_ingredients?: string[] };
type Category = { id: string; name: string; section: string };
type Table = { id: string; name: string; pax: number };
type Zone = { id: string; name: string; tables: Table[] };

const formatPrice = (p: number) => `€${p.toFixed(2)}`;
const getThumbnail = (url?: string) => {
    if (!url || url.startsWith('data:image')) return null;  // Block Base64
    // Use Supabase image render CDN for storage URLs for optimization
    if (url.includes('/storage/v1/object/public/'))
        return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=300&quality=80';
    // Pass through any other valid http URL directly
    if (url.startsWith('http')) return url;
    return null;
};
const MACROS = [{ id: 'Vino e Drinks', label: 'Vino e Drinks', icon: Wine }, { id: 'Cucina', label: 'Cucina', icon: Utensils }, { id: 'Pizza', label: 'Pizza', icon: Pizza }, { id: 'Dessert', label: 'Dessert', icon: CakeSlice }, { id: 'Menù del Giorno', label: 'Menù Giorno', icon: Beef }];
const getMacro = (c: Category) => {
    const s = c.section?.trim()||''; if (MACROS.some(m => m.id === s)) return s;
    const n = c.name.toLowerCase(), sl = s.toLowerCase();
    // Explicit overrides by exact category name
    if (c.name === 'I Nostri Dolci') return 'Dessert';
    if (sl==='vino e drinks' || sl.includes('bevande') || n.includes('vino') || n.includes('drink') || n.includes('bevande')) return 'Vino e Drinks';
    if (sl==='pizza' || n.includes('pizz')) return 'Pizza';
    if (sl==='dessert' || sl==='dolci' || sl==='postres' || sl.includes('dolc') || n.includes('dessert') || n.includes('dolce') || n.includes('dolci') || n.includes('postres') || n.includes('nostri dolci')) return 'Dessert';
    if (sl==='menù del giorno' || sl==='pranzo' || n.includes('giorno') || n.includes('pranzo')) return 'Menù del Giorno';
    return 'Cucina'; 
};

const SwipeableCartItem = ({ item, onRemove, onEdit }: { item: CartItem; onRemove: () => void; onEdit: () => void; key?: React.Key }) => {
    const [offset, setOffset] = useState(0);
    const startX = useRef(0), currentX = useRef(0), isDragging = useRef(false);
    return (
        <div className="relative overflow-hidden rounded-2xl bg-red-500 mb-3 shadow-sm border border-gray-100">
            <div className="absolute top-0 right-0 bottom-0 w-20 flex items-center justify-center text-white"><X className="w-6 h-6" /></div>
            <div className="bg-white p-3 flex items-start gap-3 transition-transform duration-200 ease-out active:duration-0 rounded-2xl w-full"
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={e => { startX.current = e.touches[0].clientX; isDragging.current = true; }}
                onTouchMove={e => { if(!isDragging.current) return; currentX.current = e.touches[0].clientX; setOffset(Math.max(currentX.current - startX.current, -80)); }}
                onTouchEnd={() => { isDragging.current = false; if (offset < -50) onRemove(); else setOffset(0); }}>
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center font-black text-[#008081] text-xs shrink-0">{item.quantity}x</div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-gray-900 text-sm truncate">{item.name}</h4>
                    {(item.customizations?.removed.length||0)>0 && <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Senza: {item.customizations?.removed.join(', ')}</p>}
                    {(item.customizations?.added.length||0)>0 && <p className="text-[9px] font-bold text-[#008081] uppercase mt-0.5">Extra: {item.customizations?.added.map(a=>a.name).join(', ')}</p>}
                    {item.customizations?.notes && <p className="text-[9px] font-bold text-amber-600 italic mt-0.5">"{item.customizations.notes}"</p>}
                    <p className="font-black mt-1">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={onRemove} className="p-2 bg-red-50 text-red-500 rounded-lg"><X className="w-3.5 h-3.5"/></button>
                    <button onClick={onEdit} className="p-2 bg-gray-50 text-gray-500 rounded-lg"><Edit2 className="w-3.5 h-3.5"/></button>
                </div>
            </div>
        </div>
    );
};

const DraggableTable = ({ t, zoneId, order, isEditMode, sel, inGroup, inOrderGroup, onDrop, onSelect }: any) => {
    const s = order ? (order.status==='conto'?'A':'O') : 'L';
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({x: t.x||0, y: t.y||0});
    useEffect(() => setPos({x: t.x||0, y: t.y||0}), [t.x, t.y]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditMode) return;
        e.preventDefault(); e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        const startX = e.clientX; const startY = e.clientY;
        const initX = pos.x; const initY = pos.y;
        
        const handleMove = (ev: PointerEvent) => {
            const parent = ref.current?.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const dx = ((ev.clientX - startX) / rect.width) * 100;
            const dy = ((ev.clientY - startY) / rect.height) * 100;
            setPos({ x: Math.max(0, Math.min(100, initX + dx)), y: Math.max(0, Math.min(100, initY + dy)) });
        };
        const handleUp = (ev: PointerEvent) => {
            const el = ev.target as HTMLElement;
            try { el.releasePointerCapture(ev.pointerId); } catch(err){}
            el.removeEventListener('pointermove', handleMove);
            el.removeEventListener('pointerup', handleUp);
            el.removeEventListener('pointercancel', handleUp);
            
            const parent = ref.current?.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const dx = ((ev.clientX - startX) / rect.width) * 100;
            const dy = ((ev.clientY - startY) / rect.height) * 100;
            onDrop(zoneId, t.id, Math.max(0, Math.min(100, initX + dx)), Math.max(0, Math.min(100, initY + dy)));
        };

        const el = e.target as HTMLElement;
        el.addEventListener('pointermove', handleMove);
        el.addEventListener('pointerup', handleUp);
        el.addEventListener('pointercancel', handleUp);
    };

    return (
        <div ref={ref} onPointerDown={handlePointerDown} onClick={() => !isEditMode && s==='L' && onSelect()}
             style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: isEditMode?'none':'auto' }} 
             className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center transition-all shadow-sm ${isEditMode ? 'cursor-move ring-4 ring-indigo-400 z-[90] scale-105' : 'cursor-pointer'} ${(inGroup || inOrderGroup) ? 'ring-4 ring-offset-2 ring-[#008081]/30 z-[60]' : 'z-[50]'} ${s==='O'?'bg-[#5C5C77] text-white':s==='A'?'bg-[#B19543] text-white border-4 border-yellow-300':sel?'bg-[#008081] text-white scale-105 shadow-xl shadow-[#008081]/20 z-[70]':'bg-[#E8E5FF] text-gray-500 hover:scale-105 hover:bg-[#d8d5ff]'}`}>
             {(inGroup || inOrderGroup) && <div className="absolute -top-3 -right-3 bg-white border border-gray-100 text-[#008081] p-1.5 rounded-full shadow-lg z-[80]"><Link className="w-3.5 h-3.5"/></div>}
             <span className="font-black text-xl sm:text-3xl pointer-events-none">{t.name}</span>
             {s==='A' ? <span className="bg-black/20 text-white mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase pointer-events-none">! CONTO</span> : <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1 pb-1 pointer-events-none">{t.pax} PAX</span>}
        </div>
    );
};

export default function Cameriere() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart(slug || null);

    const [restaurantId, setRestaurantId] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeMacro, setActiveMacro] = useState('Cucina');
    const [activeMicro, setActiveMicro] = useState('Tutti');
    
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);
    
    const [session, setSession] = useState<Session>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [extras, setExtras] = useState<any[]>([]);
    const [sale, setSale] = useState<Zone[]>([]);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [selectedTables, setSelectedTables] = useState<Table[]>([]);

    const [modals, setModals] = useState({ menu: false, floor: false, cart: false, history: false, newOrder: false });
    const toggleModal = (k: keyof typeof modals, v: boolean) => setModals(p => ({ ...p, [k]: v }));
    
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null);
    const triggerToast = (msg: string, type: 'success'|'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
    
    const [selProduct, setSelProduct] = useState<Product | null>(null);
    const [modAdded, setModAdded] = useState<{ name: string; price: number }[]>([]);
    const [modRemoved, setModRemoved] = useState<string[]>([]);
    const [modNotes, setModNotes] = useState('');
    const [editItemId, setEditItemId] = useState<string | null>(null);

    const [tmpOrder, setTmpOrder] = useState<{type: OrderType, name: string, product: Product|null}>({type: 'tavolo', name: '', product: null});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                let rId = null;
                const auth = await db.auth.getUser();
                if (auth.data?.user) {
                    // Exclude demo restaurants (same logic as Gestione.tsx), pick newest real restaurant
                    const { data, error } = await db.from('restaurants')
                        .select('id, slug')
                        .eq('user_id', auth.data.user.id)
                        .neq('slug', 'demo')
                        .not('slug', 'ilike', '%demo%')
                        .order('created_at', { ascending: false })
                        .limit(1).maybeSingle();
                    if (error) console.error("Error validando usuario UUID:", error);
                    if (data) rId = data.id;
                }
                if (!rId || !mounted) return;
                setRestaurantId(rId);

                const [{ data: c }, { data: e }, { data: o }, { data: sOpts }] = await Promise.all([
                    db.from('categories').select('id,name,section').eq('restaurant_id', rId).order('name'),
                    db.from('product_extras').select('id,name,category,price,available').eq('restaurant_id', rId).eq('available', true),
                    db.from('orders').select('id, table_number, status, total_price').eq('restaurant_id', rId).neq('status', 'consegnato'),
                    db.from('settings').select('value').eq('restaurant_id', rId).eq('key', 'sale').limit(1).maybeSingle()
                ]);
                
                if (sOpts && (sOpts as any)?.value) {
                    try {
                        let parsed = (sOpts as any).value;
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                        if (Array.isArray(parsed) && mounted) setSale(parsed);
                    } catch(err) { console.error("Error parsing sale config:", err); }
                }
                
                const channel = db.channel(`settings-${rId}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `restaurant_id=eq.${rId}` }, (payload) => {
                        if ((payload.new as any)?.key === 'sale') {
                            try {
                                let parsed = (payload.new as any).value;
                                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                                if (Array.isArray(parsed)) setSale(parsed);
                            } catch(e) {}
                        }
                    }).subscribe();
                
                if (o && mounted) setActiveOrders(o);
                
                if (c && mounted) {
                    setCategories(c);
                    if (c.length) {
                        const m = c.find(x=>x.section)?.section || 'Tutti';
                        setActiveMacro(m);
                        const firstMac = c.filter(x=>x.section===m)[0];
                        if(firstMac) setActiveMicro(firstMac.id);
                    }
                }
                if (e && mounted) setExtras(e);

                const { data: p, error: pErr } = await db.from('products').select('id,name,description,price,price_unit,image_url,category_id,base_ingredients').eq('restaurant_id', rId).order('name');
                if (pErr) console.error("Error loading products:", pErr);
                if (p && mounted) setProducts(p);
            } catch (err) {
                console.error("[Cameriere] Critical Error in loadData:", err);
            }
        })();
        return () => { mounted = false; db.removeAllChannels(); };
    }, [navigate, slug]);

    const curMacros = useMemo(() => categories.filter(c => getMacro(c) === activeMacro), [categories, activeMacro]);

    const filtered = useMemo(() => {
        let p = products;
        if (debouncedSearch) return p.filter(x => x.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
        p = p.filter(x => categories.find(c => c.id === x.category_id && getMacro(c) === activeMacro));
        return activeMicro !== 'Tutti' ? p.filter(x => x.category_id === activeMicro) : p;
    }, [products, debouncedSearch, activeMacro, activeMicro, categories]);

    const sortedCart = useMemo(() => {
        const pr = { 'Pizza': 1, 'Cucina': 1, 'Menù del Giorno': 1, 'Vino e Drinks': 3, 'Dessert': 4 };
        return [...cart].sort((a, b) => {
            const cA = categories.find(c => c.id === products.find(p=>p.id===a.id)?.category_id);
            const cB = categories.find(c => c.id === products.find(p=>p.id===b.id)?.category_id);
            return (cA ? pr[getMacro(cA) as keyof typeof pr]||99 : 99) - (cB ? pr[getMacro(cB) as keyof typeof pr]||99 : 99);
        });
    }, [cart, products, categories]);

    const openModifiers = (p: Product, skipSession = false) => {
        if (!session && !skipSession) { setTmpOrder({ type: 'tavolo', name: '', product: p }); toggleModal('newOrder', true); return; }
        setEditItemId(null); setSelProduct(p); setModAdded([]); setModRemoved([]); setModNotes('');
    };

    const confirmOrderSession = () => {
        if (!tmpOrder.name.trim()) return;
        setSession({ type: tmpOrder.type, name: tmpOrder.name });
        toggleModal('newOrder', false);
        if (tmpOrder.product) openModifiers(tmpOrder.product, true);
    };

    const confirmMods = () => {
        if (!selProduct) return;
        if (editItemId) removeFromCart(editItemId);
        addToCart({
            id: selProduct.id, name: selProduct.name, price: selProduct.price + modAdded.reduce((s,i)=>s+i.price,0),
            price_unit: selProduct.price_unit, image_url: selProduct.image_url,
            customizations: { removed: modRemoved, added: modAdded, notes: modNotes }
        }, 1);
        setSelProduct(null); setEditItemId(null);
        if (editItemId) toggleModal('cart', true);
    };

    const sendOrder = async () => {
        if (!cart.length || !session || !restaurantId) return;
        try {
            const tableStr = session.type === 'asporto' ? 'Asporto' : `Tavolo ${session.name}`;
            const { data: o, error } = await db.from('orders').insert({
                restaurant_id: restaurantId, table_number: tableStr, customer_name: session.type === 'asporto' ? session.name : tableStr,
                total_price: totalPrice, status: 'in_attesa', order_type: session.type
            }).select().single();
            if (error || !o) throw new Error();
            
            await db.from('order_items').insert(cart.map(i => ({
                order_id: o.id, product_id: i.id, quantity: i.quantity, price_at_time: i.price,
                notes: [...(i.customizations?.removed.map(r=>`Senza ${r}`)||[]), ...(i.customizations?.added.map(a=>`Extra ${a.name}`)||[]), ...(i.customizations?.notes?[`Nota: ${i.customizations.notes}`]:[])].join(', ')
            })));
            
            setActiveOrders(prev => [...prev, { id: o.id, table_number: o.table_number, status: o.status, total_price: o.total_price }]);
            clearCart(); toggleModal('cart', false); setSession(null); triggerToast("Ordine inviato con successo!", "success");
        } catch (e) { triggerToast("Errore nell'invio dell'ordine.", "error"); }
    };

    return (
        <div className="flex h-[100dvh] w-full bg-white font-sans text-gray-900 overflow-hidden select-none">
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-up bg-white rounded-[2rem] p-3 pr-6 shadow-2xl border border-gray-100 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toast.type==='success'?'bg-teal-50 text-[#008081]':'bg-red-50 text-red-500'}`}>
                        {toast.type==='success'?<Check className="w-5 h-5"/>:<X className="w-5 h-5"/>}
                    </div>
                    <span className="font-extrabold text-[13px] uppercase">{toast.msg}</span>
                </div>
            )}

            <div className="w-[85px] border-r border-gray-50 flex flex-col items-center py-4 shrink-0 z-[40] bg-white h-full relative">
                <button onClick={() => navigate('/gestione')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100/50 hover:bg-gray-100 mb-4 shrink-0 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                <div className="flex-1 w-full flex flex-col items-center gap-1 overflow-y-auto no-scrollbar pt-2 pb-24">
                    {MACROS.map(m => (
                        <button key={m.id} onClick={() => { setActiveMacro(m.id); setActiveMicro('Tutti'); setSearchQuery(''); }} className={`w-[72px] py-4 flex flex-col items-center justify-center gap-2 rounded-2xl relative transition-colors ${activeMacro === m.id && !searchQuery ? 'text-[#008081] bg-[#008081]/10' : 'text-gray-400 hover:bg-gray-50'}`}>
                            <m.icon className="w-5 h-5" /><span className="text-[9px] font-black uppercase tracking-widest leading-none text-center px-1">{m.label}</span>
                            {activeMacro === m.id && !searchQuery && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#008081] rounded-r-md" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full bg-[#FBFBFB] relative min-w-0">
                <div className="h-14 bg-white border-b border-gray-100 px-4 md:px-6 flex items-center shrink-0 z-10 gap-3 md:gap-4">
                    <button onClick={() => toggleModal('menu', true)} className="p-2 -ml-2 bg-gray-50 md:bg-transparent rounded-xl text-gray-600"><MenuIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                    <div className="flex-1 flex items-center gap-2 font-black text-[11px] md:text-[13px] uppercase tracking-widest truncate">
                        <span className="text-gray-400 hidden sm:inline">Dashboard</span><span className="text-gray-300 hidden sm:inline">/</span><span className="truncate">{searchQuery ? 'Ricerca' : activeMacro}</span>
                    </div>
                    {session && <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-[#008081] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0">{session.type === 'asporto' ? <ShoppingBag className="w-3 h-3"/> : <Users className="w-3 h-3"/>}{session.name}</div>}
                </div>

                <div className="flex flex-col md:flex-row bg-white border-b border-gray-50 shrink-0 z-[30]">
                    <div className="w-full md:flex-1 flex items-center px-4 md:px-6 py-2 md:py-0 h-[52px] md:h-16 gap-3 overflow-x-auto no-scrollbar order-1 md:order-2 border-b md:border-b-0 border-gray-50 shrink-0">
                        {!searchQuery && curMacros.length > 0 && ['Tutti', ...curMacros.map(c=>c.id)].map(id => (
                            <button key={id} onClick={() => setActiveMicro(id)} className={`px-4 md:px-5 py-2 rounded-full border transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeMicro === id ? 'border-[#008081] text-[#008081] bg-[#008081]/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {id === 'Tutti' ? 'Tutti' : curMacros.find(x=>x.id===id)?.name}
                            </button>
                        ))}
                    </div>
                    <div className="w-full md:w-1/3 md:min-w-[280px] lg:min-w-[320px] relative h-[52px] md:h-16 flex items-center px-6 md:border-r border-gray-50 bg-white order-2 md:order-1 shrink-0">
                        <Search className="absolute left-6 w-4 h-4 text-[#008081] md:text-gray-400" />
                        <label htmlFor="search-input" className="sr-only">Cerca prodotto</label>
                        <input id="search-input" name="search-input" type="text" placeholder="Cerca prodotto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-full bg-transparent border-none pl-8 pr-4 text-[13px] md:text-[14px] font-bold text-gray-800 outline-none" />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 text-gray-400 p-1"><X className="w-4 h-4"/></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hidden-scrollbar p-3 md:p-5 pb-32">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                        {filtered.map(p => (
                            <div key={p.id} onClick={() => openModifiers(p)} className="bg-white rounded-2xl p-2 flex flex-col border border-gray-100 shadow-sm active:scale-95 md:hover:-translate-y-1 transition-transform cursor-pointer">
                                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">{getThumbnail(p.image_url) ? <img src={getThumbnail(p.image_url)!} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" /> : <Utensils className="w-8 h-8 text-gray-300" />}</div>
                                <div className="px-1.5 pb-1 flex flex-col flex-1 justify-between"><h4 className="font-extrabold text-[11px] md:text-[12px] uppercase leading-snug">{p.name}</h4><span className="font-black text-[#008081] text-[13px] md:text-[14px] mt-2">{formatPrice(p.price)}</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute right-4 md:right-6 bottom-4 md:bottom-6 flex flex-col gap-3 md:gap-4 z-[50]">
                    <button onClick={() => toggleModal('cart', true)} className="bg-white border-2 border-[#008081] text-[#008081] px-4 md:px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 transition-transform">
                        <Receipt className="w-5 h-5 hidden sm:block" />
                        <div className="flex flex-col text-left"><span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Il tuo ticket</span><span className="font-black text-[14px] md:text-[15px]">{formatPrice(totalPrice)}</span></div>
                        {totalItems > 0 && <div className="bg-[#008081] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black absolute -top-1.5 -right-1.5">{totalItems}</div>}
                    </button>
                    <button onClick={() => { setTmpOrder({type:'tavolo', name:'', product:null}); toggleModal('newOrder', true); }} className="bg-[#008081] text-white p-3 md:p-4 rounded-2xl shadow-lg flex justify-center active:scale-95 transition-transform self-end"><Plus className="w-6 h-6" /></button>
                </div>
            </div>

            {modals.menu && (
                <div className="fixed inset-0 z-[100] flex"><div className="absolute inset-0 bg-black/40" onClick={() => toggleModal('menu', false)} />
                    <div className="w-64 md:w-72 bg-[#FBFBFB] h-full relative z-10 flex flex-col animate-fade-in-right">
                        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between bg-white"><h2 className="font-black text-lg text-[#008081] uppercase">POS MENU</h2><button onClick={() => toggleModal('menu', false)} className="p-2 bg-gray-50 rounded-full"><X className="w-4 h-4"/></button></div>
                        <div className="p-4 space-y-2">
                            <button onClick={() => { toggleModal('menu', false); toggleModal('floor', true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-transparent"><div className="w-10 h-10 bg-purple-50 rounded-xl text-purple-600 shrink-0 flex items-center justify-center"><Users className="w-5 h-5"/></div><div className="text-left"><h3 className="font-black text-[12px] md:text-sm uppercase">Gestione Tavoli</h3></div></button>
                            <button onClick={() => { toggleModal('menu', false); toggleModal('history', true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-transparent"><div className="w-10 h-10 bg-amber-50 rounded-xl text-amber-600 shrink-0 flex items-center justify-center"><ShoppingBag className="w-5 h-5"/></div><div className="text-left"><h3 className="font-black text-[12px] md:text-sm uppercase">Storico Ordini</h3></div></button>
                        </div>
                    </div>
                </div>
            )}

            {modals.newOrder && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => toggleModal('newOrder', false)} />
                    <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 relative z-10 animate-fade-in-up">
                        <button onClick={() => { setSelectedTables([]); toggleModal('newOrder', false); }} className="absolute top-5 right-5 p-2 bg-gray-50 rounded-full"><X className="w-5 h-5"/></button>
                        <h2 className="text-[16px] sm:text-xl font-black mb-6 uppercase">Nuovo Ordine</h2>
                        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8"><button onClick={() => setTmpOrder({...tmpOrder, type:'tavolo'})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${tmpOrder.type==='tavolo'?'bg-white text-[#008081]':'text-gray-400'}`}>Tavolo</button><button onClick={() => setTmpOrder({...tmpOrder, type:'asporto'})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${tmpOrder.type==='asporto'?'bg-white text-[#008081]':'text-gray-400'}`}>Da Asporto</button></div>
                        <div className="space-y-2 mb-8">
                            <label htmlFor="order-name" className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nome O TAVOLO</label>
                            <input id="order-name" name="order-name" autoFocus type="text" value={tmpOrder.name} onChange={e=>setTmpOrder({...tmpOrder, name: e.target.value})} className="w-full bg-[#f4f5f7] rounded-xl px-4 py-3 font-bold text-[13px] uppercase outline-none" />
                        </div>
                        <button onClick={confirmOrderSession} disabled={!tmpOrder.name.trim()} className="w-full bg-[#008081] disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-black uppercase text-[11px] active:scale-95 shadow-lg shadow-[#008081]/20">Conferma</button>
                    </div>
                </div>
            )}

            {selProduct && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/40" onClick={() => setSelProduct(null)} />
                    <div className="bg-white w-full max-w-sm rounded-[2rem] flex flex-col relative z-10 max-h-[90vh] shadow-2xl animate-fade-in-up"><div className="p-4 border-b bg-gray-50/50 flex items-start gap-4 rounded-t-[2rem]"><div className="flex-1 min-w-0 pr-2"><h2 className="text-[16px] font-black uppercase">{selProduct.name}</h2><p className="text-[#008081] font-black text-[13px]">{formatPrice(selProduct.price)}</p></div><button onClick={() => setSelProduct(null)} className="p-2 bg-white rounded-full"><X className="w-4 h-4"/></button></div>
                        <div className="p-5 overflow-y-auto hidden-scrollbar space-y-6 flex-1 bg-white">
                            <div><h3 className="font-black text-red-500 uppercase text-[9px] mb-2 flex items-center gap-1"><Minus className="w-3 h-3"/> SENZA</h3>
                            {(() => {
                                const explicit = selProduct.base_ingredients || [];
                                const fromDesc = selProduct.description
                                    ? selProduct.description.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    : [];
                                const ingredients = explicit.length > 0 ? explicit : fromDesc;
                                return ingredients.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">{ingredients.map((ing: string) => <button key={ing} onClick={() => setModRemoved(p => p.includes(ing) ? p.filter(x => x !== ing) : [...p, ing])} className={`py-2 px-3 rounded-full font-black text-[10px] uppercase border transition-colors ${modRemoved.includes(ing) ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 border-red-100 text-red-600'}`}>{ing}</button>)}</div>
                                ) : <p className="text-[10px] font-bold text-gray-400 uppercase">Nessun ingrediente configurato</p>;
                            })()}
                            </div>
                            <div><h3 className="font-black text-[#008081] uppercase text-[9px] mb-2 flex items-center gap-1"><Plus className="w-3 h-3"/> EXTRA</h3><div className="flex flex-wrap gap-2">{extras.map(e=>{const sel=modAdded.find(x=>x.name===e.name); return <button key={e.name} onClick={()=>setModAdded(p=>sel?p.filter(x=>x.name!==e.name):[...p,{name:e.name,price:e.price}])} className={`py-2 px-3 rounded-full font-black text-[10px] uppercase border flex gap-1.5 transition-colors ${sel?'bg-[#008081] text-white':'bg-teal-50 border-teal-100 text-[#008081]'}`}><span>{e.name}</span><span className="text-[8px] opacity-80">+{formatPrice(e.price)}</span></button>})}</div></div>
                            <div><h3 className="font-black text-gray-400 uppercase text-[9px] mb-2">NOTA</h3><textarea id="mod-notes" name="mod-notes" value={modNotes} onChange={e=>setModNotes(e.target.value)} placeholder="Scrivi una nota per la cucina..." className="w-full bg-[#f4f5f7] rounded-2xl p-4 text-[12px] font-bold outline-none min-h-[80px] resize-none" /></div>
                        </div>
                        <div className="p-4 pt-0 bg-gray-50/30 rounded-b-[2rem]"><button onClick={confirmMods} className="w-full bg-[#008081] text-white py-3 rounded-xl font-black uppercase text-[11px] mt-4 active:scale-95">Aggiungi</button></div>
                    </div>
                </div>
            )}

            {modals.cart && (
                <div className="fixed inset-0 z-[100] flex justify-end"><div className="absolute inset-0 bg-black/40" onClick={() => toggleModal('cart', false)} />
                    <div className="w-full sm:w-[380px] bg-[#FBFBFB] h-full relative z-10 flex flex-col"><div className="bg-white p-4 border-b flex items-center justify-between"><div><h2 className="font-black text-[16px] uppercase">Il Ticket</h2>{session && <p className="text-[9px] font-bold text-[#008081] mt-0.5 uppercase">{session.type}: {session.name}</p>}</div><button onClick={() => toggleModal('cart', false)} className="p-2 bg-gray-50 rounded-xl"><X className="w-4 h-4"/></button></div>
                        <div className="flex-1 overflow-y-auto p-3">{!sortedCart.length ? <div className="text-center py-20 opacity-40"><Receipt className="w-10 h-10 mx-auto mb-4"/></div> : <div className="space-y-3">{sortedCart.map(item => <SwipeableCartItem key={item.cartItemId} item={item} onRemove={()=>removeFromCart(item.cartItemId)} onEdit={()=>{ toggleModal('cart',false); setEditItemId(item.cartItemId); openModifiers(products.find(p=>p.id===item.id)!, true); }}/>)}</div>}</div>
                        <div className="bg-white border-t p-4 pt-4 shrink-0 space-y-4"><div className="flex justify-between items-center"><span className="font-black text-gray-400 text-[10px] uppercase">Totale</span><span className="font-black text-2xl text-[#008081]">{formatPrice(totalPrice)}</span></div><button onClick={sendOrder} disabled={!totalItems||!session} className="w-full bg-[#008081] disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-black uppercase text-[11px] active:scale-95"><Check className="w-4 h-4 inline-block mr-2"/>Invia</button></div>
                    </div>
                </div>
            )}

            {modals.floor && (
                <div className="fixed inset-0 z-[120] flex flex-col bg-[#FBFBFB] animate-fade-in-up">
                    <div className="bg-white p-4 flex items-center justify-between border-b shrink-0">
                        <div><h2 className="font-black text-[15px] uppercase">Sala</h2></div>
                        <div className="flex gap-4 items-center">
                            <button onClick={() => { setIsEditMode(!isEditMode); setSelectedTables([]); }} className={`px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors ${isEditMode ? 'bg-[#008081] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {isEditMode ? '✓ Fine' : 'Modifica Layout'}
                            </button>
                            <div className="hidden md:flex gap-3 px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 uppercase"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#E8E5FF]"/>Libre</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#5C5C77]"/>Ocupata</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#B19543]"/>Conto</span></div>
                            <button onClick={() => { setSelectedTables([]); toggleModal('floor', false); setIsEditMode(false); }} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
                        </div>
                    </div>
                    <div className="flex-1 relative w-full h-full overflow-auto touch-pan-x touch-pan-y bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px] pb-32">
                        {sale.length === 0 ? <p className="text-gray-400 font-bold uppercase p-10 text-center text-[11px] tracking-widest">Configura la tua sala nelle impostazioni.</p> :
                        <div className="p-6 md:p-8 space-y-12 min-w-max">
                            {sale.map(z => (
                                <div key={z.id}>
                                    <h3 className="font-black text-lg md:text-xl mb-6 text-gray-400 uppercase tracking-widest px-2">{z.name}</h3>
                                    <div className={`relative w-full h-[400px] sm:h-[600px] border-2 mt-4 rounded-3xl overflow-hidden touch-none transition-colors ${isEditMode ? 'border-[#008081] border-dashed bg-teal-50/30 ring-4 ring-[#008081]/10' : 'border-gray-200 border-dashed bg-white/50'}`}>
                                        {z.tables.map((t: any) => {
                                            const order = activeOrders.find(o => o.table_number.includes(t.name));
                                            const sel = selectedTables.some(x=>x.id===t.id);
                                            const inGroup = selectedTables.length>1 && sel;
                                            const inOrderGroup = order && order.table_number.includes('+');
                                            
                                            return <DraggableTable key={t.id} t={t} zoneId={z.id} order={order} isEditMode={isEditMode} sel={sel} inGroup={inGroup} inOrderGroup={inOrderGroup} onSelect={()=>setSelectedTables(p=>p.some(x=>x.id===t.id)?p.filter(x=>x.id!==t.id):[...p,t])} onDrop={async (zId: string, tId: string, nx: number, ny: number) => {
                                                setSale(prev => {
                                                    const ns = prev.map(zo => zo.id === zId ? {...zo, tables: zo.tables.map(ta => ta.id === tId ? {...ta, x: nx, y: ny} : ta)} : zo);
                                                    db.from('settings').upsert({ restaurant_id: restaurantId, key: 'sale', value: JSON.stringify(ns) }).then(()=>triggerToast("Posizione salvata", "success"));
                                                    return ns;
                                                });
                                            }}/>
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </div>
                    {selectedTables.length > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-center gap-6 w-11/12 max-w-sm animate-fade-in-up z-[130]">
                            <div className="flex-1">
                                <h4 className="font-black text-sm uppercase text-[#008081] leading-none mb-1">{selectedTables.length} {selectedTables.length===1?'Tavolo':'Tavoli'}</h4>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedTables.reduce((sum,t)=>sum+t.pax,0)} PAX TOTALI</p>
                            </div>
                            <button onClick={() => {
                                toggleModal('floor', false);
                                setTmpOrder({ type:'tavolo', name: selectedTables.map(t=>t.name).join('+'), product:null });
                                toggleModal('newOrder', true);
                            }} className="bg-[#008081] text-white px-5 py-3.5 rounded-xl font-black text-[11px] uppercase active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform">Nuovo Ordine</button>
                        </div>
                    )}
                </div>
            )}

            {modals.history && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#FBFBFB]">
                     <button onClick={() => toggleModal('history', false)} className="absolute top-5 right-5 p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
                     <div className="text-center"><ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" /><h2 className="font-black text-[16px] uppercase">Storico</h2></div>
                </div>
            )}
        </div>
    );
}
