import { Link } from 'react-router-dom';
import { Utensils, ArrowRight } from 'lucide-react';

export default function Landing() {
    return (
        <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
            <header className="px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Utensils className="w-8 h-8 text-[#008080]" />
                    <h1 className="font-serif text-2xl font-bold tracking-widest uppercase">Leomenu</h1>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-4 py-2 font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors">
                        Accedi
                    </Link>
                    <Link to="/register" className="px-4 py-2 bg-[#008080] text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-colors">
                        Crea il tuo menù
                    </Link>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-12">
                <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6">
                    Il tuo menù digitale,<br />
                    <span className="text-[#008080] italic">pronto in pochi minuti.</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl">
                    Leomenu è la piattaforma più veloce ed elegante per creare il menù QR del tuo ristorante o pizzeria. Unisciti oggi e modernizza l'esperienza dei tuoi clienti.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link to="/register" className="px-8 py-4 bg-[#008080] text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2 text-lg">
                        Inizia gratis <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a href="/pietra-viva" className="px-8 py-4 bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-800 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center text-lg">
                        Guarda la Demo (Pietra Viva)
                    </a>
                </div>
            </main>
        </div>
    );
}
