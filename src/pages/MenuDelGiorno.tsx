import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';

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
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuCombo[]>([]);

  useEffect(() => {
    fetch('/api/menus')
      .then(res => res.json())
      .then(data => setMenus(data));
  }, []);

  return (
    <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-[#FDFCF0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#008080]" />
        </button>
        <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">Menu Del Giorno</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow px-4 py-6 pb-24 space-y-8">
        {menus.map(menu => (
          <div key={menu.id} className="bg-white dark:bg-[#262626] rounded-3xl overflow-hidden shadow-xl border border-[#008080]/20 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#008080]"></div>
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold text-[#008080] uppercase tracking-widest mb-2">MENÙ</h2>
              <h3 className="text-xl font-serif text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-8">{menu.type}</h3>
              
              <div className="space-y-6">
                {menu.entree && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Entrée</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.entree}</p>
                  </div>
                )}
                
                {menu.primo && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Primo / Main Course</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.primo}</p>
                  </div>
                )}

                {menu.secondo && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Secondo / Second Course</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.secondo}</p>
                  </div>
                )}

                {menu.contorno && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Contorni / Side Dish</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.contorno}</p>
                  </div>
                )}

                {menu.desert && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Desert</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.desert}</p>
                  </div>
                )}

                {menu.bevande && (
                  <div>
                    <h4 className="text-sm font-bold text-[#008080] uppercase tracking-wider mb-1">Bevande</h4>
                    <p className="font-serif text-lg italic text-gray-800 dark:text-gray-200">{menu.bevande}</p>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
                <span className="text-5xl font-bold text-[#008080]">€{menu.price}</span>
              </div>
            </div>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
