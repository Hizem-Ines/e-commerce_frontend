import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById } from '../../services/productService';
import { getAllProducts } from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const ProductDetail = () => {
    const { id } = useParams();
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();
    const [quantite, setQuantite] = useState(1);
    const [ajoute, setAjoute] = useState(false);
    const [produit, setProduit] = useState(null);
    const [similaires, setSimilaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [varianteActive, setVarianteActive] = useState(null);

    useEffect(() => {
        const fetchProduit = async () => {
            setLoading(true);
            try {
                const res = await getProductById(id);
                setProduit(res.data.product);
                if (res.data.product.variants?.length > 0) {
                    setVarianteActive(res.data.product.variants[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduit();
    }, [id]);

    useEffect(() => {
        getAllProducts({ page: 1 })
            .then(res => {
                const autres = res.data.products.filter(p => p.id !== id);
                setSimilaires(autres.slice(0, 4));
            })
            .catch(err => console.error(err));
    }, [id]);

    const handleAjouter = () => {
    if (!varianteActive?.id) return;
 
    ajouterAuPanier({
        variant_id:   varianteActive.id,
        product_name: produit.name,
        price:        varianteActive.price,
        image:        varianteActive.images?.[0]?.url || null,
        attributes:   varianteActive.attributes || [],
        stock:        varianteActive.stock,
    }, quantite);
 
    setAjoute(true);
    setTimeout(() => setAjoute(false), 2000);
};
 

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec]">
                <div className="text-6xl animate-spin mb-4">🌿</div>
                <p className="text-black/50 font-semibold">Chargement...</p>
            </div>
        );
    }

    if (!produit) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-3">
                    Produit introuvable
                </h2>
                <Link
                    to="/produits"
                    className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-full no-underline hover:bg-emerald-500 transition-colors duration-300"
                >
                    Voir tous les produits
                </Link>
            </div>
        );
    }

    const prix = varianteActive?.price || produit.variants?.[0]?.price || 0;
    const images = varianteActive?.images || produit.variants?.[0]?.images || [];

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* FIL D'ARIANE */}
                <div className="flex items-center gap-2 text-sm text-black/50 mb-8">
                    <Link to="/" className="hover:text-emerald-600 no-underline transition-colors duration-200">
                        Accueil
                    </Link>
                    <span>›</span>
                    <Link to="/produits" className="hover:text-emerald-600 no-underline transition-colors duration-200">
                        Produits
                    </Link>
                    <span>›</span>
                    <span className="text-[#2c2c2c] font-semibold">{produit.name}</span>
                </div>

                {/* DÉTAIL PRODUIT */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* IMAGE */}
                        <div className="bg-[#ecfdf5] flex items-center justify-center p-16 min-h-[400px]">
                            {images[0]?.url ? (
                                <img
                                    src={images[0].url}
                                    alt={produit.name}
                                    className="max-h-72 object-contain rounded-xl"
                                />
                            ) : (
                                <span className="text-[120px]">🌿</span>
                            )}
                        </div>

                        {/* INFOS */}
                        <div className="p-10 flex flex-col justify-center">

                            {/* BADGES + COEUR */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2 flex-wrap">
                                    {produit.supplier_name && (
                                        <Link
                                            to={`/producteurs/${produit.supplier_slug || encodeURIComponent(produit.supplier_name)}`}
                                            className="bg-[#d1fae5] text-emerald-600 text-xs font-bold px-3 py-1 rounded-full no-underline hover:bg-emerald-200 transition-colors duration-200"
                                        >
                                            {produit.supplier_name}
                                        </Link>
                                    )}
                                    {produit.category_name && (
                                        <span className="bg-[#f9f5f0] text-black/50 text-xs font-semibold px-3 py-1 rounded-full">
                                            {produit.category_name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleFavori(produit)}
                                    className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                >
                                    {estFavori(produit.id)
                                        ? <FaHeart size={24} className="text-red-500" />
                                        : <FiHeart size={24} className="text-gray-400 hover:text-red-400" />
                                    }
                                </button>
                            </div>

                            {/* NOM */}
                            <h1 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-4">
                                {produit.name}
                            </h1>

                            {/* NOTE */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">⭐</span>
                                <span className="font-bold text-[#2c2c2c]">{produit.ratings || 'N/A'}</span>
                                <span className="text-black/40 text-sm">/ 5.0</span>
                                {produit.reviews?.length > 0 && (
                                    <span className="text-black/40 text-sm">({produit.reviews.length} avis)</span>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <p className="text-black/60 text-sm leading-relaxed mb-6">
                                {produit.description}
                            </p>

                            {/* INFO ÉTHIQUE */}
                            {produit.ethical_info && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6">
                                    <p className="text-emerald-700 text-xs font-semibold">
                                        🌱 {produit.ethical_info}
                                    </p>
                                </div>
                            )}

                            {/* VARIANTES */}
                            {produit.variants?.length > 1 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-black/60 mb-2">Variante :</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {produit.variants.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setVarianteActive(v)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                                                    varianteActive?.id === v.id
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                        : 'border-gray-200 text-black/60 hover:border-emerald-400'
                                                }`}
                                            >
                                                {v.attributes?.map(a => a.attribute_value).join(' / ') || `Variante ${v.id.slice(0, 4)}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PRIX */}
                            <div className="text-4xl font-black text-emerald-600 mb-6">
                                {formatPrice(parseFloat(prix))}
                            </div>

                            {/* STOCK */}
                            {varianteActive && (
                                <p className="text-sm text-black/50 mb-6">
                                    {varianteActive.stock > 0
                                        ? <span className="text-emerald-600 font-semibold">✅ En stock ({varianteActive.stock} disponibles)</span>
                                        : <span className="text-red-500 font-semibold">❌ Rupture de stock</span>
                                    }
                                </p>
                            )}

                            {/* QUANTITÉ */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-sm font-semibold text-black/60">Quantité :</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantite(Math.max(1, quantite - 1))}
                                        className="w-9 h-9 rounded-full border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
                                    >
                                        −
                                    </button>
                                    <span className="font-bold text-[#2c2c2c] w-6 text-center text-lg">
                                        {quantite}
                                    </span>
                                    <button
                                        onClick={() => setQuantite(quantite + 1)}
                                        className="w-9 h-9 rounded-full border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* BOUTONS */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAjouter}
                                    disabled={varianteActive?.stock === 0}
                                    className={`flex-1 font-bold py-4 rounded-xl transition-all duration-300 text-base ${
                                        ajoute
                                            ? 'bg-green-500 text-white'
                                            : varianteActive?.stock === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {ajoute ? '✅ Ajouté au panier !' : 'Ajouter au panier'}
                                </button>
                                <Link
                                    to="/panier"
                                    className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold px-6 py-4 rounded-xl transition-colors duration-300 no-underline text-center"
                                >
                                    🛒 Panier
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                {/* AVIS */}
                {produit.reviews?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8 mb-12">
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6">
                            Avis clients
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {produit.reviews.map((avis) => (
                                <div key={avis.review_id} className="bg-[#f9f5f0] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {avis.reviewer?.avatar ? (
                                                <img src={avis.reviewer.avatar} alt={avis.reviewer.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                    {avis.reviewer?.name?.[0]}
                                                </div>
                                            )}
                                            <span className="font-bold text-sm text-[#2c2c2c]">{avis.reviewer?.name}</span>
                                        </div>
                                        <span className="text-xs text-black/40">
                                            {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="flex gap-0.5 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={i < avis.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-black/60">{avis.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRODUITS SIMILAIRES */}
                {similaires.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6">
                            Vous aimerez aussi
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {similaires.map((p) => (
                                <Link
                                    key={p.id}
                                    to={`/produits/${p.id}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 no-underline"
                                >
                                    <div className="h-32 bg-[#ecfdf5] flex items-center justify-center">
                                        {p.thumbnail?.[0]?.url ? (
                                            <img src={p.thumbnail[0].url} alt={p.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-5xl">🌿</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-xs font-bold text-[#2c2c2c] mb-2 line-clamp-2">
                                            {p.name}
                                        </h3>
                                        <span className="text-sm font-extrabold text-emerald-600">
                                            {p.min_price ? formatPrice(parseFloat(p.min_price)) : 'Prix N/A'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProductDetail;