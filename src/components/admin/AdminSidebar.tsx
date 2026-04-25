import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  TrendingUp,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import db from '../../db';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'PANORAMICA',
    items: [
      { label: 'Dashboard', to: '/leomenu-admin', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'RISTORANTI',
    items: [
      { label: 'Tutti i ristoranti', to: '/leomenu-admin/restaurants', icon: Store },
    ],
  },
  {
    heading: 'FATTURATO',
    items: [
      { label: 'MRR & Revenue', to: '/leomenu-admin/revenue', icon: TrendingUp },
    ],
  },
  {
    heading: 'PIATTAFORMA',
    items: [
      { label: 'Salute & Adozione', to: '/leomenu-admin/health', icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await db.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0F172A] flex flex-col z-50 select-none">
      {/* Logo */}
      <div className="px-4 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#008081] flex items-center justify-center">
            <span className="text-white font-black text-xs">L</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">Leomenu</p>
            <p className="text-[#008081] font-bold text-[10px] uppercase tracking-widest">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 px-3 mb-1.5">
              {section.heading}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/leomenu-admin'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 py-2.5 px-3 mx-0 rounded-lg text-xs font-bold transition-all duration-150 group ${
                    isActive
                      ? 'text-white bg-[#008081]/20 border-l-2 border-[#008081] pl-[10px]'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`
                }
              >
                <item.icon size={14} />
                <span className="flex-1">{item.label}</span>
                <ChevronRight size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <NavLink
          to="/leomenu-admin/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? 'text-white bg-[#008081]/20 border-l-2 border-[#008081] pl-[10px]'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <Settings size={14} />
          Impostazioni
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={14} />
          Esci
        </button>
      </div>
    </aside>
  );
}
