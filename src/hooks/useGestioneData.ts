import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import db from '../db';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  section: string;
  name: string;
  position?: number;
}

export interface Product {
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

export interface MenuCombo {
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
  product: { name: string };
  quantity: number;
  notes: string | null;
  price_at_time: number;
}

export interface Order {
  id: string;
  table_number: string | null;
  status: 'in_attesa' | 'in_preparazione' | 'pronto' | 'consegnato';
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
  customer_name?: string;
  order_type?: string;
  daily_order_number?: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseGestioneDataReturn {
  categories: Category[];
  products: Product[];
  menus: MenuCombo[];
  settings: Record<string, any>;
  orders: Order[];
  storicoOrders: Order[];
  isRefreshing: boolean;
  fetchData: () => Promise<void>;
  handleManualRefresh: () => Promise<void>;
}

export function useGestioneData(
  restaurantId: string | null,
  isAuthenticated: boolean
): UseGestioneDataReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Utilize React Query to heavily cache database reads.
  // We use a single unified query to bundle all dashboard data.
  const { data, refetch } = useQuery({
    queryKey: ['gestioneDashboard', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;

      const [
        { data: cats },
        { data: menusRes },
        { data: settingsRes },
        { data: activeOrdersRes },
        { data: storicoOrdersRes },
        { data: prods },
      ] = await Promise.all([
        db.from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('position', { ascending: true })
          .order('id'),
        db.from('menus')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('id'),
        db.from('settings')
          .select('*')
          .eq('restaurant_id', restaurantId),
        db.from('orders').select(`
          id, table_number, status, total_price, created_at,
          customer_name, order_type, daily_order_number,
          order_items ( id, quantity, notes, price_at_time, product:products(name) )
        `).eq('restaurant_id', restaurantId)
          .neq('status', 'consegnato')
          .order('created_at', { ascending: true }),
        db.from('orders').select(`
          id, table_number, status, total_price, created_at,
          customer_name, order_type, daily_order_number,
          order_items ( id, quantity, notes, price_at_time, product:products(name) )
        `).eq('restaurant_id', restaurantId)
          .eq('status', 'consegnato')
          .order('created_at', { ascending: false })
          .limit(100),
        db.from('products')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('sort_order', { ascending: true })
          .order('id'),
      ]);

      // Categories parsing
      let finalCategories: Category[] = [];
      if (cats) {
        finalCategories = [...cats].sort((a, b) => (a.position || 0) - (b.position || 0));
      }

      // Inter-woven sorting logic for products based on category index
      let finalProducts: Product[] = [];
      if (cats && prods) {
        const categoryOrderMap = new Map<string, number>();
        finalCategories.forEach((cat, i) => categoryOrderMap.set(cat.id, i));

        const prodsWithIndex = prods.map(p => ({
          ...p,
          _catIndex: categoryOrderMap.has(p.category_id)
            ? categoryOrderMap.get(p.category_id)!
            : 999,
        }));
        prodsWithIndex.sort((a, b) =>
          a._catIndex !== b._catIndex
            ? a._catIndex - b._catIndex
            : (a.sort_order || 0) - (b.sort_order || 0)
        );
        finalProducts = prodsWithIndex.map(({ _catIndex, ...rest }) => rest);
      }

      // Settings Map
      let finalSettings: Record<string, any> = {};
      if (settingsRes) {
        finalSettings = settingsRes.reduce((acc: Record<string, any>, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
      }

      return {
        categories: finalCategories,
        products: finalProducts,
        menus: menusRes || [],
        settings: finalSettings,
        orders: (activeOrdersRes || []) as unknown as Order[],
        storicoOrders: (storicoOrdersRes || []) as unknown as Order[]
      };
    },
    // Only kick off the query when authentication and ID are valid
    enabled: isAuthenticated && Boolean(restaurantId),
  });

  const fetchData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return {
    categories: data?.categories || [],
    products: data?.products || [],
    menus: data?.menus || [],
    settings: data?.settings || {},
    orders: data?.orders || [],
    storicoOrders: data?.storicoOrders || [],
    isRefreshing,
    fetchData,
    handleManualRefresh,
  };
}
