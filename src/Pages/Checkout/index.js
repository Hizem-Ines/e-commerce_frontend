import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/authContext';
import { createOrder, createGuestOrder } from '../../services/orderService';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiTruck, FiChevronRight, FiLock } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const VILLES = [
    'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabès',
    'Ariana', 'Kairouan', 'Nabeul', 'Monastir', 'Mahdia',
    'Tozeur', 'Kasserine', 'Gafsa', 'Médenine', 'Beja'
];

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '15px',
            color: '#2c2c2c',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#dc2626' },
    },
};

// ── Logos SVG Visa & Mastercard ──────────────────────────────────────────────
const VisaLogo = () => (
    <svg height="22" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
        <rect width="780" height="500" rx="40" fill="#1A1F71" />
        <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.7-191.3c-10.6-3.9-27.2-8.1-47.9-8.1-52.8 0-90 26.5-90.3 64.4-.3 28 26.7 43.6 47.1 52.9 20.9 9.5 27.9 15.6 27.8 24.1-.1 13-16.7 18.9-32.1 18.9-21.5 0-32.9-2.9-50.6-10.1l-6.9-3.1-7.5 43.7c12.5 5.4 35.5 10.1 59.4 10.4 56 0 92.4-26.1 92.8-66.6.2-22.2-14.1-39.1-45-53-18.8-9-30.3-15-30.2-24.2 0-8.1 9.7-16.8 30.8-16.8 17.6-.3 30.3 3.5 40.2 7.4l4.8 2.3 7.6-44.2zm137 1.3h-41.3c-12.8 0-22.3 3.5-27.9 16.3l-79.2 178.8h56l11.2-29.2 68.3.1c1.6 6.8 6.5 29.1 6.5 29.1h49.5l-43.1-195.1zm-77.9 128.3l21.3-54.7 3.5-9.5c2.1 5.2 5.8 14.7 10 29.8l6.9 34.4h-41.7zm-330.1-128.3l-52.4 133.5-5.6-27c-9.8-31.2-40.2-65.1-74.3-82l47.9 171.2 56.5-.1 84.1-195.6h-56.2z" fill="#fff" />
        <path d="M146 152.8H60.3l-.8 4.5c66.8 16.2 111 55.3 129.4 102.3l-18.7-89.7c-3.2-12.3-12.5-15.9-24.2-17.1z" fill="#F2AE14" />
    </svg>
);

const MastercardLogo = () => (
    <svg height="22" viewBox="0 0 152.4 108" xmlns="http://www.w3.org/2000/svg">
        <rect width="152.4" height="108" rx="8" fill="#252525" />
        <circle cx="60.2" cy="54" r="30" fill="#EB001B" />
        <circle cx="92.2" cy="54" r="30" fill="#F79E1B" />
        <path d="M76.2 32.3c7 5.3 11.5 13.6 11.5 22.7s-4.5 17.4-11.5 22.7c-7-5.3-11.5-13.6-11.5-22.7s4.5-17.4 11.5-22.7z" fill="#FF5F00" />
    </svg>
);

// ── Composant interne qui utilise useStripe / useElements ────────────────────
const CheckoutForm = () => {
    const { panier, totalPrix, viderPanier } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');

    const [formData, setFormData] = useState({
        name:             user?.name    || '',
        email:            user?.email   || '',
        phone:            user?.phone   || '',
        shipping_address: user?.address || '',
        shipping_city:    user?.city    || '',
        notes:            '',
        promo_code:       '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (panier.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-3">Votre panier est vide</h2>
                <Link to="/produits" className="text-white font-bold px-8 py-3 rounded-full no-underline"
                    style={{ background: '#166534' }}>
                    Voir les produits
                </Link>
            </div>
        );
    }

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
            shipping_address:   formData.shipping_address,
            shipping_city:      formData.shipping_city,
            shipping_country:   'TN',
            notes:              formData.notes      || undefined,
            promo_code:         formData.promo_code || undefined,
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

            // ── Paiement Stripe ──────────────────────────────
            if (payment.method === 'stripe') {
                if (!stripe || !elements) {
                    setError('Stripe n\'est pas encore chargé. Veuillez réessayer.');
                    setLoading(false);
                    return;
                }

                const { error: stripeError } = await stripe.confirmPayment({
                    elements,
                    clientSecret: payment.client_secret,
                    confirmParams: { return_url: window.location.origin },
                    redirect: 'if_required',
                });

                if (stripeError) {
                    setError(stripeError.message);
                    setLoading(false);
                    return;
                }

                viderPanier();
                navigate(`/commande-confirmee/${order.id}`, {
                    state: { order, payment: { method: 'stripe' } }
                });
                return;
            }

            // ── Paiement COD ─────────────────────────────────
            viderPanier();
            navigate(`/commande-confirmee/${order.id}`, {
                state: { order, payment }
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

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

                        {/* ── COLONNE GAUCHE ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* INFOS GUEST */}
                            {!user && (
                                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                    <h2 className="text-lg font-bold text-[#2c2c2c] mb-1">Vos informations</h2>
                                    <p className="text-xs text-black/40 mb-5">
                                        Si vous avez déjà un compte, la commande sera rattachée automatiquement.{' '}
                                        <Link to="/connexion" className="font-bold no-underline" style={{ color: '#166534' }}>
                                            Se connecter
                                        </Link>
                                        {' '}— Sinon, un compte sera créé avec ces informations.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet *</label>
                                            <div className="relative">
                                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" name="name" value={formData.name}
                                                    onChange={handleChange} required
                                                    placeholder="Votre nom complet"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                                    style={{ border: '2px solid #e5e7eb' }}
                                                    onFocus={e => e.target.style.borderColor = '#166534'}
                                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                                        style={{ border: '2px solid #e5e7eb' }}
                                                        onFocus={e => e.target.style.borderColor = '#166534'}
                                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                                </div>
                                                <p className="text-xs text-black/30 mt-1">✉️ Email de confirmation</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone *</label>
                                                <div className="relative">
                                                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input type="tel" name="phone" value={formData.phone}
                                                        onChange={handleChange} required
                                                        placeholder="+216 XX XXX XXX"
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                                        style={{ border: '2px solid #e5e7eb' }}
                                                        onFocus={e => e.target.style.borderColor = '#166534'}
                                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse *</label>
                                        <div className="relative">
                                            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" name="shipping_address"
                                                value={formData.shipping_address}
                                                onChange={handleChange} required
                                                placeholder="Rue, numéro, quartier..."
                                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                                style={{ border: '2px solid #e5e7eb' }}
                                                onFocus={e => e.target.style.borderColor = '#166534'}
                                                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Ville *</label>
                                        <select name="shipping_city" value={formData.shipping_city}
                                            onChange={handleChange} required
                                            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                            style={{ border: '2px solid #e5e7eb' }}
                                            onFocus={e => e.target.style.borderColor = '#166534'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
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
                                            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition resize-none"
                                            style={{ border: '2px solid #e5e7eb' }}
                                            onFocus={e => e.target.style.borderColor = '#166534'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
                                            border: paymentMethod === 'cod' ? '2px solid #166534' : '2px solid #e5e7eb',
                                            background: paymentMethod === 'cod' ? '#f0fdf4' : 'white'
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
                                            border: paymentMethod === 'stripe' ? '2px solid #166534' : '2px solid #e5e7eb',
                                            background: paymentMethod === 'stripe' ? '#f0fdf4' : 'white'
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

                                    {/* CARD ELEMENT — affiché directement sous le choix Stripe */}
                                    {paymentMethod === 'stripe' && (
                                        <div className="rounded-xl p-4 transition-all duration-200"
                                            style={{ background: '#f8fafc', border: '2px solid #e5e7eb' }}>
                                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
                                                Informations de carte
                                            </p>
                                            <div className="rounded-lg p-3 bg-white transition-all"
                                                style={{ border: '1.5px solid #e5e7eb' }}>
                                                <CardElement options={CARD_ELEMENT_OPTIONS} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <FiLock size={11} style={{ color: '#6b7280' }} />
                                                <p className="text-xs text-black/40">
                                                    Vos données sont chiffrées et sécurisées par Stripe. GOFFA ne stocke jamais vos informations bancaires.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CODE PROMO */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-4">🎁 Code promo (optionnel)</h2>
                                <div className="flex gap-3">
                                    <input type="text" name="promo_code" value={formData.promo_code}
                                        onChange={handleChange}
                                        placeholder="Entrez votre code..."
                                        className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                        style={{ border: '2px solid #e5e7eb' }}
                                        onFocus={e => e.target.style.borderColor = '#166534'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    <button type="button"
                                        className="px-5 py-3 rounded-xl font-bold text-sm text-white"
                                        style={{ background: '#166534' }}>
                                        Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── COLONNE DROITE — RÉSUMÉ ── */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">
                                <h2 className="text-lg font-bold text-[#2c2c2c] mb-5">Récapitulatif</h2>

                                {/* ITEMS */}
                                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
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

                                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Sous-total</span>
                                        <span>{totalPrix.toFixed(2)} DT</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-black/60">
                                        <span>Livraison</span>
                                        <span className="font-semibold" style={{ color: '#166534' }}>Gratuite</span>
                                    </div>
                                    <div className="flex justify-between font-extrabold text-lg text-[#2c2c2c] pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <span style={{ color: '#166534' }}>{totalPrix.toFixed(2)} DT</span>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading || (paymentMethod === 'stripe' && !stripe)}
                                    className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-base disabled:opacity-50 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #166534, #15803d)',
                                        boxShadow: '0 4px 20px rgba(22,101,52,0.4)'
                                    }}>
                                    {loading
                                        ? '⏳ Traitement...'
                                        : paymentMethod === 'stripe'
                                            ? '💳 Payer maintenant →'
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

// ── Wrapper qui fournit le contexte Stripe dès le départ ─────────────────────
const Checkout = () => (
    <Elements stripe={stripePromise}>
        <CheckoutForm />
    </Elements>
);

export default Checkout;