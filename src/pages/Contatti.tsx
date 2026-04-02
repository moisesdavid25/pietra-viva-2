import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, MessageCircle, ExternalLink } from 'lucide-react';

export default function Contatti() {
  return (
    <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#008081] hover:underline mb-8 font-bold">
          <ArrowLeft className="w-5 h-5" /> Torna alla Home
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Contattaci</h1>
          <p className="text-lg text-gray-500 font-medium">
            Siamo qui per aiutarti. Rispondiamo entro 24 ore nei giorni lavorativi.
          </p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <a
            href="mailto:support@leomenu.it"
            className="flex items-center gap-5 bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-[#008081]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Email supporto</p>
              <p className="font-bold text-[#1A1A1A] dark:text-white group-hover:text-[#008081] transition-colors">
                support@leomenu.it
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#008081] transition-colors" />
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/393000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-5 bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">WhatsApp</p>
              <p className="font-bold text-[#1A1A1A] dark:text-white group-hover:text-emerald-600 transition-colors">
                Chatta con noi su WhatsApp
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
          </a>

          {/* Location */}
          <div className="flex items-center gap-5 bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Sede legale</p>
              <p className="font-bold text-[#1A1A1A] dark:text-white">Italia</p>
              <p className="text-sm text-gray-500">P.IVA — in fase di registrazione</p>
            </div>
          </div>
        </div>

        {/* Legal links */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy-policy" className="text-[#008081] hover:underline font-medium">Privacy Policy</Link>
          <Link to="/termini-condizioni" className="text-[#008081] hover:underline font-medium">Termini e Condizioni</Link>
          <Link to="/prezzi" className="text-[#008081] hover:underline font-medium">Prezzi</Link>
        </div>
      </div>
    </div>
  );
}
