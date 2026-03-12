import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import db from '../db';

export default function Onboarding() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await db.auth.signOut();
        navigate('/');
    };

    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center p-6 text-center">
            <div className="bg-[#FBFBFB] dark:bg-[#262626] p-8 rounded-3xl shadow-premium max-w-md w-full border border-transparent dark:border-gray-800">
                <h1 className="text-2xl font-serif font-extrabold text-[#008080] mb-4 tracking-wide">Benvenuto!</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                    Il tuo account non è ancora associato a nessun ristorante. Per favore, contatta l'amministratore per completare la configurazione.
                </p>
                <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-[#008080] to-teal-500 hover:shadow-lg text-white font-bold py-4 rounded-3xl shadow-premium transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Torna alla Home ed Esci
                </button>
            </div>
        </div>
    );
}
