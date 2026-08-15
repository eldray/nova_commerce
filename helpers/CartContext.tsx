
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface CartItem {
    productId: number;
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
}

interface CartContextValue {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (productId: number) => void;
    setQuantity: (productId: number, quantity: number) => void;
    clear: () => void;
    subtotal: number;
    itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nova-commerce-cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as CartItem[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // ignore storage failures (private browsing, quota, etc.)
        }
    }, [items]);

    const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.productId === item.productId);
            if (existing) {
                return prev.map((i) =>
                    i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
                );
            }
            return [...prev, { ...item, quantity }];
        });
    };

    const removeItem: CartContextValue["removeItem"] = (productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    };

    const setQuantity: CartContextValue["setQuantity"] = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    };

    const clear = () => setItems([]);

    const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
    const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, subtotal, itemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within a CartProvider");
    return ctx;
};