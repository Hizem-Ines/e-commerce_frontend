import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/authContext';
import formatPrice from '../../utils/formatPrice';
import { FaHeart,FaHeartBroken } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Wishlist = () => {
    const { user } = useAuth();
    const { favoris, retirerFavori, viderFavoris } = useWishlist();
const navigate = useNavigate();
const addToCart = (produit) => {
    const productId = produit.product_id || produit.id;
    navigate(`/produits/${productId}`);
};

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl md:text-8xl mb-6">🔒</div>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#2c2c2c] mb-3">
                    Connectez-vous pour voir vos favoris
                </h2>
                <Link
                    to="/connexion"
                    className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-6 md:px-8 py-3 rounded-full transition-colors duration-300 no-underline"
                >
                    Se connecter
                </Link>
            </div>
        );
    }

    if (favoris.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl md:text-8xl mb-6">🤍</div>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#2c2c2c] mb-3">
                    Aucun favori pour l'instant
                </h2>
                <p className="text-black/50 mb-8 max-w-md text-sm md:text-base">
                    Cliquez sur le cœur d'un produit pour l'ajouter à vos favoris
                </p>
                <Link
                    to="/produits"
                    className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-6 md:px-8 py-3 rounded-full transition-colors duration-300 no-underline"
                >
                    Découvrir les produits
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-8 md:py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <FaHeart size={22} className="text-red-500 md:text-[28px]" />
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold font-serif text-[#2c2c2c]">Mes Favoris</h1>
                        <p className="text-black/50 text-sm md:text-base">
                            {favoris.length} produit{favoris.length > 1 ? 's' : ''} sauvegardé{favoris.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* GRILLE */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {favoris.map((produit) => {
                        const productId   = produit.product_id || produit.id;
                        const productName = produit.product_name_fr || produit.name_fr || produit.name;
                        const productImg  = produit.images?.[0]?.url || null;
                        const productPrix = produit.price || produit.min_price || produit.prix;
                        const productNote = produit.rating_avg || produit.ratings || produit.note;

                        return (
                            <div
                                key={produit.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#4a8c42] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                            >
                                {/* IMAGE */}
                                <Link to={`/produits/${productId}`} className="no-underline">
                                    <div className="relative h-32 md:h-44 bg-[#ecfdf5] flex items-center justify-center cursor-pointer">
                                        {productImg ? (
                                            <img src={productImg} alt={productName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-4xl md:text-6xl">🌿</span>
                                        )}
                                        {productNote && (
                                            <span className="absolute bottom-2 right-2 bg-white/90 text-xs font-bold px-2 py-0.5 rounded-full">
                                                ⭐ {parseFloat(productNote).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* INFOS */}
                                <div className="p-3 md:p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <Link to={`/produits/${productId}`} className="no-underline flex-1">
                                            <h3 className="text-xs md:text-sm font-bold text-[#2c2c2c] hover:text-[#2d5a27] transition-colors duration-200 line-clamp-2">
                                                {productName}
                                            </h3>
                                        </Link>
                                        <button
                                            onClick={() => retirerFavori(productId)}
                                            title="Retirer des favoris"
                                            className="ml-1 p-1 md:p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200 shrink-0 group"
                                        >
                                            <FaHeartBroken size={14} className="text-red-400 group-hover:text-red-600 transition-colors" />
                                        </button>
                                    </div>

                                    {produit.supplier_name && (
                                        <div className="mb-2 md:mb-3">
                                            <span className="bg-[#d1fae5] text-[#2d5a27] text-xs font-semibold px-2 py-0.5 rounded-full">
                                                {produit.supplier_name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                                        <span className="text-sm md:text-lg font-extrabold text-[#2d5a27]">
                                            {productPrix ? formatPrice(parseFloat(productPrix)) : 'N/A'}
                                        </span>
                                        <button
                                            onClick={() => addToCart(produit)}
                                            className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-xs font-bold px-2 md:px-4 py-1.5 md:py-2 rounded-xl transition-colors duration-300"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BOUTONS BAS */}
                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                    <button
                        onClick={() => favoris.forEach(p => addToCart(p))}
                        className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-8 md:px-10 py-3 md:py-4 rounded-full transition-colors duration-300 shadow-lg text-sm md:text-base"
                    >
                        🛒 Tout ajouter au panier
                    </button>
                    <button
                        onClick={viderFavoris}
                        className="bg-[#7a1c1c] hover:bg-red-700 text-white font-bold px-8 md:px-10 py-3 md:py-4 rounded-full transition-colors duration-300 shadow-lg text-sm md:text-base"
                    >
                        🗑️ Vider les favoris
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Wishlist;