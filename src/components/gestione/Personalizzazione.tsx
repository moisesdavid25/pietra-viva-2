import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Sliders, ChevronDown, ChevronRight,
  QrCode, Download, Copy, ExternalLink, Info, LayoutGrid,
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

interface ZoneTable { id: string; name: string; pax: number; x: number; y: number; }
interface Zone { id: string; name: string; tables: ZoneTable[]; }

interface Props {
  restaurantId: string;
  restaurantSlug?: string;
}

type Tab = 'qr';

// ── Zone color palette ────────────────────────────────────────────────────────
const ZONE_COLORS = [
  { card: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',   badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',   num: 'text-blue-600 dark:text-blue-400'   },
  { card: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', num: 'text-amber-600 dark:text-amber-400' },
  { card: 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30',   badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',     num: 'text-rose-600 dark:text-rose-400'   },
  { card: 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30', badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300', num: 'text-violet-600 dark:text-violet-400' },
  { card: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', num: 'text-green-600 dark:text-green-400' },
  { card: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', num: 'text-orange-600 dark:text-orange-400' },
];

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
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = `https://leomenu.it/${restaurantSlug}`;

  useEffect(() => {
    db.from('settings').select('value').eq('restaurant_id', restaurantId).eq('key', 'sale').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(parsed)) setZones(parsed);
          } catch (_) {}
        }
        setLoading(false);
      });
  }, [restaurantId]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      showToast('✓ Link copiato!', 'success');
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const allTables = zones.flatMap((z, zi) => z.tables.map(t => ({ zone: z, table: t, colorIdx: zi % ZONE_COLORS.length })));

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#008081] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* ── QR Menu Principale ── */}
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
            {(['asporto', 'delivery'] as const).map(type => {
              const url = `${baseUrl}?type=${type}`;
              const qrId = `qr-${type}-${restaurantSlug}`;
              return (
                <div key={type} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-[#252525] rounded-xl">
                  <div className="hidden"><QRCodeSVG id={qrId} value={url} size={80} level="H" fgColor="#000000" /></div>
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest w-20">{type}</span>
                  <span className="text-[10px] text-gray-400 flex-1 truncate">{url}</span>
                  <button onClick={() => copyLink(url)} className="text-gray-400 hover:text-[#008081] transition-colors flex-shrink-0"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => downloadQRCode(qrId, type.charAt(0).toUpperCase() + type.slice(1))} className="text-gray-400 hover:text-[#008081] transition-colors flex-shrink-0"><Download className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── QR per Tavolo ── */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-black text-gray-900 dark:text-white">QR per Tavolo</h4>
          <p className="text-xs text-gray-400 mt-0.5">{allTables.length} {allTables.length === 1 ? 'tavolo' : 'tavoli'} configurati</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#008081]/8 dark:bg-[#008081]/10 border border-[#008081]/20 rounded-2xl px-4 py-3.5">
        <Info className="w-4 h-4 text-[#008081] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Stampa il QR di ogni tavolo e posizionalo sul tavolo fisico. I clienti lo scansionano e vengono assegnati automaticamente a quel tavolo.
          I tavoli si configurano nella sezione <span className="font-black text-[#008081]">Tavoli → Modifica Layout</span>.
        </p>
      </div>

      {/* No zones configured */}
      {allTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 gap-3">
          <LayoutGrid className="w-10 h-10 text-gray-200 dark:text-gray-700" />
          <p className="text-sm font-black text-gray-400">Nessun tavolo configurato</p>
          <p className="text-xs text-gray-400">Vai in <span className="font-black text-[#008081]">Tavoli → Modifica Layout</span> per aggiungere zone e tavoli</p>
        </div>
      ) : (
        /* Grid grouped by zone */
        <div className="space-y-6">
          {zones.map((zone, zi) => {
            const color = ZONE_COLORS[zi % ZONE_COLORS.length];
            return (
              <div key={zone.id}>
                {/* Zone label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${color.badge}`}>
                    {zone.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{zone.tables.length} tavoli</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {zone.tables.map(table => {
                    const tableUrl = `${baseUrl}?tavolo=${encodeURIComponent(table.name)}`;
                    const qrId = `qr-tavolo-${table.id}`;
                    const isCopied = copiedUrl === tableUrl;
                    return (
                      <div key={table.id} className={`rounded-2xl border p-3 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md transition-shadow ${color.card}`}>
                        {/* Table number */}
                        <span className={`font-black text-2xl leading-none ${color.num}`}>{table.name}</span>

                        {/* QR code */}
                        <div className="bg-white p-2 rounded-xl border border-white/60 shadow-sm">
                          <QRCodeSVG id={qrId} value={tableUrl} size={80} level="H" includeMargin={false} fgColor="#1A1A1A" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 w-full">
                          <button onClick={() => copyLink(tableUrl)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/70 hover:bg-white dark:bg-black/10 dark:hover:bg-black/20 text-gray-500 transition-all text-[10px] font-bold">
                            {isCopied ? <span className="text-green-600">✓</span> : <Copy className="w-3 h-3" />}
                          </button>
                          <button onClick={() => downloadQRCode(qrId, `Tavolo ${table.name}`)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#008081] hover:bg-[#006666] text-white transition-all text-[10px] font-bold">
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
        <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">QR</h2>
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
