import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { getAllProducts } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import formatPrice from '../../utils/formatPrice';
import { BsStars } from "react-icons/bs";
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const Products = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleFavori, estFavori } = useWishlist();

    const [produits, setProduits]       = useState([]);
    const [categories, setCategories]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [totalPages, setTotalPages]   = useState(1);
    const [page, setPage]               = useState(1);

    // Filtres
    const [tri, setTri]                 = useState('defaut');
    const [prixMin, setPrixMin]         = useState('');
    const [prixMax, setPrixMax]         = useState('');
    const [noteMin, setNoteMin]         = useState('');
    const [categorieId, setCategorieId] = useState('');

   useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category_id');
    
    const catId = categoryFromUrl || categorieId;
    
    if (categoryFromUrl && categoryFromUrl !== categorieId) {
        setCategorieId(categoryFromUrl);
        return;
    }

    const fetchProduits = async () => {
        setLoading(true);
        try {
            const res = await getAllProducts({
                category_id: catId     || undefined,
                min_price:   prixMin   || undefined,
                max_price:   prixMax   || undefined,
                min_rating:  noteMin   || undefined,
                page,
            });
            setProduits(res.data.products);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchProduits();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [location.search, categorieId, prixMin, prixMax, noteMin, page]);

    useEffect(() => {
        getAllCategories()
            .then(res => setCategories(res.data.categories))
            .catch(err => console.error(err));
    }, []);

    
    const produitsTries = [...produits].sort((a, b) => {
        if (tri === 'prix-asc')  return (a.min_price || 0) - (b.min_price || 0);
        if (tri === 'prix-desc') return (b.min_price || 0) - (a.min_price || 0);
        if (tri === 'note')      return (b.rating_avg || 0) - (a.rating_avg || 0);
        return 0;
    });

    const resetFiltres = () => {
        setTri('defaut');
        setPrixMin('');
        setPrixMax('');
        setNoteMin('');
        setCategorieId('');
        setPage(1);
    };

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-1">
                            Tous les Produits
                        </h1>
                        <p className="text-black/50">
                            {produits.length} produit{produits.length > 1 ? 's' : ''} trouvé{produits.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-full shadow-lg transition-all duration-300 group">
                        <BsStars size={18} className="group-hover:animate-spin" />
                        Recherche IA
                    </button>
                </div>

                <div className="flex gap-6">

                    {/* SIDEBAR FILTRES */}
                    <div className="w-64 shrink-0">
                        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-[#2c2c2c] text-base">Filtres</h3>
                                <button onClick={resetFiltres} className="text-xs text-emerald-600 hover:underline font-semibold">
                                    Réinitialiser
                                </button>
                            </div>

                            {/* TRI */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Trier par</h4>
                                <select
                                    value={tri}
                                    onChange={e => setTri(e.target.value)}
                                    className="w-full bg-[#f9f5f0] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2c2c2c] outline-none cursor-pointer"
                                >
                                    <option value="defaut">Par défaut</option>
                                    <option value="prix-asc">Prix croissant</option>
                                    <option value="prix-desc">Prix décroissant</option>
                                    <option value="note">Meilleures notes</option>
                                </select>
                            </div>

                            {/* PRIX */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Prix (DT)</h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={prixMin}
                                        onChange={e => setPrixMin(e.target.value)}
                                        className="w-full bg-[#f9f5f0] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2c2c2c] placeholder-black/30"
                                    />
                                    <span className="text-black/30 font-bold">—</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={prixMax}
                                        onChange={e => setPrixMax(e.target.value)}
                                        className="w-full bg-[#f9f5f0] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2c2c2c] placeholder-black/30"
                                    />
                                </div>
                            </div>

                            {/* NOTE */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Note minimale</h4>
                                <div className="flex flex-col gap-2">
                                    {[0, 3, 4, 4.5, 5].map(note => (
                                        <button
                                            key={note}
                                            onClick={() => setNoteMin(note === 0 ? '' : note)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                                                (note === 0 && noteMin === '') || noteMin === note
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-emerald-600'
                                            }`}
                                        >
                                            {note === 0 ? 'Toutes les notes' : `${'⭐'.repeat(Math.floor(note))} ${note}+`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CATÉGORIES */}
                            <div>
                                <h4 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Catégories</h4>
                                <div className="flex flex-col gap-1">

                                    {/* Toutes */}
                                    <button
                                        onClick={() => { setCategorieId(''); setPage(1); }}
                                        className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                                            categorieId === ''
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-emerald-600'
                                        }`}
                                    >
                                        Toutes les catégories
                                    </button>

                                    {/* Catégories avec sous-catégories au hover */}
                                    {categories.map(cat => (
                                        <div key={cat.id} className="group relative">

                                            {/* Bouton catégorie principale */}
                                            <button
                                                onClick={() => { setCategorieId(cat.id); setPage(1); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 flex items-center justify-between ${
                                                    categorieId === cat.id
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-[#f9f5f0] text-black/60 hover:bg-[#d1fae5] hover:text-emerald-600'
                                                }`}
                                            >
                                                <span>{cat.name_fr}</span>
                                                {cat.children?.length > 0 && (
                                                    <span className={`text-xs transition-colors duration-200 ${
                                                        categorieId === cat.id ? 'text-white/70' : 'text-black/30 group-hover:text-emerald-500'
                                                    }`}>
                                                        {cat.children.length} ›
                                                    </span>
                                                )}
                                            </button>

                                            {/* Sous-catégories — apparaissent au hover */}
                                            {cat.children?.length > 0 && (
                                                <div className="overflow-hidden max-h-0 group-hover:max-h-96 transition-all duration-300 ease-in-out">
                                                    <div className="flex flex-col gap-0.5 pt-1 pl-3">
                                                        {cat.children.map(sub => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => { setCategorieId(sub.id); setPage(1); }}
                                                                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center gap-2 ${
                                                                    categorieId === sub.id
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'text-black/50 hover:bg-[#d1fae5] hover:text-emerald-600'
                                                                }`}
                                                            >
                                                                <span className="text-black/20">└</span>
                                                                {sub.name_fr}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRILLE PRODUITS */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4 animate-spin">🌿</div>
                                <p className="text-black/50 font-semibold">Chargement...</p>
                            </div>
                        ) : produitsTries.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucun produit trouvé</h3>
                                <p className="text-black/50 mb-6">Essayez avec d'autres filtres</p>
                                <button
                                    onClick={resetFiltres}
                                    className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-full hover:bg-emerald-500 transition-colors duration-300"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {produitsTries.map(produit => (
                                        <div
                                            key={produit.id}
                                            className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                                        >
                                            {/* IMAGE */}
                                            {/* ✅ Fixed: uses images[0].url (not thumbnail) */}
                                            <Link to={`/produits/${produit.id}`} className="no-underline">
                                                <div className="relative h-44 bg-[#ecfdf5] flex items-center justify-center cursor-pointer">
                                                    {produit.images?.[0]?.url ? (
                                                        <img
                                                            src={produit.images[0].url}
                                                            alt={produit.name_fr}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <span className="text-5xl">🌿</span>
                                                            <span className="text-xs text-black/30 font-semibold">Pas d'image</span>
                                                        </div>
                                                    )}
                                                    {/* ✅ Fixed: uses rating_avg */}
                                                    <span className="absolute bottom-3 right-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                                                        ⭐ {produit.rating_avg ? parseFloat(produit.rating_avg).toFixed(1) : 'N/A'}
                                                    </span>
                                                    {produit.is_featured && (
                                                        <span className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                            ✨ Coup de cœur
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* INFOS */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <Link to={`/produits/${produit.id}`} className="no-underline flex-1">
                                                        {/* ✅ Fixed: uses name_fr */}
                                                        <h3 className="text-sm font-bold text-[#2c2c2c] hover:text-emerald-600 transition-colors duration-200">
                                                            {produit.name_fr}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleFavori(produit)}
                                                        className="ml-2 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-200 shrink-0"
                                                    >
                                                        {estFavori(produit.id)
                                                            ? <FaHeart size={16} className="text-red-500" />
                                                            : <FiHeart size={16} className="text-gray-400 hover:text-red-400" />
                                                        }
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    {produit.supplier_name && (
                                                        <Link
                                                            to={`/producteurs/${produit.supplier_slug || encodeURIComponent(produit.supplier_name)}`}
                                                            className="bg-[#d1fae5] text-emerald-600 text-xs font-bold px-3 py-1 rounded-full no-underline hover:bg-emerald-200 transition-colors duration-200"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            {produit.supplier_name}
                                                            {produit.is_certified_bio && ' 🌿'}
                                                        </Link>
                                                    )}
                                                    {produit.category_name && (
                                                        <span className="text-xs text-black/50">{produit.category_name}</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    {/* ✅ Fixed: uses min_price */}
                                                    <span className="text-lg font-extrabold text-emerald-600">
                                                        {produit.min_price
                                                            ? formatPrice(parseFloat(produit.min_price))
                                                            : 'Prix N/A'}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/produits/${produit.id}`)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300"
                                                    >
                                                        Voir le produit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-white text-black/50 hover:bg-emerald-100'
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
};

export default Products;