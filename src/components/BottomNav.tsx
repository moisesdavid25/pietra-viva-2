import { Home, Settings, ShoppingBag } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useCart } from '../hooks/useCart';

export default function BottomNav({ restaurantSlug }: { restaurantSlug?: string } = {}) {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const slug = restaurantSlug || params.slug;
  const homeLink = slug ? `/${slug}` : '/';
  const ordiniLink = slug ? `/${slug}/ordini` : '/';

  const isHomeActive = location.pathname === homeLink || location.pathname === '/';
  const isOrdiniActive = location.pathname.endsWith('/ordini');
  const isGestioneActive = location.pathname.endsWith('/gestione');

  const { totalItems } = useCart(slug || null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#252525] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        <Link to={homeLink} className="flex flex-col items-center justify-center w-20 space-y-1 group">
          <Home className={clsx("w-6 h-6 transition-colors", isHomeActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
          <span className={clsx("text-[10px] font-medium uppercase tracking-wider transition-colors", isHomeActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")}>Home</span>
        </Link>
        <Link to={ordiniLink} className="flex flex-col items-center justify-center w-20 space-y-1 group relative">
          <div className="relative">
            <ShoppingBag className={clsx("w-6 h-6 transition-colors", isOrdiniActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#D32F2F] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <span className={clsx("text-[10px] font-medium uppercase tracking-wider transition-colors", isOrdiniActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")}>Ordine</span>
        </Link>
        <Link to={slug ? `/${slug}/gestione` : "/gestione"} className="flex flex-col items-center justify-center w-20 space-y-1 group">
          <Settings className={clsx("w-6 h-6 transition-colors", isGestioneActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
          <span className={clsx("text-[10px] font-medium uppercase tracking-wider transition-colors", isGestioneActive ? "text-[#008080]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")}>Gestione</span>
        </Link>
      </div>
      <div className="h-5 w-full"></div>
    </nav>
  );
}
