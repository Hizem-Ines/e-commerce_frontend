import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { getSupplierBySlug } from '../../services/supplierService';
import formatPrice from '../../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import { FaHeart, FaLeaf } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

const ProducerDetail = () => {
    const { nom } = useParams();
    const navigate = useNavigate();
    const { toggleFavori, estFavori } = useWishlist();
    const [producteur, setProducteur] = useState(null);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        getSupplierBySlug(nom)
            .then(res => setProducteur(res.data.supplier))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [nom]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec]">
                <div className="text-6xl animate-spin mb-4">🌿</div>
                <p className="text-black/50 font-semibold">Chargement...</p>
            </div>
        );
    }

    if (!producteur) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-3">Producteur introuvable</h2>
                <Link to="/producteurs" className="bg-[#2d5a27] text-white font-bold px-8 py-3 rounded-full no-underline hover:bg-[#4a8c42]  transition-colors">
                    Voir tous les producteurs
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* FIL D'ARIANE */}
                <div className="flex items-center gap-2 text-sm text-black/50 mb-8">
                    <Link to="/" className="hover:text-[#2d5a27] no-underline transition-colors">Accueil</Link>
                    <span>›</span>
                    <Link to="/producteurs" className="hover:text-[#2d5a27] no-underline transition-colors">Producteurs</Link>
                    <span>›</span>
                    <span className="text-[#2c2c2c] font-semibold">{producteur.name}</span>
                </div>

                {/* CARTE PROFIL */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden mb-8">
                    <div className="px-8 py-8">

                        {/* LOGO + BADGES */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl shadow-lg flex items-center justify-center border-2 border-emerald-100 overflow-hidden">
                                {producteur.logo_url ? (
                                    <img src={producteur.logo_url} alt={producteur.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">🌿</span>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <MdVerified size={12} /> Vérifié
                                </span>
                                {producteur.is_certified_bio && (
                                    <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <FaLeaf size={10} /> Bio certifié
                                    </span>
                                )}
                                {producteur.website && (
                                    <a href={producteur.website} target="_blank" rel="noreferrer"
                                        className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full no-underline hover:bg-blue-200 transition-colors">
                                        🌐 Site web
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* INFOS */}
                        <div className="flex items-start justify-between flex-wrap gap-6">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">{producteur.name}</h1>
                                {producteur.name_ar && (
                                    <p className="text-lg text-black/40 mb-2" dir="rtl">{producteur.name_ar}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-sm text-black/50 mb-4">
                                    {producteur.region  && <span>📍 {producteur.region}</span>}
                                    {producteur.address && <span>🏠 {producteur.address}</span>}
                                    {producteur.contact && <span>📞 {producteur.contact}</span>}
                                    {producteur.email   && (
                                        <a href={`mailto:${producteur.email}`} className="text-[#2d5a27] no-underline hover:underline">
                                            ✉️ {producteur.email}
                                        </a>
                                    )}
                                </div>
                                {producteur.description_fr && (
                                    <p className="text-black/60 text-sm leading-relaxed max-w-2xl">{producteur.description_fr}</p>
                                )}
                            </div>
                            <div className="shrink-0 text-center bg-emerald-50 rounded-2xl px-8 py-4">
                                <div className="text-3xl font-black text-[#2d5a27]">{producteur.product_count || 0}</div>
                                <div className="text-xs text-black/40 font-semibold">Produits</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOCALISATION */}
                {(producteur.region || producteur.address) && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-8">
                        <h2 className="text-xl font-bold font-serif text-[#2c2c2c] mb-4">📍 Localisation</h2>
                        <div className="bg-[#ecfdf5] rounded-xl h-40 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-5xl mb-3">🗺️</div>
                                <p className="font-bold text-emerald-700">{producteur.region || producteur.address}</p>
                                <p className="text-sm text-black/40 mt-1">Tunisie</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUITS */}
                {producteur.products?.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6">
                            Produits de {producteur.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {producteur.products.map(produit => (
                                <div key={produit.id}
                                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#4a8c42]  hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                    <Link to={`/produits/${produit.id}`} className="no-underline">
                                        <div className="relative h-44 bg-[#ecfdf5] flex items-center justify-center">
                                            {produit.images?.[0]?.url ? (
                                                <img src={produit.images[0].url} alt={produit.name_fr} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-6xl">🌿</span>
                                            )}
                                            <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                                                ⭐ {produit.rating_avg ? parseFloat(produit.rating_avg).toFixed(1) : 'N/A'}
                                            </span>
                                            {produit.is_featured && (
                                                <span className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">✨</span>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
                                                <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-[#2d5a27] transition-colors line-clamp-2">
                                                    {produit.name_fr}
                                                </h3>
                                            </Link>
                                            <button onClick={() => toggleFavori(produit)}
                                                className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                                {estFavori(produit.id)
                                                    ? <FaHeart size={16} className="text-red-500" />
                                                    : <FiHeart size={16} className="text-gray-400" />}
                                            </button>
                                        </div>
                                        {produit.category_name && (
                                            <span className="text-xs text-black/40 mb-2 block">{produit.category_name}</span>
                                        )}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <span className="text-lg font-extrabold text-[#2d5a27]">
                                                {produit.min_price ? formatPrice(parseFloat(produit.min_price)) : 'Prix N/A'}
                                            </span>
                                            <button onClick={() => navigate(`/produits/${produit.id}`)}
                                                className="bg-[#2d5a27] hover:bg-[#4a8c42]  text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                                                Voir →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAS DE PRODUITS */}
                {(!producteur.products || producteur.products.length === 0) && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-12 text-center">
                        <div className="text-5xl mb-4">📦</div>
                        <p className="text-black/40 font-semibold">Aucun produit disponible pour ce producteur</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProducerDetail;