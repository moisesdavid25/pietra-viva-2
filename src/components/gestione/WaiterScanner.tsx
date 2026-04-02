import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle, AlertCircle, Euro, Gift } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import db from '../../db';

interface Props {
  restaurantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ScanStep = 'scanning' | 'confirm' | 'success';

interface ScannedCustomer {
  id: string;
  name: string;
  auth_user_id: string;
  total_points: number;
}

interface Reward {
  id: string;
  name: string;
  points_required: number;
}

export default function WaiterScanner({ restaurantId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<ScanStep>('scanning');
  const [customer, setCustomer] = useState<ScannedCustomer | null>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const didScanRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scannerId = 'waiter-qr-scanner';

    db.from('rewards')
      .select('id, name, points_required')
      .eq('restaurant_id', restaurantId)
      .order('points_required', { ascending: true })
      .then(({ data }) => { if (data) setRewards(data as Reward[]); });

    // Small delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (didScanRef.current) return;
            didScanRef.current = true;

            // Stop camera
            try { await html5QrCode.stop(); } catch (_) {}

            // Fetch customer from DB primarily by auth_user_id
            let { data, error: dbErr } = await db
              .from('customers')
              .select('id, name, auth_user_id, total_points')
              .eq('auth_user_id', decodedText.trim())
              .eq('restaurant_id', restaurantId)
              .maybeSingle();

            // Auto-provision an internal record if the user exists in Supabase Auth but not at this restaurant yet.
            if (!data && !dbErr && decodedText.trim().length === 36) { // naive UUID check
              const { data: newCust, error: insErr } = await db
                .from('customers')
                .insert({
                  restaurant_id: restaurantId,
                  auth_user_id: decodedText.trim(),
                  name: 'Cliente Passport',
                  total_points: 0
                })
                .select('id, name, auth_user_id, total_points')
                .maybeSingle();
                
              if (newCust && !insErr) {
                data = newCust;
              }
            }

            if (!data) {
              setError('QR non valido o cliente non trovato.');
              didScanRef.current = false;
              // Restart scanner
              try {
                await html5QrCode.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 220, height: 220 } },
                  () => {},
                  () => {}
                );
              } catch (_) {}
              return;
            }

            setCustomer(data as ScannedCustomer);
            setStep('confirm');
          },
          (_errorMessage) => { /* ignore scan errors */ }
        );
      } catch (err: any) {
        setCameraError('Impossibile accedere alla fotocamera. Controlla i permessi.');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [restaurantId]);

  const getTierMultiplier = (pts: number) => {
    if (pts >= 2500) return { multiplier: 1.7, label: 'Reserve 💎', color: 'text-purple-600' };
    if (pts >= 500)  return { multiplier: 1.2, label: 'Gold ⭐', color: 'text-yellow-600' };
    return { multiplier: 1.0, label: 'Green 🌿', color: 'text-[#008081]' };
  };

  const handleSavePoints = async () => {
    if (!customer) return;
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Inserisci un importo valido.");
      return;
    }

    setSaving(true);
    const { multiplier } = getTierMultiplier(customer.total_points);
    const pointsEarned = Math.floor(amountNum * 3 * multiplier);
    const newTotal = customer.total_points + pointsEarned;

    const [updateRes, insertRes] = await Promise.all([
      db.from('customers').update({ total_points: newTotal }).eq('id', customer.id),
      db.from('loyalty_transactions').insert({
        customer_id: customer.id,
        restaurant_id: restaurantId,
        amount_spent: amountNum,
        points_earned: pointsEarned,
      }),
    ]);

    if (updateRes.error || insertRes.error) {
      setError('Errore durante il salvataggio. Riprova.');
      setSaving(false);
      return;
    }

    setCustomer(prev => prev ? { ...prev, total_points: newTotal } : null);
    setRedeemSuccessMsg('');
    setStep('success');
    setSaving(false);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };


  const handleRedeemReward = async (reward: Reward) => {
    if (!customer) return;
    if (customer.total_points < reward.points_required) {
      setError(`Non ha abbastanza Stelle per ${reward.name}.`);
      return;
    }
    if (!window.confirm(`Sei sicuro di voler riscattare "${reward.name}"? Verranno scalate ${reward.points_required} Stelle.`)) return;

    setSaving(true);
    const newTotal = customer.total_points - reward.points_required;
    
    // We only update the total points so we don't skew the 'Total Awarded' metric with negative loyalty_transactions
    const { error: updateErr } = await db.from('customers').update({ total_points: newTotal }).eq('id', customer.id);
    
    if (updateErr) {
      setError('Errore durante il riscatto del premio.');
      setSaving(false);
      return;
    }
    
    setCustomer(prev => prev ? { ...prev, total_points: newTotal } : null);
    setRedeemSuccessMsg(`Premio riscattato: ${reward.name}`);
    setStep('success');
    setSaving(false);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#008081]" />
            <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">
              {step === 'scanning' ? 'Scansiona QR Cliente' : step === 'confirm' ? 'Aggiungi Stelle' : 'Stelle Aggiunte!'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Step 1: Camera scanner */}
          {step === 'scanning' && (
            <div className="flex flex-col gap-4">
              {cameraError ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-red-500 text-center">{cameraError}</p>
                </div>
              ) : (
                <>
                  <div
                    id="waiter-qr-scanner"
                    ref={containerRef}
                    className="w-full rounded-2xl overflow-hidden bg-black"
                    style={{ minHeight: '280px' }}
                  />
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Inquadra il QR della Carta Fedeltà del cliente
                  </p>
                </>
              )}
            </div>
          )}

          {/* Step 2: Confirm amount */}
          {step === 'confirm' && customer && (() => {
            const tierInfo = getTierMultiplier(customer.total_points);
            const amtNum = parseFloat(amount.replace(',', '.'));
            const previewPts = amount && !isNaN(amtNum) && amtNum > 0 ? Math.floor(amtNum * 3 * tierInfo.multiplier) : null;
            return (
            <div className="flex flex-col gap-4">
              <div className="bg-[#008081]/5 dark:bg-[#008081]/10 rounded-2xl p-4 flex items-center gap-3 border border-[#008081]/15">
                <div className="w-10 h-10 rounded-full bg-[#008081] text-white flex items-center justify-center font-black text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] dark:text-white">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.total_points} Stelle · <span className={`font-bold ${tierInfo.color}`}>{tierInfo.label} {tierInfo.multiplier}×</span></p>
                </div>
              </div>

              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#008081]" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Importo conto (es. 45.50)"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] text-base font-bold focus:outline-none focus:border-[#008081] transition-colors"
                />
              </div>

              {previewPts !== null && (
                <div className="bg-[#008081]/5 rounded-xl px-4 py-2.5 flex items-center justify-between border border-[#008081]/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stelle guadagnate <span className={`text-[10px] font-bold ${tierInfo.color}`}>({tierInfo.multiplier}×)</span></span>
                  <span className="font-black text-[#008081] text-lg">+{previewPts} Stelle</span>
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { setStep('scanning'); didScanRef.current = false; }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Indietro
                </button>
                <button
                  onClick={handleSavePoints}
                  disabled={saving || !amount}
                  className="flex-1 py-3 rounded-xl bg-[#008081] hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-[#008081]/20 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && !redeemSuccessMsg ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salva Stelle'}
                </button>
              </div>

              {rewards.length > 0 && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                    <Gift className="w-4 h-4" /> Riscatta Premio
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {rewards.map(reward => {
                      const canAfford = customer.total_points >= reward.points_required;
                      return (
                        <div key={reward.id} className="flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                           <div className="flex flex-col">
                             <span className="font-bold text-sm text-[#1A1A1A] dark:text-white capitalize">{reward.name}</span>
                             <span className="text-xs text-[#008081] font-black">{reward.points_required} Stelle</span>
                           </div>
                           <button
                             disabled={!canAfford || saving}
                             onClick={() => handleRedeemReward(reward)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${canAfford ? 'bg-[#008081]/10 text-[#008081] hover:bg-[#008081] hover:text-white dark:bg-[#008081]/20' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'}`}
                           >
                             Riscatta
                           </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* Step 3: Success */}
          {step === 'success' && customer && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-[#008081]/10 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-[#008081]" />
              </div>
              <p className="font-black text-lg text-[#1A1A1A] dark:text-white">Fatto!</p>
              {redeemSuccessMsg && (
                <p className="text-sm font-bold text-[#008081] text-center mb-1">{redeemSuccessMsg}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                <span className="font-bold text-[#1A1A1A] dark:text-white">{customer.name}</span> ora ha{' '}
                <span className="font-black text-[#008081]">{customer.total_points} Stelle</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


