import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#FDFCF0] dark:bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center text-gray-900 dark:text-[#FDFCF0]">
            <SearchX className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-6" />
            <h1 className="text-4xl font-serif font-bold mb-4">Ristorante non trovato</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Non siamo riusciti a trovare il menù che stai cercando. L'indirizzo potrebbe essere errato o il ristorante non utilizza più la nostra piattaforma.
            </p>
            <Link
                to="/"
                className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-xl shadow hover:bg-teal-700 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Torna alla Home di Leomenu
            </Link>
        </div>
    );
}
