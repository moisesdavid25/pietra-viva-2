import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-[#008081] hover:underline mb-8 font-bold">
                    <ArrowLeft className="w-5 h-5" /> Torna alla Home
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-[#008081]">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-sans font-bold">Privacy Policy</h1>
                </div>

                <div className="bg-[#FBFBFB] dark:bg-[#262626] rounded-3xl p-8 md:p-12 shadow-premium border border-transparent dark:border-gray-800 prose prose-teal dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-8">Ultimo aggiornamento: Ottobre 2023</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Informazioni che Raccogliamo</h2>
                    <p>In Leomenu raccogliamo le informazioni fornite dall'utente per la creazione dell'account e del menù del proprio ristorante. Questo include indirizzo email, nome e dettagli dell'attività come indirizzo e telefono.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Come Utilizziamo le Informazioni</h2>
                    <p>Utilizziamo questi dati esclusivamente per erogare il servizio "Leomenu" (ossia per generare e mantenere online i menù e permettere l'ordinazione da parte dei clienti) e per inviare eventuali comunicazioni importanti inerenti all'account.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Condivisione delle Informazioni</h2>
                    <p>Non vendiamo né affittiamo le informazioni personali a terzi. Condividiamo i dati solo nei casi richiesti dalla legge o se strettamente necessario per l'infrastruttura di hosting (come servizi cloud di database).</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">4. Sicurezza dei Dati</h2>
                    <p>Le password sono criptate e l'accesso al database è protetto da protocolli di sicurezza standard del settore (Row Level Security e connessioni HTTPS).</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">5. Ordinazioni dei Clienti</h2>
                    <p>Quando un cliente effettua un ordine al tavolo o d'asporto, il suo nome (e se fornito, numero di tavolo) viene trasmesso al ristorante. Questi dati vengono memorizzati temporaneamente al solo scopo di completare la transazione del pasto e lo storico del locale.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">6. Contatti</h2>
                    <p>Per qualsiasi domanda sulla presente Privacy Policy o per richiedere la cancellazione dei dati, contattare il supporto all'indirizzo email indicato sul nostro sito web principale.</p>
                </div>
            </div>
        </div>
    );
}



