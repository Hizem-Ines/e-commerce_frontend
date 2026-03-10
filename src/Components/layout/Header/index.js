import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiHeart, FiLogOut, FiSettings } from "react-icons/fi";
import { BsFillBasket3Fill } from "react-icons/bs";
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import formatPrice from '../../../utils/formatPrice';
import { useAuth } from '../../../context/authContext';

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
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fermer le dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-emerald-600">
            <header className="container mx-auto px-4">
                <div className="flex items-center py-3 gap-4">

                    <Logo />

                    <div className="flex-1 flex items-center bg-white/15 border border-white/30 rounded-full px-4 py-2 gap-2">
                        <input
                            type="text"
                            placeholder="Rechercher un produit, producteur..."
                            className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                        />
                        <button className="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition">
                            🔍
                        </button>
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
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
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