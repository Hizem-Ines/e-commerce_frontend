import React, { useState, useEffect } from "react";
import {
  FiAlertCircle, FiMail, FiPhone,
  FiFileText, FiSend, FiCheckCircle, FiUser,
} from "react-icons/fi";
import { submitReclamation, createReclamation, getMyReclamations } from "../../services/reclamationService";
import { getMyOrders } from "../../services/orderService";
import { useAuth } from "../../context/authContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { addWSListener, removeWSListener } from "../../utils/websocket";

// ─── Constantes ────────────────────────────────────────────
const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-transparent transition";

const RECLAMATION_TYPES = [
  { value: "commande_non_recue", label: "Commande non reçue" },
  { value: "produit_defectueux", label: "Produit défectueux" },
  { value: "produit_incorrect",  label: "Produit incorrect"  },
  { value: "retard_livraison",   label: "Retard de livraison" },
  { value: "remboursement",      label: "Demande de remboursement" },
  { value: "autre",              label: "Autre" },
];

const STATUS_CONFIG = {
  en_attente : { label: "En attente",          color: "bg-amber-100 text-amber-700"     },
  en_cours   : { label: "En cours",            color: "bg-blue-100 text-blue-700"       },
  urgente    : { label: "Urgente ⚡",          color: "bg-orange-100 text-orange-700"   },
  en_retard  : { label: "En retard ⏰",        color: "bg-red-100 text-red-700"         },
  resolue    : { label: "Résolue",             color: "bg-emerald-100 text-emerald-700" },
  rejetee    : { label: "Rejetée",             color: "bg-gray-100 text-gray-600"       },
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

// ─── Composant principal ────────────────────────────────────
export default function Reclamations() {
  const { user }      = useAuth();
  const { currency }  = useSiteSettings();

  // ── State formulaire ──────────────────────────────────────
  const [form, setForm] = useState({
    email: "", order_id: "", order_number: "", reclamation_type: "", message: "",
  });
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState("");

  // ── State mes réclamations (temps réel) ───────────────────
  const [myReclamations, setMyReclamations] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);

  // ── Charger commandes et réclamations ─────────────────────
  useEffect(() => {
    if (user) {
      getMyOrders()
        .then((res) => setEligibleOrders(res.data.orders || []))
        .catch((err) => console.error("Erreur commandes:", err));

      getMyReclamations()
        .then((data) => setMyReclamations(data))
        .catch((err) => console.error("Erreur réclamations:", err));
    }
  }, [user]);

  // ── WebSocket — mises à jour temps réel ──────────────────
  useEffect(() => {
    addWSListener("reclamations-page", (data) => {
      if (data.type === "RECLAMATION_UPDATE") {
        // Mettre à jour le statut localement sans refetch
        setMyReclamations((prev) =>
          prev.map((r) =>
            r.id === data.id ? { ...r, status: data.status } : r
          )
        );
      }
    });

    return () => removeWSListener("reclamations-page");
  }, []);

  // ── Handlers formulaire ───────────────────────────────────
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = user
        ? { order_id: form.order_id || null, reclamation_type: form.reclamation_type, message: form.message }
        : form;

      const newRec = await (user ? createReclamation(payload) : submitReclamation(payload));

      // Ajouter en tête de liste si connecté
      if (user && newRec) {
        setMyReclamations((prev) => [newRec, ...prev]);
      }

      setSuccess(true);
      setForm({ email: "", order_id: "", order_number: "", reclamation_type: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3a7232 100%)" }} className="text-white">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <p style={{ color: "#4a8f3f" }} className="text-sm font-semibold uppercase tracking-widest mb-3">
            Support client
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Réclamations</h1>
          <p style={{ color: "#86efac" }} className="text-sm max-w-md mx-auto">
            Un problème avec votre commande ou un produit ? Signalez-le ici.
            Notre équipe vous contactera dans les plus brefs délais.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#f0fdf4", color: "#2d5a27" }}
          >
            <FiAlertCircle size={16} />
            Formulaire de réclamation
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
          {success ? (
            <div className="py-10 text-center">
              <FiCheckCircle className="mx-auto mb-4" size={48} style={{ color: "#3a7232" }} />
              <h3 className="font-bold text-gray-800 text-lg mb-1">Réclamation envoyée !</h3>
              <p className="text-gray-500 text-sm mb-6">
                Votre réclamation a été enregistrée. Nous vous contacterons dans les plus brefs délais.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm underline underline-offset-2 hover:opacity-80 font-medium"
                style={{ color: "#2d5a27" }}
              >
                Soumettre une autre réclamation
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {user ? (
                <Field label="Commande concernée">
                  <select name="order_id" value={form.order_id} onChange={handleChange} required className={inputCls}>
                    <option value="">Sélectionner une commande…</option>
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.order_number} — {new Date(o.created_at).toLocaleDateString("fr-FR")} — {Number(o.total_price).toFixed(2)} {currency}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Votre email">
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input type="email" name="email" required value={form.email} onChange={handleChange}
                        placeholder="votre@email.com" className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                  <Field label="N° de commande (si applicable)">
                    <div className="relative">
                      <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input type="text" name="order_number" value={form.order_number} onChange={handleChange}
                        placeholder="CMD-XXXXX" className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                </div>
              )}

              <Field label="Type de réclamation">
                <select name="reclamation_type" required value={form.reclamation_type} onChange={handleChange}
                  className={`${inputCls} text-gray-700`}>
                  <option value="">Sélectionner…</option>
                  {RECLAMATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description du problème">
                <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder="Décrivez votre réclamation en détail…"
                  className={`${inputCls} resize-none`} />
              </Field>

              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <FiUser size={14} className="text-green-800 flex-shrink-0" />
                  <span>
                    Connecté en tant que <strong className="text-gray-700">{user.name}</strong>
                    {" — "}réponse envoyée à <strong className="text-gray-700">{user.email}</strong>
                  </span>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3a7232 100%)" }}
              >
                {loading ? "Envoi en cours…" : (<><FiSend size={15} /> Soumettre la réclamation</>)}
              </button>
            </form>
          )}
        </div>

        {/* Historique réclamations (user connecté) */}
        {user && myReclamations.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-[#2c2c2c] mb-4">Mes réclamations</h2>
            <div className="space-y-3">
              {myReclamations.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-bold text-[#2c2c2c]">
                      #{r.id.slice(0, 8).toUpperCase()}
                      {r.order_number && <span className="text-black/40 font-normal"> — {r.order_number}</span>}
                    </p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[r.status]?.color || ""}`}>
                      {STATUS_CONFIG[r.status]?.label || r.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{r.message}</p>
                  {r.admin_response && (
                    <div className="mt-3 bg-emerald-50 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-emerald-700 mb-1">Réponse de l'équipe :</p>
                      <p className="text-sm text-gray-700">{r.admin_response}</p>
                    </div>
                  )}
                  <p className="text-xs text-black/30 mt-2">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-sm text-gray-500">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <FiMail className="mx-auto mb-2" size={20} style={{ color: "#3a7232" }} />
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Email</p>
            <p>support@goffa.ch</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <FiPhone className="mx-auto mb-2" size={20} style={{ color: "#3a7232" }} />
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Téléphone</p>
            <p>+41 79 XXX XX XX</p>
          </div>
        </div>
      </div>
    </div>
  );
}