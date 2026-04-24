import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Save, Users, LayoutGrid, RefreshCw } from 'lucide-react';
import db from '../../db';

type Table = { id: string; name: string; pax: number; x: number; y: number };
type Zone = { id: string; name: string; tables: Table[] };
type ActiveOrder = { id: string; table_number: string; status: string; total_price: number; created_at: string; covers?: number | null };

// ── Status color system ───────────────────────────────────────────────────────
// 5 colori semantici — el personal los aprende en 1 turno
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  libera:          { bg: 'bg-[#E8E5FF] dark:bg-[#2A2A3D]', text: 'text-[#5C5C77] dark:text-[#A0A0C0]', label: 'Libero',          dot: 'bg-[#C4BFFF]' },
  in_attesa:       { bg: 'bg-[#F97316]',                   text: 'text-white',                           label: 'In Attesa',      dot: 'bg-[#F97316]' },
  in_preparazione: { bg: 'bg-[#3B82F6]',                   text: 'text-white',                           label: 'In Preparazione', dot: 'bg-[#3B82F6]' },
  pronto:          { bg: 'bg-[#22C55E]',                   text: 'text-white',                           label: 'Pronto',         dot: 'bg-[#22C55E]' },
  conto:           { bg: 'bg-[#B19543]',                   text: 'text-white',                           label: 'Conto',          dot: 'bg-[#B19543]' },
};

function getTableStatus(order: ActiveOrder | undefined): string {
  if (!order) return 'libera';
  if (order.status === 'conto') return 'conto';
  return order.status; // in_attesa | in_preparazione | pronto
}

// Minutes elapsed since order was created
function minutesSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
}

// ── Draggable table tile ─────────────────────────────────────────────────────
function DraggableTile({ t, zoneId, order, isEditMode, onDrop, onEdit, onDelete }: {
  t: Table; zoneId: string; order?: ActiveOrder;
  isEditMode: boolean;
  onDrop: (zId: string, tId: string, x: number, y: number) => void;
  onEdit: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: t.x ?? 10, y: t.y ?? 10 });
  useEffect(() => setPos({ x: t.x ?? 10, y: t.y ?? 10 }), [t.x, t.y]);

  const statusKey = getTableStatus(order);
  const style = STATUS_STYLE[statusKey] || STATUS_STYLE.libera;
  const mins = order ? minutesSince(order.created_at) : 0;
  const isUrgent = statusKey === 'in_attesa' && mins >= 15;
  const isReady  = statusKey === 'pronto';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.target as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, ix = pos.x, iy = pos.y;
    const onMove = (ev: PointerEvent) => {
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      setPos({
        x: Math.max(3, Math.min(93, ix + ((ev.clientX - sx) / rect.width) * 100)),
        y: Math.max(3, Math.min(93, iy + ((ev.clientY - sy) / rect.height) * 100)),
      });
    };
    const onUp = (ev: PointerEvent) => {
      try { (ev.target as HTMLElement).releasePointerCapture(ev.pointerId); } catch (_) {}
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      onDrop(zoneId, t.id,
        Math.max(3, Math.min(93, ix + ((ev.clientX - sx) / rect.width) * 100)),
        Math.max(3, Math.min(93, iy + ((ev.clientY - sy) / rect.height) * 100))
      );
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: isEditMode ? 'none' : 'auto' }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center transition-all shadow-md select-none z-50
        ${isEditMode ? 'cursor-move ring-2 ring-[#008081] scale-[1.08]' : 'cursor-default'}
        ${isReady ? 'animate-pulse ring-4 ring-[#22C55E]/40' : ''}
        ${isUrgent ? 'ring-4 ring-red-400/60' : ''}
        ${style.bg} ${style.text}
      `}
    >
      <span className="font-black text-xl md:text-2xl leading-none pointer-events-none">{t.name}</span>

      {/* Status sub-label */}
      {statusKey === 'libera' ? (
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-0.5 pointer-events-none">{t.pax}p</span>
      ) : statusKey === 'pronto' ? (
        <span className="text-[8px] font-black uppercase pointer-events-none mt-0.5">PRONTO ✓</span>
      ) : statusKey === 'conto' ? (
        <span className="text-[8px] font-black uppercase pointer-events-none mt-0.5">CONTO</span>
      ) : (
        <span className="text-[8px] font-black uppercase pointer-events-none mt-0.5 opacity-90 flex items-center gap-0.5">
          {order?.covers ? <>{order.covers}p</> : null}
          {order?.covers && mins > 0 ? <span className="opacity-40">·</span> : null}
          {mins > 0 ? <>{isUrgent ? `⚠${mins}min` : `${mins}min`}</> : (!order?.covers ? '—' : null)}
        </span>
      )}

      {isEditMode && (
        <div className="absolute -bottom-3 flex gap-1">
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onEdit(); }}
            className="w-5 h-5 bg-white dark:bg-[#2A2A2A] text-blue-600 rounded-full flex items-center justify-center shadow border border-gray-100 dark:border-gray-700">
            <Edit2 className="w-2.5 h-2.5" />
          </button>
          <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 bg-white dark:bg-[#2A2A2A] text-red-500 rounded-full flex items-center justify-center shadow border border-gray-100 dark:border-gray-700">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TavoliManager({ restaurantId }: { restaurantId: string }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTable, setEditingTable] = useState<{ zoneId: string; table: Partial<Table>; isNew: boolean } | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  // ── Load data + realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    let mounted = true;

    const fetchOrders = () =>
      db.from('orders')
        .select('id, table_number, status, total_price, created_at, covers')
        .eq('restaurant_id', restaurantId)
        .neq('status', 'consegnato')
        .then(({ data }) => { if (data && mounted) setActiveOrders(data); });

    (async () => {
      const [{ data: s }] = await Promise.all([
        db.from('settings').select('value').eq('restaurant_id', restaurantId).eq('key', 'sale').maybeSingle(),
        fetchOrders(),
      ]);
      if (!mounted) return;
      if (s?.value) {
        try {
          let parsed = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
          if (Array.isArray(parsed)) setZones(parsed);
        } catch (_) {}
      }
    })();

    // Realtime: ogni cambio di stato aggiorna il plano in tempo reale
    const ch = db.channel(`tavoli-manager-${restaurantId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => fetchOrders())
      .subscribe();

    // Refresh timer per aggiornare il contatore minuti (ogni 60s)
    const timer = setInterval(fetchOrders, 60000);

    return () => { mounted = false; db.removeChannel(ch); clearInterval(timer); };
  }, [restaurantId]);

  // ── Persist zones ──────────────────────────────────────────────────────────
  const save = async (newZones: Zone[]) => {
    setSaving(true);
    await db.from('settings').upsert({ restaurant_id: restaurantId, key: 'sale', value: JSON.stringify(newZones) });
    setSaving(false);
  };

  const handleDrop = (zId: string, tId: string, x: number, y: number) => {
    const updated = zones.map(z => z.id === zId
      ? { ...z, tables: z.tables.map(t => t.id === tId ? { ...t, x, y } : t) }
      : z);
    setZones(updated);
    save(updated);
  };

  const handleSaveTable = () => {
    if (!editingTable || !editingTable.table.name?.trim()) return;
    const { zoneId, table, isNew } = editingTable;
    const newTable: Table = {
      id: table.id || `t${Date.now()}`,
      name: table.name.trim(),
      pax: table.pax || 2,
      x: table.x ?? 15,
      y: table.y ?? 15,
    };
    const updated = zones.map(z => z.id === zoneId
      ? { ...z, tables: isNew ? [...z.tables, newTable] : z.tables.map(t => t.id === newTable.id ? newTable : t) }
      : z);
    setZones(updated);
    save(updated);
    setEditingTable(null);
  };

  const handleDeleteTable = (zoneId: string, tableId: string) => {
    const updated = zones.map(z => z.id === zoneId ? { ...z, tables: z.tables.filter(t => t.id !== tableId) } : z);
    setZones(updated);
    save(updated);
  };

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    const updated = [...zones, { id: `z${Date.now()}`, name: newZoneName.trim(), tables: [] }];
    setZones(updated);
    save(updated);
    setNewZoneName('');
    setAddingZone(false);
  };

  const handleDeleteZone = (zId: string) => {
    const updated = zones.filter(z => z.id !== zId);
    setZones(updated);
    save(updated);
  };

  // ── Zone-qualified order matching ─────────────────────────────────────────
  const findOrder = (zone: Zone, t: Table): ActiveOrder | undefined => {
    const zoneKey = `${zone.name} · T${t.name}`;
    return activeOrders.find(o => o.table_number === zoneKey || o.table_number === `Tavolo ${t.name}`);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const allPairs = zones.flatMap(z => z.tables.map(t => ({ z, t })));
  const occupiedCount = allPairs.filter(({ z, t }) => !!findOrder(z, t)).length;
  const readyCount    = activeOrders.filter(o => o.status === 'pronto').length;
  const libreCount    = allPairs.length - occupiedCount;

  return (
    <div className="w-full max-w-5xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Tavoli</h2>
          <p className="text-sm text-gray-500 font-bold mt-0.5">Configura la planimetria della tua sala</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Stats pills */}
          <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#E8E5FF] dark:bg-[#2A2A3D] text-[#5C5C77] dark:text-[#A0A0C0]">
            {libreCount} Liberi
          </span>
          <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#5C5C77] text-white">
            {occupiedCount} Occupati
          </span>
          {readyCount > 0 && (
            <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#22C55E] text-white animate-pulse">
              {readyCount} Pronti ✓
            </span>
          )}
          <button
            onClick={() => setIsEditMode(e => !e)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              isEditMode
                ? 'bg-[#008081] text-white shadow-lg shadow-[#008081]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isEditMode ? <><Save className="w-4 h-4" /> Fine</> : <><Edit2 className="w-4 h-4" /> Modifica Layout</>}
          </button>
        </div>
      </div>

      {/* Zones */}
      {zones.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1C] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-16 text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="font-black text-gray-400 dark:text-gray-500 text-sm uppercase tracking-widest mb-6">Nessuna zona configurata</p>
          <button onClick={() => setAddingZone(true)} className="bg-[#008081] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-teal-600 transition-colors">
            + Aggiungi la prima zona
          </button>
        </div>
      ) : (
        zones.map(zone => (
          <div key={zone.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Zone header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400" />
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-700 dark:text-gray-300">{zone.name}</h3>
                <span className="text-[10px] font-bold text-gray-400">{zone.tables.length} tavoli</span>
              </div>
              {isEditMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTable({ zoneId: zone.id, table: { x: 10, y: 20 }, isNew: true })}
                    className="flex items-center gap-1.5 text-xs font-black text-[#008081] bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tavolo
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Floor plan */}
            <div className={`relative w-full h-[340px] md:h-[420px] bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#2a2a2a_1.5px,transparent_1.5px)] [background-size:22px_22px] transition-colors ${
              isEditMode ? 'bg-teal-50/30 dark:bg-teal-900/10' : 'bg-gray-50/50 dark:bg-[#141414]'
            }`}>
              {zone.tables.length === 0 && !isEditMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zona vuota — attiva Modifica per aggiungere tavoli</p>
                </div>
              )}
              {zone.tables.map(t => {
                const order = findOrder(zone, t);
                return (
                  <DraggableTile
                    key={t.id} t={t} zoneId={zone.id} order={order}
                    isEditMode={isEditMode}
                    onDrop={handleDrop}
                    onEdit={() => setEditingTable({ zoneId: zone.id, table: { ...t }, isNew: false })}
                    onDelete={() => handleDeleteTable(zone.id, t.id)}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
              {Object.entries(STATUS_STYLE).map(([key, s]) => (
                <span key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />{s.label}
                </span>
              ))}
              {saving && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#008081]">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Salvataggio…
                </span>
              )}
            </div>
          </div>
        ))
      )}

      {/* Add Zone */}
      {isEditMode && (
        addingZone ? (
          <div className="bg-white dark:bg-[#1C1C1C] border border-[#008081]/30 rounded-2xl p-4 flex items-center gap-3">
            <input
              autoFocus type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddZone()}
              placeholder="Nome zona (es. Sala, Terrazza, Bar…)"
              className="flex-1 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#008081] transition-colors dark:text-white"
            />
            <button onClick={handleAddZone} className="bg-[#008081] text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-teal-600 transition-colors">Aggiungi</button>
            <button onClick={() => { setAddingZone(false); setNewZoneName(''); }} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        ) : (
          <button
            onClick={() => setAddingZone(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-4 text-sm font-black text-gray-400 dark:text-gray-600 hover:border-[#008081] hover:text-[#008081] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Aggiungi Zona
          </button>
        )
      )}

      {/* Edit table modal */}
      {editingTable && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingTable(null)} />
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 w-full max-w-xs relative z-10 shadow-2xl">
            <button onClick={() => setEditingTable(null)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="font-black text-lg uppercase mb-5 text-gray-900 dark:text-white">
              {editingTable.isNew ? 'Nuovo Tavolo' : 'Modifica Tavolo'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Nome Tavolo</label>
                <input
                  autoFocus type="text" placeholder="es. 1, A, VIP..."
                  value={editingTable.table.name || ''}
                  onChange={e => setEditingTable(p => p ? { ...p, table: { ...p.table, name: e.target.value } } : p)}
                  className="w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-lg text-center outline-none focus:border-[#008081] dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Posti (PAX)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingTable(p => p ? { ...p, table: { ...p.table, pax: Math.max(1, (p.table.pax || 2) - 1) } } : p)}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl font-black text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">−</button>
                  <span className="flex-1 text-center font-black text-3xl text-[#008081]">{editingTable.table.pax || 2}</span>
                  <button onClick={() => setEditingTable(p => p ? { ...p, table: { ...p.table, pax: (p.table.pax || 2) + 1 } } : p)}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl font-black text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">+</button>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveTable}
              disabled={!editingTable.table.name?.trim()}
              className="w-full mt-6 bg-[#008081] disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 rounded-xl font-black uppercase text-sm hover:bg-teal-600 transition-colors shadow-lg shadow-[#008081]/20"
            >
              <Save className="w-4 h-4 inline-block mr-2" />Salva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
