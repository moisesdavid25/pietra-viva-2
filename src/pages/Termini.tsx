import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Termini() {
    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-[#008080] hover:underline mb-8 font-bold">
                    <ArrowLeft className="w-5 h-5" /> Torna alla Home
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-[#008080]">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold">Termini e Condizioni</h1>
                </div>

                <div className="bg-[#FBFBFB] dark:bg-[#262626] rounded-3xl p-8 md:p-12 shadow-premium border border-transparent dark:border-gray-800 prose prose-teal dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-8">Ultimo aggiornamento: Ottobre 2023</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Accettazione dei Termini</h2>
                    <p>Accedendo e utilizzando Leomenu, accetti di essere vincolato dai presenti Termini e Condizioni. Se non sei d'accordo con una o più disposizioni previste, sei pregato di non utilizzare la piattaforma.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Uso del Servizio</h2>
                    <p>Leomenu è una piattaforma SaaS ("Software as a Service") che consente a ristoranti e locali ("Commercianti") di creare, personalizzare e condividere un menù digitale in formato digitale interattivo gestendo anche ordinazioni. L'utente si impegna a fornire informazioni veritiere (inclusa la validità dei prezzi indicati ed eventuali allergeni) nel rispetto legislativo del proprio paese di attività.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Limitazione di Responsabilità</h2>
                    <p>Leomenu offre una tecnologia vetrina e di inoltro ordini, non intervenendo come parte nella preparazione logistica dei prodotti e nei rapporti tra Commerciante e consumatore finale. Non siamo responsabili di controversie insorte sui pagamenti o sulla veridicità e legalità dei cibi elencati nei menù configurati.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">4. Creazione dell'Account e Sicurezza</h2>
                    <p>L'utilizzo delle funzionalità complete richiede la creazione di un account. Sei l'esclusivo responsabile della confidenzialità delle credenziali d'accesso. Consigliamo di non condividere password con personale ed usare un indirizzo email aziendale protetto.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">5. Chiusura o Sospensione dell'Account</h2>
                    <p>Ci riserviamo il diritto tecnico di intervenire o sospendere account che violino questo regolamento o per inattività prolungata in base alle regole di salvataggio pattuite in fase contrattuale o da accordi specifici con l'amministratore su piattaforma cloud.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">6. Modifiche a questi Termini</h2>
                    <p>Possiamo alterare queste disposizioni per aggiornare prassi aziendali. Aggiornamenti sostanziali verranno comunicati tramite notifica email. L'uso continuato al servizio dopo modifiche implica l'accettazione automatica dei nuovi Termini.</p>
                </div>
            </div>
        </div>
    );
}
