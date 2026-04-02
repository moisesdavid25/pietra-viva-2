import { useState, useEffect } from 'react';

export interface CartItem {
    cartItemId: string; // Unique ID for the cart row (hash of product ID + customizations)
    id: string; // Product id
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    price_unit: string | null;
    customizations?: {
        removed: string[];
        added: { name: string; price: number }[];
        notes?: string;
    };
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

    const addToCart = (product: Omit<CartItem, 'quantity' | 'cartItemId'> & { customizations?: CartItem['customizations'] }, quantity: number = 1) => {
        // Generate a unique ID for this specific configuration
        const customString = product.customizations
            ? JSON.stringify({ r: product.customizations.removed.sort(), a: product.customizations.added.map(x => x.name).sort(), n: product.customizations.notes || '' })
            : '';
        const cartItemId = `${product.id}_${btoa(customString).slice(0, 10)}`;

        const existing = cart.find((item) => item.cartItemId === cartItemId);
        if (existing) {
            updateCart(cart.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
            ));
        } else {
            updateCart([...cart, { ...product, cartItemId, quantity }]);
        }
    };

    const removeFromCart = (cartItemId: string) => {
        updateCart(cart.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        updateCart(cart.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item)));
    };

    const clearCart = () => updateCart([]);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice };
}
