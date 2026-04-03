import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Store, User, ArrowRight } from 'lucide-react';
import db from '../db';
import Logo from '../components/Logo';

export default function RegisterFlow() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Step 1: Role
    const [role, setRole] = useState<'owner' | 'customer' | ''>('');

    // Step 2: Account & Details
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('Ristorante');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const savedRole = localStorage.getItem('registerRole');
        if (savedRole && (savedRole === 'owner' || savedRole === 'customer')) {
            setRole(savedRole);
        }

        db.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                redirectDone(session.user.id);
            }
        });
    }, []);

    const redirectDone = async (userId: string) => {
        try {
            const { data: roleData, error } = await db.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
            if (error || !roleData) {
                // Ghost session detected, destroy it safely to allow registration
                await db.auth.signOut();
                return;
            }
            
            if (roleData.role === 'owner') {
                const { data: resData } = await db.from('restaurants').select('slug').eq('user_id', userId).neq('slug', 'demo').limit(1).maybeSingle();
                if (resData?.slug) {
                    navigate(`/${resData.slug}/gestione`);
                } else {
                    navigate('/gestione?wizard=true');
                }
            } else {
                navigate('/passport?wizard=true');
            }
        } catch {
            await db.auth.signOut();
        }
    };



    const handleStep2Next = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
    };

    const handleStep3Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            localStorage.setItem('registerRole', role);
            
            const { data, error: signUpError } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone
                    }
                }
            });
            
            if (signUpError) throw signUpError;
            
            const { data: { session }, error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError && signInError.message !== 'Email not confirmed') throw signInError;

            const { data: { user } } = await db.auth.getUser();
            if (!user) throw new Error('Utente non autenticato');

            const profileData = { id: user.id, role, first_name: firstName, last_name: lastName, phone };
            const { error: profError } = await db.from('profiles').upsert(profileData);
            if (profError) throw profError;

            if (role === 'owner') {
                const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const slug = `${baseSlug}-${randomSuffix}`;
                
                const { error: resError } = await db.from('restaurants')
                    .insert({ user_id: user.id, name: businessName, slug: slug, type: businessType })
                    .select()
                    .single();
                
                if (resError && resError.code === '23505') throw new Error('Questo nome esiste già.');
                if (resError) throw resError;
                
                await db.rpc('upgrade_to_owner');
                navigate('/gestione?wizard=true');
            } else {
                navigate('/passport?wizard=true');
            }
        } catch (err: any) {
            await db.auth.signOut();
            let errorMessage = err.message;
            if (errorMessage === 'User already registered') {
                errorMessage = "Utente già registrato. Accedi.";
            }
            setError(errorMessage || 'Errore durante la registrazione.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans antialiased text-[#1A1A1A] dark:text-[#FDFCF0]">
            <div className="hidden lg:flex lg:w-1/2 bg-[#008081] text-white flex-col justify-between p-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#008081] to-[#005c5c]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-black opacity-10 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-20">
                            <Logo className="text-white" />
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
                            Crea il menù del tuo<br />ristorante in<br />pochi minuti.
                        </h1>
                        <p className="text-xl font-medium text-teal-50 max-w-md drop-shadow-sm mb-12">
                            Digitalizza i tuoi ordini e aumenta le vendite con Leomenu. Tutto ciò di cui hai bisogno in un solo posto.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
                {step === 1 && (
                    <Link to="/" className="absolute top-6 left-6 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                )}
                
                <div className="w-full max-w-md bg-white dark:bg-[#262626] rounded-[24px] shadow-lg flex flex-col border border-gray-100 min-h-[500px] overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </button>
                        ) : <div className="w-10"></div>}
                        
                        <div className="flex gap-2">
                            <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-[#008081]' : 'w-4 bg-gray-200'}`} />
                            <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-[#008081]' : 'w-4 bg-gray-200'}`} />
                            <div className={`h-2 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-[#008081]' : 'w-4 bg-gray-200'}`} />
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 text-center">{error}</div>}
                        {message && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-6 text-center">{message}</div>}

                        {step === 1 && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">Scegli il tuo ruolo</h2>
                                <p className="text-gray-500 mb-8">Sei proprietario di un'attività o cliente?</p>
                                <div className="space-y-4">
                                    <button onClick={() => { setRole('owner'); setStep(2); }} className="w-full text-left p-6 border-2 border-gray-100 hover:border-[#008081] rounded-2xl flex items-center gap-4 group transition-colors">
                                        <div className="p-3 bg-teal-50 group-hover:bg-[#008081] group-hover:text-white rounded-xl text-[#008081] transition-colors"><Store className="w-8 h-8"/></div>
                                        <div><h3 className="font-bold text-lg">Proprietario del locale</h3><p className="text-sm text-gray-500">Voglio creare il mio menù digitale</p></div>
                                        <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-[#008081]" />
                                    </button>
                                    <button onClick={() => { setRole('customer'); setStep(2); }} className="w-full text-left p-6 border-2 border-gray-100 hover:border-[#008081] rounded-2xl flex items-center gap-4 group transition-colors">
                                        <div className="p-3 bg-teal-50 group-hover:bg-[#008081] group-hover:text-white rounded-xl text-[#008081] transition-colors"><User className="w-8 h-8"/></div>
                                        <div><h3 className="font-bold text-lg">Cliente</h3><p className="text-sm text-gray-500">Voglio effettuare ordini</p></div>
                                        <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-[#008081]" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">I tuoi dati</h2>
                                <p className="text-gray-500 mb-8">Inserisci i tuoi dati personali.</p>

                                <form onSubmit={handleStep2Next} className="flex-1 flex flex-col space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1"><label htmlFor="firstName" className="text-xs font-bold text-gray-500 ml-2">Nome *</label><input id="firstName" name="firstName" autoComplete="given-name" type="text" required value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>
                                        <div className="flex-1"><label htmlFor="lastName" className="text-xs font-bold text-gray-500 ml-2">Cognome *</label><input id="lastName" name="lastName" autoComplete="family-name" type="text" required value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>
                                    </div>
                                    
                                    <div><label htmlFor="regEmail" className="text-xs font-bold text-gray-500 ml-2">Email *</label><input id="regEmail" name="email" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>
                                    
                                    <div><label htmlFor="regPhone" className="text-xs font-bold text-gray-500 ml-2">Telefono *</label><input id="regPhone" name="phone" autoComplete="tel" type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>

                                    {role === 'owner' && (
                                        <>
                                        <div><label htmlFor="businessName" className="text-xs font-bold text-gray-500 ml-2">Nome del Ristorante *</label><input id="businessName" name="businessName" autoComplete="organization" type="text" required value={businessName} onChange={e=>setBusinessName(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>
                                        <div>
                                            <label htmlFor="businessType" className="text-xs font-bold text-gray-500 ml-2">Tipologia *</label>
                                            <select id="businessType" name="businessType" required value={businessType} onChange={e=>setBusinessType(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200">
                                                <option value="Ristorante">Ristorante</option>
                                                <option value="Pizzeria">Pizzeria</option>
                                                <option value="Bar">Bar</option>
                                                <option value="Gelateria">Gelateria</option>
                                                <option value="Pub">Pub</option>
                                            </select>
                                        </div>
                                        </>
                                    )}

                                    <button type="submit" className={`w-full text-white py-4 rounded-2xl font-bold hover:bg-teal-700 transition-colors mt-6 bg-[#008081]`}>Continua</button>
                                </form>
                                <div className="mt-8 text-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Hai già un account? </span>
                                    <Link to="/login" className="text-[#008081] font-bold hover:underline">Accedi</Link>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in flex-1 flex flex-col">
                                <h2 className="text-3xl font-bold mb-2">Sicurezza</h2>
                                <p className="text-gray-500 mb-8">Scegli una password per il tuo account.</p>

                                <form onSubmit={handleStep3Submit} className="flex-1 flex flex-col space-y-4">
                                    <div><label htmlFor="regPassword" className="text-xs font-bold text-gray-500 ml-2">Password *</label><input id="regPassword" name="password" autoComplete="new-password" type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-[#FBFBFB] rounded-2xl transition-all focus:ring-2 focus:ring-[#008081]/20 border border-gray-200"/></div>

                                    <label htmlFor="privacyAccepted" className="flex items-center gap-3 mt-4 text-sm text-gray-600"><input id="privacyAccepted" name="privacyAccepted" type="checkbox" required checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} className="w-5 h-5 text-[#008081] rounded focus:ring-[#008081]"/>Accetto la Policy e i Termini</label>
                                    
                                    <button type="submit" disabled={loading || !privacyAccepted} className={`w-full text-white py-4 rounded-2xl font-bold hover:bg-teal-700 transition-colors mt-6 ${(!privacyAccepted) ? 'bg-gray-300' : 'bg-[#008081]'}`}>{loading ? 'Attendi...' : 'Crea account'}</button>
                                </form>
                                <div className="mt-8 text-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Hai già un account? </span>
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
