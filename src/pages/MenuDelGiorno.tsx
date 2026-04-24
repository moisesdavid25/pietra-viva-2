import { ArrowLeft, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import db from '../db';
import NotFound from '../components/NotFound';
import { useCart } from '../hooks/useCart';

interface MenuCombo {
  id: number;
  type: string;
  price: number;
  entree: string;
  primo: string;
  secondo: string;
  contorno: string;
  desert: string;
  bevande: string;
}

const COURSE_LABELS: { key: keyof MenuCombo; label: string }[] = [
  { key: 'entree',   label: 'Entrée' },
  { key: 'primo',    label: 'Primo' },
  { key: 'secondo',  label: 'Secondo' },
  { key: 'contorno', label: 'Contorni' },
  { key: 'desert',   label: 'Dessert' },
  { key: 'bevande',  label: 'Bevande' },
];

export default function MenuDelGiorno() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuCombo[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToCart, totalItems } = useCart(slug || null);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function loadMenus() {
      if (!slug) return;
      const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
      if (!resData) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await db
        .from('menus')
        .select('id,type,price,entree,primo,secondo,contorno,desert,bevande')
        .eq('restaurant_id', resData.id)
        .order('id');
      if (!error && data) setMenus(data);
      setLoading(false);
    }
    loadMenus();
  }, [slug]);

  if (notFound) return <NotFound />;

  const handleAddToCart = (e: React.MouseEvent, menu: MenuCombo) => {
    e.preventDefault();
    addToCart({
      id: `menu-${menu.id}`,
      name: `Menù ${menu.type}`,
      price: menu.price,
      price_unit: null,
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400',
    }, 1);
    setAddedItems(prev => ({ ...prev, [`menu-${menu.id}`]: true }));
    setTimeout(() => setAddedItems(prev => ({ ...prev, [`menu-${menu.id}`]: false })), 1800);
  };

  return (
    <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F] font-sans min-h-screen flex flex-col antialiased">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#008081]" />
          </button>
          <h1 className="font-black text-sm tracking-widest uppercase text-center flex-grow truncate text-[#1A1A1A] dark:text-white">
            Menu Del Giorno
          </h1>
          <button
            onClick={() => navigate(`/${slug}/ordini`)}
            className="relative p-2 rounded-full hover:bg-[#008081]/10 transition-colors text-[#008081] flex-shrink-0"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#008081] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-grow pb-10">
        <div className="max-w-5xl mx-auto px-4 pt-6">

          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-10 h-10 border-4 border-[#008081] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && menus.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400 dark:text-gray-500 font-bold text-sm uppercase tracking-widest">
                Nessun menu disponibile
              </p>
            </div>
          )}

          {/* Grid: 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {menus.map(menu => (
              <div
                key={menu.id}
                className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-50 dark:border-white/5 text-center">
                  <p className="text-[10px] font-black text-[#008081] uppercase tracking-[0.2em] mb-1">Menù</p>
                  <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white uppercase tracking-widest">
                    {menu.type}
                  </h2>
                </div>

                {/* Courses */}
                <div className="px-6 py-5 flex-grow space-y-4">
                  {COURSE_LABELS.map(({ key, label }) => {
                    const value = menu[key] as string;
                    if (!value) return null;
                    return (
                      <div key={key} className="flex gap-4">
                        <div className="w-1 rounded-full bg-[#008081]/20 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest mb-0.5">
                            {label}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                            {value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: price + CTA */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-50 dark:border-white/5">
                  <button
                    onClick={(e) => handleAddToCart(e, menu)}
                    className={`w-full py-4 font-black text-white text-base rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 active:scale-[0.98] ${
                      addedItems[`menu-${menu.id}`]
                        ? 'bg-green-500'
                        : 'bg-[#008081] hover:bg-[#006666]'
                    }`}
                  >
                    <span>{addedItems[`menu-${menu.id}`] ? '✓ Aggiunto!' : 'Aggiungi al carrello'}</span>
                    <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-black">
                      €{menu.price.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
