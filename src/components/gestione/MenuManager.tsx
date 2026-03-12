import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, List, Save, Trash2, ArrowRight, Eye, EyeOff, Percent, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import db from '../../db';
import ImageCropperModal from '../ImageCropperModal';
import { useToast } from '../Toast';

interface Props {
    restaurantId: string;
    onOpenListino: () => void;
    onOpenSettings: () => void;
    onOpenPersonalizzazione: () => void;
}

// Keeping the existing types
interface Category {
    id: string;
    section: string;
    name: string;
    position?: number;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    price_unit: string | null;
    image_url: string;
    sort_order?: number;
    iva?: number;
    active?: boolean;
}

type ViewState = 'hub' | 'wizard-1' | 'wizard-2' | 'wizard-3' | 'success' | 'listino' | 'visibility';

export default function MenuManager({ restaurantId, onOpenListino, onOpenSettings, onOpenPersonalizzazione }: Props) {
    const [view, setView] = useState<ViewState>('hub');
    const [loading, setLoading] = useState(true);
    const { showToast, ToastContainer } = useToast();

    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [sectionSettings, setSectionSettings] = useState<any>({});

    // Wizard State
    const [wizardMacro, setWizardMacro] = useState({ name: '', image: '', visible: true });
    const [wizardSubCats, setWizardSubCats] = useState<string[]>(['']);
    const [wizardProduct, setWizardProduct] = useState({
        name: '',
        price: '',
        iva: 10,
        description: '',
        image: '',
        active: true,
        subCategoryIndex: 0
    });

    // Cropper
    const [cropperState, setCropperState] = useState<{ src: string | null; aspect: number; callback: ((b64: string) => void) | null }>({ src: null, aspect: 1, callback: null });
    const categoryImageRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Load basic data
    const fetchData = async () => {
        setLoading(true);
        const { data: cats } = await db.from('categories').select('*').eq('restaurant_id', restaurantId).order('position', { ascending: true });
        if (cats) setCategories(cats);

        // Load settings for visibility
        const { data: settingsRows } = await db.from('settings').select('key, value').eq('restaurant_id', restaurantId);
        if (settingsRows) {
            const settingsObj: any = {};
            settingsRows.forEach((row: any) => { settingsObj[row.key] = row.value; });
            setSectionSettings(settingsObj);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [restaurantId]);

    const handleNext = () => {
        if (view === 'wizard-1') {
            if (!wizardMacro.name.trim()) return showToast('Inserisci il nome della categoria macro', 'error');
            setView('wizard-2');
        } else if (view === 'wizard-2') {
            const validSubCats = wizardSubCats.filter(c => c.trim().length > 0);
            if (validSubCats.length === 0) return showToast('Inserisci almeno una sub-categoria', 'error');
            setWizardSubCats(validSubCats);
            setView('wizard-3');
        } else if (view === 'wizard-3') {
            saveWizard();
        }
    };

    const saveWizard = async () => {
        // 1. Create SubCategories mapped to the Macro section
        const newCats = await Promise.all(wizardSubCats.map(async (subName, idx) => {
            const { data } = await db.from('categories').insert({
                restaurant_id: restaurantId,
                section: wizardMacro.name.trim(),
                name: subName.trim(),
                position: categories.length + idx
            }).select().single();
            return data;
        }));

        // 2. Create the first Product
        const targetCat = newCats[wizardProduct.subCategoryIndex];
        if (targetCat) {
            await db.from('products').insert({
                restaurant_id: restaurantId,
                category_id: targetCat.id,
                name: wizardProduct.name.trim(),
                price: parseFloat(wizardProduct.price.replace(',', '.')) || 0,
                iva: wizardProduct.iva,
                description: wizardProduct.description.trim(),
                image_url: wizardProduct.image,
                active: wizardProduct.active,
            });
        }

        setWizardProduct(prev => ({ ...prev, name: '', price: '', iva: 10, description: '', image: '', active: true }));
        fetchData();
        setView('success');
    };

    // Toggle visibility for a section
    const handleVisibilityToggle = async (section: string) => {
        const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const visibilityKey = `visibility_${sectionSlug}`;
        const isCurrentlyVisible = sectionSettings[visibilityKey] !== 'false';
        const newValue = isCurrentlyVisible ? 'false' : 'true';

        setSectionSettings((prev: any) => ({ ...prev, [visibilityKey]: newValue }));

        await db.from('settings').upsert(
            { restaurant_id: restaurantId, key: visibilityKey, value: newValue },
            { onConflict: 'restaurant_id,key' }
        );

        // SYNC: Update 'active' column in categories table for all categories in this macro section
        await db.from('categories')
            .update({ active: newValue === 'true' })
            .eq('restaurant_id', restaurantId)
            .eq('section', section);

        showToast(newValue === 'true' ? `👁 ${section} ora visibile` : `🙈 ${section} nascosto`);
    };

    // Upload section image via cropper
    const handleSectionImageUpload = (file: File, section: string) => {
        const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const sectionKey = `home_image_${sectionSlug}`;
        const reader = new FileReader();
        reader.onload = () => {
            setCropperState({
                src: reader.result as string,
                aspect: 16 / 9,
                callback: async (b64: string) => {
                    setSectionSettings((prev: any) => ({ ...prev, [sectionKey]: b64 }));
                    await db.from('settings').upsert(
                        { restaurant_id: restaurantId, key: sectionKey, value: b64 },
                        { onConflict: 'restaurant_id,key' }
                    );
                    showToast('✓ Immagine aggiornata');
                }
            });
        };
        reader.readAsDataURL(file);
    };

    const renderProgressBar = (step: number) => {
        return (
            <div className="flex items-center justify-center gap-2 mb-8 bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-2xl shadow-inner w-max mx-auto">
                <div className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 ${step >= 1 ? 'bg-white dark:bg-[#262626] text-[#008080] shadow-sm transform scale-105' : 'text-gray-400'}`}>1. Categoria</div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 ${step >= 2 ? 'bg-white dark:bg-[#262626] text-[#008080] shadow-sm transform scale-105' : 'text-gray-400'}`}>2. Sezione</div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 ${step >= 3 ? 'bg-white dark:bg-[#262626] text-[#008080] shadow-sm transform scale-105' : 'text-gray-400'}`}>3. Piatto</div>
            </div>
        );
    };

    const slideVariants = {
        initial: { x: 50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="w-10 h-10 border-4 border-gray-100 dark:border-gray-800 border-t-[#008080] rounded-full animate-spin shadow-sm"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Sincronizzazione catalogo...</p>
            </div>
        );
    }

    const macroSections: string[] = Array.from(new Set(categories.map(c => c.section)));

    return (
        <div className="space-y-6 pb-24">

            {/* Configuration Hub */}
            {view === 'hub' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">

                        <button onClick={() => setView('wizard-1')} className="group bg-[#FFFFFF] dark:bg-[#262626] p-5 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-5 text-left w-full h-auto">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-teal-50 text-[#008080] dark:bg-teal-900/30 dark:text-teal-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                    <Plus className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Aggiungi Categoria</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Avvia la configurazione rapida</p>
                                </div>
                            </div>
                            <div className="text-gray-300 dark:text-gray-600 group-hover:text-[#008080] transition-colors pr-2">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </button>

                        <button onClick={onOpenListino} className="group bg-[#FFFFFF] dark:bg-[#262626] p-5 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-5 text-left w-full h-auto">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                    <List className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Gestisci Listino</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Visualizza e modifica in linea</p>
                                </div>
                            </div>
                            <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors pr-2">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </button>

                        <button onClick={() => setView('visibility')} className="group bg-[#FFFFFF] dark:bg-[#262626] p-5 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-5 text-left w-full h-auto">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-teal-50 text-[#008080] dark:bg-teal-900/30 dark:text-teal-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                    <Eye className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Visibilità Reparti</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Mostra/nascondi categorie e foto</p>
                                </div>
                            </div>
                            <div className="text-gray-300 dark:text-gray-600 group-hover:text-[#008080] transition-colors pr-2">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </button>

                    </div>
                </motion.div>
            )}

            {/* VISIBILITY VIEW */}
            <AnimatePresence mode="wait">
                {view === 'visibility' && (
                    <motion.div key="visibility" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto space-y-4">
                        <button onClick={() => setView('hub')} className="mb-2 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm">
                            <ChevronLeft className="w-5 h-5" /> Indietro
                        </button>

                        <div className="text-center mb-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Visibilità Reparti</h2>
                            <p className="text-gray-500 text-sm mt-1">Gestisci cosa vedono i tuoi clienti nella home.</p>
                        </div>

                        {macroSections.length === 0 && (
                            <div className="text-center p-8 text-gray-400 text-sm font-medium">Nessuna categoria presente.</div>
                        )}

                        {macroSections.map((section) => {
                            const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
                            const sectionKey = `home_image_${sectionSlug}`;
                            const visibilityKey = `visibility_${sectionSlug}`;
                            const isVisible = sectionSettings[visibilityKey] !== 'false';
                            const thumbSrc = sectionSettings[sectionKey] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop';

                            return (
                                <div key={section} className="bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 p-4">
                                    {/* Thumbnail */}
                                    <div className="relative flex-shrink-0">
                                        <img src={thumbSrc} alt={section} className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                                        {/* Hidden input */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={el => { categoryImageRefs.current[section] = el; }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) { e.target.value = ''; handleSectionImageUpload(file, section); }
                                            }}
                                        />
                                        <button
                                            onClick={() => categoryImageRefs.current[section]?.click()}
                                            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#008080] text-white flex items-center justify-center shadow-md hover:bg-teal-700 transition-colors"
                                            title="Carica Foto"
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Name & Status */}
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block uppercase truncate">{section}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${isVisible ? 'text-[#008080]' : 'text-gray-400'}`}>
                                            {isVisible ? 'Visibile' : 'Nascosto'}
                                        </span>
                                    </div>

                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleVisibilityToggle(section)}
                                        className={`w-12 h-7 rounded-full relative transition-colors duration-300 focus:outline-none flex-shrink-0 ${isVisible ? 'bg-[#008080]' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-sm ${isVisible ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Wizard Steps */}
            <AnimatePresence mode="wait">

                {/* WIZARD STEP 1: MACRO CATEGORY */}
                {view === 'wizard-1' && (
                    <motion.div key="w1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <button onClick={() => setView('hub')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm">
                            <ChevronLeft className="w-5 h-5" /> Indietro
                        </button>

                        {renderProgressBar(1)}

                        <div className="bg-[#FFFFFF] dark:bg-[#262626] p-8 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Il Reparto</h2>
                                <p className="text-gray-500 text-sm mt-2">Come si chiama questa grande famiglia di prodotti?</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Nome Macro-Categoria</label>
                                <input
                                    type="text"
                                    value={wizardMacro.name}
                                    onChange={e => setWizardMacro({ ...wizardMacro, name: e.target.value })}
                                    placeholder="Es. Pizzeria, Cucina, Sushi, Bar..."
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-2xl p-4 text-center font-bold text-xl text-[#008080] shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none"
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-inner flex justify-between items-center">
                                <div>
                                    <span className="block font-bold text-gray-900 dark:text-white">Visibilità Globale</span>
                                    <span className="text-xs text-gray-500">Mostra questo reparto ai clienti</span>
                                </div>
                                <button
                                    onClick={() => setWizardMacro({ ...wizardMacro, visible: !wizardMacro.visible })}
                                    className={`w-14 h-8 rounded-full relative transition-colors duration-300 focus:outline-none shadow-sm ${wizardMacro.visible ? 'bg-[#008080]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${wizardMacro.visible ? 'transform translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <button onClick={handleNext} className="w-full bg-[#008080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008080]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Continua alle Sezioni <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* WIZARD STEP 2: SUB-CATEGORIES */}
                {view === 'wizard-2' && (
                    <motion.div key="w2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <button onClick={() => setView('wizard-1')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm">
                            <ChevronLeft className="w-5 h-5" /> Indietro
                        </button>

                        {renderProgressBar(2)}

                        <div className="bg-[#FFFFFF] dark:bg-[#262626] p-8 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Le Sezioni interne</h2>
                                <p className="text-gray-500 text-sm mt-2">Come vuoi dividere <strong className="text-[#008080]">{wizardMacro.name || 'il Reparto'}</strong>?</p>
                            </div>

                            <div className="space-y-3">
                                {wizardSubCats.map((sub, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={sub}
                                            onChange={e => {
                                                const newCats = [...wizardSubCats];
                                                newCats[idx] = e.target.value;
                                                setWizardSubCats(newCats);
                                            }}
                                            placeholder={idx === 0 ? "Es. Pizze Bianche" : "Nuova Sezione"}
                                            className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-2xl p-4 font-bold text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none"
                                        />
                                        {idx > 0 && (
                                            <button
                                                onClick={() => setWizardSubCats(wizardSubCats.filter((_, i) => i !== idx))}
                                                className="w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setWizardSubCats([...wizardSubCats, ''])}
                                className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:text-[#008080] hover:border-[#008080] hover:bg-teal-50 dark:hover:bg-teal-900/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus className="w-5 h-5" /> Aggiungi un'altra sezione
                            </button>

                            <button onClick={handleNext} className="w-full bg-[#008080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008080]/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6">
                                Continua ai Prodotti <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* WIZARD STEP 3: PRODUCT */}
                {view === 'wizard-3' && (
                    <motion.div key="w3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <button onClick={() => setView('wizard-2')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm">
                            <ChevronLeft className="w-5 h-5" /> Indietro
                        </button>

                        {renderProgressBar(3)}

                        <div className="bg-[#FFFFFF] dark:bg-[#262626] p-8 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Il Primo Prodotto</h2>
                                <p className="text-gray-500 text-sm mt-2">Creiamo il primo piatto di queste nuove sezioni!</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Destinazione</label>
                                <select
                                    value={wizardProduct.subCategoryIndex}
                                    onChange={e => setWizardProduct({ ...wizardProduct, subCategoryIndex: parseInt(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-3 font-bold text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none"
                                >
                                    {wizardSubCats.filter(c => c.trim().length > 0).map((sub, idx) => (
                                        <option key={idx} value={idx}>{wizardMacro.name} &gt; {sub}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome Prodotto</label>
                                <input
                                    type="text"
                                    value={wizardProduct.name}
                                    onChange={e => setWizardProduct({ ...wizardProduct, name: e.target.value })}
                                    placeholder="Es. Margherita"
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-xl text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Prezzo Finale</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-lg">€</span>
                                        <input
                                            type="text"
                                            value={wizardProduct.price}
                                            onChange={e => setWizardProduct({ ...wizardProduct, price: e.target.value })}
                                            placeholder="8,50"
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl py-4 pl-10 pr-4 font-black text-xl text-[#008080] shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Alíquota IVA</label>
                                    <div className="relative">
                                        <select
                                            value={wizardProduct.iva}
                                            onChange={e => setWizardProduct({ ...wizardProduct, iva: parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-xl text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-[#008080]/30 transition-all outline-none appearance-none pr-10"
                                        >
                                            <option value="4">4% - Minim.</option>
                                            <option value="5">5% - Ridotta</option>
                                            <option value="10">10% - Ristoraz.</option>
                                            <option value="22">22% - Ordinaria</option>
                                        </select>
                                        <Percent className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleNext} className="w-full bg-[#008080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008080]/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-8">
                                <Save className="w-5 h-5" /> Salva e Termina
                            </button>
                        </div>
                    </motion.div>
                )}
                {/* WIZARD SUCCESS */}
                {view === 'success' && (
                    <motion.div key="w-success" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto text-center mt-12 space-y-8">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-premium transform scale-110 mb-6">
                            <Save className="w-10 h-10" />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Reparto Creato!</h2>
                        <p className="text-gray-500 text-lg">Hai configurato con successo la struttura e aggiunto il primo piatto.</p>

                        <div className="flex flex-col gap-4 mt-8">
                            <button onClick={() => {
                                setWizardMacro({ name: '', image: '', visible: true });
                                setWizardSubCats(['']);
                                setWizardProduct({ name: '', price: '', iva: 10, description: '', image: '', active: true, subCategoryIndex: 0 });
                                onOpenPersonalizzazione();
                            }} className="w-full bg-[#FFFFFF] dark:bg-[#262626] text-[#008080] border-2 border-[#008080] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-premium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-lg">
                                <Plus className="w-6 h-6" /> Asocia Suggerimenti Rapidi
                            </button>

                            <button onClick={() => {
                                setWizardMacro({ name: '', image: '', visible: true });
                                setWizardSubCats(['']);
                                setWizardProduct({ name: '', price: '', iva: 10, description: '', image: '', active: true, subCategoryIndex: 0 });
                                setView('hub');
                            }} className="w-full bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                                Torna all'Hub
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Cropper Modal */}
            <ImageCropperModal
                imageSrc={cropperState.src}
                aspect={cropperState.aspect}
                onConfirm={(base64) => {
                    if (cropperState.callback) cropperState.callback(base64);
                    setCropperState({ src: null, aspect: 1, callback: null });
                }}
                onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })}
            />
            <ToastContainer />
        </div>
    );
}
