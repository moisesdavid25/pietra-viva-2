import { ArrowLeft, Plus, Droplets, Wine, Zap, ShieldAlert, X } from 'lucide-react';
import { ALLERGENS } from '../components/gestione/AllergensManager';
import { Link, useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  allergens?: string[];
}

interface Category {
  id: string;
  section: string;
  name: string;
  products: Product[];
}

interface SectionData {
  name: string;
  categories: Category[];
}

export default function MenuPage() {
  const { slug, section: sectionParam } = useParams<{ slug: string; section: string }>();
  const navigate = useNavigate();

  const [allData, setAllData] = useState<SectionData[]>([]);
  const [orderedSections, setOrderedSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>(sectionParam || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuDelGiornoEnabled, setMenuDelGiornoEnabled] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart(slug || null);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allergenFilter, setAllergenFilter] = useState<string[]>([]);
  const [showAllergenPanel, setShowAllergenPanel] = useState(false);

  const sectionTabsRef = useRef<HTMLDivElement>(null);
  const catTabsRef = useRef<HTMLDivElement>(null);

  // ── Load ALL data once ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      if (!slug) return;
      const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
      if (!resData) { setNotFound(true); setLoading(false); return; }

      const [{ data: settingsData }, { data: allCats }, { data: extrasData }] = await Promise.all([
        db.from('settings').select('key,value').eq('restaurant_id', resData.id),
        db.from('categories')
          .select('id,name,position,active,section')
          .eq('restaurant_id', resData.id).eq('active', true)
          .order('position', { ascending: true }).order('id'),
        db.from('product_extras').select('id,name,category,price,available').eq('restaurant_id', resData.id).eq('available', true),
      ]);

      if (extrasData) setExtras(extrasData);

      const settings: Record<string, string> = {};
      if (settingsData) settingsData.forEach((s: any) => { settings[s.key] = s.value; });

      const mdgEnabled = settings.visibility_menu !== 'false' && settings.menu_del_giorno_enabled !== 'false';
      setMenuDelGiornoEnabled(mdgEnabled);

      if (!allCats || allCats.length === 0) { setLoading(false); return; }

      // Build ordered section list (preserving DB order, filtered by visibility)
      const seen = new Set<string>();
      const sectionOrder: string[] = [];
      for (const c of allCats) {
        if (!seen.has(c.section)) {
          seen.add(c.section);
          const key = `visibility_${c.section.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
          if (settings[key] !== 'false') sectionOrder.push(c.section);
        }
      }
      setOrderedSections(sectionOrder);

      // Load products for all categories in parallel
      const catIds = allCats.map((c: any) => c.id);
      const { data: allProds } = await db.from('products')
        .select('id,name,description,price,price_unit,image_url,sort_order,active,category_id,allergens')
        .in('category_id', catIds).eq('active', true)
        .order('sort_order', { ascending: true }).order('id');

      const prodsByCat: Record<string, Product[]> = {};
      if (allProds) {
        for (const p of allProds) {
          if (!prodsByCat[p.category_id]) prodsByCat[p.category_id] = [];
          prodsByCat[p.category_id].push(p);
        }
      }

      // Build section → categories → products tree
      const sectionMap: Record<string, Category[]> = {};
      for (const cat of allCats) {
        const prods = prodsByCat[cat.id] || [];
        if (prods.length === 0) continue; // skip empty categories
        if (!sectionMap[cat.section]) sectionMap[cat.section] = [];
        sectionMap[cat.section].push({ ...cat, products: prods });
      }

      const data: SectionData[] = sectionOrder
        .filter(s => sectionMap[s] && sectionMap[s].length > 0)
        .map(s => ({ name: s, categories: sectionMap[s] }));

      setAllData(data);

      // Set initial active section
      const initial = sectionParam && data.find(d => d.name === sectionParam)
        ? sectionParam
        : data[0]?.name || '';
      setActiveSection(initial);

      const initSection = data.find(d => d.name === initial);
      if (initSection && initSection.categories.length > 0) {
        setActiveCategory(initSection.categories[0].id);
      }

      setLoading(false);
    }
    loadAll();
  }, [slug, sectionParam]);

  // ── Reset active category when section changes ──────────────────────────
  const switchSection = useCallback((name: string) => {
    setActiveSection(name);
    const sec = allData.find(d => d.name === name);
    if (sec && sec.categories.length > 0) {
      setActiveCategory(sec.categories[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Scroll section pill into view
    setTimeout(() => {
      const btn = sectionTabsRef.current?.querySelector(`[data-section="${name}"]`) as HTMLElement | null;
      btn?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, [allData]);

  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 170;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // Scroll cat pill into view
    setTimeout(() => {
      const btn = catTabsRef.current?.querySelector(`[data-cat="${catId}"]`) as HTMLElement | null;
      btn?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, []);

  const handleAddToCart = (product: Product, customizations?: any) => {
    addToCart({ id: product.id, name: product.name, price: product.price, price_unit: product.price_unit, image_url: product.image_url, customizations });
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItems(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  if (notFound) return <NotFound />;

  const activeSectionData = allData.find(d => d.name === activeSection);
  const displayedCategories = activeSectionData?.categories || [];
  const isVino = activeSection === 'Vino e Drinks';

  // Total sections to display in row 1 (+ menu del giorno if enabled)
  const allSectionNames = [...orderedSections.filter(s => allData.some(d => d.name === s))];

  return (
    <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(`/${slug}`)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#008081]" />
          </button>

          {/* Section name — centered, updates with active section */}
          <h1 className="font-black text-base tracking-[0.15em] uppercase text-center flex-grow text-[#1A1A1A] dark:text-white leading-none truncate">
            {loading ? '' : activeSection}
          </h1>

          <button
            onClick={() => setShowAllergenPanel(p => !p)}
            className={clsx(
              'relative p-2 rounded-full transition-colors flex-shrink-0',
              allergenFilter.length > 0
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
            )}
            title="Filtra per allergeni"
          >
            <ShieldAlert className="w-5 h-5" />
            {allergenFilter.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {allergenFilter.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══ ROW 1 — Macro-sezioni (sections) ════════════════════════════════ */}
      <div className="sticky top-14 z-40 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div
            ref={sectionTabsRef}
            className="px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-20 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                ))
              : <>
                  {allSectionNames.map(sec => (
                    <button
                      key={sec}
                      data-section={sec}
                      onClick={() => switchSection(sec)}
                      className={clsx(
                        'flex-shrink-0 px-4 h-9 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap border',
                        activeSection === sec
                          ? 'bg-[#008081] text-white border-transparent shadow-md shadow-[#008081]/25'
                          : 'bg-white dark:bg-[#252525] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#008081] hover:text-[#008081]'
                      )}
                    >
                      {sec}
                    </button>
                  ))}
                  {menuDelGiornoEnabled && (
                    <button
                      onClick={() => navigate(`/${slug}/menu-del-giorno`)}
                      className="flex-shrink-0 px-4 h-9 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap border bg-white dark:bg-[#252525] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:text-teal-600"
                    >
                      ✦ Menu del Giorno
                    </button>
                  )}
                </>
            }
          </div>
        </div>
      </div>

      {/* ══ ROW 2 — Sub-categorie ════════════════════════════════════════════ */}
      <div className="sticky top-[calc(3.5rem+3rem)] z-30 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/60">
        <div className="max-w-5xl mx-auto">
          <div
            ref={catTabsRef}
            className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                ))
              : displayedCategories.map(cat => (
                  <button
                    key={cat.id}
                    data-cat={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={clsx(
                      'flex-shrink-0 px-3.5 h-8 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-200 whitespace-nowrap border',
                      activeCategory === cat.id
                        ? 'bg-[#008081]/10 text-[#008081] border-[#008081]/40 dark:bg-[#008081]/20 dark:border-[#008081]/50'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    {cat.name}
                  </button>
                ))
            }
          </div>
        </div>
      </div>

      {/* ══ ALLERGEN PANEL ══════════════════════════════════════════════════ */}
      {showAllergenPanel && (
        <div className="bg-white dark:bg-[#1A1A1A] border-b border-amber-200 dark:border-amber-800 shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                Seleziona allergeni da evitare
              </p>
              {allergenFilter.length > 0 && (
                <button
                  onClick={() => setAllergenFilter([])}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Rimuovi filtri
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
              {ALLERGENS.map(a => {
                const active = allergenFilter.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setAllergenFilter(prev => active ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                    className={clsx(
                      'flex flex-col items-center gap-0.5 p-1.5 rounded-xl border-2 transition-all',
                      active
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#262626]'
                    )}
                    title={a.label}
                  >
                    <span className="text-base">{a.emoji}</span>
                    <span className={clsx('text-[7px] font-bold text-center leading-none', active ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400')}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {allergenFilter.length > 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-2 text-center">
                I piatti con questi allergeni appaiono attenuati
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══ PRODUCTS ════════════════════════════════════════════════════════ */}
      <main className="flex-grow pb-28 pt-6">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse h-64" />
              ))}
            </div>
          ) : displayedCategories.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-bold">Nessun prodotto disponibile</p>
            </div>
          ) : (
            displayedCategories.map(category => (
              <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-44">
                {/* Category heading */}
                <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-[#FDFCF0] mb-5 tracking-tight flex items-center gap-3">
                  <span className="w-6 h-[2px] bg-[#008081] rounded-full flex-shrink-0" />
                  {category.name}
                </h2>

                {/* Product grid */}
                <div className={clsx(
                  'grid gap-4',
                  isVino
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                )}>
                  {category.products.map(product => {
                    const prodAllergens = product.allergens ?? [];
                    const hasConflict = allergenFilter.length > 0 && allergenFilter.some(a => prodAllergens.includes(a));

                    return isVino ? (
                      /* ── Vino card — horizontal ── */
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={clsx(
                          'w-full text-left group relative bg-white dark:bg-[#252525] rounded-3xl p-4 shadow-sm hover:shadow-lg border border-gray-200 dark:border-white/5 flex gap-4 transition-all duration-300 hover:-translate-y-1',
                          hasConflict && 'opacity-40'
                        )}
                      >
                        <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-black/40 flex items-center justify-center">
                          <img alt={product.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-500" src={product.image_url} loading="lazy" decoding="async" />
                        </div>
                        <div className="flex-grow flex flex-col justify-between py-1 min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white leading-tight truncate">{product.name}</h3>
                              <span className="text-[#008081] font-bold text-base flex-shrink-0">{product.price.toFixed(2)}€</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5">{product.description}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-3 justify-between">
                            <div className="flex gap-1.5">
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                                <Droplets className="w-3 h-3 text-[#008081]" /> 14.5°
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                                <Wine className="w-3 h-3 text-[#008081]" /> 750mL
                              </div>
                            </div>
                            <div
                              onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                              className={clsx(
                                'rounded-full shadow-md transition-all duration-300 flex items-center justify-center w-8 h-8 flex-shrink-0',
                                addedItems[product.id]
                                  ? 'bg-green-500 text-white scale-110'
                                  : 'bg-gradient-to-tr from-[#008081] to-teal-400 text-white hover:shadow-lg active:scale-95'
                              )}
                            >
                              {addedItems[product.id] ? <span className="text-xs font-bold">✓</span> : <Plus className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      </button>

                    ) : (
                      /* ── Food card — vertical ── */
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={clsx(
                          'w-full text-left group bg-white dark:bg-[#262626] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 relative flex flex-col',
                          hasConflict && 'opacity-40'
                        )}
                      >
                        <div className="relative h-40 sm:h-44 w-full overflow-hidden flex-shrink-0">
                          <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image_url} loading="lazy" decoding="async" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                            <span className="text-white font-bold text-sm tracking-wide">
                              {product.price.toFixed(2)}€{product.price_unit || ''}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-grow min-w-0">
                              <h2 className="text-base font-bold text-[#1A1A1A] dark:text-white leading-tight mb-1 truncate">{product.name}</h2>
                              {product.description && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs leading-snug line-clamp-2">{product.description}</p>
                              )}
                              {prodAllergens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {ALLERGENS.filter(a => prodAllergens.includes(a.id)).map(a => (
                                    <span
                                      key={a.id}
                                      title={a.label}
                                      className={clsx(
                                        'text-[9px] px-1.5 py-0.5 rounded-md border font-bold',
                                        allergenFilter.includes(a.id)
                                          ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-400'
                                          : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-white/5 dark:border-white/10'
                                      )}
                                    >
                                      {a.emoji} {a.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div
                              onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                              className={clsx(
                                'rounded-full shadow-md transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0 cursor-pointer',
                                addedItems[product.id]
                                  ? 'bg-green-500 text-white scale-110'
                                  : 'bg-gradient-to-tr from-[#008081] to-teal-400 text-white hover:shadow-lg active:scale-95'
                              )}
                            >
                              {addedItems[product.id] ? <span className="text-lg font-bold">✓</span> : <Plus className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <div className="pb-36 pt-8 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
        <Link to="/" target="_blank" className="flex flex-col items-center gap-1 group">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#008081] transition-colors">Powered by</span>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="bg-[#008081] text-white p-0.5 rounded-md shadow-sm"><Zap className="w-3 h-3 fill-white" /></div>
            <span className="font-extrabold text-lg tracking-tighter text-gray-800 dark:text-gray-200 group-hover:text-[#008081] transition-colors">Leomenu</span>
          </div>
          <span className="text-[10px] font-black text-gray-500 bg-gray-200 dark:bg-gray-800 px-4 py-1.5 rounded-full group-hover:bg-teal-50 group-hover:text-[#008081] transition-colors border border-transparent group-hover:border-teal-100">
            Crea il tuo menù gratis
          </span>
        </Link>
      </div>

      <BottomNav />

      {/* ══ PRODUCT MODAL ══════════════════════════════════════════════════ */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          extras={extras.filter(e => {
            const productCategory = displayedCategories.find(c => c.products.some(p => p.id === selectedProduct.id));
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
