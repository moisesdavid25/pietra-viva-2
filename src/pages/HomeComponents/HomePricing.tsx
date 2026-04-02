import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HomePricing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', restaurantName: '', email: '' });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/register', { state: { prefill: formData } });
  };

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
                        <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed">Prova gratuita con accesso totale. Sperimenta l’impatto reale sulle vendite senza impegni.</p>
                    </div>
                </div>
            </div>
            
            {/* 3-Field Lead Capture Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#008081]"></div>
                
                <div className="mb-8">
                    <h4 className="text-2xl font-bold text-[#111827] mb-2">Crea il tuo account gratis</h4>
                    <p className="text-gray-500 text-sm font-medium">Compila il modulo e accedi al tuo pannello in pochi secondi.</p>
                </div>
                
                <form onSubmit={handleRegister} className="space-y-5 flex flex-col">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Il tuo nome</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3.5 text-[#111827] text-base focus:outline-none focus:border-[#008081] focus:ring-1 focus:ring-[#008081] transition-all placeholder:text-gray-300 shadow-sm" placeholder="Es. Carlo Rossi" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nome del locale</label>
                        <input required type="text" value={formData.restaurantName} onChange={e => setFormData({...formData, restaurantName: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3.5 text-[#111827] text-base focus:outline-none focus:border-[#008081] focus:ring-1 focus:ring-[#008081] transition-all placeholder:text-gray-300 shadow-sm" placeholder="Es. Pizzeria Napoli" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3.5 text-[#111827] text-base focus:outline-none focus:border-[#008081] focus:ring-1 focus:ring-[#008081] transition-all placeholder:text-gray-300 shadow-sm" placeholder="la.tua@email.com" />
                    </div>
                    <button type="submit" className="w-full bg-[#008081] text-white hover:bg-teal-600 hover:shadow-[0_10px_15px_-3px_rgba(0,150,136,0.4)] py-4 rounded-lg font-bold text-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4">
                        Inizia Ora <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        I tuoi dati sono al sicuro
                    </p>
                </form>
            </div>
        </div>
      </section>
  );
}
