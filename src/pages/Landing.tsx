import { Link, useNavigate } from 'react-router-dom';
import { Utensils, ArrowRight, Search, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import db from '../db';

export default function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();

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
                .limit(5);

            if (restaurantsData && restaurantsData.length > 0) {
                const restaurantIds = restaurantsData.map(r => r.id);
                // Fetch logos from settings table
                const { data: settingsData } = await db.from('settings')
                    .select('restaurant_id, value')
                    .in('restaurant_id', restaurantIds)
                    .eq('key', 'logo_url');

                const formattedData = restaurantsData.map(restaurant => {
                    let logo = '';
                    if (restaurant.slug === 'pietra-viva' || restaurant.slug === 'demo') {
                        logo = '/logo-pietraviva.png';
                    } else if (settingsData) {
                        const setting = settingsData.find(s => s.restaurant_id === restaurant.id);
                        if (setting) logo = setting.value;
                    }
                    return { ...restaurant, logo_url: logo };
                });
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
        <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
            <header className="px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Utensils className="w-8 h-8 text-[#008080]" />
                    <h1 className="font-serif text-2xl font-bold tracking-widest uppercase">Leomenu</h1>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-4 py-2 font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors">
                        Accedi
                    </Link>
                    <Link to="/register" className="px-4 py-2 bg-[#008080] text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-colors">
                        Crea il tuo menù
                    </Link>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-12">
                <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6">
                    Hai fame?<br />
                    <span className="text-[#008080] italic">Trova il gusto.</span>
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
                            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-800 rounded-full outline-none focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 dark:text-white shadow-sm transition-all text-xl font-medium"
                        />
                        {isSearching && (
                            <span className="absolute right-6 w-5 h-5 border-2 border-[#008080] border-t-transparent rounded-full animate-spin"></span>
                        )}
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#252525] rounded-3xl shadow-xl flex flex-col p-2 border border-gray-100 dark:border-gray-800 max-h-80 overflow-y-auto animate-fade-in text-left">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Ristoranti trovati</p>
                            {searchResults.map(restaurant => (
                                <button
                                    key={restaurant.id}
                                    onClick={() => navigate(`/${restaurant.slug}`)}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-2xl transition-colors w-full group"
                                >
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center text-gray-500 overflow-hidden flex-shrink-0 group-hover:bg-[#008080]/10 group-hover:text-[#008080] transition-colors">
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
                                    <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#008080] transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full max-w-xl mx-auto border-t border-gray-100 dark:border-gray-800 pt-10">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Oppure, sei un ristoratore?</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
                        <Link to="/register" className="px-8 py-4 bg-[#008080] text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2 text-lg">
                            Crea il menù QR <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="/demo" className="px-8 py-4 bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-800 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center text-lg text-gray-700 dark:text-white">
                            Guarda la Demo
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
