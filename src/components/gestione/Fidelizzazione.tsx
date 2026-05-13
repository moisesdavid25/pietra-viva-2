import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ScanLine } from 'lucide-react';
import db from '../../db';
import WaiterScanner from './WaiterScanner';
import FidelityConfigurator from './FidelityConfigurator';
import type { FidelityConfig } from './FidelityConfigurator';

const FidelityStrategy = lazy(() => import('./FidelityStrategy'));

interface Props { restaurantId: string; onViewChange?: (v: string | null) => void; }

interface Customer {
  id: string; name: string; whatsapp: string; auth_user_id: string;
  total_points: number; created_at: string;
}
interface Reward {
  id: string; name: string; points_required: number;
  description: string; image_url: string; cost_value?: number;
}
interface Txn {
  id: string; points_earned: number; created_at: string;
  customers: { name: string }[] | { name: string } | null;
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <span className="w-7 h-7 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Tab: I miei Clienti ───────────────────────────────────────────────────────

function TabClienti({ customers, totalRev, green, gold, reserve, onConfigura }: {
  customers: Customer[]; totalRev: number;
  green: Customer[]; gold: Customer[]; reserve: Customer[];
  onConfigura: () => void;
}) {
  const sorted = [...customers].sort((a, b) => b.total_points - a.total_points).slice(0, 10);

  return (
    <div className="px-4 pt-4 pb-28 space-y-3">
      {/* Configura banner */}
      <button type="button" onClick={onConfigura}
        className="w-full flex items-center gap-3 rounded-[16px] px-4 py-4 text-left relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
        <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[20px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>🎯</div>
        <div className="flex-1 min-w-0 relative z-10">
          <h4 className="text-[15px] font-black text-white mb-0.5">Configura Programma Fedeltà</h4>
          <p className="text-[12px] text-white/75">Premi, ratio punti, livelli e ROI live</p>
        </div>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="relative z-10 flex-shrink-0">
          <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[14px] p-3.5">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 mb-1">Membri Attivi</p>
          <p className="text-[44px] font-black text-[#111827] dark:text-white leading-none">{customers.length}</p>
          <p className="text-[12px] text-gray-400 mt-1">clienti iscritti</p>
        </div>
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[14px] p-3.5">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 mb-1">Valore Punti</p>
          <p className="text-[36px] font-black text-[#111827] dark:text-white leading-none">€{totalRev.toFixed(0)}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-[5px]">LTV</span>
            <span className="text-[11px] text-gray-400">generato</span>
          </div>
        </div>
      </div>

      {/* Distribuzione Clienti */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400">Distribuzione Clienti</p>
          <span className="bg-[#f4f6f8] text-[#374151] dark:bg-gray-800 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-[8px] tracking-[0.5px]">LIVELLI</span>
        </div>
        <div className="px-4 py-2">
          {[
            { dot: '#10b981', label: 'Green', sub: '0 – 499 pt', count: green.length, bg: '#f0fdf4', color: '#15803d' },
            { dot: '#f59e0b', label: 'Gold', sub: '500 – 2499 pt', count: gold.length, bg: '#fef3c7', color: '#b45309' },
            { dot: '#8b5cf6', label: 'Reserve', sub: '2500+ pt', count: reserve.length, bg: '#f5f3ff', color: '#6d28d9' },
          ].map((l, i, arr) => (
            <div key={l.label} className={`flex items-center gap-2.5 py-2.5 ${i < arr.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
              <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: l.dot }} />
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[#374151] dark:text-gray-200">{l.label}</p>
                <p className="text-[11px] text-gray-400">{l.sub}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[10px]" style={{ background: l.bg, color: l.color }}>
                {l.count} utenti
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Classifica */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400">🏆 Classifica Clienti</p>
          <span className="text-[12px] text-gray-400">{customers.length} clienti</span>
        </div>
        {sorted.length === 0 ? (
          <div className="text-center py-8 px-5">
            <div className="text-[32px] mb-2">🎯</div>
            <h4 className="text-[15px] font-bold text-[#374151] dark:text-gray-200 mb-1.5">Nessun cliente ancora</h4>
            <p className="text-[12.5px] text-gray-400 leading-relaxed">I clienti appariranno qui<br />dopo il primo ordine con punti.</p>
          </div>
        ) : sorted.map((c, i) => (
          <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < sorted.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#f0fdf4] dark:bg-[#0d9488]/10 flex items-center justify-center text-[11px] font-black text-[#0d9488] flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-[#111827] dark:text-white truncate">{c.name || 'Cliente'}</p>
              <p className="text-[11px] text-gray-400">{c.whatsapp || '—'}</p>
            </div>
            <span className="text-[13px] font-black text-[#0d9488]">{c.total_points} ⭐</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Scanner Punti ────────────────────────────────────────────────────────

function TabScanner({ restaurantId, onOpenScanner, recentTxns }: {
  restaurantId: string; onOpenScanner: () => void; recentTxns: Txn[];
}) {
  const [manuale, setManuale] = useState('');

  return (
    <div className="px-4 pt-4 pb-28 space-y-3">
      {/* Scanner hero */}
      <div className="bg-gradient-to-b from-[#0d9488] to-[#0f766e] rounded-[20px] px-5 py-7 text-center relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="relative z-10">
          {/* QR frame */}
          <div className="w-[120px] h-[120px] mx-auto mb-4 relative flex items-center justify-center rounded-[16px]"
            style={{ border: '3px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }}>
            {/* corners */}
            {[['top-[-2px] left-[-2px] border-t-[3px] border-l-[3px] rounded-tl-[4px]', ''],
              ['top-[-2px] right-[-2px] border-t-[3px] border-r-[3px] rounded-tr-[4px]', ''],
              ['bottom-[-2px] left-[-2px] border-b-[3px] border-l-[3px] rounded-bl-[4px]', ''],
              ['bottom-[-2px] right-[-2px] border-b-[3px] border-r-[3px] rounded-br-[4px]', '']].map(([cls], i) => (
              <div key={i} className={`absolute w-5 h-5 border-white ${cls}`} />
            ))}
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <rect x="15" y="15" width="2" height="2" fill="rgba(255,255,255,0.5)" />
              <rect x="19" y="15" width="2" height="2" fill="rgba(255,255,255,0.5)" />
              <rect x="15" y="19" width="2" height="2" fill="rgba(255,255,255,0.5)" />
              <rect x="19" y="19" width="2" height="2" fill="rgba(255,255,255,0.5)" />
            </svg>
          </div>
          <p className="text-[16px] font-black text-white mb-1">Inquadra il QR del cliente</p>
          <p className="text-[12px] text-white/70 mb-5">Il sistema assegna i punti automaticamente</p>
          <button type="button" onClick={onOpenScanner}
            className="inline-flex items-center gap-2 bg-white text-[#0d9488] font-black text-[14px] px-7 py-3 rounded-[12px]">
            <ScanLine className="w-4 h-4" /> Apri Scanner QR
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e5e7eb] dark:bg-gray-700" />
        <span className="text-[11px] text-gray-400 font-semibold">oppure inserisci manualmente</span>
        <div className="flex-1 h-px bg-[#e5e7eb] dark:bg-gray-700" />
      </div>

      {/* Manual input */}
      <div className="flex gap-2.5">
        <input
          type="tel"
          placeholder="Numero di telefono cliente"
          value={manuale}
          onChange={e => setManuale(e.target.value)}
          className="flex-1 px-3.5 py-3 border border-[#e5e7eb] dark:border-gray-700 rounded-[12px] text-[14px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#1C1C1C] outline-none focus:border-[#0d9488] transition-colors"
        />
        <button type="button"
          className="bg-[#0d9488] text-white font-bold text-[13px] px-4 py-3 rounded-[12px] flex-shrink-0">
          Cerca
        </button>
      </div>

      {/* Attività recente */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400">Attività Recente</p>
        </div>
        {recentTxns.length === 0 ? (
          <div className="text-center py-6 text-[12px] text-gray-400">
            Nessuna transazione ancora.
          </div>
        ) : recentTxns.slice(0, 6).map(t => {
          const custObj = Array.isArray(t.customers) ? t.customers[0] : t.customers;
          const name = custObj?.name || 'Cliente';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const when = new Date(t.created_at);
          const timeStr = when.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' + when.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f3f4f6] dark:border-white/[0.04] last:border-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#f0fdf4] dark:bg-[#0d9488]/10 flex items-center justify-center text-[13px] font-black text-[#0d9488] flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-[#111827] dark:text-white truncate">{name}</p>
                <p className="text-[11px] text-gray-400">{timeStr}</p>
              </div>
              <span className="text-[13px] font-black text-[#0d9488]">+{t.points_earned} ⭐</span>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="flex gap-3 bg-[#eff6ff] dark:bg-blue-900/10 border border-[#bfdbfe] dark:border-blue-900/30 rounded-[14px] px-4 py-3">
        <span className="text-lg flex-shrink-0">💡</span>
        <p className="text-[12px] text-[#1d4ed8] dark:text-blue-300 leading-relaxed">
          <strong>Come funziona?</strong> Ogni €1 speso = stelle. Il cliente mostra il suo QR e il sistema assegna automaticamente i punti al suo profilo.
        </p>
      </div>
    </div>
  );
}

// ── Tab: I miei Premi ─────────────────────────────────────────────────────────

function TabPremi({ restaurantId, rewards, onRefresh }: {
  restaurantId: string; rewards: Reward[]; onRefresh: () => void;
}) {
  const [localActive, setLocalActive] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', stelle: '', costo: '' });
  const [saving, setSaving] = useState(false);

  const isActive = (id: string) => localActive[id] !== false;
  const activeCount = rewards.filter(r => isActive(r.id)).length;

  const quickFill = (nome: string, stelle: string, costo: string) =>
    setForm({ nome, stelle, costo });

  const saveReward = async () => {
    if (!form.nome || !form.stelle) return;
    setSaving(true);
    const { error } = await db.from('rewards').insert({
      restaurant_id: restaurantId,
      name: form.nome,
      points_required: parseInt(form.stelle),
      description: `${form.stelle} stelle richieste`,
      cost_value: parseFloat(form.costo) || 0,
      image_url: '',
    });
    setSaving(false);
    if (error) {
      console.error('[saveReward] INSERT failed:', error.message, error.code);
      return;
    }
    setModal(false);
    setForm({ nome: '', stelle: '', costo: '' });
    onRefresh();
  };

  const deleteReward = async (id: string) => {
    await db.from('rewards').delete().eq('id', id);
    onRefresh();
  };

  const roiPreview = form.stelle && form.costo
    ? (() => {
        const spesa = parseFloat(form.stelle);
        const costo = parseFloat(form.costo);
        const margine = ((spesa - costo) / spesa) * 100;
        return { ok: margine > 0, margine, spesa };
      })()
    : null;

  return (
    <div className="px-4 pt-4 pb-28 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[16px] font-black text-[#111827] dark:text-white">Premi Attivi</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{activeCount} di {rewards.length} attivi</p>
        </div>
        <button type="button" onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] font-bold text-[13px] px-3.5 py-2 rounded-[10px]">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Nuovo
        </button>
      </div>

      {/* Rewards list */}
      {rewards.length > 0 && (
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
          {rewards.map((r, i) => {
            const active = isActive(r.id);
            return (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < rewards.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
                <div className={`w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[20px] flex-shrink-0 ${active ? 'bg-[#f0fdf4]' : 'bg-[#f4f6f8] dark:bg-gray-800'}`}>🎁</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-bold truncate ${active ? 'text-[#111827] dark:text-white' : 'text-gray-400'}`}>{r.name}</p>
                  <p className="text-[11.5px] text-gray-400">Costo reale: €{(r.cost_value || 0).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="bg-[#fef3c7] text-[#b45309] text-[11px] font-black px-2 py-0.5 rounded-[8px]">⭐ {r.points_required}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLocalActive(p => ({ ...p, [r.id]: !active }))}
                      className={`relative inline-flex w-[38px] h-[22px] rounded-full transition-colors ${active ? 'bg-[#0d9488]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${active ? 'right-[2px]' : 'left-[2px]'}`} />
                    </button>
                    <button type="button" onClick={() => deleteReward(r.id)}
                      className="w-6 h-6 rounded-[6px] bg-[#fff1f2] flex items-center justify-center">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      <button type="button" onClick={() => setModal(true)}
        className="w-full py-3.5 border-[1.5px] border-dashed border-[#d1d5db] dark:border-gray-700 rounded-[14px] text-[13px] font-bold text-gray-500 hover:border-[#0d9488] hover:text-[#0d9488] flex items-center justify-center gap-2 transition-colors">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        Aggiungi Premio Personalizzato
      </button>

      {/* ROI tip */}
      {rewards.length > 0 && rewards[0] && (
        <div className="flex gap-3 bg-[#fff7ed] border border-[#fed7aa] rounded-[14px] px-4 py-3">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-[12px] text-[#c2410c] leading-relaxed">
            <strong>Garanzia ROI:</strong> Premio da {rewards[0].points_required} ⭐ → il cliente ha già speso €{rewards[0].points_required.toFixed(0)}. Se il costo reale è €{(rewards[0].cost_value || 0).toFixed(2)}, il margine lordo è alto.
          </p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[190]" onClick={() => setModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white dark:bg-[#1C1C1C] rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] px-5 pb-10 pt-5 max-w-[430px] mx-auto">
            <div className="w-9 h-1 bg-[#e5e7eb] rounded-full mx-auto mb-4" />
            <h3 className="text-[17px] font-black text-[#111827] dark:text-white mb-4">🎁 Nuovo Premio</h3>

            {/* Quick chips */}
            <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400 mb-2">Aggiungi rapidamente</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { n: '☕ Caffè', s: '30', c: '1.50' },
                { n: '🍕 Pizza', s: '150', c: '4.00' },
                { n: '🍮 Dessert', s: '80', c: '2.50' },
                { n: '🍽️ Cena ×2', s: '500', c: '20' },
              ].map(q => (
                <button key={q.n} type="button"
                  onClick={() => quickFill(`${q.n.replace(/^.+ /, '')} Omaggio`, q.s, q.c)}
                  className="bg-[#f0fdf4] text-[#0d9488] border border-[#a7f3d0] rounded-[20px] px-2.5 py-1 text-[11px] font-bold">
                  {q.n} ({q.s} ⭐)
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400 mb-1.5">Nome Premio *</label>
              <input type="text" value={form.nome} placeholder="es. Pizza Margherita Omaggio"
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                className="w-full px-3.5 py-3 border border-[#e5e7eb] dark:border-gray-700 rounded-[10px] text-[14px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488]" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400 mb-1.5">Stelle Richieste *</label>
                <input type="number" value={form.stelle} placeholder="150"
                  onChange={e => setForm(p => ({ ...p, stelle: e.target.value }))}
                  className="w-full px-3.5 py-3 border border-[#e5e7eb] dark:border-gray-700 rounded-[10px] text-[14px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400 mb-1.5">Costo Reale (€)</label>
                <input type="number" value={form.costo} placeholder="4.00" step="0.50"
                  onChange={e => setForm(p => ({ ...p, costo: e.target.value }))}
                  className="w-full px-3.5 py-3 border border-[#e5e7eb] dark:border-gray-700 rounded-[10px] text-[14px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488]" />
              </div>
            </div>

            {roiPreview && (
              <div className={`px-3 py-2 rounded-[10px] text-[12px] font-medium mb-3 ${roiPreview.ok ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fff7ed] text-[#c2410c]'}`}>
                {roiPreview.ok ? '✅' : '⚠️'} Cliente spende €{roiPreview.spesa.toFixed(0)} · Costo: €{parseFloat(form.costo).toFixed(2)} · Margine: {roiPreview.margine.toFixed(0)}%
              </div>
            )}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 py-3.5 border border-[#e5e7eb] dark:border-gray-700 rounded-[12px] text-[14px] font-semibold text-[#374151] dark:text-gray-300 bg-white dark:bg-[#262626]">
                Annulla
              </button>
              <button type="button" onClick={saveReward} disabled={saving}
                className="flex-1 py-3.5 bg-[#0d9488] text-white rounded-[12px] text-[14px] font-bold disabled:opacity-50">
                {saving ? '...' : '💾 Salva'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Crescita ─────────────────────────────────────────────────────────────

function TabCrescita({ restaurantId, fidelityConfig }: {
  restaurantId: string; fidelityConfig: FidelityConfig | null;
}) {
  const ratio = fidelityConfig?.ratio || 3;
  const primoPremioDaStelle = fidelityConfig?.premi?.[0]?.stelle || 45;
  const primoCosto = fidelityConfig?.premi?.[0]?.costo || 1.50;
  const scontrino = fidelityConfig?.scontrinoMedio || 25;
  const fatturatoPerRiscatto = primoPremioDaStelle / ratio;
  const margine = fatturatoPerRiscatto > 0 ? ((fatturatoPerRiscatto - primoCosto) / fatturatoPerRiscatto) * 100 : 90;
  const visite = scontrino > 0 ? Math.ceil(fatturatoPerRiscatto / scontrino) : 5;
  const livelli = fidelityConfig?.livelli || [
    { nome: 'Green', emoji: '🌿', soglia: 499, molt: 1.0, bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
    { nome: 'Gold', emoji: '⭐', soglia: 2499, molt: 1.2, bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    { nome: 'Reserve', emoji: '💎', soglia: null, molt: 1.7, bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  ];

  return (
    <div className="px-4 pt-4 pb-28 space-y-3">
      {/* ROI headline */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] p-4">
        <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 mb-2">Garanzia LeoMenu</p>
        <div className="flex items-center gap-4 mb-3">
          <p className="text-[52px] font-black text-[#0d9488] leading-none">{Math.round(margine)}%</p>
          <div>
            <p className="text-[15px] font-bold text-[#111827] dark:text-white">Margine lordo garantito</p>
            <p className="text-[13px] text-gray-500 leading-relaxed mt-0.5">Il cliente spende €{fatturatoPerRiscatto.toFixed(0)} prima di riscattare un premio da €{primoCosto.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-[#f9fafb] dark:bg-[#262626] rounded-[12px] px-3.5 py-3">
          {[
            { lbl: 'Spesa cliente', val: '€1' },
            null,
            { lbl: 'Stelle', val: `${ratio} ⭐`, teal: true },
            null,
            { lbl: 'ROI', val: `${(fatturatoPerRiscatto / Math.max(primoCosto, 1)).toFixed(0)}×`, teal: true },
          ].map((item, i) =>
            item === null
              ? <div key={i} className="text-[20px] font-bold text-gray-300">{'='}</div>
              : (
                <div key={i} className="flex-1 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.8px] text-gray-400 mb-0.5">{item.lbl}</span>
                  <strong className={`text-[22px] font-black ${item.teal ? 'text-[#0d9488]' : 'text-[#111827] dark:text-white'}`}>{item.val}</strong>
                </div>
              )
          )}
        </div>
      </div>

      {/* Perché funziona */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
        <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">Perché funziona</p>
        {[
          { icon: '📈', bg: '#eff6ff', title: 'Clienti VIP spendono il 20% in più', desc: 'I clienti fidelizzati tornano più spesso e con scontrino più alto.' },
          { icon: '🔁', bg: '#f0fdf4', title: 'Retention +35% in 90 giorni', desc: 'Il programma stelle riduce drasticamente il tasso di abbandono.' },
          { icon: '🎯', bg: '#fff7ed', title: `Primo riscatto dopo ${visite} visite`, desc: `Con ratio ${ratio} stelle/€ e scontrino medio €${scontrino}, il cliente riscatta entro ${visite} visite.` },
        ].map((ins, i, arr) => (
          <div key={ins.title} className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[16px] flex-shrink-0" style={{ background: ins.bg }}>{ins.icon}</div>
            <div>
              <p className="text-[13px] font-bold text-[#111827] dark:text-white mb-0.5">{ins.title}</p>
              <p className="text-[11.5px] text-gray-500 leading-relaxed">{ins.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Esempi ROI per settore */}
      <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
        <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">Esempi ROI per settore</p>
        {[
          { icon: '🍔', label: 'Casual / Fast Food', stelle: '45 ⭐', costo: '€1,00', roi: '€15,00' },
          { icon: '☕', label: 'Bar / Caffetteria', stelle: '250 ⭐', costo: '€6,00', roi: '€83,00' },
          { icon: '🍷', label: 'Fine Dining', stelle: '1000 ⭐', costo: '€20,00', roi: '€333,00' },
        ].map((s, i, arr) => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
            <span className="text-[20px] flex-shrink-0">{s.icon}</span>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#374151] dark:text-gray-200">{s.label}</p>
              <p className="text-[11px] text-gray-400">Premio: {s.stelle} · Costo: {s.costo}</p>
            </div>
            <p className="text-[13px] font-black text-[#0d9488]">Ricavo: {s.roi}</p>
          </div>
        ))}
      </div>

      {/* Sistema Livelli */}
      {fidelityConfig?.livelliAttivi && (
        <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] overflow-hidden">
          <p className="text-[9.5px] font-bold uppercase tracking-[1.2px] text-gray-400 px-4 py-3 border-b border-[#f3f4f6] dark:border-white/[0.04]">Sistema Livelli</p>
          <div className="px-4 pb-3">
            {livelli.map((l, i) => (
              <div key={l.nome} className={`flex items-center gap-3 py-2.5 ${i < livelli.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] flex-shrink-0" style={{ background: l.bg }}>{l.emoji}</div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold" style={{ color: l.color }}>{l.nome}</p>
                  <p className="text-[11px] text-gray-400">
                    {i === 0 ? '0' : (livelli[i - 1].soglia || 0) + 1} – {l.soglia ? `${l.soglia} ⭐` : '∞'}
                  </p>
                </div>
                <span className="text-[12px] font-black text-[#0d9488] bg-[#f0fdf4] px-2.5 py-1 rounded-[8px]">{l.molt}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FidelityStrategy (benefici per tier) */}
      <Suspense fallback={<Spinner />}>
        <FidelityStrategy restaurantId={restaurantId} />
      </Suspense>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Fidelizzazione({ restaurantId, onViewChange }: Props) {
  const [tab, setTab] = useState<'clienti' | 'scanner' | 'premi' | 'crescita'>('clienti');
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [recentTxns, setRecentTxns] = useState<Txn[]>([]);
  const [fidelityConfig, setFidelityConfig] = useState<FidelityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const openConfigurator = () => { setShowConfigurator(true); onViewChange?.('configuratore'); };
  const closeConfigurator = () => { setShowConfigurator(false); onViewChange?.(null); fetchData(); };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: custs }, { data: rws }, { data: txns }, { data: cfg }, { data: owners }] = await Promise.all([
      db.from('customers').select('id,name,whatsapp,auth_user_id,total_points,created_at')
        .eq('restaurant_id', restaurantId).order('total_points', { ascending: false }),
      db.from('rewards').select('id,name,points_required,description,image_url,cost_value')
        .eq('restaurant_id', restaurantId).order('points_required', { ascending: true }),
      db.from('loyalty_transactions').select('id,points_earned,created_at,customers(name)')
        .eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(20),
      db.from('settings').select('value').eq('restaurant_id', restaurantId).eq('key', 'fidelity_config').maybeSingle(),
      db.from('user_roles').select('user_id').eq('role', 'owner'),
    ]);
    if (custs) {
      const ownerIds = new Set((owners || []).map((o: { user_id: string }) => o.user_id));
      setCustomers((custs as Customer[]).filter(c => !c.auth_user_id || !ownerIds.has(c.auth_user_id)));
    }
    if (rws) setRewards(rws as Reward[]);
    if (txns) setRecentTxns(txns as Txn[]);
    if (cfg?.value) { try { setFidelityConfig(JSON.parse(cfg.value)); } catch { /* ignore */ } }
    setLoading(false);
  };

  useEffect(() => { if (restaurantId) fetchData(); }, [restaurantId]);

  const greenCohort = customers.filter(c => c.total_points < 500);
  const goldCohort = customers.filter(c => c.total_points >= 500 && c.total_points < 2500);
  const reserveCohort = customers.filter(c => c.total_points >= 2500);
  const totalRev = customers.reduce((s, c) => s + c.total_points, 0) / 10;

  const TABS = [
    { key: 'clienti' as const, label: 'I miei Clienti' },
    { key: 'scanner' as const, label: 'Scanner Punti' },
    { key: 'premi' as const, label: 'I miei Premi' },
    { key: 'crescita' as const, label: 'Crescita' },
  ];

  if (showConfigurator) {
    return (
      <FidelityConfigurator
        restaurantId={restaurantId}
        onBack={closeConfigurator}
        onSaved={closeConfigurator}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Tab bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#141414] border-b border-[#f0f1f3] dark:border-gray-800 flex overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-3.5 py-3 text-[13px] font-semibold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
              tab === t.key
                ? 'text-[#0d9488] border-[#0d9488]'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {tab === 'clienti' && (
            <TabClienti
              customers={customers}
              totalRev={totalRev}
              green={greenCohort}
              gold={goldCohort}
              reserve={reserveCohort}
              onConfigura={openConfigurator}
            />
          )}
          {tab === 'scanner' && (
            <TabScanner
              restaurantId={restaurantId}
              onOpenScanner={() => setShowScanner(true)}
              recentTxns={recentTxns}
            />
          )}
          {tab === 'premi' && (
            <TabPremi
              restaurantId={restaurantId}
              rewards={rewards}
              onRefresh={fetchData}
            />
          )}
          {tab === 'crescita' && (
            <TabCrescita
              restaurantId={restaurantId}
              fidelityConfig={fidelityConfig}
            />
          )}
        </>
      )}

      {showScanner && (
        <WaiterScanner
          restaurantId={restaurantId}
          onClose={() => setShowScanner(false)}
          onSuccess={() => { setShowScanner(false); fetchData(); }}
        />
      )}
    </div>
  );
}
