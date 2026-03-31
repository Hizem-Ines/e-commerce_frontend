import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchSingleRecipe } from "../../services/recipesService";
import { FiClock, FiUsers, FiEye, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { GiPlantSeed } from "react-icons/gi";
import { BsStars } from "react-icons/bs";

const CATEGORY_LABELS = {
  "entree":         "Entrée",
  "plat-principal": "Plat principal",
  "soupe":          "Soupe",
  "dessert":        "Dessert",
  "boisson":        "Boisson",
};

const difficultyConfig = {
  facile:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Facile" },
  moyen:     { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Moyen" },
  difficile: { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    label: "Difficile" },
};

export default function RecipeDetailPage() {
  const { slug }                    = useParams();
  const navigate                    = useNavigate();
  const [recipe, setRecipe]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveStep(0);
    setCheckedIngredients({});
    fetchSingleRecipe(slug)
      .then(r => setRecipe(r.data.recipe))
      .catch(err => {
        if (err.response?.status === 404) setError("Recette introuvable.");
        else setError("Une erreur est survenue.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleIngredient = (i) =>
    setCheckedIngredients(prev => ({ ...prev, [i]: !prev[i] }));

  /* ── Loading ── */
  if (loading) return (
    <div className="bg-[#fdf6ec] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-6xl animate-spin">🌿</div>
        <p className="text-black/50 font-semibold">Chargement de la recette…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="bg-[#fdf6ec] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🍲</div>
        <h2 className="text-xl font-bold text-[#2c2c2c] mb-2">{error}</h2>
        <button
          onClick={() => navigate("/recettes")}
          className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-full transition-colors duration-300"
        >
          ← Retour aux recettes
        </button>
      </div>
    </div>
  );

  if (!recipe) return null;

  const diff      = difficultyConfig[recipe.difficulty] || difficultyConfig.facile;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const totalIngredients = recipe.ingredients?.length || 0;

  return (
    <div className="bg-[#fdf6ec] min-h-screen py-12">
      <div className="container mx-auto px-4">

        {/* ── Back button ── */}
        <div className="mb-6">
          <Link
            to="/recettes"
            className="inline-flex items-center gap-2 text-black/50 hover:text-emerald-600 font-semibold text-sm transition-colors duration-200 no-underline"
          >
            <FiArrowLeft size={16} />
            Retour aux recettes
          </Link>
        </div>

        {/* ── Hero cover ── */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-[0_4px_15px_rgba(0,0,0,0.12)]">
          <div className="h-64 md:h-80 bg-[#2c2c2c]">
            {recipe.cover_image ? (
              <img
                src={recipe.cover_image}
                alt={recipe.title_fr}
                className="w-full h-full object-cover opacity-70"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-20">🍲</span>
              </div>
            )}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2c2c2c]/90 via-[#2c2c2c]/20 to-transparent" />

          {/* Badges top-left */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {recipe.category && (
              <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                {CATEGORY_LABELS[recipe.category] || recipe.category}
              </span>
            )}
            {recipe.is_featured && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <BsStars size={11} /> Mis en avant
              </span>
            )}
          </div>

          {/* Title overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold font-serif text-white leading-tight mb-1">
              {recipe.title_fr}
            </h1>
            {recipe.title_ar && (
              <p className="text-white/60 text-base mt-1 text-right" dir="rtl">
                {recipe.title_ar}
              </p>
            )}
          </div>
        </div>

        {/* ── Meta bar ── */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-8">
          <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start divide-x divide-gray-100">
            {recipe.prep_time && (
              <div className="text-center px-4 first:pl-0">
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Préparation</p>
                <p className="font-extrabold text-[#2c2c2c] text-xl">
                  {recipe.prep_time} <span className="text-sm font-normal text-black/40">min</span>
                </p>
              </div>
            )}
            {recipe.cook_time && (
              <div className="text-center px-4">
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Cuisson</p>
                <p className="font-extrabold text-[#2c2c2c] text-xl">
                  {recipe.cook_time} <span className="text-sm font-normal text-black/40">min</span>
                </p>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-center px-4">
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Total</p>
                <p className="font-extrabold text-emerald-600 text-xl flex items-center gap-1 justify-center">
                  <FiClock size={16} />
                  {totalTime} <span className="text-sm font-normal text-black/40">min</span>
                </p>
              </div>
            )}
            {recipe.servings && (
              <div className="text-center px-4">
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Portions</p>
                <p className="font-extrabold text-[#2c2c2c] text-xl flex items-center gap-1 justify-center">
                  <FiUsers size={16} />
                  {recipe.servings} <span className="text-sm font-normal text-black/40">pers.</span>
                </p>
              </div>
            )}
            <div className="text-center px-4">
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Difficulté</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${diff.bg} ${diff.text}`}>
                <span className={`w-2 h-2 rounded-full ${diff.dot}`} />
                {diff.label}
              </span>
            </div>
            {recipe.views_count > 0 && (
              <div className="text-center px-4">
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Vues</p>
                <p className="font-extrabold text-[#2c2c2c] text-xl flex items-center gap-1 justify-center">
                  <FiEye size={16} />
                  {recipe.views_count}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        {recipe.description_fr && (
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-8 border-l-4 border-emerald-500">
            <p className="text-black/70 leading-relaxed">{recipe.description_fr}</p>
            {recipe.description_ar && (
              <p className="text-black/40 leading-relaxed mt-3 text-right border-t border-gray-100 pt-3" dir="rtl">
                {recipe.description_ar}
              </p>
            )}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="flex gap-6 items-start flex-col lg:flex-row">

          {/* ── Ingredients sidebar ── */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#2c2c2c] text-base flex items-center gap-2">
                  <GiPlantSeed size={18} className="text-emerald-600" />
                  Ingrédients
                </h2>
                {totalIngredients > 0 && (
                  <span className="text-xs bg-[#f9f5f0] text-black/50 font-bold px-2.5 py-1 rounded-full">
                    {checkedCount}/{totalIngredients}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {totalIngredients > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(checkedCount / totalIngredients) * 100}%` }}
                  />
                </div>
              )}

              {!recipe.ingredients || recipe.ingredients.length === 0 ? (
                <p className="text-black/40 text-sm">Aucun ingrédient spécifié.</p>
              ) : (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li
                      key={i}
                      onClick={() => toggleIngredient(i)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors duration-200 ${
                        checkedIngredients[i]
                          ? "bg-emerald-50"
                          : "hover:bg-[#f9f5f0]"
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 transition-colors duration-200 ${
                        checkedIngredients[i] ? "text-emerald-500" : "text-gray-300"
                      }`}>
                        <FiCheckCircle size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold transition-colors duration-200 ${
                            checkedIngredients[i] ? "line-through text-black/30" : "text-[#2c2c2c]"
                          }`}>
                            {ing.name_fr}
                          </span>
                          {ing.quantity && (
                            <span className="text-xs text-black/40 whitespace-nowrap font-semibold">
                              {ing.quantity}
                            </span>
                          )}
                        </div>
                        {ing.name_ar && (
                          <p className="text-xs text-black/30 text-right" dir="rtl">{ing.name_ar}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {ing.is_bio && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-full">
                              🌱 Bio
                            </span>
                          )}
                          {ing.product_slug && (
                            <Link
                              to={`/produits/${ing.product_slug}`}
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-emerald-600 bg-[#d1fae5] font-bold px-2 py-0.5 rounded-full no-underline hover:bg-emerald-200 transition-colors duration-200"
                            >
                              🛒 Voir le produit
                              {ing.product_price && (
                                <span className="text-emerald-500 ml-1">
                                  · {Number(ing.product_price).toFixed(3)} DT
                                </span>
                              )}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#2c2c2c] text-base">
                Préparation
              </h2>
              {recipe.steps?.length > 0 && (
                <span className="text-xs bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)] text-black/50 font-bold px-3 py-1.5 rounded-full">
                  Étape {activeStep + 1} / {recipe.steps.length}
                </span>
              )}
            </div>

            {/* Step progress dots */}
            {recipe.steps?.length > 0 && (
              <div className="flex gap-1.5 mb-5 flex-wrap">
                {recipe.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeStep
                        ? "bg-emerald-600 w-6"
                        : i < activeStep
                        ? "bg-emerald-300 w-2"
                        : "bg-gray-200 w-2"
                    }`}
                  />
                ))}
              </div>
            )}

            {!recipe.steps || recipe.steps.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-black/40 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                Aucune étape définie.
              </div>
            ) : (
              <div className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.07)] ${
                      activeStep === i
                        ? "border-emerald-500 shadow-emerald-100 shadow-lg -translate-y-0.5"
                        : "border-transparent hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Step number */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all duration-300 ${
                        activeStep === i
                          ? "bg-emerald-600 text-white"
                          : i < activeStep
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-[#f9f5f0] text-black/40"
                      }`}>
                        {i < activeStep ? "✓" : step.step_number}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                          activeStep === i ? "text-[#2c2c2c] font-medium" : "text-black/60"
                        }`}>
                          {step.instruction_fr}
                        </p>
                        {step.instruction_ar && activeStep === i && (
                          <p className="text-black/30 text-xs mt-2 text-right border-t border-gray-50 pt-2" dir="rtl">
                            {step.instruction_ar}
                          </p>
                        )}
                        {step.duration && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 font-bold px-2.5 py-1 rounded-full">
                            <FiClock size={11} /> {step.duration} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step navigation buttons */}
            {recipe.steps?.length > 1 && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  disabled={activeStep === 0}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-black/50 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ← Précédente
                </button>
                <button
                  onClick={() => setActiveStep(s => Math.min(recipe.steps.length - 1, s + 1))}
                  disabled={activeStep === recipe.steps.length - 1}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Suivante →
                </button>
              </div>
            )}

            {/* Completion message */}
            {recipe.steps?.length > 0 && activeStep === recipe.steps.length - 1 && (
              <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-emerald-700 font-bold text-sm">🎉 Recette terminée ! Bon appétit !</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Back CTA ── */}
        <div className="mt-10 text-center">
          <Link
            to="/recettes"
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-emerald-500 text-black/60 hover:text-emerald-600 font-bold px-6 py-3 rounded-full transition-all duration-300 no-underline text-sm"
          >
            <FiArrowLeft size={16} />
            Voir toutes les recettes
          </Link>
        </div>

      </div>
    </div>
  );
}