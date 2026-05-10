import React, { useState, useEffect } from "react";
import { FiEye, FiSearch, FiAlertCircle, FiCheckCircle, FiClock, FiX } from "react-icons/fi";
import { getAllReclamations, respondToReclamation } from "../../../services/reclamationService";
import { addWSListener, removeWSListener } from "../../../utils/websocket";
import { FiMessageSquare } from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────
//  — séparer affichage et options du formulaire
const STATUS_CONFIG = {
  en_attente: { label: "En attente",   color: "bg-amber-100 text-amber-700"     },
  en_cours:   { label: "En cours",     color: "bg-blue-100 text-blue-700"       },
  urgente:    { label: "Urgente ⚡",   color: "bg-orange-100 text-orange-700"   },
  en_retard:  { label: "En retard ⏰", color: "bg-red-100 text-red-700"         },
  resolue:    { label: "Résolue",      color: "bg-emerald-100 text-emerald-700" },
  rejetee:    { label: "Rejetée",      color: "bg-gray-100 text-gray-600"       },
};

// Options disponibles UNIQUEMENT dans le formulaire de réponse admin
const STATUS_OPTIONS_ADMIN = {
  en_cours: { label: "En cours"  },
  resolue:  { label: "Résolue"   },
  rejetee:  { label: "Rejetée"   },
};

const TYPE_ICONS = {
  produit_defectueux: "💔",
  commande_non_recue: "📦",
  produit_incorrect:  "❓",
  retard_livraison:   "🚚",
  remboursement:      "↩️",
  autre:              "💬",
};




// ─── Status Selector (Dropdown) ─────────────────────────────
function StatusSelector({ status, onChange }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.en_attente;

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-bold px-4 py-2 rounded-full border-2 bg-white cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#4a8c42] hover:shadow-sm ${cfg.color.replace("bg-", "border-").replace("text-", "")}`}
    >
      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
        <option key={key} value={key}>
          {config.label}
        </option>
      ))}
    </select>
  );
}

// ─── Detail Modal (Clean version - only view) ─────────────────
function DetailModal({ open, reclamation, onClose }) {
  if (!open || !reclamation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2c2c2c]">Détail de la réclamation</h2>
            <p className="text-xs text-black/40 mt-0.5">
              #{reclamation.id} — {new Date(reclamation.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40 hover:text-black/70"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">
          {/* Client */}
          <div className="bg-[#f9f5f0] rounded-2xl p-3 sm:p-4 space-y-2">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Client</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Nom :</span>
              <span className="font-semibold text-[#2c2c2c]">{reclamation.user_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Email :</span>
              <a href={`mailto:${reclamation.user_email}`} className="font-semibold text-[#2d5a27] hover:underline">
                {reclamation.user_email}
              </a>
            </div>
            {reclamation.user_phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-black/40">Tél :</span>
                <span className="font-semibold text-[#2c2c2c]">{reclamation.user_phone}</span>
              </div>
            )}
          </div>

          {/* Réclamation Info */}
          <div className="bg-[#f9f5f0] rounded-2xl p-3 sm:p-4 space-y-2">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Réclamation</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Type :</span>
              <span className="font-semibold text-[#2c2c2c]">
                {TYPE_ICONS[reclamation.complaint_type] || "💬"} {reclamation.complaint_type}
              </span>
            </div>
            {reclamation.order_number && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-black/40">Commande :</span>
                <span className="font-semibold text-[#2c2c2c]">{reclamation.order_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Statut actuel :</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[reclamation.status]?.color || ""}`}>
                {STATUS_CONFIG[reclamation.status]?.label || "En attente"}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="bg-[#f9f5f0] rounded-2xl p-4">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Message</p>
            <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap">
              {reclamation.message}
            </p>
          </div>

          {reclamation.admin_response && (
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Réponse de l'équipe</p>
              <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap">
                {reclamation.admin_response}
              </p>
              {reclamation.responded_at && (
                <p className="text-xs text-black/30 mt-2">
                  Répondu le {new Date(reclamation.responded_at).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
          <button 
            onClick={onClose}
            className="w-full border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function RespondModal({ open, reclamation, form, onChange, onSubmit, onClose, loading }) {
  if (!open || !reclamation) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold font-serif text-[#2c2c2c]">Répondre à la réclamation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <FiX size={20} />
          </button>
        </div>
        <div className="px-7 py-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5">Statut</label>
            <select
              value={form.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a8c42]"
            >
              {Object.entries(STATUS_OPTIONS_ADMIN).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
            ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5">
              Réponse <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={form.admin_response}
              onChange={(e) => onChange("admin_response", e.target.value)}
              placeholder="Votre réponse au client…"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a8c42] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5">
              Délai de résolution (heures, optionnel)
            </label>
            <input
              type="number" min="1"
              value={form.resolution_delay}
              onChange={(e) => onChange("resolution_delay", e.target.value)}
              placeholder="ex: 48"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4a8c42]"
            />
          </div>
        </div>
        <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm">
            Annuler
          </button>
          <button
            onClick={onSubmit} disabled={loading}
            className="flex-1 bg-[#2d5a27] text-white font-bold py-3 rounded-xl hover:bg-[#3a7232] transition text-sm disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Envoyer la réponse"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function AdminReclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  const loadReclamations = async () => {
    setLoading(true);
    try {
      const data = await getAllReclamations();
      setReclamations(data.reclamations || []);
    } catch (err) {
      showError("Erreur lors du chargement des réclamations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReclamations();
  }, []);

  useEffect(() => {
  addWSListener("admin-reclamations", (data) => {
    switch (data.type) {
      case "NEW_RECLAMATION":
        showSuccess(`📋 Nouvelle réclamation — ${data.user_name} (${data.type_label})`);
        loadReclamations();
        break;
      case "RECLAMATION_URGENTE":
        showError(`⚡ ${data.message}`);
        loadReclamations();
        break;
      case "RECLAMATION_EN_RETARD":
        showError(`⏰ ${data.message}`);
        loadReclamations();
        break;
      default:
        break;
    }
  });

  return () => removeWSListener("admin-reclamations");
}, []);

  
const [respondTarget, setRespondTarget] = useState(null); // réclamation à traiter
const [respondForm, setRespondForm]     = useState({ status: "", admin_response: "", resolution_delay: "" });
const [respondLoading, setRespondLoading] = useState(false);

const openRespondModal = (r) => {
  setRespondTarget(r);
  setRespondForm({
    status: STATUS_OPTIONS_ADMIN[r.status] ? r.status : "en_cours", // ← fallback sur la première option valide
    admin_response: r.admin_response || "",
    resolution_delay: "",
  });
};

const handleRespond = async () => {
  if (!respondForm.status || !respondForm.admin_response.trim()) {
    showError("Statut et réponse sont obligatoires.");
    return;
  }
  setRespondLoading(true);
  try {
    await respondToReclamation(respondTarget.id, respondForm); // nouveau service
    setReclamations((prev) =>
      prev.map((r) =>
        r.id === respondTarget.id
          ? { ...r, status: respondForm.status, admin_response: respondForm.admin_response }
          : r
      )
    );
    setRespondTarget(null);
    showSuccess("Réponse envoyée. Le client a été notifié par email.");
  } catch (err) {
    showError("Erreur lors de l'envoi de la réponse.");
  } finally {
    setRespondLoading(false);
  }
};


  const filtered = reclamations.filter((r) => {
    const matchSearch =
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (r.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      r.complaint_type.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === "all" || r.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Stats for cards
  const counts = reclamations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Réclamations</h2>
        <span className="text-sm text-black/40 font-medium">{reclamations.length} au total</span>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
          <FiCheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
          <FiAlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Filtres — style AdminCommandes */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filterStatus === "all" ? "bg-[#2d5a27] text-white" : "bg-white text-black/50 hover:bg-emerald-50"
          }`}
        >
          Toutes
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filterStatus === key ? "bg-[#2d5a27] text-white" : "bg-white text-black/50 hover:bg-emerald-50"
            }`}
          >
            {cfg.label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filterStatus === key ? "bg-white/20" : "bg-gray-100"}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, commande, type…"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42] focus:outline-none text-sm transition"
          />
        </div>
        
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-spin">🌿</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-black/40 text-sm font-medium">
              {search || filterStatus !== "all"
                ? "Aucune réclamation ne correspond à votre recherche."
                : "Aucune réclamation pour le moment."}
            </p>
          </div>
        ) : (
           <>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-[#f9f5f0] border-b border-gray-100">
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Client</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden md:table-cell">Commande</th>
                <th className="text-center px-4 py-4 font-bold text-[#2c2c2c] w-40">Statut</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden lg:table-cell">Date</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c] w-16">Détail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 font-bold text-[#2d5a27] text-sm">
                        {r.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#2c2c2c]">{r.user_name}</p>
                        <p className="text-xs text-black/40">{r.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-black/60">
                      {TYPE_ICONS[r.complaint_type] || "💬"} {r.complaint_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {r.order_number ? (
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {r.order_number}
                      </span>
                    ) : (
                      <span className="text-black/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[r.status]?.color || ""}`}>
                      {STATUS_CONFIG[r.status]?.label || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-black/40">
                      <FiClock size={12} />
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setSelected(r)}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                        title="Voir le détail"
                      >
                        <FiEye size={15} />
                      </button>
                      {!["resolue", "rejetee"].includes(r.status) && (
                        <button
                          onClick={() => openRespondModal(r)}
                          className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition"
                          title="Répondre"
                        >
                          <FiMessageSquare size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Mobile cards */}
          {!loading && filtered.length > 0 && (
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(r => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 font-bold text-[#2d5a27] text-sm">
                        {r.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#2c2c2c] text-sm">{r.user_name}</p>
                        <p className="text-xs text-black/40">{r.user_email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${STATUS_CONFIG[r.status]?.color || ''}`}>
                      {STATUS_CONFIG[r.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-black/60">{TYPE_ICONS[r.complaint_type]} {r.complaint_type}</p>
                  {r.order_number && (
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg inline-block">{r.order_number}</span>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-black/30">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setSelected(r)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"><FiEye size={14}/></button>
                      {!['resolue', 'rejetee'].includes(r.status) && (
                        <button onClick={() => openRespondModal(r)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition"><FiMessageSquare size={14}/></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={!!selected}
        reclamation={selected}
        onClose={() => setSelected(null)}
      />

      <RespondModal
        open={!!respondTarget}
        reclamation={respondTarget}
        form={respondForm}
        onChange={(key, val) => setRespondForm((f) => ({ ...f, [key]: val }))}
        onSubmit={handleRespond}
        onClose={() => setRespondTarget(null)}
        loading={respondLoading}
      />

    </div>
  );
}