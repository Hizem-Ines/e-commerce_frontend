import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch, FiTruck, FiCreditCard, FiShoppingBag,
  FiRotateCcw, FiMessageCircle, FiPlus, FiArrowRight,
  FiMail, FiUser,
} from "react-icons/fi";
import { getAllFaqs, searchFaqs, askQuestion } from "../../services/faqService";

const CATEGORY_LABELS = {
  livraison: { label: "Livraison", Icon: FiTruck },
  paiement:  { label: "Paiement",  Icon: FiCreditCard },
  produits:  { label: "Produits",  Icon: FiShoppingBag },
  retours:   { label: "Retours",   Icon: FiRotateCcw },
  autre:     { label: "Autre",     Icon: FiMessageCircle },
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-transparent transition";

// ─── Accordion item ────────────────────────────────────────
const FaqItem = ({ faq, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
        open
          ? "border-green-900/30 shadow-md shadow-green-900/5"
          : "border-gray-100 hover:border-green-900/20"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-green-900/5 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm leading-snug">
          {faq.question_fr}
        </span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all duration-300 ${open ? "rotate-45" : ""}`}
          style={{ backgroundColor: open ? "#2d5a27" : "#d1d5db" }}
        >
          <FiPlus size={14} />
        </span>
      </button>
      <div
        style={{ maxHeight: open ? "400px" : "0px", transition: "max-height 0.3s ease", overflow: "hidden" }}
      >
        <div className="px-6 pb-5 pt-1 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-50">
          {faq.answer_fr}
        </div>
      </div>
    </div>
  );
};

// ─── Ask form ──────────────────────────────────────────────
const AskForm = () => {
  const [form, setForm]       = useState({ user_name: "", user_email: "", question: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await askQuestion(form);
      setSuccess(true);
      setForm({ user_name: "", user_email: "", question: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "#f0fdf4", border: "1px solid #4a8f3f" }}>
        <FiMail className="mx-auto mb-3" size={36} style={{ color: "#2d5a27" }} />
        <h3 className="font-bold text-lg mb-1" style={{ color: "#2d5a27" }}>Question envoyée !</h3>
        <p className="text-sm mb-4" style={{ color: "#3a7232" }}>
          Nous vous répondrons par email dans les plus brefs délais.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm underline underline-offset-2 hover:opacity-80"
          style={{ color: "#2d5a27" }}
        >
          Poser une autre question
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Votre nom</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" name="user_name" required value={form.user_name} onChange={handleChange}
              placeholder="Votre nom" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Votre email</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="email" name="user_email" required value={form.user_email} onChange={handleChange}
              placeholder="votre@email.com" className={`${inputCls} pl-9`} />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Votre question</label>
        <textarea name="question" required rows={4} value={form.question} onChange={handleChange}
          placeholder="Décrivez votre question en détail…" className={`${inputCls} resize-none`} />
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full text-white font-semibold py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3a7232 100%)" }}
      >
        {loading ? "Envoi en cours…" : "Envoyer ma question →"}
      </button>
    </form>
  );
};

// ─── Main page ─────────────────────────────────────────────
const Faq = () => {
  const [allFaqs, setAllFaqs]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [activeCategory, setActive] = useState("all");
  const [searchQuery, setSearch]    = useState("");
  const [searching, setSearching]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const searchTimeout                = useRef(null);

  useEffect(() => {
    getAllFaqs()
      .then((d) => { setAllFaqs(d.faqs); setFiltered(d.faqs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) { applyCategory(activeCategory, allFaqs); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      searchFaqs(searchQuery)
        .then((d) => setFiltered(d.faqs))
        .catch(() => setFiltered([]))
        .finally(() => setSearching(false));
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const applyCategory = (cat, source = allFaqs) => {
    setActive(cat);
    setFiltered(cat === "all" ? source : source.filter((f) => f.category === cat));
  };

  const handleCategory = (cat) => { setSearch(""); applyCategory(cat); };

  const grouped = filtered.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  const categories = [...new Set(allFaqs.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #2d5a27 0%, #3a7232 100%)" }} className="text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p style={{ color: "#4a8f3f" }} className="text-sm font-semibold uppercase tracking-widest mb-3">
            Centre d'aide
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Questions fréquentes</h1>
          <p style={{ color: "#86efac" }} className="max-w-lg mx-auto text-sm leading-relaxed mb-8">
            Tout ce que vous devez savoir sur nos produits artisanaux tunisiens,
            la livraison et votre commande.
          </p>
          <div className="relative max-w-md mx-auto">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-gray-800 text-sm focus:outline-none shadow-lg"
            />
            {searching && (
              <span style={{ color: "#3a7232" }} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs animate-pulse">…</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category filters */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {[{ key: "all", label: "Tout voir", Icon: null }, ...categories.map((c) => ({ key: c, ...CATEGORY_LABELS[c] }))].map(
              ({ key, label, Icon }) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategory(key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${
                      isActive ? "text-white border-transparent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:text-green-900"
                    }`}
                    style={isActive ? { backgroundColor: "#2d5a27", borderColor: "#2d5a27" } : {}}
                  >
                    {Icon && <Icon size={13} />}
                    {label || key}
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FiSearch className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500 text-sm">
              Aucun résultat trouvé{searchQuery ? ` pour « ${searchQuery} »` : ""}.
            </p>
          </div>
        ) : searchQuery ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-4">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((faq) => <FaqItem key={faq.id} faq={faq} defaultOpen />)}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, faqs]) => {
              const { label, Icon } = CATEGORY_LABELS[cat] || {};
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    {Icon && <Icon size={18} style={{ color: "#3a7232" }} />}
                    <h2 className="font-bold text-gray-700 text-base">{label || cat}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{faqs.length}</span>
                  </div>
                  <div className="space-y-2">
                    {faqs.map((faq) => <FaqItem key={faq.id} faq={faq} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Ask section */}
        <div className="mt-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ backgroundColor: "#f0fdf4" }}>
              <FiMail size={22} style={{ color: "#2d5a27" }} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Vous n'avez pas trouvé votre réponse ?</h2>
            <p className="text-gray-500 text-sm">Posez-nous directement votre question. Nous vous répondrons par email.</p>
          </div>
          <AskForm />

          <p className="text-center text-sm text-gray-400 mt-6">
            Vous avez une réclamation ?{" "}
            <Link
              to="/reclamations"
              className="font-semibold underline underline-offset-2 hover:opacity-75 inline-flex items-center gap-1"
              style={{ color: "#2d5a27" }}
            >
              Accéder au formulaire de reclamations <FiArrowRight size={13} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Faq;