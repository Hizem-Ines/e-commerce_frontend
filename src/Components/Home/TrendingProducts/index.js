import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import formatPrice from '../../../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const TrendingProducts = ({ produits, loading }) => {
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();

    return (
        <section className="bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <span className="bg-[#c8872a] text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                            📈 TENDANCES
                        </span>
                        <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">
                            Les Plus Consultés
                        </h2>
                        <p className="text-black/50 text-sm">
                            Les produits préférés de nos clients
                        </p>
                    </div>
                    <Link to="/produits" className="text-[#c8872a] font-bold text-sm hover:underline mt-2 no-underline">
                        Voir tout →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : produits.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-black/40">Aucun produit tendance disponible</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        {produits.map((produit) => (
                            <div
                                key={produit.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#c8872a] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                            >
                                <Link to={`/produits/${produit.id}`} className="no-underline">
                                    <div className="relative h-52 bg-[#fff5ee] flex items-center justify-center cursor-pointer overflow-hidden">
                                        {produit.images?.[0]?.url ? (
                                            <img src={produit.images[0].url} alt={produit.name_fr} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-7xl">🌿</span>
                                        )}
                                        <span className="absolute top-3 left-3 bg-[#c8872a] text-white text-xs font-bold px-3 py-1 rounded-full">
                                            📈 Populaire
                                        </span>
                                        {produit.views_count > 0 && (
                                            <span className="absolute top-3 right-3 bg-white/90 text-xs font-semibold px-3 py-1 rounded-full">
                                                👁 {produit.views_count}
                                            </span>
                                        )}
                                        {produit.rating_avg && (
                                            <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                                                ⭐ {parseFloat(produit.rating_avg).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
                                            <h3 className="text-base font-bold text-[#2c2c2c] hover:text-[#c8872a] transition-colors duration-200">
                                                {produit.name_fr}
                                            </h3>
                                        </Link>
                                        <button
                                            onClick={() => toggleFavori(produit)}
                                            className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200"
                                        >
                                            {estFavori(produit.id)
                                                ? <FaHeart size={18} className="text-red-500" />
                                                : <FiHeart size={18} className="text-gray-400 hover:text-red-400" />
                                            }
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        {produit.supplier_name && (
                                            <Link
                                                to={`/producteurs/${produit.supplier_slug}`}
                                                className="bg-[#d1fae5] text-[#2d5a27] text-xs font-semibold px-3 py-1 rounded-full no-underline hover:bg-#b6eac7 transition-colors duration-200"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {produit.supplier_name}
                                            </Link>
                                        )}
                                        {produit.origin && (
                                            <span className="text-xs text-black/50">📍 {produit.origin}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div>
                                            <span className="text-xl font-extrabold text-[#c8872a]">
                                                {produit.price ? formatPrice(parseFloat(produit.price)) : 'Prix N/A'}
                                            </span>
                                            {produit.compare_price && parseFloat(produit.compare_price) > parseFloat(produit.price) && (
                                                <span className="ml-2 text-xs text-black/30 line-through">
                                                    {formatPrice(parseFloat(produit.compare_price))}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => ajouterAuPanier({
                                                variant_id:   produit.variant_id,  
                                                product_name: produit.name_fr,
                                                price:        produit.price,
                                                image:        produit.images?.[0]?.url || null,
                                                attributes:   [],
                                                stock:        99,
                                            })}
                                            className="bg-[#c8872a] hover:bg-[#a86e1f] text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors duration-300"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TrendingProducts;