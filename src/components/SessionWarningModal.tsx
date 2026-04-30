import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({ secondsLeft, onStay, onLogout }: Props) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const urgency = secondsLeft <= 60; // red when < 1 min

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header strip */}
        <div className={`h-1.5 w-full transition-colors ${urgency ? 'bg-red-500' : 'bg-amber-400'}`} />

        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${urgency ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <Clock className={`w-7 h-7 transition-colors ${urgency ? 'text-red-500' : 'text-amber-500'}`} />
          </div>

          {/* Title */}
          <h2
            id="session-warning-title"
            className="text-[18px] font-black text-center text-[#111827] dark:text-white mb-1.5"
          >
            Sessione in scadenza
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-4">
            Per sicurezza, sarai disconnesso tra
          </p>

          {/* Countdown */}
          <div
            className={`text-[44px] font-black text-center mb-5 tabular-nums transition-colors ${urgency ? 'text-red-500' : 'text-[#008081]'}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {timeStr}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci ora
            </button>
            <button
              onClick={onStay}
              autoFocus
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#008081] text-white rounded-xl text-[14px] font-bold hover:bg-teal-600 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Rimani connesso
            </button>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center mt-3">
            La sessione scade dopo 30 minuti di inattività
          </p>
        </div>
      </div>
    </div>
  );
}
