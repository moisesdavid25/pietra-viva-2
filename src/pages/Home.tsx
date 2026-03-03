import { ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';
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
          db.from('categories').select('section').eq('restaurant_id', resData.id).order('id')
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
      <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-serif italic">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] text-gray-800 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
      <main className="flex-1 px-5 pb-24 pt-8 overflow-y-auto no-scrollbar relative">
        {slug === 'demo' && (
          <Link to="/" className="absolute top-8 left-5 text-[#008080] hover:text-teal-700 transition flex items-center gap-1 font-bold z-10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="mb-10 flex flex-col items-center text-center">
          {/* App-Icon Style Logo */}
          <div
            className="w-20 h-20 rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 flex items-center justify-center p-0.5 mb-5 overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: slug === 'demo' ? '#FDFCF0' : logoBgColor }}
          >
            {slug === 'pietra-viva' ? (
              <img src="/logo-pietraviva.png" alt="Pietra Viva" className="w-full h-full object-contain" />
            ) : slug === 'demo' ? (
              <div className="w-full h-full bg-[#FDFCF0] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#008080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
              </div>
            ) : images.logo_url ? (
              <img src={images.logo_url} alt={restaurant?.name} className="w-full h-full object-contain mix-blend-normal" />
            ) : (
              <div className="w-full h-full bg-[#008080]/10 flex items-center justify-center font-serif text-3xl font-bold text-[#008080]">
                {restaurant?.name.charAt(0)}
              </div>
            )}
          </div>

          <h1 className="text-[2.5rem] leading-none font-serif font-extrabold text-gray-900 dark:text-[#FDFCF0] tracking-tight">{slug === 'demo' ? 'Leomenu' : restaurant?.name}</h1>
          <h2 className="text-sm font-serif italic text-gray-500 dark:text-gray-400 mt-3 tracking-wide flex items-center justify-center gap-2">
            {images.restaurant_subtitle || 'Menu Digitale'}
          </h2>
        </div>
        <div className="space-y-4">
          {sections.filter(section => {
            const visibilityKey = `visibility_${section.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
            return images[visibilityKey] !== 'false';
          }).map(section => {
            const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
            const imageUrl = images[`home_image_${sectionSlug}`] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';
            return (
              <Link key={section} to={`/${slug}/menu/${section}`} className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gray-900">
                  <FadeImage alt={section} src={imageUrl} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                <div className="relative h-full flex items-end justify-between p-6">
                  <h3 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">{section}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#008080] transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}

          {images.visibility_menu !== 'false' && (
            <Link to={`/${slug}/menu-del-giorno`} className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gray-900">
                <FadeImage alt="Menu" src={images.home_image_menu || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'} />
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
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
