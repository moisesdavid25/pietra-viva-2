import { Link, useNavigate } from 'react-router-dom';
import { Utensils, ArrowRight, Search, Store, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import db from '../db';

export default function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        db.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUser(session.user);
        });
    }, []);

    useEffect(() => {
        const fetchRestaurants = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            const { data: restaurantsData, error } = await db.from('restaurants')
                .select('id, name, slug')
                .ilike('name', `%${searchQuery}%`)
                .neq('slug', 'demo')
                .limit(5);

            if (restaurantsData && restaurantsData.length > 0) {
                const restaurantIds = restaurantsData.map(r => r.id);
                // Fetch logos from settings table
                const { data: settingsData } = await db.from('settings')
                    .select('restaurant_id, value')
                    .in('restaurant_id', restaurantIds)
                    .eq('key', 'logo_url');

                const extractColor = (src: string): Promise<string> => {
                    return new Promise((resolve) => {
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
                                    const data = ctx.getImageData(0, 0, 1, 1).data;
                                    if (data[3] === 0) resolve('white');
                                    else resolve(`rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`);
                                } catch (e) {
                                    resolve('white');
                                }
                            } else {
                                resolve('white');
                            }
                        };
                        img.onerror = () => resolve('white');
                        img.src = src;
                    });
                };

                const formattedPromises = restaurantsData.map(async (restaurant) => {
                    let logo = '';
                    if (restaurant.slug === 'pietra-viva') {
                        logo = '';
                    } else if (settingsData) {
                        const setting = settingsData.find(s => s.restaurant_id === restaurant.id);
                        if (setting) logo = setting.value;
                    }

                    let bgColor = 'white';
                    if (logo) {
                        bgColor = await extractColor(logo);
                    }

                    return { ...restaurant, logo_url: logo, bgColor };
                });

                const formattedData = await Promise.all(formattedPromises);
                setSearchResults(formattedData);
            } else {
                setSearchResults([]);
            }
            setIsSearching(false);
        };

        const timeoutId = setTimeout(() => {
            fetchRestaurants();
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);
    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
            <header className="px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Utensils className="w-8 h-8 text-[#008081]" />
                    <h1 className="font-sans text-2xl font-bold tracking-widest">Leomenu</h1>
                </div>
                <div className="flex gap-4">
                    {user ? (
                        <Link to="/passport" className="px-4 py-2 font-bold text-[#008081] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2">
                             <Award className="w-5 h-5" /> Area Fedeltà
                        </Link>
                    ) : (
                        <Link to="/login" className="px-4 py-2 font-bold text-[#008081] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors">
                            Accedi
                        </Link>
                    )}
                    <Link to="/register" className="px-4 py-2 bg-[#008081] text-white font-bold rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        Crea il tuo menù
                    </Link>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-12">
                <h2 className="text-5xl md:text-7xl font-sans font-bold tracking-tight mb-6">
                    Hai fame?<br />
                    <span className="text-[#008081] italic">Trova il gusto.</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl font-medium">
                    Digita il nome del tuo ristorante preferito e inizia a ordinare subito.
                </p>

                {/* Double CTA Hero */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:justify-center items-center mb-16">
                    <Link to="/register" className="px-8 py-4 bg-[#008081] text-white font-extrabold rounded-full shadow-[0_8px_20px_rgba(0,128,129,0.3)] hover:shadow-[0_12px_25px_rgba(0,128,129,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-[17px] whitespace-nowrap lg:w-auto w-full">
                        Inizia gratis <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button onClick={async () => {
                        localStorage.setItem('pending_oauth_register', 'true');
                        await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/register' } });
                    }} className="px-8 py-4 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 font-extrabold rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-[17px] text-[#1A1A1A] dark:text-white whitespace-nowrap lg:w-auto w-full">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Inizia gratis con Google
                    </button>
                </div>

                <div className="w-full max-w-xl relative mb-12 z-20">
                    <div className="relative flex items-center">
                        <Search className="absolute left-6 w-6 h-6 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Es. Pietra Viva, Da Mario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 bg-[#FBFBFB] dark:bg-[#252525] rounded-3xl outline-none focus:ring-4 focus:ring-[#008081]/10 dark:text-white shadow-premium transition-all text-xl font-medium"
                        />
                        {isSearching && (
                            <span className="absolute right-6 w-5 h-5 border-2 border-[#008081] border-t-transparent rounded-full animate-spin"></span>
                        )}
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#FBFBFB] dark:bg-[#252525] rounded-3xl shadow-premium flex flex-col p-2 max-h-80 overflow-y-auto animate-fade-in text-left">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Ristoranti trovati</p>
                            {searchResults.map(restaurant => (
                                <button
                                    key={restaurant.id}
                                    onClick={() => navigate(`/${restaurant.slug}`)}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-2xl transition-colors w-full group"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 overflow-hidden flex-shrink-0 transition-colors ${!restaurant.logo_url ? 'bg-gray-100 dark:bg-[#1A1A1A] group-hover:bg-[#008081]/10 group-hover:text-[#008081]' : ''}`}
                                        style={restaurant.logo_url ? { backgroundColor: restaurant.bgColor } : {}}
                                    >
                                        {restaurant.logo_url ? (
                                            <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-contain p-0.5" />
                                        ) : (
                                            <Store className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-grow text-left">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{restaurant.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Ordina dal menù digitale</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#008081] transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}




