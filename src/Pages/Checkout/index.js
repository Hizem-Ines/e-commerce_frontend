import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/authContext';
import formatPrice from '../../utils/formatPrice';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { createOrder, createGuestOrder, validatePromo, getShippingCost } from '../../services/orderService';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard,
    FiChevronRight, FiLock, FiTag, FiX, FiCheck, FiArrowLeft,
} from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ── Apparence Stripe ────────────────────────────────────────────────────────
const stripeAppearance = {
    theme: 'stripe',
    variables: {
        colorPrimary:    '#166534',
        colorBackground: '#ffffff',
        colorText:       '#2c2c2c',
        colorDanger:     '#dc2626',
        fontFamily:      'system-ui, -apple-system, sans-serif',
        borderRadius:    '10px',
        spacingUnit:     '4px',
    },
    rules: {
        '.Input':       { border: '2px solid #e5e7eb', boxShadow: 'none', padding: '10px 14px' },
        '.Input:focus': { border: '2px solid #166534', boxShadow: 'none' },
        '.Label':       { fontWeight: '600', fontSize: '12px', color: '#4b5563' },
    },
};

// ── Logos SVG ───────────────────────────────────────────────────────────────
const VisaLogo = () => (
    <svg height="20" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
        <rect width="780" height="500" rx="40" fill="#1A1F71" />
        <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.7-191.3c-10.6-3.9-27.2-8.1-47.9-8.1-52.8 0-90 26.5-90.3 64.4-.3 28 26.7 43.6 47.1 52.9 20.9 9.5 27.9 15.6 27.8 24.1-.1 13-16.7 18.9-32.1 18.9-21.5 0-32.9-2.9-50.6-10.1l-6.9-3.1-7.5 43.7c12.5 5.4 35.5 10.1 59.4 10.4 56 0 92.4-26.1 92.8-66.6.2-22.2-14.1-39.1-45-53-18.8-9-30.3-15-30.2-24.2 0-8.1 9.7-16.8 30.8-16.8 17.6-.3 30.3 3.5 40.2 7.4l4.8 2.3 7.6-44.2zm137 1.3h-41.3c-12.8 0-22.3 3.5-27.9 16.3l-79.2 178.8h56l11.2-29.2 68.3.1c1.6 6.8 6.5 29.1 6.5 29.1h49.5l-43.1-195.1zm-77.9 128.3l21.3-54.7 3.5-9.5c2.1 5.2 5.8 14.7 10 29.8l6.9 34.4h-41.7zm-330.1-128.3l-52.4 133.5-5.6-27c-9.8-31.2-40.2-65.1-74.3-82l47.9 171.2 56.5-.1 84.1-195.6h-56.2z" fill="#fff" />
        <path d="M146 152.8H60.3l-.8 4.5c66.8 16.2 111 55.3 129.4 102.3l-18.7-89.7c-3.2-12.3-12.5-15.9-24.2-17.1z" fill="#F2AE14" />
    </svg>
);

const MastercardLogo = () => (
    <svg height="20" viewBox="0 0 152.4 108" xmlns="http://www.w3.org/2000/svg">
        <rect width="152.4" height="108" rx="8" fill="#252525" />
        <circle cx="60.2" cy="54" r="30" fill="#EB001B" />
        <circle cx="92.2" cy="54" r="30" fill="#F79E1B" />
        <path d="M76.2 32.3c7 5.3 11.5 13.6 11.5 22.7s-4.5 17.4-11.5 22.7c-7-5.3-11.5-13.6-11.5-22.7s4.5-17.4 11.5-22.7z" fill="#FF5F00" />
    </svg>
);

const TwintLogo = () => (
    <svg height="20" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="40" rx="6" fill="#000" />
        <text x="50" y="28" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">twint</text>
    </svg>
);

// ── Déduire le canton depuis le NPA ────────────────────────────────────────
const getCantonFromNPA = (npa) => {
    const code = parseInt(npa);
    if (code >= 1000 && code <= 1299) return 'VD/GE';
    if (code >= 1300 && code <= 1699) return 'VD';
    if (code >= 1700 && code <= 1799) return 'FR';
    if (code >= 1800 && code <= 1999) return 'VD';
    if (code >= 2000 && code <= 2099) return 'NE';
    if (code >= 2300 && code <= 2999) return 'BE';
    if (code >= 3000 && code <= 3999) return 'BE';
    if (code >= 4000 && code <= 4999) return 'BS';
    if (code >= 5000 && code <= 5999) return 'AG';
    if (code >= 6000 && code <= 6999) return 'LU';
    if (code >= 7000 && code <= 7999) return 'GR';
    if (code >= 8000 && code <= 8999) return 'ZH';
    if (code >= 9000 && code <= 9999) return 'SG';
    return null;
};

// ════════════════════════════════════════════════════════════
// ÉTAPE 2 — Paiement Stripe
// ════════════════════════════════════════════════════════════
const StripePaymentStep = ({ order, promoResult, onBack }) => {
    const stripe      = useStripe();
    const elements    = useElements();
    const navigate    = useNavigate();
    const { viderPanier } = useCart();
    const { currency } = useSiteSettings();
    const fmt = (n) => formatPrice(parseFloat(n), currency);

    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setLoading(true);
        setError('');

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/commande-confirmee/${order.id}` },
            redirect: 'if_required',
        });

        if (stripeError) { setError(stripeError.message); setLoading(false); return; }

        if (paymentIntent?.status === 'succeeded') {
            viderPanier();
            navigate(`/commande-confirmee/${order.id}`, { state: { order, payment: { method: 'stripe' } } });
        }
    };

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-8 sm:py-12">
            <div className="container mx-auto px-4 max-w-lg">
                <div className="mb-6 sm:mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold mb-4 text-gray-500 hover:text-[#166534] transition-colors">
                        <FiArrowLeft size={16} /> Retour à la commande
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#2c2c2c]">Paiement sécurisé</h1>
                    <p className="text-sm text-black/40 mt-1">Commande #{order.order_number}</p>
                </div>

                {/* Récapitulatif */}
                <div className="bg-white rounded-2xl p-5 mb-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)]">
                    <div className="flex justify-between items-center text-sm text-black/60 mb-2">
                        <span>Sous-total</span><span>{fmt(order.subtotal)}</span>
                    </div>
                    {parseFloat(order.discount_amount) > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-[#2d5a27] font-semibold flex items-center gap-1">
                                <FiTag size={13} /> Code promo
                                {promoResult?.promoCode && (
                                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#dcfce7', color: '#166534' }}>
                                        {promoResult.promoCode}
                                    </span>
                                )}
                            </span>
                            <span className="text-[#2d5a27] font-bold">-{fmt(order.discount_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-black/60 mb-3">
                        <span>Livraison</span>
                        <span className="font-semibold" style={{ color: '#166634' }}>
                            {parseFloat(order.shipping_cost) === 0 ? 'Gratuite' : fmt(order.shipping_cost)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-extrabold text-[#2c2c2c]">Total</span>
                        <span className="text-xl font-black" style={{ color: '#166534' }}>{fmt(order.total_price)}</span>
                    </div>
                </div>

                {/* Formulaire Stripe */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2 mb-5">
                        <FiCreditCard size={18} style={{ color: '#166534' }} />
                        <h2 className="text-base font-bold text-[#2c2c2c]">Informations de paiement</h2>
                    </div>
                    <PaymentElement options={{ layout: 'tabs' }} />
                    {error && (
                        <div className="mt-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            ❌ {error}
                        </div>
                    )}
                    <button onClick={handlePay} disabled={loading || !stripe}
                        className="w-full text-white font-bold py-4 rounded-xl mt-5 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] text-base"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)', boxShadow: '0 4px 20px rgba(22,101,52,0.4)' }}>
                        {loading ? '⏳ Traitement en cours...' : `💳 Payer ${fmt(order.total_price)}`}
                    </button>
                    <p className="text-xs text-center text-black/30 mt-3 flex items-center justify-center gap-1">
                        <FiLock size={11} /> Paiement sécurisé par Stripe · Vos données ne sont jamais stockées
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 mt-5 opacity-60 flex-wrap">
                    <VisaLogo /><MastercardLogo /><TwintLogo />
                    <span className="text-xs text-black/40 font-semibold">3D Secure</span>
                </div>
            </div>
        </div>
    );
};



// ════════════════════════════════════════════════════════════
// ÉTAPE 1 — Formulaire principal
// ════════════════════════════════════════════════════════════
const CheckoutForm = ({ onStripeOrderCreated }) => {
    const { panier, totalPrix, viderPanier } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { currency } = useSiteSettings();
    const fmt = (n) => formatPrice(parseFloat(n), currency);

    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');
    const [paymentMethod, setPaymentMethod] = useState('card');

    // ── Shipping ─────────────────────────────────────────
    const [formData, setFormData] = useState({
        name:                 user?.name  || '',
        email:                user?.email || '',
        phone:                user?.phone || '',
        shipping_address:     user?.shipping_address || '',
        shipping_city:        user?.shipping_city || user?.city || '',
        shipping_postal_code: user?.shipping_postal_code || '',
        notes:                '',
    });

    // ── Billing ─────────────────────────────────────────
    // ✅ true = copie depuis shipping (comportement par défaut)
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

   const [billingData, setBillingData] = useState({
    billing_full_name:   user?.billing_full_name   || '',
    billing_phone:       user?.billing_phone       || '',
    billing_address:     user?.billing_address     || '',
    billing_city:        user?.billing_city        || '',
    billing_postal_code: user?.billing_postal_code || '',
});

    // ── Promo ────────────────────────────────────────────
    const [promoInput,  setPromoInput]  = useState('');
    const [promoStatus, setPromoStatus] = useState(null);
    const [promoResult, setPromoResult] = useState(null);
    const [promoError,  setPromoError]  = useState('');

    const discountAmount     = promoResult?.discountAmount || 0;
    const subtotalAfterPromo = totalPrix - discountAmount;

    // ── Frais de livraison dynamiques ────────────────────
    const [shippingInfo, setShippingInfo] = useState(null);

    useEffect(() => {
        if (promoResult) {
            setShippingInfo({
                shipping_cost:           promoResult.shippingCost,
                is_free:                 promoResult.shippingCost === 0,
                free_shipping_threshold: promoResult.freeShippingThreshold,
                remaining_for_free: promoResult.shippingCost === 0
                    ? 0
                    : Math.max(0, promoResult.freeShippingThreshold - subtotalAfterPromo),
            });
            return;
        }
        if (totalPrix <= 0) return;
        getShippingCost(totalPrix)
            .then(res => setShippingInfo(res.data))
            .catch(() => setShippingInfo(null));
    }, [totalPrix, promoResult, subtotalAfterPromo]);

    const shippingCost = shippingInfo?.shipping_cost ?? 0;
    const finalTotal   = subtotalAfterPromo + shippingCost;

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleBillingChange = (e) =>
        setBillingData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setPromoStatus('loading');
        setPromoError('');
        try {
            const res = await validatePromo({ code: promoInput.trim(), subtotal: totalPrix });
            setPromoResult(res.data);
            setPromoStatus('valid');
        } catch (err) {
            setPromoResult(null);
            setPromoStatus('error');
            setPromoError(err.response?.data?.message || 'Code invalide ou expiré.');
        }
    };

    const handleRemovePromo = () => {
        setPromoInput(''); setPromoResult(null); setPromoStatus(null); setPromoError('');
    };

    if (panier.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-3">Votre panier est vide</h2>
                <Link to="/produits" className="text-white font-bold px-8 py-3 rounded-full no-underline" style={{ background: '#166534' }}>
                    Voir les produits
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const items = panier.map(item => ({ variant_id: item.variant_id, quantity: item.quantity }));

        const canton = getCantonFromNPA(formData.shipping_postal_code) || formData.shipping_city || 'CH';
        const fullName     = user ? user.name : formData.name;

        // ✅ Construction selon billing_same_as_shipping
        let orderData = {
            items,
            payment_method: paymentMethod,

            shipping_full_name:   fullName,
            shipping_phone:       formData.phone,
            shipping_address: formData.shipping_address,
            shipping_city:        formData.shipping_city,
            shipping_governorate: canton,
            shipping_postal_code: formData.shipping_postal_code || undefined,
            shipping_country:     'CH',

            notes:      formData.notes || undefined,
            promo_code: promoResult?.promoCode || undefined,

            billing_same_as_shipping: billingSameAsShipping,
        };

        // ✅ Si billing différent : envoyer les champs billing séparément
        if (!billingSameAsShipping) {
            
            const billingCanton = getCantonFromNPA(billingData.billing_postal_code) || billingData.billing_city || 'CH';

            orderData = {
                ...orderData,
                billing_full_name:    billingData.billing_full_name || fullName,
                billing_phone:        billingData.billing_phone     || formData.phone,
                billing_address: billingData.billing_address,
                billing_city:         billingData.billing_city,
                billing_governorate:  billingCanton,
                billing_postal_code:  billingData.billing_postal_code || undefined,
                billing_country:      'CH',
            };
        }

        try {
            let res;
            if (user) {
                res = await createOrder(orderData);
            } else {
                res = await createGuestOrder({
                    ...orderData,
                    name:  formData.name,
                    email: formData.email,
                    phone: formData.phone,
                });
            }

            const { order, payment } = res.data;

            if (payment.client_secret) {
                onStripeOrderCreated(order, payment.client_secret, promoResult);
                return;
            }

            viderPanier();
            navigate(`/commande-confirmee/${order.id}`, { state: { order, payment: { method: 'stripe' } } });

        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition";
    const inputStyle = { border: '2px solid #e5e7eb' };
    const onFocus = e => (e.target.style.borderColor = '#166534');
    const onBlur  = e => (e.target.style.borderColor = '#e5e7eb');


    return (
        <div className="bg-[#fdf6ec] min-h-screen py-8 sm:py-12">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* TITRE */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-sm text-black/50 mb-3">
                        <Link to="/panier" className="hover:text-[#166534] no-underline">Panier</Link>
                        <FiChevronRight size={14} />
                        <span className="text-[#166534] font-bold">Commande</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2c2c2c]">Finaliser la commande</h1>
                </div>

                {error && (
                    <div className="mb-6 px-5 py-4 rounded-xl text-sm font-semibold" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                        {/* ── COLONNE GAUCHE ────────────────────────────── */}
                        <div className="lg:col-span-2 space-y-5 sm:space-y-6 order-last lg:order-first">

                            {/* INFOS GUEST */}
                            {!user && (
                                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                    <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-1">Vos informations</h2>
                                    <p className="text-xs text-black/40 mb-5">
                                        <Link to="/connexion" className="font-bold no-underline" style={{ color: '#166534' }}>Se connecter</Link>
                                        {' '}— Sinon, un compte sera créé automatiquement.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet *</label>
                                            <div className="relative">
                                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                                    placeholder="Votre nom complet" className={`${inputClass} pl-10`}
                                                    style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Email *</label>
                                                <div className="relative">
                                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                                        placeholder="votre@email.com" className={`${inputClass} pl-10`}
                                                        style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone *</label>
                                                <div className="relative">
                                                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                                        placeholder="+41 XX XXX XXX" className={`${inputClass} pl-10`}
                                                        style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADRESSE DE LIVRAISON */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-5 flex items-center gap-2">
                                    <FiMapPin style={{ color: '#e63946' }} /> Adresse de livraison
                                </h2>
                                {user && (
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                                placeholder="+41 79 XXX XX XX" className={`${inputClass} pl-10`}
                                                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse *</label>
                                    <input
                                        type="text"
                                        name="shipping_address"
                                        value={formData.shipping_address}
                                        onChange={handleChange}
                                        required
                                        placeholder="Bahnhofstrasse 12, App 3B"
                                        className={inputClass}
                                        style={inputStyle}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">NPA *</label>
                                        <input
                                            type="text"
                                            name="shipping_postal_code"
                                            value={formData.shipping_postal_code}
                                            onChange={handleChange}
                                            required
                                            placeholder="8001"
                                            maxLength={4}
                                            className={inputClass}
                                            style={inputStyle}
                                            onFocus={onFocus}
                                            onBlur={onBlur}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Localité *</label>
                                        <input
                                            type="text"
                                            name="shipping_city"
                                            value={formData.shipping_city}
                                            onChange={handleChange}
                                            required
                                            placeholder="Zurich"
                                            className={inputClass}
                                            style={inputStyle}
                                            onFocus={onFocus}
                                            onBlur={onBlur}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Notes (optionnel)</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                                        placeholder="Instructions spéciales pour la livraison..."
                                        className={`${inputClass} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                            </div>

                            {/* ── ADRESSE DE FACTURATION ──────────────────── */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                                    <FiCreditCard style={{ color: '#6366f1' }} /> Adresse de facturation
                                </h2>

                                {/* ✅ Checkbox billing_same_as_shipping */}
                                <label className="flex items-center gap-3 cursor-pointer mb-4">
                                    <div
                                        onClick={() => setBillingSameAsShipping(prev => !prev)}
                                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
                                            billingSameAsShipping
                                                ? 'border-[#166534] bg-[#166534]'
                                                : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        {billingSameAsShipping && <FiCheck size={12} color="white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm font-semibold text-[#2c2c2c]">
                                        Identique à l'adresse de livraison
                                    </span>
                                </label>

                                {/* Formulaire billing si différent */}
                                {!billingSameAsShipping && (
                                    <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet *</label>
                                                <div className="relative">
                                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="text" name="billing_full_name" value={billingData.billing_full_name}
                                                        onChange={handleBillingChange} required placeholder="Nom sur la facture"
                                                        className={`${inputClass} pl-10`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                                <div className="relative">
                                                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="tel" name="billing_phone" value={billingData.billing_phone}
                                                        onChange={handleBillingChange} placeholder="+41 XX XXX XXX"
                                                        className={`${inputClass} pl-10`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse *</label>
                                            <input
                                                type="text"
                                                name="billing_address"
                                                value={billingData.billing_address}
                                                onChange={handleBillingChange}
                                                required
                                                placeholder="Bahnhofstrasse 12, App 3B"
                                                className={inputClass}
                                                style={inputStyle}
                                                onFocus={onFocus}
                                                onBlur={onBlur}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">NPA *</label>
                                                <input
                                                    type="text"
                                                    name="billing_postal_code"
                                                    value={billingData.billing_postal_code}
                                                    onChange={handleBillingChange}
                                                    required
                                                    placeholder="8001"
                                                    maxLength={4}
                                                    className={inputClass}
                                                    style={inputStyle}
                                                    onFocus={onFocus}
                                                    onBlur={onBlur}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Localité *</label>
                                                <input
                                                    type="text"
                                                    name="billing_city"
                                                    value={billingData.billing_city}
                                                    onChange={handleBillingChange}
                                                    required
                                                    placeholder="Zurich"
                                                    className={inputClass}
                                                    style={inputStyle}
                                                    onFocus={onFocus}
                                                    onBlur={onBlur}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MÉTHODE DE PAIEMENT */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] space-y-3">
                                <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-2">Mode de paiement</h2>

                                {/* Carte */}
                                <label className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                                    style={{ border: paymentMethod === 'card' ? '2px solid #166534' : '2px solid #e5e7eb', background: paymentMethod === 'card' ? '#f0fdf4' : 'white' }}>
                                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: paymentMethod === 'card' ? '#166534' : '#d1d5db' }}>
                                        {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#166534' }} />}
                                    </div>
                                    <FiCreditCard size={20} style={{ color: '#6366f1' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-[#2c2c2c]">Carte bancaire</p>
                                        <p className="text-xs text-black/40">Visa, Mastercard — paiement sécurisé</p>
                                    </div>
                                    <div className="hidden sm:flex gap-2 items-center shrink-0"><VisaLogo /><MastercardLogo /></div>
                                </label>

                                {/* Twint */}
                                <label className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                                    style={{ border: paymentMethod === 'twint' ? '2px solid #166534' : '2px solid #e5e7eb', background: paymentMethod === 'twint' ? '#f0fdf4' : 'white' }}>
                                    <input type="radio" name="payment" value="twint" checked={paymentMethod === 'twint'} onChange={() => setPaymentMethod('twint')} className="hidden" />
                                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: paymentMethod === 'twint' ? '#166534' : '#d1d5db' }}>
                                        {paymentMethod === 'twint' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#166534' }} />}
                                    </div>
                                    <span style={{ fontSize: 20 }}>📱</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-[#2c2c2c]">Twint</p>
                                        <p className="text-xs text-black/40">Paiement mobile Twint</p>
                                    </div>
                                    <div className="hidden sm:flex items-center shrink-0"><TwintLogo /></div>
                                </label>
                            </div>

                            {/* CODE PROMO */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                                    <FiTag style={{ color: '#e63946' }} /> Code promo
                                </h2>
                                {promoStatus === 'valid' && promoResult ? (
                                    <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#dcfce7' }}>
                                                <FiCheck size={18} style={{ color: '#166534' }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-[#166534]">Code {promoResult.promoCode} appliqué ✅</p>
                                                <p className="text-xs text-black/50">
                                                    Réduction de <strong style={{ color: '#166534' }}>{promoResult.label}</strong>
                                                    {' '}— économies de <strong style={{ color: '#166534' }}>{fmt(promoResult.discountAmount)}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={handleRemovePromo}
                                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors shrink-0" style={{ color: '#dc2626' }}>
                                            <FiX size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1 min-w-0">
                                                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" value={promoInput}
                                                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                                                    placeholder="Code promo..."
                                                    className={`${inputClass} pl-10 uppercase tracking-wider`}
                                                    style={{ border: `2px solid ${promoStatus === 'error' ? '#fca5a5' : '#e5e7eb'}` }}
                                                    onFocus={onFocus}
                                                    onBlur={e => (e.target.style.borderColor = promoStatus === 'error' ? '#fca5a5' : '#e5e7eb')} />
                                            </div>
                                            <button type="button" onClick={handleApplyPromo}
                                                disabled={promoStatus === 'loading' || !promoInput.trim()}
                                                className="px-4 sm:px-5 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 shrink-0"
                                                style={{ background: '#166534' }}>
                                                {promoStatus === 'loading' ? '...' : 'Appliquer'}
                                            </button>
                                        </div>
                                        {promoStatus === 'error' && (
                                            <p className="text-xs mt-2 font-semibold flex items-center gap-1" style={{ color: '#dc2626' }}>
                                                ❌ {promoError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── COLONNE DROITE — RÉSUMÉ ───────────────────── */}
                        <div className="lg:col-span-1 order-first lg:order-last">
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] lg:sticky lg:top-4">
                                <h2 className="text-base sm:text-lg font-bold text-[#2c2c2c] mb-5">Récapitulatif</h2>

                                {/* Items */}
                                <div className="space-y-3 mb-5 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                                    {panier.map(item => (
                                        <div key={item.variant_id} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                                                {item.image
                                                    ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                                    : <span className="text-lg">🌿</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#2c2c2c] truncate">{item.product_name}</p>
                                                <p className="text-xs text-black/40">× {item.quantity}</p>
                                            </div>
                                            <span className="text-xs font-bold shrink-0" style={{ color: '#166534' }}>
                                                {fmt(parseFloat(item.price) * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Prix */}
                                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Sous-total</span>
                                        <span className={discountAmount > 0 ? 'line-through text-black/35' : ''}>{fmt(totalPrix)}</span>
                                    </div>
                                    {discountAmount > 0 && promoResult && (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#166534' }}>
                                                    <FiTag size={12} /> {promoResult.promoCode}
                                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#dcfce7', color: '#166534' }}>{promoResult.label}</span>
                                                </span>
                                                <span className="font-bold" style={{ color: '#166534' }}>-{fmt(discountAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-black/60">
                                                <span>Après réduction</span>
                                                <span className="font-semibold text-[#2c2c2c]">{fmt(subtotalAfterPromo)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Livraison</span>
                                        {shippingInfo ? (
                                            <span className="font-semibold" style={{ color: '#166534' }}>
                                                {shippingInfo.is_free ? 'Gratuite' : fmt(shippingInfo.shipping_cost)}
                                            </span>
                                        ) : (
                                            <span className="text-black/40 text-xs italic">Calcul en cours…</span>
                                        )}
                                    </div>
                                    {shippingInfo && !shippingInfo.is_free && shippingInfo.remaining_for_free > 0 && (
                                        <div className="rounded-lg px-2 py-1.5 text-xs" style={{ background: '#f0fdf4', color: '#166534' }}>
                                            🚚 Plus que <strong>{fmt(shippingInfo.remaining_for_free)}</strong> pour la livraison gratuite
                                        </div>
                                    )}
                                    <div className="flex justify-between font-extrabold text-base sm:text-lg text-[#2c2c2c] pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <div className="text-right">
                                            {discountAmount > 0 && (
                                                <p className="text-xs line-through text-black/30 font-normal">{fmt(totalPrix + shippingCost)}</p>
                                            )}
                                            <span style={{ color: '#166534' }}>{fmt(finalTotal)}</span>
                                        </div>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold" style={{ background: '#dcfce7', color: '#166534' }}>
                                            🎉 Vous économisez {fmt(discountAmount)} !
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-sm sm:text-base disabled:opacity-50 hover:scale-105"
                                    style={{ background: 'linear-gradient(135deg, #166534, #15803d)', boxShadow: '0 4px 20px rgba(22,101,52,0.4)' }}>
                                    {loading ? '⏳ Traitement...' : '💳 Continuer vers le paiement →'}
                                </button>
                                <p className="text-xs text-center text-black/30 mt-3 flex items-center justify-center gap-1">
                                    <FiLock size={11} /> Paiement 100% sécurisé
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// WRAPPER
// ════════════════════════════════════════════════════════════
const Checkout = () => {
    const [phase,        setPhase]        = useState('form');
    const [clientSecret, setClientSecret] = useState(null);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [promoResult,  setPromoResult]  = useState(null);

    const handleStripeOrderCreated = (order, secret, promo) => {
        setCreatedOrder(order);
        setClientSecret(secret);
        setPromoResult(promo);
        setPhase('payment');
    };

    if (phase === 'payment' && clientSecret) {
        return (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                <StripePaymentStep
                    order={createdOrder}
                    promoResult={promoResult}
                    onBack={() => { setPhase('form'); setClientSecret(null); }}
                />
            </Elements>
        );
    }

    return <CheckoutForm onStripeOrderCreated={handleStripeOrderCreated} />;
};

export default Checkout;