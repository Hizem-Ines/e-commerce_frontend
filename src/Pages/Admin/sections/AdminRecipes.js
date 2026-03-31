import React, { useState, useEffect, useRef } from "react";
import {
  fetchAllRecipesAdmin,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../../../services/recipesService";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiUpload, FiEye } from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────
const DIFFICULTIES = ["facile", "moyen", "difficile"];
const CATEGORIES   = ["entrée", "plat", "dessert", "boisson", "snack"];

const emptyForm = {
  title_fr: "", title_ar: "", description_fr: "", description_ar: "",
  prep_time: "", cook_time: "", servings: 4, difficulty: "facile",
  category: "", is_published: false, is_featured: false,
};
const emptyIngredient = { name_fr: "", name_ar: "", quantity: "", is_bio: false };
const emptyStep       = { instruction_fr: "", instruction_ar: "", duration: "" };

// ─── Field component (matches AdminProduits) ──────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls    = "w-full bg-[#f9f5f0] border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25";
const textareaCls = inputCls + " resize-none";
const selectCls   = inputCls + " bg-[#f9f5f0]";

// ─── Status badge ──────────────────────────────────────────
function StatusBadge({ published }) {
  return published ? (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Publié</span>
  ) : (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">Brouillon</span>
  );
}

// ─── Confirm modal ─────────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, name }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer cette recette ?</h3>
          <p className="text-black/50 text-sm mb-6">
            <strong>{name}</strong> sera supprimée définitivement. Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Form Modal ─────────────────────────────────────
function RecipeFormModal({ open, onClose, onSaved, editRecipe }) {
  const [form, setForm]               = useState(emptyForm);
  const [ingredients, setIngredients] = useState([{ ...emptyIngredient }]);
  const [steps, setSteps]             = useState([{ ...emptyStep }]);
  const [imageFile, setImageFile]     = useState(null);
  const [preview, setPreview]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState("general");
  const fileRef                       = useRef();

  useEffect(() => {
    if (!open) return;
    setTab("general");
    setError("");
    if (editRecipe) {
      setForm({
        title_fr:       editRecipe.title_fr       || "",
        title_ar:       editRecipe.title_ar       || "",
        description_fr: editRecipe.description_fr || "",
        description_ar: editRecipe.description_ar || "",
        prep_time:      editRecipe.prep_time      || "",
        cook_time:      editRecipe.cook_time      || "",
        servings:       editRecipe.servings       || 4,
        difficulty:     editRecipe.difficulty     || "facile",
        category:       editRecipe.category       || "",
        is_published:   editRecipe.is_published   || false,
        is_featured:    editRecipe.is_featured    || false,
      });
      setPreview(editRecipe.cover_image || null);
      setIngredients([{ ...emptyIngredient }]);
      setSteps([{ ...emptyStep }]);
      setImageFile(null);
    } else {
      setForm(emptyForm);
      setIngredients([{ ...emptyIngredient }]);
      setSteps([{ ...emptyStep }]);
      setPreview(null);
      setImageFile(null);
    }
  }, [editRecipe, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Ingredients helpers
  const updateIngredient = (i, field, value) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  const addIngredient    = () => setIngredients(prev => [...prev, { ...emptyIngredient }]);
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  // Steps helpers
  const updateStep    = (i, field, value) => setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const addStep       = () => setSteps(prev => [...prev, { ...emptyStep }]);
  const removeStep    = (i) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError("");
    if (!form.title_fr.trim())       { setError("Le titre en français est requis."); setTab("general");      return; }
    if (!form.description_fr.trim()) { setError("La description est requise.");      setTab("general");      return; }
    if (steps.filter(s => s.instruction_fr.trim()).length === 0)
      { setError("Au moins une étape est requise."); setTab("etapes"); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("ingredients", JSON.stringify(ingredients.filter(i => i.name_fr.trim())));
    fd.append("steps",       JSON.stringify(steps.filter(s => s.instruction_fr.trim())));
    if (imageFile) fd.append("cover_image", imageFile);

    setSaving(true);
    try {
      if (editRecipe) {
        await updateRecipe(editRecipe.id, fd);
      } else {
        await createRecipe(fd);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const tabs = [
    { id: "general",      label: "📝 Général" },
    { id: "ingredients",  label: "🥬 Ingrédients", count: ingredients.filter(i => i.name_fr.trim()).length || ingredients.length },
    { id: "etapes",       label: "📋 Étapes",       count: steps.length },
    { id: "image",        label: "🖼️ Image" },
    { id: "parametres",   label: "⚙️ Paramètres" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2c2c2c]">
              {editRecipe ? "✏️ Modifier la recette" : "✨ Nouvelle recette"}
            </h2>
            {editRecipe && <p className="text-xs text-black/40 mt-0.5">{editRecipe.title_fr}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40 hover:text-black/70">
            <FiX size={20} />
          </button>
        </div>

        {/* Required legend */}
        <div className="px-7 pt-3 shrink-0">
          <p className="text-xs text-black/35"><span className="text-red-400 font-bold">*</span> Champ obligatoire</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-7 mt-3 bg-red-50 border border-red-200 text-red-700 font-semibold px-4 py-3 rounded-xl text-sm flex items-center gap-2 shrink-0">
            ❌ {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-7 shrink-0 overflow-x-auto mt-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-black/40 hover:text-black/70"
              }`}>
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6">

          {/* ── GÉNÉRAL ── */}
          {tab === "general" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Titre (FR)" required>
                  <input className={inputCls} value={form.title_fr}
                    onChange={e => set("title_fr", e.target.value)} placeholder="ex: Brik à l'œuf" />
                </Field>
                <Field label="Titre (AR)">
                  <input className={inputCls} dir="rtl" value={form.title_ar}
                    onChange={e => set("title_ar", e.target.value)} placeholder="بريك بالبيض" />
                </Field>
              </div>

              <Field label="Description (FR)" required>
                <textarea className={textareaCls} rows={3} value={form.description_fr}
                  onChange={e => set("description_fr", e.target.value)}
                  placeholder="Décrivez la recette en français..." />
              </Field>

              <Field label="Description (AR)">
                <textarea className={textareaCls} rows={3} dir="rtl" value={form.description_ar}
                  onChange={e => set("description_ar", e.target.value)}
                  placeholder="وصف الوصفة بالعربية..." />
              </Field>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Prép. (min)">
                  <input type="number" min="0" className={inputCls} value={form.prep_time}
                    onChange={e => set("prep_time", e.target.value)} placeholder="15" />
                </Field>
                <Field label="Cuisson (min)">
                  <input type="number" min="0" className={inputCls} value={form.cook_time}
                    onChange={e => set("cook_time", e.target.value)} placeholder="30" />
                </Field>
                <Field label="Portions">
                  <input type="number" min="1" className={inputCls} value={form.servings}
                    onChange={e => set("servings", e.target.value)} placeholder="4" />
                </Field>
                <Field label="Difficulté">
                  <select className={selectCls} value={form.difficulty}
                    onChange={e => set("difficulty", e.target.value)}>
                    {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Catégorie">
                <select className={selectCls} value={form.category}
                  onChange={e => set("category", e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* ── INGRÉDIENTS ── */}
          {tab === "ingredients" && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {ingredients.map((ing, i) => (
                  <div key={i} className="bg-[#f9f5f0] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      {ingredients.length > 1 && (
                        <button onClick={() => removeIngredient(i)}
                          className="text-red-400 hover:text-red-600 transition p-1">
                          <FiX size={13} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Nom FR *">
                        <input className={inputCls} value={ing.name_fr}
                          onChange={e => updateIngredient(i, "name_fr", e.target.value)}
                          placeholder="ex: Farine" />
                      </Field>
                      <Field label="الاسم AR">
                        <input className={inputCls} dir="rtl" value={ing.name_ar}
                          onChange={e => updateIngredient(i, "name_ar", e.target.value)}
                          placeholder="دقيق" />
                      </Field>
                      <Field label="Quantité">
                        <input className={inputCls} value={ing.quantity}
                          onChange={e => updateIngredient(i, "quantity", e.target.value)}
                          placeholder="ex: 200g" />
                      </Field>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => updateIngredient(i, "is_bio", !ing.is_bio)}
                        className={`w-9 h-5 rounded-full transition-colors duration-200 relative shrink-0 ${ing.is_bio ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${ing.is_bio ? "left-4" : "left-0.5"}`} />
                      </button>
                      <span className="text-xs font-bold text-black/50">Bio</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addIngredient}
                className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-600 font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50">
                + Ajouter un ingrédient
              </button>
            </div>
          )}

          {/* ── ÉTAPES ── */}
          {tab === "etapes" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="bg-[#f9f5f0] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-black/40 uppercase tracking-wider">Durée (min)</label>
                          <input type="number" min="0" value={step.duration}
                            onChange={e => updateStep(i, "duration", e.target.value)}
                            className="w-20 bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[#2c2c2c] outline-none transition"
                            placeholder="5" />
                        </div>
                        {steps.length > 1 && (
                          <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 transition p-1">
                            <FiX size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <Field label="Instruction (FR) *">
                      <textarea className={textareaCls} rows={2} value={step.instruction_fr}
                        onChange={e => updateStep(i, "instruction_fr", e.target.value)}
                        placeholder="Décrivez cette étape en français..." />
                    </Field>
                    <Field label="Instruction (AR)">
                      <textarea className={textareaCls} rows={2} dir="rtl" value={step.instruction_ar}
                        onChange={e => updateStep(i, "instruction_ar", e.target.value)}
                        placeholder="التعليمات بالعربية..." />
                    </Field>
                  </div>
                ))}
              </div>
              <button onClick={addStep}
                className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-600 font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50">
                + Ajouter une étape
              </button>
            </div>
          )}

          {/* ── IMAGE ── */}
          {tab === "image" && (
            <div className="space-y-5">
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden h-56">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setPreview(null); setImageFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-3 right-3 bg-white/90 text-red-500 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition shadow">
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl py-14 flex flex-col items-center gap-3 text-emerald-600 hover:bg-emerald-50 transition">
                  <FiUpload size={28} />
                  <p className="font-bold text-sm">Cliquer pour uploader une image</p>
                  <p className="text-xs text-black/30">JPG, PNG, WEBP</p>
                </button>
              )}
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {tab === "parametres" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#f9f5f0] rounded-xl px-5 py-4">
                <div>
                  <p className="font-bold text-sm text-[#2c2c2c]">Publié</p>
                  <p className="text-xs text-black/40">La recette est visible sur le site</p>
                </div>
                <button
                  onClick={() => set("is_published", !form.is_published)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.is_published ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.is_published ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#f9f5f0] rounded-xl px-5 py-4">
                <div>
                  <p className="font-bold text-sm text-[#2c2c2c]">Mise en avant ✨</p>
                  <p className="text-xs text-black/40">Apparaît sur la page d'accueil</p>
                </div>
                <button
                  onClick={() => set("is_featured", !form.is_featured)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.is_featured ? "bg-amber-400" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.is_featured ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
            {saving ? "⏳ Enregistrement..." : editRecipe ? "💾 Enregistrer les modifications" : "✅ Créer la recette"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminRecettes ────────────────────────────────────
export default function AdminRecettes() {
  const [recipes, setRecipes]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editRecipe, setEditRecipe]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg]     = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const [search, setSearch]             = useState("");

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };
  const showError   = (msg) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(""), 3000); };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAllRecipesAdmin();
      setRecipes(data.recipes || []);
    } catch {
      showError("Erreur lors du chargement des recettes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleTogglePublished = async (recipe) => {
    try {
      const fd = new FormData();
      fd.append("is_published", !recipe.is_published);
      await updateRecipe(recipe.id, fd);
      setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_published: !r.is_published } : r));
      showSuccess(`Recette ${!recipe.is_published ? "publiée" : "dépubliée"} avec succès.`);
    } catch {
      showError("Erreur lors de la mise à jour.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecipe(deleteTarget.id);
      setRecipes(prev => prev.filter(r => r.id !== deleteTarget.id));
      showSuccess("Recette supprimée avec succès.");
    } catch {
      showError("Erreur lors de la suppression.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit = (recipe) => { setEditRecipe(recipe); setShowForm(true); };
  const openNew  = () => { setEditRecipe(null); setShowForm(true); };
  const onSaved  = () => {
    fetchRecipes();
    showSuccess(editRecipe ? "Recette mise à jour avec succès." : "Recette créée avec succès.");
  };

  const filtered = recipes.filter(r =>
    r.title_fr.toLowerCase().includes(search.toLowerCase()) ||
    (r.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Recettes</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
          <FiPlus size={16} /> Nouvelle recette
        </button>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">
          ❌ {errorMsg}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou catégorie..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-spin">🌿</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-black/40 text-sm font-medium">
              {search ? "Aucune recette ne correspond à votre recherche." : "Aucune recette créée pour le moment."}
            </p>
            {!search && (
              <button onClick={openNew}
                className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition">
                Créer la première recette →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9f5f0] border-b border-gray-100">
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Recette</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c] hidden md:table-cell">Difficulté</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c] hidden lg:table-cell">Stats</th>
                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(recipe => (
                <tr key={recipe.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">

                  {/* Recipe */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                        {recipe.cover_image ? (
                          <img src={recipe.cover_image} alt={recipe.title_fr} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🍽️</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#2c2c2c] line-clamp-1">{recipe.title_fr}</p>
                        <p className="text-xs text-black/40">
                          {recipe.slug}
                          {recipe.is_featured && <span className="ml-2 text-amber-500 font-bold">✦ En avant</span>}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {recipe.category ? (
                      <span className="capitalize text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {recipe.category}
                      </span>
                    ) : <span className="text-black/30">—</span>}
                  </td>

                  {/* Difficulty */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="capitalize text-sm text-black/60">{recipe.difficulty}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleTogglePublished(recipe)} title="Changer le statut">
                      <StatusBadge published={recipe.is_published} />
                    </button>
                  </td>

                  {/* Stats */}
                  <td className="px-5 py-4 text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-3 text-xs text-black/40 font-medium">
                      <span>👁️ {recipe.views_count || 0}</span>
                      <span>🥬 {recipe.ingredients_count || 0}</span>
                      <span>📋 {recipe.steps_count || 0}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <a href={`/recettes/${recipe.slug}`} target="_blank" rel="noreferrer"
                        className="p-2 hover:bg-gray-100 text-black/40 hover:text-black/70 rounded-xl transition"
                        title="Voir">
                        <FiEye size={15} />
                      </a>
                      <button onClick={() => openEdit(recipe)}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition" title="Modifier">
                        <FiEdit size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(recipe)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition" title="Supprimer">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.title_fr}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <RecipeFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditRecipe(null); }}
        onSaved={onSaved}
        editRecipe={editRecipe}
      />
    </div>
  );
}