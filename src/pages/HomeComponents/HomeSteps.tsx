import React from 'react';

export function HomeSteps() {
  return (
      <section className="py-24 relative z-10 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #F9FAFB, #ffffff)' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-black text-[#008081] uppercase tracking-[0.2em] mb-3">Come iniziare</p>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-20 tracking-tight">Evolvere è così semplice.</h3>
            
            <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative">

                {/* Dashed connector line */}
                <div className="hidden md:flex absolute top-[38px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
                  <div className="w-full border-t-2 border-dashed border-[#008081]/25"></div>
                </div>

                {/* Step 1 */}
                <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 relative z-10 hover:-translate-y-1 transition-transform duration-300">
                    <div className="relative mb-7">
                      <div className="absolute inset-0 bg-[#008081]/15 rounded-full blur-md scale-125"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#008081] to-teal-500 flex items-center justify-center text-lg font-black text-white shadow-[0_4px_14px_rgba(0,128,129,0.4)]">1</div>
                    </div>
                    <h4 className="text-lg font-extrabold text-[#111827] mb-2 tracking-tight">Registrati</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Crea il tuo account in meno di un minuto.</p>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 relative z-10 hover:-translate-y-1 transition-transform duration-300">
                    <div className="relative mb-7">
                      <div className="absolute inset-0 bg-[#008081]/15 rounded-full blur-md scale-125"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#008081] to-teal-500 flex items-center justify-center text-lg font-black text-white shadow-[0_4px_14px_rgba(0,128,129,0.4)]">2</div>
                    </div>
                    <h4 className="text-lg font-extrabold text-[#111827] mb-2 tracking-tight">Carica i tuoi piatti</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Aggiungi prodotti, prezzi e allergeni con il nostro creatore rapido.</p>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 relative z-10 hover:-translate-y-1 transition-transform duration-300">
                    <div className="relative mb-7">
                      <div className="absolute inset-0 bg-[#008081]/15 rounded-full blur-md scale-125"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#008081] to-teal-500 flex items-center justify-center text-lg font-black text-white shadow-[0_4px_14px_rgba(0,128,129,0.4)]">3</div>
                    </div>
                    <h4 className="text-lg font-extrabold text-[#111827] mb-2 tracking-tight">Stampa il tuo QR</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Applica il QR sui tavoli e inizia a vendere.</p>
                </div>

            </div>
        </div>
      </section>
  );
}
