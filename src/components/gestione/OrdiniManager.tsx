import React, { useState, useEffect } from 'react';
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
    headerBg: 'bg-red-100 dark:bg-red-900/30'
  },
  { 
    id: 'in_preparazione', 
    label: 'In Preparazione', 
    emoji: '🔥', 
    bg: 'bg-orange-50 dark:bg-orange-900/10', 
    border: 'border-orange-200 dark:border-orange-900/50', 
    text: 'text-orange-700 dark:text-orange-400',
    headerBg: 'bg-orange-100 dark:bg-orange-900/30'
  },
  { 
    id: 'pronto', 
    label: 'Pronti al Ritiro', 
    emoji: '✅', 
    bg: 'bg-green-50 dark:bg-green-900/10', 
    border: 'border-green-200 dark:border-green-900/50', 
    text: 'text-green-700 dark:text-green-400',
    headerBg: 'bg-green-100 dark:bg-green-900/30'
  }
];

export default function OrdiniManager({ restaurantId }: OrdiniManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storicoOrders, setStoricoOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ordiniTab, setOrdiniTab] = useState<'corrente' | 'storico'>('corrente');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    const [{ data: activeOrdersRes }, { data: storicoOrdersRes }] = await Promise.all([
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).neq('status', 'consegnato').order('created_at', { ascending: true }),
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).eq('status', 'consegnato').order('created_at', { ascending: false }).limit(100)
    ]);
    if (activeOrdersRes) setOrders(activeOrdersRes as any);
    if (storicoOrdersRes) setStoricoOrders(storicoOrdersRes as any);
  };

  useEffect(() => {
    fetchOrders();

    // Supabase Realtime Subscription para 0 egress y UI instantánea
    const ordersChannel = db.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Sonido B2B sutil al recibir orden
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (context) {
              const osc = context.createOscillator();
              const gain = context.createGain();
              osc.connect(gain);
              gain.connect(context.destination);
              osc.frequency.value = 523.25; // Do
              gain.gain.setValueAtTime(0, context.currentTime);
              gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
              osc.start(context.currentTime);
              osc.stop(context.currentTime + 0.5);
            }
          }
          fetchOrders();
        }
      )
      .subscribe();

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000); // 1 min update para SLA

    return () => {
      db.removeChannel(ordersChannel);
      clearInterval(timeInterval);
    };
  }, [restaurantId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    
    // Si pasa a entregado (consegnato), optimísticamente lo quitamos
    if (newStatus === 'consegnato') {
      const orderToMove = orders.find(o => o.id === orderId);
      if (orderToMove) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setStoricoOrders(prev => [{ ...orderToMove, status: 'consegnato' }, ...prev].slice(0, 100));
      }
    }

    await db.from('orders').update({ status: newStatus }).eq('id', orderId);
    // Silent background refresh
    fetchOrders();
  };

  const handleClearStorico = async () => {
    if (!confirm('Sei sicuro di voler svuotare lo storico degli ordini di oggi? Questa operazione è irreversibile.')) return;
    await db.from('orders').delete().eq('restaurant_id', restaurantId).eq('status', 'consegnato');
    fetchOrders();
  };

  const getSLA = (createdAt: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);
    return diff;
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
    setDraggedOrderId(orderId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      handleUpdateOrderStatus(orderId, status);
    }
    setDraggedOrderId(null);
  };

  const getStatusButton = (order: Order) => {
    if (order.status === 'in_attesa') {
      return (
        <button
          onClick={() => handleUpdateOrderStatus(order.id, 'in_preparazione')}
          className="w-full mt-3 bg-white dark:bg-[#1A1A1A] hover:bg-orange-50 text-orange-600 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-900 font-bold py-2 rounded-lg shadow-sm transition-colors text-xs uppercase flex justify-center items-center gap-2"
        >
          🔥 Inizia Preparazione
        </button>
      );
    }
    if (order.status === 'in_preparazione') {
      return (
        <button
          onClick={() => handleUpdateOrderStatus(order.id, 'pronto')}
          className="w-full mt-3 bg-white dark:bg-[#1A1A1A] hover:bg-green-50 text-green-600 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900 font-bold py-2 rounded-lg shadow-sm transition-colors text-xs uppercase flex justify-center items-center gap-2"
        >
          ✅ Segna come Pronto
        </button>
      );
    }
    if (order.status === 'pronto') {
      return (
        <button
          onClick={() => handleUpdateOrderStatus(order.id, 'consegnato')}
          className="w-full mt-3 bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 rounded-lg shadow-md transition-colors text-xs uppercase flex justify-center items-center gap-2"
        >
          🏁 Consegnato
        </button>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-fade-in w-full h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordini</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trascina le card per aggiornare lo stato in tempo reale</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            className="text-sm font-bold text-[#008080] bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-[#008080]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
            Sincronizza
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-4 shadow-inner w-full flex-shrink-0">
        <button
          onClick={() => setOrdiniTab('corrente')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'corrente' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-premium transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          In Corso ({orders.length})
        </button>
        <button
          onClick={() => setOrdiniTab('storico')}
          className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'storico' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-premium transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Storico ({storicoOrders.length})
        </button>
      </div>

      {ordiniTab === 'corrente' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow overflow-hidden">
          {KANBAN_COLUMNS.map(column => {
            const columnOrders = orders.filter(o => o.status === column.id);
            return (
              <div 
                key={column.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex flex-col rounded-2xl border ${column.border} ${column.bg} overflow-hidden transition-colors h-full`}
              >
                <div className={`p-3 ${column.headerBg} border-b ${column.border} flex justify-between items-center sticky top-0 z-10`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{column.emoji}</span>
                    <h3 className={`font-bold ${column.text}`}>{column.label}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full bg-white dark:bg-black/20 text-xs font-black ${column.text} shadow-sm`}>
                    {columnOrders.length}
                  </span>
                </div>
                
                <div className="p-3 overflow-y-auto flex-grow space-y-3 custom-scrollbar">
                  {columnOrders.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-6 opacity-40">
                      <p className={`text-sm font-medium ${column.text}`}>Nessun ordine<br/>in questa fase</p>
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
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onDragEnd={() => setDraggedOrderId(null)}
                          className={`bg-white dark:bg-[#262626] rounded-xl shadow-sm border ${isUrgent ? 'border-red-400 dark:border-red-500/50 shadow-red-500/10' : 'border-gray-200 dark:border-gray-700/50'} flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
                        >
                          <div
                            onClick={() => setExpandedOrders(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                            className="p-3 pb-2 flex-grow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-lg ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                  #{order.daily_order_number || order.id.split('-')[0].toUpperCase()}
                                </span>
                                {isUrgent && (
                                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                    URGENTE
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-sm text-[#008080]">€{order.total_price.toFixed(2)}</span>
                            </div>

                            <div className="flex gap-1.5 flex-wrap mb-2">
                              {order.order_type === 'asporto' ? (
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded truncate max-w-[120px] flex items-center gap-1">
                                  <span>🛍️</span> {order.customer_name || 'Asporto'}
                                </span>
                              ) : order.table_number ? (
                                <span className="bg-orange-50 border border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <span>🪑</span> Tavolo {order.table_number}
                                </span>
                              ) : null}
                              
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${isUrgent ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                                🕒 {minutesElapsed} min
                              </span>
                            </div>

                            <p className="text-[11px] font-medium text-gray-400 mb-1">
                              {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} • {order.order_items.reduce((acc, i) => acc + i.quantity, 0)} Pz
                            </p>

                            <div className="space-y-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                              {/* Preview of first 2 items */}
                              {order.order_items.slice(0, isExpanded ? undefined : 2).map((item, idx) => (
                                <div key={idx} className="flex gap-2 text-xs items-start">
                                  <span className="font-extrabold text-gray-700 dark:text-gray-300 w-4">{item.quantity}x</span>
                                  <div className="flex-grow">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                      {item.product?.name || 'Eliminato'}
                                    </span>
                                    {item.notes && <p className="text-[10px] text-[#F57C00] font-bold leading-tight mt-0.5 break-words">Nota: {item.notes}</p>}
                                  </div>
                                </div>
                              ))}
                              {!isExpanded && order.order_items.length > 2 && (
                                <p className="text-[10px] font-bold text-[#008080] pt-1">+ altri {order.order_items.length - 2} prodotti...</p>
                              )}
                            </div>
                            
                            {isExpanded && getStatusButton(order)}
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
      ) : (
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {storicoOrders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center">
              <span className="text-4xl block mb-2">📜</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nessuno storico disponibile al momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end sticky top-0 z-10 bg-[#FBFBFB] dark:bg-[#1A1A1A] py-2">
                <button
                  onClick={handleClearStorico}
                  className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-red-200 dark:border-red-900/50"
                >
                  Svuota Storico Odierno
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {storicoOrders.map(order => {
                  const isExpanded = expandedOrders.includes(order.id);
                  return (
                    <div key={order.id} className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col opacity-75 overflow-hidden transition-all hover:opacity-100">
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
                        
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-xs font-bold text-gray-400">
                            {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">
                            {order.order_type === 'asporto' ? `🛍️ ${order.customer_name}` : `🪑 Tav. ${order.table_number}`}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="space-y-1.5 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                            {order.order_items.map((item, idx) => (
                              <div key={idx} className="flex gap-2 text-xs items-start">
                                <span className="font-black text-gray-400 w-4">{item.quantity}x</span>
                                <div className="flex-grow">
                                  <span className="font-medium text-gray-500 dark:text-gray-400">{item.product?.name || 'Eliminato'}</span>
                                </div>
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
    </div>
  );
}
