import { useState, useEffect } from 'react';
import db from '../db';

export interface Reward {
    id: string;
    restaurant_id: string;
    name: string;
    points_required: number;
    description: string;
    image_url: string;
}

export interface RestaurantCard {
    id: string;
    slug: string;
    name: string;
    indirizzo: string;
    citta: string;
    logo_url: string;
    points: number;
    rewards: Reward[];
}

export function usePassportData(userId: string | undefined) {
    const [myRestaurants, setMyRestaurants] = useState<RestaurantCard[]>([]);
    const [tierBenefitsMap, setTierBenefitsMap] = useState<Record<string, { green: string[]; gold: string[]; reserve: string[] }>>({});
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsDataLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsDataLoading(true);
            try {
                const { data: customersData, error: custError } = await db
                    .from('customers')
                    .select(`
                        total_points,
                        restaurant_id,
                        restaurants (
                            id,
                            slug,
                            name,
                            indirizzo,
                            citta
                        )
                    `)
                    .eq('auth_user_id', userId);

                if (custError) throw custError;

                if (customersData && customersData.length > 0) {
                    const restIds = customersData.map(c => c.restaurant_id).filter(Boolean) as string[];
                    const { data: settingsData } = await db
                        .from('settings')
                        .select('restaurant_id, key, value')
                        .in('restaurant_id', restIds)
                        .in('key', ['logo_url', 'tier_benefits_green', 'tier_benefits_gold', 'tier_benefits_reserve']);

                    // Build tier benefits map per restaurant
                    const bMap: Record<string, { green: string[]; gold: string[]; reserve: string[] }> = {};
                    restIds.forEach(id => {
                        const rs = settingsData?.filter(s => s.restaurant_id === id) || [];
                        const parse = (k: string) => { try { return JSON.parse(rs.find(s => s.key === k)?.value || '[]'); } catch { return []; } };
                        bMap[id] = {
                            green:   parse('tier_benefits_green').length   ? parse('tier_benefits_green')   : ['Accesso al programma fedeltà', 'Premi base'],
                            gold:    parse('tier_benefits_gold').length    ? parse('tier_benefits_gold')    : ['1.2× moltiplicatore', 'Regalo Compleanno'],
                            reserve: parse('tier_benefits_reserve').length ? parse('tier_benefits_reserve') : ['1.7× moltiplicatore', 'Tavolo VIP', 'Refill Caffè'],
                        };
                    });
                    setTierBenefitsMap(bMap);

                    const { data: rewardsData } = await db
                        .from('rewards')
                        .select('id,restaurant_id,name,points_required,description,image_url')
                        .in('restaurant_id', restIds)
                        .order('points_required', { ascending: true });

                    const formatted: RestaurantCard[] = customersData.map(cust => {
                        const r = cust.restaurants as any;
                        const rSettings = settingsData?.filter(s => s.restaurant_id === cust.restaurant_id) || [];
                        const logo = rSettings.find(s => s.key === 'logo_url')?.value || '';

                        return {
                            id: r.id,
                            slug: r.slug,
                            name: r.name || 'Ristorante',
                            indirizzo: r.indirizzo || '',
                            citta: r.citta || '',
                            logo_url: logo,
                            points: cust.total_points || 0,
                            rewards: (rewardsData as Reward[] || []).filter(rw => rw.restaurant_id === r.id)
                        };
                    });
                    setMyRestaurants(formatted);
                } else {
                    setMyRestaurants([]);
                }
            } catch (err) {
                console.error('Error fetching passport data:', err);
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleRemoveAffiliation = async (restaurantId: string) => {
        if (!userId) return;
        try {
            await db.from('customers').delete().eq('auth_user_id', userId).eq('restaurant_id', restaurantId);
            setMyRestaurants(prev => prev.filter(r => r.id !== restaurantId));
        } catch (err) {
            console.error('Error removing affiliation:', err);
        }
    };

    return {
        myRestaurants,
        tierBenefitsMap,
        isDataLoading,
        handleRemoveAffiliation
    };
}
