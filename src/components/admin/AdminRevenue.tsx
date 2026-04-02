import { TrendingUp } from 'lucide-react';

export function AdminRevenue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">MRR & Revenue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitoraggio del fatturato ricorrente mensile</p>
      </div>

      <div className="bg-gradient-to-br from-[#008081]/5 to-white border border-[#008081]/20 rounded-3xl p-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#008081]/10 flex items-center justify-center mb-4">
          <TrendingUp size={28} className="text-[#008081]" />
        </div>
        <p className="text-lg font-black text-[#1A1A1A] mb-2">Revenue Dashboard — Prossimamente</p>
        <p className="text-sm text-gray-500 max-w-md">
          Integra Stripe per sbloccare il monitoraggio di MRR, renewals, failed payments e revenue forecast.
          I grafici si attiveranno automaticamente dopo la configurazione dei webhook.
        </p>
        <div className="mt-6 bg-gray-50 rounded-2xl px-5 py-4 text-left max-w-sm w-full">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Checklist Stripe</p>
          {[
            'Crea account Stripe',
            'Configura STRIPE_SECRET_KEY in Supabase',
            'Esegui migration stripe_columns.sql',
            'Deploy Edge Function stripe-webhook',
            'Aggiungi webhook endpoint in Stripe Dashboard',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-[10px] font-black text-gray-300 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-gray-500 font-medium">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
