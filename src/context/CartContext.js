import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './authContext';
import {
    getCart,
    addToCart as addToCartAPI,
    updateCartItem as updateCartItemAPI,
    removeFromCart as removeFromCartAPI,
    clearCart as clearCartAPI,
    mergeCart,
    getSessionId,
} from '../services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [panier, setPanier] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalArticles, setTotalArticles] = useState(0);
    const [loading, setLoading] = useState(false);
    const mergedRef = useRef(false); // ✅ évite le double merge (StrictMode)

    // ── Charger le panier depuis l'API ──────────────────
    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCart();
            setPanier(res.data.items || []);
            setTotal(parseFloat(res.data.total) || 0);
            setTotalArticles(res.data.totalItems || 0);
        } catch (err) {
            console.error('Erreur chargement panier:', err);
            setPanier([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Charger au démarrage ────────────────────────────
    useEffect(() => {
        getSessionId(); // ✅ génère session_id immédiatement
        fetchCart();
    }, [fetchCart]);

    // ── Fusionner le panier anonyme au login ────────────
    useEffect(() => {
        if (user && !mergedRef.current) {
            mergedRef.current = true;
            const sessionId = getSessionId(); // ✅ utilise la variable en mémoire
            mergeCart(sessionId)
                .then(() => fetchCart())
                .catch(() => fetchCart());
        }

        // Reset si logout
        if (!user) {
            mergedRef.current = false;
            fetchCart();
        }
    }, [user]);

    // ── Ajouter au panier ───────────────────────────────
    const ajouterAuPanier = async (variant_id, quantity = 1) => {
        try {
            await addToCartAPI({ variant_id, quantity });
            await fetchCart();
        } catch (err) {
            const msg = err.response?.data?.message || "Erreur lors de l'ajout au panier";
            throw new Error(msg);
        }
    };

    // ── Retirer du panier ───────────────────────────────
    const retirerDuPanier = async (itemId) => {
        try {
            await removeFromCartAPI(itemId);
            await fetchCart();
        } catch (err) {
            console.error('Erreur suppression:', err);
        }
    };

    // ── Changer la quantité ─────────────────────────────
    const changerQuantite = async (itemId, quantity) => {
        if (quantity < 1) {
            await retirerDuPanier(itemId);
            return;
        }
        try {
            await updateCartItemAPI(itemId, { quantity });
            await fetchCart();
        } catch (err) {
            console.error('Erreur mise à jour quantité:', err);
        }
    };

    // ── Vider le panier ─────────────────────────────────
    const viderPanier = async () => {
        try {
            await clearCartAPI();
            setPanier([]);
            setTotal(0);
            setTotalArticles(0);
        } catch (err) {
            console.error('Erreur vidage panier:', err);
        }
    };

    return (
        <CartContext.Provider value={{
            panier,
            loading,
            ajouterAuPanier,
            retirerDuPanier,
            changerQuantite,
            viderPanier,
            fetchCart,
            totalArticles,
            totalPrix: total,
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