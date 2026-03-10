import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import formatPrice from '../../utils/formatPrice';
import API from '../../services/api';

import { FiHeart } from 'react-icons/fi';
import { FaHeart, FaStar } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

const ProducerDetail = () => {
    const { slug } = useParams();   // ✅ slug au lieu de nom
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();

    const [fournisseur, setFournisseur] = useState(null);
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Charger fournisseur + ses produits depuis l'API
    useEffect(() => {
        const fetchFournisseur = async () => {
            try {
                setLoading(true);
                // Fetch le fournisseur par slug + ses produits
                const res = await API.get(`/suppliers/${slug}`);
                setFournisseur(res.data.supplier);
                setProduits(res.data.products || []);
            } catch (err) {
                setError("Fournisseur introuvable");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFournisseur();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
            <p className="text-emerald-600 font-bold text-lg animate-pulse">
                Chargement du fournisseur...
            </p>
        </div>
    );

    if (error || !fournisseur) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-3">
                Fournisseur introuvable
            </h2>
            <Link
                to="/fournisseurs"
                className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-full no-underline hover:bg-emerald-500 transition"
            >
                Voir tous les fournisseurs
            </Link>
        </div>
    );

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* FIL D'ARIANE */}
                <div className="flex items-center gap-2 text-sm text-black/50 mb-8">
                    <Link to="/" className="hover:text-emerald-600 no-underline transition-colors duration-200">
                        Accueil
                    </Link>
                    <span>›</span>
                    {/* ✅ Lien vers la liste avec la bonne route */}
                    <Link to="/fournisseurs" className="hover:text-emerald-600 no-underline transition-colors duration-200">
                        Fournisseurs
                    </Link>
                    <span>›</span>
                    <span className="text-[#2c2c2c] font-semibold">{fournisseur.name}</span>
                </div>

                {/* CARTE FOURNISSEUR */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden mb-8">

                    {/* BANNIÈRE */}
                    <div className="h-36 bg-gradient-to-br from-emerald-400 to-teal-500 relative">
                        {fournisseur.images?.[0]?.url && (
                            <img
                                src={fournisseur.images[0].url}
                                alt={fournisseur.name}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    <div className="p-8">
                        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">

                            {/* AVATAR + INFOS */}
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center text-4xl border-4 border-white -mt-12">
                                    🏭
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">
                                        {fournisseur.name}
                                    </h1>
                                    {/* ✅ Adresse depuis la BDD */}
                                    {fournisseur.address && (
                                        <p className="text-black/50 text-sm mb-1">
                                            📍 {fournisseur.address}
                                        </p>
                                    )}
                                    {/* ✅ Contact depuis la BDD */}
                                    {fournisseur.contact && (
                                        <p className="text-black/50 text-sm">
                                            ✉️ {fournisseur.contact}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* BADGES + WEBSITE */}
                            <div className="flex flex-col items-end gap-2">
                                {fournisseur.website && (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <MdVerified size={12} /> Fournisseur vérifié
                                    </span>
                                )}
                                {produits.length > 0 && (
                                    <span className="bg-[#f9f5f0] text-black/50 text-xs font-semibold px-3 py-1 rounded-full">
                                        {produits.length} produit{produits.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        {fournisseur.description && (
                            <p className="text-black/60 text-sm leading-relaxed max-w-2xl mb-6">
                                {fournisseur.description}
                            </p>
                        )}

                        {/* WEBSITE */}
                        {fournisseur.website && (
                            <a
                                href={fournisseur.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors duration-300 no-underline"
                            >
                                🌐 Visiter le site officiel
                            </a>
                        )}
                    </div>
                </div>

                {/* PRODUITS DU FOURNISSEUR */}
                {produits.length > 0 ? (
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6">
                            Produits de {fournisseur.name}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {produits.map((produit) => (
                                <div
                                    key={produit.id}
                                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                >
                                    {/* IMAGE */}
                                    <Link to={`/produits/${produit.id}`} className="no-underline">
                                        <div className="relative h-44 bg-[#ecfdf5] flex items-center justify-center">
                                            {/* ✅ thumbnail retourné par le backend */}
                                            {produit.thumbnail?.[0]?.url ? (
                                                <img
                                                    src={produit.thumbnail[0].url}
                                                    alt={produit.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-6xl">🛍️</span>
                                            )}
                                            <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                                                ⭐ {produit.ratings || '0'}
                                            </span>
                                        </div>
                                    </Link>

                                    <div className="p-4">
                                        <div className="flex justify-between mb-2">
                                            <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
                                                <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-emerald-600 transition-colors duration-200">
                                                    {produit.name}
                                                </h3>
                                            </Link>
                                            <button
                                                onClick={() => toggleFavori(produit)}
                                                className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200"
                                            >
                                                {estFavori(produit.id)
                                                    ? <FaHeart size={16} className="text-red-500" />
                                                    : <FiHeart size={16} className="text-gray-400 hover:text-red-400" />}
                                            </button>
                                        </div>

                                        {/* ✅ Info éthique si disponible */}
                                        {produit.ethical_info && (
                                            <p className="text-xs text-emerald-600 font-semibold mb-2">
                                                🌿 {produit.ethical_info}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div>
                                                {/* ✅ min_price au lieu de prix statique */}
                                                <span className="text-lg font-extrabold text-emerald-600">
                                                    {formatPrice(produit.min_price || 0)}
                                                </span>
                                                {produit.min_price !== produit.max_price && (
                                                    <span className="text-xs text-black/40 block">à partir de</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => ajouterAuPanier(produit)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300"
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-8">
                        <div className="text-5xl mb-3">📦</div>
                        <p className="text-black/50 font-semibold">
                            Aucun produit disponible pour ce fournisseur
                        </p>
                    </div>
                )}

                {/* ✅ AVIS — agrégés depuis les reviews des produits du fournisseur */}
                {produits.some(p => p.review_count > 0) && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                            Avis clients
                        </h2>
                        <p className="text-black/40 text-sm mb-6">
                            Basé sur les avis laissés sur les produits de {fournisseur.name}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {produits
                                .filter(p => p.review_count > 0)
                                .map(p => (
                                    <Link
                                        key={p.id}
                                        to={`/produits/${p.id}`}
                                        className="no-underline bg-[#f9f5f0] rounded-xl p-4 hover:bg-[#ecfdf5] transition-colors duration-200 block"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm text-[#2c2c2c] line-clamp-1">
                                                {p.name}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <FaStar size={12} className="text-yellow-400" />
                                                <span className="text-xs font-bold text-yellow-700">
                                                    {p.ratings || '0'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-black/40">
                                            {p.review_count} avis · Voir les avis →
                                        </p>
                                    </Link>
                                ))
                            }
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProducerDetail;
