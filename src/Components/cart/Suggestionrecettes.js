// src/components/cart/SuggestionsRecettes.jsx

import { useState } from 'react';
import { suggererRecettes } from '../../services/aiRecipePanierService';

export default function SuggestionsRecettes({ panier }) {
    const [recettes, setRecettes] = useState([]);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [demande, setDemande] = useState(false);

    const handleSuggerer = async () => {
        setChargement(true);
        setErreur(null);
        setDemande(true);
        try {
            const resultats = await suggererRecettes(panier);
            setRecettes(resultats);
        } catch (e) {
            setErreur('Impossible de charger les suggestions pour le moment.');
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5 sm:p-6 mt-6">
            {/* En-tête */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">👨‍🍳</span>
                <div>
                    <h3 className="font-bold font-serif text-[#2c2c2c] text-base sm:text-lg leading-tight">
                        Que cuisiner avec votre panier ?
                    </h3>
                    <p className="text-xs text-black/40 mt-0.5">
                        Suggestions de recettes par l'IA GOFFA
                    </p>
                </div>
            </div>

            {/* Bouton déclencheur */}
            {!demande && (
                <button
                    onClick={handleSuggerer}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-105"
                    style={{
                        background: 'linear-gradient(135deg, #c8872a, #d97706)',
                        boxShadow: '0 4px 15px rgba(200,135,42,0.35)',
                    }}
                >
                    ✨ Suggérer des recettes
                </button>
            )}

            {/* Chargement */}
            {chargement && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-sm text-black/40">L'IA prépare vos recettes…</p>
                </div>
            )}

            {/* Erreur */}
            {erreur && (
                <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mt-2">
                    {erreur}
                    <button
                        onClick={handleSuggerer}
                        className="block mt-2 text-xs text-red-400 underline"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* Résultats */}
            {!chargement && recettes.length > 0 && (
                <div className="space-y-4 mt-2">
                    {recettes.map((recette, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-amber-100 p-4 transition-shadow hover:shadow-md"
                            style={{ background: '#fffbf3' }}
                        >
                            {/* Titre */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{recette.emoji || '🍽️'}</span>
                                <h4 className="font-bold text-[#2c2c2c] text-sm sm:text-base">
                                    {recette.titre}
                                </h4>
                                <span className="ml-auto text-xs text-black/30 whitespace-nowrap">
                                    ⏱ {recette.temps}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-black/50 mb-3 leading-relaxed">
                                {recette.description}
                            </p>

                            {/* Ingrédients */}
                            <div className="flex flex-wrap gap-1.5">
                                {recette.ingredients.map((ing, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: '#dcfce7', color: '#166534' }}
                                    >
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Bouton pour relancer */}
                    <button
                        onClick={handleSuggerer}
                        className="w-full text-xs text-amber-600 hover:text-amber-800 font-medium py-1 transition-colors"
                    >
                        🔄 Autres suggestions
                    </button>
                </div>
            )}
        </div>
    );
}