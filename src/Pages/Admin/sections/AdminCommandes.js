import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../../services/orderService';
import { cancelOrder } from '../../../services/orderService'; // ✅ route /cancel avec raison
import api from '../../../services/api';
import { FiEye , FiEdit } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { updateDelivery } from '../../../services/orderService';
import {
    ORDER_STATUS_CONFIG as STATUS_LABELS,
    ORDER_STATUS_OPTIONS as STATUS_OPTIONS,
    PAYMENT_LABELS,
    DELIVERY_STATUS_OPTIONS,
    getDeliveryLabel,
} from '../../../constants/orderStatus';
import useToast from '../../../hooks/useToast';
import { imageUrl } from '../../../utils/imageUrl';

const formatAddress = (...parts) => parts.filter(Boolean).join(', ');

const StatusBadge = ({ status }) => (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_LABELS[status]?.color || 'bg-gray-100 text-gray-600'}`}>
        {STATUS_LABELS[status]?.label || status}
    </span>
);

const AdminCommandes = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [commandes, setCommandes]         = useState([]);
    const [loading, setLoading]             = useState(true);
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [filterStatus, setFilterStatus]   = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetail, setOrderDetail]     = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const { currency } = useSiteSettings();
    const [modalMode, setModalMode] = useState('view');
    const { successMsg, errorMsg, showSuccess, showError } = useToast();
    // ── Modal annulation ──────────────────────────────────
    const [cancelModal, setCancelModal]   = useState(null);  // orderId en attente
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    const [deliveryForm, setDeliveryForm] = useState({ carrier: '', tracking_number: '', estimated_date: '', status: '' });
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    const handleUpdateDelivery = async () => {
        if (!selectedOrder) return;
        setDeliveryLoading(true);
        try {
            // 1. Apply order status change if pending and different
            const deliveryDriven = deliveryForm.status === 'livre' || deliveryForm.status === 'retourne';

            if (pendingStatus && pendingStatus !== selectedOrder.status && !deliveryDriven) {
                await updateOrderStatus(selectedOrder.id, pendingStatus);
                applyStatusChange(selectedOrder.id, pendingStatus);
            }
            await updateDelivery(selectedOrder.id, deliveryForm);

            // 3. Frontend auto-sync mirrors backend logic:
            // delivery 'livre'    → order becomes 'livree'
            // delivery 'retourne' → order becomes 'retournee'
            // order 'en_preparation' → delivery 'en_preparation' 
            // order 'expediee'       → delivery 'expedie'        
            // order 'livree'         → delivery 'livre'          
            if (deliveryForm.status === 'livre') {
                applyStatusChange(selectedOrder.id, 'livree');
            }
            if (deliveryForm.status === 'retourne') {
                applyStatusChange(selectedOrder.id, 'retournee');
            }

            showSuccess('Modifications enregistrées.');
            setPendingStatus(null);
            closeModal();
            setRefreshKey(k => k + 1);
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setDeliveryLoading(false);
        }
    };

    // ── Fetch liste ───────────────────────────────────────
    useEffect(() => {
        const fetchCommandes = async () => {
            setLoading(true);
            try {
                const res = await getAllOrders({ status: filterStatus || undefined, page });
                setCommandes(res.data.orders);
                setTotalPages(res.data.totalPages);
            } catch (err) {
                console.error('Détail erreur:', err.response?.status, err.response?.data);
                showError(err.response?.data?.message || `Erreur ${err.response?.status} — voir console`);
            } finally {
                setLoading(false);
            }
        };
        fetchCommandes();
    }, [page, filterStatus, showError, refreshKey]);

    // ── Ouvrir modal détail ───────────────────────────────
    const openOrderDetail = async (commande, mode = 'view') => {
        setModalMode(mode);
        setSelectedOrder(commande);
        setOrderDetail(null);
        setDetailLoading(true);
        setPendingStatus(null);
        try {
            const res = await api.get(`/orders/${commande.id}`);
            const detail = res.data.order;
            setOrderDetail(detail);
            setDeliveryForm({
                carrier:        detail.carrier        || '',
                tracking_number: detail.tracking_number || '',
                estimated_date: detail.estimated_date
                    ? detail.estimated_date.split('T')[0]
                    : '',
                status: detail.delivery_status || '',
                notes:           detail.delivery_notes  || '', 
            });
        } catch (err) {
            console.error('Erreur chargement détail commande:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedOrder(null);
        setOrderDetail(null);
        setModalMode('view');
        setPendingStatus(null);
    };

    // ── Confirmer l'annulation ────────────────────────────
    const handleConfirmCancel = async () => {
        if (!cancelReason.trim()) {
            showError('Une raison est obligatoire pour annuler.');
            return;
        }
        setCancelLoading(true);
        try {
            await cancelOrder(cancelModal, cancelReason.trim());
            applyStatusChange(cancelModal, 'annulee');
            showSuccess('Commande annulée avec succès.');
            setRefreshKey(k => k + 1);
        } catch (err) {
            showError(err.response?.data?.message || "Erreur lors de l'annulation.");
        } finally {
            setCancelLoading(false);
            setCancelModal(null);
            setCancelReason('');
        }
    };

    // ── Helper : mettre à jour le statut dans le state ────
    const applyStatusChange = (orderId, newStatus) => {
        setCommandes(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            setOrderDetail(prev => prev ? { ...prev, status: newStatus } : prev);
        }
    };

    // ── Tous les filtres (incl. annulée) ──────────────────
    const ALL_FILTER_OPTIONS = [...STATUS_OPTIONS, 'remboursee', 'en_reclamation', 'retournee', 'annulee'];

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
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">
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
                {ALL_FILTER_OPTIONS.map(s => (
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
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <>
                    <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
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
                                        {formatPrice(parseFloat(commande.total_price), currency)}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <StatusBadge status={commande.status} />
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                                onClick={() => openOrderDetail(commande, 'view')}
                                               className="p-2 hover:bg-gray-100 text-gray-400 rounded-xl transition"
                                                title="Voir les détails"
                                            >
                                                <FiEye size={15} />
                                            </button>
                                            <button
                                                onClick={() => openOrderDetail(commande, 'edit')}
                                                className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                                                title="Modifier"
                                            >
                                                <FiEdit size={15} />
                                            </button>
                                    </div>
                                </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    {!loading && (
                        <div className="md:hidden divide-y divide-gray-100">
                            {commandes.length === 0 ? (
                            <p className="text-center py-10 text-black/40 text-sm">Aucune commande trouvée</p>
                            ) : commandes.map(commande => (
                            <div key={commande.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-bold text-[#2c2c2c] text-sm">#{commande.order_number || commande.id.slice(0,8).toUpperCase()}</p>
                                    <p className="text-xs text-black/40">{commande.item_count} article{commande.item_count > 1 ? 's' : ''}</p>
                                </div>
                                <p className="font-bold text-[#2d5a27] text-sm">{formatPrice(parseFloat(commande.total_price), currency)}</p>
                                </div>
                                <div>
                                <p className="font-semibold text-[#2c2c2c] text-sm">{commande.customer_name}</p>
                                <p className="text-xs text-black/40">{commande.customer_email}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                <span className="text-xs text-black/40">{new Date(commande.created_at).toLocaleDateString('fr-FR')}</span>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={commande.status} />
                                    <button onClick={() => openOrderDetail(commande, 'view')} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                            <FiEye size={14}/>
                                    </button>
                                    <button onClick={() => openOrderDetail(commande, 'edit')} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                        <FiEdit size={14}/>
                                    </button>
                                </div>
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                        </>
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
                MODAL ANNULATION — raison obligatoire
            ═══════════════════════════════════════════════════ */}
            {cancelModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setCancelModal(null)}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-[#2c2c2c]">Annuler la commande</h3>
                            <button onClick={() => setCancelModal(null)} className="text-black/30 hover:text-black/70 text-2xl font-bold leading-none">×</button>
                        </div>
                        <p className="text-sm text-black/50 mb-4">
                            Cette action restaurera le stock et enverra un email au client.
                            Une raison est obligatoire.
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Raison de l'annulation (ex : rupture de stock, demande client...)"
                            rows={3}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:outline-none resize-none"
                        />
                        <p className="text-xs text-black/30 mt-1 mb-5">{cancelReason.length}/500 caractères</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelModal(null)}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-black/50 hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={cancelLoading || !cancelReason.trim()}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {cancelLoading ? '⏳ Traitement...' : '🚫 Confirmer l\'annulation'}
                            </button>
                        </div>
                    </div>
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
                        <div className="flex items-center justify-between px-4 sm:px-8 py-6 border-b border-gray-100">
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
                            <button onClick={closeModal} className="text-black/30 hover:text-black/70 text-2xl font-bold leading-none">×</button>
                        </div>

                        {/* Corps scrollable */}
                        <div className="overflow-y-auto flex-1 px-4 sm:px-8 py-6 space-y-6">

                            {/* Infos client + livraison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[#f9f5f0] rounded-xl p-4">
                                    <p className="text-xs text-black/40 font-semibold uppercase mb-2">Client</p>
                                    <p className="font-bold text-[#2c2c2c]">{selectedOrder.customer_name || orderDetail?.shipping_full_name || '—'}</p>
                                    <p className="text-sm text-black/50">{selectedOrder.customer_email}</p>
                                    {orderDetail?.shipping_phone && (
                                        <p className="text-sm text-black/50">{orderDetail.shipping_phone}</p>
                                    )}
                                </div>
                                <div className="bg-[#f9f5f0] rounded-xl p-4">
                                    <p className="text-xs text-black/40 font-semibold uppercase mb-2">Livraison</p>
                                    {detailLoading ? (
                                        <p className="text-sm text-black/30 italic">Chargement…</p>
                                    ) : orderDetail ? (
                                        <>
                                            <p className="text-sm font-semibold text-[#2c2c2c]">
                                                {formatAddress(
                                                    orderDetail.shipping_address,
                                                    orderDetail.shipping_city,
                                                    orderDetail.shipping_governorate,
                                                    orderDetail.shipping_postal_code
                                                ) || '—'}
                                            </p>
                                            {orderDetail.delivery_status && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block bg-gray-100 text-gray-600">
                                                    {getDeliveryLabel(orderDetail.delivery_status)}
                                                    </span>
                                            )}
                                            {orderDetail.tracking_number && (
                                                <p className="text-xs text-black/40 mt-1">Suivi : {orderDetail.tracking_number}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm font-semibold text-[#2c2c2c]">
                                            {formatAddress(selectedOrder.shipping_address, selectedOrder.shipping_city) || '—'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Récapitulatif financier */}
                            <div className="bg-[#f9f5f0] rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Sous-total</p>
                                    <p className="font-bold text-[#2c2c2c]">
                                        {formatPrice(parseFloat(orderDetail?.subtotal || selectedOrder.total_price), currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Réduction</p>
                                    <p className="font-bold text-red-500">
                                        {parseFloat(orderDetail?.discount_amount) > 0
                                            ? `-${formatPrice(parseFloat(orderDetail.discount_amount), currency)}`
                                            : formatPrice(0, currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/40 uppercase font-semibold mb-1">Total</p>
                                    <p className="font-bold text-[#2d5a27] text-lg">
                                        {formatPrice(parseFloat(selectedOrder.total_price), currency)}
                                    </p>
                                </div>
                            </div>

                            {/* Paiement */}
                            <div className="flex items-center justify-between text-sm bg-[#f9f5f0] rounded-xl px-4 py-3">
                                <span className="text-black/50 font-semibold">Mode de paiement</span>
                                <span className="font-bold">
                                    {PAYMENT_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}
                                </span>
                            </div>

                            {/* Articles commandés */}
                            <div>
                                <p className="text-xs text-black/40 font-semibold uppercase mb-3">Articles commandés</p>
                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-8 text-black/30">
                                        <div className="animate-spin text-2xl mr-3">🌿</div>
                                        Chargement des articles…
                                    </div>
                                ) : orderDetail?.items?.length > 0 ? (
                                    <div className="space-y-3">
                                        {orderDetail.items.map((item, idx) => {
                                            let attrs = [];
                                            try {
                                                attrs = typeof item.variant_details === 'string'
                                                    ? JSON.parse(item.variant_details)
                                                    : (item.variant_details || []);
                                            } catch (_) {}
                                            return (
                                                <div key={item.id || idx} className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3">
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                                                        {item.product_image
                                                            ? <img src={imageUrl(item.product_image)} alt={item.product_name_fr} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                                                            : <span>🧺</span>
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[#2c2c2c] text-sm truncate">
                                                            {item.product_name_fr || '—'}
                                                        </p>
                                                        {attrs.length > 0 && (
                                                            <p className="text-xs text-black/40 mt-0.5">
                                                                {attrs.map(a => `${a.attribute_type} : ${a.attribute_value}`).join(' · ')}
                                                            </p>
                                                        )}
                                                        {item.sku && <p className="text-xs text-black/30 mt-0.5">SKU : {item.sku}</p>}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-bold text-[#2d5a27] text-sm">{formatPrice(parseFloat(item.price_at_order), currency)}</p>
                                                        <p className="text-xs text-black/40">× {item.quantity}</p>
                                                        <p className="text-xs font-bold text-[#2c2c2c] mt-1">= {formatPrice(parseFloat(item.price_at_order) * item.quantity, currency)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-black/30 italic text-center py-4">Aucun article trouvé</p>
                                )}
                            </div>

                            {/* Notes */}
                            {orderDetail?.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                                    <p className="text-xs text-yellow-700 font-semibold uppercase mb-1">Notes</p>
                                    <p className="text-sm text-yellow-800">{orderDetail.notes}</p>
                                </div>
                            )}

                            {/* ── Livraison (transporteur / tracking) ── */}
                            {modalMode === 'edit' && selectedOrder && selectedOrder.status !== 'annulee' && (
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <p className="text-xs text-black/40 font-semibold uppercase">Mise à jour livraison</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Transporteur"
                                            value={deliveryForm.carrier}
                                            onChange={e => setDeliveryForm(p => ({ ...p, carrier: e.target.value }))}
                                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#4a8c42] outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="N° de suivi"
                                            value={deliveryForm.tracking_number}
                                            onChange={e => setDeliveryForm(p => ({ ...p, tracking_number: e.target.value }))}
                                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#4a8c42] outline-none"
                                        />
                                        <input
                                            type="date"
                                            value={deliveryForm.estimated_date}
                                            onChange={e => setDeliveryForm(p => ({ ...p, estimated_date: e.target.value }))}
                                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#4a8c42] outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Notes livraison (optionnel)"
                                            value={deliveryForm.notes || ''}
                                            onChange={e => setDeliveryForm(p => ({ ...p, notes: e.target.value }))}
                                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#4a8c42] outline-none col-span-full"
                                            />
                                        <select
                                            value={deliveryForm.status}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setDeliveryForm(p => ({ ...p, status: val }));
                                                // Auto-sync delivery → pending order status
                                                if (val === 'livre')    setPendingStatus('livree');
                                                if (val === 'retourne') setPendingStatus('retournee');
                                            }}
                                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#4a8c42] outline-none"
                                        >
                                            <option value="">— Statut livraison —</option>
                                            {DELIVERY_STATUS_OPTIONS.map(({ value, label }) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                
                                </div>
                            )}

                            {/* ── Changer le statut (edit mode only) ── */}
                            {modalMode === 'edit' &&
                                !['annulee', 'livree', 'remboursee', 'en_reclamation', 'retournee'].includes(selectedOrder.status) && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                                    <span className="text-sm text-black/50 font-semibold">Changer le statut</span>
                                    <select
                                        value={pendingStatus ?? selectedOrder.status}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPendingStatus(val);
                                            if (val === 'en_preparation') setDeliveryForm(p => ({ ...p, status: 'en_preparation' }));
                                            if (val === 'expediee')       setDeliveryForm(p => ({ ...p, status: 'expedie' }));
                                            if (val === 'livree')         setDeliveryForm(p => ({ ...p, status: 'livre' }));
                                        }}
                                        className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-[#4a8c42] outline-none"
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* ── Annuler la commande (visible en view ET edit mode) ── */}
                            {['en_attente', 'confirmee', 'en_preparation'].includes(selectedOrder.status) && (
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => { closeModal(); setCancelModal(selectedOrder.id); setCancelReason(''); }}
                                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-50 text-red-600 border-2 border-red-200 text-sm font-bold hover:bg-red-100 transition"
                                    >
                                        🚫 Annuler la commande
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="flex gap-3 px-4 sm:px-8 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
                            <button
                                onClick={closeModal}
                                className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm"
                            >
                                {modalMode === 'edit' ? 'Fermer sans sauvegarder' : 'Fermer'}
                            </button>
                            {modalMode === 'edit' && (
                                <button
                                    onClick={handleUpdateDelivery}
                                    disabled={deliveryLoading}
                                    className="flex-[2] bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
                                >
                                    {deliveryLoading ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCommandes;