import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/authContext';
import { createOrder, createGuestOrder, validatePromo } from '../../services/orderService';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard,
    FiTruck, FiChevronRight, FiLock, FiTag, FiX, FiCheck,
    FiArrowLeft,
} from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const VILLES = [
    'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabès',
    'Ariana', 'Kairouan', 'Nabeul', 'Monastir', 'Mahdia',
    'Tozeur', 'Kasserine', 'Gafsa', 'Médenine', 'Beja',
];

// ── Apparence Stripe personnalisée aux couleurs GOFFA ────────────────────────
const stripeAppearance = {
    theme: 'stripe',
    variables: {
        colorPrimary:      '#166534',
        colorBackground:   '#ffffff',
        colorText:         '#2c2c2c',
        colorDanger:       '#dc2626',
        fontFamily:        'system-ui, -apple-system, sans-serif',
        borderRadius:      '10px',
        spacingUnit:       '4px',
    },
    rules: {
        '.Input': {
            border:    '2px solid #e5e7eb',
            boxShadow: 'none',
            padding:   '10px 14px',
        },
        '.Input:focus': { border: '2px solid #166534', boxShadow: 'none' },
        '.Label':       { fontWeight: '600', fontSize: '12px', color: '#4b5563' },
    },
};

// ── Logos SVG ─────────────────────────────────────────────────────────────────
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


// ════════════════════════════════════════════════════════════
// ÉTAPE 2 — Formulaire de paiement Stripe (PaymentElement)
// Rendu dans <Elements clientSecret={...}>
// ════════════════════════════════════════════════════════════
const StripePaymentStep = ({ order, promoResult, onBack }) => {
    const stripe    = useStripe();
    const elements  = useElements();
    const navigate  = useNavigate();
    const { viderPanier } = useCart();

    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setLoading(true);
        setError('');

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // URL de retour si 3D Secure est requis
                return_url: `${window.location.origin}/commande-confirmee/${order.id}`,
            },
            redirect: 'if_required', // ✅ Pas de redirect si pas de 3DS
        });

        if (stripeError) {
            setError(stripeError.message);
            setLoading(false);
            return;
        }

        // Paiement réussi sans redirect (pas de 3DS nécessaire)
        if (paymentIntent?.status === 'succeeded') {
            viderPanier();
            navigate(`/commande-confirmee/${order.id}`, {
                state: { order, payment: { method: 'stripe' } },
            });
        }
    };

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-lg">

                {/* En-tête */}
                <div className="mb-8">
                    <button onClick={onBack}
                        className="flex items-center gap-2 text-sm font-semibold mb-4 hover:text-[#166534] transition-colors"
                        style={{ color: '#6b7280' }}>
                        <FiArrowLeft size={16} /> Retour à la commande
                    </button>
                    <h1 className="text-3xl font-bold font-serif text-[#2c2c2c]">Paiement sécurisé</h1>
                    <p className="text-sm text-black/40 mt-1">Commande #{order.order_number}</p>
                </div>

                {/* Récapitulatif rapide */}
                <div className="bg-white rounded-2xl p-5 mb-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)]">
                    <div className="flex justify-between items-center text-sm text-black/60 mb-2">
                        <span>Sous-total</span>
                        <span>{parseFloat(order.subtotal).toFixed(2)} DT</span>
                    </div>

                    {order.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-[#2d5a27] font-semibold flex items-center gap-1">
                                <FiTag size={13} />
                                Code promo
                                {promoResult?.promoCode && (
                                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: '#dcfce7', color: '#166534' }}>
                                        {promoResult.promoCode}
                                    </span>
                                )}
                            </span>
                            <span className="text-[#2d5a27] font-bold">
                                -{parseFloat(order.discount_amount).toFixed(2)} DT
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-black/60 mb-3">
                        <span>Livraison</span>
                        <span className="font-semibold" style={{ color: '#166534' }}>Gratuite</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-extrabold text-[#2c2c2c]">Total</span>
                        <span className="text-xl font-black" style={{ color: '#166534' }}>
                            {parseFloat(order.total_price).toFixed(2)} DT
                        </span>
                    </div>
                </div>

                {/* Formulaire Stripe */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2 mb-5">
                        <FiCreditCard size={18} style={{ color: '#166534' }} />
                        <h2 className="text-base font-bold text-[#2c2c2c]">Informations de paiement</h2>
                    </div>

                    <PaymentElement options={{ layout: 'tabs' }} />

                    {error && (
                        <div className="mt-4 px-4 py-3 rounded-xl text-sm font-semibold"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            ❌ {error}
                        </div>
                    )}

                    <button onClick={handlePay} disabled={loading || !stripe}
                        className="w-full text-white font-bold py-4 rounded-xl mt-5 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] text-base"
                        style={{
                            background:  'linear-gradient(135deg, #166534, #15803d)',
                            boxShadow:   '0 4px 20px rgba(22,101,52,0.4)',
                        }}>
                        {loading
                            ? '⏳ Traitement en cours...'
                            : `💳 Payer ${parseFloat(order.total_price).toFixed(2)} DT`}
                    </button>

                    <p className="text-xs text-center text-black/30 mt-3 flex items-center justify-center gap-1">
                        <FiLock size={11} /> Paiement sécurisé par Stripe · Vos données ne sont jamais stockées
                    </p>
                </div>

                {/* Logos cartes */}
                <div className="flex items-center justify-center gap-3 mt-5 opacity-60">
                    <VisaLogo />
                    <MastercardLogo />
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
    const navigate  = useNavigate();

    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');

    const [formData, setFormData] = useState({
        name:             user?.name    || '',
        email:            user?.email   || '',
        phone:            user?.phone   || '',
        shipping_address: user?.address || '',
        shipping_city:    user?.city    || '',
        notes:            '',
    });

    // ── Promo code ────────────────────────────────────────
    const [promoInput,  setPromoInput]  = useState('');
    const [promoStatus, setPromoStatus] = useState(null); // null | 'loading' | 'valid' | 'error'
    const [promoResult, setPromoResult] = useState(null); // { discountAmount, label, promoCode, ... }
    const [promoError,  setPromoError]  = useState('');

    const discountAmount = promoResult?.discountAmount || 0;
    const finalTotal     = totalPrix - discountAmount;

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // ── Valider le code promo ─────────────────────────────
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
        setPromoInput('');
        setPromoResult(null);
        setPromoStatus(null);
        setPromoError('');
    };

    // ── Panier vide ───────────────────────────────────────
    if (panier.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-3">Votre panier est vide</h2>
                <Link to="/produits"
                    className="text-white font-bold px-8 py-3 rounded-full no-underline"
                    style={{ background: '#166534' }}>
                    Voir les produits
                </Link>
            </div>
        );
    }

    // ── Soumission ────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const items = panier.map(item => ({
            variant_id: item.variant_id,
            quantity:   item.quantity,
        }));

        const orderData = {
            items,
            payment_method:     paymentMethod,
            shipping_full_name: user ? user.name : formData.name,
            shipping_phone:     user ? user.phone : formData.phone,
            shipping_address:   formData.shipping_address,
            shipping_city:      formData.shipping_city,
            shipping_country:   'TN',
            notes:              formData.notes      || undefined,
            promo_code:         promoResult?.promoCode || undefined,
        };

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

            if (payment.method === 'stripe') {
                // ✅ Passer à l'étape 2 avec le clientSecret
                onStripeOrderCreated(order, payment.client_secret, promoResult);
                return;
            }

            // COD — confirmation directe
            viderPanier();
            navigate(`/commande-confirmee/${order.id}`, {
                state: { order, payment: { method: 'cod' } },
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    // ── Input style helper ────────────────────────────────
    const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition";
    const inputStyle = {
        border: '2px solid #e5e7eb',
        onFocus: '#166534',
    };
    const onFocus = e => (e.target.style.borderColor = '#166534');
    const onBlur  = e => (e.target.style.borderColor = '#e5e7eb');

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* TITRE */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-black/50 mb-3">
                        <Link to="/panier" className="hover:text-[#166534] no-underline">Panier</Link>
                        <FiChevronRight size={14} />
                        <span className="text-[#166534] font-bold">Commande</span>
                    </div>
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c]">Finaliser la commande</h1>
                </div>

                {error && (
                    <div className="mb-6 px-5 py-4 rounded-xl text-sm font-semibold"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* ── COLONNE GAUCHE ─────────────────────────────── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* INFOS GUEST */}
                            {!user && (
                                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                    <h2 className="text-lg font-bold text-[#2c2c2c] mb-1">Vos informations</h2>
                                    <p className="text-xs text-black/40 mb-5">
                                        Si vous avez déjà un compte, la commande sera rattachée automatiquement.{' '}
                                        <Link to="/connexion" className="font-bold no-underline" style={{ color: '#166534' }}>
                                            Se connecter
                                        </Link>{' '}
                                        — Sinon, un compte sera créé avec ces informations.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet *</label>
                                            <div className="relative">
                                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" name="name" value={formData.name}
                                                    onChange={handleChange} required
                                                    placeholder="Votre nom complet"
                                                    className={`${inputClass} pl-10`}
                                                    style={{ border: '2px solid #e5e7eb' }}
                                                    onFocus={onFocus} onBlur={onBlur} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Email *</label>
                                                <div className="relative">
                                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="email" name="email" value={formData.email}
                                                        onChange={handleChange} required
                                                        placeholder="votre@email.com"
                                                        className={`${inputClass} pl-10`}
                                                        style={{ border: '2px solid #e5e7eb' }}
                                                        onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                                <p className="text-xs text-black/30 mt-1">✉️ Vous recevrez un email de confirmation</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone *</label>
                                                <div className="relative">
                                                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="tel" name="phone" value={formData.phone}
                                                        onChange={handleChange} required
                                                        placeholder="+216 XX XXX XXX"
                                                        className={`${inputClass} pl-10`}
                                                        style={{ border: '2px solid #e5e7eb' }}
                                                        onFocus={onFocus} onBlur={onBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADRESSE DE LIVRAISON */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-5 flex items-center gap-2">
                                    <FiMapPin style={{ color: '#e63946' }} /> Adresse de livraison
                                </h2>

                                {/* Téléphone pour user connecté */}
                                {user && (
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="tel" name="phone" value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+216 XX XXX XXX"
                                                className={`${inputClass} pl-10`}
                                                style={{ border: '2px solid #e5e7eb' }}
                                                onFocus={onFocus} onBlur={onBlur} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse *</label>
                                        <div className="relative">
                                            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" name="shipping_address"
                                                value={formData.shipping_address}
                                                onChange={handleChange} required
                                                placeholder="Rue, numéro, quartier..."
                                                className={`${inputClass} pl-10`}
                                                style={{ border: '2px solid #e5e7eb' }}
                                                onFocus={onFocus} onBlur={onBlur} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Ville *</label>
                                        <select name="shipping_city" value={formData.shipping_city}
                                            onChange={handleChange} required
                                            className={inputClass}
                                            style={{ border: '2px solid #e5e7eb' }}
                                            onFocus={onFocus} onBlur={onBlur}>
                                            <option value="">Choisir une ville</option>
                                            {VILLES.map(v => (
                                                <option key={v} value={v.toLowerCase()}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Notes (optionnel)</label>
                                        <textarea name="notes" value={formData.notes}
                                            onChange={handleChange} rows={2}
                                            placeholder="Instructions spéciales pour la livraison..."
                                            className={`${inputClass} resize-none`}
                                            style={{ border: '2px solid #e5e7eb' }}
                                            onFocus={onFocus} onBlur={onBlur} />
                                    </div>
                                </div>
                            </div>

                            {/* MÉTHODE DE PAIEMENT */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-5 flex items-center gap-2">
                                    <FiCreditCard style={{ color: '#e63946' }} /> Méthode de paiement
                                </h2>
                                <div className="space-y-3">

                                    {/* COD */}
                                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                                        style={{
                                            border:     paymentMethod === 'cod' ? '2px solid #166534' : '2px solid #e5e7eb',
                                            background: paymentMethod === 'cod' ? '#f0fdf4' : 'white',
                                        }}>
                                        <input type="radio" name="payment" value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="hidden" />
                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                                            style={{ borderColor: paymentMethod === 'cod' ? '#166534' : '#d1d5db' }}>
                                            {paymentMethod === 'cod' && (
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#166534' }} />
                                            )}
                                        </div>
                                        <FiTruck size={20} style={{ color: '#166534' }} />
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-[#2c2c2c]">Paiement à la livraison</p>
                                            <p className="text-xs text-black/40">Payez en espèces à la réception</p>
                                        </div>
                                        <span className="text-xs font-bold px-3 py-1 rounded-full"
                                            style={{ background: '#dcfce7', color: '#166534' }}>Gratuit</span>
                                    </label>

                                    {/* STRIPE */}
                                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                                        style={{
                                            border:     paymentMethod === 'stripe' ? '2px solid #166534' : '2px solid #e5e7eb',
                                            background: paymentMethod === 'stripe' ? '#f0fdf4' : 'white',
                                        }}>
                                        <input type="radio" name="payment" value="stripe"
                                            checked={paymentMethod === 'stripe'}
                                            onChange={() => setPaymentMethod('stripe')}
                                            className="hidden" />
                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                                            style={{ borderColor: paymentMethod === 'stripe' ? '#166534' : '#d1d5db' }}>
                                            {paymentMethod === 'stripe' && (
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#166534' }} />
                                            )}
                                        </div>
                                        <FiCreditCard size={20} style={{ color: '#6366f1' }} />
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-[#2c2c2c]">Carte bancaire</p>
                                            <p className="text-xs text-black/40">Visa, Mastercard — paiement sécurisé</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <VisaLogo />
                                            <MastercardLogo />
                                        </div>
                                    </label>

                                    {paymentMethod === 'stripe' && (
                                        <div className="rounded-xl p-3 flex items-start gap-2"
                                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                            <span className="text-base">ℹ️</span>
                                            <p className="text-xs text-blue-700">
                                                Vous serez redirigé vers un formulaire de paiement sécurisé Stripe
                                                après validation de votre commande.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── CODE PROMO ────────────────────────────── */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                                    <FiTag style={{ color: '#e63946' }} /> Code promo
                                </h2>

                                {/* Code promo valide — affichage récapitulatif */}
                                {promoStatus === 'valid' && promoResult ? (
                                    <div className="rounded-xl p-4 flex items-center justify-between"
                                        style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                                                style={{ background: '#dcfce7' }}>
                                                <FiCheck size={18} style={{ color: '#166534' }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-[#166534]">
                                                    Code {promoResult.promoCode} appliqué ✅
                                                </p>
                                                <p className="text-xs text-black/50">
                                                    Réduction de{' '}
                                                    <strong style={{ color: '#166534' }}>
                                                        {promoResult.label}
                                                    </strong>
                                                    {' '}— vous économisez{' '}
                                                    <strong style={{ color: '#166534' }}>
                                                        {promoResult.discountAmount.toFixed(2)} DT
                                                    </strong>
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={handleRemovePromo}
                                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                                            style={{ color: '#dc2626' }}>
                                            <FiX size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={promoInput}
                                                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                                                    placeholder="Code promo..."
                                                    className={`${inputClass} pl-10 uppercase tracking-wider`}
                                                    style={{ border: `2px solid ${promoStatus === 'error' ? '#fca5a5' : '#e5e7eb'}` }}
                                                    onFocus={onFocus}
                                                    onBlur={e => (e.target.style.borderColor = promoStatus === 'error' ? '#fca5a5' : '#e5e7eb')}
                                                />
                                            </div>
                                            <button type="button" onClick={handleApplyPromo}
                                                disabled={promoStatus === 'loading' || !promoInput.trim()}
                                                className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                                                style={{ background: '#166534' }}>
                                                {promoStatus === 'loading' ? '...' : 'Appliquer'}
                                            </button>
                                        </div>
                                        {promoStatus === 'error' && (
                                            <p className="text-xs mt-2 font-semibold flex items-center gap-1"
                                                style={{ color: '#dc2626' }}>
                                                ❌ {promoError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── COLONNE DROITE — RÉSUMÉ ─────────────────── */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-5">Récapitulatif</h2>

                                {/* Items */}
                                <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
                                    {panier.map(item => (
                                        <div key={item.variant_id} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                                                style={{ background: '#ecfdf5' }}>
                                                {item.image
                                                    ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                                    : <span className="text-lg">🌿</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#2c2c2c] truncate">{item.product_name}</p>
                                                <p className="text-xs text-black/40">× {item.quantity}</p>
                                            </div>
                                            <span className="text-xs font-bold shrink-0" style={{ color: '#166534' }}>
                                                {(parseFloat(item.price) * item.quantity).toFixed(2)} DT
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Prix */}
                                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Sous-total</span>
                                        <span className={discountAmount > 0 ? 'line-through text-black/35' : ''}>
                                            {totalPrix.toFixed(2)} DT
                                        </span>
                                    </div>

                                    {/* ✅ Réduction visible */}
                                    {discountAmount > 0 && promoResult && (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-1.5 font-semibold"
                                                    style={{ color: '#166534' }}>
                                                    <FiTag size={12} />
                                                    {promoResult.promoCode}
                                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                                        style={{ background: '#dcfce7', color: '#166534' }}>
                                                        {promoResult.label}
                                                    </span>
                                                </span>
                                                <span className="font-bold" style={{ color: '#166534' }}>
                                                    -{discountAmount.toFixed(2)} DT
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-black/60">
                                                <span>Après réduction</span>
                                                <span className="font-semibold text-[#2c2c2c]">
                                                    {(totalPrix - discountAmount).toFixed(2)} DT
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Livraison</span>
                                        <span className="font-semibold" style={{ color: '#166534' }}>Gratuite</span>
                                    </div>

                                    <div className="flex justify-between font-extrabold text-lg text-[#2c2c2c] pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <div className="text-right">
                                            {discountAmount > 0 && (
                                                <p className="text-xs line-through text-black/30 font-normal">
                                                    {totalPrix.toFixed(2)} DT
                                                </p>
                                            )}
                                            <span style={{ color: '#166534' }}>{finalTotal.toFixed(2)} DT</span>
                                        </div>
                                    </div>

                                    {/* Badge économies */}
                                    {discountAmount > 0 && (
                                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold"
                                            style={{ background: '#dcfce7', color: '#166534' }}>
                                            🎉 Vous économisez {discountAmount.toFixed(2)} DT sur cette commande !
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-base disabled:opacity-50 hover:scale-105"
                                    style={{
                                        background:  'linear-gradient(135deg, #166534, #15803d)',
                                        boxShadow:   '0 4px 20px rgba(22,101,52,0.4)',
                                    }}>
                                    {loading
                                        ? '⏳ Traitement...'
                                        : paymentMethod === 'stripe'
                                            ? '💳 Continuer vers le paiement →'
                                            : '✅ Confirmer la commande →'}
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
// WRAPPER — Gère les deux phases
// Phase 'form'    → CheckoutForm
// Phase 'payment' → Elements(clientSecret) + StripePaymentStep
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

    const handleBack = () => {
        setPhase('form');
        setClientSecret(null);
        // On garde l'ordre créé en mémoire — pas de doublon car on n'a pas encore payé
    };

    if (phase === 'payment' && clientSecret) {
        return (
            <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance }}
            >
                <StripePaymentStep
                    order={createdOrder}
                    promoResult={promoResult}
                    onBack={handleBack}
                />
            </Elements>
        );
    }

    return (
        <CheckoutForm onStripeOrderCreated={handleStripeOrderCreated} />
    );
};

export default Checkout;