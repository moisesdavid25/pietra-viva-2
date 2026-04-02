import React from 'react';
import { Smartphone, TrendingUp, QrCode } from 'lucide-react';

export function HomeBenefits() {
  return (
      <section className="py-28 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-black text-[#008081] uppercase tracking-[0.2em] mb-3">Perché Leomenu</p>
          <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">Un ecosistema, non solo un menù.</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1 */}
            <div className="group relative bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,128,129,0.12)] hover:-translate-y-1.5 hover:border-[#008081]/30 transition-all duration-300 cursor-default overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008081] to-teal-600 flex items-center justify-center mb-6 shadow-[0_4px_14px_rgba(0,128,129,0.35)]">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-[#111827] mb-3 tracking-tight">Addio alla tipografia</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                    Cambia prezzi e piatti all&apos;istante dal tuo cellulare. Senza pagare grafici né aspettare stampe.
                </p>
            </div>
            
            {/* Card 2 */}
            <div className="group relative bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,128,129,0.12)] hover:-translate-y-1.5 hover:border-[#008081]/30 transition-all duration-300 cursor-default overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008081] to-teal-600 flex items-center justify-center mb-6 shadow-[0_4px_14px_rgba(0,128,129,0.35)]">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-[#111827] mb-3 tracking-tight">Fidelizzazione Intelligente</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                    Più di un menù: un motore di fedeltà che protegge il tuo ROI e automatizza il ritorno dei tuoi clienti con il nostro sistema di Stelle.
                </p>
            </div>
            
            {/* Card 3 */}
            <div className="group relative bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,128,129,0.12)] hover:-translate-y-1.5 hover:border-[#008081]/30 transition-all duration-300 cursor-default overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008081] to-teal-600 flex items-center justify-center mb-6 shadow-[0_4px_14px_rgba(0,128,129,0.35)]">
                    <QrCode className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-[#111827] mb-3 tracking-tight">Ordini PRO</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                    Gestione in tempo reale di tavolo e asporto senza attrito. Il cliente scansiona il QR e ordina all&apos;istante.
                </p>
            </div>
        </div>
      </section>
  );
}
