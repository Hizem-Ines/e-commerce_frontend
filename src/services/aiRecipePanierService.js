import api from './api'; // l'instance axios configurée de GOFFA

/**
 * Suggère des recettes basées sur les produits du panier.
 * L'appel passe par le backend GOFFA qui détient la clé Gemini.
 * @param {Array} panier - Liste des articles du panier (depuis CartContext)
 * @returns {Promise<Array>} - Tableau de recettes { titre, description, ingredients, temps, emoji }
 */
export const suggererRecettes = async (panier) => {
    if (!panier || panier.length === 0) return null;
    const response = await api.post('/ia/suggestions', { produits: panier });
    return response.data.recette;
};