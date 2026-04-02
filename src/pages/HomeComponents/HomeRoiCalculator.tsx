import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Printer, ChevronRight } from 'lucide-react';

// ── Cost constants (Italian market, conservative estimates) ──────────────────
const BASE_PRINT_COST = 50;       // € base cost for design/setup
const COST_PER_MENU_UNIT = 3.5;   // € per physical menu printed
const LEOMENU_ANNUAL_COST = 180;  // € / year (€15/month plan)

function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function HomeRoiCalculator() {
  const [dishChanges, setDishChanges] = useState(12);   // changes per month
  const [tables, setTables] = useState(20);             // number of tables

  const calc = useMemo(() => {
    // Dynamic print const: base design fee + cost per physical menu (assume 1 menu per 1.5 tables on average to cover peaks)
    const menusToPrint = Math.ceil(tables * 1.5);
    const costPerPrintRun = BASE_PRINT_COST + (menusToPrint * COST_PER_MENU_UNIT);

    // With paper menus: every dish change may trigger a reprint
    // Assume 1 reprint per ~4 changes; conservative
    const reprintsPerYear = Math.ceil((dishChanges * 12) / 4);
    const printCostYear = reprintsPerYear * costPerPrintRun;

    // Time saved: each reprint = ~3h of coordination + waiting
    const hoursLost = reprintsPerYear * 3;

    const leomenuCostYear = LEOMENU_ANNUAL_COST;
    const grossSaving = printCostYear - leomenuCostYear;
    const roi = Math.round((grossSaving / leomenuCostYear) * 100);

    return { costPerPrintRun, printCostYear, leomenuCostYear, grossSaving, roi, reprintsPerYear, hoursLost };
  }, [dishChanges, tables]);

  const isPositive = calc.grossSaving > 0;

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-teal-50/40 overflow-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#008081]/10 text-[#008081] text-sm font-bold mb-5 tracking-wide uppercase">
            <Calculator className="w-4 h-4" />
            Calcolatore ROI
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
            Quanto stai spendendo<br />
            <span className="text-[#008081]">in stampa inutile?</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Regola i parametri del tuo locale e scopri il risparmio reale in secondi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* ── Sliders ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-gray-100 space-y-8">

            {/* Slider 1: dish changes per month */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <div className="flex flex-col">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Modifiche al menù al mese
                  </label>
                  <span className="text-[10px] font-semibold text-[#008081] mt-0.5 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-full w-max">
                    ← Trascina per calcolare →
                  </span>
                </div>
                <span className="text-2xl font-black text-[#008081]">{dishChanges}</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={dishChanges}
                onChange={e => setDishChanges(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#008081]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>1 (stabile)</span>
                <span>60 (stagionale)</span>
              </div>
            </div>

            {/* Slider 2: tables */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <div className="flex flex-col">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Coperti (tavoli)
                  </label>
                  <span className="text-[10px] font-semibold text-[#008081] mt-0.5 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-full w-max">
                    ← Trascina per calcolare →
                  </span>
                </div>
                <span className="text-2xl font-black text-[#008081]">{tables}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={tables}
                onChange={e => setTables(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#008081]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>5 tavoli</span>
                <span>100 tavoli</span>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-red-400" />
                  Ristampe stimate/anno
                </span>
                <span className="font-bold text-gray-700">{calc.reprintsPerYear}×</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Costo medio ristampa</span>
                <span className="font-bold text-gray-700">{formatEuro(calc.costPerPrintRun)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ore perse/anno</span>
                <span className="font-bold text-gray-700">{calc.hoursLost}h</span>
              </div>
            </div>
          </div>

          {/* ── Results ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Spending with paper */}
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
              <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Con menù cartaceo
              </p>
              <p className="text-4xl font-black text-red-600">
                {formatEuro(calc.printCostYear)}
              </p>
              <p className="text-sm text-red-400 mt-1">spesi in stampa ogni anno</p>
            </div>

            {/* Spending with Leomenu */}
            <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6">
              <p className="text-sm font-bold text-[#008081] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Con Leomenu
              </p>
              <p className="text-4xl font-black text-[#008081]">
                180 €<span className="text-lg text-teal-600/70 font-bold tracking-tight">/anno</span>
              </p>
              <p className="text-sm text-teal-600 mt-1 font-medium bg-teal-100/50 inline-block px-2 py-0.5 rounded-md">
                solo 15 €/mese
              </p>
            </div>

            {/* Net saving — hero card */}
            <div className={`rounded-3xl p-6 text-white relative overflow-hidden ${isPositive ? 'bg-gradient-to-br from-[#008081] to-teal-500' : 'bg-gradient-to-br from-gray-500 to-gray-600'}`}>
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-2 -bottom-6 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-sm font-bold uppercase tracking-wider text-white/80 mb-1">
                {isPositive ? '🎉 Risparmio netto' : 'Risultato'}
              </p>
              <p className="text-5xl font-black relative z-10">
                {isPositive ? '+' : ''}{formatEuro(calc.grossSaving)}
              </p>
              {isPositive && (
                <p className="text-white/80 text-sm mt-2 relative z-10">
                  ROI del <span className="font-black text-white text-lg">{calc.roi}%</span> nel primo anno
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full bg-[#008081] text-white font-bold py-4 rounded-2xl hover:bg-teal-600 transition-all hover:shadow-lg hover:shadow-[#008081]/30 hover:-translate-y-0.5 active:translate-y-0 text-base"
            >
              Inizia gratis — nessuna carta richiesta
              <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="text-center text-xs text-gray-400">
              Piano gratuito disponibile · Upgrade in qualsiasi momento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
