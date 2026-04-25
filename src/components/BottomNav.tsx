import { Home, Settings, ShoppingBag, ClipboardList, LogOut } from 'lucide-react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useCart } from '../hooks/useCart';
import { useState, useEffect } from 'react';
import db from '../db';

export default function BottomNav({ restaurantSlug }: { restaurantSlug?: string } = {}) {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const slug = restaurantSlug || params.slug;

  const homeLink       = slug ? `/${slug}` : '/';
  const ordiniLink     = slug ? `/${slug}/ordini` : '/';
  const cronologiaLink = slug ? `/${slug}/cronologia` : '/';

  const isHomeActive       = location.pathname === homeLink || location.pathname === '/';
  const isOrdiniActive     = location.pathname.endsWith('/ordini');
  const isCronologiaActive = location.pathname.endsWith('/cronologia');
  const isGestioneActive   = location.pathname.endsWith('/gestione');

  const { totalItems } = useCart(slug || null);
  const [role, setRole] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        db.from('user_roles').select('role').eq('user_id', session.user.id).single()
          .then(({ data }) => { if (data?.role) setRole(data.role); });
      }
    });
  }, []);

  // Read active table from sessionStorage and orders from localStorage
  useEffect(() => {
    if (!slug) return;
    const table = sessionStorage.getItem(`leomenu_tavolo_${slug}`);
    setActiveTable(table);
    const raw = localStorage.getItem(`leomenu_session_${slug}`);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s?.orderIds?.length) setHasSession(true);
      } catch (_) {}
    }
  }, [slug, location.pathname]);

  const handleExitConfirm = () => {
    if (!slug) return;
    sessionStorage.removeItem(`leomenu_tavolo_${slug}`);
    localStorage.removeItem(`leomenu_session_${slug}`);
    setActiveTable(null);
    setHasSession(false);
    setShowExitModal(false);
    navigate(`/${slug}`);
  };

  const thirdLinkDest  = role === 'owner' ? (slug ? `/${slug}/gestione` : '/gestione') : (role === 'customer' ? '/passport' : '/login');
  const thirdLinkLabel = role === 'customer' ? 'Passport' : (role === 'owner' ? 'Gestione' : 'Accedi');

  const tabCls = (active: boolean) =>
    clsx('flex flex-col items-center justify-center space-y-1 transition-colors',
      active ? 'text-[#008081]' : 'text-gray-400 dark:text-gray-500');

  const isTableSession = !!activeTable;

  return (
    <>
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

          {/* Storico */}
          <Link to={cronologiaLink} className={clsx(tabCls(isCronologiaActive), 'w-16 relative')}>
            <div className="relative">
              <ClipboardList className="w-6 h-6" />
              {hasSession && !isCronologiaActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#008081] rounded-full border-2 border-white dark:border-[#252525]" />
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Storico</span>
          </Link>

          {/* Esci (when table session) or Gestione/Accedi */}
          {isTableSession ? (
            <button
              onClick={() => setShowExitModal(true)}
              className={clsx('flex flex-col items-center justify-center w-16 space-y-1 transition-colors text-red-400 hover:text-red-500')}
            >
              <LogOut className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Esci</span>
            </button>
          ) : (
            <Link to={thirdLinkDest} className={clsx(tabCls(isGestioneActive), 'w-16')}>
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{thirdLinkLabel}</span>
            </Link>
          )}
        </div>
        <div className="h-5 w-full" />
      </nav>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <div className="flex flex-col items-center gap-3 mb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Esci dal tavolo?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Verranno chiuse la sessione del <span className="font-bold text-gray-700 dark:text-gray-300">Tavolo {activeTable}</span> e il tuo storico ordini. Questa azione non può essere annullata.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-2xl font-black text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleExitConfirm}
                className="flex-1 py-3 rounded-2xl font-black text-sm bg-red-500 hover:bg-red-600 text-white transition-colors active:scale-95"
              >
                Sì, esci
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
