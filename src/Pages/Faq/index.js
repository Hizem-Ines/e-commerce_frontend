import React, { useState, useEffect, useRef } from "react";
import { getAllFaqs, searchFaqs, askQuestion } from "../../services/faqService";

const CATEGORY_LABELS = {
  livraison: { label: "Livraison",  icon: "🚚" },
  paiement:  { label: "Paiement",   icon: "💳" },
  produits:  { label: "Produits",   icon: "🧺" },
  retours:   { label: "Retours",    icon: "↩️"  },
  autre:     { label: "Autre",      icon: "💬" },
};

// ─── Accordion item ────────────────────────────────────────
const FaqItem = ({ faq, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef(null);

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
        open
          ? "border-green-300 shadow-md shadow-green-50"
          : "border-gray-100 hover:border-green-200"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-green-50/40 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm leading-snug">
          {faq.question_fr}
        </span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
            open ? "bg-green-600 rotate-45" : "bg-gray-300"
          }`}
        >
          +
        </span>
      </button>

      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? "400px" : "0px",
          transition: "max-height 0.3s ease",
          overflow: "hidden",
        }}
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
  const [form, setForm]     = useState({ user_name: "", user_email: "", question: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-green-800 text-lg mb-1">Question envoyée !</h3>
        <p className="text-green-700 text-sm">
          Nous vous répondrons par email dans les plus brefs délais.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-600 underline underline-offset-2 hover:text-green-800"
        >
          Poser une autre question
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Votre nom
          </label>
          <input
            type="text"
            name="user_name"
            required
            value={form.user_name}
            onChange={handleChange}
            placeholder="Leila Trabelsi"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Votre email
          </label>
          <input
            type="email"
            name="user_email"
            required
            value={form.user_email}
            onChange={handleChange}
            placeholder="leila@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Votre question
        </label>
        <textarea
          name="question"
          required
          rows={4}
          value={form.question}
          onChange={handleChange}
          placeholder="Décrivez votre question en détail…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
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

  // Load all on mount
  useEffect(() => {
    getAllFaqs()
      .then((d) => { setAllFaqs(d.faqs); setFiltered(d.faqs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      applyCategory(activeCategory, allFaqs);
      return;
    }
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

  const handleCategory = (cat) => {
    setSearch("");
    applyCategory(cat);
  };

  // Group by category
  const grouped = filtered.reduce((acc, faq) => {
    const cat = faq.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  const categories = [...new Set(allFaqs.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-800 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-3">
            Centre d'aide
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Questions fréquentes
          </h1>
          <p className="text-green-100 max-w-lg mx-auto text-sm leading-relaxed mb-8">
            Tout ce que vous devez savoir sur nos produits artisanaux tunisiens,
            la livraison et votre commande.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 shadow-lg"
            />
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-xs animate-pulse">
                …
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category filters */}
        {!searchQuery && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <button
              onClick={() => handleCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeCategory === "all"
                  ? "bg-green-700 text-white border-green-700 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
              }`}
            >
              Tout voir
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === cat
                    ? "bg-green-700 text-white border-green-700 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                }`}
              >
                {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label || cat}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔎</div>
            <p className="text-gray-500 text-sm">
              Aucun résultat trouvé
              {searchQuery ? ` pour « ${searchQuery} »` : ""}.
            </p>
          </div>
        ) : searchQuery ? (
          /* Flat list when searching */
          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-4">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </p>
            {filtered.map((faq) => (
              <FaqItem key={faq.id} faq={faq} defaultOpen />
            ))}
          </div>
        ) : (
          /* Grouped by category */
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, faqs]) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{CATEGORY_LABELS[cat]?.icon}</span>
                  <h2 className="font-bold text-gray-700 text-base">
                    {CATEGORY_LABELS[cat]?.label || cat}
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {faqs.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {faqs.map((faq) => (
                    <FaqItem key={faq.id} faq={faq} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Ask section */}
        <div className="mt-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-2xl text-2xl mb-4">
              ✉️
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-gray-500 text-sm">
              Posez-nous directement votre question. Nous vous répondrons par email.
            </p>
          </div>
          <AskForm />
        </div>
      </div>
    </div>
  );
};

export default Faq;