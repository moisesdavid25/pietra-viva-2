import { ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [images, setImages] = useState({
    home_image_cucina: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=400&fit=crop',
    home_image_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop',
    home_image_vino: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=400&fit=crop',
    home_image_menu: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setImages(prev => ({ ...prev, ...data }));
      });
  }, []);

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] text-gray-800 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
      <main className="flex-1 px-5 pb-24 pt-10 overflow-y-auto no-scrollbar">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden shadow-xl shadow-black/10 border-4 border-white dark:border-[#262626]">
            <img src="/logo-pietraviva.png" alt="Pietra Viva" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-[#FDFCF0] tracking-tight">Pietra Viva</h1>
          <h2 className="text-sm font-serif italic text-gray-500 dark:text-gray-400 mt-2 tracking-wide">Restaurant & Pizza</h2>
        </div>
        <div className="space-y-4">
          <Link to="/menu/Cucina" className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gray-900">
              <img alt="Chefs cooking" className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" src={images.home_image_cucina} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full flex items-end justify-between p-6">
              <h3 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">Cucina</h3>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#008080] transition-colors duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </Link>

          <Link to="/menu/Pizza" className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gray-900">
              <img alt="Pizza" className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" src={images.home_image_pizza} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full flex items-end justify-between p-6">
              <h3 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">Pizza</h3>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#008080] transition-colors duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </Link>

          <Link to="/menu/Vino e Drinks" className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gray-900">
              <img alt="Wine" className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" src={images.home_image_vino} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full flex items-end justify-between p-6">
              <h3 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">Vino e Drinks</h3>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#008080] transition-colors duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </Link>

          <Link to="/menu-del-giorno" className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gray-900">
              <img alt="Menu" className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" src={images.home_image_menu} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full flex items-end justify-between p-6">
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">Menu Del Giorno</h3>
                <span className="text-xs text-white/80 mt-1 font-serif italic">Specialità dello Chef</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#008080] transition-colors duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
              <Sparkles className="absolute bottom-6 right-16 text-[#008080] w-5 h-5 animate-pulse" />
            </div>
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
