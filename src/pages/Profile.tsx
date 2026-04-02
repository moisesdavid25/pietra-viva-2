import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import db from '../db';
import UserProfile from '../components/menu/UserProfile';

export default function Profile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<{ id: string, name: string } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Check Session
      const { data: { session: currentSession } } = await db.auth.getSession();
      
      if (!currentSession) {
        // If not logged in, bounce them back to the menu
        navigate(`/${slug}`, { replace: true });
        return;
      }
      setSession(currentSession);

      // 2. Load restaurant ID for this slug
      if (slug) {
        const { data: resData } = await db.from('restaurants')
          .select('id, name')
          .eq('slug', slug)
          .maybeSingle();

        if (resData) {
          setRestaurant(resData);
        } else {
          // Fallback demo redirect
          if (slug === 'demo') {
            setRestaurant({ id: 'demo-id', name: 'Leomenu' });
          } else {
            navigate('/');
          }
        }
      }
      setLoading(false);
    };

    init();
  }, [slug, navigate]);

  const handleLogout = async () => {
    await db.auth.signOut();
    navigate(`/${slug}`);
  };

  if (loading || !restaurant || !session) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#008081]/30 border-t-[#008081] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#121212] flex flex-col items-center">
      {/* Small Header overlay for Profile Page */}
      <div className="w-full max-w-md px-6 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(`/${slug}`)}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-[#008081] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{restaurant.name}</p>
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-6">
        <h1 className="text-3xl font-black text-[#1A1A1A] dark:text-white mb-6 tracking-tight text-center">
          Area Personale
        </h1>
        
        {/* Pass session to UserProfile which handles points & QR */}
        <UserProfile 
          restaurantId={restaurant.id} 
          restaurantName={restaurant.name} 
          session={session} 
          onLogout={handleLogout} 
          defaultOpen={true}
        />
        
        <div className="mt-8 flex justify-center pb-12">
          <button 
            onClick={handleLogout}
            className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            Cerrar Sección
          </button>
        </div>
      </div>
    </div>
  );
}


