// pages/Conseiller.jsx
import { useState, useRef } from 'react';
import {  useNavigate } from 'react-router-dom';
import { BsStars } from 'react-icons/bs';
import {  FiSend } from 'react-icons/fi';
import { getRecommandations } from '../../services/conseillerService';
import CarteIA from '../../Components/common/CartIA';

const CHIPS = [
  { label: '🫶 Digestion', texte: "J'ai des problèmes de digestion et des ballonnements" },
  { label: '😴 Sommeil',   texte: "J'ai du mal à dormir et je me sens stressé" },
  { label: '⚡ Énergie',   texte: "Je manque d'énergie et je me sens fatigué" },
  { label: '🌿 Immunité',  texte: "Je veux renforcer mon système immunitaire naturellement" },
  { label: '✨ Peau',      texte: "J'ai la peau sèche et je cherche des soins naturels" },
  { label: '💆 Stress',    texte: "Je suis très stressé et anxieux en ce moment" },
  { label: '💪 Cheveux',   texte: "Mes cheveux tombent et manquent de vitalité" },
  { label: '🍃 Détox',     texte: "Je veux faire une détox naturelle de mon organisme" },
];


// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonCarte = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] animate-pulse">
    <div className="h-44 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-8 bg-gray-100 rounded-xl w-24" />
      </div>
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
const Conseiller = () => {
  const [demande, setDemande]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [resultat, setResultat]     = useState(null);
  const [erreur, setErreur]         = useState('');
  const textareaRef                 = useRef(null);
  const resultatsRef                = useRef(null);

  const handleChipClick = (texte) => {
    setDemande(texte);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    const trimmed = demande.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setErreur('');
    setResultat(null);

    try {
      const res = await getRecommandations(trimmed);
      setResultat(res.data);
      // scroll vers résultats après rendu
      setTimeout(() => {
        resultatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setErreur(
        err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setDemande('');
    setResultat(null);
    setErreur('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#fdf6ec] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#2d5a27] via-[#3a7232] to-[#2d5a27] py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-white/20">
            <BsStars size={14} />
            Propulsé par l'intelligence artificielle
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-4 leading-tight">
            Votre Conseiller<br />
            <span className="ttext-[#a8d5a2]">Bien-être Naturel</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Décrivez ce que vous ressentez ou ce dont vous avez besoin,
            notre IA vous recommande les produits GOFFA les plus adaptés.
          </p>
        </div>
      </div>

      {/* ── ZONE SAISIE ──────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-2xl px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6">

          {/* TEXTAREA */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={demande}
              onChange={e => setDemande(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              maxLength={500}
              placeholder="Ex : J'ai souvent des maux de ventre après les repas et je cherche quelque chose de naturel..."
              className="w-full bg-[#f9f5f0] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-black/30 outline-none resize-none leading-relaxed border-2 border-transparent focus:border-[#2d5a27] transition-colors duration-200"
            />
            <span className="absolute bottom-3 right-3 text-xs text-black/25 font-semibold select-none">
              {demande.length}/500
            </span>
          </div>

          {/* BOUTON ENVOYER */}
          <button
            onClick={handleSubmit}
            disabled={loading || demande.trim().length < 2}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2d5a27] to-[#4a8c42] hover:from-[#4a8c42] hover:to-[#2d5a27] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-300 text-sm"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">🌿</span>
                Notre conseiller analyse votre demande...
              </>
            ) : (
              <>
                <BsStars size={16} />
                Trouver mes produits
                <FiSend size={14} />
              </>
            )}
          </button>

          {/* CHIPS */}
          <div className="mt-4">
            <p className="text-xs font-bold text-black/30 uppercase tracking-wider mb-3">
              Suggestions rapides
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.texte)}
                  className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full border transition-all duration-200 ${
                    demande === chip.texte
                      ? 'bg-[#2d5a27] text-white border-[#2d5a27]'
                      : 'bg-white text-[#2d5a27] border-[#2d5a27]/30 hover:bg-[#d1fae5] hover:border-[#2d5a27]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ERREUR ────────────────────────────────────────────────────────── */}
      {erreur && (
        <div className="container mx-auto max-w-2xl px-4 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-red-700">{erreur}</p>
              <button
                onClick={handleSubmit}
                className="text-xs text-red-500 underline mt-1 font-semibold"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SKELETONS (loading) ───────────────────────────────────────────── */}
      {loading && (
        <div className="container mx-auto max-w-5xl px-4 mt-10 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <SkeletonCarte key={i} />)}
          </div>
        </div>
      )}

      {/* ── RÉSULTATS ─────────────────────────────────────────────────────── */}
      {resultat && !loading && (
        <div ref={resultatsRef} className="container mx-auto max-w-5xl px-4 mt-10 pb-16">

          {/* MESSAGE IA */}
          {resultat.message && (
            <div className="bg-white border-l-4 border-[#2d5a27] rounded-2xl px-5 py-4 mb-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-start gap-3">
              <span className="text-2xl shrink-0">🌿</span>
              <p className="text-sm text-[#2c2c2c] font-semibold leading-relaxed">
                {resultat.message}
              </p>
            </div>
          )}

          {/* ENTÊTE RÉSULTATS */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">
                {resultat.total} produit{resultat.total > 1 ? 's' : ''} recommandé{resultat.total > 1 ? 's' : ''}
              </h2>
              <p className="text-black/40 text-sm mt-0.5">
                Sélectionnés parmi tout le catalogue GOFFA
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-bold text-[#2d5a27] hover:underline flex items-center gap-1"
            >
              ← Nouvelle recherche
            </button>
          </div>

          {/* GRILLE */}
          {resultat.produits_recommandes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucun produit trouvé</h3>
              <p className="text-black/50 mb-6">Essayez de reformuler votre demande</p>
              <button
                onClick={handleReset}
                className="bg-[#2d5a27] text-white font-bold px-6 py-3 rounded-full hover:bg-[#4a8c42] transition-colors duration-300"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultat.produits_recommandes.map(produit => (
                <CarteIA key={produit.id} produit={produit} />
              ))}
            </div>
          )}

          {/* SUGGESTION IA */}
          {resultat.suggestion && (
            <div className="mt-8 bg-[#ecfdf5] rounded-2xl px-5 py-4 flex items-center gap-3 border border-[#d1fae5]">
              <span className="text-xl shrink-0">💬</span>
              <p className="text-sm text-[#2d5a27] font-semibold italic">
                {resultat.suggestion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAT INITIAL (pas encore de recherche) ───────────────────────── */}
      {!resultat && !loading && !erreur && (
        <div className="container mx-auto max-w-2xl px-4 mt-12 pb-16 text-center">
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-black/40 font-semibold">
            Décrivez votre besoin ci-dessus et notre IA analysera tout le catalogue
            pour vous proposer les meilleurs produits naturels.
          </p>
        </div>
      )}

    </div>
  );
};

export default Conseiller;