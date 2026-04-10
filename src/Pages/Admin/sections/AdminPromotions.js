import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiPlus, FiSearch, FiEdit, FiTrash2,
  FiTag, FiCheckCircle, FiClock, FiBarChart2, FiX
} from "react-icons/fi";

// ─── CONFIG ───────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const EMPTY_FORM = {
  code: "", description_fr: "", description_ar: "",
  discount_type: "percent", discount_value: "",
  min_order_amount: "", starts_at: "", expires_at: "",
  max_uses: "", is_active: true,
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
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold";
  if (!row.is_active)
    return <span className={`${base} bg-gray-100 text-gray-500`}><span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />Désactivé</span>;
  if (isExpired(row.expires_at))
    return <span className={`${base} bg-red-50 text-red-600`}><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Expiré</span>;
  if (row.starts_at && new Date(row.starts_at) > new Date())
    return <span className={`${base} bg-amber-50 text-amber-600`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />À venir</span>;
  if (row.max_uses && row.used_count >= row.max_uses)
    return <span className={`${base} bg-orange-50 text-orange-600`}><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />Épuisé</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-700`}><span className="w-1.5 h-1.5 rounded-full bg-[#4a8c42] inline-block animate-pulse" />Actif</span>;
};

// ─── MODAL FORM ───────────────────────────────────────────
const PromotionModal = ({ mode, initial, onClose, onSaved }) => {
  const [form, setForm] = useState(
    mode === "edit"
      ? {
          ...EMPTY_FORM, ...initial,
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
    if (!form.code.trim())    return setError("Le code promo est requis.");
    if (!form.discount_value) return setError("La valeur de réduction est requise.");
    if (!form.starts_at)      return setError("La date de début est requise.");
    if (!form.expires_at)     return setError("La date d'expiration est requise.");
    if (new Date(form.expires_at) <= new Date(form.starts_at))
      return setError("La date d'expiration doit être après la date de début.");
    if (form.discount_type === "percent" &&
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
      if (mode === "edit") await api.put(`/promotions/${initial.id}`, payload);
      else                 await api.post("/promotions", payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42] focus:outline-none text-sm transition";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header — same style as AdminUtilisateurs */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#f9f5f0]">
          <div>
            <p className="font-bold text-[#2c2c2c]">
              {mode === "edit" ? `Modifier : ${initial?.code}` : "Nouvelle promotion"}
            </p>
            <p className="text-xs text-black/40 mt-0.5">
              {mode === "edit" ? "Modifiez les informations du code promo" : "Créer un nouveau code promo"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          {/* Code + Actif */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Code promo *</label>
              <input name="code" value={form.code} onChange={handle}
                placeholder="EX: ETE25"
                className={`${inputCls} font-mono uppercase`} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#2d5a27] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm font-bold text-black/50">Active</span>
              </label>
            </div>
          </div>

          {/* Type + Valeur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Type de réduction *</label>
              <select name="discount_type" value={form.discount_type} onChange={handle} className={inputCls}>
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (TND)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">
                Valeur * {form.discount_type === "percent" ? "(1–100%)" : "(TND)"}
              </label>
              <input type="number" name="discount_value" value={form.discount_value} onChange={handle}
                min="0" max={form.discount_type === "percent" ? 100 : undefined}
                step={form.discount_type === "percent" ? 1 : 0.5}
                placeholder={form.discount_type === "percent" ? "20" : "15.000"}
                className={inputCls} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Date de début *</label>
              <input type="date" name="starts_at" value={form.starts_at} onChange={handle} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Date d'expiration *</label>
              <input type="date" name="expires_at" value={form.expires_at} onChange={handle} className={inputCls} />
            </div>
          </div>

          {/* Min commande + Max utilisations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Montant minimum (TND)</label>
              <input type="number" name="min_order_amount" value={form.min_order_amount} onChange={handle}
                min="0" step="0.5" placeholder="Aucun minimum" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Utilisations max</label>
              <input type="number" name="max_uses" value={form.max_uses} onChange={handle}
                min="0" step="1" placeholder="Illimité" className={inputCls} />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Description (FR)</label>
              <textarea name="description_fr" value={form.description_fr} onChange={handle}
                rows={2} placeholder="Description en français..."
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1.5">Description (AR)</label>
              <textarea name="description_ar" value={form.description_ar} onChange={handle}
                rows={2} placeholder="وصف بالعربية..." dir="rtl"
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Footer — same style as AdminUtilisateurs */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-[#fafafa]">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold py-3 rounded-xl transition disabled:opacity-50 text-sm">
            {loading ? "..." : mode === "edit" ? "Enregistrer" : "Créer la promotion"}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer la promotion ?</h3>
        <p className="text-black/50 text-sm mb-2">
          Le code <span className="font-mono font-bold text-[#2c2c2c]">{promotion.code}</span> sera définitivement supprimé.
        </p>
        <p className="text-black/40 text-xs mb-6">Les utilisateurs ne pourront plus l'utiliser.</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? "..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────
const AdminPromotions = () => {
  const [promotions, setPromotions]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal]               = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/promotions");
      setPromotions(res.data.promotions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const stats = {
    total:     promotions.length,
    active:    promotions.filter(isActive).length,
    expired:   promotions.filter((p) => isExpired(p.expires_at) && p.is_active).length,
    totalUses: promotions.reduce((sum, p) => sum + (p.used_count || 0), 0),
  };

  const onSaved   = () => { setModal(null); fetchData(); };
  const onDeleted = () => { setModal(null); fetchData(); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Promotions</h2>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
        >
          <FiPlus size={16} /> Nouvelle promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",        value: stats.total,     icon: <FiTag size={18} />,       bg: "bg-blue-50 text-blue-600"     },
          { label: "Actives",      value: stats.active,    icon: <FiCheckCircle size={18}/>, bg: "bg-emerald-50 text-[#2d5a27]" },
          { label: "Expirées",     value: stats.expired,   icon: <FiClock size={18} />,     bg: "bg-red-50 text-red-500"       },
          { label: "Utilisations", value: stats.totalUses, icon: <FiBarChart2 size={18} />, bg: "bg-amber-50 text-amber-600"   },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2c2c]">{s.value}</p>
              <p className="text-xs text-black/40">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <form onSubmit={(e) => e.preventDefault()} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un code promo..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42] focus:outline-none text-sm transition"
          />
        </div>
      </form>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-6">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterStatus === f.value
                ? "bg-[#2d5a27] text-white"
                : "bg-white text-black/50 border-2 border-gray-200 hover:border-[#4a8c42]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-4xl animate-spin">🌿</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl text-sm">
          ❌ {error} <button onClick={fetchData} className="underline ml-2">Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-black/40">Aucune promotion trouvée</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {/* Same as AdminUtilisateurs: bg-[#f9f5f0] + font-bold text-[#2c2c2c] */}
              <tr className="bg-[#f9f5f0] border-b border-gray-100">
                {["Code", "Réduction", "Dates", "Utilisations", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left font-bold text-[#2c2c2c]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((promo, i) => (
                <tr key={promo.id}
                  className={`border-b border-gray-50 hover:bg-[#fdf6ec] transition-colors ${i % 2 !== 0 ? "bg-gray-50/30" : ""}`}>

                  {/* Code */}
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl inline-block text-sm">
                      {promo.code}
                    </span>
                    {promo.description_fr && (
                      <p className="text-xs text-black/40 mt-1 truncate max-w-[160px]">{promo.description_fr}</p>
                    )}
                  </td>

                  {/* Réduction */}
                  <td className="px-5 py-4">
                    <span className="font-bold text-[#2d5a27] text-sm">
                      {promo.discount_type === "percent"
                        ? `${promo.discount_value}%`
                        : `${Number(promo.discount_value).toFixed(3)} TND`}
                    </span>
                    {promo.min_order_amount && (
                      <p className="text-xs text-black/40">min. {Number(promo.min_order_amount).toFixed(3)} TND</p>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="px-5 py-4 text-xs text-black/50">
                    <div className="flex flex-col gap-0.5">
                      <span>Début : {formatDate(promo.starts_at)}</span>
                      <span className={isExpired(promo.expires_at) ? "text-red-500 font-semibold" : ""}>
                        Fin : {formatDate(promo.expires_at)}
                      </span>
                    </div>
                  </td>

                  {/* Utilisations */}
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-[#2c2c2c]">{promo.used_count || 0}</span>
                    {promo.max_uses ? (
                      <>
                        <span className="text-xs text-black/40"> / {promo.max_uses}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 mx-auto">
                          <div
                            className="h-1.5 bg-[#4a8c42] rounded-full"
                            style={{ width: `${Math.min(100, ((promo.used_count || 0) / promo.max_uses) * 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-black/40">illimité</p>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    <StatusBadge row={promo} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal({ type: "edit", data: promo })}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                        title="Modifier"
                      >
                        <FiEdit size={15} />
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", data: promo })}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                        title="Supprimer"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-black/40">
              {filtered.length} promotion{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
              {promotions.length !== filtered.length && ` sur ${promotions.length}`}
            </p>
          </div>
        </div>
      )}

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