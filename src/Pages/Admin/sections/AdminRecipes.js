import React, { useState, useEffect, useRef } from "react";
import {
  fetchAllRecipesAdmin,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../../../services/recipesService";

// ─── Icons ────────────────────────────────────────────────
const PlusIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const EditIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const EyeIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const CloseIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;

const DIFFICULTIES = ["facile", "moyen", "difficile"];
const CATEGORIES   = ["entrée", "plat", "dessert", "boisson", "snack"];

const emptyForm = {
  title_fr: "", title_ar: "", description_fr: "", description_ar: "",
  prep_time: "", cook_time: "", servings: 4, difficulty: "facile",
  category: "", is_published: false, is_featured: false,
};
const emptyIngredient = { name_fr: "", name_ar: "", quantity: "", is_bio: false };
const emptyStep       = { instruction_fr: "", instruction_ar: "", duration: "" };

// ─── Status badge ──────────────────────────────────────────
function StatusBadge({ published }) {
  return published ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Publié
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Brouillon
    </span>
  );
}

// ─── Confirm modal ─────────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, name }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-semibold text-[#2c2c2c] mb-2">Supprimer la recette</h3>
        <p className="text-sm text-gray-500 mb-5">
          Êtes-vous sûr de vouloir supprimer <strong>{name}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
            Supprimer
          </button>
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
  const fileRef                       = useRef();

  useEffect(() => {
    if (editRecipe) {
      setForm({
        title_fr:       editRecipe.title_fr || "",
        title_ar:       editRecipe.title_ar || "",
        description_fr: editRecipe.description_fr || "",
        description_ar: editRecipe.description_ar || "",
        prep_time:      editRecipe.prep_time || "",
        cook_time:      editRecipe.cook_time || "",
        servings:       editRecipe.servings || 4,
        difficulty:     editRecipe.difficulty || "facile",
        category:       editRecipe.category || "",
        is_published:   editRecipe.is_published || false,
        is_featured:    editRecipe.is_featured || false,
      });
      setPreview(editRecipe.cover_image || null);
      setIngredients([{ ...emptyIngredient }]);
      setSteps([{ ...emptyStep }]);
    } else {
      setForm(emptyForm);
      setIngredients([{ ...emptyIngredient }]);
      setSteps([{ ...emptyStep }]);
      setPreview(null);
      setImageFile(null);
    }
    setError("");
  }, [editRecipe, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Ingredients helpers
  const updateIngredient = (i, field, value) => {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };
  const addIngredient    = () => setIngredients(prev => [...prev, { ...emptyIngredient }]);
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  // Steps helpers
  const updateStep    = (i, field, value) => setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const addStep       = () => setSteps(prev => [...prev, { ...emptyStep }]);
  const removeStep    = (i) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError("");
    if (!form.title_fr.trim()) return setError("Le titre en français est requis.");
    if (steps.filter(s => s.instruction_fr.trim()).length === 0)
      return setError("Au moins une étape est requise.");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    const filteredIngredients = ingredients.filter(i => i.name_fr.trim());
    const filteredSteps       = steps.filter(s => s.instruction_fr.trim());
    fd.append("ingredients", JSON.stringify(filteredIngredients));
    fd.append("steps",       JSON.stringify(filteredSteps));
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#2c2c2c] text-lg">
            {editRecipe ? "Modifier la recette" : "Nouvelle recette"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* ── Cover image ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Image de couverture</label>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />
            {preview ? (
              <div className="relative rounded-xl overflow-hidden h-40 group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => { setPreview(null); setImageFile(null); if(fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors">
                <UploadIcon />
                <span className="text-sm">Cliquer pour uploader</span>
              </button>
            )}
          </div>

          {/* ── Basic info ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Titre (FR) *</label>
              <input value={form.title_fr} onChange={e => setForm(f => ({ ...f, title_fr: e.target.value }))}
                placeholder="ex: Brik à l'œuf" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Titre (AR)</label>
              <input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                dir="rtl" placeholder="بريك بالبيض" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description (FR)</label>
            <textarea value={form.description_fr} onChange={e => setForm(f => ({ ...f, description_fr: e.target.value }))}
              rows={3} placeholder="Décrivez la recette en français..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description (AR)</label>
            <textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
              rows={3} dir="rtl" placeholder="وصف الوصفة بالعربية..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors resize-none" />
          </div>

          {/* ── Timing & details ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prép. (min)</label>
              <input type="number" min="0" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cuisson (min)</label>
              <input type="number" min="0" value={form.cook_time} onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Portions</label>
              <input type="number" min="1" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Difficulté</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors bg-white">
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Catégorie</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors bg-white">
              <option value="">— Sélectionner —</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            {[
              { key: "is_published", label: "Publié" },
              { key: "is_featured",  label: "Mis en avant" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form[key] ? "bg-[#c8a96e]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {/* ── Ingredients ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingrédients</label>
              <button onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-[#c8a96e] hover:text-[#b8955a] font-medium transition-colors">
                <PlusIcon /> Ajouter
              </button>
            </div>
            <div className="space-y-2.5">
              {ingredients.map((ing, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2.5">
                  <input value={ing.name_fr} onChange={e => updateIngredient(i, "name_fr", e.target.value)}
                    placeholder="Nom FR *" className="col-span-4 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#c8a96e] bg-white" />
                  <input value={ing.name_ar} onChange={e => updateIngredient(i, "name_ar", e.target.value)}
                    placeholder="الاسم" dir="rtl" className="col-span-4 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#c8a96e] bg-white" />
                  <input value={ing.quantity} onChange={e => updateIngredient(i, "quantity", e.target.value)}
                    placeholder="Qté" className="col-span-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#c8a96e] bg-white" />
                  <label className="col-span-1 flex justify-center" title="Bio">
                    <input type="checkbox" checked={ing.is_bio} onChange={e => updateIngredient(i, "is_bio", e.target.checked)}
                      className="accent-[#c8a96e]" />
                  </label>
                  <button onClick={() => removeIngredient(i)}
                    className="col-span-1 text-gray-300 hover:text-red-400 transition-colors flex justify-center">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Steps ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Étapes de préparation *</label>
              <button onClick={addStep}
                className="flex items-center gap-1 text-xs text-[#c8a96e] hover:text-[#b8955a] font-medium transition-colors">
                <PlusIcon /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 bg-[#c8a96e] text-white rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <input value={step.duration} onChange={e => updateStep(i, "duration", e.target.value)}
                        placeholder="Durée (min)" type="number" min="0"
                        className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#c8a96e] bg-white" />
                      {steps.length > 1 && (
                        <button onClick={() => removeStep(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea value={step.instruction_fr} onChange={e => updateStep(i, "instruction_fr", e.target.value)}
                    rows={2} placeholder="Instruction en français *"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#c8a96e] resize-none bg-white mb-2" />
                  <textarea value={step.instruction_ar} onChange={e => updateStep(i, "instruction_ar", e.target.value)}
                    rows={2} dir="rtl" placeholder="التعليمات بالعربية"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#c8a96e] resize-none bg-white" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#c8a96e] hover:bg-[#b8955a] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Enregistrement…" : editRecipe ? "Mettre à jour" : "Créer la recette"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminRecipes Component ───────────────────────────
export default function AdminRecipes() {
  const [recipes, setRecipes]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAllRecipesAdmin();
      setRecipes(data.recipes || []);
    } catch (err) {
      showToast("Erreur lors du chargement.", "error");
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
      showToast(`Recette ${!recipe.is_published ? "publiée" : "dépubliée"} avec succès.`);
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecipe(deleteTarget.id);
      setRecipes(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast("Recette supprimée avec succès.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit = (recipe) => { setEditRecipe(recipe); setShowForm(true); };
  const openNew  = () => { setEditRecipe(null); setShowForm(true); };
  const onSaved  = () => { fetchRecipes(); showToast(editRecipe ? "Recette mise à jour." : "Recette créée avec succès."); };

  const filtered = recipes.filter(r =>
    r.title_fr.toLowerCase().includes(search.toLowerCase()) ||
    (r.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-[#2c2c2c] text-white"
        }`}>
          {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
        </div>
      )}

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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2c2c2c]">Recettes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{recipes.length} recette{recipes.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#c8a96e] hover:bg-[#b8955a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <PlusIcon /> Nouvelle recette
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Rechercher par titre ou catégorie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#2c2c2c] focus:outline-none focus:border-[#c8a96e] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-500 text-sm">
              {search ? "Aucune recette ne correspond à votre recherche." : "Aucune recette créée."}
            </p>
            {!search && (
              <button onClick={openNew}
                className="mt-4 text-sm text-[#c8a96e] hover:text-[#b8955a] font-medium transition-colors">
                Créer la première recette →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recette</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Difficulté</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Stats</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(recipe => (
                <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Recipe name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] flex-shrink-0 overflow-hidden">
                        {recipe.cover_image ? (
                          <img src={recipe.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">🍽️</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#2c2c2c] truncate max-w-[160px]">{recipe.title_fr}</p>
                        <p className="text-xs text-gray-400">{recipe.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {recipe.category ? (
                      <span className="capitalize text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{recipe.category}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Difficulty */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="capitalize text-xs text-gray-600">{recipe.difficulty}</span>
                  </td>

                  {/* Status + toggle */}
                  <td className="px-4 py-3.5">
                    <button onClick={() => handleTogglePublished(recipe)} title="Changer le statut">
                      <StatusBadge published={recipe.is_published} />
                    </button>
                    {recipe.is_featured && (
                      <span className="ml-1.5 text-xs text-[#c8a96e]" title="Mis en avant">✦</span>
                    )}
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><EyeIcon /> {recipe.views_count || 0}</span>
                      <span>🥬 {recipe.ingredients_count || 0}</span>
                      <span>📋 {recipe.steps_count || 0}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`/recettes/${recipe.slug}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2c2c2c] transition-colors" title="Voir">
                        <EyeIcon />
                      </a>
                      <button onClick={() => openEdit(recipe)}
                        className="p-1.5 rounded-lg hover:bg-[#c8a96e]/10 text-gray-400 hover:text-[#c8a96e] transition-colors" title="Modifier">
                        <EditIcon />
                      </button>
                      <button onClick={() => setDeleteTarget(recipe)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}