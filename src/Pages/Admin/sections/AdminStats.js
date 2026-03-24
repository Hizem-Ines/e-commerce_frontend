import { useState, useEffect } from 'react';
import { getStats } from '../../../services/adminService';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';

const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700' },
    shipped:   { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Livrée',      color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-700' },
};

const AdminStats = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats()
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-spin">🌿</div>
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-8">Tableau de bord</h2>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Utilisateurs',  value: data?.stats.totalUsers,    icone: <FiUsers size={22} />,       color: 'bg-blue-50 text-blue-600' },
                    { label: 'Produits',       value: data?.stats.totalProducts, icone: <FiPackage size={22} />,     color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Commandes',      value: data?.stats.totalOrders,   icone: <FiShoppingBag size={22} />, color: 'bg-purple-50 text-purple-600' },
                    { label: 'Chiffre d\'affaires', value: formatPrice(data?.stats.totalRevenue || 0), icone: <FiDollarSign size={22} />, color: 'bg-orange-50 text-orange-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                            {stat.icone}
                        </div>
                        <p className="text-2xl font-black text-[#2c2c2c] mb-1">{stat.value}</p>
                        <p className="text-sm text-black/40 font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* COMMANDES RÉCENTES */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                    <h3 className="text-lg font-bold text-[#2c2c2c] mb-5">Commandes récentes</h3>
                    <div className="space-y-3">
                        {data?.recentOrders?.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="text-sm font-bold text-[#2c2c2c]">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-xs text-black/40">{order.customer_name} · {order.item_count} article{order.item_count > 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600">{formatPrice(parseFloat(order.total_price))}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_LABELS[order.status]?.label || order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOP PRODUITS */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                    <h3 className="text-lg font-bold text-[#2c2c2c] mb-5">Top produits vendus</h3>
                    <div className="space-y-3">
                        {data?.topProducts?.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#2c2c2c] truncate">{p.name_fr || 'Produit supprimé'}</p>
                                    <p className="text-xs text-black/40">{p.total_qty} unités vendues</p>
                                </div>
                                <span className="text-sm font-bold text-emerald-600 shrink-0">
                                    {p.total_orders} commandes
                                </span>
                            </div>
                        ))}
                        {(!data?.topProducts || data.topProducts.length === 0) && (
                            <p className="text-sm text-black/40 text-center py-4">Aucune vente pour le moment</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;