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
    const [isLoading, setIsLoading] = useState(false); 

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
        const productId = produit.product_id || produit.id;
        setIsLoading(true);
        try {
            await addToWishlist(productId);
            const res = await getWishlist();
            setFavoris(res.data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false); // ←  (finally pour couvrir les erreurs aussi)
        }
        
    };

    const retirerFavori = async (id) => {
        if (!user) return;
        setIsLoading(true); 
        try {
            await removeFromWishlist(id);
            const res = await getWishlist();
            setFavoris(res.data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const viderFavoris = async () => {
        if (!user) return;
        try {
            await clearWishlist();
            setFavoris([]);
        } catch (err) {
            console.error(err);
        }
    };


    const toggleFavori = (produit) => {
        const productId = produit.product_id || produit.id;
        const existe = favoris.find(p => (p.product_id || p.id) === productId);
        if (existe) {
            retirerFavori(productId);
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
            viderFavoris,
            isLoading,
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