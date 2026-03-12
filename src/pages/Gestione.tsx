import React, { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Clock, CheckCircle, Package, ArrowLeft, Trash2, Edit2, Play, ChevronDown, ChevronUp, Save, Search, Settings, Coffee, Percent, FileText, Smartphone, LayoutDashboard, CreditCard, ChevronRight, ArrowUp, ArrowDown, MoreVertical, ChevronLeft, ClipboardList, BookOpen, BarChart3, Users, Sliders, Settings2, Plus, Upload, Camera, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ImageCropperModal from '../components/ImageCropperModal';
import { useToast } from '../components/Toast';
import db from '../db';
import BottomNav from '../components/BottomNav';
import BusinessIntelligence from '../components/gestione/BusinessIntelligence';
import Fidelizzazione from '../components/gestione/Fidelizzazione';
import Personalizzazione from '../components/gestione/Personalizzazione';
import MenuManager from '../components/gestione/MenuManager';

interface Category {
  id: string;
  section: string;
  name: string;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  image_url: string;
  sort_order?: number;
  active?: boolean;
}

interface MenuCombo {
  id: number;
  type: string;
  price: number;
  entree: string;
  primo: string;
  secondo: string;
  contorno: string;
  desert: string;
  bevande: string;
}

interface OrderItem {
  id: string;
  product: {
    name: string;
  };
  quantity: number;
  notes: string | null;
  price_at_time: number;
}

interface Order {
  id: string;
  table_number: string | null;
  status: 'in_attesa' | 'in_preparazione' | 'pronto' | 'consegnato';
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function Gestione() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ordini' | 'products' | 'menus' | 'settings' | 'business_intelligence' | 'fidelizzazione' | 'personalizzazione'>('dashboard');
  const [expandedSettingSection, setExpandedSettingSection] = useState<string>('profilo');
  const [ordiniTab, setOrdiniTab] = useState<'corrente' | 'storico'>('corrente');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [productView, setProductView] = useState<'hub' | 'listino'>('hub');
  const [selectedMacroCategory, setSelectedMacroCategory] = useState<string | null>(null);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<MenuCombo[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [storicoOrders, setStoricoOrders] = useState<Order[]>([]);

  // Form states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuCombo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cropper state
  const [cropperState, setCropperState] = useState<{ src: string | null; aspect: number; callback: ((base64: string) => void) | null }>({
    src: null,
    aspect: 1,
    callback: null,
  });

  // Hidden file input refs for clean upload UX
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  const handleLogout = async () => {
    await db.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  useEffect(() => {
    db.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthenticated(true);
        // Fetch their restaurant profile
        db.from('restaurants').select('id, slug, name').eq('user_id', data.user.id).neq('slug', 'demo').limit(1).maybeSingle()
          .then(({ data: resData, error }) => {
            if (resData) {
              setRestaurantId(resData.id);
              setRestaurantSlug(resData.slug);
              setRestaurantName(resData.name);
            } else {
              navigate('/onboarding');
            }
          });
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && restaurantId) {
      fetchData();
    }
  }, [isAuthenticated, restaurantId]);

  const fetchData = async () => {
    if (!restaurantId) return;
    const [{ data: cats }, { data: menusRes }, { data: settingsRes }, { data: activeOrdersRes }, { data: storicoOrdersRes }] = await Promise.all([
      db.from('categories').select('*').eq('restaurant_id', restaurantId).order('position', { ascending: true }).order('id'),
      db.from('menus').select('*').eq('restaurant_id', restaurantId).order('id'),
      db.from('settings').select('*').eq('restaurant_id', restaurantId),
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).neq('status', 'consegnato').order('created_at', { ascending: true }),
      db.from('orders').select(`
        id, table_number, status, total_price, created_at, customer_name, order_type, daily_order_number,
        order_items ( id, quantity, notes, price_at_time, product:products(name) )
      `).eq('restaurant_id', restaurantId).eq('status', 'consegnato').order('created_at', { ascending: false }).limit(100)
    ]);

    if (cats) {
      const sortedCats = [...cats].sort((a, b) => (a.position || 0) - (b.position || 0));
      setCategories(sortedCats);

      const categoryOrderMap = new Map();
      sortedCats.forEach((cat, index) => {
        categoryOrderMap.set(cat.id, index);
      });

      const { data: prods } = await db.from('products').select('*').eq('restaurant_id', restaurantId).order('sort_order', { ascending: true }).order('id');
      if (prods) {
        const prodsWithIndex = prods.map(p => {
          const catIndex = categoryOrderMap.has(p.category_id) ? categoryOrderMap.get(p.category_id) : 999;
          return { ...p, _catIndex: catIndex };
        });

        prodsWithIndex.sort((a, b) => {
          if (a._catIndex !== b._catIndex) {
            return a._catIndex - b._catIndex;
          }
          return (a.sort_order || 0) - (b.sort_order || 0);
        });

        setProducts(prodsWithIndex.map(({ _catIndex, ...rest }) => rest));
      }
    }

    if (menusRes) setMenus(menusRes);

    if (settingsRes) {
      const settingsObj = settingsRes.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      setSettings(settingsObj);
    }

    // @ts-ignore
    if (activeOrdersRes) setOrders(activeOrdersRes);
    // @ts-ignore
    if (storicoOrdersRes) setStoricoOrders(storicoOrdersRes);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Poll for new orders every 10 seconds if active tab is ordini
  useEffect(() => {
    if (activeTab === 'ordini' && restaurantId) {
      const interval = setInterval(() => {
        fetchData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, restaurantId]);

  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = 'in_preparazione';
    if (currentStatus === 'in_preparazione') nextStatus = 'pronto';
    else if (currentStatus === 'pronto') nextStatus = 'consegnato';

    await db.from('orders').update({ status: nextStatus }).eq('id', orderId);
    fetchData(); // Refresh list to remove if delivered or update status
  };

  const handleClearStorico = async () => {
    if (!confirm('Sei sicuro di voler svuotare lo storico degli ordini di oggi? Questa operazione è irreversibile.')) return;
    if (!restaurantId) return;

    await db.from('orders').delete().eq('restaurant_id', restaurantId).eq('status', 'consegnato');
    fetchData();
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name || editingProduct.price === undefined || editingProduct.price === null || !editingProduct?.category_id) return;

    const isNew = !editingProduct.id;
    if (isNew) {
      await db.from('products').insert({
        restaurant_id: restaurantId,
        category_id: editingProduct.category_id,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        price_unit: editingProduct.price_unit,
        image_url: editingProduct.image_url,
        sort_order: editingProduct.sort_order || 0
      });
    } else {
      await db.from('products').update({
        category_id: editingProduct.category_id,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        price_unit: editingProduct.price_unit,
        image_url: editingProduct.image_url,
        sort_order: editingProduct.sort_order
      }).eq('id', editingProduct.id).eq('restaurant_id', restaurantId);
    }

    setEditingProduct(null);
    fetchData();
  };

  const [expandedSubCats, setExpandedSubCats] = useState<Record<string, boolean>>({});
  const [openContextProductId, setOpenContextProductId] = useState<string | null>(null);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    await db.from('products').delete().eq('id', id);
    fetchData();
  };

  const handleToggleProductActive = async (product: Product) => {
    const newActive = !product.active;
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newActive } : p));
    await db.from('products').update({ active: newActive }).eq('id', product.id);
    showToast(newActive ? '👁 Prodotto ora visibile nel menù' : '🙈 Prodotto nascosto dal menù', newActive ? 'success' : 'info');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria? Tutti i prodotti al suo interno verranno eliminati.')) return;
    const { error } = await db.from('categories').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleDeleteMacroCategory = async (macroName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la macro-categoria "${macroName}"? Tutte le categorie e i prodotti al suo interno verranno eliminati.`)) return;
    // Find all category IDs that belong to this macro section
    const categoriesToDelete = categories.filter(c => c.section === macroName).map(c => c.id);

    if (categoriesToDelete.length === 0) return;

    // Delete all categories in this macro (Cascade delete should handle products if configured in DB, otherwise we might need to delete products first)
    const { error } = await db.from('categories').delete().in('id', categoriesToDelete);

    if (!error) {
      setSelectedMacroCategory(null);
      fetchData();
    } else {
      console.error('Error deleting macro category:', error);
      showToast('Errore durante l\'eliminazione della categoria. Riprova.', 'error');
    }
  };

  const handleMoveProduct = async (product: Product, direction: 'up' | 'down') => {
    const categoryProducts = products.filter(p => p.category_id === product.category_id);
    const currentIndex = categoryProducts.findIndex(p => p.id === product.id);

    if (direction === 'up' && currentIndex > 0) {
      const newCategoryProducts = [...categoryProducts];
      const temp = newCategoryProducts[currentIndex];
      newCategoryProducts[currentIndex] = newCategoryProducts[currentIndex - 1];
      newCategoryProducts[currentIndex - 1] = temp;

      // Ensure sort orders reflect their new index
      newCategoryProducts.forEach((p, idx) => {
        p.sort_order = idx;
      });

      // Optimistic UI update
      const newProducts = [...products];
      const idx1 = newProducts.findIndex(p => p.id === newCategoryProducts[currentIndex].id);
      const idx2 = newProducts.findIndex(p => p.id === newCategoryProducts[currentIndex - 1].id);
      if (idx1 !== -1 && idx2 !== -1) {
        newProducts[idx1] = newCategoryProducts[currentIndex];
        newProducts[idx2] = newCategoryProducts[currentIndex - 1];
        newProducts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setProducts(newProducts);
      }

      await Promise.all(newCategoryProducts.map((p, idx) =>
        db.from('products').update({ sort_order: idx }).eq('id', p.id)
      ));
      fetchData();
    } else if (direction === 'down' && currentIndex < categoryProducts.length - 1) {
      const newCategoryProducts = [...categoryProducts];
      const temp = newCategoryProducts[currentIndex];
      newCategoryProducts[currentIndex] = newCategoryProducts[currentIndex + 1];
      newCategoryProducts[currentIndex + 1] = temp;

      // Ensure sort orders reflect their new index
      newCategoryProducts.forEach((p, idx) => {
        p.sort_order = idx;
      });

      // Optimistic UI update
      const newProducts = [...products];
      const idx1 = newProducts.findIndex(p => p.id === newCategoryProducts[currentIndex].id);
      const idx2 = newProducts.findIndex(p => p.id === newCategoryProducts[currentIndex + 1].id);
      if (idx1 !== -1 && idx2 !== -1) {
        newProducts[idx1] = newCategoryProducts[currentIndex];
        newProducts[idx2] = newCategoryProducts[currentIndex + 1];
        newProducts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setProducts(newProducts);
      }

      await Promise.all(newCategoryProducts.map((p, idx) =>
        db.from('products').update({ sort_order: idx }).eq('id', p.id)
      ));
      fetchData();
    }
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    const currentCat = newCategories[idx];
    const targetCat = newCategories[targetIdx];

    const currentPos = currentCat.position ?? idx;
    const targetPos = targetCat.position ?? targetIdx;

    currentCat.position = targetPos;
    targetCat.position = currentPos;

    newCategories[idx] = targetCat;
    newCategories[targetIdx] = currentCat;

    newCategories.sort((a, b) => (a.position || 0) - (b.position || 0));
    setCategories(newCategories);

    await Promise.all([
      db.from('categories').update({ position: currentCat.position }).eq('id', currentCat.id),
      db.from('categories').update({ position: targetCat.position }).eq('id', targetCat.id)
    ]);
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo menu?')) return;
    await db.from('menus').delete().eq('id', id);
    fetchData();
  };

  const handleSaveMenu = async () => {
    if (!editingMenu) return;
    await db.from('menus').update({
      type: editingMenu.type,
      price: editingMenu.price,
      entree: editingMenu.entree,
      primo: editingMenu.primo,
      secondo: editingMenu.secondo,
      contorno: editingMenu.contorno,
      desert: editingMenu.desert,
      bevande: editingMenu.bevande
    }).eq('id', editingMenu.id);
    setEditingMenu(null);
    fetchData();
  };

  const handleSaveSettings = async () => {
    // 1. Update the restaurant name in 'restaurants' table
    if (restaurantName.trim() !== '') {
      await db.from('restaurants').update({ name: restaurantName }).eq('id', restaurantId);
    }

    // 2. Update all settings
    const updates = Object.entries(settings).map(([key, value]) => ({ restaurant_id: restaurantId, key, value }));
    for (const update of updates) {
      await db.from('settings').upsert(update);
    }
    showToast('✓ Impostazioni salvate con successo');
    fetchData();
  };

  // Opens the ImageCropperModal with the selected file
  const openCropper = (file: File, aspect: number, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({ src: reader.result as string, aspect, callback });
    };
    reader.readAsDataURL(file);
  };

  // Opens the file picker + crops with modal (for category images used inside settings)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, aspect?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (aspect !== undefined) {
      openCropper(file, aspect, callback);
    } else {
      // Direct resize without crop (no aspect ratio specified)
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 800;
          let width = img.width, height = img.height;
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); callback(canvas.toDataURL('image/webp', 0.6)); }
          else { callback(event.target?.result as string); }
          setIsUploading(false);
        };
        img.onerror = () => { setIsUploading(false); callback(event.target?.result as string); };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    if (editingProduct || editingMenu) {
      setEditingProduct(null);
      setEditingMenu(null);
    } else if (restaurantSlug) {
      navigate(`/${restaurantSlug}`);
    } else {
      navigate('/');
    }
  };

  if (!isAuthenticated || !restaurantId) {
    return (
      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#FBFBFB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
        <header className="sticky top-0 z-50 bg-[#FBFBFB]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#008080]" />
          </button>
          <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">Gestione</h1>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 uppercase px-2 hover:bg-red-50 dark:hover:bg-red-900/20 py-1 rounded transition-colors">
            Esci
          </button>
        </header>

        {activeTab !== 'dashboard' && (
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] sticky top-0 z-10">
            <button
              onClick={() => {
                if (activeTab === 'products' && productView === 'listino') {
                  if (selectedMacroCategory) {
                    setSelectedMacroCategory(null); // Go back to macro categories list
                  } else {
                    setProductView('hub'); // Go back to hub
                  }
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
                ? (selectedMacroCategory ? selectedMacroCategory : 'Listino Prodotti')
                : activeTab.replace('_', ' ')}
            </h2>
          </div>
        )}

        <div className="flex-grow px-4 pt-0 pb-24 overflow-y-auto flex flex-col items-stretch justify-start">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 px-2">Centro di Controllo</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button onClick={() => setActiveTab('ordini')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative">
                    <ClipboardList className="w-7 h-7" />
                    {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#D32F2F] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#262626]">
                        {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Ordini</span>
                </button>

                <button onClick={() => setActiveTab('products')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center">Menù &<br />Catalogo</span>
                </button>

                <button onClick={() => setActiveTab('business_intelligence')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Statistiche</span>
                </button>

                <button onClick={() => setActiveTab('fidelizzazione')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Clienti</span>
                </button>

                <button onClick={() => setActiveTab('personalizzazione')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center">Suggerimenti<br />Rapidi</span>
                </button>

                <button onClick={() => window.open(`/${restaurantSlug}/cameriere`, '_blank')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center">Modalità<br />Cameriere</span>
                </button>

                <button onClick={() => setActiveTab('settings')} className="bg-[#FBFBFB] dark:bg-[#262626] p-6 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings2 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Impostazioni</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ordini' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordini</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualRefresh}
                    className="text-sm font-bold text-[#008080] bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-[#008080]/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
                    Aggiorna
                  </button>
                </div>
              </div>

              <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-6 shadow-inner w-full">
                <button
                  onClick={() => setOrdiniTab('corrente')}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'corrente' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-premium transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  In Corso
                </button>
                <button
                  onClick={() => setOrdiniTab('storico')}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${ordiniTab === 'storico' ? 'bg-[#FBFBFB] dark:bg-[#262626] text-[#008080] shadow-premium transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  Storico ({storicoOrders.length})
                </button>
              </div>

              {ordiniTab === 'corrente' ? (
                // IN CORSO
                orders.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-4xl block mb-2">🍽️</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nessun ordine in corso al momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map(order => {
                      const isExpanded = expandedOrders.includes(order.id);
                      return (
                        <div key={order.id} className="bg-[#FBFBFB] dark:bg-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                          {/* Accordion Header - Compact View */}
                          <div
                            onClick={(e) => {
                              // Don't expand if clicking the check/close button
                              if ((e.target as HTMLElement).closest('button.close-order-btn')) return;
                              setExpandedOrders(prev =>
                                prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                              );
                            }}
                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-black text-lg text-[#008080]">#{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                  {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex gap-1 mt-0.5">
                                  {order.order_type === 'asporto' ? (
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                      🛍️ {order.customer_name}
                                    </span>
                                  ) : order.table_number && (
                                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                      Tavolo {order.table_number}
                                    </span>
                                  )}
                                  {order.status === 'in_attesa' && <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Nuovo</span>}
                                  {order.status === 'pronto' && <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Pronto</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-[#008080]">€{order.total_price.toFixed(2)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateOrderStatus(order.id, 'pronto'); // Using 'pronto' logic to advance to 'consegnato'
                                }}
                                className="close-order-btn w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 dark:bg-[#1A1A1A] dark:hover:bg-red-900/30 dark:hover:text-red-400 flex items-center justify-center transition-colors"
                                title="Archivia Singolo Ordine"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                              </button>
                            </div>
                          </div>

                          {/* Accordion Body - Expanded View */}
                          <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-2">
                                <div className="space-y-2.5 mb-5 mt-4">
                                  {order.order_items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 items-start">
                                      <span className="font-black text-[#008080] w-6">{item.quantity}x</span>
                                      <div className="flex-grow">
                                        <span className="font-medium">{item.product?.name || 'Prodotto eliminato'}</span>
                                        {item.notes && <p className="text-xs text-red-500 italic mt-0.5">Note: {item.notes}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-auto">
                                  {order.status === 'in_attesa' && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                      className="w-full bg-[#F57C00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs sm:text-sm flex justify-center items-center gap-2"
                                    >
                                      👨‍🍳 Inizia Preparazione
                                    </button>
                                  )}
                                  {order.status === 'in_preparazione' && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                      className="w-full bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs sm:text-sm flex justify-center items-center gap-2"
                                    >
                                      🛎️ Segna come Pronto
                                    </button>
                                  )}
                                  {order.status === 'pronto' && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                      className="w-full bg-[#008080] hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest text-xs sm:text-sm flex justify-center items-center gap-2"
                                    >
                                      ✔️ Consegnato / Chiuso
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                // STORICO
                storicoOrders.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-4xl block mb-2">📜</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nessuno storico disponibile al momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={handleClearStorico}
                        className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-red-200 dark:border-red-900/50"
                      >
                        Svuota Storico
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storicoOrders.map(order => {
                        const isExpanded = expandedOrders.includes(order.id);
                        return (
                          <div key={order.id} className="bg-white dark:bg-[#262626] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col opacity-75 overflow-hidden">
                            {/* Accordion Header - Compact View (Storico) */}
                            <div
                              onClick={() => {
                                setExpandedOrders(prev =>
                                  prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                );
                              }}
                              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-black text-lg text-gray-400">#{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <div className="flex gap-1 mt-0.5">
                                    <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                      {order.order_type === 'asporto' ? `🛍️ ${order.customer_name}` : `Tavolo ${order.table_number}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="font-black text-gray-400">€{order.total_price.toFixed(2)}</span>
                            </div>

                            {/* Accordion Body - Expanded View (Storico) */}
                            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                              <div className="overflow-hidden">
                                <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-2">
                                  <div className="space-y-2.5 mb-2 mt-4">
                                    {order.order_items.map((item, idx) => (
                                      <div key={idx} className="flex gap-2 text-sm text-gray-500 items-start">
                                        <span className="font-black text-gray-400 w-6">{item.quantity}x</span>
                                        <div className="flex-grow">
                                          <span className="font-medium">{item.product?.name || 'Prodotto eliminato'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'products' && productView === 'hub' && (
            <MenuManager
              restaurantId={restaurantId}
              onOpenListino={() => setProductView('listino')}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenPersonalizzazione={() => setActiveTab('personalizzazione')}
            />
          )}

          {activeTab === 'products' && productView === 'listino' && (
            <div className="space-y-6 animate-fade-in">
              {editingProduct ? (
                <div className="bg-white dark:bg-[#262626] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="font-bold text-xl text-[#008080] tracking-wide">{editingProduct.id ? 'MODIFICA PRODOTTO' : 'NUOVO PRODOTTO'}</h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome Prodotto</label>
                      <input type="text" placeholder="es. Margherita" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold focus:ring-[#008080] transition-shadow outline-none" value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrizione</label>
                      <textarea placeholder="Pomodoro, mozzarella, origano..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none min-h-[100px]" value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prezzo (€)</label>
                        <input type="number" placeholder="es. 10" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold text-[#008080] focus:ring-[#008080] transition-shadow outline-none" value={editingProduct.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unità (Opzionale)</label>
                        <input type="text" placeholder="es. /etto, /bottiglia" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 text-sm focus:ring-[#008080] transition-shadow outline-none" value={editingProduct.price_unit || ''} onChange={e => setEditingProduct({ ...editingProduct, price_unit: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                      <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold focus:ring-[#008080] transition-shadow outline-none" value={editingProduct.category_id || ''} onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}>
                        <option value="">Seleziona Categoria</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.section} - {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Immagine (1000x1000px 1:1)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (base64) => setEditingProduct({ ...editingProduct, image_url: base64 }), 1)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 text-sm focus:ring-[#008080] transition-shadow outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#008080] file:text-white hover:file:bg-teal-700"
                        disabled={isUploading}
                      />
                      {isUploading && <p className="text-sm text-[#008080] font-bold mt-2 animate-pulse mb-2">Caricamento e ottimizzazione...</p>}
                      {editingProduct.image_url && !isUploading && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-32 h-32 relative shadow-inner bg-gray-50 dark:bg-[#1A1A1A]">
                          <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={handleSaveProduct} disabled={isUploading} className={`flex-1 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008080] hover:bg-teal-700'}`}>
                      <Save className="w-5 h-5" /> Salva Prodotto
                    </button>
                    <button onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-700 dark:bg-[#1A1A1A] dark:text-gray-300 border border-gray-200 dark:border-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!selectedMacroCategory ? (
                    /* MACRO CATEGORY LIST (LEVEL 1) */
                    <div className="space-y-4 animate-fade-in">
                      {Array.from(new Set(categories.map(c => c.section))).map((macro, idx, arr) => {
                        const macroProductsCount = products.filter(p => categories.find(c => c.id === p.category_id)?.section === macro).length;
                        return (
                          <div key={macro} className="bg-[#FFFFFF] dark:bg-[#262626] p-4 rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
                            <button
                              onClick={() => setSelectedMacroCategory(macro)}
                              className="flex items-center gap-4 flex-1 text-left"
                            >
                              <div className="w-14 h-14 bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">
                                <span className="text-2xl">🍽️</span>
                              </div>
                              <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-lg">{macro}</h3>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">{macroProductsCount} Prodotti</p>
                              </div>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedMacroCategory(macro)}
                                className="w-10 h-10 bg-gray-50 dark:bg-[#1A1A1A] text-gray-400 group-hover:text-[#008080] rounded-full flex items-center justify-center shadow-sm transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* DRILL-DOWN VIEW (LEVEL 2 & 3) */
                    <div className="animate-fade-in">

                      <button onClick={() => setEditingProduct({ image_url: '' })} className="w-full bg-[#008080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008080]/30 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6">
                        <Plus className="w-5 h-5" /> Aggiungi Prodotto in {selectedMacroCategory}
                      </button>

                      <div className="space-y-4">
                        {categories
                          .filter(c => c.section === selectedMacroCategory)
                          .map(cat => {
                            const catProducts = products.filter(p => p.category_id === cat.id);
                            const isExpanded = expandedSubCats[cat.id] !== false; // Default to true

                            return (
                              <div key={cat.id} className="bg-[#FFFFFF] dark:bg-[#262626] rounded-3xl shadow-premium border border-gray-200 dark:border-gray-800 overflow-hidden mb-4 animate-fade-in">
                                <div
                                  className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                                  onClick={() => setExpandedSubCats(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                                >
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-sm">{cat.name}</h3>
                                    <span className="text-xs font-bold bg-[#008080]/10 text-[#008080] py-0.5 px-2 rounded-full">{catProducts.length}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                                    {catProducts.map(product => (
                                      <div key={product.id} className={`flex items-center justify-between p-4 group hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A]/50 transition-colors ${!product.active ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center gap-4 flex-1">
                                          {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-shrink-0 items-center justify-center">
                                              <span className="text-gray-400 text-xs text-center leading-tight">No<br />img</span>
                                            </div>
                                          )}
                                          <div className="pr-4">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{product.name}</h4>
                                            <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest shadow-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 uppercase">
                                              €{product.price.toFixed(2)}{product.price_unit ? ` ${product.price_unit}` : ''}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 relative">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setOpenContextProductId(openContextProductId === product.id ? null : product.id); }}
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-[#333]"
                                          >
                                            <MoreVertical className="w-5 h-5" />
                                          </button>

                                          {/* Context Menu Dropdown */}
                                          {openContextProductId === product.id && (
                                            <>
                                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenContextProductId(null); }} />
                                              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#262626] rounded-2xl shadow-premium border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-fade-in shadow-xl">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setOpenContextProductId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors">
                                                  <Edit2 className="w-4 h-4" /> Modifica
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveProduct(product, 'up'); setOpenContextProductId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors">
                                                  <ArrowUp className="w-4 h-4" /> Sposta Su
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveProduct(product, 'down'); setOpenContextProductId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors">
                                                  <ArrowDown className="w-4 h-4" /> Sposta Giù
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleToggleProductActive(product); setOpenContextProductId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors">
                                                  {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {product.active ? 'Nascondi' : 'Mostra'}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); setOpenContextProductId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 transition-colors">
                                                  <Trash2 className="w-4 h-4" /> Elimina
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {/* DELETE CATEGORY BUTTON (LEVEL 2) */}
                        <div className="mt-8 mb-4">
                          <button
                            onClick={() => {
                              if (window.confirm(`Sei sicuro di voler eliminare l\'intera categoria "${selectedMacroCategory}" e tutti i suoi prodotti? Questa azione è irreversibile.`)) {
                                handleDeleteMacroCategory(selectedMacroCategory);
                              }
                            }}
                            className="w-full bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all border border-red-100 dark:border-red-900/30"
                          >
                            <Trash2 className="w-5 h-5" /> Elimina Reparto "{selectedMacroCategory}"
                          </button>
                          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                            L'eliminazione rimuoverà tutte le sezioni e i prodotti associati.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'menus' && (
            <div className="space-y-6">
              {editingMenu ? (
                <div className="bg-white dark:bg-[#262626] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="font-bold text-xl text-[#008080] tracking-wide">{editingMenu.id ? 'MODIFICA MENÙ' : 'NUOVO MENÙ'}</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Entrée" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.entree || ''} onChange={e => setEditingMenu({ ...editingMenu, entree: e.target.value })} />
                      <input type="text" placeholder="Primo / Piatto Principale" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.primo || ''} onChange={e => setEditingMenu({ ...editingMenu, primo: e.target.value })} />
                      <input type="text" placeholder="Secondo" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.secondo || ''} onChange={e => setEditingMenu({ ...editingMenu, secondo: e.target.value })} />
                      <input type="text" placeholder="Contorno" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.contorno || ''} onChange={e => setEditingMenu({ ...editingMenu, contorno: e.target.value })} />
                      <input type="text" placeholder="Dessert" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.desert || ''} onChange={e => setEditingMenu({ ...editingMenu, desert: e.target.value })} />
                      <input type="text" placeholder="Bevande" className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none" value={editingMenu.bevande || ''} onChange={e => setEditingMenu({ ...editingMenu, bevande: e.target.value })} />
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
                  <button onClick={() => setEditingMenu({ type: '', price: 0, entree: '', primo: '', secondo: '', contorno: '', desert: '', bevande: '' } as MenuCombo)} className="w-full bg-[#008080] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-8 hover:bg-teal-700 transition">
                    <Plus className="w-6 h-6" /> Nuovo Menù del Giorno
                  </button>
                  {menus.map(menu => (
                    <div key={menu.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{menu.type}</h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                              {menu.entree && <p><span className="font-medium text-gray-700 dark:text-gray-300">Entrée:</span> {menu.entree}</p>}
                              {menu.primo && <p><span className="font-medium text-gray-700 dark:text-gray-300">Primo:</span> {menu.primo}</p>}
                              {menu.secondo && <p><span className="font-medium text-gray-700 dark:text-gray-300">Secondo:</span> {menu.secondo}</p>}
                              {menu.contorno && <p><span className="font-medium text-gray-700 dark:text-gray-300">Contorno:</span> {menu.contorno}</p>}
                              {menu.desert && <p><span className="font-medium text-gray-700 dark:text-gray-300">Dessert:</span> {menu.desert}</p>}
                              {menu.bevande && <p><span className="font-medium text-gray-700 dark:text-gray-300">Bevande:</span> {menu.bevande}</p>}
                            </div>
                          </div>
                          <span className="font-bold text-[#008080] border border-[#008080]/20 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-xl ml-4 whitespace-nowrap">€{menu.price.toFixed(2)}</span>
                        </div>
                        <div className="mt-5 flex justify-end items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                          <button onClick={() => setEditingMenu(menu)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" /> Modifica
                          </button>
                          <button
                            onClick={() => handleDeleteMenu(menu.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="pt-4 flex flex-col gap-3 animate-fade-in pb-24 w-full">
              {/* Save Button - Header */}
              <div className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Impostazioni App</h3>
                  <p className="text-xs text-gray-500">Gestisci l'aspetto della tua app.</p>
                </div>
                <button onClick={handleSaveSettings} disabled={isUploading} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all ${isUploading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#008080] text-white hover:bg-teal-700'}`}>
                  <Save className="w-4 h-4" /> Salva
                </button>
              </div>

              {/* 1. Profilo Locale Accordion */}
              <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <button
                  onClick={() => setExpandedSettingSection(expandedSettingSection === 'profilo' ? '' : 'profilo')}
                  className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008080]/10 flex items-center justify-center text-[#008080]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-left">Profilo Locale</h3>
                  </div>
                  {expandedSettingSection === 'profilo' ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>

                <div className={`transition-all duration-300 ease-in-out ${expandedSettingSection === 'profilo' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome del Negozio</label>
                      <input
                        type="text"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="Es. Pizzeria Bella Napoli"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold focus:ring-[#008080] transition-shadow outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frase / Sottotitolo</label>
                      <input
                        type="text"
                        value={settings.restaurant_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, restaurant_subtitle: e.target.value })}
                        placeholder="Es. L'arte della vera pizza"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Sostituisce "Menu Digitale" in homepage se compilato.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Link & Social Accordion */}
                <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedSettingSection(expandedSettingSection === 'social' ? '' : 'social')}
                    className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008080]/10 flex items-center justify-center text-[#008080]">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-left">Link & Social</h3>
                    </div>
                    {expandedSettingSection === 'social' ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${expandedSettingSection === 'social' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📞 Telefono</label>
                        <input
                          type="text"
                          value={settings.phone_number || ''}
                          onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                          placeholder="Es. +39 02 1234567"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📸 Link Instagram</label>
                        <input
                          type="url"
                          value={settings.instagram_url || ''}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                          placeholder="Es. https://instagram.com/tuolocale"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📘 Link Facebook</label>
                        <input
                          type="url"
                          value={settings.facebook_url || ''}
                          onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                          placeholder="Es. https://facebook.com/tuolocale"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🎵 Link TikTok</label>
                        <input
                          type="url"
                          value={settings.tiktok_url || ''}
                          onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                          placeholder="Es. https://tiktok.com/@tuolocale"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📍 Link Google Maps</label>
                        <input
                          type="url"
                          value={settings.google_maps_url || ''}
                          onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
                          placeholder="Es. https://maps.app.goo.gl/..."
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:ring-[#008080] transition-shadow outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Identità Visiva Accordion */}
                <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedSettingSection(expandedSettingSection === 'visiva' ? '' : 'visiva')}
                    className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008080]/10 flex items-center justify-center text-[#008080]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-left">Identità Visiva</h3>
                    </div>
                    {expandedSettingSection === 'visiva' ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${expandedSettingSection === 'visiva' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800 space-y-6' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Logo</h4>
                      <p className="text-xs text-gray-500 mb-4">Immagine circolare mostrata in testata (verrà tagliata 1:1).</p>
                      {/* Hidden file input */}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { e.target.value = ''; openCropper(file, 1, (b64) => setSettings({ ...settings, logo_url: b64 })); }
                        }}
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008080] text-[#008080] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center"
                      >
                        <Upload className="w-4 h-4" /> Importa / Carica Logo
                      </button>
                      {settings.logo_url && (
                        <img src={settings.logo_url} alt="Logo Preview" className="mt-3 h-28 w-28 object-contain rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white shadow-sm mx-auto" />
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Sfondo Intestazione (Cover)</h4>
                      <p className="text-xs text-gray-500 mb-4">Immagine panoramica 16:9 dietro al logo.</p>
                      {/* Hidden file input */}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { e.target.value = ''; openCropper(file, 16 / 9, (b64) => setSettings({ ...settings, cover_image_url: b64 })); }
                        }}
                      />
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#008080] text-[#008080] font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all w-full justify-center"
                      >
                        <Camera className="w-4 h-4" /> Carica Foto di Copertina
                      </button>
                      {settings.cover_image_url && (
                        <img src={settings.cover_image_url} alt="Cover Preview" className="mt-3 w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 bg-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Codice QR del Menù Accordion */}
                {restaurantSlug && (
                  <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <button
                      onClick={() => setExpandedSettingSection(expandedSettingSection === 'qr' ? '' : 'qr')}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-[#008080]/10 flex items-center justify-center text-[#008080]">
                          <Search className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-left">Codice QR del Menù</h3>
                      </div>
                      {expandedSettingSection === 'qr' ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${expandedSettingSection === 'qr' ? 'max-h-[1000px] opacity-100 p-5 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
                      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm mx-auto">
                        Inquadra e ordina: stampa questo QR code per permettere ai tuoi clienti di visualizzare il menù dal loro smartphone.
                      </p>
                      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                          <QRCodeSVG
                            id={`qr-${restaurantSlug}`}
                            value={`https://leomenu.it/${restaurantSlug}`}
                            size={180}
                            level={"H"}
                            includeMargin={false}
                            fgColor="#000000"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const svg = document.getElementById(`qr-${restaurantSlug}`);
                            if (!svg) return;
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;

                            const svgData = new XMLSerializer().serializeToString(svg);
                            const img = new Image();
                            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                            const url = URL.createObjectURL(svgBlob);

                            img.onload = () => {
                              // Create a high-res canvas with padding
                              const padding = 40;
                              canvas.width = img.width + (padding * 2);
                              canvas.height = img.height + (padding * 2);

                              // Fill white background
                              ctx.fillStyle = "#FFFFFF";
                              ctx.fillRect(0, 0, canvas.width, canvas.height);

                              // Draw QR code with padding
                              ctx.drawImage(img, padding, padding, img.width, img.height);

                              // Add title/brand
                              ctx.fillStyle = "#000000";
                              ctx.font = "bold 24px sans-serif";
                              ctx.textAlign = "center";
                              ctx.fillText("INQUADRA E ORDINA", canvas.width / 2, padding / 1.5);

                              URL.revokeObjectURL(url);

                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = `Menù_QR_${restaurantSlug}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                            };
                            img.src = url;
                          }}
                          className="mt-6 border-2 border-[#008080] bg-[#008080]/10 text-[#008080] hover:bg-[#008080] hover:text-white transition-all duration-300 py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 w-full justify-center"
                        >
                          Scarica in Alta Risoluzione
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === 'business_intelligence' && restaurantId && (
            <BusinessIntelligence restaurantId={restaurantId} />
          )}

          {activeTab === 'fidelizzazione' && restaurantId && (
            <Fidelizzazione restaurantId={restaurantId} />
          )}

          {activeTab === 'personalizzazione' && restaurantId && (
            <Personalizzazione restaurantId={restaurantId} />
          )}
        </div>
      </div>

      {/* Global Cropper Modal */}
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
