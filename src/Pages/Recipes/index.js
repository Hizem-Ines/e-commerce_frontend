import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchAllRecipes, fetchFeaturedRecipes } from "../../services/recipesService";
import { FiClock, FiUsers, FiEye } from "react-icons/fi";
import { GiPlantSeed } from "react-icons/gi";

const DIFFICULTIES = ["facile", "moyen", "difficile"];

// valeur = exactement ce qui est stocké en base
// label  = ce qu'on affiche dans l'UI
const CATEGORIES = [
  { value: "entree",         label: "Entrée" },
  { value: "plat-principal", label: "Plat principal" },
  { value: "soupe",          label: "Soupe" },
  { value: "dessert",        label: "Dessert" },
  { value: "boisson",        label: "Boisson" },
];

const difficultyConfig = {
  facile:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Facile" },
  moyen:     { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Moyen" },
  difficile: { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    label: "Difficile" },
};

function RecipeCard({ recipe }) {
  const diff = difficultyConfig[recipe.difficulty] || difficultyConfig.facile;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      {/* IMAGE */}
      <Link to={`/recettes/${recipe.slug}`} className="no-underline">
        <div className="relative h-44 bg-[#ecfdf5] flex items-center justify-center cursor-pointer overflow-hidden">
          {recipe.cover_image ? (
            <img
              src={recipe.cover_image}
              alt={recipe.title_fr}
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">🍲</span>
              <span className="text-xs text-black/30 font-semibold">Pas d'image</span>
            </div>
          )}

          {/* Badges */}
          {recipe.is_featured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">
              ✨ Mis en avant
            </span>
          )}
          <span className={`absolute top-3 right-3 ${diff.bg} ${diff.text} text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
            {diff.label}
          </span>
          {recipe.category && (
            <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              {CATEGORIES.find(c => c.value === recipe.category)?.label || recipe.category}
            </span>
          )}
        </div>
      </Link>

      {/* INFOS */}
      <div className="p-4">
        <div className="mb-2">
          <Link to={`/recettes/${recipe.slug}`} className="no-underline">
            <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-[#2d5a27] transition-colors duration-200 line-clamp-2">
              {recipe.title_fr}
            </h3>
          </Link>
          {recipe.title_ar && (
            <p className="text-xs text-gray-400 text-right mt-0.5" dir="rtl">{recipe.title_ar}</p>
          )}
        </div>

        {recipe.description_fr && (
          <p className="text-xs text-black/50 line-clamp-2 mb-3">{recipe.description_fr}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-black/40 pt-3 border-t border-gray-100 flex-wrap">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <FiClock size={12} /> {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <FiUsers size={12} /> {recipe.servings} pers.
            </span>
          )}
          {recipe.ingredients_count > 0 && (
            <span className="flex items-center gap-1">
              <GiPlantSeed size={12} /> {recipe.ingredients_count} ingr.
            </span>
          )}
          {recipe.views_count > 0 && (
            <span className="flex items-center gap-1 ml-auto">
              <FiEye size={12} /> {recipe.views_count}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-3">
          <span className="text-lg font-extrabold text-[#2d5a27]">
            {recipe.difficulty ? (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${difficultyConfig[recipe.difficulty]?.bg} ${difficultyConfig[recipe.difficulty]?.text}`}>
                {difficultyConfig[recipe.difficulty]?.label}
              </span>
            ) : null}
          </span>
          <Link
            to={`/recettes/${recipe.slug}`}
            className="bg-[#2d5a27] hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300 no-underline"
          >
            Voir la recette
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes]         = useState([]);
  const [featured, setFeatured]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]       = useState("");
  const [difficulty, setDifficulty]   = useState("");

  // Fetch featured (once)
  useEffect(() => {
    fetchFeaturedRecipes()
      .then(r => setFeatured(r.data.recipes || []))
      .catch(() => {});
  }, []);

  // Fetch recipes
  const loadRecipes = useCallback(async () => {
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

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilter = (type, value) => {
    if (type === "category")   { setCategory(prev => prev === value ? "" : value);   setPage(1); }
    if (type === "difficulty") { setDifficulty(prev => prev === value ? "" : value); setPage(1); }
  };

  const resetFiltres = () => {
    setSearch("");
    setSearchInput("");
    setCategory("");
    setDifficulty("");
    setPage(1);
  };

  const heroRecipe = featured[0];
  const hasActiveFilters = search || category || difficulty;

  return (
    <div className="bg-[#fdf6ec] min-h-screen py-12">
      <div className="container mx-auto px-4">

        {/* ── TITRE + HERO ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-1">
              Nos Recettes
            </h1>
            <p className="text-black/50">
              {recipes.length} recette{recipes.length > 1 ? "s" : ""} trouvée{recipes.length > 1 ? "s" : ""}
              {search && <span> pour "<strong>{search}</strong>"</span>}
            </p>
          </div>
          
        </div>

        {/* ── Hero featured recipe banner ── */}
        {heroRecipe && (
          <div className="bg-[#2c2c2c] rounded-2xl overflow-hidden mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-0">
              {heroRecipe.cover_image && (
                <div className="w-full md:w-56 h-40 md:h-full shrink-0 overflow-hidden">
                  <img
                    src={heroRecipe.cover_image}
                    alt={heroRecipe.title_fr}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 flex-1">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  ✨ Recette mise en avant
                </span>
                <h2 className="text-xl font-bold text-white mb-2">{heroRecipe.title_fr}</h2>
                {heroRecipe.description_fr && (
                  <p className="text-white/60 text-sm line-clamp-2 mb-4">{heroRecipe.description_fr}</p>
                )}
                <div className="flex items-center gap-4 text-white/50 text-xs mb-4 flex-wrap">
                  {((heroRecipe.prep_time || 0) + (heroRecipe.cook_time || 0)) > 0 && (
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      {(heroRecipe.prep_time || 0) + (heroRecipe.cook_time || 0)} min
                    </span>
                  )}
                  {heroRecipe.servings && (
                    <span className="flex items-center gap-1">
                      <FiUsers size={12} />
                      {heroRecipe.servings} personnes
                    </span>
                  )}
                  {heroRecipe.difficulty && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${difficultyConfig[heroRecipe.difficulty]?.bg} ${difficultyConfig[heroRecipe.difficulty]?.text}`}>
                      {difficultyConfig[heroRecipe.difficulty]?.label}
                    </span>
                  )}
                </div>
                <Link
                  to={`/recettes/${heroRecipe.slug}`}
                  className="inline-block bg-[#2d5a27] hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors duration-300 no-underline"
                >
                  Voir la recette →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">

          {/* ── SIDEBAR FILTRES ── */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[#2c2c2c] text-base">Filtres</h3>
                {hasActiveFilters && (
                  <button onClick={resetFiltres} className="text-xs text-[#2d5a27] hover:underline font-semibold">
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* RECHERCHE */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Recherche</h4>
                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-[#f9f5f0] rounded-xl px-3 py-2.5">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="bg-transparent text-sm text-[#2c2c2c] placeholder-black/30 outline-none w-full"
                  />
                  <button type="submit" className="text-[#2d5a27] shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </button>
                </form>
              </div>

              {/* CATÉGORIES */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Catégorie</h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setCategory(""); setPage(1); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                      category === ""
                        ? "bg-[#2d5a27] text-white"
                        : "bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-[#2d5a27]"
                    }`}
                  >
                    Toutes les catégories
                  </button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => handleFilter("category", c.value)}
                      className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                        category === c.value
                          ? "bg-[#2d5a27] text-white"
                          : "bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-[#2d5a27]"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DIFFICULTÉ */}
              <div>
                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Difficulté</h4>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setDifficulty(""); setPage(1); }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                      difficulty === ""
                        ? "bg-[#2d5a27] text-white"
                        : "bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-[#2d5a27]"
                    }`}
                  >
                    Toutes les difficultés
                  </button>
                  {DIFFICULTIES.map(d => {
                    const dc = difficultyConfig[d];
                    return (
                      <button
                        key={d}
                        onClick={() => handleFilter("difficulty", d)}
                        className={`text-left px-3 py-2 rounded-xl text-sm font-semibold capitalize transition-colors duration-200 flex items-center gap-2 ${
                          difficulty === d
                            ? `${dc.bg} ${dc.text} ring-1 ring-current`
                            : "bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-[#2d5a27]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dc.dot}`} />
                        {dc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── GRILLE RECETTES ── */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 animate-spin">🌿</div>
                <p className="text-black/50 font-semibold">Chargement...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucune recette trouvée</h3>
                <p className="text-black/50 mb-6">Essayez avec d'autres filtres</p>
                <button
                  onClick={resetFiltres}
                  className="bg-[#2d5a27] text-white font-bold px-6 py-3 rounded-full hover:bg-emerald-500 transition-colors duration-300"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 ${
                          page === i + 1
                            ? "bg-[#2d5a27] text-white"
                            : "bg-white text-black/50 hover:bg-emerald-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}