import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Gift, ChevronDown, ChevronUp, AlertCircle, LogOut } from 'lucide-react';
import db from '../../db';

interface Props {
  restaurantId: string;
  restaurantName: string;
  session: any;
  onLogout: () => void;
  defaultOpen?: boolean;
}

interface CustomerRecord {
  id: string;
  name: string;
  total_points: number;
}

export default function UserProfile({ restaurantId, restaurantName, session, onLogout, defaultOpen = false }: Props) {
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [error, setError] = useState('');
  const [rewardConfig, setRewardConfig] = useState({ threshold: 100, reward: 'Premio' });

  useEffect(() => {
    const initProfile = async () => {
      if (!session?.user?.id || !restaurantId) return;

      try {
        // Fetch Reward Settings
        const { data: settings } = await db.from('settings')
          .select('key, value')
          .eq('restaurant_id', restaurantId)
          .in('key', ['loyalty_threshold', 'loyalty_reward']);
        
        if (settings) {
          const t = settings.find(s => s.key === 'loyalty_threshold')?.value;
          const r = settings.find(s => s.key === 'loyalty_reward')?.value;
          setRewardConfig({
            threshold: t ? parseInt(t, 10) : 100,
            reward: r || 'Premio'
          });
        }

        // Fetch or Create Customer Record
        const { data, error: fetchErr } = await db
          .from('customers')
          .select('id, name, total_points')
          .eq('auth_user_id', session.user.id)
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (data) {
          setCustomer(data);
        } else {
          // Auto-provision an empty record for this new restaurant visit
          const newName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Nuovo Cliente';
          const { data: newCustomer, error: insertErr } = await db
            .from('customers')
            .insert({
              restaurant_id: restaurantId,
              auth_user_id: session.user.id,
              name: newName,
              email: session.user.email,
              total_points: 0
            })
            .select('id, name, total_points')
            .maybeSingle();

          if (insertErr) {
              if (insertErr.code === '23505') {
                 // Already exists, fetch it
                 const { data: existingTarget } = await db.from('customers')
                    .select('id, name, total_points')
                    .eq('auth_user_id', session.user.id)
                    .eq('restaurant_id', restaurantId)
                    .single();
                 if (existingTarget) setCustomer(existingTarget);
              } else {
                 console.error("Failed to provision loyalty profile:", insertErr);
                 setError("Errore durante l'inizializzazione del profilo.");
              }
          } else if (newCustomer) {
            setCustomer(newCustomer);
          }
        }
      } catch (err) {
        console.error("Profile Error", err);
        setError("Si è verificato un errore.");
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [session, restaurantId]);

  if (loading) return null;

  return (
    <div className="w-full rounded-3xl border border-[#008081]/20 bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-premium transition-all duration-300">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#008081] shadow-md shadow-[#008081]/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex flex-col">
            <span className="font-black text-base text-[#1A1A1A] dark:text-white uppercase tracking-tight leading-tight">Leomenu Passport</span>
            <span className="text-xs text-[#008081] font-bold">
              {customer ? `${customer.total_points} STELLE IN ${restaurantName.toUpperCase()}` : 'CARICAMENTO...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {customer && (
            <span className="bg-[#008081] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              ⭐ {customer.total_points}
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {isOpen ? <ChevronUp className="w-4 h-4 text-[#008081]" /> : <ChevronDown className="w-4 h-4 text-[#008081]" />}
          </div>
        </div>
      </button>

      {/* Collapsible body */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-6 border-t border-gray-100 dark:border-gray-800">
            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {customer && (
              <div className="pt-6 flex flex-col items-center gap-5">
                <div className="bg-gradient-to-b from-[#008081]/5 to-[#008081]/10 dark:from-[#008081]/10 dark:to-[#008081]/20 rounded-3xl p-6 flex flex-col items-center gap-4 w-full border border-[#008081]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#008081]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <p className="font-black text-xl text-[#1A1A1A] dark:text-white tracking-tight z-10 text-center">
                    Ciao, {customer.name.split(' ')[0]}! 👋
                  </p>
                  
                  {/* Premium QR Code Display encoding the GLOBAL auth.user.id */}
                  <div className="bg-white p-4 rounded-[2rem] shadow-xl border-4 border-white/50 dark:border-gray-800/50 relative z-10 transform hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG
                      value={session.user.id}
                      size={180}
                      fgColor="#008081"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  
                  {/* Reward Progress Banner */}
                  <div className="w-full bg-[#1A1A1A] p-4 rounded-2xl shadow-inner border border-white/10 z-10 flex flex-col items-center mt-2">
                    {customer.total_points >= rewardConfig.threshold ? (
                      <div className="text-center">
                        <Gift className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-bounce" />
                        <p className="font-bold text-amber-400 text-sm">Hai raggiunto le stelle per la tua {rewardConfig.reward}!</p>
                      </div>
                    ) : (
                      <div className="text-center w-full">
                        <p className="text-xs text-gray-300 font-bold mb-2">Ti mancano <span className="text-[#008081] text-sm">{Math.max(0, rewardConfig.threshold - customer.total_points)}</span> stelle per la tua {rewardConfig.reward}</p>
                        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-[#008081] h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (customer.total_points / rewardConfig.threshold) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Esci dal profilo Passport
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


