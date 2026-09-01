
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface CartItem {
    productId: number;
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
}

export interface AppliedCoupon {
    code: string;
    discountType: 'percentage' | 'fixed' | 'free_shipping';
    discountValue: number;
    description?: string;
}

interface CartContextValue {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (productId: number) => void;
    setQuantity: (productId: number, quantity: number) => void;
    clear: () => void;
    subtotal: number;
    itemCount: number;
    appliedCoupon: AppliedCoupon | null;
    applyCoupon: (coupon: AppliedCoupon) => void;
    removeCoupon: () => void;
    discountAmount: number;
    totalAfterDiscount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nova-commerce-cart";
const COUPON_STORAGE_KEY = "nova-commerce-coupon";

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

    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
        if (typeof window === "undefined") return null;
        try {
            const raw = window.localStorage.getItem(COUPON_STORAGE_KEY);
            return raw ? (JSON.parse(raw) as AppliedCoupon) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // ignore storage failures (private browsing, quota, etc.)
        }
    }, [items]);

    useEffect(() => {
        try {
            if (appliedCoupon) {
                window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
            } else {
                window.localStorage.removeItem(COUPON_STORAGE_KEY);
            }
        } catch {
            // ignore storage failures
        }
    }, [appliedCoupon]);

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

    const clear = () => {
        setItems([]);
        setAppliedCoupon(null);
    };

    const applyCoupon: CartContextValue["applyCoupon"] = (coupon) => {
        setAppliedCoupon(coupon);
    };

    const removeCoupon: CartContextValue["removeCoupon"] = () => {
        setAppliedCoupon(null);
    };

    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        
        if (appliedCoupon.discountType === 'percentage') {
            return subtotal * (appliedCoupon.discountValue / 100);
        } else if (appliedCoupon.discountType === 'fixed') {
            return Math.min(appliedCoupon.discountValue, subtotal);
        }
        return 0;
    }, [appliedCoupon, subtotal]);

    const totalAfterDiscount = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
    const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

    return (
        <CartContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            setQuantity, 
            clear, 
            subtotal, 
            itemCount,
            appliedCoupon,
            applyCoupon,
            removeCoupon,
            discountAmount,
            totalAfterDiscount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within a CartProvider");
    return ctx;
};