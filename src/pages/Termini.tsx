import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Termini() {
  return (
    <div className="bg-white text-[#1A1A1A] font-sans min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#008081] hover:underline mb-8 font-bold">
          <ArrowLeft className="w-5 h-5" /> Torna alla Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-teal-50 rounded-2xl text-[#008081]">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold">Termini e Condizioni</h1>
        </div>

        <div className="prose max-w-none text-gray-700">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-8">Ultimo aggiornamento: Aprile 2025</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">1. Oggetto del Contratto</h2>
          <p>I presenti Termini e Condizioni regolano l'accesso e l'utilizzo della piattaforma <strong>Leomenu</strong>, un servizio SaaS ("Software as a Service") che consente a ristoratori e titolari di pubblici esercizi di creare, gestire e condividere un menù digitale interattivo tramite QR code, con funzionalità aggiuntive di gestione ordini e fidelizzazione clienti.</p>
          <p>Il servizio è fornito da <strong>Moises David Mota Rojas</strong>, Via Giovanni Pascoli 104, 03043 Cassino (FR), Italia — C.F. MTRMSD96L03Z614E.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">2. Registrazione e Periodo di Prova</h2>
          <p>Per accedere al servizio è necessario creare un account fornendo indirizzo email e password (o tramite accesso con Google). L'utente garantisce che le informazioni fornite sono veritiere e aggiornate.</p>
          <p>Ogni nuovo account beneficia di un <strong>periodo di prova gratuita di 14 giorni</strong>. Durante il trial non è richiesta alcuna carta di credito e non viene effettuato alcun addebito. Al termine dei 14 giorni, se l'utente non attiva un piano a pagamento, il menù viene disattivato ma l'account rimane accessibile.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">3. Piani e Prezzi</h2>
          <p>Leomenu offre un unico piano con funzionalità complete, disponibile nei seguenti cicli di fatturazione:</p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 my-4">
            <div className="flex justify-between"><span><strong>Mensile</strong></span><span>€29,00 / mese</span></div>
            <div className="flex justify-between"><span><strong>Semestrale</strong></span><span>€132,00 ogni 6 mesi (€22,00/mese)</span></div>
            <div className="flex justify-between"><span><strong>Annuale</strong></span><span>€204,00 / anno (€17,00/mese)</span></div>
          </div>
          <p className="text-sm">Tutti i prezzi sono IVA esclusa. L'abbonamento si rinnova automaticamente alla scadenza del periodo scelto, salvo cancellazione prima del rinnovo.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">4. Pagamento e Rinnovo</h2>
          <p>I pagamenti sono elaborati tramite <strong>Stripe</strong>, piattaforma certificata PCI DSS. Accettiamo carte di credito/debito dei principali circuiti (Visa, Mastercard, American Express).</p>
          <p>L'abbonamento si rinnova automaticamente alla scadenza. Prima di ogni rinnovo invieremo una email di promemoria all'indirizzo registrato. L'utente può disattivare il rinnovo automatico in qualsiasi momento dalla propria area personale.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">5. Cancellazione dell'Abbonamento</h2>
          <p>L'utente può cancellare il proprio abbonamento in qualsiasi momento direttamente dall'area personale, senza necessità di contattare il supporto e senza penali. In caso di cancellazione:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Il servizio rimane attivo fino alla fine del periodo già pagato.</li>
            <li>Non vengono effettuati ulteriori addebiti.</li>
            <li>I dati dell'account vengono conservati per 30 giorni dopo la scadenza, dopodiché possono essere eliminati.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">6. Politica di Rimborso</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Periodo di prova (14 giorni):</strong> gratuito, nessun addebito, nessun rimborso da richiedere.</li>
            <li><strong>Piano mensile:</strong> non rimborsabile una volta iniziato il mese di fatturazione.</li>
            <li><strong>Piano semestrale o annuale:</strong> rimborso proporzionale ai mesi interi non utilizzati, richiedibile entro 30 giorni dall'acquisto scrivendo a <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a>. Nessun rimborso è dovuto dopo i 30 giorni dall'acquisto.</li>
          </ul>
          <p className="text-sm">Per richiedere un rimborso: <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a> — risposta entro 5 giorni lavorativi.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">7. Obblighi dell'Utente</h2>
          <p>L'utente si impegna a:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Fornire informazioni veritiere sul proprio ristorante e sui prodotti in menù.</li>
            <li>Indicare correttamente prezzi e allergeni (14 allergeni UE) nel rispetto del Reg. UE 1169/2011.</li>
            <li>Non utilizzare la piattaforma per attività illegali o in violazione di diritti di terzi.</li>
            <li>Mantenere riservate le proprie credenziali di accesso.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">8. Limitazione di Responsabilità</h2>
          <p>Leomenu è uno strumento tecnologico e non interviene come parte nel rapporto tra il ristorante e i propri clienti. Non siamo responsabili di: informazioni errate inserite dall'utente nel menù, controversie tra ristorante e clienti finali, danni indiretti o perdita di profitto derivanti dall'interruzione del servizio per cause di forza maggiore o manutenzione programmata.</p>
          <p>La responsabilità massima di Leomenu nei confronti dell'utente è limitata all'importo pagato negli ultimi 3 mesi di abbonamento.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">9. Proprietà Intellettuale</h2>
          <p>Il software, il design e i contenuti della piattaforma Leomenu sono di proprietà esclusiva del titolare. I contenuti inseriti dall'utente (foto, testi del menù) rimangono di proprietà dell'utente, che concede a Leomenu una licenza limitata per la visualizzazione nell'ambito del servizio.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">10. Modifiche al Servizio e ai Termini</h2>
          <p>Ci riserviamo il diritto di modificare funzionalità e prezzi del servizio con un preavviso di almeno 30 giorni via email. Le modifiche ai presenti Termini verranno comunicate con almeno 15 giorni di anticipo. L'uso continuato del servizio dopo la data di entrata in vigore implica l'accettazione delle modifiche.</p>

          <h2 className="text-xl font-bold mt-8 mb-3 text-[#111827]">11. Legge Applicabile e Foro Competente</h2>
          <p>I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente in via esclusiva il <strong>Tribunale di Cassino (FR)</strong>, salvo diverso accordo scritto tra le parti.</p>

          <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-400">
            <p>Per qualsiasi domanda: <a href="mailto:support@leomenu.it" className="text-[#008081]">support@leomenu.it</a> — Tel. +39 366 110 0408</p>
          </div>
        </div>
      </div>
    </div>
  );
}
