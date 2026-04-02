import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { Utensils, ArrowRight, Search, Store, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import db from '../db';

export default function SearchPortal() {
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
            const { data: restaurantsData } = await db.from('restaurants')
                .select('id, name, slug')
                .ilike('name', `%${searchQuery}%`)
                .neq('slug', 'demo')
                .limit(5);

            if (restaurantsData && restaurantsData.length > 0) {
                const restaurantIds = restaurantsData.map(r => r.id);
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
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
            <header className="px-6 py-6 flex items-center justify-between">
                <Logo />
                <div className="flex gap-4">
                    {user ? (
                        <Link to="/passport" className="px-4 py-2 font-bold text-[#008081] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2">
                             <Award className="w-5 h-5" /> Area Fidelity
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

                <div className="w-full max-w-xl relative mb-12 z-20">
                    <div className="relative flex items-center">
                        <Search className="absolute left-6 w-6 h-6 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Es. Pietra Viva..."
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

                <div className="w-full max-w-xl mx-auto border-t border-gray-100 dark:border-gray-800 pt-10">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Oppure, sei un ristoratore?</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
                        <Link to="/register" className="px-8 py-4 bg-[#008081] text-white font-bold rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
                            Crea il menù QR <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="/demo" className="px-8 py-4 bg-[#FBFBFB] dark:bg-[#262626] font-bold rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-lg text-gray-700 dark:text-white">
                            Guarda la Demo
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}





