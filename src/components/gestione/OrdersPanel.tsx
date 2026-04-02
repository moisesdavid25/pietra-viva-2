import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

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

interface Props {
  orders: Order[];
  storicoOrders: Order[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onUpdateStatus: (orderId: string, currentStatus: string) => void;
  onClearStorico: () => void;
}

function renderOrderCard(
  order: Order,
  isStorico: boolean,
  expandedOrders: string[],
  toggleOrder: (id: string) => void,
  onUpdateStatus: (id: string, status: string) => void
) {
  const isExpanded = expandedOrders.includes(order.id);
  return (
    <div className={`bg-[#FBFBFB] dark:bg-[#262626] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden ${isStorico ? 'opacity-75' : ''}`}>
      <div
        onClick={(e) => { if ((e.target as HTMLElement).closest('button.close-btn')) return; toggleOrder(order.id); }}
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`font-black text-lg ${isStorico ? 'text-gray-400' : 'text-[#008081]'}`}>
            #{order.daily_order_number || order.id.split('-')[0].toUpperCase()}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500">
              {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex gap-1 mt-0.5">
              {isStorico ? (
                <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">
                  {order.order_type === 'asporto' ? `🛍️ ${order.customer_name}` : `Tavolo ${order.table_number}`}
                </span>
              ) : (
                <>
                  {order.order_type === 'asporto' ? (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">🛍️ {order.customer_name}</span>
                  ) : order.table_number && (
                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Tavolo {order.table_number}</span>
                  )}
                  {order.status === 'in_attesa' && <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Nuovo</span>}
                  {order.status === 'pronto' && <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Pronto</span>}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-black ${isStorico ? 'text-gray-400' : 'text-[#008081]'}`}>€{order.total_price.toFixed(2)}</span>
          {!isStorico && (
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'pronto'); }}
              className="close-btn w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 dark:bg-[#1A1A1A] dark:hover:bg-red-900/30 dark:hover:text-red-400 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-2">
            <div className="space-y-2.5 mb-4 mt-4">
              {order.order_items.map((item, idx) => (
                <div key={idx} className={`flex gap-2 text-sm items-start ${isStorico ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  <span className={`font-black w-6 ${isStorico ? 'text-gray-400' : 'text-[#008081]'}`}>{item.quantity}x</span>
                  <div className="flex-grow">
                    <span className="font-medium">{item.product?.name || 'Prodotto eliminato'}</span>
                    {!isStorico && item.notes && <p className="text-xs text-red-500 italic mt-0.5">Note: {item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
            {!isStorico && (
              <div>
                {order.status === 'in_attesa' && (
                  <button onClick={() => onUpdateStatus(order.id, order.status)} className="w-full bg-[#F57C00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs">
                    👨‍🍳 Inizia Preparazione
                  </button>
                )}
                {order.status === 'in_preparazione' && (
                  <button onClick={() => onUpdateStatus(order.id, order.status)} className="w-full bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs">
                    🛎️ Segna come Pronto
                  </button>
                )}
                {order.status === 'pronto' && (
                  <button onClick={() => onUpdateStatus(order.id, order.status)} className="w-full bg-[#008081] hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs">
                    ✔️ Consegnato / Chiuso
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPanel({ orders, storicoOrders, isRefreshing, onRefresh, onUpdateStatus, onClearStorico }: Props) {
  const [tab, setTab] = useState<'corrente' | 'storico'>('corrente');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const toggleOrder = (id: string) => setExpandedOrders(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordini</h2>
        <button onClick={onRefresh} className="text-sm font-bold text-[#008081] bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-[#008081]/20 flex items-center gap-2 active:scale-95 transition-all">
          <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span> Aggiorna
        </button>
      </div>

      <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-4 shadow-inner">
        <button onClick={() => setTab('corrente')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${tab === 'corrente' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008081] shadow-sm' : 'text-gray-500'}`}>In Corso</button>
        <button onClick={() => setTab('storico')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${tab === 'storico' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008081] shadow-sm' : 'text-gray-500'}`}>Storico ({storicoOrders.length})</button>
      </div>

      {tab === 'corrente' ? (
        orders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-4xl block mb-2">🍽️</span>
            <p className="text-gray-500 dark:text-gray-400">Nessun ordine in corso.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(o => <div key={o.id}>{renderOrderCard(o, false, expandedOrders, toggleOrder, onUpdateStatus)}</div>)}
          </div>
        )
      ) : (
        storicoOrders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-4xl block mb-2">📜</span>
            <p className="text-gray-500 dark:text-gray-400">Nessuno storico disponibile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={onClearStorico} className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 font-bold px-4 py-2 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
                <Trash2 className="w-4 h-4 inline mr-1" />Svuota Storico
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storicoOrders.map(o => <div key={o.id}>{renderOrderCard(o, true, expandedOrders, toggleOrder, onUpdateStatus)}</div>)}
            </div>
          </div>
        )
      )}
    </div>
  );
}


