import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white text-[#1A1A1A] font-sans min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#008081] hover:underline mb-8 font-bold">
          <ArrowLeft className="w-5 h-5" /> Torna alla Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-teal-50 rounded-2xl text-[#008081]">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose max-w-none text-gray-700">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-8">Ultimo aggiornamento: Aprile 2025</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">1. Titolare del Trattamento</h2>
          <p>Il Titolare del trattamento dei dati personali raccolti tramite il sito <strong>leomenu.it</strong> e la piattaforma Leomenu è:</p>
          <p className="bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">
            <strong>Moises David Mota Rojas</strong><br />
            Via Giovanni Pascoli 104, 03043 Cassino (FR), Italia<br />
            Codice Fiscale: MTRMSD96L03Z614E<br />
            Email: <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a><br />
            Tel: +39 366 110 0408
          </p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">2. Dati Raccolti</h2>
          <p>Raccogliamo le seguenti categorie di dati personali:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Dati di registrazione:</strong> nome, indirizzo email, password (cifrata).</li>
            <li><strong>Dati del ristorante:</strong> nome dell'attività, indirizzo, numero di telefono, immagini del menù.</li>
            <li><strong>Dati di pagamento:</strong> gestiti direttamente da Stripe Inc. — non conserviamo numeri di carta.</li>
            <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, cookie tecnici.</li>
            <li><strong>Dati dei clienti finali:</strong> se il ristorante utilizza la funzione ordini, il nome del cliente e il numero di tavolo vengono trasmessi al locale.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">3. Finalità e Base Giuridica</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Erogazione del servizio</strong> (base: esecuzione del contratto) — creare e mantenere online il menù digitale, gestire l'account, inviare comunicazioni operative.</li>
            <li><strong>Fatturazione e obblighi fiscali</strong> (base: obbligo legale) — conservazione dei dati contabili per 10 anni ai sensi della normativa italiana.</li>
            <li><strong>Sicurezza e prevenzione frodi</strong> (base: legittimo interesse) — protezione della piattaforma da accessi non autorizzati.</li>
            <li><strong>Miglioramento del servizio</strong> (base: legittimo interesse) — analisi aggregata dell'utilizzo della piattaforma.</li>
            <li><strong>Comunicazioni promozionali</strong> (base: consenso) — invio di newsletter e offerte, solo previo consenso esplicito.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">4. Responsabili Esterni del Trattamento</h2>
          <p>I dati sono trattati da fornitori terzi selezionati, con garanzie adeguate ai sensi del GDPR:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Supabase Inc.</strong> — database e autenticazione, server localizzati nell'Unione Europea.</li>
            <li><strong>Stripe Inc.</strong> — elaborazione dei pagamenti, certificato PCI DSS Level 1.</li>
            <li><strong>Hetzner Online GmbH / Hostinger</strong> — hosting del sito web, server in EU.</li>
          </ul>
          <p className="text-sm">Nessuno di questi fornitori è autorizzato a utilizzare i tuoi dati per finalità proprie.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">5. Conservazione dei Dati</h2>
          <p>I dati dell'account vengono conservati per tutta la durata del contratto e per i 30 giorni successivi alla cancellazione (per permettere il recupero). I dati fiscali sono conservati per 10 anni come previsto dalla legge italiana. I log di navigazione vengono eliminati entro 12 mesi.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">6. Diritti dell'Interessato</h2>
          <p>Ai sensi degli artt. 15–22 del GDPR hai diritto di:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Accedere ai tuoi dati personali</li>
            <li>Richiederne la rettifica o l'aggiornamento</li>
            <li>Richiederne la cancellazione ("diritto all'oblio")</li>
            <li>Richiedere la limitazione del trattamento</li>
            <li>Ricevere i dati in formato portabile</li>
            <li>Opporti al trattamento basato su legittimo interesse</li>
            <li>Revocare il consenso in qualsiasi momento (senza pregiudicare la liceità del trattamento precedente)</li>
          </ul>
          <p className="text-sm">Per esercitare questi diritti scrivi a <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a>. Hai anche il diritto di presentare reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" className="text-[#008081]" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>).</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">7. Cookie</h2>
          <p>Utilizziamo cookie tecnici necessari per il funzionamento del servizio e cookie analitici per migliorare l'esperienza utente. Per maggiori dettagli consulta la nostra <Link to="/cookie-policy" className="text-[#008081] hover:underline">Cookie Policy</Link>.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">8. Modifiche alla Privacy Policy</h2>
          <p>Ci riserviamo il diritto di aggiornare questa informativa. Le modifiche sostanziali verranno comunicate via email agli utenti registrati. La versione aggiornata è sempre disponibile su questa pagina.</p>

          <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-400">
            <p>Per qualsiasi domanda: <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
