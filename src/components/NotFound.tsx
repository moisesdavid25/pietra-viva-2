import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F0F0F0] dark:bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center text-[#1A1A1A] dark:text-[#FDFCF0]">
            <SearchX className="w-24 h-24 text-[#008081]/60 mb-6" />
            <h1 className="text-4xl font-sans font-extrabold mb-4 tracking-wide">Ristorante non trovato</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Non siamo riusciti a trovare il menù che stai cercando. L'indirizzo potrebbe essere errato o il ristorante non utilizza più la nostra piattaforma.
            </p>
            <Link
                to="/"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#008081] to-teal-500 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
                <ArrowLeft className="w-5 h-5" />
                Torna alla Home di Leomenu
            </Link>
        </div>
    );
}



