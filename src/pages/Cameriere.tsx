import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, X, Edit2, Users, Check,
  Wine, Utensils, Pizza, CakeSlice, Beef, ArrowLeft,
  Link, Receipt, ShoppingBag, Moon, Sun,
  Printer, Clock,
} from 'lucide-react';
import db from '../db';
import { useCart, CartItem } from '../hooks/useCart';

// ── Types ────────────────────────────────────────────────────────────────────
type OrderType = 'tavolo' | 'asporto';
// fromFloor=true means the name already contains zone info ("Sala X · T4"), no "Tavolo" prefix needed
// existingOrderId=set means we're adding to an existing order rather than creating a new one
type Session = { type: OrderType; name: string; fromFloor?: boolean; pax?: number; existingOrderId?: string } | null;
type Product = { id: string; name: string; description: string; price: number; price_unit: string | null; image_url: string; category_id: string; base_ingredients?: string[] };
type Category = { id: string; name: string; section: string };
type Table = { id: string; name: string; pax: number; x: number; y: number };
type Zone = { id: string; name: string; tables: Table[] };

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (p: number) => `€${p.toFixed(2)}`;
const getThumbnail = (url?: string) => {
  if (!url || url.startsWith('data:image')) return null;
  if (url.includes('/storage/v1/object/public/'))
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=300&quality=80';
  if (url.startsWith('http')) return url;
  return null;
};

const MACROS = [
  { id: 'Cucina', label: 'Cucina', icon: Utensils },
  { id: 'Pizza', label: 'Pizza', icon: Pizza },
  { id: 'Vino e Drinks', label: 'Drinks', icon: Wine },
  { id: 'Dessert', label: 'Dessert', icon: CakeSlice },
  { id: 'Menù del Giorno', label: 'Giorno', icon: Beef },
];

const getMacro = (c: Category) => {
  const s = c.section?.trim() || '';
  if (MACROS.some(m => m.id === s)) return s;
  const n = c.name.toLowerCase(), sl = s.toLowerCase();
  if (c.name === 'I Nostri Dolci') return 'Dessert';
  if (sl.includes('bevande') || n.includes('vino') || n.includes('drink') || n.includes('bevande')) return 'Vino e Drinks';
  if (sl === 'pizza' || n.includes('pizz')) return 'Pizza';
  if (sl.includes('dolc') || n.includes('dessert') || n.includes('dolce') || n.includes('dolci')) return 'Dessert';
  if (sl.includes('giorno') || n.includes('giorno') || n.includes('pranzo')) return 'Menù del Giorno';
  return 'Cucina';
};

// ── Swipeable cart item (swipe-left reveals delete; undo toast on delete) ──────
function SwipeableCartItem({ item, onRequestUndo, onEdit }: {
  item: CartItem; onRequestUndo: (item: CartItem) => void; onEdit: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0), isDragging = useRef(false);
  const triggerDelete = () => { setOffset(0); onRequestUndo(item); };
  return (
    <div className="relative overflow-hidden rounded-none bg-red-500 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="absolute top-0 right-0 bottom-0 w-20 flex items-center justify-center text-white"><X className="w-6 h-6" /></div>
      <div
        className="bg-white dark:bg-[#2A2A2A] px-3 py-4 flex items-start gap-3 transition-transform duration-200 ease-out active:duration-0 w-full"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; isDragging.current = true; }}
        onTouchMove={e => { if (!isDragging.current) return; setOffset(Math.max(e.touches[0].clientX - startX.current, -80)); }}
        onTouchEnd={() => { isDragging.current = false; if (offset < -50) triggerDelete(); else setOffset(0); }}
      >
        <div className="w-8 h-8 bg-[#008081]/10 rounded-xl flex items-center justify-center font-black text-[#008081] text-xs shrink-0">{item.quantity}×</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-gray-900 dark:text-white text-sm truncate">{item.name}</h4>
          {(item.customizations?.removed.length || 0) > 0 && <p className="text-[9px] font-bold text-red-500 uppercase mt-0.5">Senza: {item.customizations?.removed.join(', ')}</p>}
          {(item.customizations?.added.length || 0) > 0 && <p className="text-[9px] font-bold text-[#008081] uppercase mt-0.5">Extra: {item.customizations?.added.map(a => a.name).join(', ')}</p>}
          {item.customizations?.notes && <p className="text-[9px] font-bold text-amber-600 italic mt-0.5">"{item.customizations.notes}"</p>}
          <p className="font-black text-sm mt-1 text-gray-900 dark:text-white">{fmt(item.price * item.quantity)}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={triggerDelete} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg"><X className="w-3.5 h-3.5" /></button>
          <button onClick={onEdit} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Status color system (shared with TavoliManager) ──────────────────────────
const TILE_STATUS: Record<string, { bg: string; ring?: string; pulse?: boolean }> = {
  libera:          { bg: 'bg-[#E8E5FF] dark:bg-[#2A2A3D]' },
  in_attesa:       { bg: 'bg-[#F97316]', ring: 'ring-[#F97316]/40' },
  in_preparazione: { bg: 'bg-[#3B82F6]', ring: 'ring-[#3B82F6]/40' },
  pronto:          { bg: 'bg-[#22C55E]', ring: 'ring-[#22C55E]/50', pulse: true },
  conto:           { bg: 'bg-[#B19543]', ring: 'ring-[#B19543]/40' },
};

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ── Table tile (floor plan) ───────────────────────────────────────────────────
function TableTile({ t, order, onSelect, onOccupiedTap, selected, inGroup }: {
  t: Table; order?: any; onSelect: () => void; onOccupiedTap: (order: any) => void; selected: boolean; inGroup: boolean;
}) {
  // Derive semantic status from order
  const statusKey = !order ? 'libera'
    : order.status === 'conto' ? 'conto'
    : (order.status as string); // in_attesa | in_preparazione | pronto

  const style = TILE_STATUS[statusKey] || TILE_STATUS.libera;
  const isLibera = statusKey === 'libera';
  const isPronte = statusKey === 'pronto';
  const mins = order ? minutesAgo(order.created_at || '') : 0;

  return (
    <div
      onClick={() => { if (isLibera) onSelect(); else if (order) onOccupiedTap(order); }}
      style={{ left: `${t.x || 10}%`, top: `${t.y || 10}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center transition-all shadow-md select-none z-50 cursor-pointer
        ${selected ? 'ring-4 ring-[#008081] scale-110 z-[70] shadow-xl' : ''}
        ${inGroup ? 'ring-4 ring-offset-2 ring-[#008081]/30 z-[60]' : ''}
        ${!selected && style.ring ? `ring-2 ${style.ring}` : ''}
        ${isPronte ? 'animate-pulse' : ''}
        ${selected ? 'bg-[#008081] text-white' : isLibera ? `${style.bg} text-[#5C5C77] dark:text-[#A0A0C0] hover:scale-105` : `${style.bg} text-white`}
      `}
    >
      {inGroup && !selected && (
        <div className="absolute -top-3 -right-3 bg-white dark:bg-[#2A2A2A] border border-gray-100 dark:border-gray-700 text-[#008081] p-1.5 rounded-full shadow-lg z-[80]">
          <Link className="w-3 h-3" />
        </div>
      )}
      <span className="font-black text-xl sm:text-2xl pointer-events-none leading-none">{t.name}</span>
      {isLibera ? (
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5 pointer-events-none">{t.pax}p</span>
      ) : statusKey === 'pronto' ? (
        <span className="text-[8px] font-black uppercase mt-0.5 pointer-events-none">PRONTO ✓</span>
      ) : statusKey === 'conto' ? (
        <span className="text-[8px] font-black uppercase mt-0.5 pointer-events-none">CONTO</span>
      ) : (
        <span className="text-[8px] font-bold mt-0.5 pointer-events-none opacity-90 flex items-center gap-0.5">
          {order?.covers ? <>{order.covers}p</> : null}
          {order?.covers && mins > 0 ? <span className="opacity-50">·</span> : null}
          {mins > 0 ? <>{mins}min</> : (!order?.covers ? '—' : null)}
        </span>
      )}
    </div>
  );
}

// ── Print receipt ─────────────────────────────────────────────────────────────
type PrintableOrder = { id: string; table_number: string; status: string; total_price: number; created_at: string; order_type: string; order_items: { id: string; quantity: number; notes: string; price_at_time: number; product: { name: string } | null }[] };
function printReceipt(order: PrintableOrder, restaurantName: string) {
  const time = new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(order.created_at).toLocaleDateString('it-IT');
  const items = order.order_items.map(i =>
    `<tr>
      <td style="padding:4px 8px;font-weight:700">${i.quantity}× ${i.product?.name || '—'}</td>
      <td style="padding:4px 8px;text-align:right;font-weight:700">${fmt(i.price_at_time * i.quantity)}</td>
    </tr>${i.notes ? `<tr><td colspan="2" style="padding:2px 8px 6px;font-size:10px;color:#888;font-style:italic">${i.notes}</td></tr>` : ''}`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ricevuta</title>
  <style>body{font-family:monospace;max-width:280px;margin:0 auto;padding:16px;font-size:12px}
  h1{font-size:16px;font-weight:900;text-align:center;text-transform:uppercase;margin:0 0 4px}
  .sub{text-align:center;color:#888;margin-bottom:12px;font-size:11px}
  hr{border:none;border-top:1px dashed #ccc;margin:8px 0}
  table{width:100%;border-collapse:collapse}
  .total td{font-weight:900;font-size:14px;border-top:1px solid #000;padding-top:8px}
  @media print{body{margin:0}}</style></head>
  <body>
  <h1>${restaurantName}</h1>
  <div class="sub">${date} · ${time}</div>
  <hr>
  <div style="font-weight:900;font-size:11px;text-transform:uppercase;margin-bottom:6px">
    ${order.order_type === 'asporto' ? '🛍 Asporto' : `🍽 ${order.table_number}`}
  </div>
  <hr>
  <table>${items}</table>
  <hr>
  <table class="total"><tr><td>TOTALE</td><td style="text-align:right">${fmt(order.total_price)}</td></tr></table>
  <div style="text-align:center;margin-top:16px;font-size:10px;color:#aaa">Leomenu · leomenu.it</div>
  </body></html>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ── PAX stepper (reusable) ────────────────────────────────────────────────────
function PaxStepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2 block flex items-center gap-1">
        <Users className="w-3 h-3" /> Coperti effettivi
      </label>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(1, value - 1))}
          className="w-10 h-10 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl font-black text-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors text-gray-700 dark:text-gray-300 active:scale-95">−</button>
        <span className="flex-1 text-center font-black text-2xl text-[#008081]">{value}</span>
        <button onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
          className="w-10 h-10 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl font-black text-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors text-gray-700 dark:text-gray-300 active:scale-95">+</button>
      </div>
      {max && <p className="text-[9px] text-gray-400 text-center mt-1 font-bold">Max {max} posti</p>}
    </div>
  );
}

// ── Manual order form (header button) ────────────────────────────────────────
function ManualOrderForm({ sale, activeOrders, tmpOrder, setTmpOrder, pax, setPax, onConfirm }: {
  sale: Zone[];
  activeOrders: any[];
  tmpOrder: { type: OrderType; name: string; product: any; fromFloor?: boolean };
  setTmpOrder: React.Dispatch<React.SetStateAction<any>>;
  pax: number;
  setPax: (n: number) => void;
  onConfirm: () => void;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    sale.length > 0 ? sale[0].id : null
  );

  const hasSale = sale.length > 0;
  const selectedZone = sale.find(z => z.id === selectedZoneId);

  const isTableOccupied = (zone: Zone, t: Table) => {
    const zoneKey = `${zone.name} · T${t.name}`;
    return activeOrders.some((o: any) => o.table_number === zoneKey || o.table_number === `Tavolo ${t.name}`);
  };

  const selectTable = (zone: Zone, t: Table) => {
    const qualifiedName = `${zone.name} · T${t.name}`;
    setTmpOrder((p: any) => ({ ...p, type: 'tavolo', name: qualifiedName, fromFloor: true }));
    // Pre-fill PAX from table capacity
    setPax(t.pax || 2);
  };

  const TypeToggle = () => (
    <div className="flex bg-gray-50 dark:bg-[#2A2A2A] p-1.5 rounded-2xl mb-4">
      {(['tavolo', 'asporto'] as OrderType[]).map(type => (
        <button key={type} onClick={() => { setTmpOrder((p: any) => ({ ...p, type, name: '', fromFloor: false })); if (type === 'asporto') setPax(1); }}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${tmpOrder.type === type ? 'bg-white dark:bg-[#3A3A3A] text-[#008081] shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}>
          {type === 'tavolo' ? 'Tavolo' : 'Da Asporto'}
        </button>
      ))}
    </div>
  );

  // Asporto mode — name input only
  if (tmpOrder.type === 'asporto' || !hasSale) {
    return (
      <>
        {hasSale && <TypeToggle />}
        <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2 block">
          {tmpOrder.type === 'tavolo' ? 'Numero Tavolo' : 'Nome Cliente'}
        </label>
        <input
          autoFocus type="text" value={tmpOrder.name}
          onChange={e => setTmpOrder((p: any) => ({ ...p, name: e.target.value, fromFloor: false }))}
          onKeyDown={e => e.key === 'Enter' && onConfirm()}
          className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-lg text-center uppercase outline-none focus:border-[#008081] dark:text-white mb-4 transition-colors"
        />
        {tmpOrder.type === 'tavolo' && (
          <div className="mb-4"><PaxStepper value={pax} onChange={setPax} /></div>
        )}
        <button onClick={onConfirm} disabled={!tmpOrder.name.trim()}
          className="w-full bg-[#008081] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white py-4 rounded-xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform">
          Conferma
        </button>
      </>
    );
  }

  // Tavolo mode with sale — zone tabs + table grid + PAX stepper
  return (
    <>
      <TypeToggle />

      {/* Zone tabs */}
      {sale.length > 1 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          {sale.map(z => (
            <button key={z.id} onClick={() => setSelectedZoneId(z.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                selectedZoneId === z.id ? 'bg-[#008081] text-white shadow-md shadow-[#008081]/30' : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400'
              }`}>
              {z.name}
            </button>
          ))}
        </div>
      )}

      {/* Table grid */}
      {selectedZone && (
        <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
          {selectedZone.tables.map(t => {
            const occupied = isTableOccupied(selectedZone, t);
            const qualifiedName = `${selectedZone.name} · T${t.name}`;
            const isSelected = tmpOrder.name === qualifiedName;
            return (
              <button key={t.id} disabled={occupied} onClick={() => selectTable(selectedZone, t)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all font-black text-xl active:scale-95
                  ${occupied ? 'bg-[#5C5C77] text-white opacity-60 cursor-not-allowed'
                  : isSelected ? 'bg-[#008081] text-white shadow-lg shadow-[#008081]/30 scale-105'
                  : 'bg-[#E8E5FF] dark:bg-[#2A2A3D] text-[#5C5C77] dark:text-[#A0A0C0] hover:bg-[#d8d5ff]'}`}
              >
                <span className="leading-none">{t.name}</span>
                <span className="text-[8px] font-bold opacity-70 mt-0.5">{t.pax}p</span>
              </button>
            );
          })}
        </div>
      )}

      {/* PAX stepper — shown when a table is selected */}
      {tmpOrder.name && (
        <div className="mb-4 bg-gray-50 dark:bg-[#252525] rounded-2xl p-3">
          <PaxStepper
            value={pax}
            onChange={setPax}
            max={selectedZone?.tables.find(t => tmpOrder.name.endsWith(`T${t.name}`))?.pax}
          />
        </div>
      )}

      {/* Selection feedback */}
      {tmpOrder.name ? (
        <div className="bg-[#008081]/10 dark:bg-[#008081]/20 border border-[#008081]/30 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase">Tavolo</span>
          <span className="font-black text-[#008081] text-sm">{tmpOrder.name}</span>
        </div>
      ) : (
        <p className="text-[10px] font-bold text-gray-400 text-center mb-3 uppercase tracking-widest">Seleziona un tavolo</p>
      )}

      <button onClick={onConfirm} disabled={!tmpOrder.name.trim()}
        className="w-full bg-[#008081] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white py-4 rounded-xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform">
        Conferma {tmpOrder.name && pax > 0 ? `· ${pax} cop.` : ''}
      </button>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Cameriere() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart(slug || null);

  // ── Dark mode ────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => localStorage.getItem('pos-dark') === '1');
  const toggleDark = () => setDark(d => { const n = !d; localStorage.setItem('pos-dark', n ? '1' : '0'); return n; });

  // ── Waiter name (persisted in localStorage, set once on first POS open) ──
  const [waiterName, setWaiterName] = useState(() => localStorage.getItem('pos-waiter') || '');
  const [showWaiterSetup, setShowWaiterSetup] = useState(() => !localStorage.getItem('pos-waiter'));
  const [showWaiterMenu, setShowWaiterMenu] = useState(false);
  const [waiterInput, setWaiterInput] = useState('');
  const confirmWaiter = () => {
    const name = waiterInput.trim();
    if (!name) return;
    localStorage.setItem('pos-waiter', name);
    setWaiterName(name);
    setShowWaiterSetup(false);
  };
  const exitPOS = () => {
    localStorage.removeItem('pos-waiter');
    setWaiterName('');
    setShowWaiterMenu(false);
    navigate('/gestione');
  };

  // ── App state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'tavoli' | 'menu' | 'carrello'>('tavoli');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeMacro, setActiveMacro] = useState('Cucina');
  const [activeMicro, setActiveMicro] = useState('Tutti');

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(h);
  }, [searchQuery]);

  const [session, setSession] = useState<Session>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [sale, setSale] = useState<Zone[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  // SelectedTable carries zoneName so orders are zone-qualified (avoids duplicate table names across zones)
  const [selectedTables, setSelectedTables] = useState<(Table & { zoneName: string })[]>([]);

  // Modals
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selProduct, setSelProduct] = useState<Product | null>(null);
  const [modAdded, setModAdded] = useState<{ name: string; price: number }[]>([]);
  const [modRemoved, setModRemoved] = useState<string[]>([]);
  const [modNotes, setModNotes] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [tmpOrder, setTmpOrder] = useState<{ type: OrderType; name: string; product: Product | null; fromFloor?: boolean }>({ type: 'tavolo', name: '', product: null });


  // Conto modal — desglose de la cuenta de una mesa
  type ContoData = { orderId: string; tableName: string; covers: number | null; items: { id: string; quantity: number; notes: string; price_at_time: number; product: { name: string } | null }[]; total: number };
  const [showConto, setShowConto] = useState(false);
  const [contoData, setContoData] = useState<ContoData | null>(null);
  const [contoLoading, setContoLoading] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Prodotti esauriti — shared via Supabase settings key "soldout_products"
  const [soldoutIds, setSoldoutIds] = useState<Set<string>>(new Set());
  const [soldoutMode, setSoldoutMode] = useState(false); // when true, tapping a product card toggles esaurito

  // Coperto — price per seated person, loaded from settings
  const [copertoPrice, setCopertoPrice] = useState<number>(0);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const triggerToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Undo-delete: removed item is held for 3s, removed for real only if user doesn't undo
  const [pendingRemove, setPendingRemove] = useState<{ item: CartItem; timer: ReturnType<typeof setTimeout> } | null>(null);
  const requestUndo = (item: CartItem) => {
    if (pendingRemove) { clearTimeout(pendingRemove.timer); removeFromCart(pendingRemove.item.cartItemId); }
    const timer = setTimeout(() => { removeFromCart(item.cartItemId); setPendingRemove(null); }, 3500);
    setPendingRemove({ item, timer });
  };
  const cancelUndo = () => {
    if (!pendingRemove) return;
    clearTimeout(pendingRemove.timer);
    setPendingRemove(null);
  };

  // PAX effettivi: how many guests actually seated (pre-filled from table pax, editable)
  const [paxEffettivi, setPaxEffettivi] = useState<number>(2);

  // Table action sheet — shown when cameriere taps an occupied table
  const [tableSheet, setTableSheet] = useState<{ table: Table; zone: Zone; order: any } | null>(null);

  // "Pronto" alert — track which order IDs were already notified
  const notifiedPronti = useRef<Set<string>>(new Set());
  const pronteOrders = activeOrders.filter(o => o.status === 'pronto');

  useEffect(() => {
    pronteOrders.forEach(o => {
      if (!notifiedPronti.current.has(o.id)) {
        notifiedPronti.current.add(o.id);
        triggerToast(`🍽 ${o.table_number} — PRONTO DA SERVIRE!`, 'success');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
      }
    });
    // Clean up IDs no longer in pronti
    notifiedPronti.current.forEach(id => {
      if (!pronteOrders.some(o => o.id === id)) notifiedPronti.current.delete(id);
    });
  }, [pronteOrders.map(o => o.id).join(',')]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await db.auth.getUser();
        if (!auth.data?.user) return;
        const { data } = await db.from('restaurants').select('id, slug, name')
          .eq('user_id', auth.data.user.id)
          .neq('slug', 'demo').not('slug', 'ilike', '%demo%')
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!data || !mounted) return;
        setRestaurantId(data.id);
        setRestaurantName(data.name || '');

        const [{ data: c }, { data: e }, { data: o }, { data: sOpts }, { data: soOpts }, { data: cpOpts }] = await Promise.all([
          db.from('categories').select('id,name,section').eq('restaurant_id', data.id).order('name'),
          db.from('product_extras').select('id,name,category,price,available').eq('restaurant_id', data.id).eq('available', true),
          db.from('orders').select('id,table_number,status,total_price,created_at,covers').eq('restaurant_id', data.id).neq('status', 'consegnato'),
          db.from('settings').select('value').eq('restaurant_id', data.id).eq('key', 'sale').limit(1).maybeSingle(),
          db.from('settings').select('value').eq('restaurant_id', data.id).eq('key', 'soldout_products').limit(1).maybeSingle(),
          db.from('settings').select('value').eq('restaurant_id', data.id).eq('key', 'coperto_price').limit(1).maybeSingle(),
        ]);

        if (!mounted) return;
        if (o) setActiveOrders(o);
        if (c) {
          setCategories(c);
          if (c.length) {
            const m = c.find(x => x.section)?.section || 'Cucina';
            setActiveMacro(m);
            const firstMicro = c.filter(x => x.section === m)[0];
            if (firstMicro) setActiveMicro(firstMicro.id);
          }
        }
        if (e) setExtras(e);
        if (sOpts?.value) {
          try {
            let parsed = typeof sOpts.value === 'string' ? JSON.parse(sOpts.value) : sOpts.value;
            if (Array.isArray(parsed) && mounted) setSale(parsed);
          } catch (_) {}
        }
        if (soOpts?.value) {
          try {
            let parsed = typeof soOpts.value === 'string' ? JSON.parse(soOpts.value) : soOpts.value;
            if (Array.isArray(parsed) && mounted) setSoldoutIds(new Set(parsed));
          } catch (_) {}
        }
        if (cpOpts?.value != null && mounted) {
          const v = parseFloat(cpOpts.value as string);
          if (!isNaN(v)) setCopertoPrice(v);
        }

        const { data: p } = await db.from('products').select('id,name,description,price,price_unit,image_url,category_id,base_ingredients').eq('restaurant_id', data.id).order('name');
        if (p && mounted) setProducts(p);

        // Realtime: orders + settings
        db.channel(`cam-${data.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${data.id}` }, () => {
            db.from('orders').select('id,table_number,status,total_price,created_at,covers').eq('restaurant_id', data.id).neq('status', 'consegnato')
              .then(({ data: od }) => { if (od && mounted) setActiveOrders(od); });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `restaurant_id=eq.${data.id}` }, payload => {
            const row = payload.new as any;
            if (row?.key === 'sale') {
              try {
                let parsed = row.value;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                if (Array.isArray(parsed)) setSale(parsed);
              } catch (_) {}
            }
            if (row?.key === 'soldout_products') {
              try {
                let parsed = row.value;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                if (Array.isArray(parsed)) setSoldoutIds(new Set(parsed));
              } catch (_) {}
            }
            if (row?.coperto_price != null) {
              const v = parseFloat(String(row.coperto_price));
              if (!isNaN(v)) setCopertoPrice(v);
            }
          })
          .subscribe();
      } catch (err) {
        console.error('[Cameriere] load error:', err);
      }
    })();
    return () => { mounted = false; db.removeAllChannels(); };
  }, []);

  // ── Soldout toggle ────────────────────────────────────────────────────────
  const toggleSoldout = async (productId: string) => {
    if (!restaurantId) return;
    const next = new Set(soldoutIds);
    if (next.has(productId)) next.delete(productId); else next.add(productId);
    setSoldoutIds(next);
    const arr = [...next];
    await db.from('settings').upsert(
      { restaurant_id: restaurantId, key: 'soldout_products', value: JSON.stringify(arr) },
      { onConflict: 'restaurant_id,key' }
    );
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const curMacros = useMemo(() => categories.filter(c => getMacro(c) === activeMacro), [categories, activeMacro]);
  const filtered = useMemo(() => {
    let p = products;
    if (debouncedSearch) return p.filter(x => x.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
    p = p.filter(x => categories.find(c => c.id === x.category_id && getMacro(c) === activeMacro));
    return activeMicro !== 'Tutti' ? p.filter(x => x.category_id === activeMicro) : p;
  }, [products, debouncedSearch, activeMacro, activeMicro, categories]);

  const sortedCart = useMemo(() => {
    const pr: Record<string, number> = { 'Pizza': 1, 'Cucina': 1, 'Menù del Giorno': 1, 'Vino e Drinks': 3, 'Dessert': 4 };
    return [...cart].sort((a, b) => {
      const cA = categories.find(c => c.id === products.find(p => p.id === a.id)?.category_id);
      const cB = categories.find(c => c.id === products.find(p => p.id === b.id)?.category_id);
      return (cA ? pr[getMacro(cA)] || 99 : 99) - (cB ? pr[getMacro(cB)] || 99 : 99);
    });
  }, [cart, products, categories]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openModifiers = (p: Product, skipSession = false) => {
    if (!session && !skipSession) { setTmpOrder({ type: 'tavolo', name: '', product: p }); setShowNewOrder(true); return; }
    setEditItemId(null); setSelProduct(p); setModAdded([]); setModRemoved([]); setModNotes('');
  };

  const confirmOrderSession = () => {
    if (!tmpOrder.name.trim()) return;
    setSession({ type: tmpOrder.type, name: tmpOrder.name, fromFloor: tmpOrder.fromFloor, pax: paxEffettivi });
    setShowNewOrder(false);
    if (tmpOrder.product) openModifiers(tmpOrder.product, true);
    setSelectedTables([]);
    setActiveTab('menu');
  };

  const confirmMods = () => {
    if (!selProduct) return;
    if (editItemId) removeFromCart(editItemId);
    addToCart({
      id: selProduct.id, name: selProduct.name,
      price: selProduct.price + modAdded.reduce((s, i) => s + i.price, 0),
      price_unit: selProduct.price_unit, image_url: selProduct.image_url,
      customizations: { removed: modRemoved, added: modAdded, notes: modNotes },
    }, 1);
    setSelProduct(null); setEditItemId(null);
    if (editItemId) setActiveTab('carrello');
  };

  // ── Table sheet actions ───────────────────────────────────────────────────
  const handleAggiungiProdotti = () => {
    if (!tableSheet) return;
    const { table, zone, order } = tableSheet;
    const qualifiedName = `${zone.name} · T${table.name}`;
    clearCart();
    setSession({ type: 'tavolo', name: qualifiedName, fromFloor: true, pax: table.pax, existingOrderId: order.id });
    setTableSheet(null);
    setActiveTab('menu');
    triggerToast(`Aggiunta prodotti a ${qualifiedName}`, 'success');
  };

  const loadConto = async (order: any, tableName: string) => {
    setContoLoading(true);
    setShowConto(true);
    setTableSheet(null);
    setSplitCount(order.covers || 2);
    try {
      const { data } = await db.from('order_items')
        .select('id,quantity,notes,price_at_time,product:products(name)')
        .eq('order_id', order.id);
      setContoData({
        orderId: order.id,
        tableName,
        covers: order.covers || null,
        items: (data as any) || [],
        total: order.total_price,
      });
    } catch (_) { triggerToast('Errore nel caricamento del conto.', 'error'); }
    setContoLoading(false);
  };

  const handleChiediConto = async (order: any, tableName: string) => {
    try {
      await db.from('orders').update({ status: 'conto' }).eq('id', order.id);
      await loadConto(order, tableName);
    } catch (_) { triggerToast('Errore nella richiesta conto.', 'error'); }
  };

  const handleConsegna = async (orderId: string) => {
    try {
      await db.from('orders').update({ status: 'consegnato' }).eq('id', orderId);
      setTableSheet(null);
      setShowConto(false);
      setContoData(null);
      triggerToast('Ordine consegnato!', 'success');
      setActiveTab('tavoli');
    } catch (_) { triggerToast('Errore nella consegna.', 'error'); }
  };

  const sendOrder = async () => {
    if (!cart.length || !session || !restaurantId) return;
    try {
      const buildNotes = (i: CartItem) => [
        ...(i.customizations?.removed.map(r => `Senza ${r}`) || []),
        ...(i.customizations?.added.map(a => `Extra ${a.name}`) || []),
        ...(i.customizations?.notes ? [`Nota: ${i.customizations.notes}`] : []),
      ].join(', ');

      if (session.existingOrderId) {
        // Append to existing order
        await db.from('order_items').insert(cart.map(i => ({
          order_id: session.existingOrderId!, product_id: i.id, quantity: i.quantity,
          price_at_time: i.price, notes: buildNotes(i),
        })));
        const { data: existing } = await db.from('orders').select('total_price').eq('id', session.existingOrderId).single();
        await db.from('orders').update({
          total_price: (existing?.total_price || 0) + totalPrice,
          status: 'in_attesa',
        }).eq('id', session.existingOrderId);
        clearCart(); setSession(null);
        triggerToast('Prodotti aggiunti all\'ordine!', 'success');
        setActiveTab('tavoli');
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 80]);
        return;
      }

      // fromFloor: name already contains zone info ("Sala X · T4"), don't add "Tavolo" prefix
      const tableStr = session.type === 'asporto' ? 'Asporto'
        : session.fromFloor ? session.name
        : `Tavolo ${session.name}`;
      const { data: o, error } = await db.from('orders').insert({
        restaurant_id: restaurantId, table_number: tableStr,
        customer_name: session.type === 'asporto' ? session.name : tableStr,
        total_price: totalPrice, status: 'in_attesa', order_type: session.type,
        waiter_name: waiterName || null,
        covers: session.pax || null,
      }).select().single();
      if (error || !o) throw new Error();
      await db.from('order_items').insert(cart.map(i => ({
        order_id: o.id, product_id: i.id, quantity: i.quantity, price_at_time: i.price,
        notes: buildNotes(i),
      })));
      setActiveOrders(prev => [...prev, { id: o.id, table_number: o.table_number, status: o.status, total_price: o.total_price }]);
      clearCart(); setSession(null); triggerToast('Ordine inviato in cucina!', 'success');
      setActiveTab('tavoli');
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 80]);
    } catch (_) { triggerToast("Errore nell'invio dell'ordine.", 'error'); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-[#111111] font-sans text-gray-900 dark:text-white overflow-hidden select-none">

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-up bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-3 pr-6 shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-teal-50 text-[#008081]' : 'bg-red-50 text-red-500'}`}>
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <span className="font-extrabold text-[13px] uppercase dark:text-white">{toast.msg}</span>
          </div>
        )}

        {/* ── Undo delete banner ──────────────────────────────────────────── */}
        {pendingRemove && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm">
            <div className="bg-gray-900 dark:bg-[#1E1E1E] rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-4">
              <X className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1 font-bold text-white text-[12px] truncate">{pendingRemove.item.name} rimosso</span>
              <button
                onClick={cancelUndo}
                className="text-[#008081] font-black text-[11px] uppercase tracking-widest shrink-0 hover:text-teal-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="h-14 bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800 px-4 flex items-center gap-3 shrink-0 z-40">
          <button onClick={() => navigate('/gestione')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#1E1E1E] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Session pill */}
          {session ? (
            <button
              onClick={() => {
                setTmpOrder({ type: session.type, name: session.name, product: null, fromFloor: session.fromFloor });
                setPaxEffettivi(session.pax ?? 2);
                setShowNewOrder(true);
              }}
              className="flex items-center gap-1.5 bg-[#008081]/10 dark:bg-[#008081]/20 text-[#008081] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              {session.type === 'asporto' ? <ShoppingBag className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              <span>{session.name}</span>
              {session.type === 'tavolo' && session.pax && (
                <span className="bg-[#008081] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black ml-0.5">
                  {session.pax}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => { setTmpOrder({ type: 'tavolo', name: '', product: null }); setPaxEffettivi(2); setShowNewOrder(true); }}
              className="flex items-center gap-1.5 border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[#008081] hover:text-[#008081] transition-colors"
            >
              <Plus className="w-3 h-3" /> Nuovo Ordine
            </button>
          )}

          <div className="flex-1" />

          {/* Waiter pill + dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setShowWaiterMenu(m => !m)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1E1E1E] text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
            >
              <Users className="w-3 h-3" />
              <span className="max-w-[60px] truncate">{waiterName || 'Ospite'}</span>
            </button>
            {showWaiterMenu && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowWaiterMenu(false)} />
                <div className="absolute right-0 top-11 z-[100] bg-white dark:bg-[#1E1E1E] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden w-48">
                  <button
                    onClick={() => { setWaiterInput(waiterName); setShowWaiterMenu(false); setShowWaiterSetup(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors border-b border-gray-100 dark:border-gray-800"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#008081]" />
                    Cambia nome
                  </button>
                  <button
                    onClick={exitPOS}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Esci dal POS
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dark mode toggle */}
          <button onClick={toggleDark} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#1E1E1E] text-gray-500 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </header>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">

          {/* TAB: TAVOLI ─────────────────────────────────────────────── */}
          {activeTab === 'tavoli' && (
            <div className="h-full overflow-y-auto">
              {sale.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <Users className="w-16 h-16 text-gray-200 dark:text-gray-700" />
                  <p className="font-black text-gray-400 dark:text-gray-600 text-sm uppercase tracking-widest">Nessuna sala configurata</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">Configura la planimetria dalla sezione Gestione Tavoli nel Dashboard</p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Live stats */}
                  <div className="flex gap-2">
                    {[
                      { label: 'Liberi', count: sale.flatMap(z => z.tables.map(t => ({ t, z }))).filter(({ t, z }) => !activeOrders.some(o => o.table_number === `${z.name} · T${t.name}` || o.table_number === `Tavolo ${t.name}`)).length, color: 'bg-[#E8E5FF] dark:bg-[#2A2A3D] text-[#5C5C77] dark:text-[#A0A0C0]' },
                      { label: 'Occupati', count: activeOrders.filter(o => o.status !== 'consegnato').length, color: 'bg-[#5C5C77] text-white' },
                    ].map(({ label, count, color }) => (
                      <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${color}`}>
                        {count} {label}
                      </span>
                    ))}
                    {selectedTables.length > 0 && (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#008081] text-white">
                        {selectedTables.length} sel.
                      </span>
                    )}
                  </div>

                  {/* Floor plan zones */}
                  {sale.map(zone => (
                    <div key={zone.id}>
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">{zone.name}</h3>
                      <div className="relative w-full h-[280px] sm:h-[360px] bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#2a2a2a_1.5px,transparent_1.5px)] [background-size:20px_20px] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden">
                        {zone.tables.map(t => {
                          // Match by zone-qualified name (new format) OR legacy "Tavolo X" (backward compat)
                          const zoneKey = `${zone.name} · T${t.name}`;
                          const order = activeOrders.find(o =>
                            o.table_number === zoneKey ||
                            o.table_number === `Tavolo ${t.name}` && !activeOrders.some(o2 => o2.table_number === zoneKey)
                          );
                          const sel = selectedTables.some(x => x.id === t.id);
                          const inGroup = selectedTables.length > 1 && sel;
                          return (
                            <TableTile
                              key={t.id} t={t} order={order} selected={sel} inGroup={inGroup}
                              onSelect={() => setSelectedTables(p =>
                                p.some(x => x.id === t.id)
                                  ? p.filter(x => x.id !== t.id)
                                  : [...p, { ...t, zoneName: zone.name }]
                              )}
                              onOccupiedTap={(ord) => setTableSheet({ table: t, zone, order: ord })}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">
                    {[['bg-[#E8E5FF]', 'Libero'], ['bg-[#5C5C77]', 'Occupato'], ['bg-[#B19543]', 'Conto']].map(([c, l]) => (
                      <span key={l} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${c}`} />{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected tables CTA */}
              {selectedTables.length > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm">
                  <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-black text-sm text-[#008081] uppercase">
                        {selectedTables.map(t => `${t.zoneName} · T${t.name}`).join(' + ')}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{selectedTables.reduce((s, t) => s + t.pax, 0)} PAX TOTALI</p>
                    </div>
                    <button
                      onClick={() => {
                        // Build zone-qualified name: "Sala al Fondo · T4" or "Sala al Fondo · T1 + Sala Avanti · T2"
                        const qualifiedName = selectedTables.map(t => `${t.zoneName} · T${t.name}`).join(' + ');
                        setTmpOrder({ type: 'tavolo', name: qualifiedName, product: null, fromFloor: true });
                        setShowNewOrder(true);
                      }}
                      className="bg-[#008081] text-white px-5 py-3 rounded-xl font-black text-[11px] uppercase shadow-lg shadow-[#008081]/20 active:scale-95 transition-transform"
                    >
                      Nuovo Ordine
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MENU ──────────────────────────────────────────────── */}
          {activeTab === 'menu' && (
            <div className="h-full flex flex-col">
              {/* Macro categories */}
              <div className="bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex overflow-x-auto no-scrollbar px-4 pt-3 pb-1 gap-2">
                  {MACROS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setActiveMacro(m.id); setActiveMicro('Tutti'); setSearchQuery(''); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                        activeMacro === m.id && !searchQuery
                          ? 'bg-[#008081] text-white shadow-md shadow-[#008081]/30'
                          : 'bg-gray-50 dark:bg-[#1E1E1E] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />
                      {m.label}
                    </button>
                  ))}
                  {/* Soldout mode toggle */}
                  <button
                    onClick={() => setSoldoutMode(s => !s)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ml-auto ${
                      soldoutMode
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                        : 'bg-gray-50 dark:bg-[#1E1E1E] text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                    }`}
                    title="Modalità esauriti: tocca un prodotto per segnarlo esaurito"
                  >
                    <X className="w-3 h-3" />
                    {soldoutMode ? 'Esci' : 'Esauriti'}
                  </button>
                </div>

                {/* Subcategories + Search */}
                <div className="flex items-center px-4 py-2 gap-2">
                  <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5">
                    {!searchQuery && curMacros.length > 0 && ['Tutti', ...curMacros.map(c => c.id)].map(id => (
                      <button
                        key={id}
                        onClick={() => setActiveMicro(id)}
                        className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                          activeMicro === id
                            ? 'border-[#008081] text-[#008081] bg-[#008081]/5 dark:bg-[#008081]/10'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1E1E1E]'
                        }`}
                      >
                        {id === 'Tutti' ? 'Tutti' : curMacros.find(x => x.id === id)?.name}
                      </button>
                    ))}
                  </div>
                  <div className="relative shrink-0 w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text" placeholder="Cerca..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-bold outline-none focus:border-[#008081] dark:text-white transition-colors"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600"><X className="w-3 h-3" /></button>}
                  </div>
                </div>
              </div>

              {/* Product grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Nessun prodotto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filtered.map(p => {
                      const isSoldout = soldoutIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (soldoutMode) { toggleSoldout(p.id); if ('vibrate' in navigator) navigator.vibrate(30); return; }
                            if (isSoldout) return;
                            openModifiers(p); if ('vibrate' in navigator) navigator.vibrate(20);
                          }}
                          className={`relative rounded-2xl p-2 flex flex-col border shadow-sm transition-all text-left
                            ${isSoldout
                              ? 'bg-gray-100 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800 opacity-60'
                              : soldoutMode
                                ? 'bg-white dark:bg-[#1A1A1A] border-red-200 dark:border-red-900/40 ring-2 ring-red-400/30 active:scale-95'
                                : 'bg-white dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 active:scale-95 hover:-translate-y-0.5'
                            }`}
                        >
                          {isSoldout && (
                            <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
                              <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full rotate-[-8deg] shadow">Esaurito</span>
                            </div>
                          )}
                          <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-gray-50 dark:bg-[#252525] flex items-center justify-center shrink-0">
                            {getThumbnail(p.image_url)
                              ? <img src={getThumbnail(p.image_url)!} alt={p.name} className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal ${isSoldout ? 'grayscale' : ''}`} />
                              : <Utensils className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                            }
                          </div>
                          <div className="px-1 flex flex-col flex-1 justify-between">
                            <h4 className="font-extrabold text-[11px] uppercase leading-snug text-gray-900 dark:text-white">{p.name}</h4>
                            <span className={`font-black text-[13px] mt-1 ${isSoldout ? 'text-gray-400 line-through' : 'text-[#008081]'}`}>{fmt(p.price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CARRELLO ──────────────────────────────────────────── */}
          {activeTab === 'carrello' && (() => {
            const covers = session?.type === 'tavolo' ? (session.pax || 0) : 0;
            const copertoTotal = copertoPrice > 0 && covers > 0 ? copertoPrice * covers : 0;
            const grandTotal = totalPrice + copertoTotal;
            return (
              <div className="h-full flex flex-col bg-[#F7F7F9] dark:bg-[#0F0F0F]">

                {/* ── Header mesa/sesión ── */}
                {session ? (
                  <div className="bg-white dark:bg-[#111111] px-4 pt-4 pb-3 shrink-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${session.type === 'asporto' ? 'bg-amber-50 text-amber-500' : 'bg-[#008081]/10 text-[#008081]'}`}>
                          {session.type === 'asporto' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-black text-[15px] text-gray-900 dark:text-white tracking-tight">
                          {session.type === 'asporto' ? 'Asporto' : session.fromFloor ? session.name : `Tavolo ${session.name}`}
                        </span>
                        {session.existingOrderId && (
                          <span className="bg-[#008081]/10 text-[#008081] text-[8px] font-black uppercase px-2 py-0.5 rounded-full">+ Aggiunta</span>
                        )}
                      </div>
                      <button onClick={() => setSession(null)} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Annulla</button>
                    </div>
                    {covers > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 ml-9">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{covers} coperti</span>
                        {copertoPrice > 0 && <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">· €{copertoPrice.toFixed(2)}/p.</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#111111] px-4 py-4 shrink-0">
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Nessun tavolo selezionato</p>
                  </div>
                )}

                {/* ── Lista prodotti ── */}
                <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2">
                  {sortedCart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <Receipt className="w-14 h-14 text-gray-200 dark:text-gray-800" />
                      <p className="font-black text-gray-300 dark:text-gray-700 text-sm uppercase tracking-widest">Carrello vuoto</p>
                      <button onClick={() => setActiveTab('menu')}
                        className="text-xs font-black text-[#008081] bg-[#008081]/10 px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
                        + Aggiungi prodotti
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden">
                      {sortedCart.map(item => (
                        <SwipeableCartItem
                          key={item.cartItemId} item={item}
                          onRequestUndo={requestUndo}
                          onEdit={() => { setEditItemId(item.cartItemId); openModifiers(products.find(p => p.id === item.id)!, true); }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Footer totale + coperto + invia ── */}
                {sortedCart.length > 0 && (
                  <div className="bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 shrink-0">

                    {/* Righe riepilogo */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Subtotale</span>
                        <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{fmt(totalPrice)}</span>
                      </div>
                      {copertoTotal > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Users className="w-3 h-3" /> Coperto ({covers} × {fmt(copertoPrice)})
                          </span>
                          <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{fmt(copertoTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Totale</span>
                        <span className="text-2xl font-black text-[#008081]">{fmt(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      onClick={sendOrder}
                      disabled={!totalItems || !session}
                      className="w-full bg-[#008081] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white py-4 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {session?.existingOrderId ? "Aggiungi all'Ordine" : 'Invia in Cucina'}
                    </button>
                    {!session && <p className="text-center text-[10px] font-bold text-amber-500 uppercase mt-2">Seleziona un tavolo prima di inviare</p>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Bottom Tab Bar ──────────────────────────────────────────────── */}
        <div className="h-16 bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800 flex items-center shrink-0 z-40 px-4 safe-area-inset-bottom">
          {([
            { id: 'tavoli', label: 'Tavoli', icon: Users },
            { id: 'menu', label: 'Menu', icon: Utensils },
            { id: 'carrello', label: 'Carrello', icon: Receipt },
          ] as { id: typeof activeTab; label: string; icon: React.ElementType }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors ${
                activeTab === tab.id ? 'text-[#008081]' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {tab.id === 'carrello' && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#008081] text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#008081] rounded-full" />}
            </button>
          ))}
        </div>

        {/* ── Waiter Setup Modal ─────────────────────────────────────────── */}
        {showWaiterSetup && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-6">
            <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-xs rounded-[2rem] p-7 shadow-2xl">
              <div className="w-12 h-12 bg-[#008081]/10 rounded-2xl flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-[#008081]" />
              </div>
              <h2 className="text-xl font-black mb-1 dark:text-white">Chi sei?</h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Il tuo nome apparirà sugli ordini</p>
              <input
                autoFocus type="text" value={waiterInput}
                onChange={e => setWaiterInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmWaiter()}
                placeholder="Nome cameriere..."
                className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-lg text-center outline-none focus:border-[#008081] dark:text-white mb-4 transition-colors"
              />
              <button
                onClick={confirmWaiter}
                disabled={!waiterInput.trim()}
                className="w-full bg-[#008081] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white py-3.5 rounded-xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform"
              >
                Conferma
              </button>
              {waiterName && (
                <button onClick={() => setShowWaiterSetup(false)} className="w-full text-center text-[10px] font-black text-gray-400 uppercase mt-3">
                  Annulla
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── New Order Modal ─────────────────────────────────────────────── */}
        {showNewOrder && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowNewOrder(false); setSelectedTables([]); }} />
            <div className="bg-white dark:bg-[#1E1E1E] w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 relative z-10 shadow-2xl">
              <button onClick={() => { setShowNewOrder(false); setSelectedTables([]); }} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <h2 className="text-xl font-black mb-6 uppercase dark:text-white">Nuovo Ordine</h2>

              {/* When coming from floor plan: show zone-qualified name + PAX stepper */}
              {tmpOrder.fromFloor ? (
                <>
                  <div className="bg-[#008081]/10 dark:bg-[#008081]/20 border border-[#008081]/30 rounded-2xl px-4 py-4 mb-4 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Tavolo selezionato</p>
                    <p className="font-black text-[#008081] text-base leading-snug">{tmpOrder.name}</p>
                  </div>
                  <div className="mb-5 bg-gray-50 dark:bg-[#252525] rounded-2xl p-4">
                    <PaxStepper
                      value={paxEffettivi}
                      onChange={setPaxEffettivi}
                      max={(() => {
                        // Find the table's configured capacity from the selected zone+table
                        for (const zone of sale) {
                          for (const t of zone.tables) {
                            if (tmpOrder.name.endsWith(`T${t.name}`) && tmpOrder.name.includes(zone.name)) return t.pax;
                          }
                        }
                        return undefined;
                      })()}
                    />
                  </div>
                  <button
                    onClick={confirmOrderSession}
                    className="w-full bg-[#008081] text-white py-4 rounded-xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform"
                  >
                    Conferma · {paxEffettivi} cop.
                  </button>
                </>
              ) : (
                <ManualOrderForm
                  sale={sale}
                  activeOrders={activeOrders}
                  tmpOrder={tmpOrder}
                  setTmpOrder={setTmpOrder}
                  pax={paxEffettivi}
                  setPax={setPaxEffettivi}
                  onConfirm={confirmOrderSession}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Modifier Modal ──────────────────────────────────────────────── */}
        {selProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelProduct(null)} />
            <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-sm rounded-[2rem] flex flex-col relative z-10 max-h-[90vh] shadow-2xl">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#252525] flex items-start gap-4 rounded-t-[2rem]">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-black uppercase dark:text-white">{selProduct.name}</h2>
                  <p className="text-[#008081] font-black text-[13px]">{fmt(selProduct.price)}</p>
                </div>
                <button onClick={() => setSelProduct(null)} className="p-2 bg-white dark:bg-[#2A2A2A] rounded-full border border-gray-100 dark:border-gray-700">
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#1E1E1E]">
                {/* Senza */}
                <div>
                  <h3 className="font-black text-red-500 uppercase text-[9px] mb-2 flex items-center gap-1"><Minus className="w-3 h-3" /> SENZA</h3>
                  {(() => {
                    const ings = (selProduct.base_ingredients?.length || 0) > 0
                      ? selProduct.base_ingredients!
                      : selProduct.description?.split(',').map(s => s.trim()).filter(Boolean) || [];
                    return ings.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ings.map((ing: string) => (
                          <button key={ing} onClick={() => setModRemoved(p => p.includes(ing) ? p.filter(x => x !== ing) : [...p, ing])}
                            className={`py-2 px-3 rounded-full font-black text-[10px] uppercase border transition-colors ${modRemoved.includes(ing) ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {ing}
                          </button>
                        ))}
                      </div>
                    ) : <p className="text-[10px] font-bold text-gray-400 uppercase">Nessun ingrediente configurato</p>;
                  })()}
                </div>
                {/* Extra */}
                <div>
                  <h3 className="font-black text-[#008081] uppercase text-[9px] mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> EXTRA</h3>
                  <div className="flex flex-wrap gap-2">
                    {extras.map(e => {
                      const sel = modAdded.find(x => x.name === e.name);
                      return (
                        <button key={e.name} onClick={() => setModAdded(p => sel ? p.filter(x => x.name !== e.name) : [...p, { name: e.name, price: e.price }])}
                          className={`py-2 px-3 rounded-full font-black text-[10px] uppercase border flex gap-1.5 transition-colors ${sel ? 'bg-[#008081] text-white' : 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-900/30 text-[#008081]'}`}>
                          <span>{e.name}</span><span className="text-[8px] opacity-80">+{fmt(e.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Nota */}
                <div>
                  <h3 className="font-black text-gray-400 uppercase text-[9px] mb-2">NOTA</h3>
                  <textarea value={modNotes} onChange={e => setModNotes(e.target.value)}
                    placeholder="Scrivi una nota per la cucina..."
                    className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-[12px] font-bold outline-none min-h-[70px] resize-none dark:text-white focus:border-[#008081] transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-gray-50/30 dark:bg-[#252525] rounded-b-[2rem]">
                <button onClick={confirmMods} className="w-full bg-[#008081] text-white py-3.5 rounded-xl font-black uppercase text-[11px] active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform">
                  Aggiungi al Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Table Action Sheet ──────────────────────────────────────────── */}
        {tableSheet && (() => {
          const { table, zone, order } = tableSheet;
          const statusKey = order.status === 'conto' ? 'conto'
            : order.status === 'pronto' ? 'pronto'
            : order.status === 'in_preparazione' ? 'in_preparazione'
            : 'in_attesa';
          const statusLabel: Record<string, string> = {
            in_attesa: 'In Attesa', in_preparazione: 'In Preparazione',
            pronto: 'Pronto', conto: 'Conto Richiesto',
          };
          const statusColor: Record<string, string> = {
            in_attesa: 'bg-[#F97316]/10 text-[#F97316]',
            in_preparazione: 'bg-[#3B82F6]/10 text-[#3B82F6]',
            pronto: 'bg-[#22C55E]/10 text-[#22C55E]',
            conto: 'bg-[#B19543]/10 text-[#B19543]',
          };
          const mins = minutesAgo(order.created_at || '');
          return (
            <div className="fixed inset-0 z-[110] flex items-end justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setTableSheet(null)} />
              <div className="bg-white dark:bg-[#1E1E1E] w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl">
                <button onClick={() => setTableSheet(null)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Header */}
                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{zone.name}</p>
                  <h2 className="text-2xl font-black dark:text-white">Tavolo {table.name}</h2>
                </div>

                {/* Status + time */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusColor[statusKey]}`}>
                    {statusLabel[statusKey]}
                  </span>
                  {mins > 0 && (
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase ${mins >= 20 ? 'text-red-500' : 'text-gray-400'}`}>
                      <Clock className="w-3 h-3" /> {mins}min fa
                    </span>
                  )}
                  <span className="ml-auto font-black text-[#008081] text-lg">{fmt(order.total_price)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleAggiungiProdotti}
                    className="w-full bg-[#008081] text-white py-4 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Aggiungi Prodotti
                  </button>

                  {statusKey !== 'conto' && (
                    <button
                      onClick={() => handleChiediConto(order, `${zone.name} · T${table.name}`)}
                      className="w-full bg-[#B19543]/10 dark:bg-[#B19543]/20 text-[#B19543] border border-[#B19543]/30 py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" /> Chiedi il Conto
                    </button>
                  )}

                  <button
                    onClick={() => handleConsegna(order.id)}
                    className="w-full bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Segna come Consegnato
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Conto Modal ─────────────────────────────────────────────────── */}
        {showConto && (
          <div className="fixed inset-0 z-[130] flex flex-col bg-[#FBFBFB] dark:bg-[#0F0F0F]">
            {/* Header */}
            <div className="bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-3 shrink-0">
              <button onClick={() => { setShowConto(false); setContoData(null); }} className="p-2 bg-gray-100 dark:bg-[#1E1E1E] rounded-xl">
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex-1">
                <h2 className="font-black text-[16px] uppercase dark:text-white">
                  {contoData?.tableName || '—'}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                  Conto
                  {contoData?.covers && (
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {contoData.covers} cop.</span>
                  )}
                </p>
              </div>
              {contoData && (
                <button
                  onClick={() => printReceipt({
                    id: contoData.orderId,
                    table_number: contoData.tableName,
                    status: 'conto',
                    total_price: contoData.total,
                    created_at: new Date().toISOString(),
                    order_type: 'tavolo',
                    order_items: contoData.items,
                  }, restaurantName)}
                  className="w-9 h-9 bg-gray-50 dark:bg-[#1E1E1E] text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {contoLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : contoData ? (
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-2 space-y-1">
                    {contoData.items.map(item => (
                      <div key={item.id} className="flex items-start gap-2 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <span className="text-[11px] font-black text-[#008081] w-6 shrink-0">{item.quantity}×</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200">{item.product?.name || '—'}</p>
                          {item.notes && <p className="text-[9px] font-bold text-gray-400 italic truncate">{item.notes}</p>}
                        </div>
                        <span className="text-[12px] font-black text-gray-700 dark:text-gray-300 shrink-0">{fmt(item.price_at_time * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer: coperto + totale + split + consegna */}
            {contoData && (() => {
              const covers = contoData.covers || 0;
              const copertoTotal = copertoPrice > 0 && covers > 0 ? copertoPrice * covers : 0;
              const grandTotal = contoData.total + copertoTotal;
              return (
                <div className="bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 shrink-0 space-y-3">

                  {/* Riepilogo importi */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subtotale</span>
                      <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{fmt(contoData.total)}</span>
                    </div>
                    {copertoTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Users className="w-3 h-3" /> Coperto ({covers} × {fmt(copertoPrice)})
                        </span>
                        <span className="text-[13px] font-black text-gray-700 dark:text-gray-300">{fmt(copertoTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Totale</span>
                      <span className="font-black text-2xl text-[#008081]">{fmt(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Split bill */}
                  <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Dividi il conto
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => setSplitCount(n => Math.max(1, n - 1))}
                        className="w-9 h-9 bg-white dark:bg-[#2A2A2A] rounded-xl font-black text-lg border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform">−</button>
                      <div className="flex-1 text-center">
                        <span className="font-black text-xl text-[#008081]">{splitCount}</span>
                        <span className="text-[10px] font-bold text-gray-400 ml-1">persone</span>
                      </div>
                      <button onClick={() => setSplitCount(n => n + 1)}
                        className="w-9 h-9 bg-white dark:bg-[#2A2A2A] rounded-xl font-black text-lg border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform">+</button>
                    </div>
                    {splitCount > 1 && (
                      <div className="text-center bg-[#008081]/10 dark:bg-[#008081]/20 rounded-xl py-2">
                        <span className="font-black text-[#008081] text-lg">{fmt(grandTotal / splitCount)}</span>
                        <span className="text-[10px] font-bold text-gray-400 ml-1.5">a persona</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleConsegna(contoData.orderId)}
                    className="w-full bg-[#008081] text-white py-4 rounded-2xl font-black uppercase text-sm active:scale-95 shadow-lg shadow-[#008081]/20 transition-transform flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Consegnato e chiudi tavolo
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
