import { createContext, useContext, useState, useEffect } from 'react';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
} from '../services/wishlistService';
import { useAuth } from './authContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const [favoris, setFavoris] = useState([]);

    // Charger la wishlist depuis le backend si connecté
    useEffect(() => {
        if (user) {
            getWishlist()
                .then(res => setFavoris(res.data.items))
                .catch(() => setFavoris([]));
        } else {
            setFavoris([]);
        }
    }, [user]);

    const ajouterFavori = async (produit) => {
        if (!user) return;
        try {
            await addToWishlist(produit.id);
            setFavoris(prev => [...prev, { ...produit, product_id: produit.id }]);
        } catch (err) {
            console.error(err);
        }
    };

    const retirerFavori = async (id) => {
        if (!user) return;
        try {
            await removeFromWishlist(id);
            setFavoris(prev => prev.filter(p => (p.product_id || p.id) !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFavori = (produit) => {
        const existe = favoris.find(p => (p.product_id || p.id) === produit.id);
        if (existe) {
            retirerFavori(produit.id);
        } else {
            ajouterFavori(produit);
        }
    };

    const estFavori = (id) => favoris.some(p => (p.product_id || p.id) === id);

    const totalFavoris = favoris.length;

    return (
        <WishlistContext.Provider value={{
            favoris,
            toggleFavori,
            retirerFavori,
            estFavori,
            totalFavoris,
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist doit être utilisé dans un WishlistProvider');
    return context;
};

export default WishlistContext;