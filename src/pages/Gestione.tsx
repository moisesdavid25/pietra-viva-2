import React, { useEffect, useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { ArrowLeft, Plus, Save, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Cropper from 'react-easy-crop';
import db from '../db';
import BottomNav from '../components/BottomNav';

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
  const [activeTab, setActiveTab] = useState<'ordini' | 'products' | 'menus' | 'settings'>('ordini');
  const [ordiniTab, setOrdiniTab] = useState<'corrente' | 'storico'>('corrente');

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

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropCallback, setCropCallback] = useState<((base64: string) => void) | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<number | undefined>(1);

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
      db.from('categories').select('*').eq('restaurant_id', restaurantId).order('id'),
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
    if (cats) setCategories(cats);
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

    const { data: prods } = await db.from('products').select('*').eq('restaurant_id', restaurantId).order('sort_order', { ascending: true }).order('id');
    if (prods) setProducts(prods);
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
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category_id) return;

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

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | 'all'>('all');

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    await db.from('products').delete().eq('id', id);
    fetchData();
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
    alert('Impostazioni salvate con successo');
    fetchData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, aspect?: number) => {
    let file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const options = {
          maxSizeMB: 0.2, // max 200KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.8,
        };
        file = await imageCompression(file, options);
      } catch (error) {
        console.error("Compression error:", error);
      }

      if (aspect === undefined) {
        // Direct upload without cropping (e.g., Logo)
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              callback(canvas.toDataURL('image/webp', 0.6));
            } else {
              callback(event.target?.result as string);
            }
            setIsUploading(false);
          };
          img.onerror = () => {
            setIsUploading(false);
            callback(event.target?.result as string);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Open Cropper
        const reader = new FileReader();
        reader.onload = () => {
          setCropImageSrc(reader.result as string);
          setCropCallback(() => callback);
          setCropAspectRatio(aspect);
          e.target.value = ''; // Reset
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !cropCallback) return;
    setIsUploading(true);

    const image = new Image();
    await new Promise(resolve => {
      image.onload = resolve;
      image.onerror = resolve; // Ensure we don't hang on error either
      image.src = cropImageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, x, y } = croppedAreaPixels;

    const MAX_WIDTH = 800;
    let targetWidth = width;
    let targetHeight = height;

    if (targetWidth > MAX_WIDTH) {
      targetHeight = Math.round((targetHeight * MAX_WIDTH) / targetWidth);
      targetWidth = MAX_WIDTH;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      x,
      y,
      width,
      height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const webpDataUrl = canvas.toDataURL('image/webp', 0.5);
    cropCallback(webpDataUrl);

    setCropImageSrc(null);
    setCropCallback(null);
    setIsUploading(false);
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
      <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] font-sans min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-[#FDFCF0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#008080]" />
        </button>
        <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">Gestione</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-red-500 uppercase px-2 hover:bg-red-50 dark:hover:bg-red-900/20 py-1 rounded transition-colors">
          Esci
        </button>
      </header>

      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <button
          className={`px-4 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-2 ${activeTab === 'ordini' ? 'text-[#008080] border-b-2 border-[#008080]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ordini')}
        >
          Ordini
          {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length > 0 && (
            <span className="bg-[#D32F2F] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none">
              {orders.filter(o => o.status === 'in_attesa' || o.status === 'in_preparazione').length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'products' ? 'text-[#008080] border-b-2 border-[#008080]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('products')}
        >
          Prodotti
        </button>
        <button
          className={`px-4 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'menus' ? 'text-[#008080] border-b-2 border-[#008080]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('menus')}
        >
          Menu del Giorno
        </button>
        <button
          className={`px-4 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'settings' ? 'text-[#008080] border-b-2 border-[#008080]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          Impostazioni
        </button>
      </div>

      <main className="flex-grow px-4 py-6 pb-24 overflow-y-auto">
        {activeTab === 'ordini' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordini</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/${restaurantSlug}`, '_blank')}
                  className="text-sm font-bold text-[#008080] bg-[#008080]/10 hover:bg-[#008080]/20 dark:bg-[#008080]/20 dark:hover:bg-[#008080]/30 px-4 py-1.5 rounded-lg border border-[#008080]/30 transition-all flex items-center gap-2"
                  title="Aggiungi manualmente un nuovo ordine da tavolo o asporto"
                >
                  <Plus className="w-4 h-4" /> Nuovo Ordine
                </button>
                <button
                  onClick={handleManualRefresh}
                  className="text-sm font-bold text-[#008080] bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg border border-[#008080]/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
                  Aggiorna
                </button>
              </div>
            </div>

            <div className="flex bg-gray-100 dark:bg-[#252525] p-1 rounded-xl mb-6">
              <button
                onClick={() => setOrdiniTab('corrente')}
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${ordiniTab === 'corrente' ? 'bg-white dark:bg-[#1A1A1A] text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                In Corso
              </button>
              <button
                onClick={() => setOrdiniTab('storico')}
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${ordiniTab === 'storico' ? 'bg-white dark:bg-[#1A1A1A] text-[#008080] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
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
                  {orders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                      <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xl text-[#008080]">#{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                            {order.order_type === 'asporto' ? (
                              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                🛍️ Asporto: {order.customer_name}
                              </span>
                            ) : (
                              order.table_number && (
                                <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold px-2 py-1 rounded">
                                  Tavolo {order.table_number}
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="font-bold text-[#008080] text-lg">€{order.total_price.toFixed(2)}</span>
                      </div>

                      <div className="flex-grow space-y-2 mb-6">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 items-start">
                            <span className="font-bold w-6">{item.quantity}x</span>
                            <div className="flex-grow">
                              <span>{item.product?.name || 'Prodotto eliminato'}</span>
                              {item.notes && <p className="text-xs text-red-500 italic mt-0.5">Note: {item.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto">
                        {order.status === 'in_attesa' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                            className="w-full bg-[#F57C00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-wider text-sm flex justify-center items-center gap-2"
                          >
                            👨‍🍳 Inizia Preparazione
                          </button>
                        )}
                        {order.status === 'in_preparazione' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                            className="w-full bg-[#4CAF50] hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-wider text-sm flex justify-center items-center gap-2"
                          >
                            🛎️ Segna come Pronto
                          </button>
                        )}
                        {order.status === 'pronto' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                            className="w-full bg-[#212121] hover:bg-black text-white font-bold py-3 rounded-xl shadow-md transition-colors uppercase tracking-wider text-sm flex justify-center items-center gap-2"
                          >
                            ✔️ Consegnato / Chiuso
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                    {storicoOrders.map(order => (
                      <div key={order.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col opacity-75">
                        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xl text-gray-400">#{order.daily_order_number || order.id.split('-')[0].toUpperCase()}</span>
                              <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded">
                                {order.order_type === 'asporto' ? `Asporto: ${order.customer_name}` : `Tavolo ${order.table_number}`}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className="font-bold text-gray-400 text-lg">€{order.total_price.toFixed(2)}</span>
                        </div>
                        <div className="flex-grow space-y-2">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 text-sm text-gray-500 items-start">
                              <span className="font-bold w-6">{item.quantity}x</span>
                              <div className="flex-grow">
                                <span>{item.product?.name || 'Prodotto eliminato'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
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
                <div className="flex flex-col gap-3">
                  <select
                    className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 font-bold text-[#008080] focus:outline-none focus:border-[#008080] transition-colors"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : e.target.value)}
                  >
                    <option value="all">Tutte le categorie</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.section} - {c.name}</option>
                    ))}
                  </select>

                  <button onClick={() => setEditingProduct({ image_url: '' })} className="w-full bg-[#008080] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                    <Plus className="w-5 h-5" /> Aggiungi Prodotto
                  </button>
                </div>

                <div className="space-y-3 mt-6">
                  {products
                    .filter(p => selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter)
                    .map(product => (
                      <div key={product.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-start">
                              {product.image_url && (
                                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover border border-gray-100 dark:border-gray-700 shadow-sm" />
                              )}
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 tracking-wide text-lg">{product.name}</h3>
                                {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{product.description}</p>}
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                  {categories.find(c => c.id === product.category_id)?.section || 'Categoria Eliminata'}
                                </div>
                              </div>
                            </div>
                            <span className="font-bold text-[#008080] border border-[#008080]/20 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-xl ml-4 whitespace-nowrap">€{product.price}{product.price_unit ? ` ${product.price_unit}` : ''}</span>
                          </div>

                          <div className="mt-5 flex justify-end items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                            <div className="flex gap-1 mr-auto">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveProduct(product, 'up'); }}
                                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveProduct(product, 'up'); }}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors" title="Sposta Su"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveProduct(product, 'down'); }}
                                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveProduct(product, 'down'); }}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors" title="Sposta Giu"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProduct(product); }}
                              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProduct(product); }}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors" title="Modifica"
                            >
                              <Edit2 className="w-4 h-4" /> Modifica
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product.id); }}
                              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product.id); }}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" /> Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
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
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-[#008080]">Dati del Locale</h3>

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

            <div className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-[#008080]">Logo (Max 1000px, aspect ratio libero)</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Immagine</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, (base64) => setSettings({ ...settings, logo_url: base64 }))}
                  className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm"
                  disabled={isUploading}
                />
                {isUploading && <p className="text-sm text-[#008080] font-bold mt-2 animate-pulse mb-2">Caricamento in corso...</p>}
                {settings.logo_url && !isUploading && (
                  <img src={settings.logo_url} alt="Logo Preview" className="mt-2 h-32 w-auto object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white" />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-[#008080]">Immagini Home (1200x675px 16:9)</h3>

              <div className="space-y-4">
                {Array.from(new Set(categories.map(c => c.section))).map((section: string) => {
                  const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '');
                  const sectionKey = `home_image_${sectionSlug}`;
                  const visibilityKey = `visibility_${sectionSlug}`;
                  const isVisible = settings[visibilityKey] !== 'false';

                  return (
                    <div key={sectionKey} className="bg-gray-50 dark:bg-[#1f1f1f] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{section}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{isVisible ? 'Visibile' : 'Nascosto'}</span>
                          <button
                            onClick={() => setSettings({ ...settings, [visibilityKey]: isVisible ? 'false' : 'true' })}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${isVisible ? 'bg-[#008080]' : 'bg-gray-300 dark:bg-gray-600'}`}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isVisible ? 'transform translate-x-6' : ''}`} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (base64) => setSettings({ ...settings, [sectionKey]: base64 }), 16 / 9)}
                        className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm"
                        disabled={isUploading}
                      />
                      {isUploading && <p className="text-sm text-[#008080] font-bold mt-2 animate-pulse mb-2">Caricamento in corso...</p>}
                      {!isUploading && (
                        <img src={settings[sectionKey] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  );
                })}

                <div className="bg-gray-50 dark:bg-[#1f1f1f] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Menu del Giorno</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{settings.visibility_menu !== 'false' ? 'Visibile' : 'Nascosto'}</span>
                      <button
                        onClick={() => setSettings({ ...settings, visibility_menu: settings.visibility_menu !== 'false' ? 'false' : 'true' })}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${settings.visibility_menu !== 'false' ? 'bg-[#008080]' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.visibility_menu !== 'false' ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({ ...settings, home_image_menu: base64 }), 16 / 9)}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm"
                    disabled={isUploading}
                  />
                  {isUploading && <p className="text-sm text-[#008080] font-bold mt-2 animate-pulse mb-2">Caricamento...</p>}
                  {!isUploading && (
                    <img src={settings.home_image_menu || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop'} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleSaveSettings} disabled={isUploading} className={`w-full text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#008080]'}`}>
                  <Save className="w-5 h-5" /> Salva Impostazioni
                </button>
              </div>
            </div>

            {restaurantSlug && (
              <div className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                <h3 className="font-bold text-lg text-[#008080]">Codice QR del Menù</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scarica il codice QR da stampare per i tuoi tavoli. I clienti lo inquadreranno per accedere al tuo menù digitale.
                </p>
                <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A1A1A] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG
                      id={`qr-${restaurantSlug}`}
                      value={`https://leomenu.it/${restaurantSlug}`}
                      size={200}
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
                    className="mt-6 border-2 border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white transition-colors duration-300 py-2 px-6 rounded-full font-bold flex items-center gap-2"
                  >
                    Scarica in JPG/PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav restaurantSlug={restaurantSlug} />

      {cropImageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[60vh] bg-black rounded-2xl overflow-hidden mb-6">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropAspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={() => setCropImageSrc(null)} className="flex-1 py-3 text-white font-bold bg-gray-800 rounded-xl hover:bg-gray-700 transition">Annulla</button>
            <button onClick={confirmCrop} className="flex-1 py-3 text-white font-bold bg-[#008080] rounded-xl hover:bg-teal-700 transition">Conferma Ritaglio</button>
          </div>
        </div>
      )}
    </div>
  );
}
