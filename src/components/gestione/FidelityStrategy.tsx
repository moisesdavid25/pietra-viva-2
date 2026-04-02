import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import db from '../../db';

interface Props { restaurantId: string; }

type TierKey = 'green' | 'gold' | 'reserve';

interface TierBenefits {
  green: string[];
  gold: string[];
  reserve: string[];
}

const DEFAULTS: TierBenefits = {
  green:   ['Accesso al programma fedeltà', 'Premi base sbloccati', 'Stelle ad ogni visita'],
  gold:    ['Moltiplicatore 1.2× sulle stelle', 'Regalo di Compleanno', 'Offerte mensili personalizzate'],
  reserve: ['Moltiplicatore 1.7× sulle stelle', 'Refill Caffè gratuito', 'Tavolo VIP riservato', 'Inviti eventi esclusivi'],
};

const TIERS: { key: TierKey; label: string; emoji: string; color: string; range: string }[] = [
  { key: 'green',   label: 'Green',   emoji: '🌿', color: 'text-[#008081] border-[#008081]/20 bg-[#008081]/5',     range: '0 – 499 Stars · 1.0×' },
  { key: 'gold',    label: 'Gold',    emoji: '⭐', color: 'text-yellow-700 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30',  range: '500 – 2499 Stars · 1.2×' },
  { key: 'reserve', label: 'Reserve', emoji: '💎', color: 'text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-900/30', range: '2500+ Stars · 1.7×' },
];

const INDUSTRY: { icon: string; type: string; pts: number; cogs: string; revenue: string; unit: string }[] = [
  { icon: '🍔', type: 'Casual / Fast Food', pts: 45,   cogs: '€1.00',  revenue: '€15.00', unit: 'Stars' },
  { icon: '☕', type: 'Bar / Caffetteria',  pts: 250,  cogs: '€6.00',  revenue: '€83.00', unit: 'Stars' },
  { icon: '🍷', type: 'Fine Dining',        pts: 1000, cogs: '€20.00', revenue: '€333.00', unit: 'Stars' },
];

export default function FidelityStrategy({ restaurantId }: Props) {
  const [benefits, setBenefits] = useState<TierBenefits>(DEFAULTS);
  const [saving, setSaving] = useState<TierKey | null>(null);
  const [editingTier, setEditingTier] = useState<TierKey | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await db.from('settings')
        .select('key, value')
        .eq('restaurant_id', restaurantId)
        .in('key', ['tier_benefits_green', 'tier_benefits_gold', 'tier_benefits_reserve']);
      if (data) {
        const merged: TierBenefits = { ...DEFAULTS };
        data.forEach((row: any) => {
          const tier = row.key.replace('tier_benefits_', '') as TierKey;
          try { merged[tier] = JSON.parse(row.value); } catch {}
        });
        setBenefits(merged);
      }
    };
    load();
  }, [restaurantId]);

  const saveTier = async (tier: TierKey, items: string[]) => {
    setSaving(tier);
    await db.from('settings').upsert(
      { restaurant_id: restaurantId, key: `tier_benefits_${tier}`, value: JSON.stringify(items) },
      { onConflict: 'restaurant_id,key' }
    );
    setSaving(null);
  };

  const addItem = (tier: TierKey) => {
    if (!newItem.trim()) return;
    const updated = [...benefits[tier], newItem.trim()];
    setBenefits(p => ({ ...p, [tier]: updated }));
    saveTier(tier, updated);
    setNewItem('');
  };

  const removeItem = (tier: TierKey, idx: number) => {
    const updated = benefits[tier].filter((_, i) => i !== idx);
    setBenefits(p => ({ ...p, [tier]: updated }));
    saveTier(tier, updated);
  };

  const saveEdit = (tier: TierKey, idx: number) => {
    if (!editText.trim()) return;
    const updated = benefits[tier].map((v, i) => i === idx ? editText.trim() : v);
    setBenefits(p => ({ ...p, [tier]: updated }));
    saveTier(tier, updated);
    setEditIdx(null);
    setEditText('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-[#008081]" />
        <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Strategia Fidelity</h3>
      </div>

      {/* How it works: 1€ = 3 Stars */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Come funziona il sistema Stelle</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-[#008081]/5 border border-[#008081]/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-[#008081]">1€</p>
            <p className="text-[9px] text-gray-500 mt-0.5">spesa cliente</p>
          </div>
          <span className="text-gray-400 font-black text-xl">=</span>
          <div className="flex-1 bg-[#008081]/5 border border-[#008081]/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-[#008081]">3</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Stelle guadagnate</p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">💰 Guadagno Garantito</p>
          <p className="text-[11px] text-green-700/80 dark:text-green-400/80 leading-relaxed">
            Premio da <strong>45 Stars</strong> = cliente ha speso <strong>€15</strong>. Se il Costo Reale Premio è <strong>€1.50</strong>, il margine lordo è <strong>€13.50 (90%)</strong>. Proteggi il tuo business con premi mirati.
          </p>
        </div>
      </div>

      {/* Tier grid */}
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map(t => (
          <div key={t.key} className={`rounded-xl p-3 text-center border ${t.color}`}>
            <p className="text-lg">{t.emoji}</p>
            <p className="font-black text-xs mt-0.5">{t.label}</p>
            <p className="text-[9px] mt-0.5 opacity-70">{t.range}</p>
          </div>
        ))}
      </div>

      {/* Editable Benefits CRUD */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase">Vantaggi per Livello (visibili ai clienti)</p>
        {TIERS.map(t => (
          <div key={t.key} className={`rounded-2xl border p-4 ${t.color}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">{t.emoji} {t.label}</p>
              <button
                onClick={() => setEditingTier(editingTier === t.key ? null : t.key)}
                className="text-[10px] font-bold underline opacity-60 hover:opacity-100"
              >
                {editingTier === t.key ? 'Chiudi' : 'Modifica'}
              </button>
              {saving === t.key && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-1" />}
            </div>

            <ul className="space-y-1.5 mb-3">
              {benefits[t.key].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs">
                  {editingTier === t.key && editIdx === idx ? (
                    <>
                      <input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(t.key, idx)}
                        className="flex-1 bg-white/70 dark:bg-black/20 rounded-lg px-2 py-1 text-xs border border-current/20 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(t.key, idx)} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditIdx(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">✓ {item}</span>
                      {editingTier === t.key && (
                        <>
                          <button onClick={() => { setEditIdx(idx); setEditText(item); }}><Edit2 className="w-3 h-3 opacity-50 hover:opacity-100" /></button>
                          <button onClick={() => removeItem(t.key, idx)}><Trash2 className="w-3 h-3 opacity-50 hover:opacity-100 text-red-500" /></button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>

            {editingTier === t.key && (
              <div className="flex gap-2">
                <input
                  placeholder="Nuovo vantaggio..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem(t.key)}
                  className="flex-1 bg-white/70 dark:bg-black/20 rounded-xl px-3 py-2 text-xs border border-current/20 focus:outline-none"
                />
                <button
                  onClick={() => addItem(t.key)}
                  className="w-8 h-8 rounded-xl bg-white/80 dark:bg-black/20 flex items-center justify-center flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Industry ROI examples */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Esempi ROI di Settore
        </p>
        <div className="space-y-2">
          {INDUSTRY.map(ex => (
            <div key={ex.type} className="bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-xs">
              <span className="font-bold text-[#1A1A1A] dark:text-white block mb-1">{ex.icon} {ex.type}</span>
              <div className="flex flex-wrap gap-3 text-gray-500">
                <span><strong>Premio:</strong> {ex.pts} {ex.unit}</span>
                <span className="text-red-500"><strong>Costo Reale:</strong> {ex.cogs}</span>
                <span className="text-green-600"><strong>Ricavo:</strong> {ex.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


