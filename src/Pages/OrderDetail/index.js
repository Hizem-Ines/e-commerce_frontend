import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSingleOrder, cancelOrder } from '../../services/orderService';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiTruck, FiX } from 'react-icons/fi';

const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: '#f59e0b', bg: '#fef3c7' },
    confirmed: { label: 'Confirmée',   color: '#3b82f6', bg: '#dbeafe' },
    shipped:   { label: 'Expédiée',    color: '#8b5cf6', bg: '#ede9fe' },
    delivered: { label: 'Livrée',      color: '#166534', bg: '#dcfce7' },
    cancelled: { label: 'Annulée',     color: '#dc2626', bg: '#fee2e2' },
};

const DELIVERY_STEPS = [
    { key: 'preparing', label: 'En préparation', icon: '📦' },
    { key: 'shipped',   label: 'Expédiée',       icon: '🚚' },
    { key: 'delivered', label: 'Livrée',          icon: '✅' },
];

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        getSingleOrder(orderId)
            .then(res => setOrder(res.data.order))
            .catch(() => setError('Commande introuvable.'))
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleCancel = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
        setCancelling(true);
        try {
            await cancelOrder(orderId);
            setOrder(prev => ({ ...prev, status: 'cancelled' }));
            setSuccessMsg('Commande annulée avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible d\'annuler cette commande.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setCancelling(false);
        }
    };

    // ── Calcule l'étape de livraison active ──────────────
    const getDeliveryStep = () => {
        const status = order?.delivery_status;
        if (status === 'delivered') return 2;
        if (status === 'shipped')   return 1;
        return 0;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-[#fdf6ec]">
                <div className="text-4xl animate-spin">🌿</div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-3">{error}</h2>
                <Link to="/profil" className="text-white font-bold px-6 py-3 rounded-xl no-underline"
                    style={{ background: '#166534' }}>
                    Retour au profil
                </Link>
            </div>
        );
    }

    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
    const canCancel = ['pending', 'confirmed'].includes(order.status);

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-3xl">

                {/* RETOUR */}
                <button onClick={() => navigate('/profil')}
                    className="flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-[#166534] mb-6 transition">
                    <FiArrowLeft size={16} /> Retour à mon profil
                </button>

                {/* TITRE */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-[#2c2c2c]">
                            Commande #{order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <p className="text-black/50 text-sm mt-1">
                            Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <span className="text-sm font-bold px-4 py-2 rounded-full"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                    </span>
                </div>

                {/* ALERTES */}
                {successMsg && (
                    <div className="mb-6 px-5 py-3 rounded-xl text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        ✅ {successMsg}
                    </div>
                )}
                {error && (
                    <div className="mb-6 px-5 py-3 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-700">
                        ❌ {error}
                    </div>
                )}

                <div className="space-y-5">

                    {/* ── SUIVI LIVRAISON ── */}
                    {order.status !== 'cancelled' && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <h2 className="text-lg font-bold text-[#2c2c2c] mb-6 flex items-center gap-2">
                                <FiTruck style={{ color: '#166534' }} /> Suivi de livraison
                            </h2>
                            <div className="flex items-center justify-between relative">
                                {/* Barre de progression */}
                                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
                                <div className="absolute top-5 left-0 h-1 bg-emerald-500 z-0 transition-all duration-500"
                                    style={{ width: `${getDeliveryStep() * 50}%` }} />

                                {DELIVERY_STEPS.map((step, i) => {
                                    const isActive   = i <= getDeliveryStep();
                                    const isCurrent  = i === getDeliveryStep();
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-all duration-300 ${
                                                isActive ? 'shadow-lg' : ''
                                            }`}
                                                style={{
                                                    background: isActive ? '#166534' : '#e5e7eb',
                                                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                                                }}>
                                                <span>{step.icon}</span>
                                            </div>
                                            <p className={`text-xs font-bold text-center ${isActive ? 'text-[#166534]' : 'text-black/30'}`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Infos tracking */}
                            {order.tracking_number && (
                                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                    <span className="text-black/50">Numéro de suivi</span>
                                    <span className="font-bold text-[#2c2c2c]">{order.tracking_number}</span>
                                </div>
                            )}
                            {order.carrier && (
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-black/50">Transporteur</span>
                                    <span className="font-bold text-[#2c2c2c]">{order.carrier}</span>
                                </div>
                            )}
                            {order.estimated_date && (
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-black/50">Livraison estimée</span>
                                    <span className="font-bold text-[#2c2c2c]">
                                        {new Date(order.estimated_date).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ARTICLES COMMANDÉS ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <h2 className="text-lg font-bold text-[#2c2c2c] mb-5 flex items-center gap-2">
                            <FiPackage style={{ color: '#166534' }} /> Articles commandés
                        </h2>
                        <div className="space-y-4">
                            {order.items?.map((item, i) => {
                                const images = item.images || [];
                                const image  = images[0]?.url || null;
                                const details = typeof item.variant_details === 'string'
                                    ? JSON.parse(item.variant_details)
                                    : item.variant_details || [];

                                return (
                                    <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                            style={{ background: '#ecfdf5' }}>
                                            {image
                                                ? <img src={image} alt={item.product_name} className="w-full h-full object-cover" />
                                                : <span className="text-2xl">🌿</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[#2c2c2c] mb-0.5">
                                                {item.product_name_fr || item.product_name}
                                            </p>
                                            {details.length > 0 && (
                                                <p className="text-xs text-black/40">
                                                    {details.map(d => `${d.attribute_type}: ${d.attribute_value}`).join(' · ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-black/40 mt-0.5">Quantité : {item.quantity}</p>
                                        </div>
                                        <span className="font-bold text-sm shrink-0" style={{ color: '#166534' }}>
                                            {(parseFloat(item.price_at_order) * item.quantity).toFixed(2)} DT
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── RÉSUMÉ PRIX ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                            <FiCreditCard style={{ color: '#166534' }} /> Récapitulatif
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-black/60">
                                <span>Sous-total</span>
                                <span>{(parseFloat(order.total_price) + parseFloat(order.discount_amount || 0)).toFixed(2)} DT</span>
                            </div>
                            {parseFloat(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-semibold">
                                    <span>Réduction {order.promo_code && `(${order.promo_code})`}</span>
                                    <span>- {parseFloat(order.discount_amount).toFixed(2)} DT</span>
                                </div>
                            )}
                            <div className="flex justify-between text-black/60">
                                <span>Livraison</span>
                                <span className="font-semibold text-emerald-600">Gratuite</span>
                            </div>
                            <div className="flex justify-between font-black text-lg text-[#2c2c2c] pt-3 border-t border-gray-100">
                                <span>Total</span>
                                <span style={{ color: '#166534' }}>{parseFloat(order.total_price).toFixed(2)} DT</span>
                            </div>
                            <div className="flex justify-between text-xs text-black/40 pt-1">
                                <span>Méthode de paiement</span>
                                <span>{order.payment_method === 'cod' ? '💵 Paiement à la livraison' : order.payment_method === 'stripe' ? '💳 Carte bancaire' : order.payment_method}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── ADRESSE ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                            <FiMapPin style={{ color: '#e63946' }} /> Adresse de livraison
                        </h2>
                        <p className="text-sm text-[#2c2c2c] font-semibold">{order.shipping_address}</p>
                        <p className="text-sm text-black/50">{order.shipping_city}, {order.shipping_country}</p>
                        {order.notes && (
                            <p className="text-xs text-black/40 mt-2 italic">Note : {order.notes}</p>
                        )}
                    </div>

                    {/* ── ANNULER ── */}
                    {canCancel && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <h2 className="text-lg font-bold text-[#2c2c2c] mb-2">Annuler la commande</h2>
                            <p className="text-sm text-black/50 mb-4">
                                Vous pouvez annuler cette commande tant qu'elle n'est pas encore expédiée.
                            </p>
                            <button onClick={handleCancel} disabled={cancelling}
                                className="flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition disabled:opacity-50"
                                style={{ background: '#dc2626' }}>
                                <FiX size={14} />
                                {cancelling ? 'Annulation...' : 'Annuler cette commande'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;