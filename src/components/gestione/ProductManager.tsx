import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Trash2, Save, X, Check, GripVertical, Search, ImageOff } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../Toast';
import db from '../../db';

// ── Types ─────────────────────────────────────────────────────────────────────

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
    active?: boolean;
}

interface Props {
    restaurantId: string;
    categories: Category[];
    products: Product[];
    onRefresh: () => void;
    onBack: () => void;
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function InlineCell({
    value,
    onSave,
    isPrice = false,
    className = '',
}: {
    value: string | number;
    onSave: (val: string) => void;
    isPrice?: boolean;
    className?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setDraft(String(value)); }, [value]);
    useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== String(value)) onSave(draft);
    };

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    ref={inputRef}
                    type={isPrice ? 'number' : 'text'}
                    step={isPrice ? '0.5' : undefined}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') commit();
                        if (e.key === 'Escape') { setEditing(false); setDraft(String(value)); }
                    }}
                    className={`border border-[#008081]/50 bg-teal-50 dark:bg-teal-900/20 rounded-lg px-2 py-0.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#008081]/40 transition-all ${isPrice ? 'w-20 text-[#008081]' : 'w-full text-gray-900 dark:text-white'}`}
                    autoFocus
                />
                <button onMouseDown={commit} className="text-green-500 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                <button onMouseDown={() => { setEditing(false); setDraft(String(value)); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
            </div>
        );
    }

    return (
        <span
            onClick={() => setEditing(true)}
            title="Clicca per modificare"
            className={`cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors ${className}`}
        >
            {isPrice ? `€${Number(value).toFixed(2)}` : value}
        </span>
    );
}

// ── Sortable Product Row ──────────────────────────────────────────────────────

interface SortableRowProps {
    key?: React.Key;
    product: Product;
    isPendingDelete: boolean;
    onInlineSaveName: (p: Product, val: string) => void;
    onInlineSavePrice: (p: Product, val: string) => void;
    onToggleActive: (p: Product) => void;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
    onUndoDelete: () => void;
}

function SortableRow({
    product,
    isPendingDelete,
    onInlineSaveName,
    onInlineSavePrice,
    onToggleActive,
    onEdit,
    onDelete,
    onUndoDelete,
}: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const hasNoPhoto = !product.image_url || product.image_url === '';

    if (isPendingDelete) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400 rounded-xl mx-1 my-0.5"
            >
                <p className="flex-1 text-sm font-bold text-red-500 truncate">"{product.name}" eliminato</p>
                <button
                    onClick={onUndoDelete}
                    className="text-[#008081] font-black text-xs hover:text-teal-600 transition-colors flex-shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1C1C] border border-[#008081]/30"
                >
                    ANNULLA
                </button>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 px-4 py-3 group transition-all ${isDragging ? 'opacity-60 shadow-xl bg-white dark:bg-[#1C1C1C] rounded-xl' : ''} ${!product.active ? 'opacity-40 bg-gray-50/80 dark:bg-gray-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A]/40'}`}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
                aria-label="Trascina per riordinare"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700 shadow-sm"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-300">
                        <ImageOff className="w-4 h-4" />
                    </div>
                )}
                {hasNoPhoto && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase leading-none">
                        NO FOTO
                    </span>
                )}
            </div>

            {/* Name + Description */}
            <div className="flex-1 min-w-0">
                <InlineCell
                    value={product.name}
                    onSave={val => onInlineSaveName(product, val)}
                    className="font-semibold text-sm text-gray-900 dark:text-gray-100 block w-full truncate"
                />
                {product.description && (
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium leading-tight">
                        {product.description}
                    </p>
                )}
                {product.price_unit && (
                    <span className="text-[9px] text-gray-300 font-bold">{product.price_unit}</span>
                )}
            </div>

            {/* Price */}
            <div className="flex-shrink-0">
                <InlineCell
                    value={product.price}
                    onSave={val => onInlineSavePrice(product, val)}
                    isPrice
                    className="font-black text-sm text-[#008081]"
                />
            </div>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onToggleActive(product)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${product.active ? 'bg-teal-50 text-[#008081] hover:bg-teal-100 dark:bg-teal-900/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800'}`}
                    title={product.active ? 'Nascondi dal menù' : 'Mostra nel menù'}
                >
                    {product.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={() => onEdit(product)}
                    className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors"
                    title="Modifica completa"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(product.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                    title="Elimina"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProductManager({ restaurantId, categories, products, onRefresh, onBack }: Props) {
    const { showToast, ToastContainer } = useToast();

    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedMacroCategory, setSelectedMacroCategory] = useState<string | null>(null);
    const [expandedSubCats, setExpandedSubCats] = useState<Record<string, boolean>>({});
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setLocalProducts(products); }, [products]);

    // DnD sensors — supports both mouse and touch
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    // ── Inline Save ───────────────────────────────────────────────────────────
    const handleInlineSaveName = async (product: Product, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === product.name) return;
        setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, name: trimmed } : p));
        await db.from('products').update({ name: trimmed }).eq('id', product.id);
        showToast('✓ Nome aggiornato');
        onRefresh();
    };

    const handleInlineSavePrice = async (product: Product, rawVal: string) => {
        const newPrice = parseFloat(rawVal.replace(',', '.'));
        if (isNaN(newPrice) || newPrice === product.price) return;
        setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: newPrice } : p));
        await db.from('products').update({ price: newPrice }).eq('id', product.id);
        showToast('✓ Prezzo aggiornato');
        onRefresh();
    };

    // ── Full Save (drawer) ────────────────────────────────────────────────────
    const handleSaveProduct = async () => {
        if (!editingProduct?.name || editingProduct.price === undefined || !editingProduct?.category_id) {
            showToast('Compila tutti i campi obbligatori', 'error');
            return;
        }
        const isNew = !editingProduct.id;
        if (isNew) {
            await db.from('products').insert({
                restaurant_id: restaurantId,
                category_id: editingProduct.category_id,
                name: editingProduct.name,
                description: editingProduct.description || '',
                price: editingProduct.price,
                price_unit: editingProduct.price_unit || null,
                image_url: editingProduct.image_url || '',
                sort_order: editingProduct.sort_order || 0,
                active: true,
            });
            showToast('✓ Prodotto creato');
        } else {
            await db.from('products').update({
                category_id: editingProduct.category_id,
                name: editingProduct.name,
                description: editingProduct.description || '',
                price: editingProduct.price,
                price_unit: editingProduct.price_unit || null,
                image_url: editingProduct.image_url || '',
                sort_order: editingProduct.sort_order,
            }).eq('id', editingProduct.id!).eq('restaurant_id', restaurantId);
            showToast('✓ Prodotto aggiornato');
        }
        setEditingProduct(null);
        onRefresh();
    };

    // ── Delete with Undo ──────────────────────────────────────────────────────
    const handleDeleteProduct = (id: string) => {
        setPendingDeleteId(id);
        setLocalProducts(prev => prev.map(p => p.id === id ? p : p));
        showToast('Prodotto eliminato — tocca ANNULLA per ripristinare', 'info');
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(async () => {
            await db.from('products').delete().eq('id', id);
            setLocalProducts(prev => prev.filter(p => p.id !== id));
            setPendingDeleteId(null);
            onRefresh();
        }, 4000);
    };

    const handleUndoDelete = useCallback(() => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setPendingDeleteId(null);
        showToast('Eliminazione annullata');
    }, [showToast]);

    // ── Toggle Active ─────────────────────────────────────────────────────────
    const handleToggleProductActive = async (product: Product) => {
        const newActive = !product.active;
        setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newActive } : p));
        await db.from('products').update({ active: newActive }).eq('id', product.id);
        showToast(newActive ? 'Prodotto visibile nel menù' : 'Prodotto nascosto dal menù', newActive ? 'success' : 'info');
        onRefresh();
    };

    // ── Drag & Drop reorder ───────────────────────────────────────────────────
    const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const catProds = localProducts.filter(p => p.category_id === categoryId);
        const oldIndex = catProds.findIndex(p => p.id === active.id);
        const newIndex = catProds.findIndex(p => p.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove<Product>(catProds, oldIndex, newIndex).map((p, i) => ({ ...p, sort_order: i }));

        setLocalProducts(prev => {
            const other = prev.filter(p => p.category_id !== categoryId);
            return [...other, ...reordered];
        });

        await Promise.all(reordered.map((p, i) => db.from('products').update({ sort_order: i }).eq('id', p.id)));
        onRefresh();
    };

    // ── Image Upload → Supabase Storage ──────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const img = new Image();
                img.onload = async () => {
                    const MAX_WIDTH = 800;
                    let width = img.width, height = img.height;
                    if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { setIsUploading(false); return; }
                    ctx.drawImage(img, 0, 0, width, height);

                    const base64 = canvas.toDataURL('image/webp', 0.7);
                    const res = await fetch(base64);
                    const blob = await res.blob();
                    const fileName = `${restaurantId}/products/${Date.now()}_${file.name.replace(/\s/g, '_')}.webp`;

                    const { error, data } = await db.storage.from('media').upload(fileName, blob, { upsert: true, contentType: 'image/webp' });
                    if (error) {
                        // Fallback: store base64 if storage fails
                        setEditingProduct(prev => prev ? { ...prev, image_url: base64 } : prev);
                        showToast('Immagine salvata localmente', 'info');
                    } else {
                        const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(data.path);
                        setEditingProduct(prev => prev ? { ...prev, image_url: publicUrl } : prev);
                        showToast('✓ Immagine caricata');
                    }
                    setIsUploading(false);
                };
                img.onerror = () => setIsUploading(false);
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } catch {
            setIsUploading(false);
            showToast('Errore upload immagine', 'error');
        }
    };

    // ── Delete macro section ──────────────────────────────────────────────────
    const handleDeleteMacroCategory = async (macroName: string) => {
        const ids = categories.filter(c => c.section === macroName).map(c => c.id);
        if (ids.length === 0) return;
        await db.from('categories').delete().in('id', ids);
        setSelectedMacroCategory(null);
        showToast(`Reparto "${macroName}" eliminato`);
        onRefresh();
    };

    // ── Delete single sub-category ────────────────────────────────────────────
    const handleDeleteSubCategory = async (cat: Category) => {
        const macroSubCount = categories.filter(c => c.section === cat.section).length;
        if (macroSubCount <= 1) {
            showToast('Devi avere almeno una sezione nel reparto. Elimina il reparto intero.', 'error');
            return;
        }
        await db.from('categories').delete().eq('id', cat.id);
        showToast(`Sezione "${cat.name}" eliminata`);
        onRefresh();
    };

    // ── Computed data ─────────────────────────────────────────────────────────
    const macroSections = Array.from(new Set(categories.map(c => c.section)));

    const filteredProducts = searchQuery.trim()
        ? localProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        : localProducts;

    return (
        <div className="space-y-4 animate-fade-in pb-24 relative">

            {/* ── Full Edit Drawer ─────────────────────────────────────────── */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={() => setEditingProduct(null)}>
                    <div className="bg-white dark:bg-[#1A1A1A] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-xl text-[#008081] tracking-wide">
                                {editingProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
                            </h3>
                            <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome Prodotto *</label>
                                <input type="text" placeholder="Es. Margherita" className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Descrizione</label>
                                <textarea placeholder="Pomodoro, mozzarella, origano..." className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#008081]/30 outline-none min-h-[80px]" value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prezzo (€) *</label>
                                    <input type="number" placeholder="8.50" step="0.5" className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl font-black text-[#008081] focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingProduct.price ?? ''} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Unità (opz.)</label>
                                    <input type="text" placeholder="/etto, /l..." className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingProduct.price_unit || ''} onChange={e => setEditingProduct({ ...editingProduct, price_unit: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Categoria *</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-[#008081]/30 outline-none" value={editingProduct.category_id || ''} onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}>
                                    <option value="">Seleziona Categoria</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.section} › {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Immagine (1:1)</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="w-full p-3 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#008081] file:text-white hover:file:bg-teal-700 transition-all" />
                                {isUploading && <p className="text-xs text-[#008081] font-bold mt-1 animate-pulse">Caricamento su Storage...</p>}
                                {editingProduct.image_url && !isUploading && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <img src={editingProduct.image_url} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                        <button onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })} className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                                            <X className="w-3 h-3" /> Rimuovi
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={handleSaveProduct} disabled={isUploading} className="flex-1 bg-[#008081] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
                                <Save className="w-4 h-4" /> Salva
                            </button>
                            <button onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Navigation Header ──────────────────────────────────────── */}
            <div className="sticky top-0 bg-[#FBFBFB] dark:bg-[#1A1A1A] z-20 pb-3 pt-1 space-y-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => selectedMacroCategory ? setSelectedMacroCategory(null) : onBack()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008081] transition-colors font-bold text-sm bg-white dark:bg-[#262626] px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-800"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        {selectedMacroCategory ? 'Reparti' : 'Menù Hub'}
                    </button>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white capitalize truncate">
                        {selectedMacroCategory || 'Listino Prodotti'}
                    </h2>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca prodotto..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#008081]/30 outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Macro Category List ────────────────────────────────────── */}
            {!selectedMacroCategory ? (
                <div className="space-y-3 pt-1">
                    {macroSections.length === 0 && (
                        <div className="text-center py-16 text-gray-400 text-sm font-medium">
                            <p className="text-3xl mb-3">🍽️</p>
                            Nessuna categoria ancora. Torna al Hub e creane una.
                        </div>
                    )}
                    {macroSections.map(macro => {
                        const count = localProducts.filter(p => categories.find(c => c.id === p.category_id)?.section === macro).length;
                        const hidden = localProducts.filter(p => categories.find(c => c.id === p.category_id)?.section === macro && !p.active).length;
                        const noPhoto = localProducts.filter(p => categories.find(c => c.id === p.category_id)?.section === macro && !p.image_url).length;

                        return (
                            <button
                                key={macro}
                                onClick={() => setSelectedMacroCategory(macro)}
                                className="w-full bg-white dark:bg-[#1C1C1C] px-5 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between gap-4 hover:shadow-md hover:border-[#008081]/20 hover:-translate-y-0.5 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 text-[#008081] rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                                        🍽️
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-gray-900 dark:text-white">{macro}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-gray-500 font-medium">{count} prodotti</p>
                                            {hidden > 0 && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">{hidden} nascosti</span>}
                                            {noPhoto > 0 && <span className="text-[10px] font-bold text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-md">{noPhoto} senza foto</span>}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </button>
                        );
                    })}

                    {/* Search results overlay */}
                    {searchQuery.trim() && (
                        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-[#008081]/20 shadow-sm overflow-hidden">
                            <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                                Risultati ricerca ({filteredProducts.length})
                            </p>
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-6">Nessun prodotto trovato</p>
                            ) : filteredProducts.map(product => (
                                <div key={product.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                            <ImageOff className="w-4 h-4 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{categories.find(c => c.id === product.category_id)?.section}</p>
                                    </div>
                                    <span className="font-black text-sm text-[#008081]">€{product.price.toFixed(2)}</span>
                                    <button onClick={() => setEditingProduct({ ...product })} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Drill-Down: DnD Spreadsheet ──────────────────────── */
                <div className="space-y-3">
                    {/* Add product CTA */}
                    <button
                        onClick={() => setEditingProduct({ image_url: '', category_id: categories.find(c => c.section === selectedMacroCategory)?.id || '' })}
                        className="w-full bg-[#008081] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008081]/20 hover:bg-teal-700 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                        <Plus className="w-5 h-5" /> Aggiungi Prodotto in {selectedMacroCategory}
                    </button>

                    {/* Sub-category groups with DnD */}
                    {categories.filter(c => c.section === selectedMacroCategory).map(cat => {
                        const catProds = localProducts.filter(p => p.category_id === cat.id);
                        const isExpanded = expandedSubCats[cat.id] !== false;

                        return (
                            <div key={cat.id} className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                {/* Sub-cat header */}
                                <div
                                    className="group flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors border-b border-gray-100 dark:border-gray-800"
                                    onClick={() => setExpandedSubCats(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{cat.name}</h3>
                                        <span className="text-[10px] font-black bg-[#008081]/10 text-[#008081] px-2 py-0.5 rounded-full">{catProds.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteSubCategory(cat); }}
                                            className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* DnD Product list */}
                                {isExpanded && (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={e => handleDragEnd(e, cat.id)}
                                    >
                                        <SortableContext
                                            items={catProds.map(p => p.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                {catProds.length === 0 && (
                                                    <p className="text-center text-xs text-gray-400 py-4 font-medium">Nessun prodotto in questa sezione</p>
                                                )}
                                                {catProds.map(product => (
                                                    <SortableRow
                                                        key={product.id}
                                                        product={product}
                                                        isPendingDelete={pendingDeleteId === product.id}
                                                        onInlineSaveName={handleInlineSaveName}
                                                        onInlineSavePrice={handleInlineSavePrice}
                                                        onToggleActive={handleToggleProductActive}
                                                        onEdit={p => setEditingProduct({ ...p })}
                                                        onDelete={handleDeleteProduct}
                                                        onUndoDelete={handleUndoDelete}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        );
                    })}

                    {/* Delete macro section */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => handleDeleteMacroCategory(selectedMacroCategory)}
                            className="w-full bg-red-50 text-red-500 dark:bg-red-900/10 dark:text-red-400 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all border border-red-100 dark:border-red-900/30 text-sm"
                        >
                            <Trash2 className="w-4 h-4" /> Elimina reparto "{selectedMacroCategory}"
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2">
                            L'eliminazione rimuove tutte le sezioni e i prodotti associati.
                        </p>
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    );
}
