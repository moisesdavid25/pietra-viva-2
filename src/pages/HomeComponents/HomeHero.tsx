import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import db from '../../db';

export function HomeHero() {
  return (
      <section className="relative z-10 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 60% 50%, #F0FDF4 0%, #ffffff 65%)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-0 grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-center">

          {/* LEFT — Copy */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-xs md:text-sm font-bold tracking-wide text-[#008081] mb-8 shadow-sm">
                <Zap className="w-4 h-4" />
                <span>Gestione intelligente per il tuo ristorante</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-[#111827] tracking-tight mb-6 leading-[1.1] md:leading-[1.12]">
                Menu Digitale<br/>e Fidelizzazione<br/><span className="text-[#008081]">per Ristoranti.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-4 font-medium leading-relaxed max-w-lg">
                Gestisci la tua carta in pochi secondi e risparmia centinaia di euro in grafica e stampa.
            </p>
            <p className="text-base text-gray-400 mb-3 font-medium max-w-lg">
                Aggiorna in tempo reale dal tuo cellulare. Senza grafici, senza attese.
            </p>
            <p className="text-base text-[#008081] font-semibold mb-10">
                Configura il tuo menù in 15 minuti.
            </p>

            {/* Buttons — always stacked, full-width on mobile */}
            <div className="flex flex-col items-stretch gap-3 w-full sm:max-w-sm lg:max-w-none">
                <Link to="/register" className="w-full bg-[#008081] hover:bg-teal-600 text-white px-7 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,128,129,0.3)] hover:shadow-[0_8px_20px_rgba(0,128,129,0.4)] hover:-translate-y-0.5">
                    Inizia il tuo account gratis <ArrowRight className="w-5 h-5"/>
                </Link>
                <button onClick={async () => {
                    localStorage.setItem('pending_oauth_register', 'true');
                    await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/register' } });
                }} className="w-full bg-white border border-gray-200 text-[#111827] px-7 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Inizia gratis con Google
                </button>
            </div>

            <p className="text-sm font-medium text-gray-400 mt-5 flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-[#008081]" /> Nessuna carta di credito. Cancella quando vuoi.
            </p>

            {/* ─ Mobile ecosystem strip (hidden on lg, the floating cluster takes over) ─ */}
            <div className="lg:hidden mt-8 w-full">
              {/* Pills row */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {['🍕 Pizzeria', '☕ Bar', '🍦 Gelateria', '🍽️ Ristorante', '🍺 Pub'].map(p => (
                  <span key={p} className="text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm">{p}</span>
                ))}
              </div>
              {/* Mini analytics row */}
              <div className="flex justify-center gap-3">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 flex-1 max-w-[150px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">🌿</span>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Risparmio Stampa</p>
                  </div>
                  <p className="text-2xl font-black text-[#008081] leading-none">90%</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">vs grafico tradizionale</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 flex-1 max-w-[150px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">👨‍🍳</span>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Piatti Gestiti</p>
                  </div>
                  <p className="text-2xl font-black text-[#008081] leading-none">500+</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">dai ristoranti Leomenu</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Visual Ecosystem */}
          <div className="relative flex items-center justify-center lg:justify-end pb-8 pt-8 min-h-[520px] lg:min-h-[600px]">

            {/* Radial glow background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 bg-[#008081]/8 rounded-full blur-3xl"></div>
            </div>

            {/* ── Ecosystem pills — desktop only ── */}
            <span className="hidden lg:inline absolute top-6 left-4 text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm animate-bounce z-30" style={{ animationDuration: '3s' }}>🍕 Pizzeria</span>
            <span className="hidden lg:inline absolute top-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm animate-bounce z-30" style={{ animationDuration: '3.6s', animationDelay: '0.4s' }}>☕ Bar</span>
            <span className="hidden lg:inline absolute top-1/2 -translate-y-1/2 left-2 text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm animate-bounce z-30" style={{ animationDuration: '4.2s', animationDelay: '0.8s' }}>🍦 Gelateria</span>
            <span className="hidden lg:inline absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm animate-bounce z-30" style={{ animationDuration: '3.1s', animationDelay: '1.2s' }}>🍽️ Ristorante</span>
            <span className="hidden lg:inline absolute top-1/3 left-1/4 text-[11px] font-black text-[#008081] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-sm animate-bounce z-30" style={{ animationDuration: '2.7s', animationDelay: '0.2s' }}>🍺 Pub</span>

            {/* ── Analytics Card 1: Risparmio Stampa — desktop only ── */}
            <div className="hidden lg:block absolute top-14 right-6 bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.09)] p-3 z-20 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">🌿</span>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Risparmio Stampa</p>
              </div>
              <p className="text-2xl font-black text-[#008081] leading-none">90%</p>
              <p className="text-[8px] text-gray-400 mt-0.5">vs grafico tradizionale</p>
            </div>

            {/* ── Analytics Card 2: Piatti Gestiti — desktop only ── */}
            <div className="hidden lg:block absolute bottom-20 right-4 bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.09)] p-3 z-20 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">👨‍🍳</span>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Piatti Gestiti</p>
              </div>
              <p className="text-2xl font-black text-[#008081] leading-none">500+</p>
              <p className="text-[8px] text-gray-400 mt-0.5">dai ristoranti Leomenu</p>
            </div>

            {/* ── Pietra Viva Success Card — desktop only ── */}
            <div className="hidden lg:block absolute bottom-6 left-1 bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl shadow-[0_8px_32px_rgba(0,128,129,0.12)] p-3.5 z-20 max-w-[160px]">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-full bg-[#008081] flex items-center justify-center font-black text-white text-xs flex-shrink-0">P</div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#111827] leading-none">Pietra Viva</p>
                  <p className="text-[8px] text-[#008081] font-bold">Caso reale ✓</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: '🥩', label: 'Carne' },
                  { icon: '🐟', label: 'Pesce' },
                  { icon: '🍕', label: 'Pizza' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xs">{s.icon}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#008081]/30 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[7px] text-gray-400 mt-2 font-medium">Digitalizzato con Leomenu 🚀</p>
            </div>

            {/* ── Phone mockup (front, center-right) ── */}
            <div className="relative z-10" style={{ filter: 'drop-shadow(0 32px 48px rgba(0,128,129,0.22)) drop-shadow(0 8px 16px rgba(0,0,0,0.10))' }}>
              <div className="w-[220px] lg:w-[248px] bg-[#111827] rounded-[2.8rem] p-[9px]">
                <div className="bg-white rounded-[2.3rem] overflow-hidden" style={{ height: '480px' }}>

                  {/* Status bar */}
                  <div className="px-6 pt-4 pb-1 flex justify-between items-center bg-[#008081]">
                    <span className="text-[9px] font-bold text-white">9:41</span>
                    <div className="w-16 h-4 bg-black/40 rounded-full mx-auto -mt-1"></div>
                    <span className="text-[9px] font-bold text-white">●●●</span>
                  </div>

                  {/* Cover header — Leomenu brand */}
                  <div className="bg-gradient-to-b from-[#008081] to-teal-600 px-4 pt-3 pb-5 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg mb-1.5">
                      <Zap className="w-5 h-5 text-[#008081]" />
                    </div>
                    <p className="text-white font-extrabold text-[13px] tracking-tight leading-none">Leomenu</p>
                    <p className="text-teal-200 text-[9px] font-bold uppercase tracking-widest mt-0.5">Il tuo menu digitale</p>
                  </div>

                  {/* Category cards */}
                  <div className="px-3 pt-3 space-y-2 overflow-hidden">
                    {[
                      { label: 'Cucina',        emoji: '🍽️', from: '#1a1a2e', to: '#16213e' },
                      { label: 'Pizza',         emoji: '🍕', from: '#7f1d1d', to: '#991b1b' },
                      { label: 'Pesce',         emoji: '🐟', from: '#0c4a6e', to: '#075985' },
                      { label: 'Dessert',       emoji: '🍮', from: '#78350f', to: '#92400e' },
                      { label: 'Menù del Giorno', emoji: '⭐', from: '#008081', to: '#0d9488' },
                    ].map((cat) => (
                      <div
                        key={cat.label}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-white"
                        style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider">{cat.label}</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
              {/* Glow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#008081]/20 blur-xl rounded-full"></div>
            </div>

          </div>
        </div>
      </section>
  );
}
