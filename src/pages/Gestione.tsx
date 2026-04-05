import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Trash2, Edit2, ChevronLeft,
  ClipboardList, BookOpen, BarChart3, Users,
  Sliders, Settings2, Plus, Save, Command, Search, Zap, CheckCircle2, AlertCircle
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
  >('dashboard');
  const [productView, setProductView] = useState<'hub' | 'listino'>('hub');
  const [showWizard, setShowWizard] = useState(false);
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
  }, [location.search]);

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

      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#008080]" />
          </button>
          <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">Gestione</h1>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 uppercase px-2 hover:bg-red-50 dark:hover:bg-red-900/20 py-1 rounded transition-colors">
            Esci
          </button>
        </header>

        {/* ── Sub-header back bar ─────────────────────────────────────────── */}
        {activeTab !== 'dashboard' && (
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] sticky top-0 z-10">
            <button
              onClick={() => {
                if (activeTab === 'products' && productView === 'listino') {
                  setProductView('hub');
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
              {activeTab === 'products' && productView === 'listino'
                ? 'Listino Prodotti'
                : activeTab.replace('_', ' ')}
            </h2>
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-grow px-4 pt-0 pb-24 overflow-y-auto flex flex-col items-stretch justify-start">

          {/* Dashboard (B2B Command Center) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in max-w-6xl mx-auto py-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
                <div>
                  <h2 className="text-[2rem] font-black font-sans text-[#1A1A1A] dark:text-[#FDFCF0] tracking-tight mb-1 leading-none">
                    Bentornato, {restaurantName}
                  </h2>
                  <p className="text-gray-500 font-bold text-sm">Actionable Insights & Panoramica B2B.</p>
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

              {/* Actionable Insights Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ClipboardList className="w-16 h-16"/></div>
                  <div className="flex items-center gap-2 mb-4">
                     <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                     <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Live Orders in Cucina</h3>
                  </div>
                  <p className="text-4xl font-black text-[#1A1A1A] dark:text-white mb-2 leading-none">
                    {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length}
                  </p>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 inline-flex px-2 py-0.5 rounded-md">Ticket in attesa</p>
                </div>
                
                <div className="bg-white dark:bg-[#1C1C1C] border border-[#008081]/30 dark:border-[#008081]/20 rounded-2xl p-5 shadow-sm shadow-[#008081]/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Zap className="w-16 h-16"/></div>
                  <div className="flex items-center gap-2 mb-4">
                     <h3 className="text-xs font-black uppercase tracking-wider text-[#008081]">Automazione & Crescita</h3>
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 leading-snug">
                    I tuoi clienti VIP spendono il <span className="text-[#008081]">20% in più</span>. Promuovi la tua Fidelity Card dal QR.
                  </p>
                  <button onClick={() => setActiveTab('fidelizzazione')} className="text-xs font-black bg-[#008081] text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition-colors shadow-sm">Gestisci Passport</button>
                </div>

                <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-4">
                     <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Stato Inventario (Menù)</h3>
                  </div>
                  <p className="text-4xl font-black text-[#1A1A1A] dark:text-white mb-2 leading-none">
                    {products.filter(p => p.active).length}
                  </p>
                  <p className="text-sm font-bold text-gray-500 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Prodotti in vendita attivi
                  </p>
                </div>
              </div>

              {/* B2B Grid Modules */}
              <div className="mt-8">
                 <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 px-2">Ecosistema Leomenu</h3>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'ordini', icon: <ClipboardList />, title: 'Gestione Ordini', subtitle: 'Ricevitore', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
                      { id: 'products', icon: <BookOpen />, title: 'Menù Diretto', subtitle: 'Catalogo & Prezzi', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                      { id: 'business_intelligence', icon: <BarChart3 />, title: 'Analitiche', subtitle: 'Dashboard Vendite', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                      { id: 'fidelizzazione', icon: <Users />, title: 'CRM & Audience', subtitle: 'Carta Fedeltà', bg: 'bg-teal-50 dark:bg-teal-900/10 border-[#008081]/20', text: 'text-[#008081]' },
                      { id: 'cameriere', icon: <Sliders />, title: 'LeoPOS Mobile', subtitle: 'Terminale sala', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', isRoute: true },
                      { id: 'personalizzazione', icon: <Settings2 />, title: 'Scansione & MKTG', subtitle: 'Strumenti QR', bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
                      { id: 'settings', icon: <Settings2 />, title: 'Impostazioni', subtitle: 'Fiscale & WiFi', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400' }
                    ].map((mod) => (
                      <button 
                         key={mod.id}
                         onClick={() => mod.isRoute ? navigate(`/${restaurantSlug}/cameriere`) : setActiveTab(mod.id as any)}
                         className="flex flex-col items-start p-4 lg:p-5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-[#008081] hover:shadow-lg hover:shadow-[#008081]/10 transition-all group text-left h-36 justify-between disabled:opacity-50"
                      >
                         <div className={`w-10 h-10 rounded-xl ${mod.bg} ${mod.text} flex flex-col items-center justify-center border group-hover:scale-110 transition-transform`}>
                            {React.cloneElement(mod.icon as React.ReactElement, { className: 'w-5 h-5' })}
                         </div>
                         <div>
                            <span className="block font-black text-gray-800 dark:text-gray-200 tracking-tight leading-none mb-1">{mod.title}</span>
                            <span className="block font-bold text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wider">{mod.subtitle}</span>
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
              onOpenListino={() => setProductView('listino')}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenPersonalizzazione={() => setActiveTab('personalizzazione')}
            />
          )}

          {/* Listino Prodotti */}
          {activeTab === 'products' && productView === 'listino' && (
            <ProductManager
              restaurantId={restaurantId}
              categories={categories}
              products={products}
              onRefresh={fetchData}
              onBack={() => setProductView('hub')}
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

          {/* Impostazioni */}
          {activeTab === 'settings' && restaurantId && (
            <SettingsManager
              restaurantId={restaurantId}
              restaurantSlug={restaurantSlug}
              initialRestaurantName={restaurantName}
              subscriptionTier={subscriptionTier}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'business_intelligence' && restaurantId && (
            <BusinessIntelligence restaurantId={restaurantId} />
          )}

          {activeTab === 'fidelizzazione' && restaurantId && (
            <Fidelizzazione restaurantId={restaurantId} />
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
      <BottomNav restaurantSlug={restaurantSlug || ''} />
    </>
  );
}
