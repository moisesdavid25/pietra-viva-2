import { Home, Settings, ShoppingBag, ClipboardList } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useCart } from '../hooks/useCart';
import { useState, useEffect } from 'react';
import db from '../db';

export default function BottomNav({ restaurantSlug }: { restaurantSlug?: string } = {}) {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const slug = restaurantSlug || params.slug;
  const homeLink      = slug ? `/${slug}` : '/';
  const ordiniLink    = slug ? `/${slug}/ordini` : '/';
  const cronologiaLink = slug ? `/${slug}/cronologia` : '/';

  const isHomeActive       = location.pathname === homeLink || location.pathname === '/';
  const isOrdiniActive     = location.pathname.endsWith('/ordini');
  const isCronologiaActive = location.pathname.endsWith('/cronologia');
  const isGestioneActive   = location.pathname.endsWith('/gestione');

  const { totalItems } = useCart(slug || null);
  const [role, setRole] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        db.from('user_roles').select('role').eq('user_id', session.user.id).single()
          .then(({ data }) => { if (data?.role) setRole(data.role); });
      }
    });
  }, []);

  // Check session in localStorage for badge
  useEffect(() => {
    if (!slug) return;
    const raw = localStorage.getItem(`leomenu_session_${slug}`);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s?.orderIds?.length) setHasSession(true);
    } catch (_) {}
  }, [slug, location.pathname]);

  const thirdLinkDest  = role === 'owner' ? (slug ? `/${slug}/gestione` : '/gestione') : (role === 'customer' ? '/passport' : '/login');
  const thirdLinkLabel = role === 'customer' ? 'Passport' : (role === 'owner' ? 'Gestione' : 'Accedi');

  const tabCls = (active: boolean) =>
    clsx('flex flex-col items-center justify-center space-y-1 transition-colors',
      active ? 'text-[#008081]' : 'text-gray-400 dark:text-gray-500');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#252525] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-4 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">

        {/* Home */}
        <Link to={homeLink} className={clsx(tabCls(isHomeActive), 'w-16')}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
        </Link>

        {/* Ordine (carrito) */}
        <Link to={ordiniLink} className={clsx(tabCls(isOrdiniActive), 'w-16 relative')}>
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#D32F2F] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider">Ordine</span>
        </Link>

        {/* Cronologia */}
        <Link to={cronologiaLink} className={clsx(tabCls(isCronologiaActive), 'w-16 relative')}>
          <div className="relative">
            <ClipboardList className="w-6 h-6" />
            {hasSession && !isCronologiaActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#008081] rounded-full border-2 border-white dark:border-[#252525]" />
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider">Storico</span>
        </Link>

        {/* Gestione / Passport / Accedi */}
        <Link to={thirdLinkDest} className={clsx(tabCls(isGestioneActive), 'w-16')}>
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">{thirdLinkLabel}</span>
        </Link>

      </div>
      <div className="h-5 w-full" />
    </nav>
  );
}
