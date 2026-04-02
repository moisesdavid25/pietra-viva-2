import { useState, useEffect } from 'react';
import db from '../db';

export function usePassportSearch() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!globalSearch.trim()) {
        setGlobalSearchResults([]);
        return;
      }
      setIsSearchingGlobal(true);
      try {
        const { data: restaurantsData } = await db.from('restaurants')
            .select('id, name, slug')
            .ilike('name', `%${globalSearch}%`)
            .neq('slug', 'demo')
            .limit(5);

        if (restaurantsData && restaurantsData.length > 0) {
            const restaurantIds = restaurantsData.map(r => r.id);
            const { data: settingsData } = await db.from('settings')
                .select('restaurant_id, value')
                .in('restaurant_id', restaurantIds)
                .eq('key', 'logo_url');

            const extractColor = (src: string): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            try {
                                const data = ctx.getImageData(0, 0, 1, 1).data;
                                if (data[3] === 0) resolve('white');
                                else resolve(`rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`);
                            } catch (e) { resolve('white'); }
                        } else { resolve('white'); }
                    };
                    img.onerror = () => resolve('white');
                    img.src = src;
                });
            };

            const formattedData = await Promise.all(restaurantsData.map(async (restaurant) => {
                let logo = '';
                if (restaurant.slug === 'pietra-viva') logo = '';
                else if (settingsData) {
                    const setting = settingsData.find(s => s.restaurant_id === restaurant.id);
                    if (setting) logo = setting.value;
                }
                let bgColor = 'white';
                if (logo) bgColor = await extractColor(logo);
                return { ...restaurant, logo_url: logo, bgColor };
            }));
            
            setGlobalSearchResults(formattedData);
        } else {
            setGlobalSearchResults([]);
        }
      } catch(err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    const timeoutId = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(timeoutId);
  }, [globalSearch]);

  return {
    globalSearch,
    setGlobalSearch,
    globalSearchResults,
    isSearchingGlobal
  };
}
