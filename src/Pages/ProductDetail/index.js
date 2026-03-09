import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import formatPrice from '../../utils/formatPrice';
import API from '../../services/api';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const ProductDetail = () => {
    const { id } = useParams();
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();
    const [quantite, setQuantite] = useState(1);
    const [ajoute, setAjoute] = useState(false);

    // ✅ Nouveau — données depuis le backend
    const [produit, setProduit] = useState(null);
    const [similaires, setSimilaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Variante sélectionnée (prix, stock, attributs)
    const [varianteSelectionnee, setVarianteSelectionnee] = useState(null);

    useEffect(() => {
        const fetchProduit = async () => {
            try {
                setLoading(true);
                // Fetch produit détaillé
                const res = await API.get(`/products/${id}`);
                const data = res.data.product;
                setProduit(data);

                // Sélectionner la première variante par défaut
                if (data.variants && data.variants.length > 0) {
                    setVarianteSelectionnee(data.variants[0]);
                }

                // Fetch produits similaires (même catégorie)
                const similairesRes = await API.get(
                    `/products?category_id=${data.category_id}`
                );
                setSimilaires(
                    similairesRes.data.products
                        .filter(p => p.id !== data.id)
                        .slice(0, 4)
                );
            } catch (err) {
                setError("Produit introuvable");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduit();
    }, [id]);

    const handleAjouter = () => {
        const produitAvecVariante = {
            ...produit,
            price: varianteSelectionnee?.price || produit.min_price,
            variantId: varianteSelectionnee?.id,
        };
        for (let i = 0; i < quantite; i++) {
            ajouterAuPanier(produitAvecVariante);
        }
        setAjoute(true);
        setTimeout(() => setAjoute(false), 2000);
    };

    // ── États loading / error / not found ──
    if (loading) return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
            <p className="text-emerald-600 font-bold text-lg animate-pulse">
                Chargement du produit...
            </p>
        </div>
    );

    if (error || !produit) return (
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

    // Prix à afficher — variante sélectionnée ou min_price
    const prixAffiche = varianteSelectionnee?.price || produit.min_price || 0;
    const stockDisponible = varianteSelectionnee?.stock || 0;

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
                            {varianteSelectionnee?.images?.[0]?.url ? (
                                <img
                                    src={varianteSelectionnee.images[0].url}
                                    alt={produit.name}
                                    className="max-h-80 object-contain"
                                />
                            ) : (
                                <span className="text-[150px]">🛍️</span>
                            )}
                        </div>

                        {/* INFOS */}
                        <div className="p-10 flex flex-col justify-center">

                            {/* BADGES + COEUR */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2 flex-wrap">
                                    {produit.supplier_name && (
                                        <span className="bg-[#d1fae5] text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">
                                            {produit.supplier_name}
                                        </span>
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
                                <span className="font-bold text-[#2c2c2c]">
                                    {produit.ratings || '0'}
                                </span>
                                <span className="text-black/40 text-sm">/ 5.0</span>
                                <span className="text-black/40 text-sm">
                                    ({produit.review_count || 0} avis)
                                </span>
                            </div>

                            {/* DESCRIPTION */}
                            <p className="text-black/60 text-sm leading-relaxed mb-6">
                                {produit.description}
                            </p>

                            {/* INFO ÉTHIQUE */}
                            {produit.ethical_info && (
                                <div className="bg-[#ecfdf5] rounded-xl px-4 py-3 mb-6 text-sm text-emerald-700 font-semibold">
                                    🌿 {produit.ethical_info}
                                </div>
                            )}

                            {/* ✅ VARIANTES */}
                            {produit.variants && produit.variants.length > 1 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-black/60 mb-3">
                                        Variantes disponibles :
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {produit.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setVarianteSelectionnee(variant)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                                                    varianteSelectionnee?.id === variant.id
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                        : 'border-gray-200 text-black/60 hover:border-emerald-400'
                                                }`}
                                            >
                                                {variant.attributes?.map(a => a.attribute_value).join(' / ')}
                                                {' — '}{formatPrice(variant.price)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STOCK */}
                            <div className="mb-4">
                                {stockDisponible > 0 ? (
                                    <span className="text-emerald-600 text-sm font-bold">
                                        ✅ En stock ({stockDisponible} disponibles)
                                    </span>
                                ) : (
                                    <span className="text-red-500 text-sm font-bold">
                                        ❌ Rupture de stock
                                    </span>
                                )}
                            </div>

                            {/* PRIX */}
                            <div className="text-4xl font-black text-emerald-600 mb-8">
                                {formatPrice(prixAffiche)}
                            </div>

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
                                        onClick={() => setQuantite(Math.min(stockDisponible, quantite + 1))}
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
                                    disabled={stockDisponible === 0}
                                    className={`flex-1 font-bold py-4 rounded-xl transition-all duration-300 text-base ${
                                        stockDisponible === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : ajoute
                                                ? 'bg-green-500 text-white'
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
                                            <span className="text-5xl">🛍️</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-xs font-bold text-[#2c2c2c] mb-2 line-clamp-2">
                                            {p.name}
                                        </h3>
                                        <span className="text-sm font-extrabold text-emerald-600">
                                            {formatPrice(p.min_price || 0)}
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