import React from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode, Smartphone, Award, BarChart2, ArrowRight,
  ShieldCheck, Zap, TrendingUp, Mail, Utensils, ChevronDown,
  Globe2, ShieldAlert, BrainCircuit, LayoutTemplate,
} from 'lucide-react';

const STATS = [
  { value: '15 min', label: 'menù attivo dalla registrazione' },
  { value: '+65%', label: 'ordini con foto del piatto' },
  { value: '3×', label: 'più ritorni con la fedeltà' },
  { value: 'Zero app', label: 'nessun download per i clienti' },
];

const COMING_SOON = [
  { icon: Globe2, name: 'Traduzione automatica', desc: 'Menù in inglese, spagnolo, francese e tedesco senza toccare nulla' },
  { icon: ShieldAlert, name: 'Filtri Allergeni', desc: 'Conforme al Reg. UE 1169/2011, pronto per i controlli ispettivi' },
  { icon: BrainCircuit, name: 'Import con AI', desc: 'Carica il tuo vecchio menu in PDF, lui lo digitalizza da solo' },
  { icon: LayoutTemplate, name: 'Galleria template', desc: 'Layout pronti e belli, scegli e pubblichi in cinque minuti' },
];

export default function Funzionalita() {
  return (
    <div className="bg-white font-sans selection:bg-[#008081] selection:text-white overflow-hidden">

      {/* ─── 1. HERO ───────────────────────────────────────────── */}
      <section className="bg-[#111827] pt-28 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#008081]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {['QR & NFC', 'Nessuna App', 'Aggiornamenti Istantanei'].map(pill => (
              <span key={pill} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-semibold border border-white/10">
                {pill}
              </span>
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            Il tuo ristorante<br />lavora meglio.<br />
            <span className="text-[#008081]">Tu lavori di meno.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
            Leomenu ti dà gli strumenti che i grandi usano da anni — senza tecnici, senza corsi, senza costi assurdi. Pronti in un giorno.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#008081] text-white font-extrabold px-8 py-4 rounded-full hover:bg-teal-500 hover:shadow-[0_0_24px_rgba(0,128,129,0.4)] transition-all text-lg"
          >
            Inizia gratis per 14 giorni <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-14 flex flex-col items-center gap-2 text-gray-600">
            <span className="text-xs font-bold uppercase tracking-widest">Scopri le funzioni</span>
            <ChevronDown className="w-5 h-5 text-[#008081] animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── 2. PAIN BLOCK ─────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-2xl md:text-3xl font-extrabold text-[#111827] leading-relaxed mb-5">
            Stampi il menù ogni stagione e butteresti tutto al vento. I camerieri prendono ordini a memoria e gli errori si pagano due volte. Non sai quale piatto vende davvero e quale toglie solo spazio al frigo.
          </p>
          <p className="text-2xl font-black text-[#008081]">È il 2026. Puoi fare meglio.</p>
        </div>
      </section>

      {/* ─── 3. STATS STRIP ────────────────────────────────────── */}
      <section className="bg-[#008081] py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</p>
              <p className="text-xs text-teal-100 font-semibold uppercase tracking-wider leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. FEATURE 1 — Menù Digitale ─────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-8 border border-teal-100">
              <QrCode className="w-6 h-6 text-[#008081]" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-5 leading-tight">
              Il menu che si aggiorna in 30 secondi, non in tre giorni.
            </h2>
            <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
              I clienti inquadrano il QR o avvicinano il telefono all'NFC — niente app, niente attese. Tu aggiorni prezzi, piatti e foto dal telefono, in tempo reale, da qualsiasi posto.
            </p>
            <ul className="space-y-4">
              {[
                'Nessuna stampa, nessun costo ricorrente di tipografia',
                'Foto, descrizioni e prezzi sempre aggiornati',
                'Funziona su qualsiasi smartphone, senza installare nulla',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#111827] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-[#008081]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Mockup: Phone */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-50 to-cyan-50 rotate-3 rounded-3xl -z-10" />
            <div className="bg-white border-2 border-gray-100 shadow-2xl rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#008081] rounded-full flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="h-3 w-24 bg-gray-200 rounded-full" />
                    <div className="h-2 w-16 bg-gray-100 rounded-full mt-1" />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#008081] bg-teal-50 px-2 py-1 rounded-full border border-teal-100">IT / EN</span>
              </div>
              <div className="flex gap-2 mb-5 overflow-hidden">
                {['Antipasti', 'Primi', 'Secondi', 'Dolci'].map((c, i) => (
                  <span key={c} className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${i === 1 ? 'bg-[#008081] text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</span>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Spaghetti alla Carbonara', price: '€14', tags: ['🥚', '🧀'], badge: 'Best seller', color: 'from-amber-100 to-yellow-50' },
                  { name: 'Pizza Margherita', price: '€12', tags: ['🌾', '🧀'], badge: null, color: 'from-orange-100 to-red-50' },
                  { name: 'Tiramisù della Casa', price: '€7', tags: ['🥚', '🍫'], badge: null, color: 'from-sky-100 to-indigo-50' },
                ].map((dish, i) => (
                  <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className={`w-16 h-16 bg-gradient-to-tr ${dish.color} rounded-xl flex-shrink-0 relative`}>
                      {dish.badge && (
                        <span className="absolute top-1 left-1 bg-[#008081] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{dish.badge}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111827] truncate">{dish.name}</p>
                      <div className="flex gap-1 mt-1">
                        {dish.tags.map(t => (
                          <span key={t} className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[10px]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#008081]">{dish.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. FEATURE 2 — LeoPOS ─────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-6 border-y border-gray-100">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Mockup: Tablet */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-100 to-indigo-50 -rotate-2 rounded-3xl -z-10" />
            <div className="bg-[#111827] shadow-2xl rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-700">
                <span className="text-white font-black text-sm uppercase tracking-widest">LeoPOS</span>
                <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">Servizio in corso</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[1, 2, 3, 4, 5, 6].map(t => (
                  <div key={t} className={`p-3 rounded-xl text-center border font-bold text-sm ${[2, 4].includes(t) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                    T{t}{[2, 4].includes(t) ? ' 🍽️' : ''}
                  </div>
                ))}
              </div>
              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Tavolo 2 — Comanda aperta</p>
                {[
                  { item: '🍔 Burger', note: 'Senza cipolla', qty: 2 },
                  { item: '🍺 Birra IPA', note: '', qty: 1 },
                  { item: '🍟 Patatine', note: 'Extra croccanti', qty: 2 },
                ].map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="text-white text-sm font-bold">{o.item}</p>
                      {o.note && <p className="text-red-400 text-xs font-semibold">{o.note}</p>}
                    </div>
                    <span className="text-blue-400 font-black text-sm">×{o.qty}</span>
                  </div>
                ))}
                <div className="mt-4 bg-blue-600 text-white rounded-xl py-2.5 font-black text-sm text-center">
                  Invia in cucina →
                </div>
              </div>
            </div>
          </div>
          {/* Text */}
          <div className="order-1 lg:order-2">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-5 leading-tight">
              Ordini al tavolo senza urli, senza errori, senza carta.
            </h2>
            <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
              Il cameriere prende l'ordine direttamente dal suo telefono o tablet — l'ordine arriva in cucina all'istante. Meno giri inutili, meno incomprensioni, tavoli che girano più veloci.
            </p>
            <ul className="space-y-4">
              {[
                'Interfaccia semplice: si impara in dieci minuti',
                'Ordini inviati in cucina in tempo reale',
                'Meno errori, meno resi, meno nervosismo in sala',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#111827] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 6. FEATURE 3 — Carta Fedeltà ─────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-8 border border-purple-100">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-5 leading-tight">
              I clienti tornano.<br className="hidden md:block" />
              E tu sai chi sono.
            </h2>
            <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">
              Una carta fedeltà digitale che i clienti raccolgono giocando — punti, premi, vantaggi. Tu ottieni qualcosa di prezioso: la loro email, il loro consenso, un canale diretto per farli tornare.
            </p>
            <ul className="space-y-4">
              {[
                'Nessuna tessera fisica da stampare o distribuire',
                'Raccolta email con consenso GDPR incluso',
                'Riporta i clienti con offerte mirate, quando vuoi tu',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#111827] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Mockup: Fidelity card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 to-indigo-50 rotate-3 rounded-3xl -z-10" />
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full translate-y-8 -translate-x-8" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-1">Carta Fedeltà</p>
                      <p className="text-2xl font-black">🦁 248 punti</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <Award className="w-5 h-5 text-purple-300" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-bold text-purple-300 mb-1.5">
                      <span>Progresso premio</span>
                      <span>248 / 300</span>
                    </div>
                    <div className="w-full bg-purple-900/50 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2.5 rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>
                  <p className="text-purple-200 text-xs font-semibold">Prossimo premio: caffè gratis (52 pt mancanti)</p>
                </div>
              </div>
              {/* Email notification */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-md flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111827]">Nuovo cliente registrato</p>
                  <p className="text-xs text-gray-400 font-medium">ma***@gmail.com · GDPR ✓</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full whitespace-nowrap">+50 pt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FEATURE 4 — Dashboard ──────────────────────────── */}
      <section className="bg-[#111827] py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
              <BarChart2 className="w-6 h-6 text-[#008081]" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
              Smetti di tirare a indovinare.<br />
              <span className="text-[#008081]">I numeri parlano chiaro.</span>
            </h2>
            <p className="text-lg text-gray-400 font-medium mb-8 leading-relaxed">
              Sai quali piatti vendono di più, a che ora è pieno il locale, quante scansioni ricevi ogni giorno. Decisioni basate su dati veri, non su impressioni del lunedì mattina.
            </p>
            <ul className="space-y-4">
              {[
                "Bestseller e piatti lenti: visibili a colpo d'occhio",
                'Fasce orarie di punta per organizzare i turni meglio',
                'Statistiche scansioni QR/NFC giorno per giorno',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-[#008081]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Mockup: Dashboard */}
          <div className="bg-[#1a2332] rounded-3xl p-6 border border-gray-700 shadow-2xl">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Scansioni oggi', val: '142', up: '+18%' },
                { label: 'Ordini', val: '38', up: '+7%' },
                { label: 'Punti assegnati', val: '520', up: '+31%' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 leading-tight">{s.label}</p>
                  <p className="text-white font-black text-xl">{s.val}</p>
                  <p className="text-green-400 text-[10px] font-bold mt-1">{s.up}</p>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Scansioni — ultimi 7 giorni</p>
              <div className="flex items-end gap-1.5 h-20">
                {[45, 70, 55, 90, 65, 100, 80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-[#008081] to-teal-400 opacity-80" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-gray-600 text-[9px] font-bold mt-1">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <span key={d}>{d}</span>)}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Top Prodotti</p>
              <div className="space-y-2.5">
                {[
                  { name: 'Tiramisù della casa', pct: 78, color: 'bg-[#008081]' },
                  { name: 'Pizza Margherita', pct: 61, color: 'bg-blue-500' },
                  { name: 'Birra IPA Media', pct: 44, color: 'bg-purple-500' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold w-4 shrink-0">{i + 1}</span>
                    <span className="text-gray-300 text-xs font-semibold flex-1 truncate">{p.name}</span>
                    <div className="w-16 bg-gray-700 rounded-full h-1.5 shrink-0">
                      <div className={`${p.color} h-1.5 rounded-full`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. PROSSIMAMENTE ──────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-widest rounded-full mb-4">In Arrivo</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827]">Stiamo costruendo ancora di più.</h2>
            <p className="text-gray-500 font-medium mt-3 max-w-xl mx-auto">
              Funzionalità già in sviluppo che arriveranno presto sul tuo Leomenu.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMING_SOON.map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border-2 border-dashed border-gray-200 hover:shadow-lg hover:border-amber-200 transition-all relative overflow-hidden group">
                <div className="absolute top-4 right-4">
                  <span className="bg-amber-100 text-amber-700 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Prossimamente</span>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-50 transition-colors">
                  <f.icon className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <h4 className="text-base font-extrabold text-[#111827] mb-1.5 opacity-70">{f.name}</h4>
                <p className="text-sm text-gray-300 font-medium leading-relaxed blur-[1.5px] select-none">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. FINAL CTA ──────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#111827] via-[#0d1f1f] to-[#111827] py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#008081]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Inizia oggi. Gratis.
          </h2>
          <p className="text-xl text-gray-400 font-medium mb-10">
            Non ti chiediamo la carta di credito. Ti chiediamo solo di provarlo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#008081] text-white font-extrabold px-8 py-4 rounded-full hover:bg-teal-500 hover:shadow-[0_0_30px_rgba(0,128,129,0.5)] transition-all flex items-center justify-center gap-2 text-lg"
            >
              Crea il tuo menu gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/prezzi"
              className="border border-white/20 text-white font-extrabold px-8 py-4 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-lg"
            >
              Vedi i prezzi
            </Link>
          </div>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-8">
            Nessuna carta di credito · 14 giorni gratis · Cancella quando vuoi
          </p>
        </div>
      </section>

    </div>
  );
}
