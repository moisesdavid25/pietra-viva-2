import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Globe2, ShieldAlert, Award, TrendingUp, BellRing, ArrowRight, Zap, Target, Smartphone, BarChart } from 'lucide-react';

export default function Funzionalita() {
  return (
    <div className="pt-20 pb-0 bg-white min-h-screen font-sans selection:bg-[#008081] selection:text-white overflow-hidden">
      
      {/* 1. Hero Section */}
      <div className="max-w-4xl mx-auto text-center px-6 md:px-12 mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-[#008081] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
          <Zap className="w-4 h-4" fill="currentColor" /> Ecosistema Completo
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#111827] mb-6 tracking-tight leading-tight">
          Il tuo locale, <br className="hidden md:block"/>
          <span className="text-[#008081]">collegato e automatizzato.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Sostituisci il PDF illeggibile con una suite che vende di più da sola, fidelizza i clienti e analizza cosa funziona nel tuo menù.
        </p>
      </div>

      {/* 2. Features Zig-Zag Layout */}
      <div className="space-y-32 md:space-y-40 pb-32">

        {/* Feature 1: Menù Digitale Avanzato */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Texto (Left) */}
            <div className="order-2 lg:order-1">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-8 border border-teal-100 shadow-sm">
                <QrCode className="w-7 h-7 text-[#008081]" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-6">Un'esperienza visiva che fa venire fame.</h2>
              <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
                Il 65% dei clienti spende di più se vede una foto in alta qualità prima di ordinare. Esci dall'era dei menù cartacei macchiati e aggiorna i tuoi piatti in 2 secondi dal tuo smartphone.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Globe2 className="w-6 h-6 text-[#008081] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Traduzione Multi-lingua Nativa</h4>
                    <p className="text-sm text-gray-500 font-medium">Turisti tedeschi, inglesi o francesi? Nessun problema. Traduciamo automaticamente il menù per servire chiunque con la massima professionalità.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <ShieldAlert className="w-6 h-6 text-[#008081] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Normativa Allergeni (Legge 1169/2011)</h4>
                    <p className="text-sm text-gray-500 font-medium">Evita multe e rassicura i tuoi clienti. Assegna i 14 allergeni obbligatori UE ad ogni piatto con dei badge visivi chiarissimi.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Imagen/Mocukup (Right) */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-50 to-blue-50 transform rotate-3 rounded-3xl -z-10"></div>
              <div className="bg-white border-2 border-gray-100 shadow-2xl rounded-3xl p-6 relative z-0 overflow-hidden group">
                {/* Simulated UI App Concept */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100/50 group-hover:border-teal-100 transition-colors">
                      <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden relative">
                         <div className={`absolute inset-0 bg-gradient-to-tr ${i===1 ? 'from-orange-100 to-amber-50' : i===2 ? 'from-green-100 to-emerald-50' : 'from-blue-100 to-cyan-50'}`}></div>
                         <div className="absolute top-1 right-1 bg-white p-1 rounded font-black text-[8px] text-[#111827]">VEG</div>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-gray-300 rounded-full mb-2"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded-full mb-3"></div>
                        <div className="flex gap-1">
                          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-[8px]">🥜</div>
                          <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center text-[8px]">🌾</div>
                        </div>
                      </div>
                      <div className="h-6 w-12 bg-[#008081]/10 rounded-full flex items-center justify-center text-[#008081] text-[10px] font-bold shrink-0">€14</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Passport & Fidelità */}
        <section className="bg-[#F8F9FA] py-24 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Imagen/Mocukup (Left) */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#111827] to-gray-800 transform -rotate-2 rounded-3xl -z-10 shadow-xl"></div>
              <div className="bg-[#1A1A1A] border-2 border-gray-800 shadow-2xl rounded-3xl p-8 relative z-0 overflow-hidden text-white backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#008081] to-teal-900 rounded-full flex items-center justify-center shadow-inner border border-teal-500">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl">Il Tuo Passport</h3>
                    <p className="text-gray-400 text-sm font-medium">Livello: Gold Member</p>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Punti Fedeltà</span>
                    <span className="text-2xl font-black text-[#008081] tracking-tight">2.450 pt</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-800">
                    <div className="bg-gradient-to-r from-teal-600 to-[#008081] h-3 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-right">Mancano 50pt per Sconto 10%</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30 text-center">
                     <span className="block text-2xl mb-1">🍔</span>
                     <span className="text-gray-400 text-xs font-bold">Amante Carne</span>
                   </div>
                   <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30 text-center">
                     <span className="block text-2xl mb-1">🔥</span>
                     <span className="text-gray-400 text-xs font-bold">Spicy Fan</span>
                   </div>
                </div>
              </div>
            </div>
            {/* Texto (Right) */}
            <div>
              <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mb-8 border border-gray-800 shadow-lg shadow-gray-900/20">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-6">Chi mangia da te, torna da te.</h2>
              <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
                Il Global Passport trasforma i clienti di passaggio in clienti abituali. Usa la gamification per premiarli a ogni visita e raccogli preziose email e abitudini di consumo in modo automatico.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Target className="w-6 h-6 text-[#111827] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Targetizzazione (Taste Profile)</h4>
                    <p className="text-sm text-gray-500 font-medium">Scopri se i tuoi clienti amano i piatti piccanti o vegetariani; usa il loro "Profilo di Gusto" per proporre suggerimenti infallibili.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Smartphone className="w-6 h-6 text-[#111827] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Nessuna App da scaricare</h4>
                    <p className="text-sm text-gray-500 font-medium">Crea un muro di fedeltà senza frizione. I clienti accumulano punti direttamente scannerizzando il tuo QR o appoggiando lo smartphone (NFC).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3: Business Intelligence */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Texto (Left) */}
            <div className="order-2 lg:order-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 shadow-sm">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-6">Trasforma i dati in decisioni e profitto.</h2>
              <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
                Ogni azione, click e scansione sul tuo menù genera dati. La nostra Dashboard di Business Intelligence li mastica e te li serve pronti all'uso per tagliare gli sprechi.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <BarChart className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Dashboard Metriche Chiave</h4>
                    <p className="text-sm text-gray-500 font-medium">Identifica in tempo reale i tuoi "Bestseller" e i prodotti poco visualizzati per aggiustare il posizionamento e la promozione.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-[#111827] mb-1">Controllo Flussi</h4>
                    <p className="text-sm text-gray-500 font-medium">Analizza i picchi d'orario (Day/Week) per organizzare ottimamente i turni del tuo staff basandoti su dati veri, non su supposizioni.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Imagen/Mocukup (Right) */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-indigo-50 transform rotate-2 rounded-3xl -z-10 shadow-inner"></div>
              <div className="bg-white border text-gray-800 shadow-2xl rounded-3xl p-6 relative z-0 overflow-hidden font-mono">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-gray-400 mb-1">Conversion Rate (Menu)</h4>
                      <p className="text-3xl font-black text-[#111827]">14.2%</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">+2.4% <TrendingUp className="w-3 h-3"/></div>
                 </div>
                 {/* Fake Chart bars */}
                 <div className="flex items-end gap-2 h-32 mb-6 border-b border-gray-100 pb-2">
                    {[40, 60, 45, 80, 50, 90, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-100/50 rounded-t-sm relative group overflow-hidden" style={{ height: '100%' }}>
                        <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-700 delay-100 group-hover:bg-indigo-600" style={{ height: `${h}%` }}></div>
                      </div>
                    ))}
                 </div>
                 <h4 className="text-xs uppercase font-bold text-gray-400 mb-4">Top 3 Prodotti (Click)</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Pizza Margherita</span><span className="font-black text-gray-400">432</span></div>
                    <div className="flex justify-between text-sm"><span className="font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>Tiramisù della casa</span><span className="font-black text-gray-400">312</span></div>
                    <div className="flex justify-between text-sm"><span className="font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-300"></span>Birra IPA Media</span><span className="font-black text-gray-400">289</span></div>
                 </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* 3. Bottom CTA Section */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <BellRing className="w-12 h-12 text-[#008081] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Pronto a lasciare il menù cartaceo al museo?
          </h2>
          <p className="text-lg text-gray-400 font-medium mb-10 max-w-2xl mx-auto">
            Abbandona i costi di stampa, i Pdf che non si leggono e vendi l'esperienza definitiva a chi si siede ai tuoi tavoli. Crea un account e inizia a digitalizzare tutto oggi stesso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-[#008081] text-white font-extrabold px-8 py-4 rounded-xl hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(0,128,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
              Inizia Ora (Gratis) <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/prezzi" className="w-full sm:w-auto bg-white/10 text-white font-extrabold px-8 py-4 rounded-xl hover:bg-white/20 border border-white/10 transition-colors flex items-center justify-center">
              Vedi i Piani Dettagliati
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
