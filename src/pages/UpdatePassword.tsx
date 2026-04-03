import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Eye, EyeOff } from 'lucide-react';
import db from '../db';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Check if user has an active session to actually change the password
    useEffect(() => {
        db.auth.getSession().then(({ data: { session } }) => {
            if (!session && !success) {
                // Not authenticated and not recovering, might just redirect or ignore
                // Usually reaching this page implies they clicked an email link which logs them in
            }
        });
    }, [success]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Le password non corrispondono.');
            return;
        }

        if (password.length < 8) {
            setError('La password deve essere di almeno 8 caratteri.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { error: updateError } = await db.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
        } catch (err: any) {
            setError("Si è verificato un errore durante l'aggiornamento della password. Riprova.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans flex flex-col min-h-screen antialiased">
                <div className="flex-grow flex flex-col px-6 pt-12 pb-24 max-w-md mx-auto w-full text-center">
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2">
                            <Utensils className="w-10 h-10 text-[#008081]" />
                            <span className="font-sans text-3xl font-bold tracking-widest uppercase text-gray-900 dark:text-white">Leomenu</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight mb-6">
                        Il mio account
                    </h1>

                    <p className="text-[16px] text-gray-800 dark:text-gray-300">
                        La tua password è stata reimpostata con successo. Accedi con la tua nuova password.
                    </p>

                    <button
                        onClick={() => navigate('/login')}
                        className="mt-12 w-full py-4 bg-[#008081] text-white font-bold text-[17px] text-center transition-all duration-300 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1"
                    >
                        Vai al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans flex flex-col min-h-screen antialiased">
            <div className="flex-grow flex flex-col px-6 pt-8 pb-32 max-w-md mx-auto w-full">
                {/* Top bar with Logo */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-6 h-6 text-[#008081]" />
                        <span className="font-sans text-lg font-bold tracking-widest uppercase text-gray-900 dark:text-white">Leomenu</span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight mb-8">
                    Cambia password
                </h1>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-6 border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                <form id="update-form" onSubmit={handleUpdate} className="flex flex-col space-y-6">
                    <div className="relative pb-2 transition-colors">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#FBFBFB] rounded-3xl shadow-premium p-4 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-[16px] pr-12 focus:ring-2 focus:ring-[#008081]/20 transition-all duration-300"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-800 dark:text-gray-300 hover:text-[#008081] dark:hover:text-[#008081]"
                        >
                            {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                    </div>

                    <div className="relative pb-2 transition-colors">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#FBFBFB] rounded-3xl shadow-premium p-4 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-[16px] pr-12 focus:ring-2 focus:ring-[#008081]/20 transition-all duration-300"
                            placeholder="Conferma password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-800 dark:text-gray-300 hover:text-[#008081] dark:hover:text-[#008081]"
                        >
                            {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                    </div>
                </form>

                <div className="mt-8 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mt-1 flex-shrink-0"></div>
                        <span>La password deve essere di minimo 8 caratteri</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mt-1 flex-shrink-0"></div>
                        <span>La password deve essere inferiore o uguale a 72 caratteri</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mt-1 flex-shrink-0"></div>
                        <span>Deve contenere caratteri maiuscoli e minuscoli</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mt-1 flex-shrink-0"></div>
                        <span>Deve contenere un numero</span>
                    </div>
                </div>

                <div className="mt-12 space-y-4">
                    <button
                        form="update-form"
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                        className={`w-full py-4 text-white font-bold text-[17px] text-center transition-all duration-300 rounded-3xl shadow-premium hover:shadow-lg hover:-translate-y-1 ${loading || !password ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008081]'}`}
                    >
                        {loading ? 'Caricamento...' : 'Reset password'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-transparent border-2 border-[#008081] text-[#008081] font-bold text-[17px] text-center transition-colors rounded-xl hover:bg-[#008081]/10"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    );
}



