import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchSingleRecipe } from "../../services/recipesService";

const difficultyColor = {
  facile:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  moyen:     { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"  },
  difficile: { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500"   },
};

export default function RecipeDetailPage() {
  const { slug }           = useParams();
  const navigate           = useNavigate();
  const [recipe, setRecipe]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSingleRecipe(slug)
      .then(r => setRecipe(r.data.recipe))
      .catch(err => {
        if (err.response?.status === 404) setError("Recette introuvable.");
        else setError("Une erreur est survenue.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#c8a96e] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Chargement de la recette…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-xl font-semibold text-[#2c2c2c] mb-2">{error}</h2>
        <button onClick={() => navigate("/recettes")}
          className="mt-4 text-[#c8a96e] hover:text-[#b8955a] text-sm font-medium">
          ← Retour aux recettes
        </button>
      </div>
    </div>
  );

  if (!recipe) return null;

  const diff      = difficultyColor[recipe.difficulty] || difficultyColor.facile;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── Cover hero ── */}
      <div className="relative h-72 lg:h-96 bg-[#2c2c2c] overflow-hidden">
        {recipe.cover_image ? (
          <img src={recipe.cover_image} alt={recipe.title_fr}
            className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-20">🍲</span>
          </div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c2c2c] via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link to="/recettes"
            className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full hover:bg-black/60 transition-colors">
            ← Retour
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            {recipe.category && (
              <span className="inline-block bg-[#c8a96e] text-white text-xs font-semibold px-3 py-1 rounded-full capitalize mb-3">
                {recipe.category}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              {recipe.title_fr}
            </h1>
            {recipe.title_ar && (
              <p className="text-white/60 text-lg mt-1 text-right" dir="rtl">{recipe.title_ar}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Meta bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-wrap gap-6 items-center justify-center">
            {recipe.prep_time && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Préparation</p>
                <p className="font-bold text-[#2c2c2c] text-lg">{recipe.prep_time} <span className="text-sm font-normal text-gray-500">min</span></p>
              </div>
            )}
            {recipe.cook_time && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Cuisson</p>
                <p className="font-bold text-[#2c2c2c] text-lg">{recipe.cook_time} <span className="text-sm font-normal text-gray-500">min</span></p>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Total</p>
                <p className="font-bold text-[#c8a96e] text-lg">{totalTime} <span className="text-sm font-normal text-gray-500">min</span></p>
              </div>
            )}
            {recipe.servings && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Portions</p>
                <p className="font-bold text-[#2c2c2c] text-lg">{recipe.servings} <span className="text-sm font-normal text-gray-500">pers.</span></p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">Difficulté</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${diff.bg} ${diff.text}`}>
                <span className={`w-2 h-2 rounded-full ${diff.dot}`} />
                {recipe.difficulty}
              </span>
            </div>
            {recipe.views_count > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Vues</p>
                <p className="font-bold text-[#2c2c2c] text-lg">{recipe.views_count}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {recipe.description_fr && (
          <div className="mb-8 bg-[#fef9f0] border border-[#c8a96e]/20 rounded-2xl p-6">
            <p className="text-gray-700 leading-relaxed">{recipe.description_fr}</p>
            {recipe.description_ar && (
              <p className="text-gray-500 leading-relaxed mt-3 text-right border-t border-[#c8a96e]/10 pt-3" dir="rtl">
                {recipe.description_ar}
              </p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Ingredients ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
              <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#c8a96e] rounded-lg flex items-center justify-center text-white text-sm">🌿</span>
                Ingrédients
                {recipe.ingredients?.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto">
                    {recipe.ingredients.length}
                  </span>
                )}
              </h2>

              {!recipe.ingredients || recipe.ingredients.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun ingrédient spécifié.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-[#2c2c2c] font-medium">{ing.name_fr}</span>
                          {ing.quantity && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">{ing.quantity}</span>
                          )}
                        </div>
                        {ing.name_ar && (
                          <p className="text-xs text-gray-400 text-right" dir="rtl">{ing.name_ar}</p>
                        )}
                        {/* Link to product */}
                        {ing.product_slug && (
                          <Link to={`/products/${ing.product_slug}`}
                            className="inline-flex items-center gap-1 text-xs text-[#c8a96e] hover:text-[#b8955a] mt-0.5 transition-colors">
                            🛒 Voir le produit
                            {ing.product_price && (
                              <span className="text-gray-400">· {Number(ing.product_price).toFixed(3)} TND</span>
                            )}
                          </Link>
                        )}
                        {ing.is_bio && (
                          <span className="inline-block text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">🌱 Bio</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2c2c2c] rounded-lg flex items-center justify-center text-white text-sm">📋</span>
              Préparation
              {recipe.steps?.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto">
                  {recipe.steps.length} étapes
                </span>
              )}
            </h2>

            {!recipe.steps || recipe.steps.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 border border-gray-100">
                Aucune étape définie.
              </div>
            ) : (
              <div className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all duration-200 ${
                      activeStep === i
                        ? "border-[#c8a96e] shadow-md ring-1 ring-[#c8a96e]/20"
                        : "border-gray-100 shadow-sm hover:border-gray-200"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                        activeStep === i ? "bg-[#c8a96e] text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {step.step_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#2c2c2c] text-sm leading-relaxed">{step.instruction_fr}</p>
                        {step.instruction_ar && (
                          <p className="text-gray-400 text-xs mt-2 text-right border-t border-gray-50 pt-2" dir="rtl">
                            {step.instruction_ar}
                          </p>
                        )}
                        {step.duration && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#c8a96e] bg-[#c8a96e]/10 px-2 py-0.5 rounded-full">
                            ⏱ {step.duration} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step navigation */}
            {recipe.steps?.length > 1 && (
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  disabled={activeStep === 0}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Étape précédente
                </button>
                <button
                  onClick={() => setActiveStep(s => Math.min(recipe.steps.length - 1, s + 1))}
                  disabled={activeStep === recipe.steps.length - 1}
                  className="flex-1 py-2.5 rounded-xl bg-[#2c2c2c] text-white text-sm font-medium hover:bg-[#3c3c3c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Étape suivante →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Back CTA ── */}
        <div className="mt-10 text-center">
          <Link to="/recettes"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#c8a96e] transition-colors text-sm">
            ← Voir toutes les recettes
          </Link>
        </div>
      </div>
    </div>
  );
}