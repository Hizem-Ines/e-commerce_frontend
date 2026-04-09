import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById, getAllProducts } from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import { createReview } from '../../services/reviewService';

const FormAvis = ({ productId, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setError('Veuillez choisir une note'); return; }
        if (!comment.trim()) { setError('Veuillez écrire un commentaire'); return; }
        setLoading(true);
        setError('');
        try {
            await createReview(productId, { rating, comment });
            setSuccess(true);
            setRating(0);
            setComment('');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-bold text-emerald-700">Merci pour votre avis !</p>
        </div>
    );

    return (
        <div className="bg-white border-2 border-emerald-100 rounded-xl p-6">
            <h4 className="font-bold text-[#2c2c2c] mb-4">Laisser un avis</h4>
            {error && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-4">
                    ❌ {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ÉTOILES */}
                <div>
                    <p className="text-xs font-bold text-gray-600 mb-2">Note *</p>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="text-3xl transition-transform hover:scale-110"
                            >
                                <span className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                                    ★
                                </span>
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-2 text-sm font-bold text-black/40 self-center">
                                {['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'][rating]}
                            </span>
                        )}
                    </div>
                </div>

                {/* COMMENTAIRE */}
                <div>
                    <p className="text-xs font-bold text-gray-600 mb-2">Commentaire *</p>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Partagez votre expérience avec ce produit..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition resize-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2d5a27] hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
                >
                    {loading ? 'Envoi...' : 'Publier mon avis →'}
                </button>
            </form>
        </div>
    );
};
const ProductDetail = () => {
    const { id } = useParams();
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();
    const { user } = useAuth();

    const [quantite, setQuantite]             = useState(1);
    const [ajoute, setAjoute]                 = useState(false);
    const [produit, setProduit]               = useState(null);
    const [similaires, setSimilaires]         = useState([]);
    const [loading, setLoading]               = useState(true);
    const [varianteActive, setVarianteActive] = useState(null);
    const [imageActive, setImageActive]       = useState(0);
    const [ongletActif, setOngletActif]       = useState('description');

    // ── Fetch product ──────────────────────────────────────
    useEffect(() => {
        const fetchProduit = async () => {
            setLoading(true);
            try {
                const res = await getProductById(id);
                const p   = res.data.product;
                setProduit(p);
                if (p.variants?.length > 0) {
                    setVarianteActive(p.variants[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduit();
    }, [id]);

    // ── Fetch similar products ─────────────────────────────
    useEffect(() => {
        if (!produit?.category_id) return;
        getAllProducts({ category_id: produit.category_id, page: 1 })
            .then(res => {
                const autres = res.data.products.filter(p => p.id !== id);
                setSimilaires(autres.slice(0, 4));
            })
            .catch(console.error);
    }, [produit?.category_id, id]);

    const handleAjouter = () => {
        if (!varianteActive?.id) return;
        ajouterAuPanier({
            variant_id:   varianteActive.id,
            product_name: produit.name_fr,
            price:        varianteActive.price,
            image:        produit.images?.[0]?.url || null,
            attributes:   varianteActive.attributes || [],
            stock:        varianteActive.stock,
        }, quantite);
        setAjoute(true);
        setTimeout(() => setAjoute(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec]">
                <div className="text-6xl animate-spin mb-4">🌿</div>
                <p className="text-black/50 font-semibold">Chargement...</p>
            </div>
        );
    }

    if (!produit) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-3">Produit introuvable</h2>
                <Link to="/produits" className="bg-[#2d5a27] text-white font-bold px-8 py-3 rounded-full no-underline hover:bg-emerald-500 transition-colors duration-300">
                    Voir tous les produits
                </Link>
            </div>
        );
    }

    const images       = produit.images || [];
    const prix         = varianteActive?.price || produit.variants?.[0]?.price || 0;
    const comparePrice = varianteActive?.compare_price;

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* ── FIL D'ARIANE ─────────────────────────────────── */}
                <div className="flex items-center gap-2 text-sm text-black/50 mb-8 flex-wrap">
                    <Link to="/" className="hover:text-[#2d5a27] no-underline transition-colors duration-200">Accueil</Link>
                    <span>›</span>
                    <Link to="/produits" className="hover:text-[#2d5a27] no-underline transition-colors duration-200">Produits</Link>
                    {produit.parent_category_name && (
                        <>
                            <span>›</span>
                            <span className="text-black/40">{produit.parent_category_name}</span>
                        </>
                    )}
                    {produit.category_name && (
                        <>
                            <span>›</span>
                            <span className="text-black/40">{produit.category_name}</span>
                        </>
                    )}
                    <span>›</span>
                    <span className="text-[#2c2c2c] font-semibold">{produit.name_fr}</span>
                </div>

                {/* ── DÉTAIL PRODUIT ────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* IMAGES */}
                        <div className="bg-[#ecfdf5] flex flex-col items-center justify-center p-8 gap-4 min-h-[400px]">
                            <div className="flex items-center justify-center w-full h-64">
                                {images[imageActive]?.url ? (
                                    <img
                                        src={images[imageActive].url}
                                        alt={produit.name_fr}
                                        className="max-h-full max-w-full object-contain rounded-xl"
                                    />
                                ) : (
                                    <span className="text-[100px]">🌿</span>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setImageActive(idx)}
                                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                                imageActive === idx ? 'border-[#2d5a27]' : 'border-gray-200'
                                            }`}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* INFOS */}
                        <div className="p-10 flex flex-col justify-center">

                            {/* BADGES + COEUR */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2 flex-wrap">
                                    {produit.supplier_name && (
                                        <Link
                                            to={`/producteurs/${produit.supplier_slug || encodeURIComponent(produit.supplier_name)}`}
                                            className="bg-[#d1fae5] text-[#2d5a27] text-xs font-bold px-3 py-1 rounded-full no-underline hover:bg-emerald-200 transition-colors"
                                        >
                                            {produit.supplier_name}
                                            {produit.is_certified_bio && ' 🌿'}
                                        </Link>
                                    )}
                                    {produit.category_name && (
                                        <span className="bg-[#f9f5f0] text-black/50 text-xs font-semibold px-3 py-1 rounded-full">
                                            {produit.category_name}
                                        </span>
                                    )}
                                    {produit.origin && (
                                        <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                                            📍 {produit.origin}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleFavori(produit)}
                                    className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                >
                                    {estFavori(produit.id)
                                        ? <FaHeart size={24} className="text-red-500" />
                                        : <FiHeart size={24} className="text-gray-400 hover:text-red-400" />
                                    }
                                </button>
                            </div>

                            {/* NOM */}
                            <h1 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">{produit.name_fr}</h1>
                            {produit.name_ar && (
                                <p className="text-lg text-black/40 mb-4 font-arabic" dir="rtl">{produit.name_ar}</p>
                            )}

                            {/* NOTE */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < Math.round(produit.rating_avg || 0) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                                    ))}
                                </div>
                                <span className="font-bold text-[#2c2c2c]">
                                    {produit.rating_avg ? parseFloat(produit.rating_avg).toFixed(1) : 'N/A'}
                                </span>
                                <span className="text-black/40 text-sm">/ 5.0</span>
                                {produit.rating_count > 0 && (
                                    <span className="text-black/40 text-sm">({produit.rating_count} avis)</span>
                                )}
                            </div>

                            {/* DESCRIPTION COURTE — intro seulement (3 lignes max) */}
                            <p className="text-black/60 text-sm leading-relaxed mb-6 line-clamp-3">
                                {produit.description_fr}
                            </p>

                            {/* VARIANTES */}
                            {produit.variants?.length > 1 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-black/60 mb-2">Choisir une variante :</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {produit.variants.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setVarianteActive(v)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                                                    varianteActive?.id === v.id
                                                        ? 'border-[#2d5a27] bg-[#2d5a27] text-white'
                                                        : 'border-gray-200 text-black/60 hover:border-emerald-400'
                                                }`}
                                            >
                                                {v.attributes?.map(a => a.value_fr).join(' / ') || `Variante ${v.id.slice(0, 4)}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PRIX */}
                            <div className="flex items-baseline gap-3 mb-4">
                                <div className="text-4xl font-black text-[#2d5a27]">
                                    {formatPrice(parseFloat(prix))}
                                </div>
                                {comparePrice && parseFloat(comparePrice) > parseFloat(prix) && (
                                    <div className="text-lg text-black/30 line-through">
                                        {formatPrice(parseFloat(comparePrice))}
                                    </div>
                                )}
                            </div>

                            {/* QUANTITÉ */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-sm font-semibold text-black/60">Quantité :</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantite(Math.max(1, quantite - 1))}
                                        className="w-9 h-9 rounded-full border-2 border-[#2d5a27] text-[#2d5a27] font-bold hover:bg-[#2d5a27] hover:text-white transition-colors duration-200 flex items-center justify-center"
                                    >−</button>
                                    <span className="font-bold text-[#2c2c2c] w-6 text-center text-lg">{quantite}</span>
                                    <button
                                        onClick={() => setQuantite(q => q + 1)}
                                        className="w-9 h-9 rounded-full border-2 border-[#2d5a27] text-[#2d5a27] font-bold hover:bg-[#2d5a27] hover:text-white transition-colors duration-200 flex items-center justify-center"
                                    >+</button>
                                </div>
                            </div>

                            {/* BOUTONS */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAjouter}
                                    disabled={!varianteActive}
                                    className={`flex-1 font-bold py-4 rounded-xl transition-all duration-300 text-base ${
                                        ajoute
                                            ? 'bg-green-500 text-white'
                                            : 'bg-[#2d5a27] hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {ajoute ? '✅ Ajouté au panier !' : 'Ajouter au panier'}
                                </button>
                                <Link
                                    to="/panier"
                                    className="border-2 border-[#2d5a27] text-[#2d5a27] hover:bg-[#2d5a27] hover:text-white font-bold px-6 py-4 rounded-xl transition-colors duration-300 no-underline text-center"
                                >
                                    🛒 Panier
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ══ ONGLETS ══════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-8 overflow-hidden">

                    {/* TABS */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {[
                            { id: 'description',     label: '📖 Description'     },
                            { id: 'utilisation',     label: '💡 Utilisation'     },
                            { id: 'composition',     label: '🧪 Composition'     },
                            { id: 'recommandations', label: '✅ Recommandations' },
                            { id: 'avis', label: `⭐ Avis (${produit.reviews?.length || 0})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setOngletActif(tab.id)}
                                className={`whitespace-nowrap px-6 py-4 text-sm font-bold transition-all duration-200 border-b-2 -mb-px ${
                                    ongletActif === tab.id
                                        ? 'border-[#2d5a27] text-[#2d5a27]'
                                        : 'border-transparent text-black/40 hover:text-black/70'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENU ONGLETS */}
                    <div className="p-8">

                        {/* ── Description ───────────────────────────────── */}
                        {ongletActif === 'description' && (
                            <div className="space-y-6">

                                <div>
                                    <h3 className="text-base font-bold text-[#2c2c2c] mb-3">À propos du produit</h3>
                                    <p className="text-sm text-black/70 leading-relaxed">{produit.description_fr}</p>
                                    {produit.description_ar && (
                                        <p className="text-sm text-black/50 mt-3 leading-relaxed text-right" dir="rtl">
                                            {produit.description_ar}
                                        </p>
                                    )}
                                </div>

                                {produit.ethical_info_fr && (
                                    <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-4">
                                        <p className="font-bold text-emerald-700 text-sm mb-1">🌱 Engagement éthique</p>
                                        <p className="text-emerald-700 text-sm leading-relaxed">{produit.ethical_info_fr}</p>
                                    </div>
                                )}

                                {produit.origin && (
                                    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 rounded-xl w-fit">
                                        <span className="text-base">📍</span>
                                        <div>
                                            <p className="text-xs text-amber-700/60 font-semibold uppercase tracking-wide leading-none mb-0.5">Origine</p>
                                            <p className="text-sm font-bold text-amber-800 leading-none">{produit.origin}</p>
                                        </div>
                                    </div>
                                )}

                                {produit.certifications?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold text-[#2c2c2c] mb-2">Certifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {produit.certifications.map((cert, i) => (
                                                <span key={i} className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200">
                                                    ✓ {cert.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* ── Utilisation ───────────────────────────────── */}
                        {ongletActif === 'utilisation' && (
                            <div className="space-y-6">

                                <h3 className="text-base font-bold text-[#2c2c2c]">Comment utiliser ce produit</h3>

                                {/* Mode d'emploi — depuis usage_fr */}
                                <div className="flex gap-4 items-start bg-[#f9f5f0] rounded-xl p-5">
                                    <span className="text-xl shrink-0">📋</span>
                                    <div>
                                        <p className="font-bold text-[#2c2c2c] text-sm mb-2">Mode d'emploi</p>
                                        <p className="text-sm text-black/60 leading-relaxed">
                                            {produit.usage_fr || "Consulter les indications du producteur sur l'emballage."}
                                        </p>
                                    </div>
                                </div>

                                {/* Version arabe */}
                                {produit.usage_ar && (
                                    <div className="flex gap-4 items-start bg-[#f9f5f0] rounded-xl p-5" dir="rtl">
                                        <span className="text-xl shrink-0">📋</span>
                                        <div>
                                            <p className="font-bold text-[#2c2c2c] text-sm mb-2">طريقة الاستخدام</p>
                                            <p className="text-sm text-black/60 leading-relaxed">{produit.usage_ar}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Précautions — depuis precautions_fr */}
                                {(produit.precautions_fr || produit.precautions_ar) && (
                                    <div className="border-t border-gray-100 pt-5">
                                        <p className="text-sm font-bold text-[#2c2c2c] mb-3">⚠️ Précautions</p>
                                        {produit.precautions_fr && (
                                            <p className="text-sm text-black/60 leading-relaxed">
                                                {produit.precautions_fr}
                                            </p>
                                        )}
                                        {produit.precautions_ar && (
                                            <p className="text-sm text-black/50 leading-relaxed mt-3 text-right" dir="rtl">
                                                {produit.precautions_ar}
                                            </p>
                                        )}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* ── Composition ───────────────────────────────── */}
                        {ongletActif === 'composition' && (
                            <div className="space-y-6">

                                {/* Ingrédients — depuis ingredients_fr */}
                                {(produit.ingredients_fr || produit.ingredients_ar) && (
                                    <div>
                                        <h3 className="text-base font-bold text-[#2c2c2c] mb-3">Ingrédients</h3>
                                        {produit.ingredients_fr && (
                                            <p className="text-sm text-black/70 leading-relaxed">{produit.ingredients_fr}</p>
                                        )}
                                        {produit.ingredients_ar && (
                                            <p className="text-sm text-black/50 leading-relaxed mt-3 text-right" dir="rtl">
                                                {produit.ingredients_ar}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Variantes */}
                                {produit.variants?.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-bold text-[#2c2c2c] mb-4">Variantes disponibles</h3>
                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#f9f5f0]">
                                                        <th className="text-left px-4 py-3 font-bold text-[#2c2c2c]">Format</th>
                                                        <th className="text-left px-4 py-3 font-bold text-[#2c2c2c]">SKU</th>
                                                        <th className="text-right px-4 py-3 font-bold text-[#2c2c2c]">Prix</th>
                                                        {produit.variants.some(v => v.compare_price) && (
                                                            <th className="text-right px-4 py-3 font-bold text-[#2c2c2c]">Prix barré</th>
                                                        )}
                                                        <th className="text-right px-4 py-3 font-bold text-[#2c2c2c]">Poids</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produit.variants.map((v, i) => (
                                                        <tr key={v.id} className={`border-t border-gray-50 ${i % 2 !== 0 ? 'bg-[#fafafa]' : ''}`}>
                                                            <td className="px-4 py-3 font-semibold text-[#2c2c2c]">
                                                                {v.attributes?.map(a => `${a.value_fr}${a.unit ? ' ' + a.unit : ''}`).join(' · ') || '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-black/40 font-mono text-xs">{v.sku || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-[#2d5a27]">{formatPrice(parseFloat(v.price))}</td>
                                                            {produit.variants.some(vv => vv.compare_price) && (
                                                                <td className="px-4 py-3 text-right text-black/30 line-through text-xs">
                                                                    {v.compare_price ? formatPrice(parseFloat(v.compare_price)) : '—'}
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3 text-right text-black/40 text-xs">
                                                                {v.weight_grams ? `${v.weight_grams} g` : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {!produit.ingredients_fr && !produit.ingredients_ar && produit.variants?.length === 0 && (
                                    <p className="text-black/40 text-sm">Aucune information de composition disponible.</p>
                                )}

                            </div>
                        )}

                        {/* ── Recommandations ───────────────────────────── */}
                        {ongletActif === 'recommandations' && (
                            <div className="space-y-5">
                                <h3 className="text-base font-bold text-[#2c2c2c]">Conseils & recommandations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { icon: '☀️', title: 'Conservation',  text: "Conserver dans un endroit sec, frais et à l'abri de la lumière directe du soleil." },
                                        { icon: '👶', title: 'Enfants',        text: 'Tenir hors de portée des enfants. Vérifier les recommandations spécifiques au produit.' },
                                        { icon: '⚖️', title: 'Dosage',         text: 'Ne pas dépasser la dose journalière recommandée. Suivre les indications du producteur.' },
                                        { icon: '🌿', title: 'Naturel 100%',   text: "Produit issu de l'agriculture biologique. Sans additifs ni conservateurs artificiels." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-3 items-start bg-[#f9f5f0] rounded-xl p-5">
                                            <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                                            <div>
                                                <p className="font-bold text-[#2c2c2c] text-sm mb-1">{item.title}</p>
                                                <p className="text-xs text-black/60 leading-relaxed">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Avis ──────────────────────────────────────── */}
                        {ongletActif === 'avis' && (
    <div className="space-y-6">

        {/* FORMULAIRE AJOUTER UN AVIS */}
        {user ? (
            <FormAvis productId={id} onSuccess={() => {
                getProductById(id).then(res => setProduit(res.data.product));
            }} />
        ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-semibold text-sm mb-2">
                    Connectez-vous pour laisser un avis
                </p>
                <Link to="/connexion" className="bg-[#2d5a27] text-white font-bold px-5 py-2 rounded-xl no-underline hover:bg-emerald-500 transition text-sm inline-block">
                    Se connecter
                </Link>
            </div>
        )}

        {/* LISTE DES AVIS */}
        {produit.reviews?.length > 0 ? (
            produit.reviews.map((avis, i) => (
                <div key={avis.review_id || i} className="bg-[#f9f5f0] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {avis.reviewer?.avatar ? (
                                <img src={avis.reviewer.avatar} alt={avis.reviewer.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#2d5a27] font-bold text-sm">
                                    {avis.reviewer?.name?.[0]}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-sm text-[#2c2c2c]">{avis.reviewer?.name}</p>
                                {avis.is_verified && (
                                    <span className="text-xs text-[#2d5a27] font-semibold">✓ Achat vérifié</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex gap-0.5 mb-1 justify-end">
                                {[...Array(5)].map((_, j) => (
                                    <span key={j} className={j < avis.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                                ))}
                            </div>
                            <span className="text-xs text-black/40">
                                {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-black/60 leading-relaxed">{avis.comment}</p>
                </div>
            ))
        ) : (
            <div className="text-center py-10">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-bold text-[#2c2c2c] mb-1">Aucun avis pour le moment</p>
                <p className="text-sm text-black/40">Soyez le premier à donner votre avis !</p>
            </div>
        )}
    </div>
)}

                    </div>
                </div>

                {/* ── FOURNISSEUR ───────────────────────────────────── */}
                {produit.supplier_name && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-8 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs text-black/40 font-semibold uppercase tracking-wider mb-1">Producteur</p>
                            <h3 className="font-bold text-[#2c2c2c]">
                                {produit.supplier_name}
                                {produit.is_certified_bio && (
                                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">🌿 Bio certifié</span>
                                )}
                            </h3>

                            {produit.supplier_description && (
                                <p className="text-sm text-black/60 mt-2 max-w-lg">{produit.supplier_description}</p>
                            )}
                        </div>
                        <Link
                            to={`/producteurs/${produit.supplier_slug}`}
                            className="bg-[#2d5a27] text-white font-bold px-5 py-2.5 rounded-xl no-underline hover:bg-emerald-500 transition-colors text-sm shrink-0"
                        >
                            Voir le producteur →
                        </Link>
                    </div>
                )}

                {/* ── PRODUITS SIMILAIRES ───────────────────────────── */}
                {similaires.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-6">Vous aimerez aussi</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {similaires.map(p => (
                                <Link
                                    key={p.id}
                                    to={`/produits/${p.id}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 no-underline"
                                >
                                    <div className="h-32 bg-[#ecfdf5] flex items-center justify-center">
                                        {p.images?.[0]?.url ? (
                                            <img src={p.images[0].url} alt={p.name_fr} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-5xl">🌿</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-xs font-bold text-[#2c2c2c] mb-2 line-clamp-2">{p.name_fr}</h3>
                                        <span className="text-sm font-extrabold text-[#2d5a27]">
                                            {p.min_price ? formatPrice(parseFloat(p.min_price)) : 'Prix N/A'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProductDetail;