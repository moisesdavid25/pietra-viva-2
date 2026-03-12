import React, { useState, useEffect } from 'react';
import { Gift, Users, Plus, Tag } from 'lucide-react';
import db from '../../db';

interface Props {
    restaurantId: string;
}

export default function Fidelizzazione({ restaurantId }: Props) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [restaurantId]);

    const fetchData = async () => {
        const { data: custData } = await db.from('customers').select('*').eq('restaurant_id', restaurantId);
        if (custData) setCustomers(custData);

        const { data: coupData } = await db.from('coupons').select('*').eq('restaurant_id', restaurantId);
        if (coupData) setCoupons(coupData);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-wrap gap-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-[#008080]" /> Clienti ({customers.length})</h3>
                <button className="bg-[#008080]/10 text-[#008080] font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    Aggiungi Cliente Mualmente
                </button>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-[#262626] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-wrap gap-4 mt-6">
                <h3 className="font-bold text-lg flex items-center gap-2"><Tag className="text-[#008080]" /> Cupon Attivi ({coupons.length})</h3>
                <button className="bg-[#008080] text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-md">
                    <Plus className="w-4 h-4" /> Nuovo Coupon
                </button>
            </div>

            <div className="text-center py-12 bg-white dark:bg-[#262626] rounded-2xl border border-gray-200 dark:border-gray-800">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Il sistema di fidelizzazione è pronto.</p>
                <p className="text-sm text-gray-400 mt-2">I clienti si registreranno automaticamente al checkout.</p>
            </div>
        </div>
    );
}
