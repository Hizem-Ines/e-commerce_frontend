import { useState } from 'react';
import { suggererRecettes } from '../../services/aiRecipePanierService';
import CarteIA from '../common/CartIA';

export default function SuggestionsRecettes({ panier }) {
    const [recette, setRecette] = useState(null);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [demande, setDemande] = useState(false);

    const handleSuggerer = async () => {
        setChargement(true);
        setErreur(null);
        setDemande(true);
        try {
            const resultat = await suggererRecettes(panier);
                if (!resultat) {
                    setDemande(false); // remet le bouton visible
                    setErreur('Aucun produit alimentaire dans votre panier pour suggérer une recette 🥬');
                    return;
                }
                setRecette(resultat);
        } catch {
            setErreur('Impossible de charger les suggestions pour le moment.');
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden mt-6"
            style={{ background: '#fffbf3', border: '1px solid #fde68a' }}>

            {/* En-tête */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, #c8872a, #d97706)' }}>
                    👨‍🍳
                </div>
                <div>
                    <h3 className="font-bold font-serif text-[#2c2c2c] text-base leading-tight">
                        Que cuisiner avec votre panier ?
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                        Recettes du monde entier · Suggestions GOFFA incluses
                    </p>
                </div>
            </div>

            <div className="px-5 pb-5">
                {/* Bouton déclencheur */}
                {!demande && (
                    <button
                        onClick={handleSuggerer}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #c8872a, #d97706)',
                            boxShadow: '0 4px 15px rgba(200,135,42,0.35)',
                        }}
                    >
                        ✨ Suggérer une recette avec l'IA
                    </button>
                )}

                {/* Chargement */}
                {chargement && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-9 h-9 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                        <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                            L'IA prépare votre recette du monde…
                        </p>
                    </div>
                )}

                {/* Erreur */}
                {erreur && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-2">
                        {erreur}
                        <button onClick={handleSuggerer}
                            className="block mt-2 text-xs text-red-400 underline">
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Résultats */}
                {!chargement && recette && (
                    <div className="rounded-xl overflow-hidden mt-1"
                        style={{ background: '#fff', border: '1px solid #fde68a' }}>

                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-2xl">{recette.emoji}</span>
                            <div className="flex-1">
                                <p className="font-bold text-[#2c2c2c] text-sm">{recette.titre}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                                    {recette.origine} · ⏱ {recette.temps}
                                </p>
                            </div>
                        </div>

                        <div className="px-4 pb-4 space-y-3 border-t border-amber-100 pt-3">

                            {/* Description */}
                            <p className="text-xs leading-relaxed" style={{ color: '#78716c' }}>
                                {recette.description}
                            </p>

                            {/* Ingrédients */}
                            <div>
                                <p className="text-xs font-bold text-[#2c2c2c] mb-2 uppercase tracking-wide">
                                    Ingrédients
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {recette.ingredients.map((ing, i) => (
                                        <span key={i}
                                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                                            style={{ background: '#dcfce7', color: '#166534' }}>
                                            {ing.quantite} {ing.nom}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Étapes */}
                            <div>
                                <p className="text-xs font-bold text-[#2c2c2c] mb-2 uppercase tracking-wide">
                                    Préparation
                                </p>
                                <ol className="space-y-1.5">
                                    {recette.etapes.map((etape, i) => (
                                        <li key={i} className="flex gap-2 text-xs" style={{ color: '#78716c' }}>
                                            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ background: '#c8872a' }}>
                                                {i + 1}
                                            </span>
                                            {etape}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Suggestions GOFFA */}
                            {recette.suggestionGoffa?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-[#2c2c2c] mb-3 uppercase tracking-wide">
                                        🛒 Complétez votre recette avec GOFFA
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {recette.suggestionGoffa.map((produit) => (
                                            <CarteIA key={produit.id} produit={produit} />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}