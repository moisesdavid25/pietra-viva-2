import { AlertTriangle, CreditCard, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  status: string;        // Stripe subscription_status
  tier: string;          // subscription_tier
  onUpgrade: () => void; // go to billing settings
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, { title: string; desc: string; color: string; bg: string }> = {
  canceled: {
    title: 'Abbonamento annullato',
    desc: 'Il tuo abbonamento è stato annullato. Riattivalo per continuare ad usare LeoMenu.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  past_due: {
    title: 'Pagamento in sospeso',
    desc: 'Il pagamento dell\'ultimo periodo non è andato a buon fine. Aggiorna il metodo di pagamento.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  unpaid: {
    title: 'Abbonamento non pagato',
    desc: 'Il pagamento non è stato ricevuto. Aggiorna i dati di pagamento per ripristinare l\'accesso.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  incomplete_expired: {
    title: 'Pagamento scaduto',
    desc: 'La finestra di pagamento è scaduta. Avvia un nuovo abbonamento per continuare.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
};

export default function SubscriptionGate({ status, tier, onUpgrade, onLogout }: Props) {
  const info = STATUS_LABELS[status] ?? {
    title: 'Accesso sospeso',
    desc: 'Il tuo abbonamento non è attivo. Attiva un piano per continuare.',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">

          {/* Top strip */}
          <div className="h-1.5 w-full bg-red-500" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold mb-4 ${info.bg} ${info.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status.replace('_', ' ').toUpperCase()}
            </div>

            <h1 className="text-[22px] font-black text-[#111827] dark:text-white mb-2 leading-tight">
              {info.title}
            </h1>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {info.desc}
            </p>

            {/* Plan info */}
            <div className="bg-gray-50 dark:bg-[#262626] rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Piano attuale</p>
              <p className="text-[15px] font-bold text-[#111827] dark:text-white capitalize">
                {tier || 'Nessun piano attivo'}
              </p>
            </div>

            {/* CTA buttons */}
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#008081] hover:bg-teal-600 text-white font-black text-[15px] rounded-2xl shadow-lg shadow-[#008081]/20 active:scale-[0.98] transition-all mb-3"
            >
              <CreditCard className="w-5 h-5" />
              Attiva / Rinnova abbonamento
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-1.5 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-[14px] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors mb-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ho già rinnovato — ricarica
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-gray-400 hover:text-gray-600 font-medium text-[13px] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci dall'account
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-4">
          Hai bisogno di aiuto?{' '}
          <a href="mailto:support@leomenu.it" className="text-[#008081] font-semibold hover:underline">
            support@leomenu.it
          </a>
        </p>
      </div>
    </div>
  );
}
