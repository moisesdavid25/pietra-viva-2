import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, List, Save, Trash2, EyeOff, Image as ImageIcon, LayoutGrid, Calendar, Tag, X, Sliders, ShieldAlert, Search, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import db from '../../db';
import ImageCropperModal from '../ImageCropperModal';
import { useToast } from '../Toast';
import { ExtrasManager } from './Personalizzazione';
import { AllergensManager, AllergenGrid } from './AllergensManager';

// ── Reparto Type Config ───────────────────────────────────────────────────────

type RepartoType = 'pizza_taglio' | 'pizza_tonda' | 'cucina' | 'bar' | 'caffe' | 'dessert' | 'vino' | 'altro';
type PriceMode = 'unico' | 'peso' | 'formati' | 'taglie';

interface TypeConfig {
    emoji: string;
    label: string;
    defaultPriceMode: PriceMode;
    priceModes: PriceMode[];
    defaultFormati: { name: string; price: string }[];
    suggestedSections: string[];
    labels: string[];
    showGlass: boolean;
}

const TYPE_CONFIG: Record<RepartoType, TypeConfig> = {
    pizza_taglio: {
        emoji: '🍕',
        label: 'Pizza al taglio',
        defaultPriceMode: 'formati',
        priceModes: ['formati', 'unico'],
        defaultFormati: [{ name: '½ Pala', price: '' }, { name: 'Pala Intera', price: '' }, { name: 'Al pezzo', price: '' }],
        suggestedSections: ['Classiche', 'Pizze bianche', 'Pizze rosse', 'Plant-based', 'Speciali', 'Focacce'],
        labels: ['🌱 Vegan', '🌶️ Piccante', '⭐ Consigliato', '🆕 Nuovo', '🐃 Bufala', '🍄 Funghi'],
        showGlass: false,
    },
    pizza_tonda: {
        emoji: '🔵',
        label: 'Pizzeria tonda',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'formati'],
        defaultFormati: [{ name: 'Intera', price: '' }, { name: 'Mezza', price: '' }],
        suggestedSections: ['Rosse', 'Bianche', 'Speciali', 'Calzone', 'Fritti'],
        labels: ['🌱 Vegan', '🌶️ Piccante', '⭐ Consigliato', '🆕 Nuovo', '🍄 Funghi'],
        showGlass: false,
    },
    cucina: {
        emoji: '🍽️',
        label: 'Cucina',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'peso', 'formati'],
        defaultFormati: [{ name: 'Porzione', price: '' }],
        suggestedSections: ['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Piatti unici'],
        labels: ['🌱 Vegan', '🌶️ Piccante', '⭐ Consigliato', '🆕 Nuovo', '🐟 Pesce', '🥩 Carne', '🌾 Gluten free'],
        showGlass: false,
    },
    bar: {
        emoji: '🍸',
        label: 'Bar / Cocktail',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'taglie'],
        defaultFormati: [{ name: 'Single', price: '' }, { name: 'Double', price: '' }],
        suggestedSections: ['Analcolici', 'Aperitivi', 'Signature', 'All Day', 'Classici'],
        labels: ['🍸 Signature', '🔵 Analcolico', '✨ Stagionale', '🔥 Strong', '⭐ Consigliato'],
        showGlass: true,
    },
    caffe: {
        emoji: '☕',
        label: 'Caffetteria',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'taglie'],
        defaultFormati: [{ name: 'Piccolo', price: '' }, { name: 'Grande', price: '' }],
        suggestedSections: ['Caffetteria', 'Caldo', 'Freddo', 'Estratti'],
        labels: ['☀️ Estate', '❄️ Freddo', '⭐ Consigliato', '🆕 Nuovo'],
        showGlass: false,
    },
    dessert: {
        emoji: '🎂',
        label: 'Dessert',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'peso'],
        defaultFormati: [],
        suggestedSections: ['Torte', 'Gelati', 'Dolci al cucchiaio', 'Frutta'],
        labels: ['🌱 Vegan', '🌾 Gluten free', '⭐ Consigliato', '🆕 Nuovo', '🥛 Lattosio'],
        showGlass: false,
    },
    vino: {
        emoji: '🍷',
        label: 'Vino & Drinks',
        defaultPriceMode: 'formati',
        priceModes: ['formati', 'unico'],
        defaultFormati: [{ name: 'Calice', price: '' }, { name: 'Bottiglia', price: '' }],
        suggestedSections: ['Rossi', 'Bianchi', 'Bollicine', 'Rosati', 'Liquori', 'Birre'],
        labels: ['🍾 Bollicine', '⭐ Consigliato', '🆕 Nuovo', '🌿 Bio', '🏠 Locale'],
        showGlass: false,
    },
    altro: {
        emoji: '📦',
        label: 'Altro',
        defaultPriceMode: 'unico',
        priceModes: ['unico', 'peso', 'formati', 'taglie'],
        defaultFormati: [{ name: 'Formato 1', price: '' }],
        suggestedSections: [],
        labels: ['⭐ Consigliato', '🆕 Nuovo', '🌱 Vegan', '🌶️ Piccante'],
        showGlass: false,
    },
};

const PRICE_MODE_LABELS: Record<PriceMode, string> = {
    unico: 'Prezzo fisso',
    peso: 'Al peso / etto',
    formati: 'Formati multipli',
    taglie: 'Taglie (S/M/L)',
};

const GLASS_OPTIONS = [
    { emoji: '🥃', name: 'Tumbler' },
    { emoji: '🍸', name: 'Coppetta' },
    { emoji: '🥂', name: 'Flûte' },
    { emoji: '🍹', name: 'Highball' },
    { emoji: '🍷', name: 'Calice' },
    { emoji: '🫙', name: 'Jar' },
    { emoji: '☕', name: 'Tazza' },
    { emoji: '🧊', name: 'Rocks' },
];

const FOOD_ALLERGEN_TYPES: RepartoType[] = ['pizza_taglio', 'pizza_tonda', 'cucina', 'dessert'];

interface WizardProductDraft {
    sectionIdx: number;
    name: string;
    description: string;
    priceMode: PriceMode;
    price: string;
    priceUnit: string;
    formati: { name: string; price: string }[];
    allergens: string[];
    active: boolean;
    imageUrl: string;
    labels: string[];
    glassType: string;
}

// ── Component Interfaces ──────────────────────────────────────────────────────

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

    // ── Wizard State ─────────────────────────────────────────────────────────
    const [wizardMacro, setWizardMacro] = useState({ name: '', image: '', visible: true });
    const [wizardSubCats, setWizardSubCats] = useState<string[]>(['']);

    // New: type + step-3 product form
    const [wizardType, setWizardType] = useState<RepartoType>('cucina');
    const [wizardActivePriceMode, setWizardActivePriceMode] = useState<PriceMode>('unico');
    const [wizardFormati, setWizardFormati] = useState<{ name: string; price: string }[]>([]);
    const [wizardGlassType, setWizardGlassType] = useState<string>('');
    const [wizardSelectedLabels, setWizardSelectedLabels] = useState<string[]>([]);
    const [wizardSelectedSectionIdx, setWizardSelectedSectionIdx] = useState<number>(0);
    const [wizardProductName, setWizardProductName] = useState<string>('');
    const [wizardProductDesc, setWizardProductDesc] = useState<string>('');
    const [wizardPrice, setWizardPrice] = useState<string>('');
    const [wizardPriceUnit, setWizardPriceUnit] = useState<string>('');
    const [wizardVisible, setWizardVisible] = useState<boolean>(true);
    const [wizardAllergeni, setWizardAllergeni] = useState<string[]>([]);
    const [wizardPhotoUrl, setWizardPhotoUrl] = useState<string>('');
    const [wizardIsUploadingPhoto, setWizardIsUploadingPhoto] = useState<boolean>(false);
    const [wizardProductsDraft, setWizardProductsDraft] = useState<WizardProductDraft[]>([]);
    const [wizardSaving, setWizardSaving] = useState<boolean>(false);
    const wizardPhotoInputRef = useRef<HTMLInputElement>(null);

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

    // ── Wizard Navigation ────────────────────────────────────────────────────

    const goToWizardStep2 = () => {
        if (!wizardMacro.name.trim()) return showToast('Inserisci il nome del reparto', 'error');
        const cfg = TYPE_CONFIG[wizardType];
        setWizardActivePriceMode(cfg.defaultPriceMode);
        setWizardFormati(cfg.defaultFormati.map(f => ({ ...f, price: '' })));
        setView('wizard-2');
    };

    const goToWizardStep3 = () => {
        const valid = wizardSubCats.filter(c => c.trim());
        if (valid.length === 0) return showToast('Inserisci almeno una sezione', 'error');
        setWizardSubCats(valid);
        setWizardSelectedSectionIdx(0);
        setWizardProductsDraft([]);
        setView('wizard-3');
    };

    const resetWizardProductForm = (type: RepartoType = wizardType) => {
        setWizardProductName('');
        setWizardProductDesc('');
        setWizardPrice('');
        setWizardPriceUnit('');
        setWizardAllergeni([]);
        setWizardSelectedLabels([]);
        setWizardGlassType('');
        setWizardPhotoUrl('');
        setWizardVisible(true);
        const cfg = TYPE_CONFIG[type];
        setWizardActivePriceMode(cfg.defaultPriceMode);
        setWizardFormati(cfg.defaultFormati.map(f => ({ ...f, price: '' })));
    };

    const resetWizard = () => {
        setWizardMacro({ name: '', image: '', visible: true });
        setWizardSubCats(['']);
        setWizardType('cucina');
        setWizardProductsDraft([]);
        setWizardSelectedSectionIdx(0);
        resetWizardProductForm('cucina');
    };

    // ── Save Wizard Product (accumulate in draft) ────────────────────────────

    const handleSaveAndAddNew = () => {
        if (!wizardProductName.trim()) return showToast('Inserisci il nome del prodotto', 'error');

        setWizardProductsDraft(prev => [...prev, {
            sectionIdx: wizardSelectedSectionIdx,
            name: wizardProductName.trim(),
            description: wizardProductDesc.trim(),
            priceMode: wizardActivePriceMode,
            price: wizardPrice,
            priceUnit: wizardPriceUnit,
            formati: [...wizardFormati],
            allergens: [...wizardAllergeni],
            active: wizardVisible,
            imageUrl: wizardPhotoUrl,
            labels: [...wizardSelectedLabels],
            glassType: wizardGlassType,
        }]);

        showToast(`✓ "${wizardProductName.trim()}" in coda (${wizardProductsDraft.length + 1})`);
        resetWizardProductForm();
    };

    const handleSaveWizardFinal = async () => {
        if (wizardSaving) return;
        setWizardSaving(true);

        try {
            const validSubCats = wizardSubCats.filter(c => c.trim());

            // Insert categories
            const newCats = await Promise.all(validSubCats.map(async (name, idx) => {
                const { data } = await db.from('categories').insert({
                    restaurant_id: restaurantId,
                    section: wizardMacro.name.trim(),
                    name: name.trim(),
                    position: categories.length + idx,
                }).select('id').single();
                return { name: name.trim(), id: data?.id as string };
            }));

            // Save reparto type to settings
            const sectionSlug = wizardMacro.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
            await db.from('settings').upsert(
                { restaurant_id: restaurantId, key: `section_type_${sectionSlug}`, value: wizardType },
                { onConflict: 'restaurant_id,key' }
            );

            // Build all products: drafts + current form (if filled)
            const allDrafts = [...wizardProductsDraft];
            if (wizardProductName.trim()) {
                allDrafts.push({
                    sectionIdx: wizardSelectedSectionIdx,
                    name: wizardProductName.trim(),
                    description: wizardProductDesc.trim(),
                    priceMode: wizardActivePriceMode,
                    price: wizardPrice,
                    priceUnit: wizardPriceUnit,
                    formati: [...wizardFormati],
                    allergens: [...wizardAllergeni],
                    active: wizardVisible,
                    imageUrl: wizardPhotoUrl,
                    labels: [...wizardSelectedLabels],
                    glassType: wizardGlassType,
                });
            }

            // Insert products
            if (allDrafts.length > 0) {
                const productsToInsert = allDrafts.map((wp, i) => {
                    const cat = newCats[wp.sectionIdx] ?? newCats[0];
                    if (!cat?.id) return null;

                    let price = 0;
                    let priceUnit = '';

                    if (wp.priceMode === 'unico') {
                        price = parseFloat(wp.price.replace(',', '.')) || 0;
                        priceUnit = wp.priceUnit;
                    } else if (wp.priceMode === 'peso') {
                        price = parseFloat(wp.price.replace(',', '.')) || 0;
                        priceUnit = `/ ${wp.priceUnit || 'etto'}`;
                    } else {
                        const first = wp.formati[0];
                        price = parseFloat(first?.price?.replace(',', '.') || '0') || 0;
                        priceUnit = first?.name || '';
                    }

                    return {
                        restaurant_id: restaurantId,
                        category_id: cat.id,
                        name: wp.name,
                        description: wp.description,
                        price,
                        price_unit: priceUnit || null,
                        image_url: wp.imageUrl || '',
                        sort_order: i,
                        active: wp.active,
                        allergens: wp.allergens,
                    };
                }).filter(Boolean);

                if (productsToInsert.length > 0) {
                    const { error } = await db.from('products').insert(productsToInsert);
                    if (error) {
                        showToast('Errore nel salvataggio dei prodotti: ' + error.message, 'error');
                        return;
                    }
                }
            }

            fetchData();
            setView('success');
        } catch (err) {
            showToast('Errore nel salvataggio', 'error');
            console.error(err);
        } finally {
            setWizardSaving(false);
        }
    };

    // ── Wizard Photo Upload ───────────────────────────────────────────────────

    const handleWizardPhotoUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setCropperState({
                src: reader.result as string,
                aspect: 4 / 3,
                callback: async (b64: string) => {
                    setWizardIsUploadingPhoto(true);
                    try {
                        const res = await fetch(b64);
                        const blob = await res.blob();
                        const fileName = `${restaurantId}/products/${Date.now()}_wizard.webp`;
                        const { error, data } = await db.storage.from('media').upload(fileName, blob, { upsert: true, contentType: 'image/webp' });
                        if (!error && data) {
                            const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(data.path);
                            setWizardPhotoUrl(publicUrl);
                        } else {
                            setWizardPhotoUrl(b64);
                        }
                        showToast('✓ Foto aggiunta');
                    } finally {
                        setWizardIsUploadingPhoto(false);
                    }
                },
            });
        };
        reader.readAsDataURL(file);
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

    // ── Bundle CRUD ───────────────────────────────────────────────────────────
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

    // ── Progress Bar ──────────────────────────────────────────────────────────
    const renderProgressBar = (step: number) => {
        const steps = [{ n: 1, label: 'Reparto' }, { n: 2, label: 'Sezioni' }, { n: 3, label: 'Prodotto' }];
        return (
            <div className="flex items-center px-1 py-4">
                {steps.map(({ n, label }, idx) => (
                    <React.Fragment key={n}>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${step > n ? 'bg-[#e6f4f4] text-[#008081]' : step === n ? 'bg-[#008081] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                {step > n ? '✓' : n}
                            </div>
                            <span className={`text-[12px] font-medium whitespace-nowrap transition-colors ${step === n ? 'text-[#008081] font-semibold' : step > n ? 'text-[#008081]' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-[2px] mx-2 rounded transition-colors ${step > n ? 'bg-[#008081]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

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
                HUB
            ══════════════════════════════════════════════════════════ */}
            {view === 'hub' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-28 max-w-2xl mx-auto">

                    {/* Search */}
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

                    {/* Stat chips */}
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

                    {/* Reparti */}
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
                                    const repartoType = sectionSettings[`section_type_${sectionSlug}`] as RepartoType | undefined;
                                    const typeEmoji = repartoType ? TYPE_CONFIG[repartoType]?.emoji : '';

                                    return (
                                        <div
                                            key={section}
                                            className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-2xl overflow-hidden flex items-center cursor-pointer active:shadow-lg transition-shadow"
                                            onClick={onOpenListino}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative flex-shrink-0 w-20 h-20">
                                                {thumbSrc ? (
                                                    <img src={thumbSrc} alt={section} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#e5e7eb] to-[#d1d5db] dark:from-[#2a2a2a] dark:to-[#1C1C1C] flex items-center justify-center">
                                                        {typeEmoji ? (
                                                            <span className="text-2xl">{typeEmoji}</span>
                                                        ) : (
                                                            <ImageIcon className="w-6 h-6 text-[#9ca3af]" />
                                                        )}
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
                                                    {repartoType && <span className="ml-1.5 text-[10px] bg-[#e6f4f4] text-[#008080] px-1.5 py-0.5 rounded font-semibold uppercase">{TYPE_CONFIG[repartoType]?.label}</span>}
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

                    {/* Strumenti Menù */}
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

                    {/* FAB mobile / Button desktop */}
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
                BUNDLE EDITOR
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
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-base text-gray-900 dark:text-white uppercase tracking-wide">
                                                    Menù {bundle.type}
                                                </span>
                                            </div>
                                            <span className="font-black text-lg text-[#008081]">€{Number(bundle.price).toFixed(2)}</span>
                                        </div>
                                        <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
                                            {[
                                                { key: 'entree', label: 'Entrée' }, { key: 'primo', label: 'Primo' },
                                                { key: 'secondo', label: 'Secondo' }, { key: 'contorno', label: 'Contorno' },
                                                { key: 'desert', label: 'Dessert' }, { key: 'bevande', label: 'Bevande' },
                                            ].filter(({ key }) => (bundle as any)[key]).map(({ key, label }) => (
                                                <div key={key} className="min-w-0">
                                                    <p className="text-[9px] font-black text-[#008081] uppercase tracking-widest">{label}</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold truncate mt-0.5">{(bundle as any)[key]}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 px-5 pb-4">
                                            <button onClick={() => setEditingBundle({ ...bundle })} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 rounded-xl transition-colors">
                                                <Save className="w-3.5 h-3.5" /> Modifica
                                            </button>
                                            <button onClick={() => handleDeleteBundle(bundle.id!)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-xl transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" /> Elimina
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {editingBundle && (
                            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <h3 className="font-black text-lg text-[#008081]">{editingBundle.id ? 'Modifica Menù' : 'Nuovo Menù'}</h3>
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
                                            { key: 'entree', label: 'Entrée' }, { key: 'primo', label: 'Primo / Main' },
                                            { key: 'secondo', label: 'Secondo' }, { key: 'contorno', label: 'Contorno' },
                                            { key: 'desert', label: 'Dessert' }, { key: 'bevande', label: 'Bevande' },
                                        ] as { key: keyof MenuBundle; label: string }[]).map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="block text-[9px] font-black text-[#008081] uppercase tracking-widest mb-1">{label}</label>
                                                <input type="text" placeholder={label} className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#008081]/30 outline-none" value={(editingBundle[key] as string) || ''} onChange={e => setEditingBundle({ ...editingBundle, [key]: e.target.value })} />
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
                WIZARD — Step 1: Reparto + Tipo
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {view === 'wizard-1' && (
                    <motion.div key="w1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader title="Nuovo Reparto" onBack={() => setView('hub')} />
                        {renderProgressBar(1)}

                        <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Il Reparto</h2>
                                <p className="text-gray-400 text-sm mt-2">Come si chiama questa grande famiglia di prodotti?</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Nome del Reparto</label>
                                <input
                                    type="text"
                                    value={wizardMacro.name}
                                    onChange={e => setWizardMacro({ ...wizardMacro, name: e.target.value })}
                                    placeholder="Es. Pizza, Cucina, Bar…"
                                    className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-bold text-lg text-[#008081] focus:ring-2 focus:ring-[#008081]/30 outline-none transition-all"
                                    onKeyDown={e => e.key === 'Enter' && goToWizardStep2()}
                                />
                            </div>

                            {/* Notice */}
                            <div className="bg-[#e6f4f4] dark:bg-[#008081]/10 border border-[#b3d9d9] dark:border-[#008081]/30 rounded-xl p-3 flex gap-2.5 items-start">
                                <span className="text-base flex-shrink-0">💡</span>
                                <p className="text-[12px] text-[#006666] dark:text-[#00b3b3] leading-relaxed">Il tipo configura automaticamente i campi prodotto più adatti. Puoi cambiarlo in qualsiasi momento.</p>
                            </div>

                            {/* Type grid */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Tipo di Reparto</p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {(Object.entries(TYPE_CONFIG) as [RepartoType, TypeConfig][]).map(([type, cfg]) => (
                                        <button
                                            key={type}
                                            onClick={() => setWizardType(type)}
                                            className={`relative border-2 rounded-xl p-3.5 text-left transition-all flex flex-col items-center gap-2 ${wizardType === type
                                                ? 'border-[#008081] bg-[#e6f4f4] dark:bg-[#008081]/10'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] hover:border-[#b3d9d9]'
                                            }`}
                                        >
                                            {wizardType === type && (
                                                <span className="absolute top-2 right-2 w-4 h-4 bg-[#008081] rounded-full text-white text-[9px] flex items-center justify-center font-black leading-none">✓</span>
                                            )}
                                            <span className="text-2xl">{cfg.emoji}</span>
                                            <span className="text-[13px] font-bold text-gray-900 dark:text-white text-center leading-tight">{cfg.label}</span>
                                            <span className="text-[10px] text-gray-400 text-center leading-tight">
                                                {cfg.suggestedSections.slice(0, 2).join(', ')}{cfg.suggestedSections.length > 2 ? '…' : ''}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={goToWizardStep2}
                                className="w-full bg-[#008081] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-600 active:scale-[0.98] transition-all"
                            >
                                Continua alle Sezioni <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    WIZARD — Step 2: Sezioni
                ══════════════════════════════════════════════════════════ */}
                {view === 'wizard-2' && (
                    <motion.div key="w2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader title="Le Sezioni" onBack={() => setView('wizard-1')} />
                        {renderProgressBar(2)}

                        <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">

                            {/* Badge */}
                            <div className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 bg-[#e6f4f4] dark:bg-[#008081]/10 text-[#008080] rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                                    {TYPE_CONFIG[wizardType].emoji} {TYPE_CONFIG[wizardType].label}
                                </span>
                            </div>

                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Le Sezioni</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Come vuoi dividere <strong className="text-[#008081]">{wizardMacro.name || 'il reparto'}</strong>?
                                </p>
                            </div>

                            {/* Suggested section pills */}
                            {TYPE_CONFIG[wizardType].suggestedSections.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Sezioni suggerite</p>
                                    <div className="flex flex-wrap gap-2">
                                        {TYPE_CONFIG[wizardType].suggestedSections.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    if (wizardSubCats.length === 1 && !wizardSubCats[0].trim()) {
                                                        setWizardSubCats([s]);
                                                    } else if (!wizardSubCats.includes(s)) {
                                                        setWizardSubCats(prev => [...prev, s]);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-500 hover:bg-[#e6f4f4] hover:border-[#008081] hover:text-[#008081] transition-all font-medium"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section list */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Le tue sezioni</p>
                                <div className="space-y-2.5">
                                    {wizardSubCats.map((sub, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={sub}
                                                onChange={e => { const n = [...wizardSubCats]; n[idx] = e.target.value; setWizardSubCats(n); }}
                                                placeholder={idx === 0 ? (TYPE_CONFIG[wizardType].suggestedSections[0] || 'Es. Sezione principale') : 'Nuova Sezione'}
                                                className={`flex-1 border rounded-xl p-3 font-medium text-sm outline-none transition-all ${idx === 0
                                                    ? 'border-[#b3d9d9] bg-[#e6f4f4] dark:bg-[#008081]/10 dark:border-[#008081]/30 text-[#006666] dark:text-[#00b3b3] focus:ring-2 focus:ring-[#008081]/30'
                                                    : 'bg-gray-50 dark:bg-[#262626] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30'
                                                }`}
                                            />
                                            {idx > 0 ? (
                                                <button
                                                    onClick={() => setWizardSubCats(wizardSubCats.filter((_, i) => i !== idx))}
                                                    className="w-11 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <div className="w-11 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setWizardSubCats([...wizardSubCats, ''])}
                                    className="w-full mt-2.5 border-2 border-dashed border-[#b3d9d9] text-[#008081] hover:bg-[#e6f4f4] hover:border-[#008081] py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Aggiungi sezione
                                </button>
                            </div>

                            <button
                                onClick={goToWizardStep3}
                                className="w-full bg-[#008081] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-600 active:scale-[0.98] transition-all"
                            >
                                Continua ai Prodotti <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    WIZARD — Step 3: Prodotto
                ══════════════════════════════════════════════════════════ */}
                {view === 'wizard-3' && (
                    <motion.div key="w3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-xl mx-auto">
                        <SubHeader
                            title="Aggiungi Prodotto"
                            onBack={() => setView('wizard-2')}
                            right={
                                wizardProductsDraft.length > 0 ? (
                                    <span className="bg-[#008081] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {wizardProductsDraft.length} in coda
                                    </span>
                                ) : undefined
                            }
                        />
                        {renderProgressBar(3)}

                        {/* Section pills */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {wizardSubCats.map((name, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setWizardSelectedSectionIdx(idx)}
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border-[1.5px] ${wizardSelectedSectionIdx === idx
                                        ? 'bg-[#008081] text-white border-[#008081]'
                                        : 'bg-white dark:bg-[#1C1C1C] text-gray-400 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    {name || `Sezione ${idx + 1}`}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-[#1C1C1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5 mt-3">

                            {/* ── Foto ── */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5">
                                    Foto del Prodotto
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal normal-case tracking-normal ml-2">opzionale</span>
                                </p>
                                {wizardPhotoUrl ? (
                                    <div className="relative rounded-xl overflow-hidden border border-[#008081]">
                                        <img src={wizardPhotoUrl} alt="" className="w-full h-48 object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex gap-2">
                                            <button
                                                onClick={() => wizardPhotoInputRef.current?.click()}
                                                className="flex-1 bg-white/20 text-white text-xs font-medium py-1.5 rounded-lg border border-white/30 hover:bg-white/30 transition-colors"
                                            >
                                                Cambia foto
                                            </button>
                                            <button
                                                onClick={() => setWizardPhotoUrl('')}
                                                className="flex-1 bg-white/90 text-gray-800 text-xs font-medium py-1.5 rounded-lg hover:bg-white transition-colors"
                                            >
                                                Rimuovi
                                            </button>
                                        </div>
                                        {wizardIsUploadingPhoto && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => wizardPhotoInputRef.current?.click()}
                                        disabled={wizardIsUploadingPhoto}
                                        className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-[#008081] hover:bg-[#e6f4f4]/50 dark:hover:bg-[#008081]/5 transition-all"
                                    >
                                        <div className="w-12 h-12 bg-[#e6f4f4] dark:bg-[#008081]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <ImageIcon className="w-6 h-6 text-[#008081]" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aggiungi una foto</p>
                                        <p className="text-xs text-gray-400">JPG, PNG · Max 5MB · Formato 4:3</p>
                                    </button>
                                )}
                                <input
                                    ref={wizardPhotoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; handleWizardPhotoUpload(f); } }}
                                />
                            </div>

                            {/* ── Identità ── */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Identità</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Nome prodotto</label>
                                        <input
                                            type="text"
                                            value={wizardProductName}
                                            onChange={e => setWizardProductName(e.target.value)}
                                            placeholder="Es. Margherita, Negroni…"
                                            className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                                            Descrizione
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal normal-case tracking-normal ml-2">opzionale</span>
                                        </label>
                                        <textarea
                                            value={wizardProductDesc}
                                            onChange={e => setWizardProductDesc(e.target.value)}
                                            placeholder="Ingredienti, note, storia del piatto…"
                                            rows={3}
                                            className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#008081]/30 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Prezzo ── */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Prezzo</p>

                                {/* Price mode tabs */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {TYPE_CONFIG[wizardType].priceModes.map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                setWizardActivePriceMode(mode);
                                                if (mode === 'taglie') {
                                                    setWizardFormati([{ name: 'S', price: '' }, { name: 'M', price: '' }, { name: 'L', price: '' }]);
                                                } else if (mode === 'formati') {
                                                    const cfg = TYPE_CONFIG[wizardType];
                                                    setWizardFormati(cfg.defaultFormati.length ? cfg.defaultFormati.map(f => ({ ...f, price: '' })) : [{ name: '', price: '' }]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border-[1.5px] transition-all ${wizardActivePriceMode === mode
                                                ? 'bg-[#008081] border-[#008081] text-white'
                                                : 'bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#008081] hover:text-[#008081]'
                                            }`}
                                        >
                                            {PRICE_MODE_LABELS[mode]}
                                        </button>
                                    ))}
                                </div>

                                {/* Prezzo fisso */}
                                {wizardActivePriceMode === 'unico' && (
                                    <div className="flex items-stretch border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-[#008081] focus-within:ring-2 focus-within:ring-[#008081]/20 transition-all">
                                        <span className="px-4 bg-gray-50 dark:bg-[#262626] text-[#008081] font-bold text-lg border-r border-gray-200 dark:border-gray-700 flex items-center">€</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.50"
                                            placeholder="0,00"
                                            value={wizardPrice}
                                            onChange={e => setWizardPrice(e.target.value)}
                                            className="flex-1 px-4 py-3.5 font-bold text-lg text-gray-900 dark:text-white bg-transparent outline-none"
                                        />
                                        <select
                                            value={wizardPriceUnit}
                                            onChange={e => setWizardPriceUnit(e.target.value)}
                                            className="px-3 bg-gray-50 dark:bg-[#262626] text-gray-500 dark:text-gray-400 text-sm border-l border-gray-200 dark:border-gray-700 outline-none cursor-pointer"
                                        >
                                            <option value="">–</option>
                                            <option value="/ porzione">/ porzione</option>
                                            <option value="/ pezzo">/ pezzo</option>
                                            <option value="/ persona">/ persona</option>
                                            <option value="/ 100g">/ 100g</option>
                                        </select>
                                    </div>
                                )}

                                {/* Al peso */}
                                {wizardActivePriceMode === 'peso' && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-stretch border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-[#008081] focus-within:ring-2 focus-within:ring-[#008081]/20 transition-all">
                                                <span className="px-4 bg-gray-50 dark:bg-[#262626] text-[#008081] font-bold text-lg border-r border-gray-200 dark:border-gray-700 flex items-center">€</span>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.50"
                                                    placeholder="0,00"
                                                    value={wizardPrice}
                                                    onChange={e => setWizardPrice(e.target.value)}
                                                    className="flex-1 px-4 py-3.5 font-bold text-lg text-gray-900 dark:text-white bg-transparent outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center border-[1.5px] border-gray-200 dark:border-gray-700 rounded-xl px-4 bg-white dark:bg-[#1C1C1C] focus-within:border-[#008081] transition-all">
                                                <span className="text-gray-400 text-sm mr-1">/</span>
                                                <select
                                                    value={wizardPriceUnit || 'etto'}
                                                    onChange={e => setWizardPriceUnit(e.target.value)}
                                                    className="bg-transparent text-sm font-bold text-gray-800 dark:text-white outline-none py-3"
                                                >
                                                    <option value="etto">etto</option>
                                                    <option value="100g">100g</option>
                                                    <option value="kg">kg</option>
                                                    <option value="porzione">porzione</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400">Es: €6,00 / etto → il prezzo finale si calcola all'ordine</p>
                                    </div>
                                )}

                                {/* Formati / Taglie */}
                                {(wizardActivePriceMode === 'formati' || wizardActivePriceMode === 'taglie') && (
                                    <div className="space-y-2.5">
                                        {wizardFormati.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nome formato"
                                                    value={f.name}
                                                    onChange={e => setWizardFormati(prev => prev.map((row, j) => j === i ? { ...row, name: e.target.value } : row))}
                                                    className={`border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-[#262626] focus:ring-2 focus:ring-[#008081]/30 outline-none transition-all ${wizardActivePriceMode === 'taglie' ? 'w-16 text-center font-bold' : 'flex-[1.2]'}`}
                                                />
                                                <div className="flex-1 flex items-stretch border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-[#008081] transition-all">
                                                    <span className="px-3 bg-gray-50 dark:bg-[#262626] text-[#008081] font-bold text-sm border-r border-gray-200 dark:border-gray-700 flex items-center">€</span>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.50"
                                                        placeholder="0,00"
                                                        value={f.price}
                                                        onChange={e => setWizardFormati(prev => prev.map((row, j) => j === i ? { ...row, price: e.target.value } : row))}
                                                        className="flex-1 px-3 py-3 font-bold text-sm text-gray-900 dark:text-white bg-transparent outline-none"
                                                    />
                                                </div>
                                                {i > 0 ? (
                                                    <button
                                                        onClick={() => setWizardFormati(prev => prev.filter((_, j) => j !== i))}
                                                        className="w-10 h-10 bg-red-50 dark:bg-red-900/10 text-red-400 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                ) : <div className="w-10 flex-shrink-0" />}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setWizardFormati(prev => [...prev, { name: '', price: '' }])}
                                            className="w-full border-[1.5px] border-dashed border-[#b3d9d9] text-[#008081] hover:bg-[#e6f4f4] rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Aggiungi {wizardActivePriceMode === 'taglie' ? 'taglia' : 'formato'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── Tipo bicchiere (bar only) ── */}
                            {TYPE_CONFIG[wizardType].showGlass && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                                        Tipo di bicchiere
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal normal-case tracking-normal ml-2">opzionale</span>
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {GLASS_OPTIONS.map(g => (
                                            <button
                                                key={g.name}
                                                onClick={() => setWizardGlassType(wizardGlassType === g.name ? '' : g.name)}
                                                className={`border-2 rounded-xl p-2.5 text-center transition-all ${wizardGlassType === g.name
                                                    ? 'border-[#008081] bg-[#e6f4f4] dark:bg-[#008081]/10'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] hover:border-[#b3d9d9]'
                                                }`}
                                            >
                                                <div className="text-2xl mb-1">{g.emoji}</div>
                                                <div className={`text-[10px] font-medium ${wizardGlassType === g.name ? 'text-[#008081]' : 'text-gray-400'}`}>{g.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Etichette ── */}
                            {TYPE_CONFIG[wizardType].labels.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                                        Etichette
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal normal-case tracking-normal ml-2">opzionale</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {TYPE_CONFIG[wizardType].labels.map(label => (
                                            <button
                                                key={label}
                                                onClick={() => setWizardSelectedLabels(prev =>
                                                    prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
                                                )}
                                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium border-[1.5px] transition-all ${wizardSelectedLabels.includes(label)
                                                    ? 'bg-[#e6f4f4] border-[#008081] text-[#008081] dark:bg-[#008081]/10'
                                                    : 'bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#b3d9d9]'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Allergeni ── */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                {FOOD_ALLERGEN_TYPES.includes(wizardType) ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Allergeni</p>
                                            <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold">Reg. UE 1169/2011</span>
                                        </div>
                                        <AllergenGrid
                                            selected={wizardAllergeni}
                                            onChange={ids => setWizardAllergeni(ids)}
                                            size="sm"
                                        />
                                    </>
                                ) : (
                                    <details className="group">
                                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-amber-500 transition-colors font-medium flex items-center gap-1.5 list-none select-none">
                                            ⚠️ Questo prodotto contiene allergeni?
                                        </summary>
                                        <div className="mt-3">
                                            <AllergenGrid
                                                selected={wizardAllergeni}
                                                onChange={ids => setWizardAllergeni(ids)}
                                                size="sm"
                                            />
                                        </div>
                                    </details>
                                )}
                            </div>

                            {/* ── Visibilità ── */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[15px] font-medium text-gray-800 dark:text-gray-200">Visibile nel menù</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Disattiva per nascondere senza eliminare</p>
                                </div>
                                <button
                                    onClick={() => setWizardVisible(!wizardVisible)}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${wizardVisible ? 'bg-[#008081]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${wizardVisible ? 'right-[2px]' : 'left-[2px]'}`} />
                                </button>
                            </div>

                            {/* ── Actions ── */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    onClick={handleSaveAndAddNew}
                                    disabled={wizardSaving}
                                    className="flex-1 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    + Salva e aggiungi
                                </button>
                                <button
                                    onClick={handleSaveWizardFinal}
                                    disabled={wizardSaving}
                                    className="flex-1 bg-[#008081] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-600 transition-colors shadow-lg shadow-[#008081]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {wizardSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Salva e Termina
                                </button>
                            </div>
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
                        <p className="text-gray-400 font-medium">
                            <strong className="text-[#008081]">{wizardMacro.name}</strong> è stato configurato con successo.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { resetWizard(); onOpenPersonalizzazione(); }} className="w-full border-2 border-[#008081] text-[#008081] py-4 rounded-2xl font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
                                Associa Suggerimenti Rapidi
                            </button>
                            <button onClick={() => { resetWizard(); setView('hub'); }} className="w-full bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Torna al Menù
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
