import { useState, useEffect } from 'react';

export interface CartItem {
    id: string; // Product id
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    price_unit: string | null;
}

export function useCart(slug: string | null) {
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (!slug) return [];
        try {
            const saved = localStorage.getItem(`leomenu_cart_${slug}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Error reading cart from localStorage', e);
        }
        return [];
    });

    const updateCart = (newCart: CartItem[]) => {
        setCart(newCart);
        if (slug) {
            localStorage.setItem(`leomenu_cart_${slug}`, JSON.stringify(newCart));
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { slug } }));
        }
    };

    useEffect(() => {
        const handleStorage = (e: any) => {
            if (e.detail?.slug === slug && slug) {
                const saved = localStorage.getItem(`leomenu_cart_${slug}`);
                if (saved) setCart(JSON.parse(saved));
            }
        };

        window.addEventListener('cartUpdated', handleStorage);
        return () => window.removeEventListener('cartUpdated', handleStorage);
    }, [slug]);

    const addToCart = (product: Omit<CartItem, 'quantity'>) => {
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            updateCart(cart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            updateCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId: string) => {
        updateCart(cart.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        updateCart(cart.map((item) => (item.id === productId ? { ...item, quantity } : item)));
    };

    const clearCart = () => updateCart([]);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice };
}
