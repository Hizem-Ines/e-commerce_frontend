import { useState, useEffect } from 'react';
import { getStats } from '../../../services/adminService';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700' },
    shipped:   { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Livrée',      color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annulée',     color: 'bg-red-100 text-red-700' },
};

const STATUS_COLORS = {
    pending:   '#f59e0b',
    confirmed: '#3b82f6',
    shipped:   '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
};

// Tooltip personnalisé pour la courbe de revenus
const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3">
            <p className="text-xs font-bold text-black/40 mb-1">{label}</p>
            <p className="text-sm font-black text-emerald-600">{formatPrice(payload[0].value)}</p>
            {payload[1] && (
                <p className="text-xs text-purple-500 font-semibold">{payload[1].value} commandes</p>
            )}
        </div>
    );
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

    // Données pour le donut statuts commandes
    const statusPieData = (data?.ordersByStatus || []).map(s => ({
        name: STATUS_LABELS[s.status]?.label || s.status,
        value: parseInt(s.count),
        color: STATUS_COLORS[s.status] || '#94a3b8',
    }));

    // Données courbe mensuelle
    const revenueData = data?.revenueByMonth || [];

    return (
        <div>
            <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-8">Tableau de bord</h2>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Utilisateurs',        value: data?.stats.totalUsers,    icon: <FiUsers size={22} />,       color: 'bg-blue-50 text-blue-600' },
                    { label: 'Produits',             value: data?.stats.totalProducts, icon: <FiPackage size={22} />,     color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Commandes',            value: data?.stats.totalOrders,   icon: <FiShoppingBag size={22} />, color: 'bg-purple-50 text-purple-600' },
                    { label: "Chiffre d'affaires",   value: formatPrice(data?.stats.totalRevenue || 0), icon: <FiDollarSign size={22} />, color: 'bg-orange-50 text-orange-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <p className="text-2xl font-black text-[#2c2c2c] mb-1">{stat.value}</p>
                        <p className="text-sm text-black/40 font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── COURBE REVENUS + COMMANDES ── */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <FiTrendingUp className="text-emerald-600" size={18} />
                    <h3 className="text-lg font-bold text-[#2c2c2c]">Revenus & commandes — 6 derniers mois</h3>
                </div>

                {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="rev"
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                                width={40}
                            />
                            <YAxis
                                yAxisId="ord"
                                orientation="right"
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip content={<RevenueTooltip />} />
                            <Line
                                yAxisId="rev"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                            />
                            <Line
                                yAxisId="ord"
                                type="monotone"
                                dataKey="orders"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-black/40 text-center py-10">Pas encore de données</p>
                )}

                <div className="flex gap-6 mt-3 justify-center">
                    <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                        <span className="w-4 h-0.5 bg-emerald-500 rounded inline-block" /> Revenus
                    </span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                        <span className="w-4 h-0.5 bg-purple-500 rounded inline-block" style={{ borderTop: '2px dashed #8b5cf6', background: 'transparent' }} /> Commandes
                    </span>
                </div>
            </div>

            {/* ── DONUT STATUTS + BARCHART TOP PRODUITS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Donut statuts commandes */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                    <h3 className="text-lg font-bold text-[#2c2c2c] mb-5">Statuts des commandes</h3>
                    {statusPieData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value + ' commandes', name]}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                                {statusPieData.map((s, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                                        {s.name} ({s.value})
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-black/40 text-center py-10">Aucune commande</p>
                    )}
                </div>

                {/* Bar chart top produits */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                    <h3 className="text-lg font-bold text-[#2c2c2c] mb-5">Top produits — unités vendues</h3>
                    {data?.topProducts?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={data.topProducts.slice(0, 5).map(p => ({
                                    name: (p.name_fr || 'Supprimé').length > 14
                                        ? (p.name_fr || 'Supprimé').slice(0, 14) + '…'
                                        : (p.name_fr || 'Supprimé'),
                                    qty: parseInt(p.total_qty),
                                }))}
                                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={v => [v + ' unités']}
                                    contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                />
                                <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-black/40 text-center py-10">Aucune vente</p>
                    )}
                </div>
            </div>

            {/* ── COMMANDES RÉCENTES ── */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                <div className="flex items-center gap-2 mb-5">
                    <FiClock className="text-purple-500" size={18} />
                    <h3 className="text-lg font-bold text-[#2c2c2c]">Commandes récentes</h3>
                </div>
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
        </div>
    );
};

export default AdminStats;