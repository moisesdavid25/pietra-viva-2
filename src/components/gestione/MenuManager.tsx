import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, List, Save, Trash2, ArrowRight, Eye, EyeOff, Percent, Image as ImageIcon, LayoutGrid, Calendar, Tag, X, Sliders, ShieldAlert, Search, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import db from '../../db';
import ImageCropperModal from '../ImageCropperModal';
import { useToast } from '../Toast';
import { ExtrasManager } from './Personalizzazione';
import { AllergensManager } from './AllergensManager';

interface Props {
    restaurantId: string;
    onOpenListino: () => void;
    onOpenSettings: () => void;
    onOpenPersonalizzazione: () => void;
    onViewChange?: (v: string) => void;
}

interface Category {
    id: string;
    section: string;
    name: string;
    position?: number;
}

interface Product {
    id: string;
    name: string;
    image_url: string;
}

type ViewState = 'hub' | 'wizard-1' | 'wizard-2' | 'wizard-3' | 'success' | 'bundle-editor' | 'extras' | 'allergens';

interface MenuBundle {
    id?: number;
    type: string;
    price: number;
    entree: string;
    primo: string;
    secondo: string;
    contorno: string;
    desert: string;
    bevande: string;
}

const slideVariants = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { x: -40, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
};

function SubHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
    return (
        <div className="sticky top-0 z-20 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 flex items-center h-[56px] px-4 gap-3 flex-shrink-0 -mx-4">
            <button
                onClick={onBack}
                className="w-[34px] h-[34px] rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0"
            >
                <ChevronLeft className="w-4 h-4 text-[#374151] dark:text-gray-300" />
            </button>
            <h2 className="flex-1 font-bold text-[17px] text-[#111827] dark:text-white truncate">{title}</h2>
            {right && <div className="flex-shrink-0">{right}</div>}
        </div>
    );
}

export default function MenuManager({ restaurantId, onOpenListino, onOpenSettings, onOpenPersonalizzazione, onViewChange }: Props) {
    const [view, _setView] = useState<ViewState>('hub');
    const setView = (v: ViewState) => { _setView(v); onViewChange?.(v); };
    const [loading, setLoading] = useState(true);
    const { showToast, ToastContainer } = useToast();

    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [sectionSettings, setSectionSettings] = useState<any>({});
    const [bundles, setBundles] = useState<MenuBundle[]>([]);
    const [editingBundle, setEditingBundle] = useState<MenuBundle | null>(null);
    const [productsWithoutPhoto, setProductsWithoutPhoto] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const [productsPerSection, setProductsPerSection] = useState<Map<string, number>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');

    // Pending delete bundle (undo pattern)
    const [pendingDeleteBundle, setPendingDeleteBundle] = useState<number | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Wizard State
    const [wizardMacro, setWizardMacro] = useState({ name: '', image: '', visible: true });
    const [wizardSubCats, setWizardSubCats] = useState<string[]>(['']);
    const [wizardProducts, setWizardProducts] = useState<{ name: string; price: string; iva: number; description: string; image: string; active: boolean }[]>([]);

    // Cropper
    const [cropperState, setCropperState] = useState<{ src: string | null; aspect: number; callback: ((b64: string) => void) | null }>({ src: null, aspect: 1, callback: null });
    const categoryImageRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const fetchData = async () => {
        setLoading(true);
        const [{ data: cats }, { data: settingsRows }, { data: bundleRows }, { data: prods }] = await Promise.all([
            db.from('categories').select('id,name,section,position').eq('restaurant_id', restaurantId).order('position', { ascending: true }),
            db.from('settings').select('key, value').eq('restaurant_id', restaurantId),
            db.from('menus').select('id,type,price,entree,primo,secondo,contorno,desert,bevande').eq('restaurant_id', restaurantId).order('id'),
            db.from('products').select('id,image_url,category_id').eq('restaurant_id', restaurantId),
        ]);

        if (cats) setCategories(cats);
        if (settingsRows) {
            const obj: any = {};
            settingsRows.forEach((row: any) => { obj[row.key] = row.value; });
            setSectionSettings(obj);
        }
        if (bundleRows) setBundles(bundleRows);
        if (prods) {
            setTotalProducts(prods.length);
            setProductsWithoutPhoto(prods.filter((p: any) => !p.image_url || p.image_url === '').length);
            if (cats) {
                const catToSection = new Map((cats as Category[]).map((c: Category) => [c.id, c.section]));
                const pps = new Map<string, number>();
                (prods as any[]).forEach(p => {
                    const section = catToSection.get(p.category_id);
                    if (section) pps.set(section, (pps.get(section) || 0) + 1);
                });
                setProductsPerSection(pps);
            }
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [restaurantId]);

    // ── Wizard ────────────────────────────────────────────────────────────────
    const handleNext = () => {
        if (view === 'wizard-1') {
            if (!wizardMacro.name.trim()) return showToast('Inserisci il nome della categoria macro', 'error');
            setView('wizard-2');
        } else if (view === 'wizard-2') {
            const validSubCats = wizardSubCats.filter(c => c.trim().length > 0);
            if (validSubCats.length === 0) return showToast('Inserisci almeno una sub-categoria', 'error');
            setWizardSubCats(validSubCats);
            setWizardProducts(validSubCats.map(() => ({ name: '', price: '', iva: 10, description: '', image: '', active: true })));
            setView('wizard-3');
        } else if (view === 'wizard-3') {
            saveWizard();
        }
    };

    const saveWizard = async () => {
        const newCats = await Promise.all(wizardSubCats.map(async (subName, idx) => {
            const { data } = await db.from('categories').insert({
                restaurant_id: restaurantId,
                section: wizardMacro.name.trim(),
                name: subName.trim(),
                position: categories.length + idx
            }).select().single();
            return data;
        }));
        const productsToInsert = wizardProducts
            .map((wp, idx) => ({ wp, cat: newCats[idx] }))
            .filter(({ wp, cat }) => cat && wp.name.trim().length > 0)
            .map(({ wp, cat }, i) => ({
                restaurant_id: restaurantId,
                category_id: cat.id,
                name: wp.name.trim(),
                price: parseFloat(wp.price.replace(',', '.')) || 0,
                description: wp.description?.trim() || '',
                price_unit: null,
                image_url: '',
                sort_order: i,
                active: true,
            }));
        if (productsToInsert.length > 0) {
            const { error: insertError } = await db.from('products').insert(productsToInsert);
            if (insertError) {
                showToast('Errore nel salvataggio dei prodotti: ' + insertError.message, 'error');
                return;
            }
        }
        setWizardProducts([]);
        fetchData();
        setView('success');
    };

    const resetWizard = () => {
        setWizardMacro({ name: '', image: '', visible: true });
        setWizardSubCats(['']);
        setWizardProducts([]);
    };

    // ── Visibility ────────────────────────────────────────────────────────────
    const handleVisibilityToggle = async (section: string) => {
        const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const visibilityKey = `visibility_${sectionSlug}`;
        const isCurrentlyVisible = sectionSettings[visibilityKey] !== 'false';

        const allSections = categories.map((c: Category) => c.section);
        const macroSectionsArr = allSections.filter((s, i) => allSections.indexOf(s) === i);
        if (isCurrentlyVisible) {
            let visibleCount = 0;
            macroSectionsArr.forEach(s => {
                const sSlug = s.toLowerCase().replace(/[^a-z0-9]+/g, '');
                if (sectionSettings[`visibility_${sSlug}`] !== 'false') visibleCount++;
            });
            if (visibleCount <= 1) {
                showToast('Devi mantenere almeno un reparto visibile', 'error');
                return;
            }
        }

        const newValue = isCurrentlyVisible ? 'false' : 'true';
        setSectionSettings((prev: any) => ({ ...prev, [visibilityKey]: newValue }));
        await db.from('settings').upsert(
            { restaurant_id: restaurantId, key: visibilityKey, value: newValue },
            { onConflict: 'restaurant_id,key' }
        );
        await db.from('categories').update({ active: newValue === 'true' }).eq('restaurant_id', restaurantId).eq('section', section);
        showToast(newValue === 'true' ? `${section} ora visibile` : `${section} nascosto`);
    };

    // ── Section Image ─────────────────────────────────────────────────────────
    const handleSectionImageUpload = (file: File, section: string) => {
        const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const sectionKey = `home_image_${sectionSlug}`;
        const reader = new FileReader();
        reader.onload = () => {
            setCropperState({
                src: reader.result as string,
                aspect: 16 / 9,
                callback: async (b64: string) => {
                    try {
                        const res = await fetch(b64);
                        const blob = await res.blob();
                        const fileName = `${restaurantId}/home_${sectionSlug}_${Date.now()}.png`;
                        const { error, data } = await db.storage.from('media').upload(fileName, blob, { upsert: true, contentType: 'image/webp' });
                        if (error) throw error;
                        const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(data.path);
                        setSectionSettings((prev: any) => ({ ...prev, [sectionKey]: publicUrl }));
                        await db.from('settings').upsert(
                            { restaurant_id: restaurantId, key: sectionKey, value: publicUrl },
                            { onConflict: 'restaurant_id,key' }
                        );
                        showToast('✓ Immagine aggiornata');
                    } catch (err) {
                        console.error('[Storage] Upload error', err);
                        showToast('Errore upload immagine', 'error');
                    }
                }
            });
        };
        reader.readAsDataURL(file);
    };

    // ── Bundle CRUD (Undo pattern) ────────────────────────────────────────────
    const emptyBundle = (): MenuBundle => ({ type: '', price: 0, entree: '', primo: '', secondo: '', contorno: '', desert: '', bevande: '' });

    const handleSaveBundle = async () => {
        if (!editingBundle) return;
        if (!editingBundle.type.trim()) return showToast('Inserisci il nome del Menù', 'error');
        if (editingBundle.id) {
            await db.from('menus').update({
                type: editingBundle.type, price: editingBundle.price,
                entree: editingBundle.entree, primo: editingBundle.primo,
                secondo: editingBundle.secondo, contorno: editingBundle.contorno,
                desert: editingBundle.desert, bevande: editingBundle.bevande
            }).eq('id', editingBundle.id);
            showToast('✓ Menù aggiornato');
        } else {
            await db.from('menus').insert({
                restaurant_id: restaurantId,
                type: editingBundle.type, price: editingBundle.price,
                entree: editingBundle.entree, primo: editingBundle.primo,
                secondo: editingBundle.secondo, contorno: editingBundle.contorno,
                desert: editingBundle.desert, bevande: editingBundle.bevande
            });
            showToast('✓ Menù creato');
        }
        setEditingBundle(null);
        fetchData();
    };

    const handleDeleteBundle = (id: number) => {
        setPendingDeleteBundle(id);
        setBundles(prev => prev.filter(b => b.id !== id));
        showToast('Menù eliminato — Annulla?', 'info');
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(async () => {
            await db.from('menus').delete().eq('id', id);
            setPendingDeleteBundle(null);
        }, 4000);
    };

    const handleUndoDeleteBundle = () => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setPendingDeleteBundle(null);
        fetchData();
        showToast('Eliminazione annullata');
    };

    const handleDeleteSection = async (section: string) => {
        const categoriesToDelete = categories.filter(c => c.section === section).map(c => c.id);
        if (categoriesToDelete.length === 0) return;
        await db.from('categories').delete().in('id', categoriesToDelete);
        showToast(`Reparto "${section}" eliminato`);
        fetchData();
    };

    // ── Progress Bar ──────────────────────────────────────────────────────────
    const renderProgressBar = (step: number) => (
        <div className="flex items-center justify-center gap-2 mb-8 bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl shadow-inner w-max mx-auto">
            {[{ n: 1, label: 'Reparto' }, { n: 2, label: 'Sezioni' }, { n: 3, label: 'Prodotto' }].map(({ n, label }, idx, arr) => (
                <React.Fragment key={n}>
                    <div className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 ${step >= n ? 'bg-white dark:bg-[#262626] text-[#008081] shadow-sm' : 'text-gray-400'}`}>
                        {n}. {label}
                    </div>
                    {idx < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                </React.Fragment>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="w-10 h-10 border-4 border-gray-100 dark:border-gray-800 border-t-[#008081] rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Sincronizzazione catalogo...</p>
            </div>
        );
    }

    const macroSections: string[] = Array.from(new Set(categories.map(c => c.section)));
    const hiddenSections = macroSections.filter(s => {
        const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return sectionSettings[`visibility_${slug}`] === 'false';
    }).length;

    return (
        <div className="space-y-6 pb-24">

            {/* ══════════════════════════════════════════════════════════
                HUB — Command Center
            ══════════════════════════════════════════════════════════ */}
            {view === 'hub' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-28 max-w-2xl mx-auto">

                    {/* ── Search ── */}
                    <div className="pt-3 pb-0">
                        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1C1C1C] border border-[#e5e7eb] dark:border-gray-700 rounded-xl px-3.5 py-2.5">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cerca prodotto nel menù..."
                                className="flex-1 text-[13.5px] bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Stat chips ── */}
                    <div className="flex gap-2.5 overflow-x-auto pt-3.5 pb-1 scrollbar-hide">
                        {[
                            { num: macroSections.length, label: 'Reparti', iconBg: '#eff6ff', icon: <LayoutGrid className="w-4 h-4" style={{ color: '#3b82f6' }} />, numColor: '#111827' },
                            { num: hiddenSections, label: 'Nascosti', iconBg: '#fff7ed', icon: <EyeOff className="w-4 h-4" style={{ color: '#f97316' }} />, numColor: hiddenSections > 0 ? '#f97316' : '#111827' },
                            { num: productsWithoutPhoto, label: 'Senza foto', iconBg: '#fff1f2', icon: <ImageIcon className="w-4 h-4" style={{ color: '#ef4444' }} />, numColor: productsWithoutPhoto > 0 ? '#ef4444' : '#111827', onClick: onOpenListino },
                            { num: totalProducts, label: 'Prodotti', iconBg: '#f0fdf4', icon: <BarChart3 className="w-4 h-4" style={{ color: '#16a34a' }} />, numColor: '#16a34a' },
                        ].map(chip => (
                            <button
                                key={chip.label}
                                onClick={chip.onClick}
                                disabled={!chip.onClick}
                                className="flex items-center gap-2.5 bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-xl px-3.5 py-2.5 flex-shrink-0 transition-shadow hover:shadow-sm active:shadow-md disabled:cursor-default"
                            >
                                <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: chip.iconBg }}>
                                    {chip.icon}
                                </div>
                                <div className="text-left">
                                    <div className="text-[20px] font-black leading-none" style={{ color: chip.numColor }}>{chip.num}</div>
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.6px]">{chip.label}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* ── Reparti ── */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[1.2px]">Reparti</p>
                        </div>

                        <div className="space-y-2.5">
                            {macroSections.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-4xl mb-3">🍽️</p>
                                    <p className="font-bold text-gray-400 text-sm">Nessun reparto configurato.</p>
                                    <p className="text-xs text-gray-400 mt-1">Usa il pulsante + per creare il primo reparto.</p>
                                </div>
                            ) : macroSections
                                .filter(s => !searchQuery.trim() || s.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(section => {
                                    const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
                                    const visibilityKey = `visibility_${sectionSlug}`;
                                    const sectionKey = `home_image_${sectionSlug}`;
                                    const isVisible = sectionSettings[visibilityKey] !== 'false';
                                    const thumbSrc = sectionSettings[sectionKey] || null;
                                    const catCount = categories.filter(c => c.section === section).length;
                                    const prodCount = productsPerSection.get(section) || 0;

                                    return (
                                        <div
                                            key={section}
                                            className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-2xl overflow-hidden flex items-center cursor-pointer active:shadow-lg transition-shadow"
                                            onClick={onOpenListino}
                                        >
                                            {/* Thumbnail 80×80 */}
                                            <div className="relative flex-shrink-0 w-20 h-20">
                                                {thumbSrc ? (
                                                    <img src={thumbSrc} alt={section} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#e5e7eb] to-[#d1d5db] dark:from-[#2a2a2a] dark:to-[#1C1C1C] flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-[#9ca3af]" />
                                                    </div>
                                                )}
                                                {!thumbSrc && (
                                                    <div className="absolute top-1.5 left-1.5 bg-[#fef3c7] text-[#d97706] text-[8px] font-bold px-1.5 py-0.5 rounded leading-none">
                                                        SENZA FOTO
                                                    </div>
                                                )}
                                                <input
                                                    type="file" accept="image/*" className="hidden"
                                                    ref={el => { categoryImageRefs.current[section] = el; }}
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) { e.target.value = ''; handleSectionImageUpload(file, section); }
                                                    }}
                                                />
                                                <button
                                                    onClick={e => { e.stopPropagation(); categoryImageRefs.current[section]?.click(); }}
                                                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                                >
                                                    <ImageIcon className="w-2.5 h-2.5" />
                                                </button>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 px-3 py-3.5 min-w-0">
                                                <p className="font-bold text-[15px] text-[#111827] dark:text-white truncate">{section}</p>
                                                <p className="text-[12px] text-[#9ca3af] font-medium mt-0.5">
                                                    {catCount} {catCount === 1 ? 'sezione' : 'sezioni'} · {prodCount} prodotti
                                                </p>
                                            </div>

                                            {/* Toggle + chevron */}
                                            <div className="flex flex-col items-center gap-2.5 pr-4 flex-shrink-0">
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleVisibilityToggle(section); }}
                                                    className={`w-[42px] h-[24px] rounded-full relative transition-colors duration-200 flex-shrink-0 ${isVisible ? 'bg-[#0d9488]' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                >
                                                    <span className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${isVisible ? 'right-[2px]' : 'left-[2px]'}`} />
                                                </button>
                                                <ChevronRight className="w-4 h-4 text-[#d1d5db]" />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* ── Strumenti Menù ── */}
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[1.2px] mb-3">Strumenti Menù</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: 'Listino', sub: `${totalProducts} prodotti`, bg: '#eff6ff', icon: <List className="w-[18px] h-[18px]" style={{ color: '#3b82f6' }} />, onClick: onOpenListino },
                                { label: 'Menù del Giorno', sub: `${bundles.length} bundle`, bg: '#fefce8', icon: <Calendar className="w-[18px] h-[18px]" style={{ color: '#ca8a04' }} />, onClick: () => setView('bundle-editor') },
                                { label: 'Extra & Upsell', sub: 'Suggerimenti rapidi', bg: '#faf5ff', icon: <Sliders className="w-[18px] h-[18px]" style={{ color: '#9333ea' }} />, onClick: () => setView('extras') },
                                { label: 'Allergeni', sub: 'Reg. UE 1169/2011', bg: '#fff7ed', icon: <ShieldAlert className="w-[18px] h-[18px]" style={{ color: '#f97316' }} />, onClick: () => setView('allergens') },
                            ].map(tool => (
                                <button
                                    key={tool.label}
                                    onClick={tool.onClick}
                                    className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[14px] p-3.5 flex items-center gap-2.5 text-left transition-shadow hover:shadow-sm active:scale-[0.98]"
                                >
                                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: tool.bg }}>
                                        {tool.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[13px] text-[#111827] dark:text-white leading-tight">{tool.label}</p>
                                        <p className="text-[10.5px] text-[#9ca3af] mt-0.5">{tool.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── FAB mobile / Button desktop ── */}
                    <button
                        onClick={() => { resetWizard(); setView('wizard-1'); }}
                        className="md:hidden fixed bottom-[100px] right-4 bg-[#0d9488] text-white rounded-[50px] px-5 py-3.5 flex items-center gap-2 font-bold text-[14px] shadow-lg shadow-[#0d9488]/40 z-50 active:scale-95 transition-transform"
                    >
                        <Plus className="w-4 h-4" /> Nuovo Reparto
                    </button>
                    <div className="hidden md:flex justify-start mt-5">
                        <button
                            onClick={() => { resetWizard(); setView('wizard-1'); }}
                            className="flex items-center gap-2 bg-[#008081] text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-[#008081]/20 hover:bg-teal-600 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Nuovo Reparto
                        </button>
                    </div>

                </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════
                BUNDLE EDITOR — Menù del Giorno
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {view === 'bundle-editor' && (
                    <motion.div key="bundle" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto space-y-4">

                        <SubHeader
                            title="Menù del Giorno"
                            onBack={() => { setEditingBundle(null); setView('hub'); }}
                            right={!editingBundle ? (
                                <button
                                    onClick={() => setEditingBundle(emptyBundle())}
                                    className="flex items-center gap-1.5 bg-[#008081] text-white font-bold px-3 py-2 rounded-xl text-sm shadow-md hover:bg-teal-600 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Nuovo
                                </button>
                            ) : undefined}
                        />

                        {/* Undo snackbar */}
                        <AnimatePresence>
                            {pendingDeleteBundle !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    className="flex items-center justify-between bg-[#1A1A1A] text-white px-4 py-3 rounded-xl shadow-lg"
                                >
                                    <p className="text-sm font-bold">Menù eliminato</p>
                                    <button onClick={handleUndoDeleteBundle} className="text-[#008081] font-black text-sm hover:text-teal-400 transition-colors ml-4">
                                        ANNULLA
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Bundle List */}
                        {!editingBundle && (
                            <div className="space-y-3">
                                {bundles.length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-[#1C1C1C] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm font-semibold">Nessun bundle configurato.</p>
                                    </div>
                                )}

                                {bundles.map(bundle => (
                                    <div key={bundle.id} className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-base text-gray-900 dark:text-white uppercase tracking-wide">
                                                    Menù {bundle.type}
                                                </span>
                                            </div>
                                            <span className="font-black text-lg text-[#008081]">
                                                €{Number(bundle.price).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Course Grid */}
                                        <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
                                            {[
                                                { key: 'entree', label: 'Entrée' },
                                                { key: 'primo', label: 'Primo' },
                                                { key: 'secondo', label: 'Secondo' },
                                                { key: 'contorno', label: 'Contorno' },
                                                { key: 'desert', label: 'Dessert' },
                                                { key: 'bevande', label: 'Bevande' },
                                            ].filter(({ key }) => (bundle as any)[key]).map(({ key, label }) => (
                                                <div key={key} className="min-w-0">
                                                    <p className="text-[9px] font-black text-[#008081] uppercase tracking-widest">{label}</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold truncate mt-0.5">{(bundle as any)[key]}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 px-5 pb-4">
                                            <button
                                                onClick={() => setEditingBundle({ ...bundle })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 rounded-xl transition-colors"
                                            >
                                                <Save className="w-3.5 h-3.5" /> Modifica
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBundle(bundle.id!)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Elimina
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bundle Form */}
                        {editingBundle && (
                            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <h3 className="font-black text-lg text-[#008081]">
                                        {editingBundle.id ? 'Modifica Menù' : 'Nuovo Menù'}
                                    </h3>
                                    <button onClick={() => setEditingBundle(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipo Menù *</label>
                                        <input type="text" placeholder="Es. Carne, Pesce, Pizza..." className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingBundle.type} onChange={e => setEditingBundle({ ...editingBundle, type: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prezzo (€) *</label>
                                        <input type="number" step="0.5" placeholder="16.00" className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl font-black text-[#008081] text-lg focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingBundle.price || ''} onChange={e => setEditingBundle({ ...editingBundle, price: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Composizione</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {([
                                            { key: 'entree', label: 'Entrée' },
                                            { key: 'primo', label: 'Primo / Main' },
                                            { key: 'secondo', label: 'Secondo' },
                                            { key: 'contorno', label: 'Contorno' },
                                            { key: 'desert', label: 'Dessert' },
                                            { key: 'bevande', label: 'Bevande' },
                                        ] as { key: keyof MenuBundle; label: string }[]).map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="block text-[9px] font-black text-[#008081] uppercase tracking-widest mb-1">{label}</label>
                                                <input
                                                    type="text"
                                                    placeholder={label}
                                                    className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008081]/30 outline-none"
                                                    value={(editingBundle[key] as string) || ''}
                                                    onChange={e => setEditingBundle({ ...editingBundle, [key]: e.target.value })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={handleSaveBundle} className="flex-1 py-3 bg-[#008081] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-[#008081]/20">
                                        <Save className="w-4 h-4" /> Salva Menù
                                    </button>
                                    <button onClick={() => setEditingBundle(null)} className="flex-1 py-3 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                        Annulla
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════
                WIZARD — Step 1: Macro Category
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {view === 'wizard-1' && (
                    <motion.div key="w1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader title="Nuovo Reparto" onBack={() => setView('hub')} />
                        {renderProgressBar(1)}
                        <div className="bg-white dark:bg-[#1C1C1C] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Il Reparto</h2>
                                <p className="text-gray-400 text-sm mt-2">Come si chiama questa grande famiglia di prodotti?</p>
                            </div>
                            <input
                                type="text"
                                value={wizardMacro.name}
                                onChange={e => setWizardMacro({ ...wizardMacro, name: e.target.value })}
                                placeholder="Es. Pizzeria, Cucina, Sushi, Bar..."
                                className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center font-bold text-xl text-[#008081] focus:ring-2 focus:ring-[#008081]/30 transition-all outline-none"
                                onKeyDown={e => e.key === 'Enter' && handleNext()}
                            />
                            <button onClick={handleNext} className="w-full bg-[#008081] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-600 active:scale-[0.98] transition-all">
                                Continua alle Sezioni <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Sub-Categories */}
                {view === 'wizard-2' && (
                    <motion.div key="w2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader title="Le Sezioni" onBack={() => setView('wizard-1')} />
                        {renderProgressBar(2)}
                        <div className="bg-white dark:bg-[#1C1C1C] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Le Sezioni</h2>
                                <p className="text-gray-400 text-sm mt-2">Come vuoi dividere <strong className="text-[#008081]">{wizardMacro.name}</strong>?</p>
                            </div>
                            <div className="space-y-3">
                                {wizardSubCats.map((sub, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={sub}
                                            onChange={e => { const n = [...wizardSubCats]; n[idx] = e.target.value; setWizardSubCats(n); }}
                                            placeholder={idx === 0 ? 'Es. Pizze Classiche' : 'Nuova Sezione'}
                                            className="flex-1 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none"
                                        />
                                        {idx > 0 && (
                                            <button onClick={() => setWizardSubCats(wizardSubCats.filter((_, i) => i !== idx))} className="w-12 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setWizardSubCats([...wizardSubCats, ''])} className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-[#008081] hover:border-[#008081] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm">
                                <Plus className="w-4 h-4" /> Aggiungi sezione
                            </button>
                            <button onClick={handleNext} className="w-full bg-[#008081] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-600 active:scale-[0.98] transition-all">
                                Continua ai Prodotti <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: First Product */}
                {view === 'wizard-3' && (
                    <motion.div key="w3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader title="Aggiungi Prodotti" onBack={() => setView('wizard-2')} />
                        {renderProgressBar(3)}
                        <div className="space-y-4">
                            <div className="text-center mb-2">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Primi Prodotti</h2>
                                <p className="text-gray-400 text-sm mt-1">Aggiungi un prodotto per ogni sezione (opzionale)</p>
                            </div>
                            {wizardSubCats.map((sub, idx) => {
                                const wp = wizardProducts[idx] || { name: '', price: '', iva: 10, description: '', image: '', active: true };
                                const updateWp = (fields: Partial<typeof wp>) => {
                                    setWizardProducts(prev => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], ...fields };
                                        return next;
                                    });
                                };
                                return (
                                    <div key={idx} className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-[#008081] bg-[#008081]/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{wizardMacro.name}</span>
                                            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{sub}</span>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome Prodotto</label>
                                            <input type="text" value={wp.name} onChange={e => updateWp({ name: e.target.value })} placeholder="Es. Margherita" className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-bold text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prezzo (€)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                                                    <input type="text" value={wp.price} onChange={e => updateWp({ price: e.target.value })} placeholder="8,50" className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-8 pr-3 font-black text-lg text-[#008081] focus:ring-2 focus:ring-[#008081]/30 outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">IVA</label>
                                                <div className="relative">
                                                    <select value={wp.iva} onChange={e => updateWp({ iva: parseInt(e.target.value) })} className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none appearance-none pr-8">
                                                        <option value="4">4% Minim.</option>
                                                        <option value="5">5% Ridotta</option>
                                                        <option value="10">10% Ristor.</option>
                                                        <option value="22">22% Ordinaria</option>
                                                    </select>
                                                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={handleNext} className="w-full bg-[#008081] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-600 active:scale-[0.98] transition-all">
                                <Save className="w-5 h-5" /> Salva e Termina
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Success */}
                {view === 'success' && (
                    <motion.div key="success" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto text-center mt-8 space-y-6">
                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                            <LayoutGrid className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Reparto Creato!</h2>
                        <p className="text-gray-400 font-medium">La struttura è configurata e il primo piatto è pronto.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { resetWizard(); onOpenPersonalizzazione(); }} className="w-full border-2 border-[#008081] text-[#008081] py-4 rounded-2xl font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
                                Associa Suggerimenti Rapidi
                            </button>
                            <button onClick={() => { resetWizard(); setView('hub'); }} className="w-full bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Torna al Menù Diretto
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════
                EXTRAS VIEW
            ══════════════════════════════════════════════════════════ */}
            {view === 'extras' && (
                <div className="space-y-4">
                    <SubHeader title="Extra & Upsell" onBack={() => setView('hub')} />
                    <ExtrasManager restaurantId={restaurantId} />
                </div>
            )}

            {view === 'allergens' && (
                <div className="space-y-4">
                    <SubHeader title="Allergeni" onBack={() => setView('hub')} />
                    <AllergensManager restaurantId={restaurantId} />
                </div>
            )}

            {/* Cropper */}
            <ImageCropperModal
                imageSrc={cropperState.src}
                aspect={cropperState.aspect}
                onConfirm={b64 => { if (cropperState.callback) cropperState.callback(b64); setCropperState({ src: null, aspect: 1, callback: null }); }}
                onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })}
            />
            <ToastContainer />
        </div>
    );
}
