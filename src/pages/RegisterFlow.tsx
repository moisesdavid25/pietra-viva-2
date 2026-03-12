import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import db from '../db';

export default function RegisterFlow() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Crea il tuo account
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Step 2: I tuoi dati
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Step 3: Contatti & Indirizzo
    const [telefono, setTelefono] = useState('');
    const [indirizzo, setIndirizzo] = useState('');
    const [citta, setCitta] = useState('');
    const [provincia, setProvincia] = useState('');
    const [cap, setCap] = useState('');
    const [paese, setPaese] = useState('Italia');

    // Step 4: Privacy
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [marketingAccepted, setMarketingAccepted] = useState(false);

    // Step 5: Il tuo locale
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('Pizzería');
    const [numeroCoperti, setNumeroCoperti] = useState('');
    const [scopertoTramite, setScopertoTramite] = useState('Google');

    const [userId, setUserId] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: signUpError } = await db.auth.signUp({
                email,
                password
            });
            if (signUpError) throw signUpError;

            const { data: signInData, error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError && signInError.message !== 'Email not confirmed') throw signInError;

            setUserId(signInData?.user?.id || data?.user?.id || null);
            setStep(2);
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage === 'Email not confirmed') {
                errorMessage = "Verifica la tua email prima di continuare.";
            } else if (errorMessage?.includes('For security purposes') || errorMessage?.includes('rate limit')) {
                errorMessage = "Hai superato il limite di invio. Riprova più tardi.";
            } else if (errorMessage === 'User already registered') {
                errorMessage = "Utente già registrato. Accedi con questa email.";
            } else {
                errorMessage = errorMessage || 'Errore durante la registrazione.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
    };

    const handleStep3 = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(4);
    };

    const handleStep4 = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(5);
    };

    const handleStep5 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setError('');
        setLoading(true);

        try {
            // Aggiorna nome e cognome
            await db.auth.updateUser({
                data: { first_name: firstName, last_name: lastName }
            });

            const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            const { data: restaurant, error: resError } = await db.from('restaurants')
                .insert({
                    user_id: userId,
                    name: businessName,
                    slug,
                    type: businessType,
                    numero_coperti: numeroCoperti ? parseInt(numeroCoperti) : null,
                    telefono,
                    indirizzo,
                    citta,
                    provincia,
                    cap,
                    paese,
                    sondaggio_tipo_menu: 'Un menu digitale interattivo',
                    scoperto_tramite: scopertoTramite
                })
                .select()
                .single();

            if (resError) {
                if (resError.code === '23505') throw new Error('Questo nome o link web è già in uso. Prova un altro nome.');
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

                const initialSettings = [
                    { restaurant_id: restaurant.id, key: 'home_image_antipastiefritto', value: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_pizza', value: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_bevande', value: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=400&fit=crop' },
                    { restaurant_id: restaurant.id, key: 'home_image_dolci', value: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop' }
                ];
                await db.from('settings').insert(initialSettings);
            }

            setStep(6);
        } catch (err: any) {
            setError(err.message || 'Errore durante la configurazione del profilo.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        await db.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
            <div className="w-full max-w-md bg-[#FBFBFB] dark:bg-[#262626] rounded-3xl shadow-premium overflow-hidden min-h-[500px] flex flex-col">

                {/* Header Dinamico */}
                {step < 6 && (
                    <div className="px-6 py-4 flex items-center border-b border-gray-100 dark:border-gray-800">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </button>
                        ) : (
                            <div className="w-10"></div>
                        )}
                        <h1 className="flex-1 font-serif text-xl font-bold tracking-widest uppercase text-center text-[#008080]">Leomenu</h1>
                        <div className="w-10"></div>
                    </div>
                )}

                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Account */}
                    {step === 1 && (
                        <div className="animate-fade-in flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold mb-2">Crea il tuo account</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Inserisci le credenziali di accesso.</p>

                            <form onSubmit={handleStep1} className="flex-1 flex flex-col">
                                <div className="space-y-4 flex-1">
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="relative mt-6">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Password *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs text-gray-500 flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#008080]" /> Minimo 6 caratteri richiesti</p>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95 ${loading ? 'bg-[#008080]/50' : 'bg-[#008080] hover:bg-teal-700'}`}>
                                    {loading ? 'Attendere...' : 'Crea un account'}
                                </button>
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Hai già un account? <Link to="/login" className="text-[#008080] font-bold hover:underline">Accedi</Link>
                                </p>
                            </form>
                        </div>
                    )}

                    {/* Step 2: Dati */}
                    {step === 2 && (
                        <div className="animate-fade-in flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold mb-2">I tuoi dati</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Dicci chi sei.</p>

                            <form onSubmit={handleStep2} className="flex-1 flex flex-col">
                                <div className="space-y-6 flex-1">
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Nome *</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="relative mt-6">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Cognome *</label>
                                        <input
                                            type="text"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={!firstName || !lastName} className={`w-full text-white py-4 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95 ${!firstName || !lastName ? 'bg-gray-200 text-gray-400' : 'bg-[#008080] hover:bg-teal-700'}`}>
                                    Continua
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Indirizzo e Telefono */}
                    {step === 3 && (
                        <div className="animate-fade-in flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold mb-2">Contatti & Posizione</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Come possiamo metterci in contatto?</p>

                            <form onSubmit={handleStep3} className="flex-1 flex flex-col">
                                <div className="space-y-5 flex-1 overflow-y-auto pb-4 pr-1">
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Telefono *</label>
                                        <input
                                            type="tel"
                                            required
                                            minLength={6}
                                            pattern="^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$"
                                            title="Inserisci un numero di telefono valido"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Indirizzo completto *</label>
                                        <input
                                            type="text"
                                            required
                                            minLength={5}
                                            value={indirizzo}
                                            onChange={(e) => setIndirizzo(e.target.value)}
                                            placeholder="Via e numero civico"
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300 placeholder-gray-300"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Città *</label>
                                            <input
                                                type="text"
                                                required
                                                minLength={2}
                                                value={citta}
                                                onChange={(e) => setCitta(e.target.value)}
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="relative w-1/3">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Prov. *</label>
                                            <input
                                                type="text"
                                                required
                                                pattern="^[a-zA-Z]{2}$"
                                                title="Due lettere, es: RM o MI"
                                                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Usa un formato che corrisponda a quello richiesto. (es: RM)')}
                                                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                                                value={provincia}
                                                onChange={(e) => setProvincia(e.target.value)}
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">CAP *</label>
                                            <input
                                                type="text"
                                                required
                                                pattern="^[0-9]{5}$"
                                                title="Il CAP deve avere esattamente 5 numeri (es: 20100)"
                                                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Usa un formato che corrisponda a quello richiesto. Il CAP deve avere esattamente 5 numeri (es: 20100)')}
                                                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                                                value={cap}
                                                onChange={(e) => setCap(e.target.value)}
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Paese</label>
                                            <input
                                                type="text"
                                                required
                                                minLength={3}
                                                value={paese}
                                                onChange={(e) => setPaese(e.target.value)}
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300 text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className={`w-full text-white py-4 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95 bg-[#008080] hover:bg-teal-700`}>
                                    Continua
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Privacy */}
                    {step === 4 && (
                        <div className="animate-fade-in flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold mb-2">Preferenze Privacy</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">* Informazioni richieste</p>

                            <form onSubmit={handleStep4} className="flex-1 flex flex-col">
                                <div className="space-y-6 flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <span className="text-red-500 mr-1">*</span>
                                            Ho letto e accettato i <Link to="/termini-condizioni" target="_blank" className="text-[#008080] hover:underline">Termini e Condizioni</Link> e la <Link to="/privacy-policy" target="_blank" className="text-[#008080] hover:underline">Privacy Policy</Link> (obbligatorio).
                                        </p>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                                            <input type="checkbox" className="sr-only peer" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#008080]"></div>
                                        </label>
                                    </div>

                                    <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-4"></div>

                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Accetto di ricevere comunicazioni informative e promozionali con sconti dedicati (facoltativo).
                                        </p>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                                            <input type="checkbox" className="sr-only peer" checked={marketingAccepted} onChange={(e) => setMarketingAccepted(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#008080]"></div>
                                        </label>
                                    </div>
                                </div>

                                <button type="submit" disabled={!privacyAccepted} className={`w-full text-white py-4 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95 ${!privacyAccepted ? 'bg-gray-200 text-gray-400' : 'bg-[#008080] hover:bg-teal-700'}`}>
                                    Continua
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 5: Locale */}
                    {step === 5 && (
                        <div className="animate-fade-in flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold mb-2">Il tuo business</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Ultimo passo, parlaci della tua attività.</p>

                            <form onSubmit={handleStep5} className="flex-1 flex flex-col">
                                <div className="space-y-5 flex-1 overflow-y-auto pb-4 pr-1">
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Nome Attività *</label>
                                        <input
                                            type="text"
                                            required
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        />
                                        {businessName && (
                                            <p className="text-xs text-[#008080] font-medium mt-1 ml-3">
                                                Link: leomenu.it/{businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Tipo *</label>
                                            <select
                                                value={businessType}
                                                onChange={(e) => setBusinessType(e.target.value)}
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                            >
                                                <option value="Pizzería">Pizzeria (Layout base)</option>
                                                <option value="Ristorante">Ristorante (Vuoto)</option>
                                            </select>
                                        </div>
                                        <div className="relative w-1/3">
                                            <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Coperti</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={numeroCoperti}
                                                onChange={(e) => setNumeroCoperti(e.target.value)}
                                                placeholder="es. 50"
                                                className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300 placeholder-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-3 z-10 bg-white dark:bg-[#262626] shadow-sm rounded-full px-2 py-1 text-xs font-bold text-gray-500">Hai scoperto Leomenu tramite *</label>
                                        <select
                                            value={scopertoTramite}
                                            onChange={(e) => setScopertoTramite(e.target.value)}
                                            className="w-full p-4 bg-[#FBFBFB] shadow-premium rounded-3xl dark:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                                        >
                                            <option>Google</option>
                                            <option>Social Media</option>
                                            <option>Passaparola / Amici</option>
                                            <option>Pubblicità online</option>
                                            <option>Altro</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading || !businessName} className={`w-full text-white py-4 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-95 ${loading || !businessName ? 'bg-gray-400' : 'bg-[#008080] hover:bg-teal-700'}`}>
                                    {loading ? 'Preparazione in corso...' : 'Inizia Ora'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 6: Success */}
                    {step === 6 && (
                        <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-[#008080] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                                <CheckCircle className="w-24 h-24 text-[#008080] relative z-10" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Benvenuto in App!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-[250px] mx-auto">
                                Congratulazioni per l'iscrizione. Il tuo menù digitale è pronto.
                            </p>

                            <button onClick={handleFinish} className="w-full text-white bg-[#008080] hover:bg-teal-700 py-4 rounded-full font-bold shadow-md transition-transform active:scale-95">
                                Fatto
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

