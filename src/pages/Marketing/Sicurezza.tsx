import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, WifiOff, Users, Database, Server, Smartphone, Lock, ArrowRight, Activity } from 'lucide-react';

export default function Sicurezza() {
  return (
    <div className="pt-20 pb-0 bg-[#F9FAFB] min-h-screen font-sans selection:bg-[#008081] selection:text-white overflow-hidden">
      
      {/* 1. Hero Section (Authority & Trust) */}
      <div className="max-w-4xl mx-auto text-center px-6 md:px-12 mb-20 relative z-10 pt-10">
        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-8 border border-gray-100">
          <ShieldCheck className="w-8 h-8 text-[#008081]" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#111827] mb-6 tracking-tight leading-tight">
          Nessun imprevisto.<br />
          <span className="text-gray-400">Mai.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Sappiamo che il sabato sera non ammette ritardi tecnici. Leomenu è un'infrastruttura pensata per sopravvivere e scalare, a prova di blackout e di personale "poco tecnologico".
        </p>
      </div>

      {/* 2. Uptime Stats Banner */}
      <div className="bg-[#111827] py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
          <div className="border-b md:border-b-0 md:border-r border-gray-800 pb-8 md:pb-0">
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">99.9%</div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Uptime Garantito</p>
          </div>
          <div className="border-b md:border-b-0 md:border-r border-gray-800 pb-8 md:pb-0">
            <div className="text-5xl font-black text-white mb-2 tracking-tighter flex justify-center items-center gap-1">
               0.2<span className="text-2xl">sec</span>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tempo medio di caricamento</p>
          </div>
          <div>
            <div className="text-5xl font-black text-[#008081] mb-2 tracking-tighter">GDPR</div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Dati conformi e protetti (UE)</p>
          </div>
        </div>
      </div>

      {/* 3. The 4 Big Objections (Killed) */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Objection 1: Internet Caído */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <WifiOff className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#111827] mb-4">"Ma se si rompe il Wi-Fi del locale?"</h3>
            <p className="text-gray-500 leading-relaxed font-medium mb-6">
              Leomenu è leggero e ottimizzato. I tuoi clienti utilizzeranno la loro rete cellulare (4G/5G) per scansionare il QR. Pesa pochissimi kilobyte, garantendo l'apertura in decimi di secondo anche in zone con scarsa copertura telefonica. Il servizio non si ferma mai.
            </p>
          </div>

          {/* Objection 2: Personal Viejo */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#111827] mb-4">"Il mio staff non è tecnologico."</h3>
            <p className="text-gray-500 leading-relaxed font-medium mb-6">
              Abbiamo progettato il pannello "Gestione" pensando a schermi touch e a dita veloci. Nessun menù nascosto, nessuna terminologia informatica. Curva di apprendimento reale stimata: <strong>5 minuti</strong> per il cameriere meno esperto della tua brigata.
            </p>
          </div>

          {/* Objection 3: Clientela Clásica */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#111827] mb-4">"I miei clienti odiano scansionare i QR."</h3>
            <p className="text-gray-500 leading-relaxed font-medium mb-6">
              Non ti chiediamo di bruciare i menù di carta oggi stesso. Applica la <em>Transizione Ibrida</em>: i clienti abituali/frettolosi useranno Leomenu tagliando le file, liberando i tuoi camerieri per dedicare maggiore cura e tempo alla clientela più esigente o storica.
            </p>
          </div>

          {/* Objection 4: Data Privacy */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
              <Database className="w-7 h-7 text-[#008081]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#111827] mb-4">"Dove finiscono i menù e le email dei miei clienti?"</h3>
            <p className="text-gray-500 leading-relaxed font-medium mb-6">
              Tutti i dati, le fotografie dei tuoi piatti e gli iscritti al tuo Passport risedono in server Cloud sicuri situati sul suolo Europeo. Sei tu l'unico prorietario dei tuoi dati, nel rispetto totale del nuovo GDPR sulla privacy. Nessuna rivendita di dati a terzi.
            </p>
          </div>

        </div>
      </div>

      {/* 4. Enterprise-Grade Badge */}
      <section className="bg-white border-y border-gray-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Server className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-[#111827] mb-4">Infrastruttura Enterprise a portata di piccola impresa.</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Scaliamo dinamicamente. Che tu riceva 10 clienti in un martedì piovoso, o 500 scansioni contemporanee la sera di San Silvestro, il nostro backend si adatta istantaneamente per mantenere la latenza a zero.
          </p>
        </div>
      </section>

      {/* 5. Bottom CTA Section */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Lock className="w-12 h-12 text-[#008081] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Prova la solidità del sistema oggi.
          </h2>
          <p className="text-lg text-gray-400 font-medium mb-10 max-w-2xl mx-auto">
            Carica i tuoi piatti, fai crash-test dal tuo telefono, scollegalo dal wi-fi e vedi tu stesso la reattività della piattaforma con la prova di 14 giorni.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-[#008081] text-white font-extrabold px-8 py-4 rounded-xl hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(0,128,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
              Avvia il tuo Trial Sicuro <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
