import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiTrash2, FiLink,  } from "react-icons/fi";

import {
  adminGetAllFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminToggleFaq,
  adminDeleteFaq,
  adminGetQuestions,
  adminAnswerQuestion,
  adminLinkQuestionToFaq,
  adminDeleteQuestion,
} from "../../../services/faqService";
import { addWSListener, removeWSListener } from '../../../utils/websocket';

const CATEGORY_OPTIONS = [
  { value: "livraison", label: "🚚 Livraison" },
  { value: "paiement",  label: "💳 Paiement"  },
  { value: "produits",  label: "🧺 Produits"  },
  { value: "retours",   label: "↩️ Retours"   },
  { value: "autre",     label: "💬 Autre"     },
];

const CATEGORY_LABELS = {
  livraison: "🚚 Livraison",
  paiement:  "💳 Paiement",
  produits:  "🧺 Produits",
  retours:   "↩️ Retours",
  autre:     "💬 Autre",
};

const STATUS_BADGE = {
  pending:  "bg-yellow-100 text-yellow-700",
  answered: "bg-green-100  text-green-700",
};

const selectCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#4a8c42] focus:outline-none";
const textareaCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#4a8c42] focus:outline-none resize-none";


// ─── Modale FAQ (créer / modifier) ────────────────────────
const FaqModal = ({ faq, onClose, onSaved }) => {
  const isEdit = !!faq?.id;
  const [form, setForm] = useState({
    category:    faq?.category    || "livraison",
    question_fr: faq?.question_fr || "",
    answer_fr:   faq?.answer_fr   || "",
    order_index: faq?.order_index ?? 0,
    is_active:   faq?.is_active   ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await adminUpdateFaq(faq.id, form);
      } else {
        await adminCreateFaq(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">
            {isEdit ? "Modifier la FAQ" : "Nouvelle FAQ"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Catégorie</label>
              <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Ordre</label>
              <input
                type="number" name="order_index" min={0}
                value={form.order_index} onChange={handleChange}
                className={selectCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Question</label>
            <textarea name="question_fr" required rows={2} value={form.question_fr} onChange={handleChange} className={textareaCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Réponse</label>
            <textarea name="answer_fr" required rows={4} value={form.answer_fr} onChange={handleChange} className={textareaCls} />
          </div>

          {isEdit && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-green-700 rounded"
                />
                <span className="text-sm font-semibold text-gray-700">FAQ active</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-6">
                Une FAQ inactive n'est pas visible sur le site.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-sm text-white bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-60 transition-colors font-semibold">
              {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer la FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Modale réponse question user ──────────────────────────
// Supporte : answer, create_faq (optionnel), faq_category (si create_faq)
const AnswerModal = ({ question, onClose, onSaved }) => {
  const [answer,      setAnswer]      = useState("");
  const [createFaq,   setCreateFaq]   = useState(false);
  const [faqCategory, setFaqCategory] = useState("autre");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Passer create_faq et faq_category si l'admin veut créer une FAQ
      await adminAnswerQuestion(question.id, {
        answer,
        create_faq:   createFaq,
        faq_category: createFaq ? faqCategory : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">Répondre à la question</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Question */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Question de {question.user_name}
            </p>
            <p className="text-gray-700 italic">« {question.question} »</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Votre réponse (envoyée par email)
            </label>
            <textarea
              required rows={5} value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={textareaCls}
              placeholder="Rédigez votre réponse…"
            />
          </div>

          {/* Option : créer une FAQ depuis cette question */}
          <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createFaq}
                onChange={(e) => setCreateFaq(e.target.checked)}
                className="w-4 h-4 accent-green-700 rounded"
              />
              <span className="text-sm font-semibold text-green-800">
                Créer une FAQ depuis cette question
              </span>
            </label>
            <p className="text-xs text-green-600 mt-1 ml-6">
              La question et votre réponse seront ajoutées à la base de FAQs.
            </p>

            {createFaq && (
              <div className="mt-3 ml-6">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Catégorie de la FAQ
                </label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className={selectCls}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-sm text-white bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-60 transition-colors font-semibold">
              {loading ? "Envoi…" : createFaq ? "Envoyer & créer FAQ ✉️" : "Envoyer la réponse ✉️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Modale lier une question à une FAQ existante ──────────
// PATCH /api/faqs/admin/questions/:id/link
const LinkModal = ({ question, faqs, onClose, onSaved }) => {
  const [faqId,   setFaqId]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!faqId) { setError("Veuillez sélectionner une FAQ."); return; }
    setError("");
    setLoading(true);
    try {
      await adminLinkQuestionToFaq(question.id,(faqId));
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Grouper les FAQs par catégorie pour le select
  const grouped = faqs.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FiLink size={16} style={{ color: "#2d5a27" }} />
            Lier à une FAQ existante
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Question */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Question de {question.user_name}
            </p>
            <p className="text-gray-700 italic">« {question.question} »</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              FAQ correspondante
            </label>
            <select value={faqId} onChange={(e) => setFaqId(e.target.value)} className={selectCls}>
              <option value="">— Sélectionner une FAQ —</option>
              {Object.entries(grouped).map(([cat, items]) => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                  {items.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.question_fr.length > 70 ? f.question_fr.slice(0, 70) + "…" : f.question_fr}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Prévisualisation de la réponse qui sera envoyée */}
          {faqId && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-sm">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                Réponse qui sera envoyée au client
              </p>
              <p className="text-green-800">
                {faqs.find((f) => String(f.id) === faqId)?.answer_fr}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            La réponse de la FAQ sélectionnée sera envoyée par email au client, et la fréquence de cette FAQ sera incrémentée.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading || !faqId} className="px-5 py-2 rounded-xl text-sm text-white bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-60 transition-colors font-semibold flex items-center gap-1.5">
              <FiLink size={14} />
              {loading ? "Liaison…" : "Lier et envoyer ✉️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Main admin page ───────────────────────────────────────
const AdminFaq = () => {
  const [tab, setTab] = useState(() => {
    const hash = window.location.hash;
    const queryStr = hash.includes("?") ? hash.split("?")[1] : "";
    return new URLSearchParams(queryStr).get("tab") === "questions" ? "questions" : "faqs";
});


  // FAQs state
  const [faqs,      setFaqs]     = useState([]);
  const [faqsLoading, setFaqsLoad] = useState(true);
  const [faqModal,  setFaqModal] = useState(null); // null | {} | faqObj

  // Questions state
  const [questions,   setQuestions]   = useState([]);
  const [qLoading,    setQLoading]    = useState(false);
  const [qPage,       setQPage]       = useState(1);
  const [qTotal,      setQTotal]      = useState(0);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qStatus,     setQStatus]     = useState("");      // "" | "pending" | "answered"
  const [qMatched,    setQMatched]    = useState("");      // "" | "true" | "false"
  const [answerModal, setAnswerModal] = useState(null);
  const [linkModal,   setLinkModal]   = useState(null);

  const [deletingId, setDeletingId] = useState(null);


  // ── Load FAQs ──
  const loadFaqs = useCallback(async () => {
    setFaqsLoad(true);
    try {
      const d = await adminGetAllFaqs();
      setFaqs(d.faqs);
    } catch (e) {
      console.error(e);
    } finally {
      setFaqsLoad(false);
    }
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  // ── Load Questions ──
  const loadQuestions = useCallback(async () => {
    setQLoading(true);
    try {
      const d = await adminGetQuestions({
        status:  qStatus  || undefined,
        matched: qMatched || undefined,
        page:    qPage,
      });
      setQuestions(d.questions);
      setQTotal(d.total);
      setQTotalPages(d.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setQLoading(false);
    }
  }, [qStatus, qMatched, qPage]);

  useEffect(() => {
    if (tab === "questions") loadQuestions();
  }, [tab, loadQuestions]);

  // ── WS : nouvelle question reçue en temps réel ────────────
  useEffect(() => {
      addWSListener("admin-faq-ws", (data) => {
          if (data.type === "NEW_FAQ_QUESTION") {
              // Recharger les questions si l'onglet est actif
              if (tab === "questions") {
                  loadQuestions();
              }
              // Incrémenter le badge même si on est sur l'onglet FAQs
              setQTotal((prev) => prev + 1);
          }
      });
      return () => removeWSListener("admin-faq-ws");
  }, [tab, loadQuestions]);

  // ── FAQ actions ──
  const handleToggle = async (id) => {
    try {
      const d = await adminToggleFaq(id);
      setFaqs((prev) => prev.map((f) => (f.id === id ? d.faq : f)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("Supprimer cette FAQ ?")) return;
    setDeletingId(id);
    try {
      await adminDeleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Question actions ──
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Supprimer cette question ?")) return;
    setDeletingId(id);
    try {
      await adminDeleteQuestion(id);
      loadQuestions();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Grouped FAQs
  const grouped = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">FAQ</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Gérez les questions fréquentes et les demandes clients.
          </p>
        </div>
        {tab === "faqs" && (
          <button
            onClick={() => setFaqModal({})}
            className="flex items-center gap-2 bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span className="text-lg leading-none">+</span> Nouvelle FAQ
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
        {[
          { key: "faqs",      label: "FAQs" },
          { key: "questions", label: "Questions reçues" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-white text-[#2d5a27] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {key === "questions" && qTotal > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                {qTotal}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: FAQs ── */}
      {tab === "faqs" && (
        <>
          {faqsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">🧺</div>
              <p className="text-sm">Aucune FAQ. Créez la première !</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([cat, items]) => (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">
                      {CATEGORY_LABELS[cat] || cat}
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-green-200 transition-colors"
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            faq.is_active ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">
                            {faq.question_fr}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {faq.answer_fr}
                          </p>
                          {faq.frequency > 0 && (
                            <span className="inline-block mt-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                              {faq.frequency}× consultée
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            faq.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            {faq.is_active ? "Actif" : "Inactif"}
                          </span>

                          <button onClick={() => setFaqModal(faq)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                            <FiEdit size={15} />
                          </button>

                          <button onClick={() => handleDeleteFaq(faq.id)} disabled={deletingId === faq.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Supprimer">
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Questions ── */}
      {tab === "questions" && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Filtre statut */}
            <div className="flex gap-1.5">
              {[
                { value: "",         label: "Toutes"     },
                { value: "pending",  label: "En attente" },
                { value: "answered", label: "Répondues"  },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setQStatus(value); setQPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    qStatus === value
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="w-px bg-gray-200 mx-1" />

            {/* Filtre matched (auto / manuel) */}
            <div className="flex gap-1.5">
              {[
                { value: "",      label: "Toutes"         },
                { value: "true",  label: "⚡ Auto"        },
                { value: "false", label: "✍️ Manuelle"    },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setQMatched(value); setQPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    qMatched === value
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {qLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">Aucune question pour l'instant.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-green-200 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-gray-700 text-sm">
                            {q.user_name}
                          </span>
                          <span className="text-gray-400 text-xs">{q.user_email}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[q.status] || "bg-gray-100 text-gray-600"}`}>
                            {q.status === "pending" ? "En attente" : "Répondue"}
                          </span>
                          {/* Badge auto / manuel */}
                          {q.status === "answered" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              q.linked_faqs?.[0]?.matched_automatically
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {q.linked_faqs?.[0]?.matched_automatically ? "⚡ Auto" : "✍️ Manuelle"}
                          </span>
                        )}
                        </div>

                        {/* Question */}
                        <p className="text-sm text-gray-600 italic">« {q.question} »</p>

                        {/* FAQ liée */}
                        {q.linked_faqs?.[0]?.faq_question && (
                          <p className="text-xs text-gray-400 mt-1">
                            Lié à : <span className="text-green-700 font-medium">{q.linked_faqs[0].faq_question}</span>
                            {q.linked_faqs[0].faq_category && (
                              <span className="ml-1 text-gray-300">({CATEGORY_LABELS[q.linked_faqs[0].faq_category] || q.linked_faqs[0].faq_category})</span>
                            )}
                          </p>
                        )}

                        {/* Answer if exists */}
                        {q.answer && (
                          <div className="mt-2 bg-green-50 border-l-2 border-green-400 pl-3 py-1 text-xs text-green-800">
                            {q.answer}
                          </div>
                        )}

                        {/* Date */}
                        <p className="text-xs text-gray-300 mt-1.5">
                          {new Date(q.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {q.status === "pending" && (
                          <>
                            <button
                              onClick={() => setAnswerModal(q)}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-[#2d5a27] hover:bg-[#4a8c42] text-white px-3 py-1.5 rounded-xl transition-colors"
                            >
                              ✉️ Répondre
                            </button>
                            <button
                              onClick={() => setLinkModal(q)}
                              title="Lier à une FAQ existante"
                              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors"
                            >
                              <FiLink size={13} /> Lier
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          disabled={deletingId === q.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Supprimer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {qTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    disabled={qPage === 1}
                    onClick={() => setQPage((p) => p - 1)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:border-green-300 transition-colors"
                  >
                    ← Précédent
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {qPage} / {qTotalPages}
                  </span>
                  <button
                    disabled={qPage === qTotalPages}
                    onClick={() => setQPage((p) => p + 1)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:border-green-300 transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {faqModal !== null && (
        <FaqModal
          faq={faqModal.id ? faqModal : null}
          onClose={() => setFaqModal(null)}
          onSaved={() => { setFaqModal(null); loadFaqs(); }}
        />
      )}

      {answerModal && (
        <AnswerModal
          question={answerModal}
          onClose={() => setAnswerModal(null)}
          onSaved={() => { setAnswerModal(null); loadQuestions(); }}
        />
      )}

      {linkModal && (
        <LinkModal
          question={linkModal}
          faqs={faqs.filter((f) => f.is_active)}
          onClose={() => setLinkModal(null)}
          onSaved={() => { setLinkModal(null); loadQuestions(); }}
        />
      )}
      </div>
  );
};

export default AdminFaq;