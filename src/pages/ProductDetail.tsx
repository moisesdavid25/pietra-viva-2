import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  price_unit: string | null;
  image_url: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProduct(data);
        }
      });
  }, [id]);

  if (!product) {
    return (
      <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCF0] dark:bg-[#1A1A1A] text-gray-900 dark:text-[#FDFCF0] font-sans min-h-screen flex flex-col antialiased">
      <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </header>

      <main className="flex-grow pb-24">
        <div className="relative h-[50vh] w-full">
          <img alt={product.name} className="w-full h-full object-cover" src={product.image_url} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF0] dark:from-[#1A1A1A] via-transparent to-black/30"></div>
        </div>
        
        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-white dark:bg-[#262626] rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white leading-tight pr-4">{product.name}</h1>
              <span className="text-2xl font-bold text-[#008080] whitespace-nowrap">{product.price.toFixed(2)}€{product.price_unit || ''}</span>
            </div>
            
            <div className="w-12 h-1 bg-[#008080] rounded-full mb-6"></div>
            
            {product.description ? (
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {product.description}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">Nessuna descrizione disponibile.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
