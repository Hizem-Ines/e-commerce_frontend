import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSingleOrder } from '../../services/orderService';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiTruck } from 'react-icons/fi';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import formatPrice from '../../utils/formatPrice';
import { imageUrl } from '../../utils/imageUrl';
import {
    ORDER_STATUS_INLINE as STATUS_LABELS,
    DELIVERY_STEPS,
} from '../../constants/orderStatus';


const OrderDetail = () => {
    const { orderId }  = useParams();
    const navigate     = useNavigate();
    const { currency } = useSiteSettings();
    const fmt = (n) => formatPrice(parseFloat(n), currency);

    const [order,   setOrder]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        getSingleOrder(orderId)
            .then(res => setOrder(res.data.order))
            .catch((err) => {
                if (err.response?.status === 403) {
                    setError("Vous n'avez pas accès à cette commande.");
                } else {
                    setError('Commande introuvable.');
                }
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    // ✅ Correspondance avec les valeurs DB réelles
    const getDeliveryStep = () => {
        const s = order?.delivery_status;
        if (s === 'livre') return 2;
        if (s === 'expedie' || s === 'en_transit' || s === 'en_cours') return 1;
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
                <Link to="/profil" className="text-white font-bold px-6 py-3 rounded-xl no-underline" style={{ background: '#166534' }}>
                    Retour au profil
                </Link>
            </div>
        );
    }

    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.en_attente;

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-3xl">

                {/* RETOUR */}
                <button onClick={() => navigate('/profil#commandes')}
                    className="flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-[#166534] mb-6 transition">
                    <FiArrowLeft size={16} /> Retour à mon profil
                </button>

                {/* TITRE */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-[#2c2c2c]">
                            Commande {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
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

                {error && (
                    <div className="mb-6 px-5 py-3 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-700">
                        ❌ {error}
                    </div>
                )}

                <div className="space-y-5">

                    {/* ── SUIVI LIVRAISON ── */}
                    {order.status !== 'annulee' && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <h2 className="text-lg font-bold text-[#2c2c2c] mb-6 flex items-center gap-2">
                                <FiTruck style={{ color: '#166534' }} /> Suivi de livraison
                            </h2>
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
                                <div className="absolute top-5 left-0 h-1 bg-[#4a8c42] z-0 transition-all duration-500"
                                    style={{ width: `${getDeliveryStep() * 50}%` }} />
                                {DELIVERY_STEPS.map((step, i) => {
                                    const isActive  = i <= getDeliveryStep();
                                    const isCurrent = i === getDeliveryStep();
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-all duration-300 ${isActive ? 'shadow-lg' : ''}`}
                                                style={{ background: isActive ? '#166534' : '#e5e7eb', transform: isCurrent ? 'scale(1.2)' : 'scale(1)' }}>
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
                            {/* ── Statut problème livraison ── */}
                            {(order.delivery_status === 'echec' || order.delivery_status === 'retourne') && (
                                <div className={`mt-5 px-4 py-3 rounded-xl text-sm font-semibold ${
                                    order.delivery_status === 'echec'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}>
                                    {order.delivery_status === 'echec'
                                        ? '❌ Échec de livraison — notre équipe va vous recontacter.'
                                        : '↩️ Colis retourné — veuillez contacter le service client.'}
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
                                const image   = item.product_image || null;
                                const details = typeof item.variant_details === 'string'
                                    ? JSON.parse(item.variant_details)
                                    : item.variant_details || [];
                                return (
                                    <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                                            {image
                                                ? <img src={imageUrl(image)} alt={item.product_name_fr} className="w-full h-full object-cover" />
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
                                            {fmt(parseFloat(item.price_at_order) * item.quantity)}
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
                                <span>Sous-total</span><span>{fmt(order.subtotal)}</span>
                            </div>
                            {parseFloat(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-[#2d5a27] font-semibold">
                                    <span>Réduction {order.promo_code && `(${order.promo_code})`}</span>
                                    <span>- {fmt(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-black/60">
                                <span>Livraison</span>
                                <span className="font-semibold text-[#2d5a27]">
                                    {parseFloat(order.shipping_cost) === 0 ? 'Gratuite' : fmt(order.shipping_cost)}
                                </span>
                            </div>
                            <div className="flex justify-between font-black text-lg text-[#2c2c2c] pt-3 border-t border-gray-100">
                                <span>Total</span>
                                <span style={{ color: '#166534' }}>{fmt(order.total_price)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── ADRESSE ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                            <FiMapPin style={{ color: '#e63946' }} /> Adresse de livraison
                        </h2>
                        <p className="text-sm text-[#2c2c2c] font-semibold">{order.shipping_full_name}</p>
                        <p className="text-sm text-black/50">{order.shipping_address}</p>
                        <p className="text-sm text-black/50">
                            {[order.shipping_postal_code, order.shipping_city, order.shipping_governorate && `(${order.shipping_governorate})`]
                                .filter(Boolean).join(' ')}
                        </p>
                        <p className="text-sm text-black/50">{order.shipping_country}</p>
                        {order.shipping_phone && (
                            <p className="text-sm text-black/50 mt-1">📞 {order.shipping_phone}</p>
                        )}
                        {order.notes && (
                            <p className="text-xs text-black/40 mt-2 italic">Note : {order.notes}</p>
                        )}
                    </div>

                    {/* ── RAISON ANNULATION ── */}
                    {order.status === 'annulee' && order.cancelled_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                            <p className="text-sm font-bold text-red-700 mb-1">🚫 Raison de l'annulation</p>
                            <p className="text-sm text-red-600">{order.cancelled_reason}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;