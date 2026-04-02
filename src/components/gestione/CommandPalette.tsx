import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronRight, BarChart3, Settings2, Box, ClipboardList, 
  Users, Command, Plus, BookOpen, Sliders 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  onNavigate: (tab: any) => void;
  ordersPending: number;
}

export function CommandPalette({ onNavigate, ordersPending }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const actions = [
    { title: 'Gestione Ordini', icon: <ClipboardList />, tab: 'ordini', kpi: ordersPending > 0 ? `${ordersPending} in corso` : null },
    { title: 'Menù & Catalogo Prodotti', icon: <BookOpen />, tab: 'products', kpi: null },
    { title: 'Dashboard Statistiche', icon: <BarChart3 />, tab: 'business_intelligence', kpi: "KPIs & Cohortes" },
    { title: 'CRM & Gestione Audience', icon: <Users />, tab: 'fidelizzazione', kpi: "Passport" },
    { title: 'Configurazione Ristorante', icon: <Settings2 />, tab: 'settings', kpi: null },
    { title: 'Modalità Cameriere (LeoPOS)', icon: <Sliders />, tab: 'cameriere', kpi: "Top" },
  ];

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      <div 
        ref={containerRef}
        className="w-full max-w-xl bg-[#FBFBFB] dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col transform transition-all"
        style={{ animation: 'slide-up-fade 0.2s ease-out' }}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E1E1E]">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            className="flex-grow bg-transparent text-[#1A1A1A] dark:text-[#FDFCF0] outline-none text-lg font-sans placeholder-gray-400"
            placeholder="Cosa vuoi gestire? (Es. Statistiche, Prodotti)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex gap-1 ml-3">
            <kbd className="hidden sm:inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 rounded px-2 h-6 text-xs font-mono font-bold border border-gray-200 dark:border-gray-700">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto no-scrollbar py-2">
          {filteredActions.length === 0 ? (
            <div className="py-14 text-center text-gray-500 font-sans">
              Nessun risultato trovato per "{query}"
            </div>
          ) : (
            <div className="px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 block mb-1">Azioni Rapide</span>
              <ul className="space-y-1">
                {filteredActions.map((action, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        onNavigate(action.tab);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-3 rounded-lg flex items-center justify-between group hover:bg-[#008081]/10 dark:hover:bg-[#008081]/20 transition-colors focus:bg-[#008081]/10 outline-none"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-md bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 group-hover:text-[#008081] group-hover:border-[#008081]/30 transition-colors">
                            {React.cloneElement(action.icon as React.ReactElement, { className: 'w-4 h-4' })}
                         </div>
                         <span className="font-sans font-bold text-gray-700 dark:text-gray-200 group-hover:text-[#008081] transition-colors">
                           {action.title}
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                         {action.kpi && (
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${action.kpi.includes('corso') ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                             {action.kpi}
                           </span>
                         )}
                         <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#008081] transition-colors" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-[#151515] border-t border-gray-100 dark:border-gray-800 flex justify-end">
           <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[10px] font-bold text-gray-500">POWERED BY LEOMENU</span>
           </div>
        </div>
      </div>
    </div>
  );
}
