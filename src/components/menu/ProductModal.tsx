import React, { useState, useEffect } from 'react';
import { Plus, Minus, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ALLERGENS } from '../gestione/AllergensManager';

interface ProductExtra {
    id: string;
    name: string;
    price: number;
    category: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    price_unit: string | null;
    image_url: string;
    base_ingredients?: string[];
    allergens?: string[];
    category_id?: string;
}

interface Props {
    product: Product;
    extras: ProductExtra[];
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: any, customizations: any, quantity: number) => void;
}

export default function ProductModal({ product, extras, isOpen, onClose, onAddToCart }: Props) {
    const [quantity, setQuantity] = useState(1);
    const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedExtras([]);
            setQuantity(1);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, product]);

    if (!isOpen) return null;

    const toggleExtra = (extra: ProductExtra) => {
        setSelectedExtras(prev =>
            prev.some(e => e.id === extra.id)
                ? prev.filter(e => e.id !== extra.id)
                : [...prev, extra]
        );
    };

    const extraPriceSum = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const totalPrice = (product.price + extraPriceSum) * quantity;

    const handleConfirm = () => {
        onAddToCart(product, {
            removed: [],
            added: selectedExtras.map(e => ({ name: e.name, price: e.price })),
        }, quantity);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm sm:p-4">
            <div
                className="bg-[#FBFBFB] dark:bg-[#1A1A1A] w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-3xl flex flex-col overflow-hidden sm:shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">

                    {/* Back button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 z-30 p-2.5 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md shadow-lg rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </button>

                    {/* Hero image */}
                    <div className="relative w-full h-[42vh] sm:h-60 overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFB] dark:from-[#1A1A1A] via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-4 -mt-2 relative">

                        {/* Name + Price */}
                        <div className="mb-4">
                            <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight leading-tight">
                                {product.name}
                            </h2>
                            <p className="text-[#008081] text-lg font-bold mt-1">
                                €{product.price.toFixed(2)}{product.price_unit || ''}
                            </p>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">
                                {product.description}
                            </p>
                        )}

                        {/* Allergens */}
                        {product.allergens && product.allergens.length > 0 && (
                            <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Allergeni presenti</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {ALLERGENS.filter(a => product.allergens!.includes(a.id)).map(a => (
                                        <span key={a.id} className="flex items-center gap-1 bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300">
                                            {a.emoji} {a.label}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                                    In caso di allergie gravi, informa sempre il nostro personale.
                                </p>
                            </div>
                        )}

                        {/* Extras */}
                        {extras && extras.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Aggiuntivi
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {extras.map(extra => {
                                        const selected = selectedExtras.some(e => e.id === extra.id);
                                        return (
                                            <button
                                                key={extra.id}
                                                onClick={() => toggleExtra(extra)}
                                                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                    selected
                                                        ? 'bg-[#008081] text-white border-transparent shadow-md'
                                                        : 'bg-white dark:bg-[#252525] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#008081]'
                                                }`}
                                            >
                                                {selected ? '✓ ' : '+ '}{extra.name}
                                                {extra.price > 0 && (
                                                    <span className={`ml-1.5 font-black ${selected ? 'text-teal-100' : 'text-[#008081]'}`}>
                                                        +€{extra.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantità</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-[#008081] active:scale-95 transition-all"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-2xl font-black w-8 text-center text-[#1A1A1A] dark:text-white">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-[#008081] active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-4 bg-[#FBFBFB]/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 font-black text-white text-base bg-[#008081] rounded-2xl hover:bg-[#006666] active:scale-[0.98] transition-all shadow-lg flex items-center justify-between px-6"
                    >
                        <span>Aggiungi al carrello</span>
                        <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-black">€{totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
