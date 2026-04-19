import React, { useState } from "react";
import {
  FiAlertCircle, FiUser, FiMail, FiPhone,
  FiFileText, FiSend, FiCheckCircle,
} from "react-icons/fi";
import { submitReclamation } from "../../services/contactService";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-transparent transition";

const RECLAMATION_TYPES = [
  "Commande non reçue",
  "Produit endommagé",
  "Produit incorrect",
  "Problème de paiement",
  "Remboursement",
  "Autre",
];

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const Reclamations = () => {
  const [form, setForm] = useState({
    user_name: "", user_email: "", user_phone: "",
    order_number: "", reclamation_type: "", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitReclamation(form);
      setSuccess(true);
      setForm({ user_name: "", user_email: "", user_phone: "", order_number: "", reclamation_type: "", message: "" });
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

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
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
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Votre nom">
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" name="user_name" required value={form.user_name} onChange={handleChange}
                      placeholder="Votre nom" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="Votre email">
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="email" name="user_email" required value={form.user_email} onChange={handleChange}
                      placeholder="votre@email.com" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Téléphone (optionnel)">
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="tel" name="user_phone" value={form.user_phone} onChange={handleChange}
                      placeholder="+41 79 XXX XX XX" className={`${inputCls} pl-9`} />
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

              <Field label="Type de réclamation">
                <select name="reclamation_type" required value={form.reclamation_type} onChange={handleChange}
                  className={`${inputCls} text-gray-700`}>
                  <option value="">Sélectionner…</option>
                  {RECLAMATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Description du problème">
                <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder="Décrivez votre réclamation en détail…"
                  className={`${inputCls} resize-none`} />
              </Field>

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

        {/* Info */}
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
};

export default Reclamations;