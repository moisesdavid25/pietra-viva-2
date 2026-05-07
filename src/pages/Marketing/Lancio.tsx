import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, ChevronUp,
  Printer, MessageSquare, BarChart2, Heart,
  Zap, Clock, QrCode, Shield, Check,
  Utensils, Star, Users, ShoppingBag, TrendingUp,
  Smartphone, MessageCircle,
} from 'lucide-react';

// ── Aggiorna questi valori manualmente ───────────────────────────────────────
const SPOTS_REMAINING = 23;          // posti rimasti su 30
const OFFER_DEADLINE = '31 maggio 2026'; // scadenza offerta
const WHATSAPP_LINK = 'https://wa.me/393661100408'; // sostituisci col tuo numero
const REGISTER_URL = 'https://app.leomenu.it/register';
// ─────────────────────────────────────────────────────────────────────────────

function CTAButton({ className = '', children = 'Inizia gratis 14 giorni →' }: { className?: string; children?: React.ReactNode }) {
  return (
    <a
      href={REGISTER_URL}
      className={`inline-flex items-center justify-center gap-2 bg-[#008081] text-white font-extrabold px-8 py-4 rounded-full hover:bg-teal-500 hover:shadow-[0_0_30px_rgba(0,128,129,0.45)] active:scale-95 transition-all text-lg ${className}`}
    >
      {children}
    </a>
  );
}

function ScarcityBadge({ light = false }: { light?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${light ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
      <Zap className="w-3.5 h-3.5" />
      Offerta Fondatori — Rimangono solo <strong>{SPOTS_REMAINING} posti</strong> su 30
    </div>
  );
}

const FAQS = [
  {
    q: 'I miei clienti devono scaricare un\'app?',
    a: 'No. Zero app. Scansionano il QR con la fotocamera del telefono e il menù si apre direttamente nel browser. Nessun attrito, nessun download.',
  },
  {
    q: 'E se cambio il menù ogni settimana?',
    a: 'Lo modifichi tu in 30 secondi dal tuo telefono, gratis, ogni volta che vuoi. Nessun costo aggiuntivo, mai.',
  },
  {
    q: 'Non ho tempo di caricare 150 piatti.',
    a: 'Per questo esiste il Metodo Lancio 48h. Mandi il PDF via WhatsApp, noi carichiamo tutto entro 48 ore. Tu non tocchi nulla — neanche un prodotto.',
  },
  {
    q: 'Ho già un sistema. Perché cambiare?',
    a: 'Il tuo sistema attuale ha ordini dal tavolo, CRM, Carta Fedeltà e analytics tutto integrato a €17/mese? Se sì, tienilo. Se no, parliamoci.',
  },
  {
    q: 'Siete una startup nuova. Mi posso fidare?',
    a: 'Il nostro software è attivo, funzionante, con ristoranti reali che lo usano oggi. Hai 14 giorni gratis per vederlo con i tuoi occhi. Zero rischio da parte tua.',
  },
  {
    q: 'Cosa succede dopo i 14 giorni di trial?',
    a: 'Ti addebitiamo il piano che hai scelto. Se non vuoi continuare, cancelli prima del giorno 14 e non ti costa nulla. Nessuna domanda, nessuna burocrazia.',
  },
  {
    q: 'Posso cambiare piano in seguito?',
    a: 'Sì, quando vuoi. Puoi passare da mensile ad annuale (o viceversa) dalla tua area personale, senza chiamare nessuno.',
  },
];

const PAIN_POINTS = [
  {
    icon: Printer,
    title: 'Ristampi il menù ogni volta che cambia un prezzo',
    desc: '€150–300 per modifica + giorni di attesa. Poi il grafico sbaglia il font e si ricomincia.',
    color: 'bg-red-50 text-red-500',
  },
  {
    icon: MessageSquare,
    title: 'I camerieri trasmettono gli ordini a voce',
    desc: 'Errori in cucina, clienti insoddisfatti, tavoli che aspettano. E ogni serata è una roulette.',
    color: 'bg-orange-50 text-orange-500',
  },
  {
    icon: BarChart2,
    title: 'Non sai quali piatti vendono di più',
    desc: 'Decidi a intuizione cosa tenere in carta. Il risultato? Metà frigo sprecato ogni settimana.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Heart,
    title: 'I tuoi clienti non tornano — e non sai perché',
    desc: 'Nessun sistema di fidelizzazione. Nessun dato. Solo sperare che si ricordino di te.',
    color: 'bg-rose-50 text-rose-500',
  },
];

const COMPARISON = [
  { aspect: 'Aggiornare il menù', before: 'Chiamare un grafico, €150–300, giorni di attesa', after: '30 secondi dal tuo telefono, gratis, sempre' },
  { aspect: 'Errori in cucina', before: 'Ordini a voce → malintesi → clienti insoddisfatti', after: 'Ordini digitali diretti, in tempo reale, zero errori' },
  { aspect: 'Clienti abituali', before: 'Nessun sistema di fidelizzazione', after: 'Carta Fedeltà + CRM automatico' },
  { aspect: 'Analisi vendite', before: '"A intuizione" — decidi a naso', after: 'Dashboard con dati reali ogni giorno' },
  { aspect: 'Costo menù fisico', before: '€200–400/anno solo in stampa', after: '€204/anno, tutto incluso' },
  { aspect: 'App per i clienti', before: 'Download obbligatorio → metà non lo fa', after: 'Zero — solo scan QR con la fotocamera' },
];

const MODULES = [
  { icon: ShoppingBag, label: 'Ordini' },
  { icon: Utensils, label: 'Menù' },
  { icon: TrendingUp, label: 'Analitiche' },
  { icon: Users, label: 'CRM' },
  { icon: Star, label: 'Carta Fedeltà' },
  { icon: Smartphone, label: 'LeoPOS' },
  { icon: QrCode, label: 'QR' },
];

const BONUSES = [
  {
    badge: 'BONUS 1 — ESCLUSIVO',
    title: 'Metodo Lancio 48h',
    desc: 'Mandi il tuo menù in PDF via WhatsApp. Noi carichiamo tutto — categorie, prodotti, prezzi e foto — entro 48 ore. Tu non tocchi nulla.',
    value: '€150',
    highlight: true,
  },
  {
    badge: 'BONUS 2',
    title: 'Guida Carta Fedeltà',
    desc: 'Video tutorial passo dopo passo (schermo registrato) + PDF con tabella ranghi punti e premi calcolati per essere redditizi in base al tuo scontrino medio.',
    value: '€80',
    highlight: false,
  },
  {
    badge: 'BONUS 3',
    title: 'Template WhatsApp di lancio',
    desc: 'Il messaggio già scritto per annunciare il tuo menù digitale ai tuoi clienti. Copi, incolli, invii. Zero da inventare.',
    value: '€30',
    highlight: false,
  },
];

export default function Lancio() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Canonical URL for SEO — Google indexes app.leomenu.it/lancio as the official URL
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = 'https://app.leomenu.it/lancio';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-sans antialiased text-[#111827] selection:bg-[#008081] selection:text-white overflow-x-hidden">

      {/* ── Sticky header (appare dopo lo scroll oltre l'hero) ─────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300 ${headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#008081]" />
            <span className="font-black text-lg tracking-tight text-[#111827]">Leomenu</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
              ⚡ {SPOTS_REMAINING} posti rimasti
            </span>
            <a
              href={REGISTER_URL}
              className="bg-[#008081] text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-teal-500 transition-colors"
            >
              Inizia gratis →
            </a>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="bg-[#111827] pt-20 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#008081]/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#008081]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Badge offerta */}
          <div className="flex justify-center mb-8">
            <ScarcityBadge />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6">
            Il tuo menù online<br />
            in <span className="text-[#008081]">48 ore.</span><br />
            <span className="text-white/90 text-4xl md:text-6xl">Lo carichiamo noi.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-2xl mx-auto mb-4 leading-relaxed">
            €204/anno. Meno di una ristampa del menù cartaceo.
          </p>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            Zero app da scaricare per i tuoi clienti — solo scan del QR.
          </p>

          {/* CTA */}
          <CTAButton className="text-xl px-10 py-5" />
          <p className="mt-4 text-gray-500 text-sm">
            Nessun impegno. Carta richiesta solo per attivare il trial.
          </p>

          {/* Deadline */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
            <span className="text-gray-500">Offerta valida fino al</span>
            <span className="font-black text-amber-400">{OFFER_DEADLINE}</span>
            <span className="text-gray-500">o fino a esaurimento posti</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 2 — IL PROBLEMA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Il Problema</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] leading-tight">
              Riconosci questa situazione?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PAIN_POINTS.map((pain, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${pain.color} flex items-center justify-center`}>
                  <pain.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-[#111827] mb-1.5 leading-snug">{pain.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{pain.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-2xl md:text-3xl font-black text-[#008081]">È il 2026. Puoi fare meglio.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 3 — LA SOLUZIONE (PRIMA vs DOPO)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F0FDFA] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#008081] mb-4">La Soluzione</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827]">
              Con LeoMenu, tutto cambia.
            </h2>
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-3xl shadow-sm border border-teal-100 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 text-xs font-black uppercase tracking-widest">
              <div className="px-6 py-4 bg-gray-50 text-gray-400 border-b border-gray-100">Situazione</div>
              <div className="px-6 py-4 bg-red-50 text-red-500 border-b border-red-100 text-center">❌ Prima</div>
              <div className="px-6 py-4 bg-[#008081] text-white border-b border-teal-700 text-center">✅ Con LeoMenu</div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-gray-50 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                <div className="px-6 py-5 text-sm font-bold text-gray-700 flex items-center">{row.aspect}</div>
                <div className="px-6 py-5 text-sm text-gray-500 border-l border-red-50 flex items-start gap-1.5">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">✕</span>
                  {row.before}
                </div>
                <div className="px-6 py-5 text-sm text-[#008081] font-semibold border-l border-teal-50 flex items-start gap-1.5">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 4 — COME FUNZIONA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#111827] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#008081] mb-4">Come Funziona</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Tre passi. Poi sei online.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-14 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#008081] to-[#008081] opacity-30" />

            {[
              {
                icon: MessageCircle,
                step: '01',
                title: 'Manda il tuo menù in PDF via WhatsApp',
                desc: 'Una foto, un file, qualsiasi formato. Anche una foto con il telefono va bene.',
                color: 'bg-[#008081]/20 text-[#008081]',
              },
              {
                icon: Clock,
                step: '02',
                title: 'Noi lo carichiamo entro 48 ore',
                desc: 'Tu non tocchi nulla. Pensiamo a tutto noi — categorie, prodotti, prezzi, foto.',
                color: 'bg-amber-500/20 text-amber-400',
              },
              {
                icon: QrCode,
                step: '03',
                title: 'Apri domani con il menù digitale attivo',
                desc: 'I tuoi clienti scansionano, ordinano, tornano. Tutto funziona dal giorno uno.',
                color: 'bg-emerald-500/20 text-emerald-400',
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className={`w-28 h-28 rounded-2xl ${s.color} flex items-center justify-center mb-6 relative z-10`}>
                  <s.icon className="w-12 h-12" />
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] text-gray-600 mb-2">STEP {s.step}</span>
                <h3 className="text-lg font-black text-white mb-3 leading-snug">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-[#008081]/10 border border-[#008081]/30 rounded-2xl px-8 py-5">
              <p className="text-white font-black text-lg">
                Questo si chiama <span className="text-[#008081]">Metodo Lancio 48h</span>
              </p>
              <p className="text-gray-400 text-sm mt-1">ed è esclusivo dell'Offerta Fondatori</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 5 — SCREENSHOT PRODOTTO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Il Prodotto</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827]">
              Tutto quello che ti serve,<br className="hidden md:block" />
              in un'unica dashboard.
            </h2>
          </div>

          {/* Desktop: tablet mockup */}
          <div className="hidden md:block rounded-3xl overflow-hidden shadow-2xl border border-gray-100 mb-10">
            <img
              src="/Mockup tablet.webp"
              alt="LeoMenu — Pannello di gestione su tablet"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>

          {/* Mobile: phone mockup */}
          <div className="md:hidden flex justify-center mb-10">
            <div className="w-full max-w-xs">
              <img
                src="/MOCKUP MOVIL LEOMENU.webp"
                alt="LeoMenu — Vista cliente su iPhone"
                className="w-full h-auto block drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Module chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {MODULES.map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600">
                <m.icon className="w-3.5 h-3.5 text-[#008081]" />
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 6 — STORIA DEL FONDATORE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFDF0] py-24 px-6 border-y border-amber-100">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-6">Perché Esiste LeoMenu</span>
          <blockquote className="text-xl md:text-2xl text-[#111827] font-medium leading-relaxed space-y-5">
            <p>
              LeoMenu non è nato in una startup valley.
              <strong className="font-black"> È nato in un ristorante di Cassino.</strong>
            </p>
            <p className="text-gray-600">
              Un ristoratore ci ha chiesto una cosa semplice: un menù digitale che i clienti
              potessero leggere dal telefono, senza app, senza ristampare ogni stagione,
              senza chiamare un grafico ogni volta che cambia un prezzo.
            </p>
            <p className="text-gray-600">
              Mentre costruivamo quella soluzione, abbiamo capito che poteva essere
              molto di più. Abbiamo aggiunto gli ordini dal tavolo. Poi la Carta Fedeltà.
              Poi il CRM. Poi le analitiche. Poi LeoPOS.
            </p>
            <p className="font-black text-[#111827]">
              Oggi LeoMenu è il sistema completo che quel ristoratore —
              e migliaia di ristoratori come lui — avrebbe voluto avere dall'inizio.
            </p>
            <p className="text-[#008081] font-black">
              Lo abbiamo costruito per voi. E il prezzo riflette questa scelta.
            </p>
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#008081] flex items-center justify-center font-black text-white text-xl">L</div>
            <div>
              <p className="font-black text-[#111827]">Il Team Leomenu</p>
              <p className="text-sm text-gray-500">Cassino, Italia 🇮🇹</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 7 — L'OFFERTA FONDATORI
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#008081]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#008081]/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#008081] mb-4">Solo per i primi 30 ristoranti</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Offerta Fondatori
            </h2>
            <p className="text-gray-400 text-lg">Il prezzo più basso che esisterà mai per LeoMenu</p>
          </div>

          {/* Main offer box */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 mb-8">

            {/* Price */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-white/10 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008081] mb-2">Piano Annuale Fondatori</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white">€17</span>
                  <span className="text-gray-400 text-lg">/mese</span>
                </div>
                <p className="text-gray-400 mt-1">€204 all'anno · <span className="text-emerald-400 font-bold">Risparmio 41%</span></p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm line-through">€348/anno (piano mensile)</p>
                <p className="text-white font-black text-2xl mt-1">€204/anno</p>
                <p className="text-emerald-400 text-sm font-bold mt-0.5">Risparmi €144 all'anno</p>
              </div>
            </div>

            {/* Tutto incluso */}
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Tutto incluso:</p>
              <div className="flex items-start gap-3 mb-3">
                <Check className="w-5 h-5 text-[#008081] flex-shrink-0 mt-0.5" />
                <span className="text-white font-semibold">Tutto LeoMenu senza limitazioni</span>
              </div>
            </div>

            {/* Bonuses */}
            <div className="space-y-4 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Bonus esclusivi:</p>
              {BONUSES.map((bonus, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl ${bonus.highlight ? 'bg-[#008081]/15 border border-[#008081]/30' : 'bg-white/5 border border-white/5'}`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#008081] flex items-center justify-center text-white font-black text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${bonus.highlight ? 'text-[#008081]' : 'text-gray-500'}`}>{bonus.badge}</span>
                        <p className="text-white font-black mt-0.5">{bonus.title}</p>
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{bonus.desc}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-gray-500 text-xs line-through">valore</span>
                        <p className="text-[#008081] font-black">{bonus.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Garanzie */}
            <div className="space-y-3 mb-10 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Garanzie incluse:</p>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm"><strong className="text-white">14 giorni soddisfatti o rimborsati.</strong> Cancelliamo tutto, nessuna domanda.</p>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm"><strong className="text-white">Garanzia Esecuzione.</strong> Menù online in 48h o il primo mese è gratis.</p>
              </div>
            </div>

            {/* Valore totale */}
            <div className="flex items-center justify-between py-4 border-t border-b border-white/10 mb-8">
              <span className="text-gray-400 font-bold">Totale valore incluso</span>
              <div className="text-right">
                <span className="text-gray-500 text-sm line-through">€430+</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-xl">Tu paghi:</span>
                  <span className="text-[#008081] font-black text-2xl">€204/anno</span>
                </div>
              </div>
            </div>

            {/* CTA principale */}
            <CTAButton className="w-full py-5 text-xl justify-center">
              Attiva l'Offerta Fondatori →
            </CTAButton>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
              <span className="text-amber-400 text-sm font-bold">⚡ Rimangono solo {SPOTS_REMAINING} posti</span>
              <span className="text-gray-600 hidden sm:inline">·</span>
              <span className="text-gray-500 text-sm">Offerta valida fino al {OFFER_DEADLINE}</span>
            </div>
          </div>

          {/* Altre opzioni (meno prominenti) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Piano Semestrale', price: '€22/mese', total: '€132 ogni 6 mesi', note: 'Senza i bonus Fondatori', discount: '-24%' },
              { label: 'Piano Mensile', price: '€29/mese', total: '', note: 'Senza i bonus Fondatori', discount: null },
            ].map((plan, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 opacity-70 hover:opacity-90 transition-opacity">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{plan.label}</p>
                <p className="text-white font-black text-xl">{plan.price}</p>
                {plan.total && <p className="text-gray-500 text-xs mt-0.5">{plan.total}</p>}
                {plan.discount && <span className="inline-block mt-1 text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-bold">{plan.discount}</span>}
                <p className="text-gray-600 text-xs mt-3">{plan.note}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-xs mt-4">
            I bonus del Metodo Lancio 48h sono esclusivi del Piano Annuale Fondatori.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 8 — GARANZIA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-[#111827] mb-6">Rischio zero per te.</h2>
          <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
            <p>
              Se entro 14 giorni non sei completamente soddisfatto,
              <strong className="text-[#111827]"> cancelliamo tutto e non ti addebitiamo nulla.</strong>
              {' '}Nessuna domanda, nessuna burocrazia.
            </p>
            <p>
              E se non carichiamo il tuo menù entro 48 ore dalla ricezione del PDF,
              <strong className="text-[#111827]"> il tuo primo mese è completamente gratis.</strong>
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">14 giorni soddisfatti o rimborsati</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">48h garanzia esecuzione</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 9 — FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FAFAFA] py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827]">
              Hai domande? Abbiamo risposte.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-bold text-[#111827] pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-[#008081] flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 mb-4">Hai altre domande?</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-full hover:bg-green-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Scrivici su WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SEZIONE 10 — CTA FINALE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#008081] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-[#005c5c]" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-[80px]" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Il tuo menù online in 48 ore.
          </h2>
          <p className="text-2xl text-teal-100 font-medium mb-8">
            Manda il PDF. Pensiamo a tutto noi.
          </p>

          <a
            href={REGISTER_URL}
            className="inline-flex items-center gap-3 bg-white text-[#008081] font-extrabold px-10 py-5 rounded-full text-xl hover:bg-teal-50 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 transition-all"
          >
            Inizia gratis 14 giorni <ArrowRight className="w-6 h-6" />
          </a>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-teal-200 text-sm">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Nessun impegno</span>
            <span className="hidden sm:inline text-teal-400">·</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> 14 giorni gratis</span>
            <span className="hidden sm:inline text-teal-400">·</span>
            <span className="flex items-center gap-1.5 font-bold text-amber-300">⚡ {SPOTS_REMAINING} posti rimasti</span>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0F1A] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#008081]" />
            <span className="font-black text-white text-lg">Leomenu</span>
            <span className="text-gray-600 text-sm ml-2">Made in Italy 🇮🇹</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
            <Link to="/termini-condizioni" className="hover:text-gray-300 transition-colors">Termini di Servizio</Link>
          </div>
          <p className="text-gray-600 text-sm">© 2026 LeoMenu</p>
        </div>
      </footer>

    </div>
  );
}
