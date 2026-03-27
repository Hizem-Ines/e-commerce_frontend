import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── CONFIG ───────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const EMPTY_FORM = {
  code: "",
  description_fr: "",
  description_ar: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "",
  starts_at: "",
  expires_at: "",
  max_uses: "",
  is_active: true,
};

// ─── UTILS ────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-TN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatDateInput = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
};

const isExpired = (expires_at) => {
  if (!expires_at) return false;
  return new Date(expires_at) < new Date();
};

const isActive = (row) => {
  if (!row.is_active) return false;
  if (isExpired(row.expires_at)) return false;
  if (row.starts_at && new Date(row.starts_at) > new Date()) return false;
  if (row.max_uses && row.used_count >= row.max_uses) return false;
  return true;
};

// ─── BADGE STATUT ─────────────────────────────────────────
const StatusBadge = ({ row }) => {
  if (!row.is_active)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
        Désactivé
      </span>
    );
  if (isExpired(row.expires_at))
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Expiré
      </span>
    );
  if (row.starts_at && new Date(row.starts_at) > new Date())
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        À venir
      </span>
    );
  if (row.max_uses && row.used_count >= row.max_uses)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
        Épuisé
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
      Actif
    </span>
  );
};

// ─── MODAL FORM ───────────────────────────────────────────
const PromotionModal = ({ mode, initial, onClose, onSaved }) => {
  const [form, setForm] = useState(
    mode === "edit"
      ? {
          ...EMPTY_FORM,
          ...initial,
          starts_at:        formatDateInput(initial?.starts_at),
          expires_at:       formatDateInput(initial?.expires_at),
          discount_value:   initial?.discount_value   ?? "",
          min_order_amount: initial?.min_order_amount ?? "",
          max_uses:         initial?.max_uses         ?? "",
        }
      : { ...EMPTY_FORM }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async () => {
    setError("");
    if (!form.code.trim())       return setError("Le code promo est requis.");
    if (!form.discount_value)    return setError("La valeur de réduction est requise.");
    if (!form.starts_at)         return setError("La date de début est requise.");
    if (!form.expires_at)        return setError("La date d'expiration est requise.");
    if (new Date(form.expires_at) <= new Date(form.starts_at))
      return setError("La date d'expiration doit être après la date de début.");
    if (form.discount_type === "percentage" &&
        (Number(form.discount_value) <= 0 || Number(form.discount_value) > 100))
      return setError("Le pourcentage doit être entre 1 et 100.");

    setLoading(true);
    try {
      const payload = {
        code:             form.code.toUpperCase().trim(),
        description_fr:   form.description_fr  || null,
        description_ar:   form.description_ar  || null,
        discount_type:    form.discount_type,
        discount_value:   Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        starts_at:        form.starts_at,
        expires_at:       form.expires_at,
        max_uses:         form.max_uses ? Number(form.max_uses) : null,
        is_active:        form.is_active,
      };

      if (mode === "edit") {
        await api.put(`/promotions/${initial.id}`, payload);
      } else {
        await api.post("/promotions", payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold text-[#2c2c2c] font-serif">
              {mode === "edit" ? "Modifier la promotion" : "Nouvelle promotion"}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "edit" ? `Code : ${initial?.code}` : "Remplissez les détails du code promo"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >✕</button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Code + Toggle actif */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Code promo *
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handle}
                placeholder="EX: ETE25"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#c8a96e] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">Promotion active</span>
              </label>
            </div>
          </div>

          {/* Type + Valeur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Type de réduction *
              </label>
              <select
                name="discount_type"
                value={form.discount_type}
                onChange={handle}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all bg-white"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (TND)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Valeur * {form.discount_type === "percentage" ? "(1–100%)" : "(TND)"}
              </label>
              <input
                type="number"
                name="discount_value"
                value={form.discount_value}
                onChange={handle}
                min="0"
                max={form.discount_type === "percentage" ? 100 : undefined}
                step={form.discount_type === "percentage" ? 1 : 0.5}
                placeholder={form.discount_type === "percentage" ? "20" : "15.000"}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Date de début *
              </label>
              <input
                type="date"
                name="starts_at"
                value={form.starts_at}
                onChange={handle}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Date d'expiration *
              </label>
              <input
                type="date"
                name="expires_at"
                value={form.expires_at}
                onChange={handle}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
          </div>

          {/* Min commande + Max utilisations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Montant minimum (TND)
              </label>
              <input
                type="number"
                name="min_order_amount"
                value={form.min_order_amount}
                onChange={handle}
                min="0"
                step="0.5"
                placeholder="Aucun minimum"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Utilisations max
              </label>
              <input
                type="number"
                name="max_uses"
                value={form.max_uses}
                onChange={handle}
                min="0"
                step="1"
                placeholder="Illimité"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Description (FR)
              </label>
              <textarea
                name="description_fr"
                value={form.description_fr}
                onChange={handle}
                rows={2}
                placeholder="Description en français..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Description (AR)
              </label>
              <textarea
                name="description_ar"
                value={form.description_ar}
                onChange={handle}
                rows={2}
                placeholder="وصف بالعربية..."
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2c2c2c] hover:bg-[#1a1a1a] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {mode === "edit" ? "Enregistrer" : "Créer la promotion"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL SUPPRESSION ────────────────────────────────────
const DeleteModal = ({ promotion, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      await api.delete(`/promotions/${promotion.id}`);
      onDeleted();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl flex-shrink-0">
            🗑️
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2c2c2c] font-serif">Supprimer la promotion</h3>
            <p className="text-sm text-gray-500">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-gray-700">
            Vous allez supprimer le code{" "}
            <span className="font-mono font-bold text-[#2c2c2c]">{promotion.code}</span>.
            {" "}Les utilisateurs ne pourront plus l'utiliser.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────
const AdminPromotions = () => {
  const [promotions, setPromotions]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal]             = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/promotions");
      setPromotions(res.data.promotions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement des promotions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtres ────────────────────────────────────────────
  const filtered = promotions.filter((p) => {
    const matchSearch =
      !search ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.description_fr?.toLowerCase().includes(search.toLowerCase());

    const statusOk =
      filterStatus === "all" ||
      (filterStatus === "active"   && isActive(p)) ||
      (filterStatus === "inactive" && !p.is_active) ||
      (filterStatus === "expired"  && isExpired(p.expires_at) && p.is_active) ||
      (filterStatus === "upcoming" && p.starts_at && new Date(p.starts_at) > new Date() && p.is_active);

    return matchSearch && statusOk;
  });

  // ── Stats ──────────────────────────────────────────────
  const stats = {
    total:      promotions.length,
    active:     promotions.filter(isActive).length,
    expired:    promotions.filter((p) => isExpired(p.expires_at) && p.is_active).length,
    totalUses:  promotions.reduce((sum, p) => sum + (p.used_count || 0), 0),
  };

  const onSaved   = () => { setModal(null); fetchData(); };
  const onDeleted = () => { setModal(null); fetchData(); };

  return (
    <div>
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Promotions</h2>
          <p className="text-sm text-gray-500 mt-0.5">Codes promo, réductions et offres spéciales</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",        value: stats.total,      icon: "🎫", color: "bg-blue-50 text-blue-700"   },
          { label: "Actives",      value: stats.active,     icon: "✅", color: "bg-green-50 text-green-700" },
          { label: "Expirées",     value: stats.expired,    icon: "⏰", color: "bg-red-50 text-red-600"     },
          { label: "Utilisations", value: stats.totalUses,  icon: "📊", color: "bg-amber-50 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2c2c]">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barre filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un code promo..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all",      label: "Tous"       },
              { value: "active",   label: "Actifs"     },
              { value: "upcoming", label: "À venir"    },
              { value: "expired",  label: "Expirés"    },
              { value: "inactive", label: "Désactivés" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  filterStatus === f.value
                    ? "bg-[#2c2c2c] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <svg className="w-8 h-8 animate-spin text-[#c8a96e]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm">Chargement des promotions…</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center gap-3 text-red-500">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm">{error}</p>
            <button onClick={fetchData} className="text-xs underline">Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <span className="text-4xl">🎫</span>
            <p className="text-sm font-medium">Aucune promotion trouvée</p>
            {search && <p className="text-xs">Essayez un autre terme de recherche</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100">
                  {["Code", "Réduction", "Dates", "Utilisations", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo, i) => (
                  <tr
                    key={promo.id}
                    className={`border-t border-gray-50 hover:bg-amber-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-[#2c2c2c] text-sm tracking-wider bg-gray-100 px-2 py-0.5 rounded-lg inline-block w-fit">
                          {promo.code}
                        </span>
                        {promo.description_fr && (
                          <span className="text-xs text-gray-400 truncate max-w-[160px]">
                            {promo.description_fr}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Réduction */}
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${promo.discount_type === "percentage" ? "text-[#c8a96e]" : "text-green-600"}`}>
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}%`
                          : `${Number(promo.discount_value).toFixed(3)} TND`}
                      </span>
                      {promo.min_order_amount && (
                        <p className="text-xs text-gray-400">
                          min. {Number(promo.min_order_amount).toFixed(3)} TND
                        </p>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        <span><span className="text-gray-400">Début : </span>{formatDate(promo.starts_at)}</span>
                        <span>
                          <span className="text-gray-400">Fin : </span>
                          <span className={isExpired(promo.expires_at) ? "text-red-500 font-medium" : ""}>
                            {formatDate(promo.expires_at)}
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Utilisations */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-[#2c2c2c]">{promo.used_count || 0}</span>
                        {promo.max_uses ? (
                          <>
                            <span className="text-xs text-gray-400">/ {promo.max_uses}</span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full mt-0.5">
                              <div
                                className="h-1 bg-[#c8a96e] rounded-full"
                                style={{ width: `${Math.min(100, ((promo.used_count || 0) / promo.max_uses) * 100)}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">illimité</span>
                        )}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <StatusBadge row={promo} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ type: "edit", data: promo })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >✏️</button>
                        <button
                          onClick={() => setModal({ type: "delete", data: promo })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {filtered.length} promotion{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
                {promotions.length !== filtered.length && ` sur ${promotions.length}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <PromotionModal mode="create" onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "edit" && (
        <PromotionModal mode="edit" initial={modal.data} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal promotion={modal.data} onClose={() => setModal(null)} onDeleted={onDeleted} />
      )}
    </div>
  );
};

export default AdminPromotions;