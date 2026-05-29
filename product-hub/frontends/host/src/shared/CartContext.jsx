import { createContext, useContext, useEffect, useState } from 'react';
import { eventBus, EVENTS } from '@mf/event-bus';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const unsubscribe = eventBus.subscribe(EVENTS.CART_UPDATED, (item) => {
            setCartItems(prev => {
                const existing = prev.find(i => i.id === item.id);
                if (existing) {
                    // already in cart — increment quantity, keep prices as-is
                    return prev.map(i =>
                        i.id === item.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    );
                }
                return [...prev, { ...item, quantity: 1 }];
            });
        });
        return unsubscribe;
    }, []);

    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{ cartItems, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
}

