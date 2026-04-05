import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';

const OBJECTIONS = [
  {
    fear: '"E se il Wi-Fi è giù durante il servizio?"',
    answer: 'Il menù Leomenu vive online, ma il tuo cliente lo apre dal suo telefono con la sua connessione — non dalla tua rete. Il Wi-Fi del locale non c\'entra. Anche se il tuo router smette di funzionare a metà cena, il menù resta online senza problemi.',
  },
  {
    fear: '"Il mio staff anziano non lo userà mai."',
    answer: 'L\'unica cosa che deve fare il tuo staff è mostrare un QR code. Lo stampate una volta, lo attaccate al tavolo, finito. Gli aggiornamenti li fai tu dal telefono — nessuno in sala deve toccare niente.',
  },
  {
    fear: '"Ho paura di perdere i dati — piatti, foto, tutto."',
    answer: 'I tuoi dati vengono salvati automaticamente su server europei, ogni giorno. Non c\'è nulla da scaricare, nulla da fare. Se domani cambi dispositivo o dimentichi la password, il tuo menù è ancora lì — intatto.',
  },
  {
    fear: '"E se decido che non fa per me?"',
    answer: 'Disdici quando vuoi, da solo, in un click. Nessuna telefonata, nessuna email, nessun ufficio da contattare. I tuoi dati restano tuoi e puoi esportarli prima di andare. Nessun costo nascosto, nessuna penale.',
  },
  {
    fear: '"Sono solo — chi mi aiuta se ho problemi?"',
    answer: 'Noi. C\'è una chat di supporto raggiungibile direttamente dall\'app e una guida in italiano che risponde alle domande più comuni. Non sei abbandonato il giorno dopo l\'iscrizione.',
  },
];

const GUARANTEES = [
  '14 giorni gratis. Nessuna carta richiesta.',
  'Disdici in un click, in qualsiasi momento.',
  'I tuoi dati sono tuoi. Sempre.',
];

export default function Sicurezza() {
  return (
    <div className="bg-white font-sans selection:bg-[#008081] selection:text-white overflow-hidden">

      {/* ─── 1. HERO ─────────────────────────────────────────── */}
      <section className="bg-[#111827] pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#008081]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
            <MessageCircle className="w-8 h-8 text-[#008081]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Hai dubbi? Bene.<br />
            <span className="text-[#008081]">Vuol dire che stai scegliendo con la testa.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Qui non trovi slide patinate. Trovi risposte dirette alle domande che ti stai già facendo.
          </p>
        </div>
      </section>

      {/* ─── 2. STATS BAR ────────────────────────────────────── */}
      <section className="bg-[#0f1a1a] py-12 px-6 border-b border-gray-800">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { val: '99.9%', label: 'Uptime garantito' },
            { val: 'GDPR', label: 'Dati protetti, server UE' },
            { val: '<2s', label: 'Tempo di caricamento' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-black text-[#008081] mb-1">{s.val}</p>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. OBJECTION CARDS (chat bubble style) ──────────── */}
      <section className="bg-[#F9FAFB] py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-12">Le domande che ci fai di più</p>
          <div className="space-y-8">
            {OBJECTIONS.map((obj, i) => (
              <div key={i} className="space-y-3">
                {/* Question bubble — owner voice */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-gray-200 rounded-3xl rounded-tl-md px-6 py-4 shadow-sm">
                    <p className="text-[#111827] font-extrabold text-base leading-snug">{obj.fear}</p>
                  </div>
                </div>
                {/* Answer bubble — Leomenu voice */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[#008081] rounded-3xl rounded-tr-md px-6 py-4 shadow-md">
                    <p className="text-white font-medium text-sm leading-relaxed">{obj.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. GUARANTEE BLOCK ──────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="border-2 border-[#008081] rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#008081] to-teal-400" />
            <p className="text-xs font-black text-[#008081] uppercase tracking-widest mb-6">Le nostre garanzie</p>
            <div className="space-y-5">
              {GUARANTEES.map((g, i) => (
                <div key={i} className="flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#008081] shrink-0" />
                  <p className="text-xl md:text-2xl font-extrabold text-[#111827]">{g}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. SUPPORT PROMISE ──────────────────────────────── */}
      <section className="bg-[#F9FAFB] py-16 px-6 border-y border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-[#008081] rounded-2xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-[#111827] text-lg mb-2">Supporto vero, in italiano.</p>
                <p className="text-gray-500 font-medium leading-relaxed text-sm">
                  Ogni ristoratore che usa Leomenu ha accesso al supporto in italiano — vero, non un bot. Se c'è un problema durante il servizio, lo risolviamo insieme.
                </p>
              </div>
            </div>
            {/* Fake chat preview */}
            <div className="mt-6 bg-[#F9FAFB] rounded-2xl p-4 border border-gray-100 space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 bg-gray-200 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-gray-500">TU</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs font-semibold text-[#111827]">Non riesco ad aggiungere una foto al piatto.</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">14:32</p>
                </div>
              </div>
              <div className="flex gap-3 items-start flex-row-reverse">
                <div className="w-7 h-7 bg-[#008081] rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white">LS</div>
                <div className="bg-[#008081] rounded-2xl rounded-tr-sm px-3 py-2">
                  <p className="text-xs font-semibold text-white">Certo! Vai su Gestione → prodotto → icona fotocamera. Vuoi che ti guido passo per passo?</p>
                  <p className="text-[10px] text-teal-200 mt-0.5">14:33 · Letto ✓✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA ────────────────────────────────────── */}
      <section className="bg-[#111827] py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#008081]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Smetti di rimandare.<br />Prova gratis, decidi dopo.
          </h2>
          <p className="text-gray-400 font-medium mb-10">
            Non ti chiediamo la carta di credito. Ti chiediamo solo di provarlo.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#008081] text-white font-extrabold px-8 py-4 rounded-full hover:bg-teal-500 hover:shadow-[0_0_30px_rgba(0,128,129,0.5)] transition-all text-lg"
          >
            Inizia i 14 giorni gratuiti <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-6">
            Nessuna carta · Nessun impegno · Disdici quando vuoi
          </p>
        </div>
      </section>

    </div>
  );
}
