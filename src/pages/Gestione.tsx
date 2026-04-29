import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Trash2, Edit2, ChevronLeft,
  ClipboardList, BookOpen, BarChart3, Users,
  Sliders, Settings2, Plus, Save, Command, Search, Zap, CheckCircle2, AlertCircle,
  LayoutDashboard, QrCode, LogOut, ExternalLink, Receipt,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageCropperModal from '../components/ImageCropperModal';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';
import { CommandPalette } from '../components/gestione/CommandPalette';
import BusinessIntelligence from '../components/gestione/BusinessIntelligence';
import Fidelizzazione from '../components/gestione/Fidelizzazione';
import Personalizzazione from '../components/gestione/Personalizzazione';
import MenuManager from '../components/gestione/MenuManager';
import ProductManager from '../components/gestione/ProductManager';
import OnboardingWizard from '../components/gestione/OnboardingWizard';
import OrdiniManager from '../components/gestione/OrdiniManager';
import SettingsManager from '../components/gestione/SettingsManager';
import TavoliManager from '../components/gestione/TavoliManager';
import ContoManager from '../components/gestione/ContoManager';
import { useRestaurantAuth } from '../hooks/useRestaurantAuth';
import { useGestioneData } from '../hooks/useGestioneData';
import { useMenuCombo } from '../hooks/useMenuCombo';
import type { MenuCombo } from '../hooks/useGestioneData';

export default function Gestione() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  // ── Hook 1: Auth & restaurant profile ────────────────────────────────────
  const {
    isAuthenticated,
    restaurantId,
    restaurantSlug,
    restaurantName,
    subscriptionTier,
    handleLogout,
  } = useRestaurantAuth();

  // ── Hook 2: All Supabase data fetching ───────────────────────────────────
  const {
    categories,
    products,
    menus,
    orders,
    fetchData,
  } = useGestioneData(restaurantId, isAuthenticated);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    | 'dashboard' | 'ordini' | 'products' | 'menus'
    | 'settings' | 'business_intelligence' | 'fidelizzazione' | 'personalizzazione'
    | 'tavoli' | 'conto'
  >('dashboard');
  const [productView, setProductView] = useState<'hub' | 'listino'>('hub');
  const [settingsView, setSettingsView] = useState<string>('list');
  const [menuManagerView, setMenuManagerView] = useState<string>('hub');
  const [productMacroView, setProductMacroView] = useState<string | null>(null);
  const [fidelizzazioneView, setFidelizzazioneView] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const location = useLocation();

  // ── Hook 3: Menù del Giorno CRUD ──────────────────────────────────────────
  const { editingMenu, setEditingMenu, handleSaveMenu, handleDeleteMenu } = useMenuCombo(fetchData);

  // ── Cropper state ─────────────────────────────────────────────────────────
  const [cropperState, setCropperState] = useState<{
    src: string | null;
    aspect: number;
    callback: ((base64: string) => void) | null;
  }>({ src: null, aspect: 1, callback: null });

  useEffect(() => {
    if (location.search.includes('wizard=true')) setShowWizard(true);
    if (location.search.includes('upgrade=success')) {
      showToast(`🎉 Abbonamento attivato! Benvenuto nel piano ${subscriptionTier}.`, 'success');
    }
  }, [location.search]);

  // ── Fetch trial end date ───────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId || subscriptionTier !== 'trial') return;
    import('../db').then(({ default: db }) => {
      db.from('restaurants').select('subscription_ends_at').eq('id', restaurantId).maybeSingle().then(({ data }) => {
        if (data?.subscription_ends_at) setTrialEndsAt(data.subscription_ends_at as string);
      });
    });
  }, [restaurantId, subscriptionTier]);

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  // ── NAV_ITEMS ─────────────────────────────────────────────────────────────
  const NAV_ITEMS: { id: string; icon: React.ReactNode; label: string; isRoute?: boolean }[] = [
    { id: 'dashboard',             icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { id: 'ordini',                icon: <ClipboardList className="w-4 h-4" />,   label: 'Ordini' },
    { id: 'products',              icon: <BookOpen className="w-4 h-4" />,         label: 'Menù' },
    { id: 'business_intelligence', icon: <BarChart3 className="w-4 h-4" />,       label: 'Analitiche' },
    { id: 'fidelizzazione',        icon: <Users className="w-4 h-4" />,            label: 'CRM' },
    { id: 'personalizzazione',     icon: <QrCode className="w-4 h-4" />,           label: 'QR' },
    { id: 'tavoli',                 icon: <LayoutDashboard className="w-4 h-4" />,  label: 'Tavoli' },
    { id: 'conto',                 icon: <Receipt className="w-4 h-4" />,           label: 'Conto' },
    { id: 'settings',              icon: <Settings2 className="w-4 h-4" />,        label: 'Impostazioni' },
    { id: 'cameriere',             icon: <Sliders className="w-4 h-4" />,          label: 'LeoPOS', isRoute: true },
  ];

  const handleNavClick = (item: { id: string; isRoute?: boolean }) => {
    if (item.isRoute) navigate(`/${restaurantSlug}/cameriere`);
    else {
      if (item.id !== 'settings') setSettingsView('list');
      if (item.id !== 'products') { setMenuManagerView('hub'); setProductMacroView(null); }
      if (item.id !== 'fidelizzazione') setFidelizzazioneView(null);
      setActiveTab(item.id as any);
    }
  };

  const handleBack = () => {
    if (editingMenu) {
      setEditingMenu(null);
    } else if (restaurantSlug) {
      navigate(`/${restaurantSlug}`);
    } else {
      navigate('/');
    }
  };

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!isAuthenticated || !restaurantId) {
    return (
      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {showWizard && restaurantId && (
        <OnboardingWizard
          restaurantId={restaurantId}
          onComplete={() => { setShowWizard(false); fetchData(); }}
        />
      )}

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen fixed left-0 top-0 w-56 bg-white dark:bg-[#141414] border-r border-gray-100 dark:border-gray-800 flex-col z-40">
        {/* Brand header */}
        <div className="px-[18px] pt-5 pb-[14px] border-b border-gray-100 dark:border-gray-800">
          <p className="text-[9px] font-black text-[#10b981] uppercase tracking-[1.5px] mb-0.5">Leomenu</p>
          <p className="font-bold text-[#111827] dark:text-white text-[13px] truncate leading-snug">{restaurantName}</p>
          {subscriptionTier === 'trial' && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mt-1 inline-block">
              Trial
            </span>
          )}
        </div>
        {/* Nav items */}
        <nav className="flex-1 py-2.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-2.5 text-[13px] font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-[#0d9488] text-white font-semibold rounded-lg mx-2.5 px-2.5 py-[9px] w-[calc(100%-20px)]'
                  : 'text-[#4b5563] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-[18px] py-[9px]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        {/* Bottom: vedi menù + logout */}
        <div className="px-[18px] py-3.5 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {restaurantSlug && (
            <button
              onClick={() => navigate(`/${restaurantSlug}`)}
              className="w-full flex items-center gap-2.5 text-[12.5px] font-semibold text-[#10b981] hover:opacity-80 transition-opacity py-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Vedi Menù
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 text-[12.5px] font-medium text-red-500 hover:opacity-80 transition-opacity py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Esci
          </button>
        </div>
      </div>

      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased md:ml-56">

        {/* ── Single smart header (mobile only) ──────────────────────────── */}
        <header className={`md:hidden sticky top-0 z-50 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 items-center h-[56px] px-4 ${
          (activeTab === 'settings' && settingsView !== 'list') ||
          (activeTab === 'products' && productView === 'hub' && menuManagerView !== 'hub') ||
          (activeTab === 'products' && productView === 'listino' && productMacroView !== null) ||
          (activeTab === 'fidelizzazione' && fidelizzazioneView !== null)
            ? 'hidden' : 'flex'
        }`}>

          {activeTab === 'dashboard' ? (
            /* Dashboard: brand + nome + icons */
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black text-[#10b981] uppercase tracking-[1.5px] leading-none">Leomenu</p>
                <p className="font-bold text-[#111827] dark:text-white text-[15px] leading-snug truncate">{restaurantName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                  className="w-9 h-9 rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700"
                >
                  <Search className="w-4 h-4 text-[#6b7280]" />
                </button>
                {restaurantSlug && (
                  <button
                    onClick={() => navigate(`/${restaurantSlug}`)}
                    className="w-9 h-9 rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700"
                  >
                    <ExternalLink className="w-4 h-4 text-[#6b7280]" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Sub-section: back button + section title + vedi menù */
            <>
              <button
                onClick={() => {
                  if (activeTab === 'products' && productView === 'listino') setProductView('hub');
                  else setActiveTab('dashboard');
                }}
                className="w-[34px] h-[34px] rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0 mr-3"
              >
                <ChevronLeft className="w-4 h-4 text-[#374151] dark:text-gray-300" />
              </button>
              <h2 className="flex-1 font-bold text-[17px] text-[#111827] dark:text-white truncate">
                {({
                  ordini: 'Ordini', products: productView === 'listino' ? 'Listino Prodotti' : 'Menù',
                  business_intelligence: 'Analitiche', fidelizzazione: 'CRM',
                  personalizzazione: 'QR', tavoli: 'Tavoli', conto: 'Conto',
                  settings: 'Impostazioni', menus: 'Menu del Giorno',
                } as Record<string, string>)[activeTab] || activeTab}
              </h2>
              {restaurantSlug && (
                <button
                  onClick={() => navigate(`/${restaurantSlug}`)}
                  className="w-[34px] h-[34px] rounded-[10px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0 ml-2"
                >
                  <ExternalLink className="w-4 h-4 text-[#6b7280]" />
                </button>
              )}
            </>
          )}
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-grow px-4 pt-0 pb-24 overflow-y-auto flex flex-col items-stretch justify-start">

          {/* Dashboard (B2B Command Center) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in max-w-6xl mx-auto py-2 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
                <div>
                  <h2 className="text-[2rem] font-black font-sans text-[#1A1A1A] dark:text-[#FDFCF0] tracking-tight mb-1 leading-none">
                    Bentornato, {restaurantName}
                  </h2>
                  <p className="text-gray-500 font-bold text-sm">Il tuo pannello di controllo.</p>
                </div>
                <button
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'ctrlKey': true}))}
                  className="hidden md:flex items-center gap-2 bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-gray-200/50 dark:shadow-none hover:border-[#008081] transition-all group"
                >
                  <Search className="w-4 h-4 text-gray-400 group-hover:text-[#008081]" />
                  <span className="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">Cerca / Comandi Rapidi</span>
                  <kbd className="ml-2 bg-gray-50 dark:bg-[#252525] rounded px-1.5 py-0.5 text-[10px] uppercase font-mono border border-gray-200 dark:border-gray-700 text-gray-400 group-hover:text-[#008081] shadow-sm">Ctrl K</kbd>
                </button>
              </div>

              {/* Trial banner */}
              {subscriptionTier === 'trial' && (
                <div className="mx-2 flex items-center justify-between gap-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                    🕐 Sei in trial gratuito{trialDaysLeft !== null ? ` — ${trialDaysLeft} giorni rimanenti` : ''}. Attiva un piano per continuare.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex-shrink-0 text-xs font-black bg-[#008081] text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Attiva ora
                  </button>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">

                {/* Live Orders */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-[0.07]"><ClipboardList className="w-16 h-16"/></div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="w-[7px] h-[7px] rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                    <p className="text-[9.5px] font-black uppercase tracking-[1.2px] text-gray-400">Live Orders in Cucina</p>
                  </div>
                  <p className="text-[48px] font-black text-[#111827] dark:text-white leading-none mb-1.5">
                    {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length}
                  </p>
                  <p className="text-[12px] font-medium text-orange-500">Ticket in attesa</p>
                </div>

                {/* Automazione */}
                <div className="bg-gradient-to-br from-white to-[#f0fdf4] dark:from-[#1C1C1C] dark:to-[#1C1C1C] border border-[#a7f3d0] dark:border-[#008081]/20 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-[0.06]"><Zap className="w-16 h-16"/></div>
                  <p className="text-[10px] font-black uppercase tracking-[1px] text-gray-500 mb-2">Automazione &amp; Crescita</p>
                  <p className="text-[13px] font-medium text-[#374151] dark:text-gray-300 leading-relaxed mb-3">
                    I tuoi clienti <strong className="text-[#111827] dark:text-white">VIP</strong> spendono il{' '}
                    <strong className="text-[#111827] dark:text-white">20% in più</strong>. Promuovi la tua Fidelity Card dal QR.
                  </p>
                  <button
                    onClick={() => setActiveTab('fidelizzazione')}
                    className="text-[12px] font-semibold bg-[#0d9488] text-white px-3.5 py-[7px] rounded-[7px] hover:bg-teal-600 transition-colors"
                  >
                    Gestisci Carta Fedeltà
                  </button>
                </div>

                {/* Inventario */}
                <div className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-xl p-5 col-span-2 md:col-span-1">
                  <p className="text-[9.5px] font-black uppercase tracking-[1.2px] text-gray-400 mb-2.5">Stato Inventario (Menù)</p>
                  <p className="text-[48px] font-black text-[#111827] dark:text-white leading-none mb-1.5">
                    {products.filter(p => p.active).length}
                  </p>
                  <p className="text-[12px] font-medium text-[#10b981] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prodotti in vendita attivi
                  </p>
                </div>
              </div>

              {/* Ecosystem Grid */}
              <div className="px-2">
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400 mb-3">Ecosistema Leomenu</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { id: 'ordini',                title: 'Ordini',       subtitle: 'Ricevitore',        icon: <ClipboardList />, iconBg: '#fff7ed', iconColor: '#f97316' },
                    { id: 'products',              title: 'Menù',         subtitle: 'Catalogo & Prezzi', icon: <BookOpen />,       iconBg: '#eff6ff', iconColor: '#3b82f6' },
                    { id: 'business_intelligence', title: 'Analitiche',   subtitle: 'Dashboard Vendite', icon: <BarChart3 />,      iconBg: '#f0fdf4', iconColor: '#10b981' },
                    { id: 'fidelizzazione',        title: 'CRM',          subtitle: 'Carta Fedeltà',     icon: <Users />,          iconBg: '#eff6ff', iconColor: '#3b82f6' },
                    { id: 'tavoli',                title: 'Tavoli',       subtitle: 'Planimetria Sala',  icon: <LayoutDashboard />,iconBg: '#faf5ff', iconColor: '#9333ea' },
                    { id: 'cameriere',             title: 'LeoPOS',       subtitle: 'Terminale Sala',    icon: <Sliders />,        iconBg: '#f0fdfa', iconColor: '#0d9488', isRoute: true },
                    { id: 'conto',                 title: 'Conto',        subtitle: 'Gestione Conto',    icon: <Receipt />,        iconBg: '#fff1f2', iconColor: '#f43f5e' },
                    { id: 'personalizzazione',     title: 'QR',           subtitle: 'Strumenti QR',      icon: <QrCode />,         iconBg: '#fefce8', iconColor: '#ca8a04' },
                    { id: 'settings',              title: 'Impostazioni', subtitle: 'Fiscale & WiFi',    icon: <Settings2 />,      iconBg: '#f0fdf4', iconColor: '#16a34a' },
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => mod.isRoute ? navigate(`/${restaurantSlug}/cameriere`) : setActiveTab(mod.id as any)}
                      className="bg-white dark:bg-[#1C1C1C] border border-[#e8eaed] dark:border-white/5 rounded-xl p-4 md:p-[22px] flex flex-col items-start gap-2.5 hover:border-[#008081]/40 hover:shadow-md transition-all text-left active:scale-95"
                    >
                      <div
                        className="w-9 h-9 md:w-[38px] md:h-[38px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                        style={{ background: mod.iconBg }}
                      >
                        {React.cloneElement(mod.icon as React.ReactElement, {
                          className: 'w-4 h-4 md:w-5 md:h-5',
                          style: { color: mod.iconColor },
                        })}
                      </div>
                      <div>
                        <p className="font-bold text-[#111827] dark:text-white text-[13px] md:text-sm leading-tight">{mod.title}</p>
                        <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-[0.8px] mt-0.5 hidden md:block">{mod.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ordini */}
          {activeTab === 'ordini' && <OrdiniManager restaurantId={restaurantId} />}

          {/* Menù Hub */}
          {activeTab === 'products' && productView === 'hub' && (
            <MenuManager
              restaurantId={restaurantId}
              onOpenListino={() => { setProductMacroView(null); setProductView('listino'); }}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenPersonalizzazione={() => setActiveTab('personalizzazione')}
              onViewChange={(v) => setMenuManagerView(v)}
            />
          )}

          {/* Listino Prodotti */}
          {activeTab === 'products' && productView === 'listino' && (
            <ProductManager
              restaurantId={restaurantId}
              categories={categories}
              products={products}
              onRefresh={fetchData}
              onBack={() => { setProductMacroView(null); setProductView('hub'); }}
              onMacroSelect={(m) => setProductMacroView(m)}
            />
          )}

          {/* Menù del Giorno */}
          {activeTab === 'menus' && (
            <div className="space-y-6">
              {editingMenu ? (
                <div className="bg-white dark:bg-[#262626] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="font-bold text-xl text-[#008080] tracking-wide">
                      {editingMenu.id ? 'MODIFICA MENÙ' : 'NUOVO MENÙ'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome / Tipo Menù</label>
                      <input type="text" placeholder="es. Menù Terra" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.type || ''} onChange={e => setEditingMenu({ ...editingMenu, type: e.target.value })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prezzo (€)</label>
                      <input type="number" placeholder="es. 15" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold text-[#008080] focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.price || ''} onChange={e => setEditingMenu({ ...editingMenu, price: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-2">Composizione del Menù</label>
                    <datalist id="restaurant-products">
                      {products.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(['entree', 'primo', 'secondo', 'contorno', 'desert', 'bevande'] as const).map(field => (
                        <input
                          key={field}
                          type="text"
                          list="restaurant-products"
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                          value={editingMenu[field] || ''}
                          onChange={e => setEditingMenu({ ...editingMenu, [field]: e.target.value })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={handleSaveMenu} className="flex-1 bg-[#008080] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-teal-700 transition-colors">
                      <Save className="w-5 h-5" /> Salva Menù
                    </button>
                    <button onClick={() => setEditingMenu(null)} className="flex-1 bg-gray-100 text-gray-700 dark:bg-[#1A1A1A] dark:text-gray-300 border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <button
                    onClick={() => setEditingMenu({ type: '', price: 0, entree: '', primo: '', secondo: '', contorno: '', desert: '', bevande: '' } as MenuCombo)}
                    className="w-full bg-[#008080] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-8 hover:bg-teal-700 transition"
                  >
                    <Plus className="w-6 h-6" /> Nuovo Menù del Giorno
                  </button>
                  {menus.map(menu => (
                    <div key={menu.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{menu.type}</h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            {menu.entree && <p><span className="font-medium text-gray-700 dark:text-gray-300">Entrée:</span> {menu.entree}</p>}
                            {menu.primo && <p><span className="font-medium text-gray-700 dark:text-gray-300">Primo:</span> {menu.primo}</p>}
                            {menu.secondo && <p><span className="font-medium text-gray-700 dark:text-gray-300">Secondo:</span> {menu.secondo}</p>}
                            {menu.contorno && <p><span className="font-medium text-gray-700 dark:text-gray-300">Contorni:</span> {menu.contorno}</p>}
                            {menu.desert && <p><span className="font-medium text-gray-700 dark:text-gray-300">Dessert:</span> {menu.desert}</p>}
                            {menu.bevande && <p><span className="font-medium text-gray-700 dark:text-gray-300">Bevande:</span> {menu.bevande}</p>}
                          </div>
                        </div>
                        <span className="font-bold text-[#008080] border border-[#008080]/20 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-xl ml-4 whitespace-nowrap">
                          €{menu.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-5 flex justify-end items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <button onClick={() => setEditingMenu(menu)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" /> Modifica
                        </button>
                        <button onClick={() => handleDeleteMenu(menu.id)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" /> Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tavoli */}
          {activeTab === 'tavoli' && restaurantId && (
            <TavoliManager restaurantId={restaurantId} />
          )}

          {/* Conto */}
          {activeTab === 'conto' && restaurantId && (
            <ContoManager restaurantId={restaurantId} />
          )}

          {/* Impostazioni */}
          {activeTab === 'settings' && restaurantId && (
            <SettingsManager
              restaurantId={restaurantId}
              restaurantSlug={restaurantSlug}
              initialRestaurantName={restaurantName}
              subscriptionTier={subscriptionTier}
              onLogout={handleLogout}
              onViewChange={(v) => setSettingsView(v)}
            />
          )}

          {activeTab === 'business_intelligence' && restaurantId && (
            <BusinessIntelligence restaurantId={restaurantId} />
          )}

          {activeTab === 'fidelizzazione' && restaurantId && (
            <Fidelizzazione
              restaurantId={restaurantId}
              onViewChange={(v) => setFidelizzazioneView(v)}
            />
          )}

          {activeTab === 'personalizzazione' && restaurantId && (
            <Personalizzazione restaurantId={restaurantId} restaurantSlug={restaurantSlug || ''} />
          )}
        </div>
      </div>

      {/* Global Cropper Modal */}
      <CommandPalette 
        onNavigate={(tab) => {
          if (tab === 'cameriere') navigate(`/${restaurantSlug}/cameriere`);
          else setActiveTab(tab);
        }} 
        ordersPending={orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length} 
      />

      <ImageCropperModal
        imageSrc={cropperState.src}
        aspect={cropperState.aspect}
        onConfirm={(base64) => {
          if (cropperState.callback) cropperState.callback(base64);
          setCropperState({ src: null, aspect: 1, callback: null });
        }}
        onCancel={() => setCropperState({ src: null, aspect: 1, callback: null })}
      />

      <ToastContainer />
      <div className="md:hidden">
        <BottomNav restaurantSlug={restaurantSlug || ''} />
      </div>
    </>
  );
}
