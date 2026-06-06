import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import formatPrice from '../../utils/formatPrice';
import { getShippingCost } from '../../services/orderService';
import SuggestionsRecettes from '../../Components/cart/Suggestionrecettes';

const Cart = () => {
    const { panier, retirerDuPanier, changerQuantite, viderPanier, totalArticles, totalPrix } = useCart();
    const navigate = useNavigate();
    const { currency } = useSiteSettings();
    const fmt = (n) => formatPrice(parseFloat(n), currency);

    // ── Frais de livraison dynamiques ─────────────────────
    const [shippingInfo, setShippingInfo] = useState(null);

    useEffect(() => {
        if (totalPrix <= 0) return;
        getShippingCost(totalPrix)
            .then(res => setShippingInfo(res.data))
            .catch(() => setShippingInfo(null));
    }, [totalPrix]);

    if (panier.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-3">
                    Votre panier est vide
                </h2>
                <p className="text-black/50 mb-8 text-center">
                    Découvrez nos produits et ajoutez-les à votre panier
                </p>
                <Link to="/produits"
                    className="text-white font-bold px-8 py-3 rounded-full transition-colors duration-300 no-underline"
                    style={{ background: '#166534' }}>
                    Continuer mes achats
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-8 sm:py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2c2c2c] mb-1">Mon Panier</h1>
                    <p className="text-black/50 text-sm">
                        {totalArticles} article{totalArticles > 1 ? 's' : ''} dans votre panier
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                    {/* COLONNE GAUCHE — liste produits + suggestions IA */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* LISTE PRODUITS */}
                        {panier.map((item) => (
                            <div key={item.variant_id}
                                className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-4 sm:gap-5">

                                {/* IMAGE */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{ background: '#ecfdf5' }}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl sm:text-4xl">🌿</span>
                                    )}
                                </div>

                                {/* INFOS */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#2c2c2c] mb-1 text-sm sm:text-base truncate">
                                        {item.product_name}
                                    </h3>

                                    {/* Attributs */}
                                    {item.attributes?.length > 0 && (
                                        <p className="text-xs text-black/40 mb-2">
                                                    {item.attributes.map(a => `${a.type_fr}: ${a.value_fr}`).join(' — ')}
                                        </p>
                                    )}

                                    {/* QUANTITÉ */}
                                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                                        <button
                                            onClick={() => changerQuantite(item.variant_id, item.quantity - 1)}
                                            className="w-8 h-8 rounded-full font-bold transition-colors duration-200 flex items-center justify-center shrink-0"
                                            style={{ border: '2px solid #166534', color: '#166534' }}
                                        >−</button>
                                        <span className="font-bold text-[#2c2c2c] w-6 text-center text-sm">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => changerQuantite(item.variant_id, item.quantity + 1)}
                                            className="w-8 h-8 rounded-full font-bold transition-colors duration-200 flex items-center justify-center shrink-0"
                                            style={{ border: '2px solid #166534', color: '#166534' }}
                                        >+</button>
                                    </div>
                                </div>

                                {/* PRIX + SUPPRIMER */}
                                <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0">
                                    <span className="text-lg sm:text-xl font-extrabold" style={{ color: '#166534' }}>
                                        {fmt(parseFloat(item.price) * item.quantity)}
                                    </span>
                                    <button
                                        onClick={() => retirerDuPanier(item.variant_id)}
                                        className="text-xs text-red-400 hover:text-red-600 transition-colors duration-200"
                                    >
                                        🗑 Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button onClick={viderPanier}
                            className="text-sm text-red-400 hover:text-red-600 font-semibold transition-colors duration-200">
                            🗑 Vider le panier
                        </button>

                        {/* ✨ SUGGESTIONS IA — affiché sous la liste produits */}
                        <SuggestionsRecettes panier={panier} />
                    </div>

                    {/* RÉSUMÉ */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] lg:sticky lg:top-4">
                            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#2c2c2c] mb-5 sm:mb-6">
                                Résumé de la commande
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-black/60">
                                    <span>Sous-total ({totalArticles} article{totalArticles > 1 ? 's' : ''})</span>
                                    <span>{fmt(totalPrix)}</span>
                                </div>

                                {/* ── Frais de livraison dynamiques ── */}
                                <div className="flex justify-between text-sm text-black/60">
                                    <span>Livraison</span>
                                    {shippingInfo ? (
                                        <span className="font-semibold" style={{ color: '#166534' }}>
                                            {shippingInfo.is_free
                                                ? 'Gratuite'
                                                : fmt(shippingInfo.shipping_cost)}
                                        </span>
                                    ) : (
                                        <span className="text-black/40 italic text-xs">Calculée au checkout</span>
                                    )}
                                </div>

                                {/* Barre de progression livraison gratuite */}
                                {shippingInfo && !shippingInfo.is_free && shippingInfo.remaining_for_free > 0 && (
                                    <div className="rounded-xl px-3 py-2 text-xs"
                                        style={{ background: '#f0fdf4', color: '#166534' }}>
                                        🚚 Plus que{' '}
                                        <strong>{fmt(shippingInfo.remaining_for_free)}</strong>
                                        {' '}pour la livraison gratuite !
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-base sm:text-lg text-[#2c2c2c]">
                                    <span>Total</span>
                                    <span style={{ color: '#166534' }}>
                                        {fmt(totalPrix + parseFloat(shippingInfo?.shipping_cost ?? 0))}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-sm sm:text-base mb-3 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #166534, #15803d)',
                                    boxShadow: '0 4px 20px rgba(22,101,52,0.4)'
                                }}
                            >
                                Commander maintenant →
                            </button>

                            <Link to="/produits"
                                className="block text-center text-sm text-black/50 hover:text-[#166534] transition-colors duration-200 no-underline">
                                ← Continuer mes achats
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;