import { useState, useEffect } from 'react';
import { getStats , exportStats } from '../../../services/adminService';
import { FiDownload } from 'react-icons/fi';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock, FiCalendar, FiChevronDown } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Constantes ────────────────────────────────────────────────────────────────

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

const PERIOD_OPTIONS = [
    { value: 'today',  label: "Aujourd'hui" },
    { value: '7days',  label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: 'year',   label: 'Cette année' },
    { value: 'custom', label: 'Mois précis…' },
];

const MONTHS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Tooltip revenus ───────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3">
            <p className="text-xs font-bold text-black/40 mb-1">{label}</p>
            <p className="text-sm font-black text-[#2d5a27]">{formatPrice(payload[0].value)}</p>
            {payload[1] && (
                <p className="text-xs text-purple-500 font-semibold">{payload[1].value} commandes</p>
            )}
        </div>
    );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color, growth }) => (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            {icon}
        </div>
        <p className="text-2xl font-black text-[#2c2c2c] mb-0.5">{value}</p>
        {growth !== undefined && (
            <p className={`text-xs font-bold mb-1 ${growth >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% vs période préc.
            </p>
        )}
        <p className="text-sm text-black/40 font-semibold">{label}</p>
    </div>
);

// ─── Composant principal ───────────────────────────────────────────────────────

const AdminStats = () => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    // Filtres
    const [period,       setPeriod]       = useState('30days');
    const [customMonth,  setCustomMonth]  = useState(new Date().getMonth() + 1); // 1–12
    const [customYear,   setCustomYear]   = useState(currentYear);

    // ── Fetch ────────────────────────────────────────────
    const fetchStats = () => {
        setLoading(true);
        const params =
            period === 'custom'
                ? { month: customMonth, year: customYear }
                : { period };

        getStats(params)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (period !== 'custom') fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    // ── Dérivés ──────────────────────────────────────────
    const statusPieData = (data?.charts?.ordersByStatus || []).map(s => ({
        name:  STATUS_LABELS[s.status]?.label || s.status,
        value: parseInt(s.count),
        color: STATUS_COLORS[s.status] || '#94a3b8',
    }));

    const revenueData = data?.charts?.revenueByMonth || [];

    const handleExport = async (type) => {
    try {
        const params = period === 'custom'
            ? { month: customMonth, year: customYear, type }
            : { period, type };

        const res = await exportStats(params);
        const url = URL.createObjectURL(new Blob([res.data]));
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `${type}_export.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export échoué', err);
    }
};

    // ── Rendu ────────────────────────────────────────────
    return (
        <div>
            {/* En-tête + filtre */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Tableau de bord</h2>

                {/* Barre de filtre */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Boutons période */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap
                                    ${period === opt.value
                                        ? 'bg-[#2d5a27] text-white'
                                        : 'text-black/50 hover:bg-gray-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Sélecteurs mois/année — visibles uniquement si custom */}
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            {/* Mois */}
                            <div className="relative">
                                <select
                                    value={customMonth}
                                    onChange={e => setCustomMonth(parseInt(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-[#2c2c2c] shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/30"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" size={12} />
                            </div>

                            {/* Année */}
                            <div className="relative">
                                <select
                                    value={customYear}
                                    onChange={e => setCustomYear(parseInt(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-[#2c2c2c] shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/30"
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" size={12} />
                            </div>

                            {/* Bouton Appliquer */}
                            <button
                                onClick={fetchStats}
                                className="flex items-center gap-1.5 bg-[#2d5a27] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#244a20] transition-colors shadow-sm"
                            >
                                <FiCalendar size={12} />
                                Appliquer
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Label période active */}
            {data?.period && (
                <p className="text-xs font-semibold text-black/40 -mt-5 mb-6">
                    Période : <span className="text-[#2d5a27]">{data.period.label}</span>
                    &nbsp;({data.period.start} → {data.period.end})
                </p>
            )}

            {/* ── Boutons export ── */}
{!loading && data && (
    <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-black/40 mr-1">
            <FiDownload size={12} className="inline mr-1" />
            Exporter :
        </span>
        {[
            { type: 'orders',    label: 'Commandes' },
            { type: 'products',  label: 'Produits'  },
            { type: 'customers', label: 'Clients'   },
        ].map(({ type, label }) => (
            <button
                key={type}
                onClick={() => handleExport(type)}
                className="flex items-center gap-1.5 text-xs font-semibold border border-[#2d5a27] text-[#2d5a27] px-3 py-1.5 rounded-xl hover:bg-[#2d5a27] hover:text-white transition-colors"
            >
                <FiDownload size={11} />
                {label}
            </button>
        ))}
    </div>
)}

            {/* Loader */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-4xl animate-spin">🌿</div>
                </div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <KpiCard
                            label="Chiffre d'affaires"
                            value={formatPrice(data?.kpis?.revenue?.current || 0)}
                            icon={<FiDollarSign size={22} />}
                            color="bg-orange-50 text-orange-600"
                            growth={data?.kpis?.revenue?.growth}
                        />
                        <KpiCard
                            label="Commandes"
                            value={data?.kpis?.orders?.current ?? '—'}
                            icon={<FiShoppingBag size={22} />}
                            color="bg-purple-50 text-purple-600"
                            growth={data?.kpis?.orders?.growth}
                        />
                        <KpiCard
                            label="Nouveaux clients"
                            value={data?.kpis?.newUsers?.current ?? '—'}
                            icon={<FiUsers size={22} />}
                            color="bg-blue-50 text-blue-600"
                            growth={data?.kpis?.newUsers?.growth}
                        />
                        <KpiCard
                            label="Produits actifs"
                            value={data?.globals?.totalProducts ?? '—'}
                            icon={<FiPackage size={22} />}
                            color="bg-emerald-50 text-[#2d5a27]"
                        />
                    </div>

                    {/* ── Courbe revenus ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-6">
                        <div className="flex items-center gap-2 mb-6">
                            <FiTrendingUp className="text-[#2d5a27]" size={18} />
                            <h3 className="text-lg font-bold text-[#2c2c2c]">Revenus & commandes — 6 derniers mois</h3>
                        </div>

                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40} />
                                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                                    <Line yAxisId="ord" type="monotone" dataKey="orders"  stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-black/40 text-center py-10">Pas encore de données</p>
                        )}

                        <div className="flex gap-6 mt-3 justify-center">
                            <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                                <span className="w-4 h-0.5 bg-[#4a8c42] rounded inline-block" /> Revenus
                            </span>
                            <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                                <span className="w-4 h-0.5 bg-purple-500 rounded inline-block" style={{ borderTop: '2px dashed #8b5cf6', background: 'transparent' }} /> Commandes
                            </span>
                        </div>
                    </div>

                    {/* ── Donut + Bar chart ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Donut statuts */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <h3 className="text-lg font-bold text-[#2c2c2c] mb-5">Statuts des commandes</h3>
                            {statusPieData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                                {statusPieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, n) => [v + ' commandes', n]} contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }} />
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
                            {data?.charts?.topProducts?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={data.charts.topProducts.slice(0, 5).map(p => ({
                                            name: (p.name_fr || 'Supprimé').length > 14
                                                ? (p.name_fr || 'Supprimé').slice(0, 14) + '…'
                                                : (p.name_fr || 'Supprimé'),
                                            qty: parseInt(p.total_qty),
                                        }))}
                                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={v => [v + ' unités']} contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }} />
                                        <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-black/40 text-center py-10">Aucune vente</p>
                            )}
                        </div>
                    </div>

                    {/* ── Commandes récentes ── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <FiClock className="text-purple-500" size={18} />
                            <h3 className="text-lg font-bold text-[#2c2c2c]">Commandes récentes</h3>
                        </div>
                        <div className="space-y-3">
                            {data?.tables?.recentOrders?.map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="text-sm font-bold text-[#2c2c2c]">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-xs text-black/40">{order.customer_name} · {order.item_count} article{order.item_count > 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#2d5a27]">{formatPrice(parseFloat(order.total_price))}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABELS[order.status]?.label || order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminStats;