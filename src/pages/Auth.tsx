import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Utensils, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import db from '../db';

export default function Auth({ type }: { type: 'login' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data: authData, error: signInError } = await db.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            if (authData?.user) {
                const { data: resData } = await db.from('restaurants').select('slug').eq('user_id', authData.user.id).neq('slug', 'demo').limit(1).maybeSingle();
                if (resData?.slug) {
                    navigate(`/${resData.slug}/gestione`);
                } else {
                    navigate('/gestione');
                }
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
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans flex flex-col min-h-screen antialiased">
            <div className="flex-grow flex flex-col px-6 pt-6 pb-24 max-w-md mx-auto w-full">

                {/* Top bar with back button and Logo */}
                <div className="flex items-center justify-between mb-10">
                    <Link to="/" className="p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-[#008080]" />
                        <span className="font-serif text-lg font-bold tracking-widest uppercase text-gray-900 dark:text-white">Leomenu</span>
                    </div>
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
                    <div>
                        <input
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

            </div>

            {/* Bottom sticky button */}
            <div className="fixed bottom-0 left-0 w-full z-10 px-6 pb-6 pt-2 bg-gradient-to-t from-[#FBFBFB] via-[#FBFBFB] dark:from-[#1A1A1A] dark:via-[#1A1A1A] to-transparent">
                <button
                    form="login-form"
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 text-white font-bold text-[17px] text-center transition-all duration-300 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008080]'}`}
                >
                    {loading ? 'Caricamento...' : 'Accedi'}
                </button>
            </div>
        </div>
    );
}
