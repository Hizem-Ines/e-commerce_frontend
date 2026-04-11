import { useState, useEffect } from 'react';
import { getStats, exportStats } from '../../../services/adminService';
import {
    FiDownload, FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
    FiTrendingUp, FiClock, FiCalendar, FiChevronDown, FiAlertTriangle,
    FiAlertCircle, FiCheckCircle, FiMessageSquare, FiActivity,
    FiAward, FiBarChart2, FiPieChart, FiRefreshCw,
} from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmée',   color: 'bg-blue-100   text-blue-700'   },
    shipped:   { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Livrée',      color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annulée',     color: 'bg-red-100    text-red-700'    },
};

const STATUS_COLORS = {
    pending:   '#f59e0b',
    confirmed: '#3b82f6',
    shipped:   '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
};

const CATEGORY_PALETTE = [
    '#2d5a27','#4a8c42','#10b981','#34d399',
    '#f59e0b','#fb923c','#8b5cf6','#ec4899',
];

const RECLAMATION_COLORS = {
    produit_endommage: '#ef4444',
    livraison_tardive: '#f59e0b',
    produit_manquant:  '#8b5cf6',
    mauvais_produit:   '#3b82f6',
    autre:             '#94a3b8',
};

const PERIOD_OPTIONS = [
    { value: 'today',  label: "Aujourd'hui" },
    { value: '7days',  label: '7 jours' },
    { value: '30days', label: '30 jours' },
    { value: 'year',   label: 'Cette année' },
    { value: 'custom', label: 'Mois précis…' },
];

const MONTHS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const currentYear  = new Date().getFullYear();
const YEARS        = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const truncate = (str, n = 18) =>
    !str ? '—' : str.length > n ? str.slice(0, n) + '…' : str;

const initials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

// ─── Tooltips custom ──────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-black/40 mb-1">{label}</p>
            <p className="font-black text-[#2d5a27]">{formatPrice(payload[0]?.value || 0)}</p>
            {payload[1] && (
                <p className="text-purple-500 font-semibold mt-0.5">{payload[1].value} commandes</p>
            )}
        </div>
    );
};

const SimpleTooltip = ({ active, payload, label, suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-black/40 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="font-semibold" style={{ color: p.color }}>
                    {p.name} : {p.value}{suffix}
                </p>
            ))}
        </div>
    );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color, growth, sub }) => (
    <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-[#2c2c2c] leading-none">{value}</p>
            {sub && <p className="text-xs text-black/30 mt-0.5">{sub}</p>}
        </div>
        {growth !== undefined && (
            <p className={`text-xs font-bold ${growth >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% vs période préc.
            </p>
        )}
        <p className="text-sm text-black/40 font-semibold -mt-1">{label}</p>
    </div>
);

// ─── Section Header ────────────────────────────────────────────────────────────

const SectionTitle = ({ icon, title, sub }) => (
    <div className="flex items-center gap-2 mb-5">
        <span className="text-[#2d5a27]">{icon}</span>
        <div>
            <h3 className="text-base font-bold text-[#2c2c2c] leading-none">{title}</h3>
            {sub && <p className="text-xs text-black/30 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ─── Composant principal ───────────────────────────────────────────────────────

const AdminStats = () => {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [period,       setPeriod]      = useState('30days');
    const [customMonth,  setCustomMonth] = useState(new Date().getMonth() + 1);
    const [customYear,   setCustomYear]  = useState(currentYear);

    const fetchStats = () => {
        setLoading(true);
        const params = period === 'custom'
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

    // ── Dérivés ──────────────────────────────────────────────────────────────

    const statusPieData = (data?.charts?.ordersByStatus || []).map(s => ({
        name:  STATUS_LABELS[s.status]?.label || s.status,
        value: parseInt(s.count),
        color: STATUS_COLORS[s.status] || '#94a3b8',
    }));

    const categoryData = (data?.charts?.salesByCategory || []).map((c, i) => ({
        name:  c.category || 'Non catégorisé',
        value: parseFloat(c.revenue) || 0,
        orders: c.orders_count,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }));

    const reclamTypeData = (data?.reclamations?.byType || []).map((r, i) => ({
        type:  r.reclamation_type || 'autre',
        count: r.count,
        fill:  RECLAMATION_COLORS[r.reclamation_type] || '#94a3b8',
    }));

    const dailyData = data?.charts?.revenueByDay || [];
    const monthlyData = data?.charts?.revenueByMonth || [];

    const hasAlerts = (
        (data?.alerts?.lowStockProducts?.length > 0) ||
        (data?.alerts?.pendingOrders48h?.length > 0) ||
        (data?.alerts?.cancelledToday > 0)
    );

    // ── Rendu ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── En-tête ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Tableau de bord</h2>

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

                    {/* Sélecteurs mois/année */}
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={customMonth}
                                    onChange={e => setCustomMonth(parseInt(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-[#2c2c2c] shadow-sm cursor-pointer focus:outline-none"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" size={12} />
                            </div>
                            <div className="relative">
                                <select
                                    value={customYear}
                                    onChange={e => setCustomYear(parseInt(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-[#2c2c2c] shadow-sm cursor-pointer focus:outline-none"
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" size={12} />
                            </div>
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
                <p className="text-xs font-semibold text-black/40 -mt-2">
                    Période : <span className="text-[#2d5a27]">{data.period.label}</span>
                    &nbsp;({data.period.start} → {data.period.end})
                </p>
            )}

            {/* ── Boutons export ── */}
            {!loading && data && (
                <div className="flex flex-wrap items-center gap-2">
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

            {/* ── Loader ── */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl animate-spin">🌿</div>
                        <p className="text-xs font-semibold text-black/30">Chargement des données…</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* ════════════════════════════════════════════════════════
                        ALERTES
                    ════════════════════════════════════════════════════════ */}
                    {hasAlerts && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Ruptures de stock */}
                            {data.alerts.lowStockProducts?.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiAlertTriangle className="text-orange-500" size={16} />
                                        <span className="text-sm font-bold text-orange-700">
                                            {data.alerts.lowStockProducts.length} produit(s) en stock faible
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {data.alerts.lowStockProducts.slice(0, 4).map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-orange-700 font-semibold truncate max-w-[130px]">
                                                    {p.name_fr || p.sku}
                                                </span>
                                                <span className="bg-orange-200 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                                                    {p.stock} restant{p.stock > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        ))}
                                        {data.alerts.lowStockProducts.length > 4 && (
                                            <p className="text-xs text-orange-400 font-semibold text-right">
                                                +{data.alerts.lowStockProducts.length - 4} autres
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Commandes en attente +48h */}
                            {data.alerts.pendingOrders48h?.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FiClock className="text-yellow-600" size={16} />
                                        <span className="text-sm font-bold text-yellow-700">
                                            {data.alerts.pendingOrders48h.length} commande(s) en attente +48h
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {data.alerts.pendingOrders48h.slice(0, 4).map((o, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-yellow-700 font-semibold">
                                                    #{o.order_number || o.id?.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-yellow-600">{fmtDate(o.created_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Annulations + nouveaux users aujourd'hui */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FiAlertCircle className="text-red-400" size={15} />
                                        <span className="text-xs font-bold text-black/60">Annulées aujourd'hui</span>
                                    </div>
                                    <span className={`text-lg font-black ${data.alerts.cancelledToday > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {data.alerts.cancelledToday}
                                    </span>
                                </div>
                                <div className="w-full h-px bg-gray-100" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FiUsers className="text-blue-400" size={15} />
                                        <span className="text-xs font-bold text-black/60">Nouveaux clients aujourd'hui</span>
                                    </div>
                                    <span className="text-lg font-black text-blue-500">
                                        {data.alerts.newUsersToday}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        KPI CARDS — LIGNE 1 : indicateurs principaux
                    ════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Chiffre d'affaires"
                            value={formatPrice(data?.kpis?.revenue?.current || 0)}
                            icon={<FiDollarSign size={20} />}
                            color="bg-orange-50 text-orange-600"
                            growth={data?.kpis?.revenue?.growth}
                        />
                        <KpiCard
                            label="Commandes"
                            value={data?.kpis?.orders?.current ?? '—'}
                            icon={<FiShoppingBag size={20} />}
                            color="bg-purple-50 text-purple-600"
                            growth={data?.kpis?.orders?.growth}
                        />
                        <KpiCard
                            label="Nouveaux clients"
                            value={data?.kpis?.newUsers?.current ?? '—'}
                            icon={<FiUsers size={20} />}
                            color="bg-blue-50 text-blue-600"
                            growth={data?.kpis?.newUsers?.growth}
                        />
                        <KpiCard
                            label="Produits actifs"
                            value={data?.globals?.totalProducts ?? '—'}
                            sub={`${data?.globals?.totalUsers ?? '—'} clients au total`}
                            icon={<FiPackage size={20} />}
                            color="bg-emerald-50 text-[#2d5a27]"
                        />
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        KPI CARDS — LIGNE 2 : réclamations
                    ════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Réclamations (période)"
                            value={data?.reclamations?.total?.current ?? '—'}
                            icon={<FiMessageSquare size={20} />}
                            color="bg-rose-50 text-rose-600"
                            growth={data?.reclamations?.total?.growth}
                        />
                        <KpiCard
                            label="Réclamations en attente"
                            value={data?.reclamations?.pending?.current ?? '—'}
                            icon={<FiAlertCircle size={20} />}
                            color="bg-yellow-50 text-yellow-600"
                            growth={data?.reclamations?.pending?.growth}
                        />
                        <KpiCard
                            label="Réclamations résolues"
                            value={data?.reclamations?.resolved ?? '—'}
                            icon={<FiCheckCircle size={20} />}
                            color="bg-emerald-50 text-emerald-600"
                        />
                        <KpiCard
                            label="Taux de résolution"
                            value={
                                data?.reclamations?.total?.current > 0
                                    ? `${Math.round((data.reclamations.resolved / data.reclamations.total.current) * 100)}%`
                                    : '—'
                            }
                            icon={<FiActivity size={20} />}
                            color="bg-sky-50 text-sky-600"
                        />
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        GRAPHIQUE CA JOURNALIER (Area Chart)
                    ════════════════════════════════════════════════════════ */}
                    {dailyData.length > 1 && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle
                                icon={<FiActivity size={18} />}
                                title="Évolution journalière du CA"
                                sub="Revenus et commandes par jour"
                            />
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={v => v ? v.slice(5) : ''}
                                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="rev"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                                        width={38}
                                    />
                                    <YAxis
                                        yAxisId="ord"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false} tickLine={false}
                                        width={28}
                                    />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Area
                                        yAxisId="rev" type="monotone" dataKey="revenue"
                                        stroke="#10b981" strokeWidth={2.5}
                                        fill="url(#revGrad)"
                                        dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                                    />
                                    <Line
                                        yAxisId="ord" type="monotone" dataKey="orders"
                                        stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3"
                                        dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="flex gap-6 mt-2 justify-center">
                                <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                                    <span className="w-4 h-0.5 bg-emerald-500 rounded inline-block" /> CA (TND)
                                </span>
                                <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
                                    <span className="w-4 inline-block" style={{ borderTop: '2px dashed #8b5cf6' }} /> Commandes
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        GRAPHIQUE CA MENSUEL (Line Chart)
                    ════════════════════════════════════════════════════════ */}
                    {monthlyData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle
                                icon={<FiTrendingUp size={18} />}
                                title="Revenus & commandes mensuels"
                                sub="Évolution sur la période sélectionnée"
                            />
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={38} />
                                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                                    <Line yAxisId="ord" type="monotone" dataKey="orders"  stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        ROW : Statuts + Catégories
                    ════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Donut — statuts des commandes */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiPieChart size={18} />} title="Statuts des commandes" />
                            {statusPieData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={statusPieData}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={85}
                                                paddingAngle={3} dataKey="value"
                                            >
                                                {statusPieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v, n) => [v + ' commandes', n]}
                                                contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-1">
                                        {statusPieData.map((s, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                                                {s.name} ({s.value})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-black/30 text-center py-10">Aucune commande</p>
                            )}
                        </div>

                        {/* Donut — ventes par catégorie */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiPieChart size={18} />} title="Revenus par catégorie" />
                            {categoryData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={85}
                                                paddingAngle={3} dataKey="value"
                                            >
                                                {categoryData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v, n) => [formatPrice(v), n]}
                                                contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-1">
                                        {categoryData.map((c, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-black/60">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                                                {truncate(c.name, 14)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-black/30 text-center py-10">Aucune vente</p>
                            )}
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        ROW : Top produits + Bar catégories
                    ════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Bar — top produits par unités */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiBarChart2 size={18} />} title="Top produits — unités vendues" />
                            {data?.charts?.topProducts?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={data.charts.topProducts.map(p => ({
                                            name: truncate(p.name_fr || 'Supprimé', 13),
                                            qty: parseInt(p.total_qty),
                                            revenue: parseFloat(p.revenue),
                                        }))}
                                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(v, n) => [n === 'qty' ? v + ' unités' : formatPrice(v), n === 'qty' ? 'Quantité' : 'Revenus']}
                                            contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                        />
                                        <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={44} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-black/30 text-center py-10">Aucune vente</p>
                            )}
                        </div>

                        {/* Bar — revenus par catégorie */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiBarChart2 size={18} />} title="CA par catégorie" />
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={categoryData.map(c => ({
                                            name: truncate(c.name, 13),
                                            revenue: c.value,
                                            fill: c.color,
                                        }))}
                                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
                                        <Tooltip
                                            formatter={v => [formatPrice(v), 'Revenus']}
                                            contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={44}>
                                            {categoryData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-black/30 text-center py-10">Aucune vente</p>
                            )}
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        RÉCLAMATIONS — types + récentes
                    ════════════════════════════════════════════════════════ */}
                    {(reclamTypeData.length > 0 || data?.reclamations?.recent?.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Bar — réclamations par type */}
                            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                                <SectionTitle
                                    icon={<FiMessageSquare size={18} />}
                                    title="Réclamations par type"
                                />
                                {reclamTypeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart
                                            layout="vertical"
                                            data={reclamTypeData}
                                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis
                                                type="category" dataKey="type"
                                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                                axisLine={false} tickLine={false}
                                                tickFormatter={v => truncate(v?.replace(/_/g, ' '), 16)}
                                                width={110}
                                            />
                                            <Tooltip
                                                formatter={v => [v + ' réclamations']}
                                                contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                                {reclamTypeData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-black/30 text-center py-10">Aucune réclamation</p>
                                )}
                            </div>

                            {/* Liste — réclamations en attente récentes */}
                            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                                <SectionTitle
                                    icon={<FiAlertCircle size={18} />}
                                    title="Réclamations en attente"
                                    sub="Les plus récentes"
                                />
                                {data.reclamations.recent?.length > 0 ? (
                                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                        {data.reclamations.recent.map((r) => (
                                            <div key={r.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                                                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                                    <FiMessageSquare className="text-rose-400" size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-xs font-bold text-[#2c2c2c] truncate">{r.user_name || r.user_email}</p>
                                                        <span className="text-xs text-black/30 whitespace-nowrap">{fmtDate(r.created_at)}</span>
                                                    </div>
                                                    <p className="text-xs text-black/40 mt-0.5">
                                                        #{r.order_number} · <span className="capitalize">{(r.reclamation_type || '').replace(/_/g, ' ')}</span>
                                                    </p>
                                                    <p className="text-xs text-black/50 mt-0.5 line-clamp-1">{r.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                                        <FiCheckCircle className="text-emerald-400" size={24} />
                                        <p className="text-sm text-black/30 font-semibold">Aucune réclamation en attente</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        COMMANDES RÉCENTES + TOP CLIENTS
                    ════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Commandes récentes */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiClock size={18} />} title="Commandes récentes" />
                            <div className="space-y-2">
                                {data?.tables?.recentOrders?.length > 0 ? data.tables.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                                                <FiShoppingBag className="text-purple-400" size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#2c2c2c]">
                                                    #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
                                                </p>
                                                <p className="text-xs text-black/40">
                                                    {truncate(order.customer_name, 18)} · {order.item_count} art.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#2d5a27]">{formatPrice(parseFloat(order.total_price))}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_LABELS[order.status]?.label || order.status}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-black/30 text-center py-6">Aucune commande</p>
                                )}
                            </div>
                        </div>

                        {/* Top clients */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6">
                            <SectionTitle icon={<FiAward size={18} />} title="Top clients" sub="Classés par montant dépensé" />
                            <div className="space-y-2">
                                {data?.tables?.topCustomers?.length > 0 ? data.tables.topCustomers.map((c, i) => (
                                    <div key={c.id || i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                                        {/* Rang */}
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                                            ${i === 0 ? 'bg-yellow-100 text-yellow-600' :
                                              i === 1 ? 'bg-gray-100 text-gray-500' :
                                              i === 2 ? 'bg-orange-100 text-orange-500' :
                                                        'bg-gray-50 text-black/30'}`}
                                        >
                                            {i + 1}
                                        </div>
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-xl bg-[#2d5a27]/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-black text-[#2d5a27]">{initials(c.name)}</span>
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#2c2c2c] truncate">{c.name || '—'}</p>
                                            <p className="text-xs text-black/30 truncate">{c.email}</p>
                                        </div>
                                        {/* Stats */}
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-[#2d5a27]">{formatPrice(parseFloat(c.total_spent))}</p>
                                            <p className="text-xs text-black/30">{c.total_orders} commande{c.total_orders > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-black/30 text-center py-6">Aucun client</p>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default AdminStats;