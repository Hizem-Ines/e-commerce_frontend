import { Link, useLocation } from 'react-router-dom';
import { FaHome } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
import { GiTalk } from "react-icons/gi";
import { RiDiscountPercentLine } from "react-icons/ri";
import { LuChefHat } from "react-icons/lu";

const navLinks = [
    { label: 'Accueil',          url: '/',         icone: <FaHome size={16} /> },
    { label: 'Tous les Produits',url: '/produits',  icone: <AiFillProduct size={16} /> },
    { label: 'Recettes',         url: '/recettes',  icone: <LuChefHat size={16} /> },
    { label: 'Offres',           url: '/offres',    icone: <RiDiscountPercentLine size={16} /> },
    { label: 'FAQ',              url: '/faq',       icone: <GiTalk size={16} /> },
];

const Navigation = () => {
    const location = useLocation();

    const estActif = (lien) => {
        if (lien.url === '/') return location.pathname === '/';
        return location.pathname === lien.url || location.pathname.startsWith(lien.url + '/');
    };

    return (
        <nav className="bg-white border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center space-x-10 py-4">
                    {navLinks.map((lien) => (
                        <Link
                            key={lien.label}
                            to={lien.url}
                            className={`flex items-center gap-2 text-base font-semibold tracking-wide pb-2 border-b-2 transition-all duration-200 no-underline ${
                                estActif(lien)
                                    ? 'text-[#2d5a27] border-[#2d5a27]'
                                    : 'text-gray-500 border-transparent hover:text-[#2d5a27] hover:border-[#2d5a27]'
                            }`}
                        >
                            {lien.icone}
                            {lien.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;