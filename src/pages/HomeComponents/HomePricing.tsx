import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import db from '../../db';

export function HomePricing() {
  return (
      <section className="py-24 relative z-10 border-t border-gray-100 bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Value comparison */}
            <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-[#111827] mb-6 leading-tight tracking-tight">
                    Il prezzo che ha senso per il tuo business.
                </h3>
                <div className="space-y-5 mt-10">
                    <div className="p-6 md:p-8 rounded-2xl border border-gray-200 bg-gray-50 relative overflow-hidden flex flex-col justify-center shadow-sm">
                        <div className="absolute top-0 right-0 bg-[#111827] text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-lg uppercase tracking-widest border-b border-l border-[#111827]">The Old Way</div>
                        <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-bold mb-1">Quello che paghi a un grafico</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">150€ - 300€ <span className="text-sm text-gray-500 font-medium">/ ogni modifica</span></p>
                    </div>

                    <div className="p-6 md:p-8 rounded-2xl border-2 border-[#008081] bg-teal-50/60 relative overflow-hidden shadow-[0_4px_20px_rgba(0,128,129,0.12)]">
                        <div className="absolute top-0 right-0 bg-[#008081] text-white text-[10px] font-black px-3 py-1.5 rounded-bl-lg uppercase tracking-widest shadow-sm">The Leomenu Way</div>
                        <span className="inline-block bg-[#008081] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">Più scelto</span>
                        <p className="text-[#008081] text-xs md:text-sm uppercase tracking-widest font-black mb-1">Aggiornamenti istantanei</p>
                        <p className="text-4xl md:text-5xl font-extrabold text-[#111827]">0€</p>
                        <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed">Prova gratuita con accesso totale. Sperimenta l'impatto reale sulle vendite senza impegni.</p>
                    </div>
                </div>
            </div>

            {/* CTA Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#008081]"></div>

                <div className="mb-8">
                    <h4 className="text-2xl font-bold text-[#111827] mb-2">Inizia gratis oggi.</h4>
                    <p className="text-gray-500 text-sm font-medium">Nessuna carta di credito. Cancella quando vuoi.</p>
                </div>

                <ul className="space-y-3 mb-8">
                    {[
                        'Menù digitale attivo in 15 minuti',
                        'QR Code personalizzato incluso',
                        'Gestione ordini e comande',
                        'Fidelity card per i tuoi clienti',
                    ].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-[#008081] flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>

                <Link
                    to="/register"
                    className="w-full bg-[#008081] text-white hover:bg-teal-600 hover:shadow-[0_10px_15px_-3px_rgba(0,150,136,0.4)] py-4 rounded-lg font-bold text-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    Crea il tuo account gratis <ArrowRight className="w-5 h-5" />
                </Link>

                <button
                    onClick={async () => {
                        localStorage.setItem('pending_oauth_register', 'true');
                        await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/register' } });
                    }}
                    className="w-full mt-3 bg-white border border-gray-200 text-[#111827] py-4 rounded-lg font-bold text-base transition-all hover:shadow-md flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Inizia gratis con Google
                </button>

                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    I tuoi dati sono al sicuro
                </p>
            </div>
        </div>
      </section>
  );
}
