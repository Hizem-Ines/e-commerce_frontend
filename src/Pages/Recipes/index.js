import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchAllRecipes, fetchFeaturedRecipes } from "../../services/recipesService";

const DIFFICULTIES = ["facile", "moyen", "difficile"];
const CATEGORIES = ["entrée", "plat", "dessert", "boisson", "snack"];

const clockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const leafIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);
const searchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const usersIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const eyeIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const difficultyColor = {
  facile: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  moyen:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"  },
  difficile: { bg: "bg-rose-50", text: "text-rose-700",    dot: "bg-rose-500"   },
};

function RecipeCard({ recipe }) {
  const diff = difficultyColor[recipe.difficulty] || difficultyColor.facile;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Link
      to={`/recettes/${recipe.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-52 bg-[#f5f0e8]">
        {recipe.cover_image ? (
          <img
            src={recipe.cover_image}
            alt={recipe.title_fr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">🍽️</span>
          </div>
        )}
        {recipe.is_featured && (
          <div className="absolute top-3 left-3 bg-[#c8a96e] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            ✦ Mis en avant
          </div>
        )}
        <div className={`absolute top-3 right-3 ${diff.bg} ${diff.text} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
          {recipe.difficulty}
        </div>
        {recipe.category && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full capitalize">
            {recipe.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#2c2c2c] text-base leading-snug mb-1 group-hover:text-[#c8a96e] transition-colors line-clamp-2">
          {recipe.title_fr}
        </h3>
        {recipe.title_ar && (
          <p className="text-xs text-gray-400 text-right mb-2" dir="rtl">{recipe.title_ar}</p>
        )}
        {recipe.description_fr && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{recipe.description_fr}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-gray-400 text-xs pt-3 border-t border-gray-50">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              {clockIcon} {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              {usersIcon} {recipe.servings} pers.
            </span>
          )}
          {recipe.ingredients_count > 0 && (
            <span className="flex items-center gap-1">
              {leafIcon} {recipe.ingredients_count} ingr.
            </span>
          )}
          {recipe.views_count > 0 && (
            <span className="flex items-center gap-1 ml-auto">
              {eyeIcon} {recipe.views_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes]       = useState([]);
  const [featured, setFeatured]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]     = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Fetch featured (once)
  useEffect(() => {
    fetchFeaturedRecipes()
      .then(r => setFeatured(r.data.recipes || []))
      .catch(() => {});
  }, []);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchAllRecipes({ page, search, category, difficulty });
      setRecipes(data.recipes || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, difficulty]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilter = (type, value) => {
    if (type === "category")   { setCategory(prev => prev === value ? "" : value);   setPage(1); }
    if (type === "difficulty") { setDifficulty(prev => prev === value ? "" : value); setPage(1); }
  };

  const heroRecipe = featured[0];

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── Hero ── */}
      <section className="relative bg-[#2c2c2c] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8a96e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-16 lg:py-20">
          {heroRecipe ? (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#c8a96e]/20 text-[#c8a96e] text-sm font-medium px-3 py-1.5 rounded-full mb-4">
                  ✦ Recette mise en avant
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">
                  {heroRecipe.title_fr}
                </h1>
                {heroRecipe.description_fr && (
                  <p className="text-white/70 text-lg leading-relaxed mb-6 line-clamp-3">
                    {heroRecipe.description_fr}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
                  {((heroRecipe.prep_time || 0) + (heroRecipe.cook_time || 0)) > 0 && (
                    <span className="flex items-center gap-1.5">{clockIcon} {(heroRecipe.prep_time || 0) + (heroRecipe.cook_time || 0)} min</span>
                  )}
                  {heroRecipe.servings && (
                    <span className="flex items-center gap-1.5">{usersIcon} {heroRecipe.servings} personnes</span>
                  )}
                  <span className="capitalize flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${difficultyColor[heroRecipe.difficulty]?.dot || "bg-gray-400"}`} />
                    {heroRecipe.difficulty}
                  </span>
                </div>
                <Link to={`/recettes/${heroRecipe.slug}`}
                  className="inline-flex items-center gap-2 bg-[#c8a96e] hover:bg-[#b8955a] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  Voir la recette →
                </Link>
              </div>
              {heroRecipe.cover_image && (
                <div className="hidden lg:block rounded-2xl overflow-hidden h-72 shadow-2xl">
                  <img src={heroRecipe.cover_image} alt={heroRecipe.title_fr} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🍲</div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-3">Nos Recettes</h1>
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Découvrez nos recettes artisanales tunisiennes, préparées avec des produits locaux de qualité.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
              <span className="text-gray-400">{searchIcon}</span>
              <input
                type="text"
                placeholder="Rechercher une recette..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="bg-transparent text-sm text-[#2c2c2c] placeholder-gray-400 outline-none w-full"
              />
            </form>

            {/* Category filters */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => handleFilter("category", c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    category === c
                      ? "bg-[#2c2c2c] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Difficulty filters */}
            <div className="flex gap-1.5">
              {DIFFICULTIES.map(d => {
                const dc = difficultyColor[d];
                return (
                  <button key={d} onClick={() => handleFilter("difficulty", d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      difficulty === d
                        ? `${dc.bg} ${dc.text} ring-1 ring-current`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Clear */}
            {(search || category || difficulty) && (
              <button onClick={() => { setSearch(""); setSearchInput(""); setCategory(""); setDifficulty(""); setPage(1); }}
                className="text-xs text-[#c8a96e] hover:text-[#b8955a] font-medium whitespace-nowrap">
                ✕ Effacer
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
                <div className="h-52 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-[#2c2c2c] mb-2">Aucune recette trouvée</h3>
            <p className="text-gray-500 text-sm">Essayez d'autres filtres ou termes de recherche.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {recipes.length} recette{recipes.length > 1 ? "s" : ""}
                {search && <span> pour "<strong>{search}</strong>"</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Précédent
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      page === i + 1
                        ? "bg-[#2c2c2c] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}