import React from 'react';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export function HomeSuccess() {
  return (
      <section className="py-24 px-6 relative z-10 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(0,128,129,0.05) 0%, transparent 70%), #ffffff' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* LEFT: Copy */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full w-fit mb-6">
              <Zap className="w-3 h-3" /> Caso di Successo
            </span>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827] leading-tight tracking-tight mb-6">
              Da carta stampata<br/>a ecosistema digitale.
            </h3>
            <p className="text-lg text-gray-500 leading-relaxed font-medium mb-8">
              Abbiamo trasformato la carta tradizionale di Pietra Viva in un ecosistema digitale dinamico, rendendo l&apos;offerta più versatile e attraente per ogni cliente.
            </p>
            <div className="space-y-3">
              {[
                'Menu aggiornato in tempo reale dal cellulare',
                'Sistema di Stelle per la fidelizzazione clienti',
                'QR code su ogni tavolo — zero attese',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#008081] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#008081] flex items-center justify-center font-black text-white text-lg shadow-md">P</div>
              <div>
                <p className="font-bold text-[#111827] text-sm">Pietra Viva</p>
                <p className="text-xs text-gray-400">Ristorante — Partner Leomenu</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Smartphone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative" style={{ filter: 'drop-shadow(0 40px 60px rgba(0,128,129,0.18)) drop-shadow(0 10px 20px rgba(0,0,0,0.10))' }}>
              {/* Phone Shell */}
              <div className="w-[280px] bg-[#111827] rounded-[3rem] p-[10px] shadow-2xl">
                {/* Screen */}
                <div className="bg-white rounded-[2.4rem] overflow-hidden" style={{ height: '560px' }}>

                  {/* Status bar */}
                  <div className="bg-white px-6 pt-5 pb-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#111827]">9:41</span>
                    <div className="w-20 h-5 bg-[#111827] rounded-full mx-auto -mt-2"></div>
                    <span className="text-[10px] font-bold text-[#111827]">●●●</span>
                  </div>

                  {/* App Header */}
                  <div className="px-5 pb-3 pt-2 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-[#008081] uppercase tracking-widest">Leomenu</p>
                      <p className="text-[14px] font-extrabold text-[#111827] leading-tight">Menu Digitale</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#008081] flex items-center justify-center shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Section Label */}
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em]">Antipasti</p>
                  </div>

                  {/* Menu Items — clean list, no descriptions, price as placeholder */}
                  <div className="px-5 space-y-px">
                    {[
                      { name: 'Bruschette al pomodoro', emoji: '🍅' },
                      { name: 'Burrata con prosciutto', emoji: '🧀' },
                      { name: 'Carpaccio di manzo', emoji: '🥩' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base flex-shrink-0">{item.emoji}</div>
                        <p className="flex-1 text-[12px] font-semibold text-[#111827] truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-gray-400">€</span>
                          <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section Label 2 */}
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.12em]">Primi Piatti</p>
                  </div>

                  <div className="px-5 space-y-px">
                    {[
                      { name: 'Tagliatelle al ragù', emoji: '🍝' },
                      { name: 'Risotto ai funghi porcini', emoji: '🍚' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base flex-shrink-0">{item.emoji}</div>
                        <p className="flex-1 text-[12px] font-semibold text-[#111827] truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-gray-400">€</span>
                          <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Menù del Giorno — pinned at bottom */}
                  <div className="mx-4 mt-4 bg-gradient-to-r from-[#008081] to-teal-600 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-teal-200 uppercase tracking-wider mb-0.5">Bundle Speciale</p>
                      <p className="text-[12px] font-extrabold text-white">Menù del Giorno</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-white/70">€</span>
                      <div className="w-8 h-2 bg-white/30 rounded-full"></div>
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center ml-1">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              {/* Glow underneath */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-[#008081]/20 blur-2xl rounded-full"></div>
            </div>
          </div>

        </div>
      </section>
  );
}
