import { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { Navigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiList, FiPercent, FiMenu, FiX, FiMail } from 'react-icons/fi';
import { GiCookingGlove } from "react-icons/gi";
import { FaClipboardQuestion } from "react-icons/fa6";

import AdminStats          from './sections/AdminStats';
import AdminProduits       from './sections/AdminProduits';
import AdminCommandes      from './sections/AdminCommandes';
import AdminUtilisateurs   from './sections/AdminUtilisateurs';
import AdminProducteurs    from './sections/AdminProducteurs';
import AdminCategories     from './sections/AdminCategories';
import AdminPromotions     from './sections/AdminPromotions';
import AdminRecipes        from './sections/AdminRecipes';
import AdminEmailCampaigns from './sections/AdminEmailCampaigns';
import AdminFaq            from './sections/AdminFaq';

const SECTIONS = [
    { id: 'stats',        label: 'Tableau de bord',  icone: <FiGrid size={18} /> },
    { id: 'produits',     label: 'Produits',          icone: <FiPackage size={18} /> },
    { id: 'commandes',    label: 'Commandes',         icone: <FiShoppingBag size={18} /> },
    { id: 'utilisateurs', label: 'Utilisateurs',      icone: <FiUsers size={18} /> },
    { id: 'producteurs',  label: 'Producteurs',       icone: <FiList size={18} /> },
    { id: 'recipes',      label: 'Recettes',          icone: <GiCookingGlove size={18} /> },
    { id: 'categories',   label: 'Catégories',        icone: <FiTag size={18} /> },
    { id: 'promotions',   label: 'Promotions',        icone: <FiPercent size={18} /> },
    { id: 'campaigns',    label: 'Campagnes email',   icone: <FiMail size={18} /> },
    { id: 'faq',          label: 'Faq',               icone: <FaClipboardQuestion size={18} /> },
];

const Admin = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('stats');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (!user) return <Navigate to="/connexion" />;
    if (user.role !== 'admin') return <Navigate to="/" />;

    const renderSection = () => {
        switch (activeSection) {
            case 'stats':        return <AdminStats />;
            case 'produits':     return <AdminProduits />;
            case 'commandes':    return <AdminCommandes />;
            case 'utilisateurs': return <AdminUtilisateurs />;
            case 'producteurs':  return <AdminProducteurs />;
            case 'categories':   return <AdminCategories />;
            case 'promotions':   return <AdminPromotions />;
            case 'recipes':      return <AdminRecipes />;
            case 'campaigns':    return <AdminEmailCampaigns />;
            case 'faq':          return <AdminFaq />;
            default:             return <AdminStats />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f9f5f0]">

            {/* SIDEBAR */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-emerald-900 text-white transition-all duration-300 shrink-0 flex flex-col`}>

                {/* LOGO */}
                <div className="flex items-center justify-between p-4 border-b border-emerald-700">
                    {sidebarOpen && (
                        <div>
                            <h1 className="text-lg font-black tracking-widest font-serif">GOFFA</h1>
                            <p className="text-[#4a8c42] text-xs">Admin Dashboard</p>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-emerald-700 rounded-xl transition"
                    >
                        {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
                    </button>
                </div>

                {/* NAV */}
                <nav className="flex-1 p-3 space-y-1">
                    {SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left ${
                                activeSection === section.id
                                    ? 'bg-[#2d5a27] text-white'
                                    : 'text-#b6eac7 hover:bg-emerald-800'
                            }`}
                        >
                            <span className="shrink-0">{section.icone}</span>
                            {sidebarOpen && <span className="text-sm font-semibold">{section.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* USER */}
                {sidebarOpen && (
                    <div className="p-4 border-t border-emerald-700">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2d5a27] flex items-center justify-center text-sm font-black">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{user.name}</p>
                                <p className="text-xs text-[#4a8c42]">Administrateur</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENU */}
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    {renderSection()}
                </div>
            </div>
        </div>
    );
};

export default Admin;