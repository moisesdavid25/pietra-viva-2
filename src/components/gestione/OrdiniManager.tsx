import React, { useState, useEffect, useRef } from 'react';
import { Trash2, X, CheckCircle2 } from 'lucide-react';
import db from '../../db';

interface OrderItem {
  id: string;
  product: { name: string };
  quantity: number;
  notes: string | null;
  price_at_time: number;
}

interface Order {
  id: string;
  table_number: string | null;
  status: 'in_attesa' | 'in_preparazione' | 'pronto' | 'consegnato';
  total_price: number;
  created_at: string;
  customer_name?: string;
  order_type?: string;
  daily_order_number?: number;
  pickup_code?: string | null;
  auth_user_id?: string | null;
  order_items: OrderItem[];
}

interface OrdiniManagerProps {
  restaurantId: string;
}

const KANBAN_COLUMNS = [
  {
    id: 'in_attesa',
    label: 'In Attesa',
    emoji: '⏳',
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-900/50',
    text: 'text-red-700 dark:text-red-400',
    headerBg: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    id: 'in_preparazione',
    label: 'In Preparazione',
    emoji: '🔥',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    border: 'border-orange-200 dark:border-orange-900/50',
    text: 'text-orange-700 dark:text-orange-400',
    headerBg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'pronto',
    label: 'Pronti al Ritiro',
    emoji: '✅',
    bg: 'bg-green-50 dark:bg-green-900/10',
    border: 'border-green-200 dark:border-green-900/50',
    text: 'text-green-700 dark:text-green-400',
    headerBg: 'bg-green-100 dark:bg-green-900/30',
  },
];

export default function OrdiniManager({ restaurantId }: OrdiniManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storicoOrders, setStoricoOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ordiniTab, setOrdiniTab] = useState<'corrente' | 'storico'>('corrente');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [showDeleteProntiModal, setShowDeleteProntiModal] = useState(false);
  const [isDeletingPronti, setIsDeletingPronti] = useState(false);

  // Touch drag state
  const touchDragRef = useRef<{ orderId: string; startX: number; startY: number } | null>(null);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    const [{ data: activeOrdersRes }, { data: storicoOrdersRes }] = await Promise.all([
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number, pickup_code, auth_user_id,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).neq('status', 'consegnato').order('created_at', { ascending: true }),
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number, pickup_code, auth_user_id,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).eq('status', 'consegnato').order('created_at', { ascending: false }).limit(100),
    ]);
    if (activeOrdersRes) setOrders(activeOrdersRes as any);
    if (storicoOrdersRes) setStoricoOrders(storicoOrdersRes as any);
  };

  useEffect(() => {
    fetchOrders();

    const ordersChannel = db.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.value = 523.25;
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
              osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
            } catch (_) {}
          }
          fetchOrders();
        }
      ).subscribe();

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => { db.removeChannel(ordersChannel); clearInterval(timeInterval); };
  }, [restaurantId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    if (newStatus === 'consegnato') {
      const orderToMove = orders.find(o => o.id === orderId);
      if (orderToMove) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setStoricoOrders(prev => [{ ...orderToMove, status: 'consegnato' }, ...prev].slice(0, 100));
      }
    }
    await db.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  // Bulk mark all "pronto" as consegnato
  const handleDeleteAllPronti = async () => {
    setIsDeletingPronti(true);
    const prontiOrders = orders.filter(o => o.status === 'pronto');
    await db.from('orders').update({ status: 'consegnato' })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pronto');
    setOrders(prev => prev.filter(o => o.status !== 'pronto'));
    setStoricoOrders(prev => [...prontiOrders.map(o => ({ ...o, status: 'consegnato' })), ...prev].slice(0, 100));
    setIsDeletingPronti(false);
    setShowDeleteProntiModal(false);
    fetchOrders();
  };

  const handleClearStorico = async () => {
    if (!confirm('Sei sicuro di voler svuotare lo storico degli ordini di oggi? Questa operazione è irreversibile.')) return;
    await db.from('orders').delete().eq('restaurant_id', restaurantId).eq('status', 'consegnato');
    fetchOrders();
  };

  const getSLA = (createdAt: string) => Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);

  // Desktop drag
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
    setDraggedOrderId(orderId);
  };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) handleUpdateOrderStatus(orderId, status);
    setDraggedOrderId(null);
  };

  const getStatusButton = (order: Order) => {
    if (order.status === 'in_attesa') return (
      <button onClick={() => handleUpdateOrderStatus(order.id, 'in_preparazione')}
        className="w-full mt-2 bg-white dark:bg-[#1A1A1A] hover:bg-orange-50 text-orange-600 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-900 font-bold py-2 rounded-lg shadow-sm transition-colors text-xs uppercase flex justify-center items-center gap-2">
        🔥 Inizia Preparazione
      </button>
    );
    if (order.status === 'in_preparazione') return (
      <button onClick={() => handleUpdateOrderStatus(order.id, 'pronto')}
        className="w-full mt-2 bg-white dark:bg-[#1A1A1A] hover:bg-green-50 text-green-600 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900 font-bold py-2 rounded-lg shadow-sm transition-colors text-xs uppercase flex justify-center items-center gap-2">
        ✅ Segna come Pronto
      </button>
    );
    if (order.status === 'pronto') return (
      <button onClick={() => handleUpdateOrderStatus(order.id, 'consegnato')}
        className="w-full mt-2 bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 rounded-lg shadow-md transition-colors text-xs uppercase flex justify-center items-center gap-2">
        🏁 Consegnato
      </button>
    );
    return null;
  };

  const prontiCount = orders.filter(o => o.status === 'pronto').length;

  return (
    <div className="space-y-4 animate-fade-in w-full flex flex-col md:h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordini</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
            Trascina le card per aggiornare lo stato in tempo reale
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {prontiCount > 0 && (
            <button
              onClick={() => setShowDeleteProntiModal(true)}
              className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900/50 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Consegna tutti i pronti ({prontiCount})
            </button>
          )}
          <button onClick={handleManualRefresh}
            className="text-sm font-bold text-[#008080] bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-[#008080]/20 flex items-center gap-2 transition-all active:scale-95">
            <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
            <span className="hidden sm:inline">Sincronizza</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl shadow-inner flex-shrink-0">
        <button onClick={() => setOrdiniTab('corrente')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'corrente' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
          In Corso ({orders.length})
        </button>
        <button onClick={() => setOrdiniTab('storico')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'storico' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
          Storico ({storicoOrders.length})
        </button>
      </div>

      {/* ── CORRENTE (Kanban) ─────────────────────────────────────────────── */}
      {ordiniTab === 'corrente' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow md:overflow-hidden pb-4 md:pb-0">
          {KANBAN_COLUMNS.map(column => {
            const columnOrders = orders.filter(o => o.status === column.id);
            return (
              <div
                key={column.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, column.id)}
                className={`flex flex-col rounded-2xl border ${column.border} ${column.bg} overflow-hidden md:h-full`}
              >
                {/* Column header */}
                <div className={`p-3 ${column.headerBg} border-b ${column.border} flex justify-between items-center sticky top-0 z-10`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{column.emoji}</span>
                    <h3 className={`font-bold ${column.text}`}>{column.label}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full bg-white dark:bg-black/20 text-xs font-black ${column.text} shadow-sm`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-3 overflow-y-auto flex-grow space-y-3">
                  {columnOrders.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-center p-6 opacity-40">
                      <p className={`text-sm font-medium ${column.text}`}>Nessun ordine<br />in questa fase</p>
                    </div>
                  ) : (
                    columnOrders.map(order => {
                      const isExpanded = expandedOrders.includes(order.id);
                      const isDragging = draggedOrderId === order.id;
                      const minutesElapsed = getSLA(order.created_at);
                      const isUrgent = order.status === 'in_attesa' && minutesElapsed > 15;

                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={e => handleDragStart(e, order.id)}
                          onDragEnd={() => setDraggedOrderId(null)}
                          className={`bg-white dark:bg-[#262626] rounded-xl shadow-sm border ${isUrgent ? 'border-red-400 dark:border-red-500/50' : 'border-gray-200 dark:border-gray-700/50'} flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div
                            onClick={() => setExpandedOrders(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                            className="p-3 pb-2 flex-grow"
                          >
                            {/* Order number + price */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-lg ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                  #{order.daily_order_number || order.id.split('-')[0].toUpperCase()}
                                </span>
                                {isUrgent && (
                                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                    URGENTE
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-sm text-[#008080]">€{order.total_price.toFixed(2)}</span>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-1.5 flex-wrap mb-2">
                              {order.order_type === 'asporto' ? (
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  🛍️ {order.customer_name || 'Asporto'}
                                </span>
                              ) : (
                                <>
                                  {order.table_number && (
                                    <span className="bg-orange-50 border border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                      🪑 {order.table_number}
                                    </span>
                                  )}
                                  {order.customer_name && (
                                    <span className="bg-gray-50 border border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                      👤 {order.customer_name}
                                    </span>
                                  )}
                                </>
                              )}
                              {order.auth_user_id && (
                                <span className="bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-900/20 dark:border-teal-800/50 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  🌿 Fidelity
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${isUrgent ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                                🕒 {minutesElapsed} min
                              </span>
                            </div>

                            {/* Pickup code — asporto only */}
                            {order.order_type === 'asporto' && order.pickup_code && (
                              <div className="flex items-center gap-2 bg-[#008081]/8 border border-[#008081]/25 rounded-xl px-3 py-2 mb-2">
                                <span className="text-[10px] font-black text-[#008081] uppercase tracking-widest">Codice</span>
                                <span className="font-black text-[#008081] text-base tracking-[0.2em] font-mono flex-1">{order.pickup_code}</span>
                                <span className="text-[10px] text-[#008081]/60">🎟️</span>
                              </div>
                            )}

                            <p className="text-[11px] font-medium text-gray-400 mb-1">
                              {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · {order.order_items.reduce((acc, i) => acc + i.quantity, 0)} Pz
                            </p>

                            {/* Items */}
                            <div className="space-y-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                              {order.order_items.slice(0, isExpanded ? undefined : 2).map((item, idx) => (
                                <div key={idx} className="flex gap-2 text-xs items-start">
                                  <span className="font-extrabold text-gray-700 dark:text-gray-300 w-4">{item.quantity}x</span>
                                  <div className="flex-grow">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 leading-tight">{item.product?.name || 'Eliminato'}</span>
                                    {item.notes && <p className="text-[10px] text-[#F57C00] font-bold leading-tight mt-0.5 break-words">Nota: {item.notes}</p>}
                                  </div>
                                </div>
                              ))}
                              {!isExpanded && order.order_items.length > 2 && (
                                <p className="text-[10px] font-bold text-[#008080] pt-1">+ altri {order.order_items.length - 2} prodotti...</p>
                              )}
                            </div>
                          </div>

                          {/* Status button: always visible on mobile, only when expanded on desktop */}
                          <div className={`px-3 pb-3 ${isExpanded ? 'block' : 'block md:hidden'}`}>
                            {getStatusButton(order)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STORICO ──────────────────────────────────────────────────────── */}
      {ordiniTab === 'storico' && (
        <div className="flex-grow overflow-y-auto">
          {storicoOrders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center">
              <span className="text-4xl block mb-2">📜</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nessuno storico disponibile al momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end sticky top-0 z-10 bg-[#FBFBFB] dark:bg-[#1A1A1A] py-2">
                <button onClick={handleClearStorico}
                  className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-red-200 dark:border-red-900/50">
                  Svuota Storico Odierno
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {storicoOrders.map(order => {
                  const isExpanded = expandedOrders.includes(order.id);
                  return (
                    <div key={order.id} className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col opacity-75 overflow-hidden hover:opacity-100 transition-opacity">
                      <div
                        onClick={() => setExpandedOrders(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-lg text-gray-500 dark:text-gray-400">
                            #{order.daily_order_number || order.id.split('-')[0].toUpperCase()}
                          </span>
                          <span className="font-bold text-sm text-gray-500 dark:text-gray-400">€{order.total_price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          <span className="text-xs font-bold text-gray-400">
                            {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {order.order_type === 'asporto' ? `🛍️ ${order.customer_name || 'Asporto'}` : `🪑 ${order.table_number}`}
                          </span>
                          {order.customer_name && order.order_type === 'tavolo' && (
                            <span className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">
                              👤 {order.customer_name}
                            </span>
                          )}
                          {order.pickup_code && (
                            <span className="bg-[#008081]/10 text-[#008081] dark:bg-teal-900/30 dark:text-teal-300 text-[10px] font-black px-2 py-0.5 rounded font-mono tracking-widest">
                              🎟️ {order.pickup_code}
                            </span>
                          )}
                          {order.auth_user_id && (
                            <span className="bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              🌿
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="space-y-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                            {order.order_items.map((item, idx) => (
                              <div key={idx} className="flex gap-2 text-xs items-start">
                                <span className="font-black text-gray-400 w-4">{item.quantity}x</span>
                                <span className="font-medium text-gray-500 dark:text-gray-400">{item.product?.name || 'Eliminato'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: consegna tutti i pronti ──────────────────────────────── */}
      {showDeleteProntiModal && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Consegna tutti i pronti?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tutti i <span className="font-bold text-green-600">{prontiCount} ordini pronti</span> verranno segnati come consegnati e spostati nello storico.
                </p>
              </div>
              <button onClick={() => setShowDeleteProntiModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteProntiModal(false)}
                className="flex-1 py-3 rounded-2xl font-black text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Annulla
              </button>
              <button onClick={handleDeleteAllPronti} disabled={isDeletingPronti}
                className="flex-1 py-3 rounded-2xl font-black text-sm bg-green-500 hover:bg-green-600 text-white transition-colors active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {isDeletingPronti ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Aggiornamento...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Sì, consegna tutti</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
