import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Sliders, ChevronDown, ChevronRight,
  QrCode, Download, Copy, Table2, ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import db from '../../db';
import { useToast } from '../Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductExtra {
  id: string;
  name: string;
  price: number;
  category: string[];
  available: boolean;
}

interface TableRow {
  id: string;
  name: string;
  table_number: string;
  position: number;
  active: boolean;
}

interface Props {
  restaurantId: string;
  restaurantSlug?: string;
}

type Tab = 'qr';

// ── QR Download util ──────────────────────────────────────────────────────────

function downloadQRCode(svgId: string, filename: string) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    const pad = 32;
    canvas.width = img.width + pad * 2;
    canvas.height = img.height + pad * 2 + 36;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad, pad, img.width, img.height);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(filename, canvas.width / 2, img.height + pad + 22);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.download = `QR_${filename.replace(/\s+/g, '_')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = url;
}

// ── QR Manager ────────────────────────────────────────────────────────────────

function QRManager({ restaurantId, restaurantSlug }: { restaurantId: string; restaurantSlug: string }) {
  const { showToast, ToastContainer } = useToast();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTable, setAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const baseUrl = `https://leomenu.it/${restaurantSlug}`;

  useEffect(() => { fetchTables(); }, [restaurantId]);

  const fetchTables = async () => {
    setLoading(true);
    const { data } = await db.from('tables').select('id,name,table_number,position,active')
      .eq('restaurant_id', restaurantId).order('position').order('created_at');
    setTables(data || []);
    setLoading(false);
  };

  const handleAddTable = async () => {
    const name = newTableName.trim();
    if (!name) return;
    const tableNumber = String(tables.length + 1);
    await db.from('tables').insert({
      restaurant_id: restaurantId,
      name,
      table_number: tableNumber,
      position: tables.length,
      active: true,
    });
    setNewTableName('');
    setAddingTable(false);
    fetchTables();
    showToast(`✓ ${name} aggiunto`, 'success');
  };

  const handleToggleActive = async (t: TableRow) => {
    await db.from('tables').update({ active: !t.active }).eq('id', t.id);
    setTables(prev => prev.map(x => x.id === t.id ? { ...x, active: !t.active } : x));
  };

  const handleDelete = async (t: TableRow) => {
    await db.from('tables').delete().eq('id', t.id);
    setTables(prev => prev.filter(x => x.id !== t.id));
    showToast(`"${t.name}" eliminato`, 'success');
  };

  const handleRename = async (t: TableRow) => {
    const name = editingName.trim();
    if (!name || name === t.name) { setEditingId(null); return; }
    await db.from('tables').update({ name }).eq('id', t.id);
    setTables(prev => prev.map(x => x.id === t.id ? { ...x, name } : x));
    setEditingId(null);
    showToast('✓ Nome aggiornato', 'success');
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('✓ Link copiato!', 'success');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Main restaurant QR */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-black text-gray-900 dark:text-white">QR Menu Principale</h4>
            <p className="text-xs text-gray-400 mt-0.5">{baseUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => copyLink(baseUrl)}
              className="p-2 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors text-gray-500">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => downloadQRCode(`qr-main-${restaurantSlug}`, 'Menu Principale')}
              className="p-2 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors text-gray-500">
              <Download className="w-4 h-4" />
            </button>
            <a href={baseUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors text-gray-500">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
            <QRCodeSVG id={`qr-main-${restaurantSlug}`} value={baseUrl} size={96} level="H" fgColor="#000000" />
          </div>
          <div className="flex flex-col gap-2">
            {/* Special QR types */}
            {(['asporto', 'delivery'] as const).map(type => {
              const url = `${baseUrl}?type=${type}`;
              const qrId = `qr-${type}-${restaurantSlug}`;
              return (
                <div key={type} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-[#252525] rounded-xl">
                  <div className="hidden">
                    <QRCodeSVG id={qrId} value={url} size={80} level="H" fgColor="#000000" />
                  </div>
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest w-20">{type}</span>
                  <span className="text-[10px] text-gray-400 flex-1 truncate">{url}</span>
                  <button onClick={() => copyLink(url)} className="text-gray-400 hover:text-[#008081] transition-colors flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => downloadQRCode(qrId, type.charAt(0).toUpperCase() + type.slice(1))}
                    className="text-gray-400 hover:text-[#008081] transition-colors flex-shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-table QR section */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-black text-gray-900 dark:text-white">QR per Tavolo</h4>
          <p className="text-xs text-gray-400 mt-0.5">{tables.length} {tables.length === 1 ? 'tavolo' : 'tavoli'} configurati</p>
        </div>
        <button onClick={() => setAddingTable(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Aggiungi Tavolo
        </button>
      </div>

      {/* Add table form */}
      {addingTable && (
        <div className="flex gap-2 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-[#008081]/20">
          <input autoFocus value={newTableName} onChange={e => setNewTableName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); if (e.key === 'Escape') setAddingTable(false); }}
            placeholder="Es. Tavolo 1, Bancone, Terrazza..." maxLength={40}
            className="flex-1 px-3 py-2 text-sm font-medium bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081]" />
          <button onClick={handleAddTable} className="px-4 py-2 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors">
            Aggiungi
          </button>
          <button onClick={() => { setAddingTable(false); setNewTableName(''); }}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
            Annulla
          </button>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Table2 className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm font-black text-gray-400">Nessun tavolo ancora</p>
          <p className="text-xs text-gray-400 mt-1">Aggiungi un tavolo per generare il suo QR code</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {tables.map(table => {
            const tableUrl = `${baseUrl}?table=${table.table_number}`;
            const qrId = `qr-table-${table.id}`;
            const isEditingThis = editingId === table.id;
            return (
              <div key={table.id}
                className={`bg-white dark:bg-[#1C1C1C] rounded-xl border shadow-sm transition-all flex flex-col ${table.active ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-40'}`}>
                {/* QR Code — compact */}
                <div className="flex items-center justify-center pt-3 px-3 pb-1.5">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                    <QRCodeSVG id={qrId} value={tableUrl} size={56} level="H" fgColor="#000000" />
                  </div>
                </div>

                {/* Table name */}
                <div className="px-2 pb-1 text-center flex-1">
                  {isEditingThis ? (
                    <input autoFocus value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleRename(table)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(table); if (e.key === 'Escape') setEditingId(null); }}
                      className="w-full text-center text-xs font-black px-1.5 py-0.5 border border-[#008081] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#008081]/40 bg-white dark:bg-[#1A1A1A] dark:text-white" />
                  ) : (
                    <p onClick={() => { setEditingId(table.id); setEditingName(table.name); }}
                      className="text-xs font-black text-gray-800 dark:text-white cursor-text hover:text-[#008081] transition-colors leading-tight" title="Clicca per rinominare">
                      {table.name}
                    </p>
                  )}
                </div>

                {/* Actions — 4 icon buttons in a row */}
                <div className="flex items-center border-t border-gray-50 dark:border-gray-800 divide-x divide-gray-50 dark:divide-gray-800 mt-1">
                  <button onClick={() => copyLink(tableUrl)}
                    className="flex-1 py-2 flex items-center justify-center text-gray-300 hover:text-[#008081] transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => downloadQRCode(qrId, table.name)}
                    className="flex-1 py-2 flex items-center justify-center text-gray-300 hover:text-[#008081] transition-colors">
                    <Download className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleToggleActive(table)}
                    className="flex-1 py-2 flex items-center justify-center transition-colors"
                    title={table.active ? 'Disattiva' : 'Attiva'}>
                    <div className={`w-2 h-2 rounded-full ${table.active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </button>
                  <button onClick={() => handleDelete(table)}
                    className="flex-1 py-2 flex items-center justify-center text-gray-200 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Extras Manager (preserved from original) ──────────────────────────────────

export function ExtrasManager({ restaurantId }: { restaurantId: string }) {
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ name: string; section: string; position: number }[]>([]);
  const [isEditing, setIsEditing] = useState<Partial<ProductExtra> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [restaurantId]);

  const fetchData = async () => {
    setLoading(true);
    const [extrasRes, categoriesRes] = await Promise.all([
      db.from('product_extras').select('id,name,price,category,available')
        .eq('restaurant_id', restaurantId).order('category').order('name'),
      db.from('categories').select('name,section,position')
        .eq('restaurant_id', restaurantId).order('position', { ascending: true }).order('id'),
    ]);
    if (extrasRes.data) setExtras(extrasRes.data);
    if (categoriesRes.data) setCategoriesList(categoriesRes.data as any);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!isEditing?.name || isEditing.price === undefined || !isEditing.category || isEditing.category.length === 0) return;
    if (isEditing.id) {
      await db.from('product_extras').update({
        name: isEditing.name, price: isEditing.price,
        category: isEditing.category, available: isEditing.available !== false,
      }).eq('id', isEditing.id);
    } else {
      await db.from('product_extras').insert({
        restaurant_id: restaurantId,
        name: isEditing.name, price: isEditing.price,
        category: isEditing.category, available: true,
      });
    }
    setIsEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo extra?')) return;
    await db.from('product_extras').delete().eq('id', id);
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-black text-gray-900 dark:text-white">Suggerimenti Rapidi (Extra)</h4>
          <p className="text-xs text-gray-400 mt-0.5">Ingredienti e aggiunte proposte al cliente durante l'ordine</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing({ name: '', price: 0, category: ['Global'] })}
            className="flex items-center gap-2 px-4 py-2 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Nuovo Extra
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-[#262626] p-6 rounded-2xl border border-[#008081]/30 flex flex-col gap-4">
          <h4 className="font-bold text-gray-900 dark:text-white">{isEditing.id ? 'Modifica Extra' : 'Nuovo Extra'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Nome</label>
              <input type="text" value={isEditing.name || ''} onChange={e => setIsEditing({ ...isEditing, name: e.target.value })}
                placeholder="es. Prosciutto Crudo"
                className="w-full p-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081] outline-none text-sm font-medium transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Prezzo (€)</label>
              <input type="number" step="0.10" value={isEditing.price || 0}
                onChange={e => setIsEditing({ ...isEditing, price: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008081]/40 focus:border-[#008081] outline-none text-sm font-medium transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Categorie Assegnate</label>
            <div className="flex flex-wrap gap-2">
              <button type="button"
                onClick={() => {
                  const cats = isEditing.category || [];
                  setIsEditing({ ...isEditing, category: cats.includes('Global') ? cats.filter(c => c !== 'Global') : [...cats, 'Global'] });
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${(isEditing.category || []).includes('Global') ? 'bg-[#008081] text-white border-[#008081]' : 'bg-white text-gray-500 border-gray-200 dark:bg-[#1A1A1A] dark:border-gray-700 hover:border-[#008081]'}`}>
                Global (Tutti)
              </button>
              {Object.entries(
                categoriesList.reduce((acc, cat) => {
                  const macro = cat.section || 'Altre Categorie';
                  if (!acc[macro]) acc[macro] = [];
                  acc[macro].push(cat);
                  return acc;
                }, {} as Record<string, typeof categoriesList>)
              ).map(([macro, microCats]) => {
                const isExp = expandedMacro === macro;
                const selectedN = (microCats as typeof categoriesList).filter(c => (isEditing.category || []).includes(c.name)).length;
                return (
                  <div key={macro} className="w-full border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#1A1A1A]">
                    <button type="button" onClick={() => setExpandedMacro(isExp ? null : macro)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#252525] dark:hover:bg-[#2a2a2a] transition-colors">
                      <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{macro}</span>
                      <div className="flex items-center gap-2">
                        {selectedN > 0 && <span className="bg-[#008081] text-white text-xs font-bold px-2 py-0.5 rounded-md">{selectedN}</span>}
                        {isExp ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    <div className={`transition-all duration-300 ${isExp ? 'max-h-[500px] opacity-100 p-3' : 'max-h-0 opacity-0 overflow-hidden py-0 px-3'}`}>
                      <div className="flex flex-wrap gap-2">
                        {(microCats as typeof categoriesList).map(cat => (
                          <button type="button" key={cat.name}
                            onClick={() => {
                              const cats = isEditing.category || [];
                              setIsEditing({ ...isEditing, category: cats.includes(cat.name) ? cats.filter(c => c !== cat.name) : [...cats, cat.name] });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${(isEditing.category || []).includes(cat.name) ? 'bg-[#008081] text-white border-[#008081]' : 'bg-white text-gray-500 border-gray-200 dark:bg-[#1A1A1A] dark:border-gray-700 hover:border-[#008081]'}`}>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setIsEditing(null)} className="px-5 py-2 font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Annulla</button>
            <button onClick={handleSave} className="px-6 py-2 bg-[#008081] text-white font-bold rounded-xl hover:bg-teal-700 transition-colors">Salva</button>
          </div>
        </div>
      )}

      {extras.length === 0 && !isEditing ? (
        <div className="text-center py-12 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Sliders className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-400">Nessun extra configurato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {extras.map(extra => {
            const isGlobal = (extra.category || []).includes('Global');
            const subCats = (extra.category || []).filter(c => c !== 'Global');
            return (
              <div key={extra.id} className="bg-white dark:bg-[#262626] rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:shadow-sm transition-all">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{extra.name}</span>
                      <span className="text-[#008081] font-bold text-xs bg-teal-50 dark:bg-[#008081]/10 px-2 py-0.5 rounded-md">+ €{extra.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {isGlobal && <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 text-[9px] font-black rounded uppercase tracking-wider">GLOBAL</span>}
                      {subCats.map(c => <span key={c} className="px-1.5 py-0.5 text-[#008081] bg-teal-50 dark:bg-[#008081]/10 border border-[#008081]/20 text-[9px] font-black rounded uppercase tracking-wider">{c}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-[#1A1A1A] p-1 rounded-lg border border-gray-100 dark:border-gray-800">
                    <button onClick={() => setIsEditing(extra)} className="p-1.5 text-blue-500 hover:bg-white dark:hover:bg-[#252525] rounded-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(extra.id)} className="p-1.5 text-red-500 hover:bg-white dark:hover:bg-[#252525] rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main: Personalizzazione ───────────────────────────────────────────────────

export default function Personalizzazione({ restaurantId, restaurantSlug = '' }: Props) {
  const [tab, setTab] = useState<Tab>('qr');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'qr', label: 'QR Manager', icon: QrCode },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">Personalizzazione</h2>
        <p className="text-sm font-bold text-gray-500 mt-0.5">QR code, tavoli e suggerimenti per i clienti.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-xl w-fit shadow-inner">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-white dark:bg-[#262626] text-[#1A1A1A] dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'qr' && (
        restaurantSlug
          ? <QRManager restaurantId={restaurantId} restaurantSlug={restaurantSlug} />
          : (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <QrCode className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm font-black text-gray-400">Slug del ristorante non configurato</p>
              <p className="text-xs text-gray-400 mt-1">Vai in Impostazioni → URL del Menù per configurarlo</p>
            </div>
          )
      )}
    </div>
  );
}
