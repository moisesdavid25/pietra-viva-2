import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Save, AlertTriangle, ShieldOff, ShieldCheck } from 'lucide-react';
import db from '../../db';
import { useToast } from '../Toast';

// ── 14 Allergeni UE — Reg. 1169/2011 ────────────────────────────────────────

export const ALLERGENS = [
    { id: 'glutine',      label: 'Glutine',         emoji: '🌾' },
    { id: 'crostacei',   label: 'Crostacei',        emoji: '🦐' },
    { id: 'uova',        label: 'Uova',             emoji: '🥚' },
    { id: 'pesce',       label: 'Pesce',            emoji: '🐟' },
    { id: 'arachidi',    label: 'Arachidi',         emoji: '🥜' },
    { id: 'soia',        label: 'Soia',             emoji: '🫘' },
    { id: 'latte',       label: 'Latte',            emoji: '🥛' },
    { id: 'frutta_guscio', label: 'Frutta a guscio', emoji: '🌰' },
    { id: 'sedano',      label: 'Sedano',           emoji: '🥬' },
    { id: 'senape',      label: 'Senape',           emoji: '🟡' },
    { id: 'sesamo',      label: 'Sesamo',           emoji: '⚪' },
    { id: 'solfiti',     label: 'Solfiti',          emoji: '🍷' },
    { id: 'lupini',      label: 'Lupini',           emoji: '🌿' },
    { id: 'molluschi',   label: 'Molluschi',        emoji: '🦑' },
];

// ── AllergenGrid — toggler riutilizzabile ────────────────────────────────────

export function AllergenGrid({
    selected,
    onChange,
    size = 'md',
}: {
    selected: string[];
    onChange: (ids: string[]) => void;
    size?: 'sm' | 'md';
}) {
    const toggle = (id: string) => {
        onChange(selected.includes(id) ? selected.filter(a => a !== id) : [...selected, id]);
    };

    return (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {ALLERGENS.map(a => {
                const active = selected.includes(a.id);
                return (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.id)}
                        title={a.label}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 transition-all select-none
                            ${size === 'sm' ? 'p-1.5' : 'p-2'}
                            ${active
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] hover:border-amber-200'
                            }`}
                    >
                        <span className={size === 'sm' ? 'text-lg' : 'text-xl'}>{a.emoji}</span>
                        <span className={`font-bold leading-none text-center
                            ${size === 'sm' ? 'text-[8px]' : 'text-[9px]'}
                            ${active ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>
                            {a.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
    id: string;
    section: string;
    name: string;
    allergens: string[];
    allergen_managed?: boolean;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    allergens: string[];
}

// ── AllergenPreview — emoji pills in collapsed header ────────────────────────

function AllergenPreview({ ids }: { ids: string[] }) {
    if (ids.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1">
            {ALLERGENS.filter(a => ids.includes(a.id)).map(a => (
                <span key={a.id} title={a.label} className="text-base leading-none">{a.emoji}</span>
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AllergensManager({ restaurantId }: { restaurantId: string }) {
    const { showToast, ToastContainer } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [expandedProds, setExpandedProds] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Local draft — allergens
    const [catAllergens, setCatAllergens] = useState<Record<string, string[]>>({});
    const [prodAllergens, setProdAllergens] = useState<Record<string, string[]>>({});

    // Local state — whether allergen management is enabled per category
    const [catManaged, setCatManaged] = useState<Record<string, boolean>>({});

    // Sections visible in the list (filter panel)
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [{ data: cats }, { data: prods }] = await Promise.all([
            db.from('categories')
                .select('id,section,name,allergens,allergen_managed')
                .eq('restaurant_id', restaurantId)
                .order('position', { ascending: true }),
            db.from('products')
                .select('id,category_id,name,allergens')
                .eq('restaurant_id', restaurantId)
                .order('sort_order', { ascending: true }),
        ]);

        if (cats) {
            setCategories(cats);
            const cm: Record<string, string[]> = {};
            const managed: Record<string, boolean> = {};
            const sectionHasManaged = new Set<string>();
            cats.forEach((c: any) => {
                cm[c.id] = c.allergens ?? [];
                managed[c.id] = c.allergen_managed === true;
                if (c.allergen_managed === true) sectionHasManaged.add(c.section);
            });
            setCatAllergens(cm);
            setCatManaged(managed);
            // Secciones visibles por defecto: solo las que tienen ≥1 categoría activa
            // Si ninguna tiene activa aún, mostrar todas para el primer uso
            setVisibleSections(
                sectionHasManaged.size > 0 ? sectionHasManaged : new Set(cats.map((c: any) => c.section))
            );
        }
        if (prods) {
            setProducts(prods);
            const pm: Record<string, string[]> = {};
            prods.forEach((p: any) => { pm[p.id] = p.allergens ?? []; });
            setProdAllergens(pm);
        }
        setLoading(false);
    }, [restaurantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Toggle allergen management for a category
    const toggleManaged = async (catId: string) => {
        const newVal = !catManaged[catId];
        setCatManaged(prev => ({ ...prev, [catId]: newVal }));
        // Persist if column exists (graceful fail if not)
        try {
            await db.from('categories').update({ allergen_managed: newVal }).eq('id', catId);
        } catch (_) {
            // Column may not exist yet — UI state still works
        }
    };

    // Applica allergeni di una categoria a tutti i suoi prodotti
    const applyToAll = async (catId: string) => {
        const allergens = catAllergens[catId] ?? [];
        const catProds = products.filter(p => p.category_id === catId);
        setSaving(catId + '_apply');
        await Promise.all([
            db.from('categories').update({ allergens }).eq('id', catId),
            ...catProds.map(p => db.from('products').update({ allergens }).eq('id', p.id)),
        ]);
        setProdAllergens(prev => {
            const next = { ...prev };
            catProds.forEach(p => { next[p.id] = allergens; });
            return next;
        });
        setSaving(null);
        showToast('✓ Allergeni applicati a tutta la categoria');
    };

    // Salva allergeni categoria
    const saveCat = async (catId: string) => {
        setSaving(catId);
        await db.from('categories').update({ allergens: catAllergens[catId] ?? [] }).eq('id', catId);
        setSaving(null);
        showToast('✓ Allergeni categoria salvati');
    };

    // Salva allergeni singolo prodotto
    const saveProd = async (prodId: string) => {
        setSaving(prodId);
        await db.from('products').update({ allergens: prodAllergens[prodId] ?? [] }).eq('id', prodId);
        setSaving(null);
        showToast('✓ Allergeni prodotto salvati');
    };

    const sections: string[] = Array.from(new Set<string>(categories.map(c => c.section)));

    const toggleSection = (section: string) => {
        setVisibleSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                // Non permettere di nascondere l'ultima sezione visibile
                if (next.size <= 1) return prev;
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
        // Se si attiva una sezione, mostrare le sue categorie (nessun side effect sul DB)
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-8">
            <ToastContainer />

            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">Allergeni</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Reg. UE 1169/2011 — 14 Allergeni</p>
            </div>

            {/* Info banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Come funziona</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        Attiva la gestione allergeni solo per le categorie di cibo.
                        Usa i filtri qui sotto per mostrare o nascondere i reparti.
                    </p>
                </div>
            </div>

            {/* ── Filtro reparti ─────────────────────────────────────────── */}
            <div className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reparti visibili</p>
                <div className="flex flex-wrap gap-2">
                    {sections.map(section => {
                        const isOn = visibleSections.has(section);
                        const managedCount = categories
                            .filter(c => c.section === section)
                            .filter(c => catManaged[c.id]).length;
                        return (
                            <button
                                key={section}
                                onClick={() => toggleSection(section)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                    isOn
                                        ? 'bg-[#008081] text-white border-[#008081] shadow-sm'
                                        : 'bg-gray-100 dark:bg-[#262626] text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-white' : 'bg-gray-300'}`} />
                                {section}
                                {managedCount > 0 && (
                                    <span className={`text-[9px] font-black px-1 py-0.5 rounded-md ${isOn ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                                        {managedCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sezioni macro — filtrate */}
            {sections.filter(s => visibleSections.has(s)).map(section => (
                <div key={section} className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{section}</p>

                    {categories.filter(c => c.section === section).map(cat => {
                        const catProds = products.filter(p => p.category_id === cat.id);
                        const isExpanded = expandedCat === cat.id;
                        const isManaged = catManaged[cat.id] ?? false;
                        const activeAllergens = catAllergens[cat.id] ?? [];
                        const activeCount = activeAllergens.length;
                        const isProdsExpanded = expandedProds === cat.id;

                        return (
                            <div key={cat.id} className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden transition-all">

                                {/* Category row — always visible */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => {
                                        if (!isManaged) return; // non espandere se disattivato
                                        setExpandedCat(isExpanded ? null : cat.id);
                                        if (!isExpanded) setExpandedProds(null);
                                    }}
                                >
                                    {/* Left: name + preview */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`font-black text-sm leading-tight ${isManaged ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                                {cat.name}
                                            </p>
                                            {isManaged && activeCount > 0 && (
                                                <AllergenPreview ids={activeAllergens} />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                            {catProds.length} piatti
                                            {isManaged && activeCount > 0 && (
                                                <span className="ml-2 text-amber-500">· {activeCount} allergeni</span>
                                            )}
                                            {!isManaged && (
                                                <span className="ml-2 text-gray-300 dark:text-gray-600">· non gestita</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Right: managed toggle + expand chevron */}
                                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                        {/* Toggle */}
                                        <button
                                            onClick={() => toggleManaged(cat.id)}
                                            title={isManaged ? 'Disattiva gestione allergeni' : 'Attiva gestione allergeni'}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                isManaged
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                                    : 'bg-gray-100 dark:bg-[#262626] text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 hover:text-gray-600'
                                            }`}
                                        >
                                            {isManaged
                                                ? <><ShieldCheck className="w-3 h-3" /> Attivo</>
                                                : <><ShieldOff className="w-3 h-3" /> Inattivo</>
                                            }
                                        </button>

                                        {/* Expand chevron — only if managed */}
                                        {isManaged && (
                                            <button
                                                onClick={() => {
                                                    setExpandedCat(isExpanded ? null : cat.id);
                                                    if (!isExpanded) setExpandedProds(null);
                                                }}
                                                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded: allergen grid + actions */}
                                {isExpanded && isManaged && (
                                    <div className="border-t border-gray-100 dark:border-white/5 px-4 pt-4 pb-4 space-y-4">

                                        {/* Allergen grid */}
                                        <AllergenGrid
                                            selected={activeAllergens}
                                            onChange={ids => setCatAllergens(prev => ({ ...prev, [cat.id]: ids }))}
                                            size="sm"
                                        />

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => saveCat(cat.id)}
                                                disabled={saving === cat.id}
                                                className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-3 h-3" />
                                                {saving === cat.id ? 'Salvo...' : 'Salva categoria'}
                                            </button>
                                            <button
                                                onClick={() => applyToAll(cat.id)}
                                                disabled={saving === cat.id + '_apply'}
                                                className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                                            >
                                                {saving === cat.id + '_apply' ? 'Applico...' : 'Applica a tutti i piatti'}
                                            </button>
                                            {catProds.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedProds(isProdsExpanded ? null : cat.id)}
                                                    className="flex items-center gap-1.5 bg-[#008081]/10 text-[#008081] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#008081]/20 transition-colors"
                                                >
                                                    {isProdsExpanded ? 'Nascondi piatti' : `Personalizza piatti (${catProds.length})`}
                                                </button>
                                            )}
                                        </div>

                                        {/* Individual products — expanded on demand */}
                                        {isProdsExpanded && catProds.length > 0 && (
                                            <div className="border border-gray-100 dark:border-white/5 rounded-xl divide-y divide-gray-50 dark:divide-white/5 overflow-hidden">
                                                {catProds.map(prod => {
                                                    const prodActiveCount = (prodAllergens[prod.id] ?? []).length;
                                                    return (
                                                        <div key={prod.id} className="p-3 space-y-2.5 bg-gray-50/50 dark:bg-black/10">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{prod.name}</p>
                                                                {prodActiveCount > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <AllergenPreview ids={prodAllergens[prod.id] ?? []} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <AllergenGrid
                                                                selected={prodAllergens[prod.id] ?? []}
                                                                onChange={ids => setProdAllergens(prev => ({ ...prev, [prod.id]: ids }))}
                                                                size="sm"
                                                            />
                                                            <button
                                                                onClick={() => saveProd(prod.id)}
                                                                disabled={saving === prod.id}
                                                                className="flex items-center gap-1.5 bg-[#008081] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <Save className="w-3 h-3" />
                                                                {saving === prod.id ? 'Salvo...' : 'Salva piatto'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Disclaimer legale */}
            <div className="bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                    ⚠️ Le informazioni sugli allergeni sono fornite dal ristoratore sotto propria responsabilità.
                    In caso di allergie gravi, informare sempre il personale prima di ordinare. Reg. UE 1169/2011.
                </p>
            </div>
        </div>
    );
}
