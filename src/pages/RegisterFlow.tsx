import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Utensils, CheckCircle } from 'lucide-react';
import db from '../db';

export default function RegisterFlow() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: User
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Step 2: Business
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('Pizzería');
    const [userId, setUserId] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: signUpError } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    }
                }
            });
            if (signUpError) throw signUpError;

            const { data: signInData, error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            setUserId(signInData.user?.id || data.user?.id || null);
            setStep(2);
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage === 'Email not confirmed') {
                errorMessage = "Verifica la tua email. Clicca sul link di conferma che ti abbiamo inviato (controlla anche lo spam).";
            } else if (errorMessage?.includes('For security purposes')) {
                errorMessage = "Per motivi di sicurezza, devi attendere qualche secondo prima di riprovare.";
            } else if (errorMessage === 'User already registered') {
                errorMessage = "Utente già registrato. Accedi con questa email.";
            } else if (errorMessage === 'Email rate limit exceeded' || errorMessage?.includes('rate limit')) {
                errorMessage = "Hai superato il limite di invio email. Riprova più tardi.";
            } else {
                errorMessage = errorMessage || 'Errore durante la registrazione.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setError('');
        setLoading(true);

        try {
            const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            const { data: restaurant, error: resError } = await db.from('restaurants')
                .insert({ user_id: userId, name: businessName, slug, type: businessType })
                .select()
                .single();

            if (resError) {
                if (resError.code === '23505') throw new Error('Questo nome o link web è già in uso.');
                throw resError;
            }

            if (businessType === 'Pizzería') {
                const templateCategories = [
                    { section: 'Antipasti e Fritto', name: 'Antipasti e Fritto' },
                    { section: 'Pizza', name: 'Rosse' },
                    { section: 'Pizza', name: 'Bianche' },
                    { section: 'Pizza', name: 'Special' },
                    { section: 'Bevande', name: 'Bevande' },
                    { section: 'Dolci', name: 'Dolci' }
                ];

                const categoriesData = templateCategories.map(cat => ({
                    restaurant_id: restaurant.id,
                    section: cat.section,
                    name: cat.name
                }));

                const { error: catError } = await db.from('categories').insert(categoriesData);
                if (catError) throw catError;

                // Create initial placeholder images for these sections
                const initialSettings = [
                    { restaurant_id: restaurant.id, key: 'home_image_antipastiefritto', value: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_pizza', value: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_bevande', value: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_dolci', value: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop' }
                ];
                await db.from('settings').insert(initialSettings);
            }

            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Errore durante la configurazione del profilo.');
        } finally {
            setLoading(false);
        }
    };

    const handleStep3 = async () => {
        await db.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col justify-center items-center p-6 antialiased">
            <Link to="/" className="mb-8 flex items-center gap-2 group">
                <Utensils className="w-8 h-8 text-[#008080] group-hover:scale-110 transition-transform" />
                <h1 className="font-serif text-2xl font-bold tracking-widest uppercase">Leomenu</h1>
            </Link>

            <div className="w-full max-w-md bg-white dark:bg-[#262626] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">

                {/* Passaggi di registrazione */}
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-center mb-2">Registrazione</h2>
                        <p className="text-center text-sm text-gray-500 mb-6">Passo 1 di 2: Dati personali</p>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep1} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cognome</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full text-white py-3 rounded-xl font-bold mt-6 shadow-lg ${loading ? 'bg-gray-400' : 'bg-[#008080] hover:bg-teal-700'}`}
                            >
                                {loading ? 'Caricamento...' : 'Continua'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Hai già un account?
                            <Link to="/login" className="text-[#008080] font-bold ml-1 hover:underline">
                                Accedi
                            </Link>
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-center mb-2">Configura il tuo locale</h2>
                        <p className="text-center text-sm text-gray-500 mb-6">Passo 2 di 2: Dati attività</p>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleStep2} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome del locale</label>
                                <input
                                    type="text"
                                    required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                    placeholder="Es. Pizzeria Bella Napoli"
                                />
                                {businessName && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Il tuo link sarà: leomenu.com/<span className="font-bold text-[#008080]">{businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo di attività</label>
                                <select
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080]"
                                >
                                    <option value="Pizzería">Pizzeria (Genera menù base)</option>
                                    <option value="Restaurante">Ristorante (Vuoto)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !businessName}
                                className={`w-full text-white py-3 rounded-xl font-bold mt-6 shadow-lg ${loading || !businessName ? 'bg-gray-400' : 'bg-[#008080] hover:bg-teal-700'}`}
                            >
                                {loading ? 'Preparazione in corso...' : 'Crea Profilo'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle className="w-20 h-20 text-[#008080] mb-4 bg-teal-50 dark:bg-teal-900/20 rounded-full p-2" />
                        <h2 className="text-2xl font-serif font-bold text-center mb-2">Profilo creato correttamente!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 mt-2 max-w-xs">
                            Il tuo menù digitale è pronto per essere personalizzato e condiviso.
                        </p>

                        <button
                            onClick={handleStep3}
                            className="w-full bg-[#008080] hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors"
                        >
                            Vai al Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
