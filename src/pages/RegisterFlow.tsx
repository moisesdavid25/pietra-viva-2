import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Store, User, ArrowRight, Check } from 'lucide-react';
import db from '../db';
import Logo from '../components/Logo';

const PLANS = [
    {
        id: 'mensile',
        priceId: 'price_1TJu471OtlBFS4a5EWfn6XOi',
        label: 'Mensile',
        price: 29,
        billing: '€29 al mese',
        discount: null,
        highlight: false,
    },
    {
        id: 'semestrale',
        priceId: 'price_1TJu701OtlBFS4a50PJvWBGI',
        label: 'Semestrale',
        price: 22,
        billing: '€132 ogni 6 mesi',
        discount: '-24%',
        highlight: false,
    },
    {
        id: 'annuale',
        priceId: 'price_1TJu7u1OtlBFS4a5zRuVahso',
        label: 'Annuale',
        price: 17,
        billing: '€204 all\'anno',
        discount: '-41%',
        highlight: true,
    },
] as const;

export default function RegisterFlow() {
    const [step, setStep]         = useState(1);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    // Step 1
    const [role, setRole]         = useState<'owner' | 'customer' | ''>('');
    const [isOAuthUser, setIsOAuthUser] = useState(false);

    // Step 2
    const [email, setEmail]           = useState('');
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [phone, setPhone]           = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('Ristorante');

    // Step 3 — owner only
    const [selectedPlan, setSelectedPlan] = useState<string>('annuale');

    // Step 4 (owner) / Step 3 (customer)
    const [password, setPassword]           = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const navigate = useNavigate();

    // Steps: 3 for all roles (owner password collected post-Stripe in RegisterComplete)
    const totalSteps = 3;

    useEffect(() => {
        const savedRole = localStorage.getItem('registerRole');
        if (savedRole === 'owner' || savedRole === 'customer') setRole(savedRole);

        const params = new URLSearchParams(window.location.search);
        const pendingOAuth = localStorage.getItem('pending_oauth_register');

        db.auth.getSession().then(async ({ data: { session } }) => {
            // Viene dalla landing leomenu.it con ?provider=google e nessuna sessione attiva
            if (!session?.user && params.get('provider') === 'google') {
                localStorage.setItem('pending_oauth_register', 'true');
                await db.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin + '/register' },
                });
                return;
            }
            if (!session?.user) return;
            if (pendingOAuth) {
                localStorage.removeItem('pending_oauth_register');
                const ageSeconds = (Date.now() - new Date(session.user.created_at).getTime()) / 1000;
                if (ageSeconds < 60) { setIsOAuthUser(true); return; }
                redirectDone(session.user.id);
                return;
            }
            redirectDone(session.user.id);
        });
    }, []);

    const redirectDone = async (userId: string) => {
        try {
            const { data: roleData, error } = await db.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
            if (error || !roleData) { await db.auth.signOut(); return; }
            if (roleData.role === 'owner') {
                const { data: res } = await db.from('restaurants').select('slug').eq('user_id', userId).neq('slug', 'demo').limit(1).maybeSingle();
                navigate(res?.slug ? `/${res.slug}/gestione` : '/gestione?wizard=true');
            } else {
                navigate('/fidelity?wizard=true');
            }
        } catch { await db.auth.signOut(); }
    };

    const makeSlug = (name: string) =>
        `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Math.random().toString(36).substring(2, 8)}`;

    // ── OAuth owner: business info submit → salva in sessionStorage, NON in DB ──
    // Il ristorante e il ruolo vengono creati solo dopo la conferma del pagamento Stripe.
    const handleOAuthOwnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user) throw new Error('Sessione scaduta');
            sessionStorage.setItem('pending_oauth_registration', JSON.stringify({
                businessName,
                businessType,
                email: user.email ?? '',
                userId: user.id,
            }));
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Errore.');
        } finally {
            setLoading(false);
        }
    };

    // ── OAuth owner: dopo la selezione piano → Stripe (senza restaurantId) ─────
    // Il ristorante viene creato in RegisterComplete dopo la conferma del pagamento.
    const handleOAuthStripeRedirect = async () => {
        setLoading(true);
        try {
            const pending = JSON.parse(sessionStorage.getItem('pending_oauth_registration') || '{}');
            const userEmail = pending.email ?? '';
            const plan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[2];
            const r = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: plan.priceId, userEmail }),
            });
            const { url } = await r.json();
            if (url) window.location.href = url;
        } catch { navigate('/register'); }
        finally { setLoading(false); }
    };

    // ── Owner plan submit: save data (NO password) to sessionStorage → Stripe ──
    // Password is collected AFTER payment in RegisterComplete (security fix)
    const handleOwnerPlanSubmit = async () => {
        if (!privacyAccepted) {
            setError('Devi accettare la Privacy Policy e i Termini per continuare.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            sessionStorage.setItem('pending_registration', JSON.stringify({
                email, firstName, lastName, phone,
                businessName, businessType, selectedPlan,
                // ✅ password intentionally NOT stored here
            }));
            const plan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[2];
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: plan.priceId, userEmail: email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Errore API (${res.status})`);
            const { url, error: apiErr } = data;
            if (apiErr) throw new Error(apiErr);
            if (url) { window.location.href = url; return; }
            throw new Error('Nessun URL ricevuto da Stripe.');
        } catch (err: any) {
            sessionStorage.removeItem('pending_registration');
            setError(err.message || 'Errore. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    // ── Final submit (customer only): create account directly ────────────────
    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            localStorage.setItem('registerRole', role);
            const { error: signUpError } = await db.auth.signUp({
                email, password,
                options: { data: { first_name: firstName, last_name: lastName, phone } },
            });
            if (signUpError) throw signUpError;
            const { error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError && signInError.message !== 'Email not confirmed') throw signInError;
            const { data: { user } } = await db.auth.getUser();
            if (!user) throw new Error('Utente non autenticato');
            await db.from('profiles').upsert({ id: user.id, role, first_name: firstName, last_name: lastName, phone });
            navigate('/fidelity?wizard=true');
        } catch (err: any) {
            await db.auth.signOut();
            setError(err.message === 'User already registered' ? 'Utente già registrato. Accedi.' : (err.message || 'Errore durante la registrazione.'));
        } finally {
            setLoading(false);
        }
    };

    const passwordStep = 3; // customers only (owners go to Stripe from plan step)

    return (
        <div className="flex min-h-screen bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans antialiased text-[#1A1A1A] dark:text-[#FDFCF0]">

            {/* ── Left panel ─────────────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#008081] text-white flex-col p-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#008081] to-[#005c5c]" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white opacity-5 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-black opacity-10 blur-3xl" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-20"><Logo className="text-white" /></div>
                        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
                            Crea il menù del tuo<br />ristorante in<br />pochi minuti.
                        </h1>
                        <p className="text-xl font-medium text-teal-50 max-w-md drop-shadow-sm mb-10">
                            Digitalizza i tuoi ordini e aumenta le vendite con Leomenu.
                        </p>
                        <div className="space-y-3">
                            {[
                                '14 giorni di prova gratuita — nessun addebito oggi',
                                'Disdici quando vuoi, nessun vincolo',
                                'Menu QR, ordini, fidelizzazione e CRM inclusi',
                            ].map(t => (
                                <div key={t} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-teal-300 flex-shrink-0" />
                                    <span className="text-teal-100 font-medium">{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right panel ────────────────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
                {step === 1 && (
                    <Link to="/" className="absolute top-6 left-6 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                )}

                <div className="w-full max-w-md bg-white dark:bg-[#262626] rounded-[24px] shadow-lg flex flex-col border border-gray-100 min-h-[500px] overflow-hidden">

                    {/* Progress dots */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </button>
                        ) : <div className="w-10" />}
                        <div className="flex gap-2">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i + 1 ? 'w-8 bg-[#008081]' : 'w-4 bg-gray-200'}`} />
                            ))}
                        </div>
                        <div className="w-10" />
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-5 text-center">{error}</div>}

                        {/* ── Step 1: Role ─────────────────────────────────────── */}
                        {step === 1 && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">Scegli il tuo ruolo</h2>
                                <p className="text-gray-500 mb-8">Sei proprietario di un'attività o cliente?</p>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => { setRole('owner'); setStep(2); }}
                                        className="w-full text-left p-6 border-2 border-gray-100 hover:border-[#008081] rounded-2xl flex items-center gap-4 group transition-colors"
                                    >
                                        <div className="p-3 bg-teal-50 group-hover:bg-[#008081] group-hover:text-white rounded-xl text-[#008081] transition-colors"><Store className="w-8 h-8" /></div>
                                        <div><h3 className="font-bold text-lg">Proprietario del locale</h3><p className="text-sm text-gray-500">Voglio creare il mio menù digitale</p></div>
                                        <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-[#008081]" />
                                    </button>
                                    <button
                                        onClick={() => { setRole('customer'); setStep(2); }}
                                        className="w-full text-left p-6 border-2 border-gray-100 hover:border-[#008081] rounded-2xl flex items-center gap-4 group transition-colors"
                                    >
                                        <div className="p-3 bg-teal-50 group-hover:bg-[#008081] group-hover:text-white rounded-xl text-[#008081] transition-colors"><User className="w-8 h-8" /></div>
                                        <div><h3 className="font-bold text-lg">Cliente</h3><p className="text-sm text-gray-500">Voglio effettuare ordini</p></div>
                                        <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-[#008081]" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Data (standard) ───────────────────────── */}
                        {step === 2 && !isOAuthUser && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">I tuoi dati</h2>
                                <p className="text-gray-500 mb-6">Inserisci i tuoi dati personali.</p>
                                <form onSubmit={e => { e.preventDefault(); setStep(role === 'owner' ? 3 : passwordStep); }} className="flex-1 flex flex-col space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-500 ml-2">Nome *</label>
                                            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-500 ml-2">Cognome *</label>
                                            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-2">Email *</label>
                                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-2">Telefono *</label>
                                        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none" />
                                    </div>
                                    {role === 'owner' && (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 ml-2">Nome del Ristorante *</label>
                                                <input type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} autoComplete="organization" className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 ml-2">Tipologia *</label>
                                                <select required value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none">
                                                    <option>Ristorante</option><option>Pizzeria</option><option>Bar</option><option>Gelateria</option><option>Pub</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    <button type="submit" className="w-full text-white py-4 rounded-2xl font-bold bg-[#008081] hover:bg-teal-700 transition-colors mt-4">Continua</button>
                                </form>
                                <div className="mt-6 text-center text-sm">
                                    <span className="text-gray-500">Hai già un account? </span>
                                    <Link to="/login" className="text-[#008081] font-bold hover:underline">Accedi</Link>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2 (OAuth owner): business info ──────────────── */}
                        {step === 2 && isOAuthUser && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">Il tuo ristorante</h2>
                                <p className="text-gray-500 mb-8">Inserisci i dati della tua attività.</p>
                                <form onSubmit={handleOAuthOwnerSubmit} className="flex-1 flex flex-col space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-2">Nome del Ristorante *</label>
                                        <input type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-2">Tipologia *</label>
                                        <select required value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200">
                                            <option>Ristorante</option><option>Pizzeria</option><option>Bar</option><option>Gelateria</option><option>Pub</option>
                                        </select>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full text-white py-4 rounded-2xl font-bold bg-[#008081] hover:bg-teal-700 transition-colors mt-6">
                                        {loading ? 'Attendi...' : 'Continua'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ── Step 3 (owner): Plan selection ───────────────────── */}
                        {step === 3 && role === 'owner' && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-2xl font-bold mb-1">Scegli il piano</h2>
                                <p className="text-gray-500 text-sm mb-5">
                                    <strong className="text-[#008081]">14 giorni gratis</strong> — nessun addebito oggi.
                                </p>
                                <div className="space-y-3 flex-1">
                                    {PLANS.map(plan => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative ${selectedPlan === plan.id ? 'border-[#008081] bg-teal-50/60 dark:bg-teal-900/10' : 'border-gray-100 hover:border-gray-200 dark:border-gray-700'}`}
                                        >
                                            {plan.highlight && (
                                                <span className="absolute -top-2.5 right-4 text-[10px] font-black uppercase tracking-widest bg-[#008081] text-white px-2.5 py-1 rounded-full">
                                                    Più scelto
                                                </span>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedPlan === plan.id ? 'border-[#008081] bg-[#008081]' : 'border-gray-300'}`}>
                                                        {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-gray-800 dark:text-white">{plan.label}</span>
                                                            {plan.discount && (
                                                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{plan.discount}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">{plan.billing}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-[#008081]">€{plan.price}</span>
                                                    <span className="text-xs text-gray-400">/mese</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {/* Privacy consent (standard owner only — OAuth already accepted) */}
                                {!isOAuthUser && (
                                    <label className="flex items-start gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={privacyAccepted}
                                            onChange={e => setPrivacyAccepted(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 text-[#008081] rounded focus:ring-[#008081] flex-shrink-0"
                                        />
                                        <span>
                                            Accetto la{' '}
                                            <Link to="/privacy-policy" className="text-[#008081] underline" target="_blank">Privacy Policy</Link>
                                            {' '}e i{' '}
                                            <Link to="/termini-condizioni" className="text-[#008081] underline" target="_blank">Termini di Servizio</Link>
                                        </span>
                                    </label>
                                )}
                                <button
                                    onClick={() => isOAuthUser ? handleOAuthStripeRedirect() : handleOwnerPlanSubmit()}
                                    disabled={loading || (!isOAuthUser && !privacyAccepted)}
                                    className={`w-full text-white py-4 rounded-2xl font-bold transition-colors mt-4 flex items-center justify-center gap-2 ${loading || (!isOAuthUser && !privacyAccepted) ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-[#008081] hover:bg-teal-700'}`}
                                >
                                    {loading ? 'Attendi...' : 'Inizia 14 giorni gratis →'}
                                </button>
                                <p className="text-center text-[11px] text-gray-400 mt-3">
                                    Nessun addebito oggi. Puoi disdire in qualsiasi momento.
                                </p>
                            </div>
                        )}

                        {/* ── Password step (step 4 owner / step 3 customer) ─── */}
                        {step === passwordStep && !isOAuthUser && role === 'customer' && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">Sicurezza</h2>
                                <p className="text-gray-500 mb-6">Scegli una password per il tuo account.</p>
                                <form onSubmit={handleFinalSubmit} className="flex-1 flex flex-col space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-2">Password *</label>
                                        <input
                                            type="password" required minLength={6}
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            className="w-full p-3 bg-[#FBFBFB] rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#008081]/20 outline-none"
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                                        <input type="checkbox" required checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="w-5 h-5 text-[#008081] rounded focus:ring-[#008081]" />
                                        Accetto la <Link to="/privacy-policy" className="text-[#008081] underline" target="_blank">Policy</Link> e i <Link to="/termini-condizioni" className="text-[#008081] underline" target="_blank">Termini</Link>
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={loading || !privacyAccepted}
                                        className={`w-full text-white py-4 rounded-2xl font-bold transition-colors mt-4 ${!privacyAccepted ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#008081] hover:bg-teal-700'}`}
                                    >
                                        {loading ? 'Attendi...' : 'Crea account'}
                                    </button>
                                </form>
                                <div className="mt-6 text-center text-sm">
                                    <span className="text-gray-500">Hai già un account? </span>
                                    <Link to="/login" className="text-[#008081] font-bold hover:underline">Accedi</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
