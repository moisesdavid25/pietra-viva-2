import { ChevronRight, Sparkles, ArrowLeft, MapPin, Instagram, Phone, Facebook } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import db from '../db';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import NotFound from '../components/NotFound';

const FadeImage = ({ src, alt }: { src: string, alt: string }) => {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (src !== displaySrc) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setFade(true);
        setTimeout(() => {
          setDisplaySrc(src);
          setFade(false);
        }, 300);
      };
    }
  }, [src, displaySrc]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`w-full h-full object-cover transition-all duration-500 hover:duration-500 ${fade ? 'opacity-0' : 'opacity-60 group-hover:opacity-50 group-hover:scale-105'
        }`}
    />
  );
};

export default function Home() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [restaurant, setRestaurant] = useState<{ id: string, name: string } | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [images, setImages] = useState<Record<string, string>>({
    logo_url: ''
  });
  const [logoBgColor, setLogoBgColor] = useState<string>('white');

  useEffect(() => {
    async function fetchSettings() {
      if (!slug) return navigate('/');

      try {
        const { data: resData, error: resError } = await db.from('restaurants').select('id, name').eq('slug', slug).single();
        if (resError || !resData) {
          setNotFound(true);
          return;
        }
        setRestaurant(resData);

        const [{ data: settingsData }, { data: catsData }] = await Promise.all([
          db.from('settings').select('*').eq('restaurant_id', resData.id),
          db.from('categories').select('section').eq('restaurant_id', resData.id).order('position', { ascending: true }).order('id')
        ]);

        if (settingsData) {
          const settingsObj = settingsData.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {});
          setImages(prev => ({ ...prev, ...settingsObj }));
        }

        if (catsData) {
          const uniqueSections = Array.from(new Set(catsData.map(c => c.section)));
          setSections(uniqueSections);
        }
      } catch (err) {
        console.error("Home loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [slug, navigate]);

  // Extract edge color from logo for dynamic background blending
  useEffect(() => {
    const src = slug === 'pietra-viva' ? '/logo-pietraviva.png' : images.logo_url;
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          // sample the top-left pixel
          const data = ctx.getImageData(0, 0, 1, 1).data;
          if (data[3] === 0) {
            // If transparent, fallback to white
            setLogoBgColor('white');
          } else {
            setLogoBgColor(`rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`);
          }
        } catch (e) {
          console.warn("Could not extract logo edge color due to CORS");
          setLogoBgColor('white');
        }
      }
    };
    img.src = src;
  }, [images.logo_url, slug]);

  if (loading) {
    return (
      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-sans font-bold animate-pulse tracking-wide uppercase text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
      {/* Dynamic Cover Header */}
      <div className="relative w-full h-48 sm:h-56 bg-[#008080]/10 dark:bg-[#008080]/20 overflow-hidden">
        {images.cover_image_url && (
          <img src={images.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {slug === 'demo' && (
          <Link to="/" className="absolute top-6 left-5 px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition flex items-center gap-1 font-bold z-10 text-sm shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Torna
          </Link>
        )}
      </div>

      <main className="flex-1 px-5 pb-24 relative -mt-14 z-10 overflow-y-auto no-scrollbar">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* App-Icon Style Logo - Profile Picture Overlap */}
          <div
            className="w-28 h-28 rounded-full shadow-lg border-4 border-white dark:bg-[#1A1A1A] dark:border-[#1A1A1A] bg-white flex items-center justify-center mb-4 overflow-hidden"
            style={{ backgroundColor: slug === 'demo' ? '#FFFFFF' : logoBgColor }}
          >
            {slug === 'pietra-viva' ? (
              <img src="/logo-pietraviva.png" alt="Pietra Viva" className="w-full h-full object-contain rounded-full" />
            ) : slug === 'demo' ? (
              <div className="w-full h-full bg-[#FFFFFF] flex items-center justify-center rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#008080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
              </div>
            ) : images.logo_url ? (
              <img src={images.logo_url} alt={restaurant?.name} className="w-full h-full object-contain rounded-full" />
            ) : (
              <div className="w-full h-full bg-[#008080]/10 rounded-full flex items-center justify-center font-sans text-xl font-black text-[#008080] p-2 text-center leading-tight">
                {restaurant?.name}
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl leading-none font-sans font-black text-[#1A1A1A] dark:text-[#FDFCF0] tracking-tight">{slug === 'demo' ? 'Leomenu' : restaurant?.name}</h1>
          <h2 className="text-sm font-sans font-semibold text-gray-500 dark:text-gray-400 mt-2 tracking-wide uppercase">
            {images.restaurant_subtitle || 'Menu Digitale'}
          </h2>

          {/* Premium Social Block - Scalable Icon-Only Row */}
          <div className="flex flex-row items-center justify-center gap-4 mt-4">
            {images.phone_number && (
              <a href={`tel:${images.phone_number.replace(/\s+/g, '')}`} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#008080] text-[#008080] transition-all duration-300">
                <Phone className="w-5 h-5" />
              </a>
            )}
            {images.instagram_url && (
              <a href={images.instagram_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#008080] text-[#008080] transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {images.facebook_url && (
              <a href={images.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#008080] text-[#008080] transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {images.tiktok_url && (
              <a href={images.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#008080] text-[#008080] transition-all duration-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.27-1.15 4.14-2.78 5.44-1.61 1.28-3.75 1.83-5.78 1.55-2.58-.33-4.78-1.92-5.75-4.32-.82-1.92-.81-4.08.06-5.96.96-2.18 3.16-3.74 5.51-4.03.22-.03.44-.04.66-.05v4.04c-1.4.15-2.61 1.05-3.07 2.37-.41 1.14-.38 2.45.17 3.53.62 1.26 1.95 2.15 3.36 2.19 1.48.06 2.87-.79 3.53-2.14.39-.77.42-1.65.42-2.5V.02h-4.39z" />
                </svg>
              </a>
            )}
            {images.google_maps_url && (
              <a href={images.google_maps_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#008080] text-[#008080] transition-all duration-300">
                <MapPin className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {sections.filter(section => {
            const visibilityKey = `visibility_${section.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
            return images[visibilityKey] !== 'false';
          }).map(section => {
            const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
            const imageUrl = images[`home_image_${sectionSlug}`] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';
            return (
              <Link key={section} to={`/${slug}/menu/${section}`} className="group relative block w-full h-40 rounded-3xl overflow-hidden shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gray-900">
                  <FadeImage alt={section} src={imageUrl} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                <div className="relative h-full flex items-end justify-between p-6">
                  <h3 className="text-2xl font-extrabold text-white tracking-[0.2em] uppercase font-sans drop-shadow-md">
                    {section} {section === 'Dessert' && '🍰'}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#008080] group-hover:to-teal-500 transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>
              </Link>
            );
          })}

          {images.visibility_menu !== 'false' && (
            <Link to={`/${slug}/menu-del-giorno`} className="group relative block w-full h-40 rounded-3xl overflow-hidden shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gray-900">
                <FadeImage alt="Menu" src={images.home_image_menu || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              <div className="relative h-full flex items-end justify-between p-6">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase font-sans drop-shadow-md">Menu Del Giorno</h3>
                  <span className="text-[0.8rem] text-white/90 mt-1 font-sans font-bold uppercase tracking-wider drop-shadow-sm">Specialità dello Chef</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#008080] group-hover:to-teal-500 transition-colors duration-300 shadow-md">
                  <ChevronRight className="w-4 h-4 text-white drop-shadow-md" />
                </div>
                <Sparkles className="absolute bottom-6 right-16 text-teal-400 w-5 h-5 animate-pulse drop-shadow-[0_0_8px_rgba(0,128,128,0.8)]" />
              </div>
            </Link>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
