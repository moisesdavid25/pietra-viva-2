import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react';
import db from '../../db';
import { useToast } from '../Toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BonusConfig { attivo: boolean; valore: number; }
interface Livello { nome: string; emoji: string; soglia: number | null; molt: number; bg: string; color: string; border: string; }
interface Premio { id: number; nome: string; stelle: number; costo: number; }

export interface FidelityConfig {
  nome: string;
  ratio: number;
  scontrinoMedio: number;
  bonusPrimoOrdine: BonusConfig;
  bonusCompleanno: BonusConfig;
  bonusReferral: BonusConfig;
  premi: Premio[];
  livelliAttivi: boolean;
  livelli: Livello[];
}

interface Props {
  restaurantId: string;
  onBack: () => void;
  onSaved: () => void;
}

// ── Default data ──────────────────────────────────────────────────────────────

const DEFAULT_LIVELLI: Livello[] = [
  { nome: 'Green',   emoji: '🌿', soglia: 499,  molt: 1.0, bg: '#f0fdf4', color: '#15803d', border: '#a7f3d0' },
  { nome: 'Gold',    emoji: '⭐', soglia: 2499, molt: 1.2, bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  { nome: 'Reserve', emoji: '💎', soglia: null, molt: 1.7, bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
];

const TEMPLATES: Record<string, FidelityConfig> = {
  A: {
    nome: 'Fedeltà Stelle', ratio: 3, scontrinoMedio: 25,
    bonusPrimoOrdine: { attivo: true, valore: 50 },
    bonusCompleanno: { attivo: true, valore: 100 },
    bonusReferral: { attivo: true, valore: 80 },
    premi: [
      { id: 1, nome: 'Caffè Omaggio', stelle: 45, costo: 1.50 },
      { id: 2, nome: 'Pizza Margherita Omaggio', stelle: 150, costo: 4.00 },
      { id: 3, nome: 'Cena per 2 persone', stelle: 500, costo: 20.00 },
    ],
    livelliAttivi: true, livelli: DEFAULT_LIVELLI,
  },
  B: {
    nome: 'Fedeltà Visite', ratio: 1, scontrinoMedio: 15,
    bonusPrimoOrdine: { attivo: true, valore: 5 },
    bonusCompleanno: { attivo: true, valore: 10 },
    bonusReferral: { attivo: false, valore: 8 },
    premi: [
      { id: 1, nome: 'Snack Omaggio', stelle: 10, costo: 2.00 },
      { id: 2, nome: 'Pasto Gratis', stelle: 50, costo: 8.00 },
    ],
    livelliAttivi: false, livelli: DEFAULT_LIVELLI,
  },
  zero: {
    nome: '', ratio: 1, scontrinoMedio: 20,
    bonusPrimoOrdine: { attivo: false, valore: 0 },
    bonusCompleanno: { attivo: false, valore: 0 },
    bonusReferral: { attivo: false, valore: 0 },
    premi: [], livelliAttivi: false, livelli: DEFAULT_LIVELLI,
  },
};

// ── ROI math ──────────────────────────────────────────────────────────────────

function calcPremioROI(p: Premio, ratio: number) {
  if (!ratio || !p.stelle) return null;
  const fatturato = p.stelle / ratio;
  const margine = fatturato > 0 ? ((fatturato - p.costo) / fatturato) * 100 : 0;
  return { fatturato, costo: p.costo, margine, ok: margine > 0 };
}

function calcGlobalROI(premi: Premio[], ratio: number, scontrino: number) {
  const valid = premi.filter(p => p.stelle > 0 && ratio > 0 && scontrino > 0);
  if (!valid.length) return null;
  const primo = valid.reduce((m, p) => p.stelle < m.stelle ? p : m, valid[0]);
  const spesa = primo.stelle / ratio;
  const fat100 = 100 * spesa;
  const cost100 = 100 * (primo.costo || 0);
  return { visite: Math.ceil(spesa / scontrino), fat100, cost100, roi: cost100 > 0 ? fat100 / cost100 : 0 };
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${enabled ? 'bg-[#0d9488]' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── PremioCard ────────────────────────────────────────────────────────────────

function PremioCard({ premio, ratio, onChange, onDelete }: {
  premio: Premio; ratio: number;
  onChange: (u: Partial<Premio>) => void;
  onDelete: () => void;
}) {
  const roi = calcPremioROI(premio, ratio);
  const inp = 'w-full px-3 py-2.5 border border-[#e5e7eb] dark:border-gray-700 rounded-[8px] text-[13px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488] transition-colors';
  return (
    <div className="border border-[#e8eaed] dark:border-white/5 rounded-[12px] p-3.5 mb-2.5 bg-white dark:bg-[#1C1C1C]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎁</span>
        <p className="flex-1 text-[13px] font-bold text-[#111827] dark:text-white truncate">{premio.nome || 'Nuovo Premio'}</p>
        <button type="button" onClick={onDelete}
          className="w-7 h-7 rounded-[8px] bg-[#fff1f2] flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.8px] mb-1">Nome Premio</label>
          <input type="text" value={premio.nome} placeholder="es. Pizza Margherita Omaggio"
            onChange={e => onChange({ nome: e.target.value })} className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.8px] mb-1">Stelle Richieste</label>
            <input type="number" value={premio.stelle || ''} placeholder="150" min="1"
              onChange={e => onChange({ stelle: parseFloat(e.target.value) || 0 })}
              className={inp + ' font-bold text-[#0d9488]'} />
          </div>
          <div>
            <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.8px] mb-1">Costo Reale (€)</label>
            <input type="number" value={premio.costo || ''} placeholder="4.00" min="0" step="0.50"
              onChange={e => onChange({ costo: parseFloat(e.target.value) || 0 })} className={inp} />
          </div>
        </div>
      </div>
      {roi && (
        <div className={`mt-2.5 px-3 py-2 rounded-[8px] flex items-start gap-2 text-[12px] font-medium ${roi.ok ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fff7ed] text-[#c2410c]'}`}>
          <span className="flex-shrink-0">{roi.ok ? '✅' : '⚠️'}</span>
          <span>
            Cliente spende <strong>€{roi.fatturato.toFixed(0)}</strong> per riscattare · Margine: <strong>{roi.margine.toFixed(0)}%</strong>
            {!roi.ok && <span className="block mt-0.5 text-[11px]">Il cliente riscatta prima di generare profitto.</span>}
          </span>
        </div>
      )}
    </div>
  );
}

// ── ROI Panel ─────────────────────────────────────────────────────────────────

function ROIPanel({ config }: { config: FidelityConfig }) {
  const [open, setOpen] = useState(false);
  const [scontrino, setScontrino] = useState(config.scontrinoMedio || 20);
  useEffect(() => { setScontrino(config.scontrinoMedio || 20); }, [config.scontrinoMedio]);

  const global = calcGlobalROI(config.premi, config.ratio, scontrino);
  const allOk = config.premi.length > 0 && config.premi.every(p => { const r = calcPremioROI(p, config.ratio); return r ? r.ok : true; });
  const roiColor = !config.premi.length ? '#9ca3af' : allOk ? '#0d9488' : '#f97316';
  const roiStr = global ? `${global.roi.toFixed(1)}x` : '–';

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-50 md:hidden bg-white dark:bg-[#1A1A1A] border-t-2 border-[#0d9488] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2.5 px-4 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span>📊</span>
        <span className="flex-1 text-[12px] font-bold text-[#374151] dark:text-gray-200">Anteprima ROI · aggiornata live</span>
        <span className="text-[20px] font-black" style={{ color: roiColor }}>{roiStr}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="max-h-[48vh] overflow-y-auto px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <label className="flex-1 text-[12.5px] font-semibold text-[#374151] dark:text-gray-300">Scontrino medio dei tuoi clienti</label>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-[#0d9488]">€</span>
              <input type="number" value={scontrino} min="1"
                onChange={e => setScontrino(parseFloat(e.target.value) || 1)}
                className="w-20 px-2.5 py-2 text-right border-[1.5px] border-[#0d9488] rounded-[8px] text-[14px] font-bold text-[#0d9488] bg-[#f0fdf4] dark:bg-[#0d9488]/10 outline-none" />
            </div>
          </div>
          {config.premi.length === 0 && (
            <p className="text-[12px] text-gray-400 text-center py-4">Aggiungi premi per vedere il ROI in tempo reale</p>
          )}
          {config.premi.map(p => {
            const roi = calcPremioROI(p, config.ratio);
            if (!roi) return null;
            return (
              <div key={p.id} className="py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center justify-between text-[12px] font-bold text-[#374151] dark:text-gray-200 mb-1">
                  <span>🎁 {p.nome || 'Premio'}</span>
                  <span>{roi.ok ? '✅' : '⚠️'}</span>
                </div>
                <div className="text-[11.5px] text-gray-500 flex flex-wrap gap-x-2">
                  <span>Spende <strong>€{roi.fatturato.toFixed(0)}</strong></span>
                  <span>· Costo: <strong>€{roi.costo.toFixed(2)}</strong></span>
                  <span>· Margine: <strong style={{ color: roi.ok ? '#15803d' : '#ea580c' }}>{roi.margine.toFixed(0)}%</strong></span>
                </div>
                {!roi.ok && <p className="text-[11px] text-[#ea580c] mt-1">⚠️ Il cliente riscatta prima di generare profitto.</p>}
              </div>
            );
          })}
          {global && (
            <div className="bg-[#f0fdf4] dark:bg-[#0d9488]/10 rounded-[10px] p-3 mt-3">
              <h4 className="text-[10px] font-black text-[#15803d] uppercase tracking-[0.8px] mb-2">⚡ Stima con 100 clienti iscritti</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]"><span className="text-gray-500">Primo riscatto</span><span className="font-bold">dopo {global.visite} visite</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-gray-500">Costo premi</span><span className="font-bold">€{global.cost100.toFixed(0)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-gray-500">Fatturato generato</span><span className="font-bold">€{global.fat100.toFixed(0)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-[#bbf7d0] mt-1">
                  <span className="text-[12px] font-bold text-[#15803d]">ROI del programma</span>
                  <span className="text-[20px] font-black text-[#0d9488]">{global.roi.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Template Picker ───────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (k: string) => void }) {
  return (
    <div>
      <div className="text-center pt-8 pb-4 px-4">
        <div className="text-[36px] mb-3">🎯</div>
        <h1 className="text-[22px] font-black text-[#111827] dark:text-white mb-1.5">Crea il tuo programma fedeltà</h1>
        <p className="text-[13px] text-gray-500 leading-relaxed">Scegli un punto di partenza.<br />Ogni campo è modificabile liberamente.</p>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-36">
        {[
          {
            key: 'A', icon: '⭐', bg: '#f0fdf4',
            tag: 'TEMPLATE A · CONSIGLIATO', tagBg: '#dcfce7', tagColor: '#15803d',
            title: 'Sistema Stelle',
            desc: 'Ogni euro guadagna Stelle. Ideale per ristoranti, pizzerie e locali gourmet.',
            pills: ['1€ = 3 Stelle', '3 Premi inclusi', 'Livelli attivi'],
            cta: 'Parti da qui e modifica', ctaColor: '#0d9488', dashed: false,
          },
          {
            key: 'B', icon: '🎯', bg: '#fef3c7',
            tag: 'TEMPLATE B · SEMPLICE', tagBg: '#fef3c7', tagColor: '#b45309',
            title: 'Sistema Visite',
            desc: 'Ogni visita conta. Perfetto per bar, caffetterie e locali con scontrini veloci.',
            pills: ['1€ = 1 Punto', '2 Premi inclusi', 'Facile da spiegare'],
            cta: 'Parti da qui e modifica', ctaColor: '#0d9488', dashed: false,
          },
          {
            key: 'zero', icon: '🧱', bg: '#f4f6f8',
            tag: 'DA ZERO · AVANZATO', tagBg: '#f4f6f8', tagColor: '#6b7280',
            title: 'Configuro io tutto',
            desc: 'Pagina bianca. So già cosa voglio costruire.',
            pills: [] as string[],
            cta: 'Inizia da zero', ctaColor: '#6b7280', dashed: true,
          },
        ].map(t => (
          <button key={t.key} type="button" onClick={() => onSelect(t.key)}
            className={`bg-white dark:bg-[#1C1C1C] border-2 ${t.dashed ? 'border-dashed border-[#d1d5db] dark:border-white/10' : 'border-[#e8eaed] dark:border-white/5'} rounded-[18px] p-[18px] flex gap-3.5 items-start text-left hover:border-[#0d9488] hover:shadow-lg hover:shadow-[#0d9488]/10 transition-all active:scale-[0.98]`}>
            <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-[24px] flex-shrink-0" style={{ background: t.bg }}>{t.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="inline-block text-[9.5px] font-bold tracking-[0.8px] uppercase px-2 py-0.5 rounded-[6px] mb-1.5" style={{ background: t.tagBg, color: t.tagColor }}>{t.tag}</div>
              <h3 className="text-[17px] font-black text-[#111827] dark:text-white mb-1">{t.title}</h3>
              <p className="text-[12.5px] text-gray-500 leading-relaxed mb-2.5">{t.desc}</p>
              {t.pills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {t.pills.map(p => <span key={p} className="bg-[#f4f6f8] dark:bg-gray-800 text-[#374151] dark:text-gray-300 text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px]">{p}</span>)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: t.ctaColor }}>
                {t.cta}
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke={t.ctaColor} strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Configuratore ─────────────────────────────────────────────────────────────

function Configuratore({ config, setConfig, nextId, saving, onSave }: {
  config: FidelityConfig;
  setConfig: React.Dispatch<React.SetStateAction<FidelityConfig | null>>;
  nextId: React.MutableRefObject<number>;
  saving: boolean;
  onSave: () => void;
}) {
  const upd = (k: keyof FidelityConfig, v: unknown) => setConfig(p => p ? { ...p, [k]: v } : p);

  const addPremio = () => {
    const id = nextId.current++;
    setConfig(p => p ? { ...p, premi: [...p.premi, { id, nome: '', stelle: 0, costo: 0 }] } : p);
  };
  const updPremio = (id: number, u: Partial<Premio>) =>
    setConfig(p => p ? { ...p, premi: p.premi.map(x => x.id === id ? { ...x, ...u } : x) } : p);
  const delPremio = (id: number) =>
    setConfig(p => p ? { ...p, premi: p.premi.filter(x => x.id !== id) } : p);
  const quickAdd = (stelle: number, costo: number, nome: string) => {
    const id = nextId.current++;
    setConfig(p => p ? { ...p, premi: [...p.premi, { id, nome, stelle, costo }] } : p);
  };
  const updLivello = (idx: number, u: Partial<Livello>) =>
    setConfig(p => p ? { ...p, livelli: p.livelli.map((l, i) => i === idx ? { ...l, ...u } : l) } : p);

  const CARD = 'bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-[16px] mb-3 overflow-hidden';
  const HEAD = 'flex items-center gap-2.5 px-4 py-3.5 border-b border-[#f3f4f6] dark:border-white/[0.04]';
  const BODY = 'px-4 py-3.5';
  const LBL = 'block text-[10px] font-bold text-gray-400 uppercase tracking-[1px] mb-1.5';
  const INP = 'w-full px-3 py-2.5 border border-[#e5e7eb] dark:border-gray-700 rounded-[10px] text-[14px] font-medium text-[#111827] dark:text-white bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488] transition-colors';

  const BONUS_ROWS: { key: keyof Pick<FidelityConfig, 'bonusPrimoOrdine' | 'bonusCompleanno' | 'bonusReferral'>; label: string; sub: string }[] = [
    { key: 'bonusPrimoOrdine', label: 'Primo Ordine', sub: 'Stelle bonus al primo acquisto' },
    { key: 'bonusCompleanno', label: 'Compleanno', sub: 'Regalo speciale il giorno del compleanno' },
    { key: 'bonusReferral', label: 'Porta un Amico', sub: 'Stelle bonus per ogni referral' },
  ];

  return (
    <div className="pb-40">

      {/* 1. Nome */}
      <div className={CARD}>
        <div className={HEAD}><span className="text-[18px]">🏷️</span><h3 className="text-[14px] font-bold text-[#111827] dark:text-white flex-1">Nome del programma</h3></div>
        <div className={BODY}>
          <label className={LBL}>Nome visibile ai clienti</label>
          <input className={INP} type="text" placeholder="es. Club Pizzeria Da Mario" value={config.nome} onChange={e => upd('nome', e.target.value)} />
        </div>
      </div>

      {/* 2. Ratio + Bonus */}
      <div className={CARD}>
        <div className={HEAD}><span className="text-[18px]">⭐</span><h3 className="text-[14px] font-bold text-[#111827] dark:text-white flex-1">Come guadagnano Stelle</h3></div>
        <div className={BODY}>
          <label className={LBL}>Ratio base</label>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-[#f9fafb] dark:bg-[#262626] border border-[#e5e7eb] dark:border-gray-700 rounded-[10px] p-3 text-center">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.8px] mb-1">Spesa cliente</div>
              <div className="text-[28px] font-black text-[#111827] dark:text-white leading-none">€1</div>
            </div>
            <div className="text-[22px] font-bold text-gray-400">=</div>
            <div className="flex-1 border-[1.5px] border-[#0d9488] bg-[#f0fdf4] dark:bg-[#0d9488]/10 rounded-[10px] p-3 text-center">
              <div className="text-[10px] font-semibold text-[#0d9488] uppercase tracking-[0.8px] mb-1">Stelle guadagnate</div>
              <input type="number" min="1" max="100" value={config.ratio}
                onChange={e => upd('ratio', parseFloat(e.target.value) || 1)}
                className="text-[28px] font-black text-[#0d9488] w-[70px] text-center border-none border-b-2 border-[#0d9488] bg-transparent outline-none" />
            </div>
          </div>
          <div className="h-px bg-[#f3f4f6] dark:bg-white/[0.04] mb-3" />
          <label className={LBL}>Bonus speciali</label>
          {BONUS_ROWS.map(({ key, label, sub }, i) => (
            <div key={key} className={`flex items-center gap-2.5 py-2.5 ${i < BONUS_ROWS.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[#374151] dark:text-gray-200">{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
              <Toggle enabled={config[key].attivo} onToggle={() => upd(key, { ...config[key], attivo: !config[key].attivo })} />
              {config[key].attivo && (
                <input type="number" value={config[key].valore} min="0"
                  onChange={e => upd(key, { ...config[key], valore: parseFloat(e.target.value) || 0 })}
                  className="w-[62px] px-2 py-1.5 border border-[#e5e7eb] dark:border-gray-700 rounded-[8px] text-[14px] font-bold text-[#0d9488] text-center bg-white dark:bg-[#262626] outline-none focus:border-[#0d9488]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Premi */}
      <div className={CARD}>
        <div className={HEAD}>
          <span className="text-[18px]">🎁</span>
          <h3 className="text-[14px] font-bold text-[#111827] dark:text-white flex-1">I tuoi premi</h3>
          <span className="text-[12px] font-semibold text-gray-400">{config.premi.length} premi</span>
        </div>
        <div className={BODY}>
          <label className={LBL}>Aggiungi rapidamente</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { stelle: 30, costo: 1.50, nome: 'Caffè Omaggio', e: '☕' },
              { stelle: 150, costo: 4.00, nome: 'Pizza Omaggio', e: '🍕' },
              { stelle: 80, costo: 2.50, nome: 'Dessert Omaggio', e: '🍮' },
              { stelle: 500, costo: 20.00, nome: 'Cena per 2', e: '🍽️' },
            ].map(c => (
              <button key={c.nome} type="button" onClick={() => quickAdd(c.stelle, c.costo, c.nome)}
                className="bg-[#f0fdf4] text-[#0d9488] border border-[#a7f3d0] rounded-[20px] px-2.5 py-1 text-[11px] font-bold hover:bg-[#dcfce7] transition-colors">
                {c.e} {c.nome} ({c.stelle} ⭐)
              </button>
            ))}
          </div>
          {config.premi.map(p => (
            <PremioCard key={p.id} premio={p} ratio={config.ratio}
              onChange={u => updPremio(p.id, u)} onDelete={() => delPremio(p.id)} />
          ))}
          <button type="button" onClick={addPremio}
            className="w-full py-3.5 border-[1.5px] border-dashed border-[#d1d5db] dark:border-gray-700 rounded-[12px] text-[13px] font-semibold text-gray-500 hover:border-[#0d9488] hover:text-[#0d9488] flex items-center justify-center gap-1.5 transition-colors mt-1">
            <Plus className="w-3.5 h-3.5" /> Aggiungi Premio Personalizzato
          </button>
        </div>
      </div>

      {/* 4. Livelli */}
      <div className={CARD}>
        <div className={HEAD}>
          <span className="text-[18px]">🏆</span>
          <h3 className="text-[14px] font-bold text-[#111827] dark:text-white flex-1">Sistema Livelli</h3>
          <Toggle enabled={config.livelliAttivi} onToggle={() => upd('livelliAttivi', !config.livelliAttivi)} />
        </div>
        {config.livelliAttivi ? (
          <div className={BODY}>
            {config.livelli.map((l, i) => (
              <div key={i} className={`flex items-center gap-2.5 py-2.5 ${i < config.livelli.length - 1 ? 'border-b border-[#f3f4f6] dark:border-white/[0.04]' : ''}`}>
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] flex-shrink-0" style={{ background: l.bg }}>{l.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: l.color }}>{l.nome}</p>
                  <p className="text-[11px] text-gray-400">
                    {i === 0 ? '0' : (config.livelli[i - 1].soglia || 0) + 1} → {l.soglia ? `${l.soglia} ⭐` : '∞'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input type="number" step="0.1" min="1" value={l.molt}
                    onChange={e => updLivello(i, { molt: parseFloat(e.target.value) || 1 })}
                    className="w-[56px] px-2 py-1.5 rounded-[8px] text-[14px] font-black text-center outline-none"
                    style={{ border: `1.5px solid ${l.border}`, color: l.color, background: l.bg }} />
                  <span className="text-[11px] text-gray-400 font-semibold">×</span>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-gray-400 text-center mt-2.5">Il moltiplicatore aumenta le stelle guadagnate per livello</p>
          </div>
        ) : (
          <div className="px-4 py-4 text-[12.5px] text-gray-400 text-center leading-relaxed">
            Attiva per creare livelli Green → Gold → Reserve<br />con moltiplicatori sulle stelle guadagnate
          </div>
        )}
      </div>

      {/* Desktop save button */}
      <button type="button" onClick={onSave} disabled={saving}
        className={`hidden md:flex w-full items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[15px] transition-all mt-2 ${saving ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0d9488] text-white hover:bg-teal-600 shadow-lg shadow-[#0d9488]/20 active:scale-[0.98]'}`}>
        <Save className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva Configurazione'}
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function FidelityConfigurator({ restaurantId, onBack, onSaved }: Props) {
  const { showToast, ToastContainer } = useToast();
  const [screen, setScreen] = useState<'loading' | 'picker' | 'config'>('loading');
  const [config, setConfig] = useState<FidelityConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const nextId = useRef(500);

  useEffect(() => {
    if (!restaurantId) return;
    db.from('settings').select('value').eq('restaurant_id', restaurantId).eq('key', 'fidelity_config').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try { setConfig(JSON.parse(data.value)); setScreen('config'); return; } catch { /* fall through */ }
        }
        setScreen('picker');
      });
  }, [restaurantId]);

  const handleSelectTemplate = (key: string) => {
    setConfig(JSON.parse(JSON.stringify(TEMPLATES[key])));
    setScreen('config');
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // Save config (excluding premi — those go in rewards table)
      const { premi: _, ...configWithoutPremi } = config;
      await db.from('settings').upsert(
        { restaurant_id: restaurantId, key: 'fidelity_config', value: JSON.stringify(configWithoutPremi) },
        { onConflict: 'restaurant_id,key' }
      );
      // Replace all rewards
      await db.from('rewards').delete().eq('restaurant_id', restaurantId);
      const validPremi = config.premi.filter(p => p.nome.trim() && p.stelle > 0);
      if (validPremi.length > 0) {
        await db.from('rewards').insert(validPremi.map(p => ({
          restaurant_id: restaurantId,
          name: p.nome.trim(),
          points_required: Math.round(p.stelle),
          description: `${Math.round(p.stelle)} stelle richieste`,
          cost_value: p.costo,
          image_url: '',
        })));
      }
      showToast('✅ Configurazione salvata!', 'success');
      onSaved();
    } catch (err: unknown) {
      showToast('❌ Errore: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── SubHeader (back + title + optional right action) ──
  const SubHeader = ({ title, rightAction }: { title: string; rightAction?: React.ReactNode }) => (
    <div className="sticky top-0 z-20 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 flex items-center h-[56px] px-4 gap-3 -mx-4 flex-shrink-0 mb-4">
      <button type="button"
        onClick={screen === 'config' && config ? () => setScreen('picker') : onBack}
        className="w-[34px] h-[34px] rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0">
        <ChevronLeft className="w-4 h-4 text-[#374151] dark:text-gray-300" />
      </button>
      <h2 className="flex-1 font-bold text-[17px] text-[#111827] dark:text-white truncate">{title}</h2>
      {rightAction}
    </div>
  );

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <SubHeader
        title="Carta Fedeltà"
        rightAction={screen === 'config' ? (
          <button type="button" onClick={handleSave} disabled={saving}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${saving ? 'bg-gray-200 text-gray-400' : 'bg-[#0d9488] text-white hover:bg-teal-600 active:scale-95'}`}>
            {saving ? '...' : 'Salva ✓'}
          </button>
        ) : undefined}
      />

      {screen === 'picker' && <TemplatePicker onSelect={handleSelectTemplate} />}
      {screen === 'config' && config && (
        <>
          <Configuratore config={config} setConfig={setConfig} nextId={nextId} saving={saving} onSave={handleSave} />
          <ROIPanel config={config} />
        </>
      )}
      <ToastContainer />
    </div>
  );
}
