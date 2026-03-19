import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiHeart, FiLogOut, FiSettings } from "react-icons/fi";
import { BsFillBasket3Fill } from "react-icons/bs";
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import formatPrice from '../../../utils/formatPrice';
import { useAuth } from '../../../context/authContext';
import { getAllProducts } from '../../../services/productService';

const Logo = () => (
    <Link to="/" className="shrink-0 no-underline flex items-center gap-2">
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 16 Q14 8 21 8 Q28 8 28 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <rect x="8" y="16" width="26" height="20" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
            <path d="M21 20 L25 24 L21 28 L17 24 Z" fill="white" fillOpacity="0.6"/>
            <circle cx="12" cy="22" r="1.2" fill="white" fillOpacity="0.7"/>
            <circle cx="30" cy="22" r="1.2" fill="white" fillOpacity="0.7"/>
            <circle cx="12" cy="28" r="1.2" fill="white" fillOpacity="0.7"/>
            <circle cx="30" cy="28" r="1.2" fill="white" fillOpacity="0.7"/>
            <path d="M16 16 L26 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="flex flex-col leading-none">
            <span className="text-white font-black text-2xl tracking-widest font-serif">GOFFA</span>
            <span className="text-white/60 text-xs tracking-wider">artisanat tunisien</span>
        </div>
    </Link>
);

const Header = () => {
    const { totalArticles, totalPrix } = useCart();
    const { totalFavoris } = useWishlist();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target))
                setSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 2) {
            setSuggestions([]);
            setSearchOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await getAllProducts({ search: value, page: 1 });
                setSuggestions(res.data.products.slice(0, 6));
                setSearchOpen(true);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (search.trim()) {
            setSearchOpen(false);
            navigate(`/produits?search=${encodeURIComponent(search.trim())}`);
        }
    };

    const handleSuggestionClick = (produit) => {
        setSearch('');
        setSuggestions([]);
        setSearchOpen(false);
        navigate(`/produits/${produit.id}`);
    };

    return (
        <div className="bg-emerald-600">
            <header className="container mx-auto px-4">
                <div className="flex items-center py-3 gap-4">

                    <Logo />

                    {/* BARRE DE RECHERCHE */}
                    <div className="flex-1 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <div className="flex items-center bg-white/15 border border-white/30 rounded-full px-4 py-2 gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearchChange}
                                    onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
                                    placeholder="Rechercher un produit, producteur..."
                                    className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                                />
                                <button
                                    type="submit"
                                    className="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition shrink-0"
                                >
                                    {searchLoading ? (
                                        <span className="animate-spin text-xs">🌿</span>
                                    ) : '🔍'}
                                </button>
                            </div>
                        </form>

                        {/* DROPDOWN SUGGESTIONS */}
                        {searchOpen && suggestions.length > 0 && (
                            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-xs font-bold text-black/40">
                                        {suggestions.length} résultat{suggestions.length > 1 ? 's' : ''} pour "{search}"
                                    </p>
                                </div>
                                {suggestions.map((produit) => (
                                    <button
                                        key={produit.id}
                                        onClick={() => handleSuggestionClick(produit)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition text-left border-b border-gray-50 last:border-0"
                                    >
                                        {/* IMAGE */}
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                                            {produit.thumbnail?.[0]?.url ? (
                                                <img
                                                    src={produit.thumbnail[0].url}
                                                    alt={produit.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg">🌿</span>
                                            )}
                                        </div>
                                        {/* INFOS */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#2c2c2c] truncate">
                                                {produit.name}
                                            </p>
                                            <p className="text-xs text-black/40">
                                                {produit.category_name}
                                                {produit.supplier_name ? ` · ${produit.supplier_name}` : ''}
                                            </p>
                                        </div>
                                        {/* PRIX */}
                                        <span className="text-sm font-extrabold text-emerald-600 shrink-0">
                                            {produit.min_price
                                                ? `${parseFloat(produit.min_price).toFixed(2)} DT`
                                                : 'N/A'}
                                        </span>
                                    </button>
                                ))}

                                {/* VOIR TOUS */}
                                <button
                                    onClick={() => handleSearchSubmit()}
                                    className="w-full px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition text-center border-t border-gray-100"
                                >
                                    Voir tous les résultats pour "{search}" →
                                </button>
                            </div>
                        )}

                        {/* AUCUN RÉSULTAT */}
                        {searchOpen && suggestions.length === 0 && search.length >= 2 && !searchLoading && (
                            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-6 text-center">
                                <p className="text-2xl mb-2">🔍</p>
                                <p className="text-sm font-bold text-[#2c2c2c]">Aucun produit trouvé</p>
                                <p className="text-xs text-black/40">Essayez avec d'autres mots clés</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">

                        {/* FAVORIS */}
                        <Link to="/favoris" className="relative no-underline">
                            <button className="border border-white/30 rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition group">
                                <FiHeart size={20} className="group-hover:text-red-300 transition" />
                            </button>
                            {totalFavoris > 0 && (
                                <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {totalFavoris}
                                </span>
                            )}
                        </Link>

                        {/* COMPTE */}
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 border border-white/30 rounded-full px-3 py-2 text-white hover:bg-white/10 transition"
                                >
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black overflow-hidden">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            user.name?.[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold hidden md:block">{user.name}</span>
                                    <span className="text-xs opacity-60">{dropdownOpen ? '▲' : '▼'}</span>
                                </button>

                                {/* DROPDOWN */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 w-48 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-bold text-sm text-[#2c2c2c]">{user.name}</p>
                                            <p className="text-xs text-black/40 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            to="/profil"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#2c2c2c] hover:bg-emerald-50 hover:text-emerald-600 transition no-underline"
                                        >
                                            <FiSettings size={15} /> Mon profil
                                        </Link>
                                        {user.role === 'admin' && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-sm text-[#2c2c2c] hover:bg-emerald-50 hover:text-emerald-600 transition no-underline"
                                            >
                                                👑 Dashboard Admin
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { logout(); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition border-t border-gray-100"
                                        >
                                            <FiLogOut size={15} /> Déconnexion
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/connexion"
                                className="border border-white/30 rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition no-underline"
                            >
                                <FiUser size={20} />
                            </Link>
                        )}

                        {/* PANIER */}
                        <Link to="/panier" className="flex items-center gap-2 no-underline">
                            <span className="text-white font-bold text-sm">
                                {formatPrice(totalPrix)}
                            </span>
                            <div className="relative">
                                <button className="border border-white/30 bg-white/15 rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 transition">
                                    <BsFillBasket3Fill size={18} />
                                </button>
                                {totalArticles > 0 && (
                                    <span className="absolute -top-1.5 -right-1 bg-[#c8872a] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {totalArticles}
                                    </span>
                                )}
                            </div>
                        </Link>

                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;