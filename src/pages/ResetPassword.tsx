import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, KeyRound, Utensils } from 'lucide-react';
import db from '../db';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Inserisci il tuo indirizzo email.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { error: resetError } = await db.auth.resetPasswordForEmail(email, {
                redirectTo: `https://leomenu.it/update-password`,
            });
            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err: any) {
            let errorMessage = err.message;
            if (errorMessage?.includes('rate limit')) {
                errorMessage = "Hai superato il limite di invio email. Riprova più tardi.";
            } else {
                errorMessage = "Si è verificato un errore durante l'invio dell'email. Riprova.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans flex flex-col min-h-screen antialiased">
                <div className="flex-grow flex flex-col px-6 pt-6 pb-24 max-w-md mx-auto w-full">
                    {/* Top bar with back button and Logo */}
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/login" className="p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-[#008080]" />
                            <span className="font-serif text-lg font-bold tracking-widest uppercase text-gray-900 dark:text-white">Leomenu</span>
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <div className="relative">
                            <KeyRound className="w-10 h-10 text-[#008080]" />
                            <div className="absolute -bottom-2 -right-2 bg-[#005c5c] rounded-sm p-0.5 animate-pulse">
                                <span className="text-[10px] font-bold text-white leading-none px-1">L</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight mb-6">
                        Reset password
                    </h1>

                    <div className="text-[15px] space-y-4 text-gray-800 dark:text-gray-300">
                        <p>
                            Un'e-mail con le istruzioni è stata inviata a<br />
                            <span className="font-bold">{email}</span> . Per favore controlla la tua casella di posta.
                        </p>
                        <p>Il messaggio potrebbe finire nella cartella spam.</p>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full z-10 px-6 pb-6 pt-2 bg-gradient-to-t from-[#FDFCF0] via-[#FDFCF0] dark:from-[#1A1A1A] dark:via-[#1A1A1A] to-transparent">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-[#008080] hover:bg-teal-700 text-white font-bold text-[17px] text-center transition-colors rounded-xl shadow-lg"
                    >
                        Ok capito
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans flex flex-col min-h-screen antialiased">
            <div className="flex-grow flex flex-col px-6 pt-6 pb-24 max-w-md mx-auto w-full">

                {/* Top bar with back button and Logo */}
                <div className="flex items-center justify-between mb-6">
                    <Link to="/login" className="p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-[#008080]" />
                        <span className="font-serif text-lg font-bold tracking-widest uppercase text-gray-900 dark:text-white">Leomenu</span>
                    </div>
                </div>

                <div className="flex items-center mb-4">
                    <div className="relative">
                        <KeyRound className="w-10 h-10 text-[#008080]" />
                        <div className="absolute -bottom-2 -right-2 bg-[#005c5c] rounded-sm p-0.5">
                            <span className="text-[10px] font-bold text-white leading-none px-1">L</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight mb-6">
                    Reset password
                </h1>

                <p className="text-[15px] text-gray-800 dark:text-gray-300 mb-8">
                    Invieremo un'e-mail alla tua casella di posta su come
                    reimpostare la password. Ricordati di controllare la
                    cartella spam.
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-6 border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                <form id="reset-form" onSubmit={handleReset} className="flex flex-col space-y-4">
                    <div className="relative border border-gray-400 dark:border-gray-600 rounded-xl bg-white dark:bg-[#262626] pt-2 px-3 pb-1 focus-within:border-[#008080] dark:focus-within:border-[#008080] transition-colors">
                        <label className="absolute -top-2 left-2 bg-white dark:bg-[#262626] px-1 text-[11px] font-bold text-[#008080]">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pt-2 pb-1 bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-[15px]"
                            placeholder="Inserisci l'email"
                        />
                    </div>
                </form>
            </div>

            <div className="fixed bottom-0 left-0 w-full z-10 px-6 pb-6 pt-2 bg-gradient-to-t from-[#FDFCF0] via-[#FDFCF0] dark:from-[#1A1A1A] dark:via-[#1A1A1A] to-transparent">
                <button
                    form="reset-form"
                    type="submit"
                    disabled={loading || !email}
                    className={`w-full py-4 text-white font-bold text-[17px] text-center transition-colors rounded-xl shadow-lg ${(loading || !email) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008080] hover:bg-teal-700'}`}
                >
                    {loading ? 'Caricamento...' : 'Reset password'}
                </button>
            </div>
        </div>
    );
}
