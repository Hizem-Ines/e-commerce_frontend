import { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

const CART_KEY = 'goffa_cart';

// ── Helpers localStorage ────────────────────────────
const loadCart = () => {
    try {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }) => {
    const [panier, setPanier] = useState(loadCart);
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeoutRef = useRef(null);

    // ── Sync localStorage à chaque changement ───────
    useEffect(() => {
        saveCart(panier);
    }, [panier]);

    // ── Ouverture / fermeture avec délai (hover) ────
    const ouvrirPanier = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const fermerPanierAvecDelai = (delai = 200) => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, delai);
    };

    const fermerPanier = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setIsOpen(false);
    };

    // ── Ajouter au panier ────────────────────────────
    const ajouterAuPanier = (item, quantity = 1) => {
        setPanier(prev => {
            const existe = prev.find(i => i.variant_id === item.variant_id);
            if (existe) {
                return prev.map(i =>
                    i.variant_id === item.variant_id
                        ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || 99) }
                        : i
                );
            }
            return [...prev, { ...item, quantity }];
        });
        ouvrirPanier();
        closeTimeoutRef.current = setTimeout(() => fermerPanier(), 3000);
    };

    // ── Retirer du panier ────────────────────────────
    const retirerDuPanier = (variant_id) => {
        setPanier(prev => prev.filter(i => i.variant_id !== variant_id));
    };

    // ── Changer la quantité ──────────────────────────
    const changerQuantite = (variant_id, quantity) => {
        if (quantity < 1) {
            retirerDuPanier(variant_id);
            return;
        }
        setPanier(prev =>
            prev.map(i =>
                i.variant_id === variant_id
                    ? { ...i, quantity: Math.min(quantity, i.stock || 99) }
                    : i
            )
        );
    };

    // ── Vider le panier ──────────────────────────────
    const viderPanier = () => {
        setPanier([]);
        localStorage.removeItem(CART_KEY);
    };

    // ── Totaux ───────────────────────────────────────
    const totalArticles = panier.reduce((acc, i) => acc + i.quantity, 0);
    const totalPrix     = panier.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);

    return (
        <CartContext.Provider value={{
            panier,
            ajouterAuPanier,
            retirerDuPanier,
            changerQuantite,
            viderPanier,
            totalArticles,
            totalPrix,
            isOpen,
            ouvrirPanier,
            fermerPanier,
            fermerPanierAvecDelai,
            loading: false,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart doit être utilisé dans un CartProvider');
    return context;
};

export default CartContext;