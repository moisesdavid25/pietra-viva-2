import { ArrowLeft, ShoppingBag, Plus, Minus, ShieldAlert } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { ALLERGENS } from '../components/gestione/AllergensManager';
import db from '../db';

interface ProductExtra {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  image_url: string;
  allergens?: string[];
}

export default function ProductDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateProduct: Product | undefined = location.state?.product;
  const stateExtras: ProductExtra[] = location.state?.extras || [];

  const [product, setProduct] = useState<Product | null>(stateProduct || null);
  const [extras, setExtras] = useState<ProductExtra[]>(stateExtras);
  const [loading, setLoading] = useState(!stateProduct);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart, totalItems } = useCart(slug || null);

  useEffect(() => {
    if (stateProduct || !id) return;
    async function load() {
      const { data } = await db
        .from('products')
        .select('id,name,description,price,price_unit,image_url,allergens,category_id')
        .eq('id', id).single();
      if (data) setProduct(data);
      if (slug) {
        const { data: resData } = await db.from('restaurants').select('id').eq('slug', slug).single();
        if (resData) {
          const { data: extrasData } = await db.from('product_extras')
            .select('id,name,category,price,available')
            .eq('restaurant_id', resData.id).eq('available', true);
          if (extrasData) setExtras(extrasData);
        }
      }
      setLoading(false);
    }
    load();
  }, [id, slug, stateProduct]);

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id) ? prev.filter(e => e.id !== extra.id) : [...prev, extra]
    );
  };

  const extraPriceSum = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const totalPrice = (product ? product.price + extraPriceSum : 0) * quantity;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id, name: product.name,
      price: product.price + extraPriceSum,
      price_unit: product.price_unit, image_url: product.image_url,
      customizations: { removed: [], added: selectedExtras.map(e => ({ name: e.name, price: e.price })) },
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // ── Shared header ───────────────────────────────────────────────────────
  const Header = () => (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-[#008081]" />
        </button>
        <h1 className="font-black text-sm tracking-widest uppercase text-center flex-grow truncate text-[#1A1A1A] dark:text-white">
          {product?.name || ''}
        </h1>
        <button onClick={() => navigate(`/${slug}/ordini`)} className="relative p-2 rounded-full hover:bg-[#008081]/10 transition-colors text-[#008081] flex-shrink-0">
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#008081] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading || !product) {
    return (
      <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F] min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#008081] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F8F8] dark:bg-[#0F0F0F] font-sans min-h-screen flex flex-col antialiased">
      <Header />

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-grow pb-28">
        <div className="max-w-5xl mx-auto">

          {/* ── Desktop: 2-col | Mobile: stacked ── */}
          <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-10 lg:px-8 lg:pt-8">

            {/* ── LEFT: Image ── */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="mx-4 mt-5 lg:mx-0 lg:mt-0 rounded-3xl overflow-hidden bg-white dark:bg-[#1A1A1A] shadow-md border border-gray-100 dark:border-white/5 aspect-[4/3]">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* ── RIGHT: Details ── */}
            <div className="px-4 lg:px-0 pt-5 lg:pt-0 space-y-3">

              {/* Name + Price */}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 shadow-sm">
                <h2 className="text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tight leading-tight">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed mt-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Prezzo</span>
                  <span className="text-2xl font-black text-[#008081]">
                    €{product.price.toFixed(2)}{product.price_unit || ''}
                  </span>
                </div>
              </div>

              {/* Allergens */}
              {product.allergens && product.allergens.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/15 rounded-3xl px-6 py-5 border border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                      Allergeni presenti
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ALLERGENS.filter(a => product.allergens!.includes(a.id)).map(a => (
                      <span key={a.id} className="flex items-center gap-1 bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
                        {a.emoji} {a.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-500 mt-1">
                    In caso di allergie gravi, informa sempre il nostro personale.
                  </p>
                </div>
              )}

              {/* Extras */}
              {extras.length > 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Aggiuntivi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extras.map(extra => {
                      const selected = selectedExtras.some(e => e.id === extra.id);
                      return (
                        <button
                          key={extra.id}
                          onClick={() => toggleExtra(extra)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            selected
                              ? 'bg-[#008081] text-white border-transparent shadow-md'
                              : 'bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#008081]'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}{extra.name}
                          {extra.price > 0 && (
                            <span className={`ml-1.5 font-black text-xs ${selected ? 'text-white/70' : 'text-[#008081]'}`}>
                              +€{extra.price.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantità</p>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-[#008081] hover:text-[#008081] active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-black w-8 text-center text-[#1A1A1A] dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-[#008081] hover:text-[#008081] active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CTA inline on desktop */}
              <div className="hidden lg:block pb-8">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 font-black text-white text-base rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 active:scale-[0.98] ${
                    added ? 'bg-green-500' : 'bg-[#008081] hover:bg-[#006666]'
                  }`}
                >
                  <span>{added ? '✓ Aggiunto al carrello!' : 'Aggiungi al carrello'}</span>
                  <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-black">
                    €{totalPrice.toFixed(2)}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky CTA (mobile only) ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 px-4 py-4">
        <button
          onClick={handleAddToCart}
          className={`w-full py-4 font-black text-white text-base rounded-2xl transition-all shadow-lg flex items-center justify-between px-6 active:scale-[0.98] ${
            added ? 'bg-green-500' : 'bg-[#008081] hover:bg-[#006666]'
          }`}
        >
          <span>{added ? '✓ Aggiunto!' : 'Aggiungi al carrello'}</span>
          <span className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-black">
            €{totalPrice.toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
