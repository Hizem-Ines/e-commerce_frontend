import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../../services/adminService';
import api from '../../../services/api'; // ← ton instance axios GOFFA
import { FiEye, FiLoader } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';

const STATUS_LABELS = {
    pending:    { label: 'En attente',   color: 'bg-yellow-100 text-yellow-700' },
    confirmed:  { label: 'Confirmée',    color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'En cours',     color: 'bg-orange-100 text-orange-700' },
    shipped:    { label: 'Expédiée',     color: 'bg-purple-100 text-purple-700' },
    delivered:  { label: 'Livrée',       color: 'bg-emerald-100 text-emerald-700' },
    cancelled:  { label: 'Annulée',      color: 'bg-red-100 text-red-700' },
    refunded:   { label: 'Remboursée',   color: 'bg-gray-100 text-gray-600' },
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const PAYMENT_LABELS = {
    cod:    '💵 À la livraison',
    stripe: '💳 Carte / Twint',
};

// ─── Helper : adresse sans virgule orpheline ───────────────
const formatAddress = (...parts) =>
    parts.filter(Boolean).join(', ');

// ─── Badge statut ──────────────────────────────────────────
const StatusBadge = ({ status }) => (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_LABELS[status]?.color || 'bg-gray-100 text-gray-600'}`}>
        {STATUS_LABELS[status]?.label || status}
    </span>
);

const AdminCommandes = () => {
    const [commandes, setCommandes]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [page, setPage]                 = useState(1);
    const [totalPages, setTotalPages]     = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedOrder, setSelectedOrder]       = useState(null);  // données liste
    const [orderDetail, setOrderDetail]           = useState(null);  // données complètes
    const [detailLoading, setDetailLoading]       = useState(false);
    const [successMsg, setSuccessMsg]     = useState('');
    const [errorMsg, setErrorMsg]         = useState('');

    // ── Fetch liste ───────────────────────────────────────
    useEffect(() => {
        const fetchCommandes = async () => {
            setLoading(true);
            try {
                const res = await getAllOrders({ status: filterStatus || undefined, page });
                setCommandes(res.data.orders);
                setTotalPages(res.data.totalPages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommandes();
    }, [page, filterStatus]);

    // ── Ouvrir modal + charger détail complet ─────────────
    const openOrderDetail = async (commande) => {
        setSelectedOrder(commande);
        setOrderDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/orders/${commande.id}`);
            setOrderDetail(res.data.order);
        } catch (err) {
            console.error('Erreur chargement détail commande:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedOrder(null);
        setOrderDetail(null);
    };

    // ── Changement de statut ──────────────────────────────
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, { status: newStatus });
            setCommandes(prev =>
                prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
            );
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                setOrderDetail(prev => prev ? { ...prev, status: newStatus } : prev);
            }
            setSuccessMsg('Statut mis à jour avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la mise à jour.');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    return (
        <div>
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Commandes</h2>
                <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full">
                    {commandes.length} commande{commandes.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* ALERTES */}
            {successMsg && (
                <div className="bg-emerald-50 border border-#b6eac7 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">
                    ✅ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">
                    ❌ {errorMsg}
                </div>
            )}

            {/* FILTRES */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => { setFilterStatus(''); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        filterStatus === '' ? 'bg-[#2d5a27] text-white' : 'bg-white text-black/50 hover:bg-emerald-50'
                    }`}
                >
                    Toutes
                </button>
                {STATUS_OPTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                            filterStatus === s ? 'bg-[#2d5a27] text-white' : 'bg-white text-black/50 hover:bg-emerald-50'
                        }`}
                    >
                        {STATUS_LABELS[s]?.label}
                    </button>
                ))}
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Commande</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Client</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Date</th>
                                <th className="text-right px-5 py-4 font-bold text-[#2c2c2c]">Total</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commandes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-black/40">
                                        Aucune commande trouvée
                                    </td>
                                </tr>
                            ) : commandes.map((commande) => (
                                <tr key={commande.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-[#2c2c2c]">
                                            #{commande.order_number || commande.id.slice(0, 8).toUpperCase()}
                                        </p>
                                        <p className="text-xs text-black/40">
                                            {commande.item_count} article{commande.item_count > 1 ? 's' : ''}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-[#2c2c2c]">{commande.customer_name || 'Client'}</p>
                                        <p className="text-xs text-black/40">{commande.customer_email}</p>
                                    </td>
                                    <td className="px-5 py-4 text-black/50 text-xs">
                                        {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-bold text-[#2d5a27]">
                                        {formatPrice(parseFloat(commande.total_price))}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <select
                                            value={commande.status}
                                            onChange={(e) => handleStatusChange(commande.id, e.target.value)}
                                            className={`text-xs font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_LABELS[commande.status]?.color || 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => openOrderDetail(commande)}
                                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                                            title="Voir les détails"
                                        >
                                            <FiEye size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition ${
                                page === i + 1
                                    ? 'bg-[#2d5a27] text-white'
                                    : 'bg-white text-black/50 hover:bg-emerald-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                MODAL DÉTAIL COMMANDE
            ═══════════════════════════════════════════════════ */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

                        {/* Header modal */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-[#2c2c2c]">
                                    Commande #{selectedOrder.order_number || selectedOrder.id.slice(0, 8).toUpperCase()}
                                </h3>
                                <p className="text-xs text-black/40 mt-1">
                                    {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-black/30 hover:text-black/70 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Corps scrollable */}
                        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">

                            {/* ── Infos client + statut ── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#f9f5f0] rounded-xl p-4">
                                    <p className="text-xs text-black/40 font-semibold uppercase mb-2">Client</p>
                                    <p className="font-bold text-[#2c2c2c]">{selectedOrder.customer_name || orderDetail?.shipping_full_name || '—'}</p>
                                    <p className="text-sm text-black/50">{selectedOrder.customer_email}</p>
                                    {(orderDetail?.shipping_phone) && (
                                        <p className="text-sm text-black/50">{orderDetail.shipping_phone}</p>
                                    )}
                                </div>
                                <div className="bg-[#f9f5f0] rounded-xl p-4">
                                    <p className="text-xs text-black/40 font-semibold uppercase mb-2">Livraison</p>
                                    {detailLoading ? (
                                        <p className="text-sm text-black/30 italic">Chargement…</p>
                                    ) : orderDetail ? (
                                        <>
                                            {/* ✅ Adresse sans virgule orpheline */}
                                            <p className="text-sm font-semibold text-[#2c2c2c]">
                                                {formatAddress(
                                                    orderDetail.shipping_address,
                                                    orderDetail.shipping_city,
                                                    orderDetail.shipping_governorate,
                                                    orderDetail.shipping_postal_code
                                                ) || '—'}
                                            </p>
                                            {orderDetail.delivery_status && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${STATUS_LABELS[orderDetail.delivery_status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                    {orderDetail.delivery_status}
                                                </span>
                                            )}
                                            {orderDetail.tracking_number && (
                                                <p className="text-xs text-black/40 mt-1">
                                                    Suivi : {orderDetail.tracking_number}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        // Fallback depuis la liste (adresse partielle)
                                        <p className="text-sm font-semibold text-[#2c2c2c]">
                                            {formatAddress(
                                                selectedOrder.shipping_address,
                                                selectedOrder.shipping_city
                                            ) || '—'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Récapitulatif financier ── */}
                            <div className="bg-[#f9f5f0] rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Sous-total</p>
                                    <p className="font-bold text-[#2c2c2c]">
                                        {formatPrice(parseFloat(orderDetail?.subtotal || selectedOrder.total_price))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Réduction</p>
                                    <p className="font-bold text-red-500">
                                        {orderDetail?.discount_amount > 0
                                            ? `-${formatPrice(parseFloat(orderDetail.discount_amount))}`
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Total</p>
                                    <p className="font-bold text-[#2d5a27] text-lg">
                                        {formatPrice(parseFloat(selectedOrder.total_price))}
                                    </p>
                                </div>
                            </div>

                            {/* ── Paiement ── */}
                            <div className="flex items-center justify-between text-sm bg-[#f9f5f0] rounded-xl px-4 py-3">
                                <span className="text-black/50 font-semibold">Mode de paiement</span>
                                <span className="font-bold">
                                    {PAYMENT_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}
                                </span>
                            </div>

                            {/* ── Articles commandés ── */}
                            <div>
                                <p className="text-xs text-black/40 font-semibold uppercase mb-3">
                                    Articles commandés
                                </p>

                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-8 text-black/30">
                                        <div className="animate-spin text-2xl mr-3">🌿</div>
                                        Chargement des articles…
                                    </div>
                                ) : orderDetail?.items?.length > 0 ? (
                                    <div className="space-y-3">
                                        {orderDetail.items.map((item, idx) => {
                                            // variant_details peut être string JSON ou tableau
                                            let attrs = [];
                                            try {
                                                attrs = typeof item.variant_details === 'string'
                                                    ? JSON.parse(item.variant_details)
                                                    : (item.variant_details || []);
                                            } catch (_) {}

                                            return (
                                                <div
                                                    key={item.id || idx}
                                                    className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3"
                                                >
                                                    {/* Icône produit */}
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                                                        🧺
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[#2c2c2c] text-sm truncate">
                                                            {item.product_name_fr || 'Produit'}
                                                        </p>
                                                        {/* Attributs variante (taille, couleur…) */}
                                                        {attrs.length > 0 && (
                                                            <p className="text-xs text-black/40 mt-0.5">
                                                                {attrs.map(a => `${a.attribute_type} : ${a.attribute_value}`).join(' · ')}
                                                            </p>
                                                        )}
                                                        {item.sku && (
                                                            <p className="text-xs text-black/30 mt-0.5">SKU : {item.sku}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-bold text-[#2d5a27] text-sm">
                                                            {formatPrice(parseFloat(item.price_at_order))}
                                                        </p>
                                                        <p className="text-xs text-black/40">× {item.quantity}</p>
                                                        <p className="text-xs font-bold text-[#2c2c2c] mt-1">
                                                            = {formatPrice(parseFloat(item.price_at_order) * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-black/30 italic text-center py-4">
                                        Aucun article trouvé
                                    </p>
                                )}
                            </div>

                            {/* ── Notes ── */}
                            {orderDetail?.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                                    <p className="text-xs text-yellow-700 font-semibold uppercase mb-1">Notes</p>
                                    <p className="text-sm text-yellow-800">{orderDetail.notes}</p>
                                </div>
                            )}

                            {/* ── Changer statut ── */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-sm text-black/50 font-semibold">Changer le statut</span>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-[#4a8c42]  outline-none"
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCommandes;