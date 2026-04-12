import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getOffresData } from '../../services/offresService';
import formatPrice from '../../utils/formatPrice';
import { FiHeart, FiTag, FiCopy, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const Offres = () => {
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState('');

    useEffect(() => {
        getOffresData()
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    const ProductCard = ({ produit, accentColor = 'emerald', badge = null }) => (
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#4a8c42]  hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <Link to={`/produits/${produit.id}`} className="no-underline">
                <div className="relative h-48 bg-[#ecfdf5] flex items-center justify-center overflow-hidden">
                    {produit.images?.[0]?.url ? (
                        <img src={produit.images[0].url} alt={produit.name_fr} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-6xl">🌿</span>
                    )}
                    {badge && (
                        <span className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full"
                            style={{ background: badge.color }}>
                            {badge.label}
                        </span>
                    )}
                    {produit.rating_avg && (
                        <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                            ⭐ {parseFloat(produit.rating_avg).toFixed(1)}
                        </span>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
                        <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-[#2d5a27] transition-colors duration-200 line-clamp-2">
                            {produit.name_fr}
                        </h3>
                    </Link>
                    <button
                        onClick={() => toggleFavori(produit)}
                        className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200 shrink-0"
                    >
                        {estFavori(produit.id)
                            ? <FaHeart size={16} className="text-red-500" />
                            : <FiHeart size={16} className="text-gray-400" />
                        }
                    </button>
                </div>

                {produit.supplier_name && (
                    <Link
                        to={`/producteurs/${produit.supplier_slug}`}
                        className="inline-block bg-[#d1fae5] text-[#2d5a27] text-xs font-semibold px-3 py-1 rounded-full no-underline hover:bg-#b6eac7 transition-colors mb-3"
                    >
                        {produit.supplier_name}
                    </Link>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <span className="text-lg font-extrabold text-[#2d5a27]">
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
                        className="bg-[#2d5a27] hover:bg-[#4a8c42]  text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300"
                    >
                        Ajouter
                    </button>
                </div>
            </div>
        </div>
    );

    const SkeletonGrid = ({ count = 4 }) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="text-center mb-12">
                    <span className="bg-[#c8872a] text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                        🎉 OFFRES SPÉCIALES
                    </span>
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-2">
                        Nos Meilleures Offres
                    </h1>
                    <p className="text-black/50 max-w-xl mx-auto">
                        Profitez de nos réductions exclusives sur les produits artisanaux tunisiens
                    </p>
                </div>

                {/* CODES PROMO ACTIFS */}
                {!loading && data?.activePromos?.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6 flex items-center gap-2">
                            <FiTag className="text-[#2d5a27]" /> Codes Promo Actifs
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {data.activePromos.map((promo) => (
                                <div key={promo.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-dashed border-#b6eac7">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="bg-emerald-50 px-4 py-2 rounded-xl">
                                            <span className="text-xl font-black text-[#2d5a27] tracking-widest">
                                                {promo.code}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleCopyCode(promo.code)}
                                            className="flex items-center gap-1 text-xs font-bold text-[#2d5a27] hover:text-[#4a8c42]  transition"
                                        >
                                            {copiedCode === promo.code
                                                ? <><FiCheck size={14} /> Copié !</>
                                                : <><FiCopy size={14} /> Copier</>
                                            }
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-[#2c2c2c] mb-1">
                                        {promo.discount_type === 'percent'
                                            ? `${promo.discount_value}% de réduction`
                                            : `${promo.discount_value} DT de réduction`}
                                    </p>
                                    {promo.description_fr && (
                                        <p className="text-xs text-black/50 mb-2">{promo.description_fr}</p>
                                    )}
                                    {promo.min_order_amount && (
                                        <p className="text-xs text-black/40">
                                            Commande min. : {formatPrice(parseFloat(promo.min_order_amount))}
                                        </p>
                                    )}
                                    {promo.expires_at && (
                                        <p className="text-xs text-red-400 mt-2 font-semibold">
                                            Expire le {new Date(promo.expires_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* OFFRES FLASH */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                                ⚡ OFFRES FLASH
                            </span>
                            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">
                                Réductions Exclusives
                            </h2>
                        </div>
                        <Link to="/produits" className="text-[#2d5a27] font-bold text-sm hover:underline no-underline mt-2">
                            Voir tout →
                        </Link>
                    </div>
                    {loading ? <SkeletonGrid count={4} /> : data?.flashDeals?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {data.flashDeals.map(p => (
                                <ProductCard
                                    key={p.id}
                                    produit={p}
                                    badge={{ label: `⚡ -${p.discount_percent}%`, color: '#ef4444' }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-black/40">Aucune offre flash disponible</div>
                    )}
                </div>

                {/* NOUVEAUTÉS */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className="bg-[#2d5a27] text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                                ✨ NOUVEAUTÉS
                            </span>
                            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">
                                Derniers Arrivages
                            </h2>
                        </div>
                        <Link to="/produits" className="text-[#2d5a27] font-bold text-sm hover:underline no-underline mt-2">
                            Voir tout →
                        </Link>
                    </div>
                    {loading ? <SkeletonGrid count={3} /> : data?.newProducts?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {data.newProducts.map(p => (
                                <ProductCard
                                    key={p.id}
                                    produit={p}
                                    badge={{ label: '✨ Nouveau', color: '#059669' }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-black/40">Aucune nouveauté disponible</div>
                    )}
                </div>

                {/* PRODUITS VEDETTES */}
                <div>
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className="bg-[#c8872a] text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                                ⭐ VEDETTES
                            </span>
                            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">
                                Produits Sélectionnés
                            </h2>
                        </div>
                        <Link to="/produits" className="text-[#c8872a] font-bold text-sm hover:underline no-underline mt-2">
                            Voir tout →
                        </Link>
                    </div>
                    {loading ? <SkeletonGrid count={3} /> : data?.featuredDeals?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {data.featuredDeals.map(p => (
                                <ProductCard
                                    key={p.id}
                                    produit={p}
                                    badge={{ label: '⭐ Vedette', color: '#c8872a' }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-black/40">Aucun produit vedette disponible</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Offres;