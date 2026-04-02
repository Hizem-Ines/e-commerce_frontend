import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/authContext';
import { createOrder, createGuestOrder } from '../../services/orderService';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiTruck, FiChevronRight } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const VILLES = [
    'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabès',
    'Ariana', 'Kairouan', 'Nabeul', 'Monastir', 'Mahdia',
    'Tozeur', 'Kasserine', 'Gafsa', 'Médenine', 'Beja'
];

const Checkout = () => {
    const { panier, totalPrix, viderPanier } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

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

    const [clientSecret, setClientSecret] = useState(null);
    const [pendingOrder, setPendingOrder] = useState(null);

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
            payment_method:   paymentMethod,
            shipping_full_name: user ? user.name : formData.name, 
            shipping_address: formData.shipping_address,
            shipping_city:    formData.shipping_city,
            shipping_country: 'TN',
            notes:            formData.notes      || undefined,
            promo_code:       formData.promo_code || undefined,
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
                setPendingOrder(order);
                setClientSecret(payment.client_secret);
                setLoading(false);
            return;
            }

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
    if (clientSecret) {
        return (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentStep
                    order={pendingOrder}
                    onSuccess={() => {
                        viderPanier();
                        navigate(`/commande-confirmee/${pendingOrder.id}`, {
                            state: { order: pendingOrder, payment: { method: 'stripe' } }
                        });
                    }}
                    onError={(msg) => {
                        setClientSecret(null);
                        setError(msg);
                    }}
                />
            </Elements>
        );
    }
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
                                        {/* NOM */}
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
                                            {/* EMAIL */}
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
                                                <p className="text-xs text-black/30 mt-1">
                                                    ✉️ Un email de confirmation vous sera envoyé
                                                </p>
                                            </div>

                                            {/* TÉLÉPHONE */}
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
                                        <div>
                                            <p className="font-bold text-sm text-[#2c2c2c]">Paiement à la livraison</p>
                                            <p className="text-xs text-black/40">Payez en espèces à la réception</p>
                                        </div>
                                        <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
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
                                        <div>
                                            <p className="font-bold text-sm text-[#2c2c2c]">Carte bancaire</p>
                                            <p className="text-xs text-black/40">Visa, Mastercard — paiement sécurisé via Stripe</p>
                                        </div>
                                        <div className="ml-auto flex gap-1">
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">VISA</span>
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">MC</span>
                                        </div>
                                    </label>
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

                                <button type="submit" disabled={loading}
                                    className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-base disabled:opacity-50 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #166534, #15803d)',
                                        boxShadow: '0 4px 20px rgba(22,101,52,0.4)'
                                    }}>
                                    {loading ? '⏳ Traitement...'
                                        : paymentMethod === 'stripe' ? '💳 Payer maintenant →'
                                        : '✅ Confirmer la commande →'}
                                </button>

                                <p className="text-xs text-center text-black/30 mt-3">🔒 Paiement 100% sécurisé</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StripePaymentStep = ({ order, onSuccess, onError }) => {
    const stripe   = useStripe();
    const elements = useElements();
    const [paying, setPaying] = useState(false);

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setPaying(true);
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.origin },
            redirect: 'if_required',
        });
        if (error) {
            onError(error.message);
        } else {
            onSuccess();
        }
        setPaying(false);
    };

    return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                    Paiement sécurisé
                </h2>
                <p className="text-sm text-black/50 mb-6">
                    Commande #{order.id?.slice(0, 8).toUpperCase()} — {parseFloat(order.total_price).toFixed(2)} DT
                </p>
                <div className="border-2 border-gray-200 rounded-xl p-4 mb-6 focus-within:border-[#166534] transition-colors">
                    <CardElement options={{ style: { base: { fontSize: '15px', color: '#2c2c2c' } } }} />
                </div>
                <button onClick={handlePay} disabled={paying || !stripe}
                    className="w-full text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    {paying ? '⏳ Traitement...' : `💳 Payer ${parseFloat(order.total_price).toFixed(2)} DT`}
                </button>
            </div>
        </div>
    );
};

export default Checkout;