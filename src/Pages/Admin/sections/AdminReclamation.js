import React, { useState, useEffect } from "react";
import { FiEye, FiSearch, FiAlertCircle, FiCheckCircle, FiClock, FiX } from "react-icons/fi";
import { getAllReclamations, updateReclamationStatus } from "../../../services/contactService";

// ─── Constants ────────────────────────────────────────────
const STATUS_CONFIG = {
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  en_cours:   { label: "En cours",   color: "bg-blue-100 text-blue-700"   },
  resolue:    { label: "Résolue",    color: "bg-emerald-100 text-emerald-700" },
};

const TYPE_ICONS = {
  "Commande non reçue": "📦",
  "Produit endommagé":  "💔",
  "Produit incorrect":  "❓",
  "Problème de paiement": "💳",
  "Remboursement":      "↩️",
  "Autre":              "💬",
};

// ─── Status badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.en_attente;
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Detail modal ──────────────────────────────────────────
function DetailModal({ open, reclamation, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  if (!open || !reclamation) return null;

  const handleStatus = async (status) => {
    setLoading(true);
    await onStatusChange(reclamation.id, status);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2c2c2c]">Détail de la réclamation</h2>
            <p className="text-xs text-black/40 mt-0.5">#{reclamation.id} — {new Date(reclamation.created_at).toLocaleDateString("fr-FR")}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40 hover:text-black/70">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">
          {/* Client */}
          <div className="bg-[#f9f5f0] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Client</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Nom :</span>
              <span className="font-semibold text-[#2c2c2c]">{reclamation.user_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Email :</span>
              <a href={`mailto:${reclamation.user_email}`}
                className="font-semibold text-[#2d5a27] hover:underline">{reclamation.user_email}</a>
            </div>
            {reclamation.user_phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-black/40">Tél :</span>
                <span className="font-semibold text-[#2c2c2c]">{reclamation.user_phone}</span>
              </div>
            )}
          </div>

          {/* Réclamation info */}
          <div className="bg-[#f9f5f0] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Réclamation</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/40">Type :</span>
              <span className="font-semibold text-[#2c2c2c]">
                {TYPE_ICONS[reclamation.reclamation_type] || "💬"} {reclamation.reclamation_type}
              </span>
            </div>
            {reclamation.order_number && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-black/40">Commande :</span>
                <span className="font-semibold text-[#2c2c2c]">{reclamation.order_number}</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="bg-[#f9f5f0] rounded-2xl p-4">
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Message</p>
            <p className="text-sm text-[#2c2c2c] leading-relaxed whitespace-pre-wrap">{reclamation.message}</p>
          </div>

          {/* Change status */}
          <div>
            <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Changer le statut</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  disabled={loading || reclamation.status === key}
                  onClick={() => handleStatus(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition disabled:opacity-40 ${
                    reclamation.status === key
                      ? `${cfg.color} border-transparent`
                      : "bg-white border-gray-200 text-black/50 hover:border-[#4a8c42] hover:text-[#2d5a27]"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
          <button onClick={onClose}
            className="w-full border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminReclamations ────────────────────────────────
export default function AdminReclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected]         = useState(null);
  const [successMsg, setSuccessMsg]     = useState("");
  const [errorMsg, setErrorMsg]         = useState("");

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };
  const showError   = (msg) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(""), 3000); };

  const loadReclamations = async () => {
    setLoading(true);
    try {
      const data = await getAllReclamations();
      setReclamations(data.reclamations || []);
    } catch {
      showError("Erreur lors du chargement des réclamations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReclamations(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id, status) => {
    try {
      await updateReclamationStatus(id, status);
      setReclamations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      // update the open modal too
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
      showSuccess("Statut mis à jour.");
    } catch {
      showError("Erreur lors de la mise à jour.");
    }
  };

  const filtered = reclamations.filter((r) => {
    const matchSearch =
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (r.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      r.reclamation_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // stats
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

      {/* Feedback */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`rounded-2xl p-4 text-left border-2 transition ${
              filterStatus === key ? "border-[#2d5a27] bg-[#f9f5f0]" : "bg-white border-gray-100 hover:border-[#4a8c42]"
            }`}
          >
            <p className={`text-2xl font-bold ${filterStatus === key ? "text-[#2d5a27]" : "text-[#2c2c2c]"}`}>
              {counts[key] || 0}
            </p>
            <p className="text-xs font-bold text-black/40 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, commande, type…"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42] focus:outline-none text-sm transition"
          />
        </div>
        {filterStatus !== "all" && (
          <button
            onClick={() => setFilterStatus("all")}
            className="flex items-center gap-1.5 px-4 py-3 border-2 border-[#2d5a27] text-[#2d5a27] font-bold rounded-xl text-sm hover:bg-[#f9f5f0] transition"
          >
            <FiX size={14} /> {STATUS_CONFIG[filterStatus]?.label}
          </button>
        )}
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
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="bg-[#f9f5f0] border-b border-gray-100">
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Client</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden md:table-cell">Commande</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden lg:table-cell">Date</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
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
                      {TYPE_ICONS[r.reclamation_type] || "💬"} {r.reclamation_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {r.order_number
                      ? <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{r.order_number}</span>
                      : <span className="text-black/30">—</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={r.status} />
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={!!selected}
        reclamation={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}