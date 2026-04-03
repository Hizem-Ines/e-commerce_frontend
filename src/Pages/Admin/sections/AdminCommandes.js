import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../../services/adminService';
import { FiEye } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';

const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700' },
    shipped:   { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Livrée',      color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-700' },
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const AdminCommandes = () => {
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');


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

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, { status: newStatus });
            setCommandes(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
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
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Commandes</h2>
                <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full">
                    {commandes.length} commande{commandes.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* ALERTES */}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* FILTRES */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => { setFilterStatus(''); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        filterStatus === '' ? 'bg-emerald-600 text-white' : 'bg-white text-black/50 hover:bg-emerald-50'
                    }`}
                >
                    Toutes
                </button>
                {STATUS_OPTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                            filterStatus === s ? 'bg-emerald-600 text-white' : 'bg-white text-black/50 hover:bg-emerald-50'
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
                                    <td colSpan={6} className="text-center py-10 text-black/40">Aucune commande trouvée</td>
                                </tr>
                            ) : commandes.map((commande) => (
                                <tr key={commande.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-[#2c2c2c]">#{commande.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-xs text-black/40">{commande.item_count} article{commande.item_count > 1 ? 's' : ''}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-[#2c2c2c]">{commande.customer_name || 'Client'}</p>
                                        <p className="text-xs text-black/40">{commande.customer_email}</p>
                                    </td>
                                    <td className="px-5 py-4 text-black/50 text-xs">
                                        {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
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
                                            onClick={() => setSelectedOrder(commande)}
                                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
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
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-black/50 hover:bg-emerald-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* MODAL DÉTAIL COMMANDE */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#2c2c2c]">
                                Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-black/40 hover:text-black/70 text-2xl font-bold">×</button>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-black/50">Client</span>
                                <span className="font-bold">{selectedOrder.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/50">Email</span>
                                <span className="font-bold">{selectedOrder.customer_email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/50">Date</span>
                                <span className="font-bold">{new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/50">Total</span>
                                <span className="font-bold text-emerald-600">{formatPrice(parseFloat(selectedOrder.total_price))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/50">Paiement</span>
                                <span className="font-bold">{selectedOrder.payment_method === 'cod' ? 'À la livraison' : selectedOrder.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/50">Adresse</span>
                                <span className="font-bold text-right">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                <span className="text-black/50">Changer le statut</span>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-emerald-500 outline-none"
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