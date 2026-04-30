import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Logo from '../components/Logo';
import db from '../db';
import { registerSession, logAuthEvent } from '../lib/sessionSecurity';

export default function Auth({ type }: { type: 'login' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionRevoked, setSessionRevoked] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Show inactivity message when redirected from the timeout handler
    const inactivityReason = searchParams.get('motivo') === 'sessione-scaduta';

    const redirectByRole = async (userId: string) => {
        try {
            const { data: roleData, error } = await db.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
            if (error || !roleData) {
                await db.auth.signOut();
                return;
            }
            if (roleData.role === 'admin') {
                navigate('/leomenu-admin');
            } else if (roleData.role === 'owner') {
                const { data: resData } = await db.from('restaurants').select('slug').eq('user_id', userId).neq('slug', 'demo').limit(1).maybeSingle();
                if (resData?.slug) {
                    navigate(`/${resData.slug}/gestione`);
                } else {
                    navigate('/gestione');
                }
            } else {
                navigate('/passport');
            }
        } catch (err) {
            await db.auth.signOut();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data: authData, error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            if (authData?.user) {
                const userId = authData.user.id;

                // ── Register session + enforce concurrent-session limit ────────
                const wasRevoked = await registerSession(userId);
                if (wasRevoked) setSessionRevoked(true);

                // ── Audit log ─────────────────────────────────────────────────
                await logAuthEvent(userId, 'login');

                await redirectByRole(userId);
            } else {
                navigate('/gestione');
            }
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage === 'Email not confirmed') {
                errorMessage = "Email non confermata. Clicca sul link che ti abbiamo inviato per accedere.";
            } else if (errorMessage?.includes('For security purposes')) {
                errorMessage = "Per motivi di sicurezza, devi attendere qualche secondo prima di riprovare.";
            } else if (errorMessage === 'Invalid login credentials') {
                errorMessage = "Credenziali non valide. Controlla email e password.";
                await logAuthEvent(null, 'login_failed', { email });
            } else if (errorMessage === 'Email rate limit exceeded' || errorMessage?.includes('rate limit')) {
                errorMessage = "Hai superato il limite di invio email. Riprova più tardi.";
            } else {
                errorMessage = errorMessage || 'Errore durante l\'accesso. Riprova.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen antialiased flex flex-col lg:flex-row">
            {/* LEFT SIDE: Branding / Value Prop */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#008081] to-teal-900 p-12 flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-black opacity-10 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-20">
                        <Logo />
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
                        L'unico gestionale<br />che ti serve.
                    </h1>
                    <p className="text-xl font-medium text-teal-50 max-w-md drop-shadow-sm">
                        Prendi il controllo del tuo ristorante. Ordini, cassa, menù digitale e fidelizzazione in un'unica piattaforma.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Auth Form */}
            <div className="flex-1 flex flex-col justify-center px-6 pt-6 pb-24 max-w-md mx-auto w-full lg:max-w-xl lg:px-16">

                {/* Inactivity session expiry banner */}
                {inactivityReason && (
                    <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>La tua sessione è scaduta per inattività. Accedi di nuovo per continuare.</span>
                    </div>
                )}

                {/* Concurrent session revocation banner */}
                {sessionRevoked && (
                    <div className="mb-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                        <span>Hai raggiunto il limite di sessioni attive. Le sessioni precedenti sono state revocate.</span>
                    </div>
                )}

                {/* Mobile Top bar with back button and Logo */}
                <div className="flex items-center justify-between mb-10 lg:hidden">
                    <Link to="/" className="p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <Link to="/" className="block">
                        <Logo />
                    </Link>
                </div>

                {/* Title */}
                <div className="mb-12">
                    <h1 className="text-[2.5rem] font-extrabold tracking-tight leading-[1.1]">
                        Accedi alle cose<br />belle
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-6 border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {/* Form Inputs */}
                <form id="login-form" onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <button
                        type="button"
                        onClick={async () => {
                            await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow focus:outline-none mb-4 group"
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.86C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.86z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.86c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-bold text-gray-700 dark:text-gray-200">Accedi con Google</span>
                    </button>

                    <div className="flex items-center gap-4 my-2">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                        <span className="text-sm font-bold text-gray-400">oppure usa la tua email</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                    <div>
                        <input
                            id="loginEmail"
                            name="email"
                            autoComplete="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-3xl bg-[#FBFBFB] shadow-premium dark:bg-[#262626] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300"
                            placeholder="Email"
                        />
                    </div>
                    <div className="relative">
                        <input
                            id="loginPassword"
                            name="password"
                            autoComplete="current-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-3xl bg-[#FBFBFB] shadow-premium dark:bg-[#262626] focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all duration-300 pr-12"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                        >
                            {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                    </div>
                </form>

                <div className="mt-8 space-y-6 text-[15px]">
                    <Link to="/reset-password" className="text-[#008080] dark:text-[#008080] hover:underline block">
                        Hai dimenticato la password?
                    </Link>
                    <div className="text-gray-800 dark:text-gray-300">
                        non sei ancora registrato? <Link to="/register" className="text-[#008080] dark:text-[#008080] hover:underline font-bold">Registrati</Link>
                    </div>
                </div>

                <button
                    form="login-form"
                    type="submit"
                    disabled={loading}
                    className={`hidden lg:block w-full py-4 mt-6 text-white font-bold text-[17px] text-center transition-all duration-300 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008081]'}`}
                >
                    {loading ? 'Caricamento...' : 'Accedi'}
                </button>

            </div>

            {/* Bottom sticky button */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full z-10 px-6 pb-6 pt-2 bg-gradient-to-t from-[#FBFBFB] via-[#FBFBFB] dark:from-[#1A1A1A] dark:via-[#1A1A1A] to-transparent">
                <button
                    form="login-form"
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 text-white font-bold text-[17px] text-center transition-all duration-300 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008081]'}`}
                >
                    {loading ? 'Caricamento...' : 'Accedi'}
                </button>
            </div>
        </div>
    );
}
