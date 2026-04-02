import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, HelpCircle, XCircle } from 'lucide-react';

export default function Prezzi() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="pt-20 pb-32 bg-[#FBFBFB] min-h-screen font-sans selection:bg-[#008081] selection:text-white">
      {/* 1. Header Section */}
      <div className="max-w-4xl mx-auto text-center px-6 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#111827] mb-6 tracking-tight">
          Investimento minimo. <br className="hidden md:block"/>
          <span className="text-[#008081]">Ritorno infinito.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Piani trasparenti e senza sorprese. Ripagati l'abbonamento con i soldi che risparmieresti alla prima modifica di un menù stampato.
        </p>
      </div>

      {/* 2. Billing Toggle */}
      <div className="flex justify-center mb-16 px-6">
        <div className="bg-white p-1.5 rounded-full border border-gray-200 inline-flex items-center shadow-sm relative">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${!isAnnual ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Fatturazione Mensile
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isAnnual ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Fatturazione Annuale
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black transition-colors ${isAnnual ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>-2 Mesi Gratis</span>
          </button>
          
          {/* Sliding Background */}
          <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#F8F9FA] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 transition-transform duration-500 ease-spring ${isAnnual ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`}></div>
        </div>
      </div>

      {/* 3. Pricing Cards */}
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center mb-24">
        
        {/* Starter / Free Trial Card */}
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-200 hover:border-gray-300 shadow-sm transition-all h-full flex flex-col">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">Trial Gratuito</span>
            <h3 className="text-2xl font-extrabold text-[#111827] mb-2">Pieno Potere</h3>
            <p className="text-gray-500 text-sm font-medium">Testa l'intera piattaforma nel tuo ristorante prima di prendere una decisione.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-[#111827]">0€</span>
            </div>
            <p className="text-gray-400 font-semibold mt-2 text-sm">per 14 giorni</p>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            {[
              "Menù digitale completo (QR code)",
              "Modifiche illimitate in tempo reale",
              "Traduzione multilingua automatica",
              "Nessuna carta di credito richiesta"
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
          <Link to="/register" className="block w-full text-center py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-extrabold hover:bg-gray-50 hover:border-gray-300 transition-all">
            Inizia Demo Gratuita
          </Link>
        </div>

        {/* Pro / Primary Card */}
        <div className="bg-[#111827] rounded-3xl p-8 md:p-10 border-2 border-[#008081] shadow-2xl relative transform md:-translate-y-4 h-full flex flex-col">
          <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
            <span className="bg-[#008081] text-white text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg shadow-[#008081]/30 border border-teal-500">Il Più Scelto</span>
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-white mb-2">Licenza Professionale</h3>
            <p className="text-gray-400 text-sm font-medium">Tutto il necessario per digitalizzare l'esperienza al tavolo e fidelizzare i clienti.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">{isAnnual ? '15' : '19'}€</span>
              <span className="text-gray-400 font-bold text-lg">/mese</span>
            </div>
            <p className="text-[#008081] font-bold mt-2 text-sm">
              {isAnnual ? 'Fatturazione unica annuale di 180€' : 'Fatturazione mensile ricorrente'}
            </p>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            {[
              "Categorie e prodotti illimitati",
              "Filtri Allergeni intelligenti (Normativa UE)",
              "Analytics vendite e scansioni",
              "Programma Fedeltà (Passport) integrato",
              "Gestione liste d'attesa (Call Waiter)",
              "Supporto tecnico prioritario 7/7"
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#008081] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
          <Link to="/register" className="block w-full text-center py-4 rounded-xl bg-[#008081] text-white font-extrabold hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(0,128,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
            Acquista Ora <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-center text-xs text-gray-500 mt-4 flex justify-center items-center gap-1 font-bold">
            <Shield className="w-3.5 h-3.5" /> 14 giorni di garanzia "Soddisfatto o Rimborsato"
          </p>
        </div>

      </div>

      {/* 4. Comparison vs The Old Way */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <h2 className="text-3xl font-extrabold text-[#111827] text-center mb-12">Perché Leomenu distrugge la concorrenza</h2>
        
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div className="p-5"></div>
            <div className="p-5 text-center border-l border-gray-200">
              <span className="text-xs font-black uppercase tracking-widest text-[#111827]">Il Vecchio Modo</span>
              <p className="text-[10px] text-gray-500 font-bold mt-1">(Agenzie, PDF, Stampa)</p>
            </div>
            <div className="p-5 text-center border-l md:border-t-0 border-gray-200 bg-teal-50/50 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#008081]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-[#008081]">Leomenu</span>
              <p className="text-[10px] text-gray-500 font-bold mt-1">(SaaS Autonomo)</p>
            </div>
          </div>
          
          {[
            { label: "Costo per ogni aggiornamento", oldWay: "150€ - 300€", leoWay: "0€ (Illimitato)", leoColor: "text-green-600" },
            { label: "Tempi d'attesa modifiche", oldWay: "3-5 giorni lavorativi", leoWay: "Istantaneo", leoColor: "text-green-600" },
            { label: "Fidelizzazione Clientela", oldWay: <XCircle className="w-5 h-5 mx-auto text-red-400"/>, leoWay: <CheckCircle2 className="w-5 h-5 mx-auto text-green-500"/>, leoColor: "" },
            { label: "Normativa Allergeni Dinamica", oldWay: <XCircle className="w-5 h-5 mx-auto text-red-400"/>, leoWay: <CheckCircle2 className="w-5 h-5 mx-auto text-green-500"/>, leoColor: "" },
            { label: "Hardware estético de mesa", oldWay: "Plastificato rovinato", leoWay: "Legno naturale / NFC", leoColor: "text-[#111827]" }
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
              <div className="p-5 flex items-center text-sm font-bold text-gray-700">{row.label}</div>
              <div className="p-5 flex items-center justify-center text-center border-l w-full border-gray-100 text-sm font-semibold text-gray-500">{row.oldWay}</div>
              <div className="p-5 flex items-center justify-center text-center border-l w-full border-gray-100 bg-teal-50/10 text-sm font-black">
                <span className={row.leoColor}>{row.leoWay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Pricing FAQ */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-3 justify-center mb-10">
          <HelpCircle className="w-6 h-6 text-[#008081]"/>
          <h2 className="text-3xl font-extrabold text-[#111827]">Domande Frequenti</h2>
        </div>
        
        <div className="space-y-6">
          {[
            {
              q: "Ci sono costi di attivazione nascosti?",
              a: "Assolutamente no. Il prezzo que vedi (15€/mese pagati annualmente) è l'unico costo per l'utilizzo del software. Non tratteniamo commissioni, né costi di setup iniziali."
            },
            {
              q: "Cosa succede allo scadere dei 14 giorni gratuiti?",
              a: "Avrai accesso completo. Allo scadere, potrai decidere se attivare l'abbonamento o meno. I tuoi dati non verranno immediatamente cancellati per darti tempo di decidere."
            },
            {
              q: "Ho una catena con 5+ locali. C'è uno sconto?",
              a: "Certamente. Per realtà strutturate, offriamo licenze multi-locale con sconti sul volume. Compila la form Contact o entra via Demo per parlarne con noi."
            },
            {
              q: "Devo obbligatoriamente acquistare gli espositori NFC in legno?",
              a: "No. Noi forniamo il software e ti diamo i file QR in alta qualità da stampare dove vuoi. I nostri espositori NFC in legno sono un add-on opzionale nato per dare pura eleganza al tuo locale."
            }
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#008081]/30 transition-all">
              <h4 className="text-lg font-extrabold text-[#111827] mb-2">{faq.q}</h4>
              <p className="text-gray-500 font-medium leading-relaxed text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
