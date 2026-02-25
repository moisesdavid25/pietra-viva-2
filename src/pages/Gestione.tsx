import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Category {
  id: number;
  section: string;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  image_url: string;
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

export default function Gestione() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'menus' | 'settings'>('products');
  
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<MenuCombo[]>([]);
  const [settings, setSettings] = useState<any>({});

  // Form states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuCombo | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@pietraviva.it' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Credenziali non valide');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    const [catsRes, menusRes, settingsRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/menus'),
      fetch('/api/settings')
    ]);
    const cats = await catsRes.json();
    setCategories(cats);
    setMenus(await menusRes.json());
    setSettings(await settingsRes.json());
    
    // Fetch all products (we can fetch them by section or all at once)
    // For simplicity in this demo, we'll fetch them section by section and combine
    const sections = ['Cucina', 'Pizza', 'Vino e Drinks'];
    let allProducts: Product[] = [];
    for (const section of sections) {
      const res = await fetch(`/api/menu/${section}`);
      const data = await res.json();
      data.forEach((cat: any) => {
        allProducts = [...allProducts, ...cat.products];
      });
    }
    setProducts(allProducts);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category_id) return;

    const isNew = !editingProduct.id;
    const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
    const method = isNew ? 'POST' : 'PUT';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct)
    });

    setEditingProduct(null);
    fetchData();
  };

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleSaveMenu = async () => {
    if (!editingMenu) return;
    await fetch(`/api/menus/${editingMenu.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingMenu)
    });
    setEditingMenu(null);
    fetchData();
  };

  const handleSaveSettings = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Impostazioni salvate con successo');
    fetchData();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    if (editingProduct || editingMenu) {
      setEditingProduct(null);
      setEditingMenu(null);
    } else {
      navigate('/');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
        <header className="sticky top-0 z-50 bg-[#FDFCF0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#008080]" />
          </button>
          <h1 className="font-serif text-xl font-bold tracking-widest uppercase text-center flex-grow">Login Gestione</h1>
          <div className="w-10"></div>
        </header>
        <main className="flex-grow px-6 py-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-[#262626] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-serif font-bold text-center mb-6 text-[#008080]">Accesso Admin</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080] transition-colors"
                  placeholder="admin@pietraviva.it"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 focus:outline-none focus:border-[#008080] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="w-full bg-[#008080] text-white py-3 rounded-xl font-bold mt-6 shadow-lg hover:bg-teal-700 transition-colors">
                Accedi
              </button>
            </form>
          </div>
        </main>
        <BottomNav />
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
        <div className="w-10"></div>
      </header>

      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
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
        {activeTab === 'products' && (
          <div className="space-y-6">
            {editingProduct ? (
              <div className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800 space-y-4">
                <h3 className="font-bold text-lg">{editingProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                
                <input type="text" placeholder="Nome" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <textarea placeholder="Descrizione" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                
                <div className="flex gap-4">
                  <input type="number" placeholder="Prezzo" className="w-1/2 p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                  <input type="text" placeholder="Unità (es. /etto)" className="w-1/2 p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700" value={editingProduct.price_unit || ''} onChange={e => setEditingProduct({...editingProduct, price_unit: e.target.value})} />
                </div>

                <select className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700" value={editingProduct.category_id || ''} onChange={e => setEditingProduct({...editingProduct, category_id: parseInt(e.target.value)})}>
                  <option value="">Seleziona Categoria</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.section} - {c.name}</option>
                  ))}
                </select>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Immagine (1000x1000px 1:1)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setEditingProduct({...editingProduct, image_url: base64}))}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm" 
                  />
                  {editingProduct.image_url && (
                    <img src={editingProduct.image_url} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveProduct} className="flex-1 bg-[#008080] text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Salva
                  </button>
                  <button onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded font-bold">
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
                    onChange={(e) => setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
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
                    <div key={product.id} className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.price}€ {product.price_unit}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingProduct(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product.id); }} 
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product.id); }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <div className="bg-white dark:bg-[#262626] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800 space-y-4">
                <h3 className="font-bold text-lg text-[#008080]">Modifica Menu {editingMenu.type}</h3>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Prezzo (€)</label>
                  <input type="number" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.price} onChange={e => setEditingMenu({...editingMenu, price: parseFloat(e.target.value)})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Entrée</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.entree || ''} onChange={e => setEditingMenu({...editingMenu, entree: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Primo / Piatto Principale</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.primo || ''} onChange={e => setEditingMenu({...editingMenu, primo: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Secondo</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.secondo || ''} onChange={e => setEditingMenu({...editingMenu, secondo: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Contorno</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.contorno || ''} onChange={e => setEditingMenu({...editingMenu, contorno: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Desert</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.desert || ''} onChange={e => setEditingMenu({...editingMenu, desert: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Bevande</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 mt-1" value={editingMenu.bevande || ''} onChange={e => setEditingMenu({...editingMenu, bevande: e.target.value})} />
                </div>

                <div className="flex gap-2 pt-4">
                  <button onClick={handleSaveMenu} className="flex-1 bg-[#008080] text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Salva
                  </button>
                  <button onClick={() => setEditingMenu(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded font-bold">
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {menus.map(menu => (
                  <div key={menu.id} className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg text-[#008080]">Menu {menu.type}</h4>
                      <button onClick={() => setEditingMenu(menu)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {menu.entree && <p><span className="font-semibold">Entrée:</span> {menu.entree}</p>}
                      {menu.primo && <p><span className="font-semibold">Primo:</span> {menu.primo}</p>}
                      {menu.secondo && <p><span className="font-semibold">Secondo:</span> {menu.secondo}</p>}
                      {menu.contorno && <p><span className="font-semibold">Contorno:</span> {menu.contorno}</p>}
                      {menu.desert && <p><span className="font-semibold">Desert:</span> {menu.desert}</p>}
                      {menu.bevande && <p><span className="font-semibold">Bevande:</span> {menu.bevande}</p>}
                      <p className="font-bold text-[#008080] mt-2 text-lg">€{menu.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#262626] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
              <h3 className="font-bold text-lg text-[#008080]">Immagini Home (1200x675px 16:9)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cucina</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({...settings, home_image_cucina: base64}))}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm" 
                  />
                  {settings.home_image_cucina && (
                    <img src={settings.home_image_cucina} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pizza</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({...settings, home_image_pizza: base64}))}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm" 
                  />
                  {settings.home_image_pizza && (
                    <img src={settings.home_image_pizza} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vino e Drinks</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({...settings, home_image_vino: base64}))}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm" 
                  />
                  {settings.home_image_vino && (
                    <img src={settings.home_image_vino} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Menu del Giorno</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setSettings({...settings, home_image_menu: base64}))}
                    className="w-full p-2 border rounded dark:bg-[#1A1A1A] dark:border-gray-700 text-sm" 
                  />
                  {settings.home_image_menu && (
                    <img src={settings.home_image_menu} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleSaveSettings} className="w-full bg-[#008080] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                  <Save className="w-5 h-5" /> Salva Impostazioni
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
