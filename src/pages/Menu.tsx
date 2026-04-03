import { ArrowLeft, Star, Plus, Droplets, Wine, Zap } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useCart } from '../hooks/useCart';
import db from '../db';
import BottomNav from '../components/BottomNav';
import NotFound from '../components/NotFound';
import ProductModal from '../components/menu/ProductModal';

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
}

interface Category {
  id: string;
  section: string;
  name: string;
  products: Product[];
}

export default function MenuPage() {
  const { slug, section } = useParams<{ slug: string, section: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const { addToCart } = useCart(slug || null);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  // Customization Modal State
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadMenu() {
      if (!section || !slug) return;

      const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
      if (!resData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setRestaurantId(resData.id);

      const { data: cats, error: catError } = await db.from('categories')
        .select('id,name,position,active,section')
        .eq('section', section)
        .eq('restaurant_id', resData.id)
        .eq('active', true)
        .order('position', { ascending: true })
        .order('id');

      if (catError || !cats) return;

      // Fetch product_extras for this restaurant
      const { data: extrasData } = await db.from('product_extras').select('id,name,category,price,available').eq('restaurant_id', resData.id).eq('available', true);
      if (extrasData) setExtras(extrasData);

      const menuData: Category[] = [];
      for (const cat of cats) {
        const { data: prods } = await db.from('products').select('id,name,description,price,price_unit,image_url,sort_order,active,category_id').eq('category_id', cat.id).eq('active', true).order('sort_order', { ascending: true }).order('id');
        if (prods && prods.length > 0) {
          menuData.push({
            ...cat,
            products: prods
          });
        }
      }
      setCategories(menuData);
      if (menuData.length > 0) {
        const savedCategory = sessionStorage.getItem(`category_${slug}_${section}`);
        if (savedCategory && menuData.some(c => c.id === savedCategory)) {
          setActiveCategory(savedCategory);
        } else {
          setActiveCategory(menuData[0].id);
        }
      }
      setLoading(false);
    }
    loadMenu();
  }, [section, slug]);

  // Handle saving scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${slug}_${section}`, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, section]);

  // Restore scroll position after category render
  useEffect(() => {
    if (loading) return; // Strict block while fetching

    const activeCatData = categories.find(c => c.id === activeCategory);

    // Strict Guard: Do not attempt to scroll until data is physically present in the array
    if (categories.length > 0 && activeCategory && activeCatData) {
      const savedScroll = sessionStorage.getItem(`scroll_${slug}_${section}`);

      if (savedScroll && savedScroll !== "0" && activeCatData.products.length > 0) {
        // Fallback to setTimeout for mobile, taking 100ms to ensure paints as requested by user
        setTimeout(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(savedScroll, 10));
          });
        }, 100);
      } else {
        // Force scroll to top if entering category freshly from Home (prevents router scroll bleed)
        window.scrollTo(0, 0);
      }
    }
  }, [loading, categories, activeCategory, slug, section]);

  const isVino = section === 'Vino e Drinks';

  if (notFound) {
    return <NotFound />;
  }

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

  return (
    <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#008081]" />
        </button>
        <h1 className="font-sans text-[1.35rem] font-black tracking-[0.2em] uppercase text-center flex-grow text-[#1A1A1A] dark:text-white leading-none mt-1">{section}</h1>
        <div className="w-10"></div>
      </header>

      {/* Visual Category Index */}
      <div className="px-4 py-4 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-3 sticky top-[72px] z-40 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 shadow-sm">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              sessionStorage.setItem(`category_${slug}_${section}`, cat.id);
              const element = document.getElementById(`category-${cat.id}`);
              if (element) {
                // Adjust for sticky headers
                const yOffset = -140;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className={clsx(
              "flex flex-col items-center justify-center min-w-[100px] h-[72px] rounded-2xl transition-all duration-300 border",
              activeCategory === cat.id
                ? "bg-gradient-to-br from-[#008081] to-teal-600 text-white shadow-md shadow-[#008081]/30 border-transparent transform scale-105"
                : "bg-white dark:bg-[#252525] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-[#008081] hover:shadow-sm"
            )}
          >
            <span className="text-xs font-bold tracking-wider uppercase text-center w-full truncate px-2">{cat.name}</span>
            <span className={clsx("w-6 h-1 mt-2 rounded-full", activeCategory === cat.id ? "bg-white/50" : "bg-gray-200 dark:bg-gray-700")} />
          </button>
        ))}
      </div>

      {/* Continuous Rendered Products */}
      <main className="flex-grow px-4 pb-24 pt-4 space-y-12">
        {categories.map((category) => (
          <div key={category.id} id={`category-${category.id}`} className="scroll-mt-36">
            <h2 className="text-2xl font-black font-sans text-[#1A1A1A] dark:text-[#FDFCF0] mb-6 tracking-tight flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#008081] rounded-full"></span>
              {category.name}
            </h2>
            <div className="space-y-6">
              {category.products.map(product => (
                isVino ? (
                  <button onClick={() => setSelectedProduct(product)} key={product.id} className="w-full text-left group relative bg-[#FBFBFB] dark:bg-[#252525] rounded-3xl p-4 shadow-premium hover:shadow-lg border border-gray-200 dark:border-white/5 flex gap-4 transition-all duration-300 transform hover:-translate-y-1 dark:hover:bg-[#2A2A2A] block">
                    <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-black/40 flex items-center justify-center">
                      <img alt={product.name} className="h-full object-contain object-center mix-blend-normal group-hover:scale-110 transition-transform duration-500" src={product.image_url} loading="lazy" decoding="async" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-sans text-xl font-bold text-[#1A1A1A] dark:text-white leading-tight">{product.name}</h3>
                          <span className="text-[#008081] font-bold font-sans text-lg">{product.price.toFixed(2)}€</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-3 justify-between">
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                            <Droplets className="w-3 h-3 text-[#008081]" />
                            14.5°
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                            <Wine className="w-3 h-3 text-[#008081]" />
                            750mL
                          </div>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className={clsx(
                            "rounded-full shadow-md transition-all duration-300 flex items-center justify-center w-8 h-8 focus:outline-none",
                            addedItems[product.id] ? "bg-green-500 text-white scale-110 shadow-green-500/30" : "bg-gradient-to-tr from-[#008081] to-teal-400 text-white hover:shadow-lg hover:shadow-[#008081]/30 active:scale-95 border-none"
                          )}
                        >
                          {addedItems[product.id] ? <span className="text-sm font-bold">✓</span> : <Plus className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedProduct(product)}
                    key={product.id}
                    className="w-full text-left group bg-[#FBFBFB] dark:bg-[#262626] rounded-3xl overflow-hidden shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:shadow-none border border-gray-200 dark:border-gray-800 relative flex flex-col"
                  >
                    <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
                      <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                        <span className="text-white font-bold tracking-wide">{product.price.toFixed(2)}€{product.price_unit || ''}</span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                          <h2 className="text-[1.15rem] font-sans font-bold text-[#1A1A1A] dark:text-white leading-tight mb-1">{product.name}</h2>
                          {product.description && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-snug line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className={clsx(
                            "rounded-full shadow-md transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0 focus:outline-none",
                            addedItems[product.id] ? "bg-green-500 text-white scale-110 shadow-green-500/30" : "bg-gradient-to-tr from-[#008081] to-teal-400 text-white hover:shadow-lg hover:shadow-[#008081]/30 active:scale-95 border-none cursor-pointer"
                          )}
                        >
                          {addedItems[product.id] ? <span className="text-xl font-bold">✓</span> : <Plus className="w-6 h-6" />}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* 🚀 Viral B2B Growth Footer */}
      <div className="pb-36 pt-8 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
        <Link to="/" target="_blank" className="flex flex-col items-center gap-1 group">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#008081] transition-colors">Powered by</span>
          <div className="flex items-center gap-1.5 mb-1">
             <div className="bg-[#008081] text-white p-0.5 rounded-md shadow-sm"><Zap className="w-3 h-3 fill-white" /></div>
             <span className="font-extrabold text-lg tracking-tighter text-gray-800 dark:text-gray-200 group-hover:text-[#008081] transition-colors">Leomenu</span>
          </div>
          <span className="text-[10px] font-black text-gray-500 bg-gray-200 dark:bg-gray-800 px-4 py-1.5 rounded-full group-hover:bg-teal-50 group-hover:text-[#008081] transition-colors border border-transparent group-hover:border-teal-100">Crea il tuo menù gratis</span>
        </Link>
      </div>

      <BottomNav />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          extras={extras.filter(e => {
            const productCategory = categories.find(c => c.products.some(p => p.id === selectedProduct.id));
            const catName = productCategory ? productCategory.name.toLowerCase().trim() : '';
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


