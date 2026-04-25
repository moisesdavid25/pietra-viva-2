import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Users, ShoppingBag, Calendar, DatabaseBackup, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, Package } from 'lucide-react';
import db from '../../db';

interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_tier: string | null;
  user_id: string;
}

interface Backup {
  id: string;
  restaurant_id: string;
  trigger_reason: string;
  created_at: string;
  data: {
    categories: { section: string; name: string }[];
    products: { name: string; image_url?: string }[];
    settings: unknown[];
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function triggerLabel(reason: string) {
  if (reason.startsWith('delete_section:'))    return `Eliminazione reparto: ${reason.replace('delete_section:', '')}`;
  if (reason.startsWith('delete_subcategory:')) return `Eliminazione sezione: ${reason.replace('delete_subcategory:', '')}`;
  return reason;
}

export function AdminRestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant]     = useState<RestaurantDetail | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [orderCount, setOrderCount]     = useState<number>(0);
  const [loading, setLoading]           = useState(true);

  // Backup state
  const [backups, setBackups]           = useState<Backup[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [expandedBackup, setExpandedBackup] = useState<string | null>(null);
  const [restoreDialog, setRestoreDialog]   = useState<Backup | null>(null);
  const [restoring, setRestoring]       = useState(false);
  const [restoreResult, setRestoreResult]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      db.from('restaurants').select('id, name, slug, created_at, subscription_tier, user_id').eq('id', id).single(),
      db.from('customers').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
      db.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', id),
    ]).then(([res, cust, ord]) => {
      if (res.data) setRestaurant(res.data as RestaurantDetail);
      setCustomerCount(cust.count ?? 0);
      setOrderCount(ord.count ?? 0);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    db.from('restaurant_backups')
      .select('id, restaurant_id, trigger_reason, created_at, data')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setBackups((data as Backup[]) ?? []);
        setBackupsLoading(false);
      });
  }, [id]);

  const handleRestore = async (backup: Backup) => {
    setRestoring(true);
    setRestoreResult(null);
    const { data, error } = await db.rpc('restore_restaurant_backup', { p_backup_id: backup.id });
    setRestoring(false);
    setRestoreDialog(null);
    if (error) {
      setRestoreResult(`Errore: ${error.message}`);
    } else {
      const r = data as { categories_restored: number; products_restored: number };
      setRestoreResult(`✓ Ripristino completato: ${r.categories_restored} sezioni, ${r.products_restored} prodotti.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#008081] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Store size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-bold">Ristorante non trovato</p>
      </div>
    );
  }

  const tierKey = restaurant.subscription_tier ?? 'trial';
  const tierMap: Record<string, { label: string; cls: string }> = {
    trial:      { label: 'Trial',      cls: 'bg-amber-100 text-amber-700' },
    base:       { label: 'Base',       cls: 'bg-blue-100 text-blue-700' },
    pro:        { label: 'Pro',        cls: 'bg-violet-100 text-violet-700' },
    enterprise: { label: 'Enterprise', cls: 'bg-emerald-100 text-emerald-700' },
  };
  const { label: statusLabel, cls: statusCls } = tierMap[tierKey] ?? tierMap['trial'];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#008081] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Ristoranti
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Store size={22} className="text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{restaurant.name}</h1>
            <p className="text-xs text-gray-400 font-medium">/{restaurant.slug}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clienti',       value: customerCount,               icon: Users,        color: 'text-violet-600 bg-violet-50' },
          { label: 'Ordini Totali', value: orderCount,                  icon: ShoppingBag,  color: 'text-[#008081] bg-teal-50' },
          { label: 'Piano',         value: statusLabel,                 icon: ShoppingBag,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Registrato',    value: formatDate(restaurant.created_at), icon: Calendar, color: 'text-gray-600 bg-gray-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
              <item.icon size={16} className={item.color.split(' ')[0]} />
            </div>
            <p className="text-xl font-black text-[#1A1A1A]">{item.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Trial info */}
      {tierKey === 'trial' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Account in prova (Trial)</p>
          <p className="text-sm text-amber-700 font-medium">
            Nessun piano attivo — attiva Stripe per monitorare la scadenza.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Azioni</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/${restaurant.slug}/gestione`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#008081] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-colors"
          >
            Apri pannello ristorante ↗
          </a>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Estendi trial +7 giorni
          </button>
          <button className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
            Sospendi account
          </button>
        </div>
      </div>

      {/* ── Backup Panel ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <DatabaseBackup size={16} className="text-[#008081]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Backup Menu ({backups.length})
          </p>
        </div>

        {/* Restore result */}
        {restoreResult && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-bold ${restoreResult.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {restoreResult}
          </div>
        )}

        {backupsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-4 border-gray-100 border-t-[#008081] animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
            <DatabaseBackup size={32} className="opacity-30" />
            <p className="text-sm font-bold">Nessun backup ancora</p>
            <p className="text-xs text-center px-6">I backup vengono creati automaticamente prima di ogni eliminazione di reparto o sezione.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {backups.map((backup) => {
              const isExpanded = expandedBackup === backup.id;
              const catCount   = backup.data?.categories?.length ?? 0;
              const prodCount  = backup.data?.products?.length   ?? 0;
              const withPhoto  = backup.data?.products?.filter(p => p.image_url && p.image_url.length > 5).length ?? 0;

              // Group categories by section for display
              const sections: Record<string, string[]> = {};
              backup.data?.categories?.forEach(c => {
                if (!sections[c.section]) sections[c.section] = [];
                sections[c.section].push(c.name);
              });

              return (
                <div key={backup.id}>
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedBackup(isExpanded ? null : backup.id)}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center mt-0.5">
                        <DatabaseBackup size={14} className="text-[#008081]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{triggerLabel(backup.trigger_reason)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(backup.created_at)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-[#008081] bg-teal-50 px-2 py-0.5 rounded-full">
                            {catCount} sezioni
                          </span>
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            {prodCount} prodotti
                          </span>
                          {withPhoto > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              {withPhoto} con foto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={e => { e.stopPropagation(); setRestoreDialog(backup); setRestoreResult(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008081] text-white text-[11px] font-bold rounded-lg hover:bg-[#006666] transition-colors"
                      >
                        <RotateCcw size={11} /> Ripristina
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                      <div className="mt-4 space-y-3">
                        {Object.entries(sections).map(([section, subcats]) => (
                          <div key={section}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{section}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {subcats.map(sc => (
                                <span key={sc} className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg">{sc}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {prodCount > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Prodotti nel backup</p>
                            <div className="flex flex-wrap gap-1">
                              {backup.data.products.slice(0, 20).map((p, i) => (
                                <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  {p.image_url && p.image_url.length > 5 && <Package size={8} className="text-amber-500" />}
                                  {p.name}
                                </span>
                              ))}
                              {prodCount > 20 && <span className="text-[10px] text-gray-400 px-2 py-0.5">+{prodCount - 20} altri...</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Restore Confirmation Modal ────────────────────────────────────────── */}
      {restoreDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !restoring && setRestoreDialog(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Ripristinare questo backup?</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Il menu attuale verrà sostituito con il contenuto del backup del{' '}
                    <strong>{formatDateTime(restoreDialog.created_at)}</strong>.
                  </p>
                  <p className="text-xs text-red-500 font-bold mt-2 bg-red-50 rounded-lg px-3 py-2">
                    Questa azione è irreversibile. Le modifiche effettuate dopo questo backup andranno perse.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setRestoreDialog(null)}
                disabled={restoring}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={() => handleRestore(restoreDialog)}
                disabled={restoring}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#008081] hover:bg-[#006666] transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {restoring ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Ripristino...</>
                ) : (
                  <><RotateCcw className="w-4 h-4" /> Conferma</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
