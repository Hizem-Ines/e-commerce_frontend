import { useEffect, useState } from "react";
import { FiSend, FiUsers, FiMail, FiPlus, FiX, FiCheck } from "react-icons/fi";
import {
    getAllCampaigns,
    getAllSubscribers,
    createCampaign,
    sendCampaign,
} from "../../../services/emailcampaignService";

const TYPES = ["promotion", "black_friday", "nouveautes", "flash_sale"];

const TYPE_LABELS = {
    promotion:    "Promotion",
    black_friday: "Black Friday",
    nouveautes:   "Nouveautés",
    flash_sale:   "Offre Flash",
};

const STATUS_STYLES = {
    draft:     "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-700",
    sent:      "bg-emerald-100 text-emerald-700",
};

const INITIAL_FORM = {
    title: "", subject: "", type: "promotion", content_fr: "", scheduled_at: ""
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getInitials = (name, email) => {
    if (name) return name.slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
};

// ── Component ─────────────────────────────────────────────────────────────────

const AdminEmailCampaigns = () => {
    const [tab, setTab]                 = useState("campaigns"); // "campaigns" | "subscribers"
    const [campaigns, setCampaigns]     = useState([]);
    const [subscribers, setSubscribers] = useState({ total: 0, active: 0, list: [] });
    const [subFilter, setSubFilter]     = useState("all"); // "all" | "active" | "inactive"
    const [form, setForm]               = useState(INITIAL_FORM);
    const [promoCode, setPromoCode]     = useState("");
    const [sending, setSending]         = useState(null);
    const [showForm, setShowForm]       = useState(false);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [success, setSuccess]         = useState("");

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campRes, subRes] = await Promise.all([
                getAllCampaigns(),
                getAllSubscribers(),
            ]);
            setCampaigns(campRes.data.campaigns);
            setSubscribers({
                total:  subRes.data.total,
                active: subRes.data.active,
                list:   subRes.data.subscribers,   // ← tableau complet
            });
        } catch {
            setError("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!form.title || !form.subject || !form.content_fr) {
            setError("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        try {
            await createCampaign(form);
            setSuccess("Campagne créée avec succès !");
            setForm(INITIAL_FORM);
            setShowForm(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la création.");
        }
    };

    const handleSend = async (id) => {
        if (!window.confirm("Envoyer cette campagne à tous les abonnés actifs ?")) return;
        setSending(id);
        try {
            const res = await sendCampaign(id, promoCode || undefined);
            setSuccess(res.data.message);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'envoi.");
        } finally {
            setSending(null);
        }
    };

    // ── Filtered subscribers ───────────────────────────────────────────────────

    const filteredSubs = subscribers.list.filter(s => {
        if (subFilter === "active")   return s.is_active;
        if (subFilter === "inactive") return !s.is_active;
        return true;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Campagnes Email</h2>
                    <p className="text-sm text-black/40 mt-0.5">Gérez vos newsletters et promotions</p>
                </div>
                {tab === "campaigns" && (
                    <button
                        onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
                        className="flex items-center gap-2 bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <FiPlus size={16} />
                        Nouvelle campagne
                    </button>
                )}
            </div>

            {/* ALERTS */}
            {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl"><FiUsers className="text-[#2d5a27]" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{subscribers.active}</p>
                        <p className="text-xs text-gray-500">Abonnés actifs</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl"><FiUsers className="text-gray-500" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{subscribers.total}</p>
                        <p className="text-xs text-gray-500">Total abonnés</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl"><FiMail className="text-blue-600" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{campaigns.length}</p>
                        <p className="text-xs text-gray-500">Campagnes créées</p>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setTab("campaigns")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        tab === "campaigns"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <span className="flex items-center gap-2"><FiMail size={14} /> Campagnes</span>
                </button>
                <button
                    onClick={() => setTab("subscribers")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        tab === "subscribers"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <FiUsers size={14} /> Abonnés
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {subscribers.active}
                        </span>
                    </span>
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB — CAMPAIGNS                                             */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {tab === "campaigns" && (
                <>
                    {/* FORM */}
                    {showForm && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 space-y-4">
                            <h3 className="font-bold text-gray-800">Nouvelle campagne</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Titre *</label>
                                    <input
                                        placeholder="Ex: Soldes d'été"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Sujet de l'email *</label>
                                    <input
                                        placeholder="Ex: 🎉 -20% sur toute la boutique"
                                        value={form.subject}
                                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42]"
                                    >
                                        {TYPES.map(t => (
                                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Planifier (optionnel)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.scheduled_at}
                                        onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contenu *</label>
                                <textarea
                                    placeholder="Rédigez le contenu de votre email..."
                                    value={form.content_fr}
                                    rows={4}
                                    onChange={e => setForm(f => ({ ...f, content_fr: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42] resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCreate}
                                    className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                >
                                    Créer la campagne
                                </button>
                                <button
                                    onClick={() => { setShowForm(false); setForm(INITIAL_FORM); }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold transition"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PROMO CODE */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Code promo (optionnel) :</label>
                        <input
                            placeholder="Ex: ETE20"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a8c42] w-full sm:w-48"
                        />
                        <p className="text-xs text-gray-400">Sera inclus dans l'email lors de l'envoi</p>
                    </div>

                    {/* CAMPAIGN LIST */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Toutes les campagnes</h3>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Aucune campagne créée.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {campaigns.map(c => (
                                    <div key={c.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="font-semibold text-gray-800 truncate">{c.title}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                                                    {c.status === "sent" ? "Envoyée" : c.status === "scheduled" ? "Planifiée" : "Brouillon"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {TYPE_LABELS[c.type]} · {c.subject}
                                                {c.sent_count ? ` · ${c.sent_count} destinataires` : ""}
                                                {c.sent_at ? ` · ${formatDate(c.sent_at)}` : ""}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSend(c.id)}
                                            disabled={c.status === "sent" || sending === c.id}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
                                                c.status === "sent"
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-[#2d5a27] hover:bg-[#4a8c42] text-white"
                                            }`}
                                        >
                                            <FiSend size={14} />
                                            {sending === c.id ? "Envoi..." : c.status === "sent" ? "Envoyée" : "Envoyer"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB — SUBSCRIBERS                                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {tab === "subscribers" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                    {/* Sub-header with filter */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="font-bold text-gray-800">
                            Liste des abonnés
                            <span className="ml-2 text-sm font-normal text-gray-400">({filteredSubs.length})</span>
                        </h3>
                        {/* Filter pills */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit text-xs font-semibold">
                            {[
                                { key: "all",      label: "Tous" },
                                { key: "active",   label: "Actifs" },
                                { key: "inactive", label: "Désabonnés" },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setSubFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-lg transition ${
                                        subFilter === f.key
                                            ? "bg-white text-gray-800 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
                    ) : filteredSubs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Aucun abonné trouvé.</div>
                    ) : (
                        <>
                            {/* ── Desktop table (hidden on mobile) ── */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                                            <th className="text-left px-6 py-3">Abonné</th>
                                            <th className="text-left px-6 py-3">Email</th>
                                            <th className="text-left px-6 py-3">Statut</th>
                                            <th className="text-left px-6 py-3">Inscrit le</th>
                                            <th className="text-left px-6 py-3">Désabonné le</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredSubs.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {getInitials(s.name || s.user_name, s.email)}
                                                        </div>
                                                        <span className="font-medium text-gray-800 truncate max-w-[140px]">
                                                            {s.name || s.user_name || "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-gray-500 truncate max-w-[200px]">{s.email}</td>
                                                <td className="px-6 py-3">
                                                    {s.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
                                                            <FiCheck size={11} /> Actif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-semibold">
                                                            <FiX size={11} /> Désabonné
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(s.subscribed_at)}</td>
                                                <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(s.unsubscribed_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Mobile cards (visible on mobile only) ── */}
                            <div className="sm:hidden divide-y divide-gray-50">
                                {filteredSubs.map(s => (
                                    <div key={s.id} className="px-4 py-4 flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            {getInitials(s.name || s.user_name, s.email)}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-gray-800 text-sm truncate">
                                                    {s.name || s.user_name || "Anonyme"}
                                                </p>
                                                {s.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                                        <FiCheck size={10} /> Actif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                                        <FiX size={10} /> Désabonné
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{s.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Inscrit le {formatDate(s.subscribed_at)}
                                                {s.unsubscribed_at && ` · Désabonné le ${formatDate(s.unsubscribed_at)}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default AdminEmailCampaigns;