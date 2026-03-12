import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ArrowLeft } from 'lucide-react';

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
    const [modifications, setModifications] = useState<Array<{ id: number; text: string; price: string }>>([]);

    // Reset state when a new product is opened
    useEffect(() => {
        if (isOpen) {
            setModifications([]);
            setQuantity(1);
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, product]);

    if (!isOpen) return null;

    const handleAddModification = () => {
        setModifications([...modifications, { id: Date.now(), text: '', price: '' }]);
    };

    const handleModificationChange = (id: number, field: 'text' | 'price', value: string) => {
        setModifications(modifications.map(mod =>
            mod.id === id ? { ...mod, [field]: value } : mod
        ));
    };

    const handleRemoveModification = (id: number) => {
        setModifications(modifications.filter(mod => mod.id !== id));
    };

    const handleAddSuggestion = (extra: ProductExtra) => {
        setModifications([...modifications, {
            id: Date.now() + Math.random(),
            text: extra.name,
            price: extra.price > 0 ? extra.price.toFixed(2).replace('.', ',') : ''
        }]);
    };

    const extraPriceSum = modifications.reduce((sum, mod) => {
        const val = parseFloat(mod.price.replace(',', '.'));
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const totalPrice = (product.price + extraPriceSum) * quantity;

    const handleConfirm = () => {
        const validModifications = modifications
            .filter(m => m.text.trim() !== '')
            .map(m => {
                const price = parseFloat(m.price.replace(',', '.'));
                return { name: m.text.trim(), price: isNaN(price) ? 0 : price };
            });

        onAddToCart(product, {
            removed: [],
            added: validModifications
        }, quantity);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-[#1A1A1A] animate-fade-in sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm sm:p-4">
            <div
                className="bg-[#FBFBFB] dark:bg-[#1A1A1A] w-full h-full sm:max-w-2xl sm:h-[85vh] sm:rounded-3xl flex flex-col overflow-hidden sm:shadow-premium relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FBFBFB] dark:bg-[#1A1A1A] relative scrollbar-hide">
                    {/* Floating Back Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 sm:top-6 sm:left-8 z-30 p-2.5 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md shadow-lg hover:scale-105 active:scale-95 rounded-full transition-all focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6 text-[#1A1A1A] dark:text-white" />
                    </button>

                    {/* Header Image */}
                    <div className="w-full bg-[#FBFBFB] dark:bg-[#1A1A1A] px-4 sm:px-8 pt-16 sm:pt-8 pb-4">
                        <div className="relative w-full h-[40vh] sm:h-[45vh] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ objectFit: 'cover' }}
                                className="absolute inset-0 w-full h-full object-cover object-center transition-transform hover:scale-105 duration-700"
                            />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 sm:px-8 py-2 flex flex-col items-center sm:items-start min-h-max pb-8">
                        {/* Title & Price */}
                        <div className="text-center sm:text-left w-full mb-6">
                            <h2 className="text-3xl font-bold font-sans text-[#1A1A1A] dark:text-white tracking-tight">{product.name}</h2>
                            <p className="text-[#008080] text-xl font-bold mt-1.5">€{product.price.toFixed(2)}</p>
                        </div>

                        {product.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-center sm:text-left text-base mb-8 leading-relaxed max-w-md w-full">
                                {product.description}
                            </p>
                        )}

                        {/* Quick Suggestions / Suggerimenti Rapidi */}
                        {extras && extras.length > 0 && (
                            <div className="w-full max-w-md mb-6">
                                <h3 className="font-medium text-[#1A1A1A] dark:text-white text-base mb-3">Suggerimenti Rapidi</h3>
                                <div className="flex flex-wrap gap-2">
                                    {extras.map(extra => (
                                        <button
                                            key={extra.id}
                                            onClick={() => handleAddSuggestion(extra)}
                                            className="px-3 py-1.5 bg-[#008080]/10 text-[#008080] dark:bg-[#008080]/20 dark:text-teal-400 rounded-lg text-sm font-bold hover:bg-[#008080]/20 dark:hover:bg-[#008080]/30 transition-colors border border-[#008080]/20"
                                        >
                                            + {extra.name} {extra.price > 0 ? `(€${extra.price.toFixed(2)})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Modifications Section */}
                        <div className="w-full max-w-md mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium text-[#1A1A1A] dark:text-white text-base">Note o Modifiche</h3>
                                <button
                                    onClick={handleAddModification}
                                    className="p-2 bg-[#F8F9FA] dark:bg-[#262626] rounded-full text-[#008080] hover:bg-[#E9ECEF] dark:hover:bg-[#333] transition-colors shadow-sm"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {modifications.length > 0 ? (
                                <div className="space-y-3">
                                    {modifications.map((mod) => (
                                        <div key={mod.id} className="flex gap-2 items-center animate-fade-in-up">
                                            <input
                                                type="text"
                                                placeholder="Ej: Senza Cipolla, + Extra Prosciutto"
                                                value={mod.text}
                                                onChange={(e) => handleModificationChange(mod.id, 'text', e.target.value)}
                                                className="flex-1 bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-3xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#008080] outline-none transition-all shadow-premium border border-transparent"
                                            />
                                            <div className="relative w-24">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold hidden sm:inline">€</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    step="0.10"
                                                    min="0"
                                                    value={mod.price}
                                                    onChange={(e) => handleModificationChange(mod.id, 'price', e.target.value)}
                                                    className="w-full bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-3xl px-2 sm:pl-7 sm:pr-3 py-3 text-sm focus:ring-2 focus:ring-[#008080] outline-none transition-all font-bold text-center sm:text-left shadow-premium border border-transparent"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveModification(mod.id)}
                                                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nessuna modifica. Clicca il + per aggiungere un'istruzione.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1"></div>

                        {/* Quantity Selector */}
                        <div className="flex justify-center flex-col items-center gap-1 mb-6 mt-4 w-full">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantità</span>
                            <div className="flex items-center gap-6 mt-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-[#262626] transition-colors shadow-premium bg-[#FBFBFB] dark:bg-[#1A1A1A]"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-3xl font-bold w-10 text-center text-[#1A1A1A] dark:text-white">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-[#262626] transition-colors shadow-premium bg-[#FBFBFB] dark:bg-[#1A1A1A]"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Add to Cart */}
                <div className="p-4 bg-[#FBFBFB]/80 backdrop-blur-md dark:bg-[#1A1A1A]/80 border-t border-gray-200/50 dark:border-gray-800/50 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe relative z-20">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 font-bold text-white text-base bg-[#008080] rounded-3xl hover:bg-[#006666] transition-all duration-300 shadow-premium hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <span>Aggiungi al carrello • </span>
                        <span>€{totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
