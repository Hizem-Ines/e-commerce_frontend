import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams, Link } from 'react-router-dom';
import { FiPackage, FiMapPin, FiCreditCard, FiHome, FiLoader } from 'react-icons/fi';
import { getSingleOrder } from '../../services/orderService';

const OrderConfirmation = () => {
    const { orderId }         = useParams();
    const { state }           = useLocation();
    const [searchParams]      = useSearchParams();

    // Détection d'un retour depuis Stripe (3D Secure redirect)
    const redirectStatus      = searchParams.get('redirect_status');    // 'succeeded' | 'failed'
    const isStripeRedirect    = !!searchParams.get('payment_intent');

    const [order,   setOrder]   = useState(state?.order || null);
    const [loading, setLoading] = useState(!state?.order && !!orderId);
    const [error,   setError]   = useState('');

    // Si pas d'order en state (redirect Stripe ou accès direct), on fetch
    useEffect(() => {
        if (!order && orderId) {
            getSingleOrder(orderId)
                .then(res => setOrder(res.data.order))
                .catch(() => setError("Commande introuvable."))
                .finally(() => setLoading(false));
        }
    }, [orderId]); // eslint-disable-line

    // ── Chargement ────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
                <div className="text-center">
                    <FiLoader size={32} className="animate-spin mx-auto mb-4" style={{ color: '#166534' }} />
                    <p className="text-sm text-black/50">Chargement de votre commande...</p>
                </div>
            </div>
        );
    }

    // ── Erreur ────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-2 text-[#2c2c2c]">Commande introuvable</h2>
                    <p className="text-black/50 mb-6">{error}</p>
                    <Link to="/" className="text-white font-bold px-6 py-3 rounded-xl no-underline"
                        style={{ background: '#166534' }}>
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        );
    }

    // ── Paiement Stripe échoué (retour depuis 3DS) ────────
    if (isStripeRedirect && redirectStatus === 'failed') {
        return (
            <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-2 text-[#2c2c2c]">Paiement échoué</h2>
                    <p className="text-black/50 mb-6 text-sm">
                        Votre paiement n'a pas pu être traité. Votre commande est conservée, vous pouvez réessayer.
                    </p>
                    <Link to={`/panier`}
                        className="text-white font-bold px-6 py-3 rounded-xl no-underline inline-block"
                        style={{ background: '#166534' }}>
                        Réessayer →
                    </Link>
                </div>
            </div>
        );
    }

    // ── Succès ─────────────────────────────────────────────
    const isStripePayment = isStripeRedirect
        ? redirectStatus === 'succeeded'
        : state?.payment?.method === 'stripe';

    return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">

                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8 no-underline">
                    <div className="relative p-3 rounded-2xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <span className="text-2xl">🧺</span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                            style={{ background: '#e63946' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-widest font-serif" style={{ color: '#166534' }}>
                            GOF<span style={{ color: '#e63946' }}>FA</span>
                        </h1>
                        <p className="text-xs font-semibold tracking-wider" style={{ color: '#4ade80' }}>artisanat tunisien</p>
                    </div>
                </Link>

                {/* Icône succès */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#dcfce7' }}>
                    <span className="text-4xl">✅</span>
                </div>

                <h2 className="text-3xl font-black font-serif text-[#2c2c2c] mb-2">
                    Commande confirmée !
                </h2>
                <p className="text-black/50 text-sm mb-8">
                    Merci pour votre commande. Vous recevrez un email de confirmation sous peu.
                </p>

                {/* Détails commande */}
                {order && (
                    <div className="rounded-2xl p-5 mb-6 text-left space-y-4"
                        style={{ background: '#f9f5f0' }}>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#dcfce7' }}>
                                <FiPackage style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Numéro de commande</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">#{order.order_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#dcfce7' }}>
                                <FiMapPin style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Livraison à</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">
                                    {order.shipping_address}, {order.shipping_city}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#dcfce7' }}>
                                <FiCreditCard style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Paiement</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">
                                    {order.payment_method === 'cod'
                                        ? '💵 Paiement à la livraison'
                                        : '💳 Carte bancaire'}
                                </p>
                            </div>
                        </div>

                        {/* Prix avec réduction si applicable */}
                        <div className="border-t border-gray-200 pt-4">
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-black/50">Sous-total</span>
                                    <span className="text-xs line-through text-black/30">
                                        {parseFloat(order.subtotal).toFixed(2)} DT
                                    </span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold" style={{ color: '#166534' }}>
                                        Réduction (code promo)
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: '#166634' }}>
                                        -{parseFloat(order.discount_amount).toFixed(2)} DT
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-[#2c2c2c]">Total payé</span>
                                <span className="text-xl font-black" style={{ color: '#166534' }}>
                                    {parseFloat(order.total_price).toFixed(2)} DT
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notice guest */}
                {order && !order.password && (
                    <div className="rounded-xl p-4 mb-6 text-sm"
                        style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                        <p className="font-bold text-yellow-800 mb-1">📧 Vérifiez votre email !</p>
                        <p className="text-yellow-700 text-xs">
                            Un compte a été créé pour vous. Consultez votre email pour définir votre
                            mot de passe et suivre vos commandes.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link to="/"
                        className="flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl no-underline transition hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <FiHome size={16} /> Retour à l'accueil
                    </Link>
                    <Link to="/produits"
                        className="text-sm font-semibold no-underline hover:underline"
                        style={{ color: '#166534' }}>
                        Continuer mes achats →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;