import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Sliders, ChevronDown, ChevronRight } from 'lucide-react';
import db from '../../db';

interface ProductExtra {
    id: string;
    name: string;
    price: number;
    category: string[];
    available: boolean;
}

interface Props {
    restaurantId: string;
}

export default function Personalizzazione({ restaurantId }: Props) {
    const [extras, setExtras] = useState<ProductExtra[]>([]);
    const [categoriesList, setCategoriesList] = useState<{ name: string, section: string, position: number }[]>([]);
    const [isEditing, setIsEditing] = useState<Partial<ProductExtra> | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedMacro, setExpandedMacro] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [restaurantId]);

    const fetchData = async () => {
        setLoading(true);
        const [extrasRes, categoriesRes] = await Promise.all([
            db.from('product_extras').select('*').eq('restaurant_id', restaurantId).order('category').order('name'),
            db.from('categories').select('name, section, position').eq('restaurant_id', restaurantId).order('position', { ascending: true }).order('id')
        ]);

        if (extrasRes.data) setExtras(extrasRes.data);
        if (categoriesRes.data) {
            setCategoriesList(categoriesRes.data as any);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!isEditing?.name || isEditing.price === undefined || !isEditing.category || isEditing.category.length === 0) return;

        if (isEditing.id) {
            await db.from('product_extras').update({
                name: isEditing.name,
                price: isEditing.price,
                category: isEditing.category,
                available: isEditing.available !== false
            }).eq('id', isEditing.id);
        } else {
            await db.from('product_extras').insert({
                restaurant_id: restaurantId,
                name: isEditing.name,
                price: isEditing.price,
                category: isEditing.category,
                available: true
            });
        }

        setIsEditing(null);
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo extra?')) return;
        await db.from('product_extras').delete().eq('id', id);
        fetchData();
    };

    const categories = Array.from(new Set(extras.flatMap(e => e.category || [])));

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Caricamento extra...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sliders className="text-[#008080]" /> Suggerimenti Rapidi (Extra)
                </h3>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing({ name: '', price: 0, category: ['Global'] })}
                        className="bg-[#008080] text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus className="w-4 h-4" /> Nuovo Suggerimento
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="bg-white dark:bg-[#262626] p-6 rounded-2xl shadow-sm border border-[#008080]/30 mb-6 flex flex-col gap-4 animate-fade-in">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{isEditing.id ? 'Modifica Extra' : 'Aggiungi Nuovo Extra'}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={isEditing.name || ''}
                                onChange={e => setIsEditing({ ...isEditing, name: e.target.value })}
                                placeholder="es. Prosciutto Crudo"
                                className="w-full p-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categorie Assegnate</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const cats = isEditing.category || [];
                                            setIsEditing({ ...isEditing, category: cats.includes('Global') ? cats.filter(c => c !== 'Global') : [...cats, 'Global'] });
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border outline-none ${(isEditing.category || []).includes('Global')
                                            ? 'bg-[#008080] text-white border-[#008080] shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 dark:bg-[#1A1A1A] dark:border-gray-700 hover:border-[#008080]'
                                            }`}
                                    >
                                        Global (Tutti)
                                    </button>

                                    {/* Hierarchical Categories Accordion */}
                                    {Object.entries(
                                        categoriesList.reduce((acc, cat) => {
                                            const macro = cat.section || 'Altre Categorie';
                                            if (!acc[macro]) acc[macro] = [];
                                            acc[macro].push(cat);
                                            return acc;
                                        }, {} as Record<string, typeof categoriesList>)
                                    ).map(([macro, microCats]) => {
                                        const isExpanded = expandedMacro === macro;
                                        const macroCatsList = microCats as typeof categoriesList;
                                        const selectedInMacro = macroCatsList.filter(c => (isEditing.category || []).includes(c.name)).length;

                                        return (
                                            <div key={macro} className="w-full border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1A1A1A]">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedMacro(isExpanded ? null : macro)}
                                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#252525] dark:hover:bg-[#2a2a2a] transition-colors"
                                                >
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{macro}</span>
                                                    <div className="flex items-center gap-2">
                                                        {selectedInMacro > 0 && (
                                                            <span className="bg-[#008080] text-white text-xs font-bold px-2 py-0.5 rounded-md">{selectedInMacro} scelti</span>
                                                        )}
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                    </div>
                                                </button>

                                                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 p-3' : 'max-h-0 opacity-0 overflow-hidden py-0 px-3'}`}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {macroCatsList.map(cat => (
                                                            <button
                                                                type="button"
                                                                key={cat.name}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const cats = isEditing.category || [];
                                                                    setIsEditing({ ...isEditing, category: cats.includes(cat.name) ? cats.filter(c => c !== cat.name) : [...cats, cat.name] });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none ${(isEditing.category || []).includes(cat.name)
                                                                    ? 'bg-[#008080] text-white border-[#008080] shadow-sm'
                                                                    : 'bg-white text-gray-500 border-gray-200 dark:bg-[#1A1A1A] dark:border-gray-700 hover:border-[#008080]'
                                                                    }`}
                                                            >
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
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prezzo (€)</label>
                                <input
                                    type="number"
                                    step="0.10"
                                    value={isEditing.price || 0}
                                    onChange={e => setIsEditing({ ...isEditing, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full p-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={() => setIsEditing(null)} className="px-5 py-2 font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Annulla</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#008080] text-white font-bold rounded-xl shadow-md hover:bg-teal-700 transition-colors">Salva Extra</button>
                    </div>
                </div>
            )}

            {extras.length === 0 && !isEditing ? (
                <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500 font-medium">Nessun suggerimento configurato. Aggiungine uno per iniziare.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {extras.map((extra) => {
                        const assignedCats = extra.category || [];
                        const isGlobal = assignedCats.includes('Global');

                        const assignedSections = Array.from(new Set(
                            assignedCats
                                .filter(c => c !== 'Global')
                                .map(c => categoriesList.find(cat => cat.name === c)?.section)
                                .filter(Boolean)
                        ));

                        const assignedSubCats = assignedCats.filter(c => c !== 'Global');

                        return (
                            <div key={extra.id} className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-[rgba(0,0,0,0.03)] dark:border-gray-800 p-3 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="font-bold text-gray-900 dark:text-white text-[0.95rem] truncate">{extra.name}</h5>
                                            <span className="text-[#008080] font-bold text-sm bg-teal-50 dark:bg-[#008080]/10 px-2 py-0.5 rounded-md whitespace-nowrap">+ €{extra.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar pb-1">
                                            {isGlobal && (
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 dark:bg-[#333] dark:text-gray-300 text-[9px] font-bold rounded uppercase tracking-wider shrink-0">
                                                    GLOBAL
                                                </span>
                                            )}
                                            {assignedSubCats.map(subCat => (
                                                <span key={`sub-${subCat}`} className="px-1.5 py-0.5 text-[#008080] bg-teal-50 dark:bg-[#008080]/10 border border-[#008080]/20 text-[9px] font-bold rounded uppercase tracking-wider shrink-0">
                                                    {subCat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-[#1A1A1A] p-1 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <button onClick={() => setIsEditing(extra)} className="p-1.5 text-blue-500 hover:bg-white dark:hover:bg-[#252525] rounded-md transition-colors shadow-sm">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(extra.id)} className="p-1.5 text-red-500 hover:bg-white dark:hover:bg-[#252525] rounded-md transition-colors shadow-sm">
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
