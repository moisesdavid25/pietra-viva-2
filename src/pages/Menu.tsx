import { ArrowLeft, Star, Plus, Droplets, Wine } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import db from '../db';
import BottomNav from '../components/BottomNav';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  image_url: string;
}

interface Category {
  id: number;
  section: string;
  name: string;
  products: Product[];
}

export default function MenuPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  useEffect(() => {
    async function loadMenu() {
      if (!section) return;
      const { data: cats, error: catError } = await db.from('categories').select('*').eq('section', section).order('id');
      if (catError || !cats) return;

      const menuData: Category[] = [];
      for (const cat of cats) {
        const { data: prods } = await db.from('products').select('*').eq('category_id', cat.id).order('sort_order', { ascending: true }).order('id');
        menuData.push({
          ...cat,
          products: prods || []
        });
      }
      setCategories(menuData);
      if (menuData.length > 0) {
        setActiveCategory(menuData[0].id);
      }
    }
    loadMenu();
  }, [section]);

  const isVino = section === 'Vino e Drinks';

  return (
    <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-[#FDFCF0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#008080]" />
        </button>
        <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">{section}</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-4 py-4 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(
              "inline-block px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition-colors",
              activeCategory === cat.id
                ? "bg-[#008080] text-white shadow-lg shadow-[#008080]/30"
                : "bg-gray-200 dark:bg-[#262626] text-gray-600 dark:text-gray-300 border border-transparent dark:border-gray-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <main className="flex-grow px-4 pb-24 space-y-6">
        {categories.find(c => c.id === activeCategory)?.products.map(product => (
          isVino ? (
            <Link to={`/product/${product.id}`} key={product.id} className="group relative bg-white dark:bg-[#252525] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex gap-4 transition-all hover:shadow-lg dark:hover:bg-[#2A2A2A] block">
              <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-black/40 flex items-center justify-center">
                <img alt={product.name} className="h-full object-contain object-center mix-blend-normal group-hover:scale-110 transition-transform duration-500" src={product.image_url} />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h3>
                    <span className="text-[#008080] font-bold font-serif text-lg">{product.price.toFixed(2)}€</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">{product.description}</p>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                    <Droplets className="w-3 h-3 text-[#008080]" />
                    14.5°
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-300">
                    <Wine className="w-3 h-3 text-[#008080]" />
                    750mL
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link to={`/product/${product.id}`} key={product.id} className="group bg-white dark:bg-[#262626] rounded-2xl overflow-hidden shadow-md dark:shadow-none border border-gray-100 dark:border-gray-800 relative transform transition hover:scale-[1.01] block">
              <div className="relative h-48 w-full overflow-hidden">
                <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                  <span className="text-white font-bold tracking-wide">{product.price.toFixed(2)}€{product.price_unit || ''}</span>
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">{product.name}</h2>
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            </Link>
          )
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
