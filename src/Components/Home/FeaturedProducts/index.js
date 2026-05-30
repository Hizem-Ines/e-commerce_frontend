import { Link } from 'react-router-dom';
import { useWishlist } from '../../../context/WishlistContext';
import formatPrice from '../../../utils/formatPrice';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { imageUrl } from '../../../utils/imageUrl';

const FeaturedProducts = ({ produits, loading }) => {
    const { toggleFavori, estFavori } = useWishlist();
    const { currency } = useSiteSettings();

    if (!loading && produits.length === 0) return null; // ✅ hide section if no featured products

    return (
        <section className="bg-[#fffbf2] py-16">
            <div className="container mx-auto px-4">
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <span className="bg-[#c8872a] text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                            ❤️ COUPS DE CŒUR
                        </span>
                        <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">
                            Nos Sélections
                        </h2>
                        <p className="text-black/50 text-sm">
                            Les produits choisis avec soin par notre équipe
                        </p>
                    </div>
                    <Link to="/produits?is_featured=true" className="text-[#c8872a] font-bold text-sm hover:underline mt-2 no-underline">
                        Voir tout →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-amber-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
                        {produits.map((produit) => (
                            <div
                                key={produit.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#c8872a] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                            >
                                <Link to={`/produits/${produit.slug || produit.id}`} className="no-underline">
                                    <div className="relative h-52 bg-[#fff8ee] flex items-center justify-center cursor-pointer overflow-hidden">
                                        {produit.images?.[0]?.url ? (
                                            <img src={imageUrl(produit.images[0].url)} alt={produit.name_fr} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-7xl">🌿</span>
                                        )}
                                        <span className="absolute top-3 left-3 bg-[#c8872a] text-white text-xs font-bold px-3 py-1 rounded-full">
                                            ❤️ Coup de cœur
                                        </span>
                                        {produit.rating_count > 0 && produit.rating_avg && parseFloat(produit.rating_avg) > 0 && (
                                            <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                                                ⭐ {parseFloat(produit.rating_avg).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <Link to={`/produits/${produit.slug || produit.id}`} className="no-underline flex-1">
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
                                                className="bg-[#d1fae5] text-[#2d5a27] text-xs font-semibold px-3 py-1 rounded-full no-underline hover:bg-emerald-200 transition-colors duration-200"
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
                                        <div className="flex flex-col">
                                            {produit.original_min_price &&
                                            parseFloat(produit.original_min_price) > parseFloat(produit.min_price) && (
                                                <span className="text-xs text-black/40 line-through">
                                                    {formatPrice(parseFloat(produit.original_min_price), currency)}
                                                </span>
                                            )}
                                            <span className="text-xl font-extrabold text-[#c8872a]">
                                                {produit.min_price ? formatPrice(parseFloat(produit.min_price), currency) : 'Prix N/A'}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/produits/${produit.slug || produit.id}`}
                                            className="bg-[#c8872a] hover:bg-[#a86e1f] text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors duration-300 no-underline"
                                        >
                                            Voir le produit
                                        </Link>
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

export default FeaturedProducts;