import { useEffect, useState } from "react";
import { FiSend, FiUsers, FiMail, FiPlus } from "react-icons/fi";
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

const AdminEmailCampaigns = () => {
    const [campaigns, setCampaigns]     = useState([]);
    const [subscribers, setSubscribers] = useState({ total: 0, active: 0 });
    const [form, setForm]               = useState(INITIAL_FORM);
    const [promoCode, setPromoCode]     = useState("");
    const [sending, setSending]         = useState(null);
    const [showForm, setShowForm]       = useState(false);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [success, setSuccess]         = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [campRes, subRes] = await Promise.all([
                getAllCampaigns(),
                getAllSubscribers(),
            ]);
            setCampaigns(campRes.data.campaigns);
            setSubscribers({ total: subRes.data.total, active: subRes.data.active });
        } catch (err) {
            setError("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

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

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Campagnes Email</h2>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos newsletters et promotions</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                    <FiPlus size={16} />
                    Nouvelle campagne
                </button>
            </div>

            {/* ALERTS */}
            {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-xl"><FiUsers className="text-emerald-600" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{subscribers.active}</p>
                        <p className="text-xs text-gray-500">Abonnés actifs</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl"><FiUsers className="text-gray-500" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{subscribers.total}</p>
                        <p className="text-xs text-gray-500">Total abonnés</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl"><FiMail className="text-blue-600" size={20} /></div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{campaigns.length}</p>
                        <p className="text-xs text-gray-500">Campagnes créées</p>
                    </div>
                </div>
            </div>

            {/* FORM */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-gray-800">Nouvelle campagne</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Titre *</label>
                            <input
                                placeholder="Ex: Soldes d'été"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Sujet de l'email *</label>
                            <input
                                placeholder="Ex: 🎉 -20% sur toute la boutique"
                                value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                            <select
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
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
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
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
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
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

            {/* PROMO CODE INPUT */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Code promo (optionnel) :</label>
                <input
                    placeholder="Ex: ETE20"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 w-48"
                />
                <p className="text-xs text-gray-400">Sera inclus dans l'email lors de l'envoi</p>
            </div>

            {/* CAMPAIGN LIST */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-gray-800 truncate">{c.title}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                                            {c.status === 'sent' ? 'Envoyée' : c.status === 'scheduled' ? 'Planifiée' : 'Brouillon'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {TYPE_LABELS[c.type]} · {c.subject}
                                        {c.sent_count ? ` · ${c.sent_count} destinataires` : ""}
                                        {c.sent_at ? ` · ${new Date(c.sent_at).toLocaleDateString('fr-FR')}` : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleSend(c.id)}
                                    disabled={c.status === 'sent' || sending === c.id}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
                                        c.status === 'sent'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                >
                                    <FiSend size={14} />
                                    {sending === c.id ? 'Envoi...' : c.status === 'sent' ? 'Envoyée' : 'Envoyer'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminEmailCampaigns;