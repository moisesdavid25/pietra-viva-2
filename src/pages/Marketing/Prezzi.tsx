import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Clock, ChevronDown, ChevronUp } from 'lucide-react';

type BillingPeriod = 'mensile' | 'semestrale' | 'annuale';

const PLANS: Record<BillingPeriod, {
  price: number; total: string; saving: string | null; annualSaving: string | null;
  label: string; descriptor: string; discount: string | null;
}> = {
  mensile:    { price: 29, total: '€29 al mese',        saving: null,          annualSaving: null,       label: 'Mensile',    descriptor: 'Flessibile, senza vincoli',                    discount: null },
  semestrale: { price: 22, total: '€132 ogni 6 mesi',   saving: 'Risparmi €42', annualSaving: 'Risparmi €42 rispetto al mensile', label: 'Semestrale', descriptor: 'Il giusto equilibrio tra libertà e risparmio', discount: '-24%' },
  annuale:    { price: 17, total: '€204 all\'anno',     saving: 'Risparmi €144', annualSaving: 'Risparmi €144 rispetto al mensile', label: 'Annuale',    descriptor: 'Il più scelto — e si vede dal conto',          discount: '-41%' },
};

const FEATURES_INCLUDED = [
  { label: 'Menù digitale con QR Code personalizzato', soon: false },
  { label: 'Categorie e prodotti illimitati', soon: false },
  { label: 'Menu del Giorno con specialità dello chef', soon: false },
  { label: 'Programma Fedeltà (Carta Fedeltà digitale)', soon: false },
  { label: 'Gestione Ordini & Comande (LeoPOS)', soon: false },
  { label: 'Aggiornamenti in tempo reale da smartphone', soon: false },
  { label: 'Supporto in italiano 7 giorni su 7', soon: false },
  { label: 'Traduzione multilingua automatica', soon: true },
  { label: 'Filtri Allergeni (14 Allergeni UE)', soon: true },
  { label: 'Import menù con AI (foto/PDF)', soon: true },
  { label: 'Galleria di template pronti', soon: true },
];

const FAQS = [
  {
    q: 'Quanto devo pagare per iniziare?',
    a: 'Niente. I primi 14 giorni sono gratis e non ti chiediamo nessuna carta di credito. Paghi solo se decidi di restare — e di solito si decide in fretta.',
  },
  {
    q: 'Posso cambiare piano dopo?',
    a: 'Sì, quando vuoi. Puoi passare da mensile ad annuale (o viceversa) dalla tua area personale, senza chiamare nessuno.',
  },
  {
    q: 'Cosa succede dopo i 14 giorni?',
    a: 'Ti mandiamo un promemoria prima della scadenza. Scegli il piano che preferisci e continui. Se non fai nulla, il profilo rimane ma il menù va offline — nessun addebito automatico.',
  },
  {
    q: 'Ho bisogno di un tecnico per configurarlo?',
    a: 'No. Se sai usare WhatsApp, sai usare Leomenu. Carichi le foto, scrivi i piatti, premi pubblica. Fatto.',
  },
  {
    q: 'I dati del mio menù sono al sicuro?',
    a: 'Sì. I tuoi dati sono salvati su server europei con backup automatico. Non li vendiamo, non li condividiamo, non spariscono se cambi piano.',
  },
];

export default function Prezzi() {
  const [selected, setSelected] = useState<BillingPeriod>('annuale');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const plan = PLANS[selected];

  return (
    <div className="pt-20 pb-0 bg-[#FBFBFB] min-h-screen font-sans selection:bg-[#008081] selection:text-white">

      {/* ─── 1. HERO ─────────────────────────────────────────── */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#008081]/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-block px-3 py-1 bg-teal-50 text-[#008081] text-xs font-black uppercase tracking-widest rounded-full mb-6 border border-teal-100">
            14 giorni gratis · Nessuna carta richiesta
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] mb-5 tracking-tight leading-tight">
            Un prezzo. Tutto incluso.<br className="hidden md:block" />
            <span className="text-[#008081]">Nessuna sorpresa.</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto mb-3">
            Un abbonamento fisso, nessuna commissione, nessun costo a modifica. Aggiorna il tuo menù quanto vuoi — il prezzo non cambia mai.
          </p>
          <p className="text-sm font-bold text-gray-400">
            Solo le stampe del menù ti costano <span className="text-[#111827]">€200–400 l'anno</span>. Con Leomenu li aggiorni in 30 secondi, gratis.
          </p>
        </div>
      </section>

      {/* ─── 2. BILLING SELECTOR ─────────────────────────────── */}
      <div className="flex justify-center mb-10 px-6">
        <div className="bg-white p-1.5 rounded-full border border-gray-200 inline-flex items-center shadow-sm gap-1">
          {(Object.keys(PLANS) as BillingPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelected(period)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                selected === period ? 'bg-[#111827] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PLANS[period].label}
              {PLANS[period].discount && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  selected === period ? 'bg-teal-500 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {PLANS[period].discount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. PRICING CARD ─────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-6 mb-16">
        <div className="relative pt-5">
          {selected === 'annuale' && (
            <div className="absolute top-0 inset-x-0 flex justify-center z-10">
              <span className="bg-[#008081] text-white text-xs font-black uppercase tracking-widest py-1.5 px-5 rounded-full shadow-lg shadow-[#008081]/30 border border-teal-500">
                Il Più Scelto
              </span>
            </div>
          )}
          <div className="bg-[#111827] rounded-3xl p-8 md:p-10 border-2 border-[#008081] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#008081] to-teal-400" />

            {/* Price */}
            <div className="mt-2 mb-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-6xl font-black text-white">€{plan.price}</span>
                <span className="text-gray-400 font-bold text-xl">/mese</span>
              </div>
              <p className="text-gray-400 text-sm font-semibold">{plan.total}</p>
              {plan.saving && (
                <p className="text-teal-400 font-bold text-sm mt-1.5">✓ {plan.annualSaving}</p>
              )}
              {selected === 'annuale' && (
                <p className="text-gray-500 text-xs font-semibold mt-1 italic">
                  Chi sceglie annuale risparmia €144 e smette di pensarci per dodici mesi.
                </p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {FEATURES_INCLUDED.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  {f.soon
                    ? <Clock className="w-4 h-4 text-gray-600 shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-[#008081] shrink-0" />
                  }
                  <span className={`text-sm font-medium ${f.soon ? 'text-gray-600' : 'text-gray-300'}`}>
                    {f.label}
                  </span>
                  {f.soon && (
                    <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 font-black uppercase tracking-wider whitespace-nowrap">
                      Prossimamente
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Link
              to="/register"
              className="block w-full text-center py-4 rounded-xl bg-[#008081] text-white font-extrabold text-lg hover:bg-teal-500 hover:shadow-[0_0_24px_rgba(0,128,129,0.4)] transition-all active:scale-95"
            >
              Inizia ora, paghi dopo <ArrowRight className="inline w-5 h-5 ml-1" />
            </Link>

            <p className="text-center text-xs text-gray-600 mt-4 flex justify-center items-center gap-1.5 font-bold">
              <Shield className="w-3.5 h-3.5" />
              14 giorni gratuiti — nessuna carta richiesta
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. ROI COMPARISON BLOCK ─────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 mb-16">
        <p className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Il confronto che fa riflettere</p>
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Old way */}
            <div className="p-8 relative">
              <div className="absolute top-4 right-4 bg-[#111827] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                Il vecchio modo
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 mt-4">Agenzia / Stampa</p>
              <p className="text-3xl md:text-4xl font-extrabold text-gray-800 line-through decoration-red-400 decoration-2">
                €150–300<span className="text-base font-semibold text-gray-400">/modifica</span>
              </p>
              <p className="text-gray-500 text-sm font-medium mt-3 leading-relaxed">
                3–5 giorni di attesa. Ogni stagione da capo. Ogni errore si paga.
              </p>
            </div>
            {/* Leomenu */}
            <div className="p-8 bg-teal-50/40 relative">
              <div className="absolute top-4 right-4 bg-[#008081] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                Leomenu
              </div>
              <p className="text-[#008081] text-xs font-black uppercase tracking-widest mb-3 mt-4">Aggiornamenti illimitati</p>
              <p className="text-3xl md:text-4xl font-extrabold text-[#111827]">
                €17<span className="text-base font-semibold text-gray-500">/mese</span>
              </p>
              <p className="text-gray-600 text-sm font-medium mt-3 leading-relaxed">
                Modifiche istantanee. Nessun limite. Da qualsiasi dispositivo.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm font-extrabold text-[#111827]">
              = risparmi fino a <span className="text-[#008081]">€3.396 ogni anno</span> rispetto a un'agenzia
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. TRUST STRIP ──────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-8 px-6 mb-16">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            { icon: '🔒', label: 'Pagamenti sicuri', sub: 'Stripe' },
            { icon: '🇪🇺', label: 'Conforme GDPR', sub: 'Dati in Europa' },
            { icon: '🛡️', label: 'Database certificato', sub: 'Supabase' },
            { icon: '🔐', label: 'Connessione cifrata', sub: 'SSL 256-bit' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 text-center">
              <span className="text-xl">{t.icon}</span>
              <div className="text-left">
                <p className="text-xs font-extrabold text-[#111827]">{t.label}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. FAQ ACCORDION ────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 mb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] text-center mb-10">Domande Frequenti</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#008081]/20 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4"
              >
                <span className="text-[15px] font-extrabold text-[#111827]">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 text-[#008081] shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <p className="text-gray-500 font-medium leading-relaxed text-sm pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. FINAL CTA ────────────────────────────────────── */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#008081]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4">Inizia gratis. Decidi dopo.</h2>
          <p className="text-gray-400 font-medium mb-10">
            Non ti chiediamo la carta di credito. Ti chiediamo solo di provarlo.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#008081] text-white font-extrabold px-8 py-4 rounded-full hover:bg-teal-500 hover:shadow-[0_0_30px_rgba(0,128,129,0.5)] transition-all text-lg"
          >
            Inizia ora, paghi dopo <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-6">
            Nessuna carta · 14 giorni gratis · Disdici in un click
          </p>
        </div>
      </section>

      {/* ─── 8. LEGAL FOOTNOTE ───────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-10 border-t border-gray-100">
        <p className="text-center text-[11px] text-gray-400 font-medium leading-relaxed">
          I prezzi indicati sono in Euro. Il pagamento è processato in modo sicuro da <strong>Stripe</strong>.
          Attivando l'abbonamento accetti i{' '}
          <Link to="/termini" className="underline hover:text-[#008081]">Termini di Servizio</Link>{' '}
          e la{' '}
          <Link to="/privacy" className="underline hover:text-[#008081]">Privacy Policy</Link>.{' '}
          Puoi cancellare in qualsiasi momento dal tuo pannello.
          Assistenza: <a href="mailto:support@leomenu.it" className="underline hover:text-[#008081]">support@leomenu.it</a>
        </p>
      </div>

    </div>
  );
}
