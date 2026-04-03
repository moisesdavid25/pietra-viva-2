import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import db from '../db';
import BottomNav from '../components/BottomNav';
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

export default function MenuDelGiorno() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuCombo[]>([]);
  const [notFound, setNotFound] = useState(false);
  const { addToCart } = useCart(slug || null);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function loadMenus() {
      if (!slug) return;
      const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
      if (!resData) {
        setNotFound(true);
        return;
      }

      const { data, error } = await db.from('menus').select('id, type, price, entree, primo, secondo, contorno, desert, bevande').eq('restaurant_id', resData.id).order('id');
      if (!error && data) {
        setMenus(data);
      }
    }
    loadMenus();
  }, [slug]);

  if (notFound) {
    return <NotFound />;
  }

  const handleAddToCart = (e: React.MouseEvent, menu: MenuCombo) => {
    e.preventDefault();
    addToCart({
      id: `menu-${menu.id}`,
      name: `Menù ${menu.type}`,
      price: menu.price,
      price_unit: null,
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400' // Generic placeholder for daily menu
    });
    setAddedItems(prev => ({ ...prev, [`menu-${menu.id}`]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [`menu-${menu.id}`]: false }));
    }, 1500);
  };

  return (
    <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#008081]" />
        </button>
        <h1 className="font-sans text-[1.35rem] font-extrabold tracking-[0.2em] uppercase text-center flex-grow text-[#1A1A1A] dark:text-white leading-none mt-1">Menu Del Giorno</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow px-4 py-6 pb-24 space-y-8">
        {menus.map(menu => (
          <div key={menu.id} className="bg-[#FBFBFB] dark:bg-[#262626] rounded-3xl overflow-hidden shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-transparent dark:border-gray-800 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#008081] to-teal-400"></div>
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold text-[#008081] uppercase tracking-widest mb-2">MENÙ</h2>
              <h3 className="text-xl font-sans text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-8">{menu.type}</h3>

              <div className="space-y-6">
                {menu.entree && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Entrée</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.entree}</p>
                  </div>
                )}

                {menu.primo && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Primo / Main Course</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.primo}</p>
                  </div>
                )}

                {menu.secondo && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Secondo / Second Course</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.secondo}</p>
                  </div>
                )}

                {menu.contorno && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Contorni / Side Dish</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.contorno}</p>
                  </div>
                )}

                {menu.desert && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Desert</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.desert}</p>
                  </div>
                )}

                {menu.bevande && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1">Bevande</h4>
                    <p className="font-sans text-lg italic text-[#1A1A1A] dark:text-gray-200">{menu.bevande}</p>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-5xl font-bold text-[#008081]">€{menu.price.toFixed(2)}</span>
                <button
                  onClick={(e) => handleAddToCart(e, menu)}
                  className={clsx(
                    "rounded-full shadow-md transition-all duration-300 flex items-center justify-center w-14 h-14 focus:outline-none",
                    addedItems[`menu-${menu.id}`] ? "bg-green-500 text-white scale-110 shadow-green-500/30" : "bg-gradient-to-tr from-[#008081] to-teal-500 text-white hover:shadow-lg hover:shadow-[#008081]/30 active:scale-95 border-none"
                  )}
                >
                  {addedItems[`menu-${menu.id}`] ? <span className="text-3xl font-bold">✓</span> : <Plus className="w-8 h-8" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}



