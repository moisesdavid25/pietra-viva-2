import { Home, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#252525] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        <Link to="/" className="flex flex-col items-center justify-center w-20 space-y-1 group">
          <Home className={clsx("w-6 h-6 transition-colors", location.pathname === '/' ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
          <span className={clsx("text-[10px] font-medium uppercase tracking-wider transition-colors", location.pathname === '/' ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")}>Home</span>
        </Link>
        <Link to="/gestione" className="flex flex-col items-center justify-center w-20 space-y-1 group">
          <Settings className={clsx("w-6 h-6 transition-colors", location.pathname === '/gestione' ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
          <span className={clsx("text-[10px] font-medium uppercase tracking-wider transition-colors", location.pathname === '/gestione' ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")}>Gestione</span>
        </Link>
      </div>
      <div className="h-5 w-full"></div>
    </nav>
  );
}
