import api from './api';

// ── Public ───────────────────────────────────────────────

export const fetchAllRecipes = ({ page = 1, search = '', category = '', difficulty = '' } = {}) => {
    const params = { page };
    if (search)     params.search     = search;
    if (category)   params.category   = category;
    if (difficulty) params.difficulty = difficulty;
    return api.get('/recipes', { params });
};

export const fetchFeaturedRecipes = () =>
    api.get('/recipes/featured');

export const fetchSingleRecipe = (slug) =>
    api.get(`/recipes/${slug}`);

// ── Admin ────────────────────────────────────────────────

export const fetchAllRecipesAdmin = () =>
    api.get('/recipes/admin/all');

export const createRecipe = (formData) =>
    api.post('/recipes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const updateRecipe = (recipeId, formData) =>
    api.put(`/recipes/${recipeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteRecipe = (recipeId) =>
    api.delete(`/recipes/${recipeId}`);