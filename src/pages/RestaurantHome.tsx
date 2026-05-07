import React, { useEffect, useState } from 'react';
import { ChevronRight, Sparkles, ArrowLeft, MapPin, Instagram, Phone, Facebook } from 'lucide-react';
import FidelityCard from '../components/menu/FidelityCard';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();

  // When a table QR is scanned, store the table in sessionStorage immediately
  // so it's available across all pages without relying on URL params
  useEffect(() => {
    const tavolo = searchParams.get('tavolo');
    if (!tavolo || !slug) return;
    const storageKey = `leomenu_tavolo_${slug}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing !== tavolo) {
      // Different table — reset the order history session
      localStorage.removeItem(`leomenu_session_${slug}`);
      sessionStorage.setItem(storageKey, tavolo);
    }
  }, [searchParams, slug]);
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

            {/* Social icons + fidelity */}
            {(images.phone_number || images.instagram_url || images.facebook_url || images.tiktok_url || images.google_maps_url || images.tripadvisor_url || (restaurant && slug !== 'demo')) && (
              <div className="flex flex-row items-center justify-center gap-2 mb-4 flex-wrap">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.465,9.866c-2.139,0-4.122-0.684-5.74-1.846v8.385c0,4.188-3.407,7.594-7.594,7.594c-1.618,0-3.119-0.51-4.352-1.376c-1.958-1.375-3.242-3.649-3.242-6.218c0-4.188,3.407-7.595,7.595-7.595c0.348,0,0.688,0.029,1.023,0.074v0.977v3.235c-0.324-0.101-0.666-0.16-1.023-0.16c-1.912,0-3.468,1.556-3.468,3.469c0,1.332,0.756,2.489,1.86,3.07c0.481,0.253,1.028,0.398,1.609,0.398c1.868,0,3.392-1.486,3.462-3.338L12.598,0h4.126c0,0.358,0.035,0.707,0.097,1.047c0.291,1.572,1.224,2.921,2.517,3.764c0.9,0.587,1.974,0.93,3.126,0.93V9.866z"/></svg>
                  </a>
                )}
                {images.google_maps_url && (
                  <a href={images.google_maps_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {images.tripadvisor_url && (
                  <a href={images.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1C] shadow-sm hover:border-[#008081] hover:text-[#008081] text-gray-500 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.038,8.783L24,6.649h-4.35c-2.178-1.488-4.808-2.354-7.652-2.354c-2.841,0-5.463,0.868-7.637,2.354H0l1.962,2.134c-1.202,1.097-1.956,2.677-1.956,4.432c0,3.311,2.684,5.995,5.995,5.995c1.573,0,3.006-0.607,4.076-1.598l1.922,2.092l1.922-2.091c1.07,0.992,2.501,1.596,4.074,1.596c3.311,0,5.999-2.684,5.999-5.995C23.995,11.459,23.241,9.879,22.038,8.783z M6.003,17.273c-2.241,0-4.057-1.816-4.057-4.057c0-2.241,1.816-4.058,4.057-4.058s4.057,1.816,4.057,4.058C10.06,15.456,8.244,17.273,6.003,17.273z M12,13.097c0-2.67-1.942-4.962-4.504-5.941c1.386-0.579,2.906-0.901,4.502-0.901c1.596,0,3.118,0.321,4.504,0.901C13.942,8.137,12,10.427,12,13.097z M17.995,17.273c-2.241,0-4.058-1.816-4.058-4.057c0-2.241,1.816-4.058,4.058-4.058s4.057,1.816,4.057,4.058C22.053,15.456,20.237,17.273,17.995,17.273z M17.995,11.086c-1.175,0-2.127,0.952-2.127,2.127c0,1.175,0.952,2.127,2.127,2.127c1.175,0,2.127-0.952,2.127-2.127C20.122,12.04,19.171,11.086,17.995,11.086z M8.13,13.215c0,1.175-0.952,2.127-2.127,2.127c-1.175,0-2.127-0.952-2.127-2.127c0-1.175,0.952-2.127,2.127-2.127C7.178,11.086,8.13,12.04,8.13,13.215z"/></svg>
                  </a>
                )}
                {restaurant && slug !== 'demo' && (
                  <FidelityCard restaurantId={restaurant.id} restaurantName={restaurant.name} />
                )}
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
