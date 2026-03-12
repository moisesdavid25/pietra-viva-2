import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, ArrowLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import db from '../db';
import { useCart } from '../hooks/useCart';
import ProductModal from '../components/menu/ProductModal';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    price_unit: string | null;
    image_url: string;
    category_id: string;
    base_ingredients?: string[];
}

interface Category {
    id: string;
    name: string;
    section: string;
}

export default function Cameriere() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { cart, addToCart, totalItems, totalPrice } = useCart(slug || null);

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [extras, setExtras] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        async function loadData() {
            if (!slug) return;
            const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
            if (!resData) return;

            const { data: cats } = await db.from('categories').select('*').eq('restaurant_id', resData.id).order('name');
            if (cats) setCategories(cats);

            const { data: prods } = await db.from('products').select('*').in('category_id', cats?.map(c => c.id) || []).order('name');

            const { data: menuData } = await db.from('menus').select('*').eq('restaurant_id', resData.id).order('id');

            if (cats) {
                setCategories([...cats, { id: 'cat-menus', name: 'Menu del Giorno', section: 'CUCINA' }]);
            }

            let allProducts = prods || [];
            if (menuData) {
                const mappedMenus = menuData.map(m => ({
                    id: `menu-${m.id}`,
                    name: `Menù ${m.type}`,
                    description: [m.entree, m.primo, m.secondo, m.contorno, m.desert, m.bevande].filter(Boolean).join(', '),
                    price: m.price,
                    price_unit: null,
                    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400',
                    category_id: 'cat-menus'
                }));
                allProducts = [...allProducts, ...mappedMenus];
            }
            setProducts(allProducts);

            const { data: ext } = await db.from('product_extras').select('*').eq('restaurant_id', resData.id).eq('available', true);
            if (ext) setExtras(ext);
        }
        loadData();
    }, [slug]);

    const handleAddToCart = (product: Product, customizations?: any) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            price_unit: product.price_unit,
            image_url: product.image_url,
            customizations
        });
        setAddedItems(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [product.id]: false }));
        }, 1500);
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [products, searchQuery]);

    // Group by category for rendering
    const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Altro';

    const MACRO_CATEGORIES_ORDER = [
        'VINO E DRINKS',
        'CUCINA',
        'PIZZA',
        'DESSERT',
        'MENU DEL GIORNO'
    ];

    const getMacroCategory = (catName: string): string => {
        const name = catName.toLowerCase();
        if (name.includes('menu del giorno')) {
            return 'MENU DEL GIORNO';
        }
        if (name.includes('bevande') || name.includes('birre') || name.includes('vino') || name.includes('rossi') || name.includes('bianchi') || name.includes('amari') || name.includes('drink') || name.includes('cocktail') || name.includes('bollicine')) {
            return 'VINO E DRINKS';
        }
        if (name.includes('antipast') || name.includes('primi') || name.includes('secondi') || name.includes('contorni') || name.includes('insalate') || name.includes('fritti') || name.includes('taglieri') || name.includes('cucina')) {
            return 'CUCINA';
        }
        if (name.includes('dolci') || name.includes('dessert') || name.includes('i nostri dolci') || name.includes('tiramisu') || name.includes('torta')) {
            return 'DESSERT';
        }
        if (name.includes('pizza') || name.includes('rosse') || name.includes('bianche') || name.includes('gourmet') || name.includes('classich') || name.includes('calzon') || name.includes('ripieni') || name.includes('special')) {
            return 'PIZZA';
        }
        return 'CUCINA'; // Default fallback
    };

    const groupedByMacro = useMemo(() => {
        const groups: Record<string, Record<string, Product[]>> = {
            'VINO E DRINKS': {},
            'CUCINA': {},
            'PIZZA': {},
            'DESSERT': {},
            'MENU DEL GIORNO': {}
        };

        filteredProducts.forEach(product => {
            const catName = getCategoryName(product.category_id);
            const macro = getMacroCategory(catName);

            if (!groups[macro]) {
                groups[macro] = {};
            }
            if (!groups[macro][catName]) {
                groups[macro][catName] = [];
            }
            groups[macro][catName].push(product);
        });

        // Sort subcategories alphabetically
        Object.keys(groups).forEach(macro => {
            const sortedCats: Record<string, Product[]> = {};
            Object.keys(groups[macro]).sort().forEach(cat => {
                sortedCats[cat] = groups[macro][cat];
            });
            groups[macro] = sortedCats;
        });

        return groups;
    }, [filteredProducts, categories]);

    // Auto-expand categories if searching
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const newExpanded: Record<string, boolean> = {};
            Object.values(groupedByMacro).forEach(macroGroup => {
                Object.keys(macroGroup).forEach(cat => {
                    newExpanded[cat] = true;
                });
            });
            setExpandedCategories(newExpanded);
        } else {
            // By user request, NO categories should be open by default unless searching
            setExpandedCategories({});
        }
    }, [searchQuery, groupedByMacro]);

    const toggleCategory = (catName: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#121212] min-h-screen pb-24 font-sans text-gray-900 dark:text-white">
            {/* Sticky Header with Search */}
            <div className="sticky top-0 z-40 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(`/${slug}/gestione`)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[#008080]" />
                    </button>
                    <h1 className="font-bold text-lg tracking-wide uppercase text-center flex-grow">Modalità Cameriere</h1>
                    <div className="w-10"></div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 bg-[#FBFBFB] dark:bg-[#262626] shadow-premium border-none rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-[#008080] outline-none transition-shadow"
                        placeholder="Cerca prodotto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Dense Product List */}
            <div className="p-4 space-y-8">
                {Object.values(groupedByMacro).every(macroGroup => Object.keys(macroGroup).length === 0) ? (
                    <div className="text-center py-12 text-gray-500 font-medium">Nessun prodotto trovato.</div>
                ) : (
                    MACRO_CATEGORIES_ORDER.map(macroName => {
                        const macroCategories = groupedByMacro[macroName];
                        if (!macroCategories || Object.keys(macroCategories).length === 0) return null;

                        return (
                            <div key={macroName} className="space-y-4">
                                <h2 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                                    {macroName}
                                </h2>
                                <div className="space-y-3">
                                    {(Object.entries(macroCategories) as [string, Product[]][]).map(([catName, prods]) => {
                                        const isExpanded = expandedCategories[catName];
                                        return (
                                            <div key={catName} className="bg-[#FBFBFB] dark:bg-[#1A1A1A] rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300">
                                                <button
                                                    onClick={() => toggleCategory(catName)}
                                                    className="w-full flex items-center justify-between p-5 focus:outline-none"
                                                >
                                                    <h3 className="font-bold text-[#1A1A1A] dark:text-gray-200 uppercase tracking-widest text-sm">{catName} <span className="text-gray-400 dark:text-gray-600 ml-2 font-normal text-xs">({prods.length})</span></h3>
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>

                                                {isExpanded && (
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                                                        {prods.map(product => (
                                                            <button
                                                                key={product.id}
                                                                onClick={() => setSelectedProduct(product)}
                                                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#252525] active:bg-gray-100 dark:active:bg-[#333] transition-colors text-left"
                                                            >
                                                                <div className="flex-1 pr-4">
                                                                    <h4 className="font-bold text-[#1A1A1A] dark:text-white text-lg leading-tight">{product.name}</h4>
                                                                    <p className="text-[#008080] font-bold mt-0.5">€{product.price.toFixed(2)}</p>
                                                                </div>
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAddToCart(product);
                                                                    }}
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${addedItems[product.id] ? 'bg-green-500 text-white' : 'bg-[#F0F0F0] dark:bg-[#262626] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                >
                                                                    {addedItems[product.id] ? <span className="font-bold text-lg">✓</span> : <Plus className="w-5 h-5" />}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <div className="fixed bottom-6 inset-x-4 z-40 animate-fade-in-up">
                    <Link to={`/${slug}/ordini`} className="bg-[#008080] text-white p-4 rounded-full flex items-center justify-between shadow-xl shadow-[#008080]/30 active:scale-95 transition-transform font-bold">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                                {totalItems}
                            </div>
                            <span className="uppercase tracking-wider">Vai all'ordine</span>
                        </div>
                        <span className="text-xl">€{totalPrice.toFixed(2)}</span>
                    </Link>
                </div>
            )}

            {/* Pizza Builder / Customization Modal */}
            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    extras={extras.filter(e => {
                        const catName = getCategoryName(selectedProduct.category_id).toLowerCase().trim();
                        const eCats = (e.category || []).map((c: string) => c.toLowerCase().trim());
                        return eCats.includes(catName) || eCats.includes('global');
                    })}
                    isOpen={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
}
