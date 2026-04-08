import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="bg-white text-[#1A1A1A] font-sans min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#008081] hover:underline mb-8 font-bold">
          <ArrowLeft className="w-5 h-5" /> Torna alla Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-teal-50 rounded-2xl text-[#008081]">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
        </div>

        <div className="prose max-w-none text-gray-700">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-8">Ultimo aggiornamento: Aprile 2025</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">1. Cosa sono i Cookie</h2>
          <p>I cookie sono piccoli file di testo che i siti web salvano nel browser dell'utente durante la navigazione. Servono a far funzionare correttamente il sito, ricordare le preferenze e raccogliere informazioni sull'utilizzo in forma aggregata.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">2. Cookie Utilizzati da Leomenu</h2>

          <h3 className="text-base font-bold mt-6 mb-2 text-[#111827]">Cookie Tecnici (necessari)</h3>
          <p>Questi cookie sono indispensabili per il funzionamento del sito e non possono essere disabilitati. Non raccolgono dati personali a fini di profilazione.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-3 my-4">
            <div>
              <p className="font-bold">Sessione di autenticazione</p>
              <p className="text-gray-500">Mantiene l'utente connesso al proprio account. Durata: sessione / 7 giorni (se "ricordami" attivo). Fornitore: Supabase.</p>
            </div>
            <div>
              <p className="font-bold">Preferenze cookie</p>
              <p className="text-gray-500">Salva la scelta dell'utente riguardo al consenso cookie. Durata: 1 anno. Fornitore: Leomenu (localStorage).</p>
            </div>
          </div>

          <h3 className="text-base font-bold mt-6 mb-2 text-[#111827]">Cookie Funzionali</h3>
          <p>Migliorano l'esperienza di navigazione ricordando preferenze come la lingua o l'ultimo piano visualizzato. Non tracciano l'utente su altri siti.</p>

          <h3 className="text-base font-bold mt-6 mb-2 text-[#111827]">Cookie Analitici</h3>
          <p>Utilizziamo dati di navigazione in forma aggregata e anonima per capire come gli utenti interagiscono con il sito e migliorare i contenuti. Non identifichiamo singoli utenti.</p>

          <h3 className="text-base font-bold mt-6 mb-2 text-[#111827]">Cookie di Profilazione / Pubblicità</h3>
          <p className="font-medium text-green-700 bg-green-50 rounded-lg px-4 py-2">Leomenu <strong>non utilizza</strong> cookie di profilazione o pubblicità comportamentale di terze parti.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">3. Come Gestire i Cookie</h2>
          <p>Puoi gestire o disabilitare i cookie direttamente dalle impostazioni del tuo browser. Tieni presente che disabilitare i cookie tecnici potrebbe compromettere il funzionamento del sito.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><a href="https://support.google.com/chrome/answer/95647" className="text-[#008081]" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox" className="text-[#008081]" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" className="text-[#008081]" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-[#008081]" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">4. Titolare del Trattamento</h2>
          <p className="bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">
            <strong>Moises David Mota Rojas</strong><br />
            Via Giovanni Pascoli 104, 03043 Cassino (FR), Italia<br />
            Email: <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a>
          </p>
          <p className="text-sm">Per maggiori informazioni sul trattamento dei dati personali consulta la nostra <Link to="/privacy-policy" className="text-[#008081] hover:underline">Privacy Policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}
