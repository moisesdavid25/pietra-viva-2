import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, QrCode, MonitorSmartphone, LayoutDashboard, Utensils, Zap, Users, ShieldCheck, ArrowRight, BarChart, Settings, Mail } from 'lucide-react';

export default function ComeFunziona() {
  return (
    <div className="pt-20 pb-0 bg-white min-h-screen font-sans selection:bg-[#008081] selection:text-white overflow-hidden">
      
      {/* 1. Hero Section */}
      <div className="max-w-4xl mx-auto text-center px-6 md:px-12 mb-20 relative z-10 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-[#008081] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
          <Settings className="w-4 h-4" /> La Piattaforma Completa
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#111827] mb-6 tracking-tight leading-tight">
          Pieno controllo del tuo locale.<br />
          <span className="text-[#008081]">In 4 passaggi.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Leomenu non è solo un menù in PDF. È un ecosistema unico che unisce la presa degli ordini, l'esperienza del cliente e il tuo database marketing. Guarda come funziona sotto il cofano.
        </p>
      </div>

      {/* 2. Step-by-Step Overview */}
      <div className="max-w-6xl mx-auto px-6 space-y-32 mb-32">

        {/* STEP 1: Digital Menu */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#008081]/20 to-transparent blur-3xl rounded-full"></div>
            <div className="bg-gray-100 border border-gray-200 rounded-[2rem] p-6 shadow-2xl relative z-10 aspect-square flex flex-col items-center justify-center overflow-hidden">
              <div className="text-9xl mb-4 opacity-90 transition-transform hover:scale-110">🍔</div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 mt-4 text-center">
                <span className="block font-black text-xs text-[#008081] uppercase">Filtro Attivo</span>
                <span className="block font-bold mt-1 text-gray-700">Senza Glutine & Vegano</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#008081] font-black text-xl mb-6 shadow-sm border border-teal-100">1</div>
            <h3 className="text-3xl font-extrabold text-[#111827] mb-4">Il Menù Digitale Intelligente</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6 text-lg">
              I clienti scansionano il Qr-Code o toccano il Tag NFC sul tavolo. Immediatamente si apre un'app immersiva sul loro telefono (senza scaricare nulla) con foto ad alta risoluzione del cibo.
            </p>
            <ul className="space-y-4">
              {['Up-Selling automatico con foto attrattive.', 'Multilingua per turisti.', 'Filtri salvavita per Allergeni e Diete.'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#111827] font-bold">
                  <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#008081]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* STEP 2: LeoPOS (Waiter Terminal) */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl mb-6 shadow-sm border border-blue-100">2</div>
            <h3 className="text-3xl font-extrabold text-[#111827] mb-4">La Sala: Ti presentiamo LeoPOS</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6 text-lg">
              Abbiamo trasformato il vecchio blocchetto degli ordini in un Terminale di Sala ultra-reattivo per i tuoi camerieri (Tablet o Smartphone). Prendi comande complesse al volo, direttamente al tavolo.
            </p>
            <ul className="space-y-4">
              {['Mappa Interattiva della Sala (Drag & Drop).', 'Aggiunta rapida di variazioni (Senza Cipolla, Extra Bacon).', 'Invio comande diretto con un tap.'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#111827] font-bold">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent blur-3xl rounded-full"></div>
             <div className="bg-[#111827] border border-gray-800 rounded-[2rem] p-6 shadow-2xl relative z-10 aspect-square flex flex-col items-center justify-center overflow-hidden">
                {/* Simulated LeoPOS UI */}
                <div className="w-full bg-[#1F2937] rounded-xl p-4 mb-4 border border-gray-700 flex justify-between items-center text-white">
                  <span className="font-bold text-sm tracking-widest uppercase text-gray-400">Tavolo 4</span>
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-black">€42.50</span>
                </div>
                <div className="flex gap-2 w-full">
                  <div className="flex-1 bg-white/10 p-4 rounded-xl text-white font-bold text-center border border-white/5">🍔 Burger</div>
                  <div className="flex-1 bg-white/10 p-4 rounded-xl text-white font-bold text-center border border-white/5">🍺 Birra</div>
                </div>
                <div className="mt-4 w-full bg-red-500/20 text-red-400 font-bold p-3 rounded-xl border border-red-500/30 text-xs text-center uppercase">
                  Senza Pomodoro
                </div>
             </div>
          </div>
        </div>

        {/* STEP 3: Passport (Fidelity) */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent blur-3xl rounded-full"></div>
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-800 rounded-[2rem] p-6 shadow-2xl relative z-10 aspect-square flex flex-col items-center justify-center overflow-hidden">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
                <Users className="w-10 h-10 text-purple-300" />
              </div>
              <h4 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Global Passport</h4>
              <p className="text-purple-300 font-medium text-sm text-center">Il database clienti definitivo.</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-black text-xl mb-6 shadow-sm border border-purple-100">3</div>
            <h3 className="text-3xl font-extrabold text-[#111827] mb-4">La Fedeltà: Global Passport</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6 text-lg">
              La vera miniera d'oro per i ristoratori non è la singola cena, ma la ri-frequentazione. Cattura le email dei tuoi clienti in modo organico.
            </p>
            <ul className="space-y-4">
              {['Regala Coupon di Benvenuto in cambio dell\'email.', 'Invia promozioni mirate (Es: Sconto del giovedì).', 'Costruisci un database clienti 100% tuo e norma GDPR.'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#111827] font-bold">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* STEP 4: Dashboard */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 font-black text-xl mb-6 shadow-sm border border-gray-200">4</div>
            <h3 className="text-3xl font-extrabold text-[#111827] mb-4">Il Controllo: Backend Dashboard</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6 text-lg">
              L'ufficio del gestore. Cambia i prezzi in tempo reale quando rincara la materia prima, spegni i piatti finiti in un tocco dall'iPad e analizza le statistiche.
            </p>
            <ul className="space-y-4">
              {['Metriche in Tempo Reale (Piatti più visitati e venduti).', 'Gestione Istantanea (Nascondi piatti terminati al volo).', 'Esportazione Dati per il commercialista.'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#111827] font-bold">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <BarChart className="w-4 h-4 text-gray-800" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-transparent blur-3xl rounded-full"></div>
             <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-2xl relative z-10 aspect-square flex flex-col items-center justify-center overflow-hidden">
                {/* Fake Analytics Graph */}
                <div className="w-full flex items-end justify-between h-32 px-4 gap-2 mb-6 border-b border-gray-100 pb-2">
                   {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                     <div key={i} className="w-full bg-[#008081] rounded-t-sm" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
                <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 font-bold text-center text-gray-800 text-sm">
                   Prodotto più venduto: <span className="text-[#008081]">Tiramisù (+24%)</span>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* 5. Bottom CTA Section */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <MonitorSmartphone className="w-12 h-12 text-[#008081] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Niente configurazioni complesse.
          </h2>
          <p className="text-lg text-gray-400 font-medium mb-10 max-w-2xl mx-auto">
            Registrati, inserisci il tuo listino e inizia a usare l'ecosistema in meno di 15 minuti. Se sai usare una tastiera, sai usare Leomenu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-[#008081] text-white font-extrabold px-8 py-4 rounded-xl hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(0,128,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
              Inizia Ora (14 giorni gratis) <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
