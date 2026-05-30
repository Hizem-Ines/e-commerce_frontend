import { Link, useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useWishlist } from '../../context/WishlistContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import formatPrice from '../../utils/formatPrice';
import { imageUrl } from '../../utils/imageUrl';

const CarteIA = ({ produit }) => {
  const { toggleFavori, estFavori } = useWishlist();
  const { currency } = useSiteSettings();
  const navigate = useNavigate();

  const aPromo = produit.prix_promo != null && parseFloat(produit.prix_promo) < parseFloat(produit.prix_min);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-[#4a8c42] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">

      {/* IMAGE */}
      <Link to={`/produits/${produit.id}`} className="no-underline">
        <div className="relative h-44 bg-[#ecfdf5] flex items-center justify-center cursor-pointer overflow-hidden">
          {produit.images?.[0]?.url ? (
            <img
              src={imageUrl(produit.images[0].url)}
              alt={produit.name_fr}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">🌿</span>
              <span className="text-xs text-black/30 font-semibold">Pas d'image</span>
            </div>
          )}

          {/* NOTE */}
          <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
            {produit.rating_avg > 0
              ? `⭐ ${parseFloat(produit.rating_avg).toFixed(1)}`
              : '✨ Nouveau'}
          </span>

          {/* BADGE PROMO */}
          {aPromo && (
            <span className="absolute top-3 right-3 bg-[#c8872a] text-white text-xs font-bold px-2 py-1 rounded-full">
              Promo
            </span>
          )}

          {/* BADGE NOUVEAU / COUP DE CŒUR */}
          {produit.is_featured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">
              ❤️ Coup de cœur
            </span>
          )}
          {produit.is_new && !produit.is_featured && (
            <span className="absolute top-3 left-3 bg-[#2d5a27] text-white text-xs font-bold px-2 py-1 rounded-full">
              ✨ Nouveau
            </span>
          )}
        </div>
      </Link>

      {/* INFOS */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
            <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-[#2d5a27] transition-colors duration-200">
              {produit.name_fr}
            </h3>
          </Link>
          <button
            onClick={() => toggleFavori(produit)}
            aria-label={estFavori(produit.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200 shrink-0"
          >
            {estFavori(produit.id)
              ? <FaHeart size={16} className="text-red-500" />
              : <FiHeart size={16} className="text-gray-400 hover:text-red-400" />
            }
          </button>
        </div>

        {produit.categorie_fr && (
          <span className="text-xs text-black/40 mb-2">{produit.categorie_fr}</span>
        )}

        {/* RAISON IA — le vrai plus-value de cette page */}
        {produit.raison_ia && (
          <p className="text-xs italic text-[#2d5a27] bg-[#ecfdf5] rounded-xl px-3 py-2 mb-3 leading-relaxed">
            💡 {produit.raison_ia}
          </p>
        )}

        {/* PRIX */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            {aPromo ? (
              <>
                <span className="text-xs text-black/40 line-through">
                  {formatPrice(produit.prix_min, currency)}
                </span>
                <span className="text-lg font-extrabold text-[#c8872a]">
                  {formatPrice(produit.prix_promo, currency)}
                </span>
              </>
            ) : (
              <span className="text-lg font-extrabold text-[#2d5a27]">
                {produit.prix_min ? formatPrice(produit.prix_min, currency) : 'Prix N/A'}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(`/produits/${produit.id}`)}
            className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300"
          >
            Voir le produit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarteIA;