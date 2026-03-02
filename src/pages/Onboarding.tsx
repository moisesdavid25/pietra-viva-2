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
        <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center p-6 text-center">
            <div className="bg-white dark:bg-[#262626] p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-800">
                <h1 className="text-2xl font-serif font-bold text-[#008080] mb-4">Benvenuto!</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Il tuo account non è ancora associato a nessun ristorante. Per favore, contatta l'amministratore per completare la configurazione.
                </p>
                <button
                    onClick={handleLogout}
                    className="w-full bg-[#008080] hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Torna alla Home y Esci
                </button>
            </div>
        </div>
    );
}
