import React, { useEffect, useState } from 'react';
import { ChevronRight, Sparkles, ArrowLeft, MapPin, Instagram, Phone, Facebook } from 'lucide-react';
import FidelityCard from '../components/menu/FidelityCard';
import { Link, useParams, useNavigate } from 'react-router-dom';
import db from '../db';
import BottomNav from '../components/BottomNav';
import NotFound from '../components/NotFound';

const FadeImage = ({ src, alt }: { src: string; alt: string }) => {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (src !== displaySrc) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setFade(true);
        setTimeout(() => { setDisplaySrc(src); setFade(false); }, 300);
      };
    }
  }, [src, displaySrc]);

  return (
    <img
      src={displaySrc.startsWith('http') || displaySrc.startsWith('/') || displaySrc.startsWith('data:') ? displaySrc : `/${displaySrc}`}
      alt={alt}
      className={`w-full h-full object-cover transition-all duration-500 ${fade ? 'opacity-0' : 'opacity-70 group-hover:opacity-60 group-hover:scale-105'}`}
    />
  );
};

export default function RestaurantHome() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [images, setImages] = useState<Record<string, string>>({ logo_url: '' });
  const [logoBgColor, setLogoBgColor] = useState<string>('white');

  useEffect(() => {
    async function fetchSettings() {
      if (!slug) return navigate('/trova');
      try {
        const { data: resData, error: resError } = await db.from('restaurants').select('id, name').eq('slug', slug).single();
        if (resError || !resData) { setNotFound(true); return; }
        setRestaurant(resData);

        const [{ data: settingsData }, { data: catsData }] = await Promise.all([
          db.from('settings').select('key,value').eq('restaurant_id', resData.id),
          db.from('categories').select('section').eq('restaurant_id', resData.id).order('position', { ascending: true }).order('id'),
        ]);

        if (settingsData) {
          const obj = settingsData.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc; }, {});
          setImages(prev => ({ ...prev, ...obj }));
        }
        if (catsData) {
          setSections(Array.from(new Set(catsData.map((c: any) => c.section))) as string[]);
        }
      } catch (err) {
        console.error('RestaurantHome loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [slug, navigate]);

  useEffect(() => {
    if (slug === 'pietra-viva' || !images.logo_url) { setLogoBgColor('white'); return; }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, 1, 1).data;
          setLogoBgColor(data[3] === 0 ? 'white' : `rgba(${data[0]},${data[1]},${data[2]},${data[3] / 255})`);
        } catch { setLogoBgColor('white'); }
      }
    };
    img.src = images.logo_url;
  }, [images.logo_url, slug]);

  if (loading) {
    return (
      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#008081] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (notFound) return <NotFound />;

  const brandColor = images.brand_color || images.theme_color || '#008081';

  const visibleSections = sections.filter(section => {
    const key = `visibility_${section.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    return images[key] !== 'false';
  });

  const showMenuDelGiorno = images.visibility_menu !== 'false' && images.menu_del_giorno_enabled !== 'false';

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#111] font-sans min-h-screen antialiased" style={{ '--brand': brandColor } as React.CSSProperties}>

      {/* ── Cover ── full width, responsive height */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden" style={{ backgroundColor: `${brandColor}22` }}>
        {images.cover_image_url && (
          <img src={images.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        {slug === 'demo' && (
          <Link to="/trova" className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-sm font-bold rounded-full hover:bg-black/70 transition-all">
            <ArrowLeft className="w-4 h-4" /> Torna
          </Link>
        )}
      </div>

      {/* ── Page content — centered, max-width responsive ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">

        {/* Desktop layout: 2 col. Mobile/tablet: stacked */}
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 lg:items-start">

          {/* ══ LEFT PANEL — profile info ══ */}
          <div className="lg:sticky lg:top-6">

            {/* Logo — overlaps cover, centered on mobile/tablet, left on desktop */}
            <div className="flex flex-col items-center lg:items-center -mt-14 lg:-mt-16 mb-5">
              <div
                className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl shadow-xl border-4 border-white dark:border-[#111] flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: slug === 'demo' ? '#fff' : logoBgColor }}
              >
                {slug === 'demo' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#008081" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
                ) : images.logo_url ? (
                  <img src={images.logo_url} alt={restaurant?.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="font-black text-lg text-[#008081] text-center px-2 leading-tight">{restaurant?.name}</span>
                )}
              </div>

              {/* Name — always below logo, centered */}
              <div className="text-center mt-3">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tight leading-tight">
                  {slug === 'demo' ? 'Leomenu' : restaurant?.name}
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {images.restaurant_subtitle || 'Menu Digitale'}
                </p>
              </div>
            </div>

            {/* Social icons */}
            {(images.phone_number || images.instagram_url || images.facebook_url || images.tiktok_url || images.google_maps_url || images.tripadvisor_url) && (
              <div className="flex flex-row items-center justify-center gap-2 mb-5 flex-wrap">
                {images.phone_number && (
                  <a href={`tel:${images.phone_number.replace(/\s+/g, '')}`} className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {images.instagram_url && (
                  <a href={images.instagram_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {images.facebook_url && (
                  <a href={images.facebook_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {images.tiktok_url && (
                  <a href={images.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.27-1.15 4.14-2.78 5.44-1.61 1.28-3.75 1.83-5.78 1.55-2.58-.33-4.78-1.92-5.75-4.32-.82-1.92-.81-4.08.06-5.96.96-2.18 3.16-3.74 5.51-4.03.22-.03.44-.04.66-.05v4.04c-1.4.15-2.61 1.05-3.07 2.37-.41 1.14-.38 2.45.17 3.53.62 1.26 1.95 2.15 3.36 2.19 1.48.06 2.87-.79 3.53-2.14.39-.77.42-1.65.42-2.5V.02h-4.39z" /></svg>
                  </a>
                )}
                {images.google_maps_url && (
                  <a href={images.google_maps_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {images.tripadvisor_url && (
                  <a href={images.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4zm-4.2 6.6a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zm8.4 0a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zm-4.2-1.8c-2.04 0-3.9.648-5.412 1.74A5.388 5.388 0 014.8 9.6h-.6c.468-.612 1.02-1.152 1.644-1.608C7.5 6.78 9.648 6 12 6s4.5.78 6.156 1.992c.624.456 1.176.996 1.644 1.608h-.6a5.388 5.388 0 01-1.788-.66C15.9 7.848 14.04 7.2 12 7.2zm0 9.6c-1.632 0-3.108-.648-4.188-1.692l1.14-1.14A4.166 4.166 0 0012 14.4c1.128 0 2.148.444 2.904 1.164l1.284 1.284A5.953 5.953 0 0112 18z"/></svg>
                  </a>
                )}
              </div>
            )}

            {/* Fidelity card */}
            {restaurant && slug !== 'demo' && (
              <div className="mb-2">
                <FidelityCard restaurantId={restaurant.id} restaurantName={restaurant.name} />
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL — section cards ══ */}
          <div className="mt-6 lg:mt-0 lg:pt-4">
            {/* Section label on desktop */}
            <p className="hidden lg:block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Menu</p>

            {/* Cards grid: 1 col mobile, 2 col sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

              {visibleSections.map(section => {
                const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
                const imageUrl = images[`home_image_${sectionSlug}`] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';
                return (
                  <Link
                    key={section}
                    to={`/${slug}/menu/${section}`}
                    className="group relative block w-full h-36 sm:h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gray-900">
                      <FadeImage alt={section} src={imageUrl} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                    <div className="relative h-full flex items-end justify-between p-4 sm:p-5">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-[0.15em] uppercase drop-shadow-md leading-tight">
                        {section}
                      </h3>
                      <div
                        className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {showMenuDelGiorno && (
                <Link
                  to={`/${slug}/menu-del-giorno`}
                  className="group relative block w-full h-36 sm:h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2"
                >
                  <div className="absolute inset-0 bg-gray-900">
                    <FadeImage alt="Menu del Giorno" src={images.home_image_menu || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="relative h-full flex items-end justify-between p-4 sm:p-5">
                    <div>
                      <p className="text-[10px] font-black text-teal-300 uppercase tracking-widest mb-1">Specialità</p>
                      <h3 className="text-xl font-black text-white tracking-[0.1em] uppercase drop-shadow-md">Menu Del Giorno</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-teal-400 w-4 h-4 animate-pulse" />
                      <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
