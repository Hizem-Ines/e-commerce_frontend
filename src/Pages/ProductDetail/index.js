import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById, getAllProducts } from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { ajouterAuPanier } = useCart();
    const { toggleFavori, estFavori } = useWishlist();

    const [quantite, setQuantite]           = useState(1);
    const [ajoute, setAjoute]               = useState(false);
    const [produit, setProduit]             = useState(null);
    const [similaires, setSimilaires]       = useState([]);
    const [loading, setLoading]             = useState(true);
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
                // ✅ select cheapest variant by default
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
            // ✅ Fixed: uses name_fr
            product_name: produit.name_fr,
            price:        varianteActive.price,
            // ✅ Fixed: uses produit.images (not varianteActive.images)
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
                <Link to="/produits" className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-full no-underline hover:bg-emerald-500 transition-colors duration-300">
                    Voir tous les produits
                </Link>
            </div>
        );
    }

    // ✅ Fixed: use produit.images (images are on the product, not variants)
    const images = produit.images || [];
    const prix   = varianteActive?.price || produit.variants?.[0]?.price || 0;
    const comparePrice = varianteActive?.compare_price;

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* FIL D'ARIANE */}
                <div className="flex items-center gap-2 text-sm text-black/50 mb-8 flex-wrap">
                    <Link to="/" className="hover:text-emerald-600 no-underline transition-colors duration-200">Accueil</Link>
                    <span>›</span>
                    <Link to="/produits" className="hover:text-emerald-600 no-underline transition-colors duration-200">Produits</Link>
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
                    {/* ✅ Fixed: uses name_fr */}
                    <span className="text-[#2c2c2c] font-semibold">{produit.name_fr}</span>
                </div>

                {/* DÉTAIL PRODUIT */}
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
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setImageActive(idx)}
                                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                                imageActive === idx ? 'border-emerald-600' : 'border-gray-200'
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
                                            className="bg-[#d1fae5] text-emerald-600 text-xs font-bold px-3 py-1 rounded-full no-underline hover:bg-emerald-200 transition-colors"
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
                            {/* ✅ Fixed: uses name_fr */}
                            <h1 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-1">{produit.name_fr}</h1>
                            {produit.name_ar && (
                                <p className="text-lg text-black/40 mb-4 font-arabic" dir="rtl">{produit.name_ar}</p>
                            )}

                            {/* NOTE */}
                            {/* ✅ Fixed: uses rating_avg + rating_count */}
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

                            {/* DESCRIPTION COURTE */}
                            <p className="text-black/60 text-sm leading-relaxed mb-6">{produit.description_fr}</p>

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
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                        : 'border-gray-200 text-black/60 hover:border-emerald-400'
                                                }`}
                                            >
                                                {/* ✅ Fixed: uses value_fr from attributes */}
                                                {v.attributes?.map(a => a.value_fr).join(' / ') || `Variante ${v.id.slice(0, 4)}`}

                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PRIX */}
                            <div className="flex items-baseline gap-3 mb-4">
                                <div className="text-4xl font-black text-emerald-600">
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
                                        className="w-9 h-9 rounded-full border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
                                    >−</button>
                                    <span className="font-bold text-[#2c2c2c] w-6 text-center text-lg">{quantite}</span>
                                    <button
                                        onClick={() => setQuantite(q => q + 1)}
                                        className="w-9 h-9 rounded-full border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
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
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {ajoute ? '✅ Ajouté au panier !' : 'Ajouter au panier'}
                                </button>
                                <Link
                                    to="/panier"
                                    className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold px-6 py-4 rounded-xl transition-colors duration-300 no-underline text-center"
                                >
                                    🛒 Panier
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ══ ONGLETS DESCRIPTION ══════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-8 overflow-hidden">

                    {/* TABS */}
                    <div className="flex border-b border-gray-100">
                        {[
                            { id: 'description', label: 'Description' },
                            { id: 'composition', label: 'Composition' },
                            { id: 'utilisation', label: 'Utilisation' },
                            { id: 'recommandations', label: 'Recommandations' },
                            ...(produit.reviews?.length > 0
                                ? [{ id: 'avis', label: `Avis (${produit.reviews.length})` }]
                                : []),
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setOngletActif(tab.id)}
                                className={`px-6 py-4 text-sm font-bold transition-all duration-200 border-b-2 -mb-px ${
                                    ongletActif === tab.id
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-black/40 hover:text-black/70'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENU ONGLETS */}
                    <div className="p-8">

                        {/* ── Description ───────────────────────── */}
                        {ongletActif === 'description' && (
                            <div className="prose prose-sm max-w-none text-black/70 leading-relaxed">
                                <p className="text-base mb-4">{produit.description_fr}</p>
                                {produit.description_ar && (
                                    <p className="text-base text-black/50 mt-4 text-right" dir="rtl">
                                        {produit.description_ar}
                                    </p>
                                )}
                                {produit.ethical_info_fr && (
                                    <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-4">
                                        <p className="font-bold text-emerald-700 text-sm mb-1">🌱 Engagement éthique</p>
                                        <p className="text-emerald-700 text-sm">{produit.ethical_info_fr}</p>
                                    </div>
                                )}
                                {produit.certifications?.length > 0 && (
                                    <div className="mt-6">
                                        <p className="font-bold text-[#2c2c2c] text-sm mb-3">Certifications :</p>
                                        <div className="flex flex-wrap gap-2">
                                            {produit.certifications.map((cert, i) => (
                                                <span key={i} className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200">
                                                    ✓ {cert.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {produit.origin && (
                                    <div className="mt-6 flex items-center gap-2 text-sm text-black/50">
                                        <span>📍</span>
                                        <span><strong className="text-[#2c2c2c]">Origine :</strong> {produit.origin}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Composition ───────────────────────── */}
                        {ongletActif === 'composition' && (
                            <div>
                                {produit.variants?.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="font-bold text-[#2c2c2c] mb-4">Variantes disponibles :</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#f9f5f0]">
                                                        <th className="text-left px-4 py-3 font-bold text-[#2c2c2c] rounded-l-xl">Format</th>
                                                        <th className="text-left px-4 py-3 font-bold text-[#2c2c2c]">SKU</th>
                                                        <th className="text-right px-4 py-3 font-bold text-[#2c2c2c]">Prix</th>
                                                        {produit.variants.some(v => v.compare_price) && (
                                                            <th className="text-right px-4 py-3 font-bold text-[#2c2c2c]">Prix barré</th>
                                                        )}
                                                        <th className="text-right px-4 py-3 font-bold text-[#2c2c2c] rounded-r-xl">Poids livraison</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produit.variants.map((v, i) => (
                                                        <tr key={v.id} className={i % 2 === 0 ? '' : 'bg-[#fafafa]'}>
                                                            <td className="px-4 py-3 font-semibold text-[#2c2c2c]">
                                                                {v.attributes?.map(a => `${a.value_fr}${a.unit ? ' ' + a.unit : ''}`).join(' · ') || '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-black/40 font-mono text-xs">{v.sku || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatPrice(parseFloat(v.price))}</td>
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
                                ) : (
                                    <p className="text-black/40 text-sm">Aucune information de composition disponible.</p>
                                )}
                            </div>
                        )}

                        {/* ── Utilisation ───────────────────────── */}
                        {ongletActif === 'utilisation' && (
                            <div className="text-sm text-black/70 leading-relaxed space-y-4">
                                {produit.ethical_info_fr ? (
                                    <>
                                        <div className="flex gap-3 items-start bg-[#f9f5f0] rounded-xl p-4">
                                            <span className="text-2xl shrink-0">📋</span>
                                            <div>
                                                <p className="font-bold text-[#2c2c2c] mb-2">Mode d'emploi</p>
                                                <p>{produit.ethical_info_fr}</p>
                                            </div>
                                        </div>
                                        {produit.ethical_info_ar && (
                                            <div className="flex gap-3 items-start bg-[#f9f5f0] rounded-xl p-4" dir="rtl">
                                                <span className="text-2xl shrink-0">📋</span>
                                                <div>
                                                    <p className="font-bold text-[#2c2c2c] mb-2">طريقة الاستخدام</p>
                                                    <p>{produit.ethical_info_ar}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex gap-3 items-start bg-[#f9f5f0] rounded-xl p-4">
                                        <span className="text-2xl shrink-0">💡</span>
                                        <div>
                                            <p className="font-bold text-[#2c2c2c] mb-2">Conseils d'utilisation généraux</p>
                                            <ul className="space-y-2 text-black/60">
                                                <li>• Conserver dans un endroit sec et à l'abri de la lumière</li>
                                                <li>• Tenir hors de portée des enfants</li>
                                                <li>• Vérifier la date de péremption avant utilisation</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Recommandations ───────────────────── */}
                        {ongletActif === 'recommandations' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {[
                                    { icon: '☀️', title: 'Conservation', text: 'Conserver dans un endroit sec, frais et à l\'abri de la lumière directe du soleil.' },
                                    { icon: '👶', title: 'Enfants', text: 'Tenir hors de portée des enfants. Vérifier les recommandations spécifiques au produit.' },
                                    { icon: '⚖️', title: 'Dosage', text: 'Ne pas dépasser la dose journalière recommandée. Suivre les indications du producteur.' },
                                    { icon: '🌿', title: 'Naturel 100%', text: 'Ce produit est issu de l\'agriculture biologique. Sans additifs ni conservateurs artificiels.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start bg-[#f9f5f0] rounded-xl p-4">
                                        <span className="text-2xl shrink-0">{item.icon}</span>
                                        <div>
                                            <p className="font-bold text-[#2c2c2c] mb-1">{item.title}</p>
                                            <p className="text-black/60 leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Avis ──────────────────────────────── */}
                        {ongletActif === 'avis' && (
                            <div className="space-y-4">
                                {produit.reviews?.length > 0 ? (
                                    produit.reviews.map(avis => (
                                        <div key={avis.review_id} className="bg-[#f9f5f0] rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {avis.reviewer?.avatar ? (
                                                        <img src={avis.reviewer.avatar} alt={avis.reviewer.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                            {avis.reviewer?.name?.[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-sm text-[#2c2c2c]">{avis.reviewer?.name}</p>
                                                        {avis.is_verified && (
                                                            <span className="text-xs text-emerald-600 font-semibold">✓ Achat vérifié</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex gap-0.5 mb-1 justify-end">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={i < avis.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-black/40">
                                                        {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                            {avis.title && <p className="font-bold text-sm text-[#2c2c2c] mb-1">{avis.title}</p>}
                                            <p className="text-sm text-black/60 leading-relaxed">{avis.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-4xl mb-3">💬</p>
                                        <p className="text-black/40 font-semibold">Aucun avis pour ce produit</p>
                                        <p className="text-black/30 text-sm mt-1">Soyez le premier à donner votre avis !</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOURNISSEUR */}
                {produit.supplier_name && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-8 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-black/40 font-semibold uppercase tracking-wider mb-1">Producteur</p>
                            <h3 className="font-bold text-[#2c2c2c]">
                                {produit.supplier_name}
                                {produit.is_certified_bio && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">🌿 Bio certifié</span>}
                            </h3>
                            {produit.supplier_region && <p className="text-xs text-black/40 mt-0.5">📍 {produit.supplier_region}</p>}
                            {produit.supplier_description && <p className="text-sm text-black/60 mt-2 max-w-lg">{produit.supplier_description}</p>}
                        </div>
                        <Link
                            to={`/producteurs/${produit.supplier_slug}`}
                            className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl no-underline hover:bg-emerald-500 transition-colors text-sm shrink-0"
                        >
                            Voir le producteur →
                        </Link>
                    </div>
                )}

                {/* PRODUITS SIMILAIRES */}
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
                                        {/* ✅ Fixed: uses images (not thumbnail) */}
                                        {p.images?.[0]?.url ? (
                                            <img src={p.images[0].url} alt={p.name_fr} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-5xl">🌿</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        {/* ✅ Fixed: uses name_fr */}
                                        <h3 className="text-xs font-bold text-[#2c2c2c] mb-2 line-clamp-2">{p.name_fr}</h3>
                                        {/* ✅ Fixed: uses min_price */}
                                        <span className="text-sm font-extrabold text-emerald-600">
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