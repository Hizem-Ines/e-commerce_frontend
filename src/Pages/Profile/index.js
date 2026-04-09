import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { updateProfile, updatePassword } from '../../services/authService';
import { getMyOrders, cancelOrder } from '../../services/orderService';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiSave, FiShoppingBag, FiHeart, FiPackage, FiChevronDown, FiChevronUp, FiX, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────
const STATUS_LABELS = {
    pending:   { label: 'En attente',  color: '#f59e0b', bg: '#fef3c7' },
    confirmed: { label: 'Confirmée',   color: '#3b82f6', bg: '#dbeafe' },
    shipped:   { label: 'Expédiée',    color: '#8b5cf6', bg: '#ede9fe' },
    delivered: { label: 'Livrée',      color: '#166534', bg: '#dcfce7' },
    cancelled: { label: 'Annulée',     color: '#dc2626', bg: '#fee2e2' },
};

const PAYMENT_LABELS = {
    cod:    '💵 Paiement à la livraison',
    stripe: '💳 Carte bancaire',
    paypal: '🅿️ PayPal',
};

const Profile = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('profil');
    const [showPassword, setShowPassword] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

    // ── Commandes ────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        name:    user?.name    || '',
        email:   user?.email   || '',
        phone:   user?.phone   || '',
        address: user?.address || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword:  '',
        newPassword:      '',
        confirmPassword:  '',
    });

    const showSuccess = (msg) => { setSuccessMsg(msg); setErrorMsg(''); setTimeout(() => setSuccessMsg(''), 3000); };
    const showError   = (msg) => { setErrorMsg(msg); setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 3000); };

    // ── Charger les commandes ────────────────────────────
    useEffect(() => {
        if (activeTab === 'commandes') {
            setOrdersLoading(true);
            getMyOrders()
                .then(res => setOrders(res.data.orders || []))
                .catch(() => setOrders([]))
                .finally(() => setOrdersLoading(false));
        }
    }, [activeTab]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) setAvatarPreview(URL.createObjectURL(file));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('phone', profileData.phone);
            formData.append('address', profileData.address);
            if (fileInputRef.current?.files[0]) formData.append('avatar', fileInputRef.current.files[0]);
            await updateProfile(formData);
            showSuccess('Profil mis à jour avec succès !');
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) { showError('Les mots de passe ne correspondent pas !'); return; }
        setLoadingPassword(true);
        try {
            await updatePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
            showSuccess('Mot de passe modifié avec succès !');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    setCancellingId(orderId);
    try {
        await cancelOrder(orderId);
        setOrders(prev => prev.map(o => o.id === orderId 
            ? { ...o, status: 'cancelled', delivery_status: 'cancelled' } 
            : o
        ));
        setExpandedOrder(null); // ✅ ferme l'accordion → cache le statut livraison
        showSuccess('Commande annulée avec succès.');
    } catch (err) {
        showError(err.response?.data?.message || 'Impossible d\'annuler cette commande.');
    } finally {
        setCancellingId(null);
    }
};
    const tabs = [
        { id: 'profil',    label: 'Informations', icon: <FiUser size={16} /> },
        { id: 'commandes', label: 'Commandes',    icon: <FiPackage size={16} /> },
        { id: 'securite',  label: 'Sécurité',     icon: <FiLock size={16} /> },
    ];

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* TITRE */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-1">Mon Profil</h1>
                    <p className="text-black/50">Gérez vos informations personnelles</p>
                </div>

                {/* CARTE UTILISATEUR */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-6 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-black text-[#2d5a27] shrink-0 overflow-hidden">
                        {avatarPreview
                            ? <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                            : user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[#2c2c2c]">{user?.name}</h2>
                        <p className="text-black/50 text-sm">{user?.email}</p>
                        <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                            {user?.role === 'admin' ? '👑 Admin' : '🛍️ Client'}
                        </span>
                    </div>
                    <div className="flex gap-4 text-center">
                        <Link to="/favoris" className="no-underline">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <FiHeart className="text-red-500 mx-auto mb-1" size={20} />
                                <p className="text-xs font-bold text-black/50">Favoris</p>
                            </div>
                        </Link>
                        <Link to="/panier" className="no-underline">
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <FiShoppingBag className="text-[#2d5a27] mx-auto mb-1" size={20} />
                                <p className="text-xs font-bold text-black/50">Panier</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* ALERTES */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">✅ {successMsg}</div>
                )}
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">❌ {errorMsg}</div>
                )}

                {/* TABS */}
                <div className="flex bg-white rounded-2xl p-1 shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-6 gap-1">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                activeTab === tab.id ? 'bg-[#2d5a27] text-white shadow-lg' : 'text-black/50 hover:text-[#2d5a27]'
                            }`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB PROFIL ── */}
                {activeTab === 'profil' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8">
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-6">Informations personnelles</h3>
                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                            {/* AVATAR */}
                            <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                                        {avatarPreview
                                            ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                            : <span className="text-3xl font-black text-[#2d5a27]">{user?.name?.[0]?.toUpperCase()}</span>}
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current.click()}
                                        className="absolute -bottom-2 -right-2 bg-[#2d5a27] text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-emerald-500 transition shadow-lg text-xs">
                                        ✏️
                                    </button>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#2c2c2c] mb-1">Photo de profil</p>
                                    <p className="text-xs text-black/40 mb-2">JPG, PNG — max 2MB</p>
                                    <button type="button" onClick={() => fileInputRef.current.click()}
                                        className="text-xs font-bold text-[#2d5a27] hover:underline">Changer la photo</button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>
                            {/* NOM */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet</label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type="text" value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="Votre nom complet" />
                                </div>
                            </div>
                            {/* EMAIL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type="email" value={profileData.email} disabled
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-black/40 cursor-not-allowed" />
                                </div>
                                <p className="text-xs text-black/30 mt-1">L'email ne peut pas être modifié</p>
                            </div>
                            <button type="submit" disabled={loadingProfile}
                                className="flex items-center gap-2 bg-[#2d5a27] hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50">
                                <FiSave size={16} />
                                {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── TAB COMMANDES ── */}
                {activeTab === 'commandes' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#2c2c2c]">Mes commandes</h3>

                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-4xl animate-spin">🌿</div>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-12 text-center">
                                <div className="text-6xl mb-4">📦</div>
                                <h4 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucune commande</h4>
                                <p className="text-black/50 text-sm mb-6">Vous n'avez pas encore passé de commande.</p>
                                <Link to="/produits"
                                    className="inline-block text-white font-bold px-6 py-3 rounded-xl no-underline"
                                    style={{ background: '#166534' }}>
                                    Découvrir nos produits →
                                </Link>
                            </div>
                        ) : (
                            orders.map(order => {
                                const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                                const isExpanded = expandedOrder === order.id;
                                const canCancel = ['pending', 'confirmed'].includes(order.status);

                                return (
                                    <div key={order.id}
                                        className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">

                                        {/* EN-TÊTE COMMANDE */}
                                        <div className="p-5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: statusInfo.bg }}>
                                                <FiPackage size={20} style={{ color: statusInfo.color }} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-black text-[#2c2c2c] text-sm">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                                                        style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-black/40">
                                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    {' · '}{order.item_count} article{order.item_count > 1 ? 's' : ''}
                                                    {' · '}{PAYMENT_LABELS[order.payment_method] || order.payment_method}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-lg font-black" style={{ color: '#166534' }}>
                                                    {parseFloat(order.total_price).toFixed(2)} DT
                                                </span>
                                                <Link to={`/commandes/${order.id}`}
                                                    className="p-2 rounded-xl hover:bg-emerald-50 transition no-underline"
                                                    title="Voir les détails"
                                                    style={{ color: '#166534' }}>
                                                    <FiExternalLink size={16} />
                                                </Link>
                                                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                    className="p-2 rounded-xl hover:bg-gray-100 transition text-black/40">
                                                    {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* DÉTAILS COMMANDE */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 p-5 space-y-4"
                                                style={{ background: '#fafafa' }}>

                                                {/* LIVRAISON */}
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-xs text-black/40 mb-1">Adresse de livraison</p>
                                                        <p className="font-semibold text-[#2c2c2c]">
                                                            {order.shipping_address}, {order.shipping_city}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-black/40 mb-1">Statut livraison</p>
                                                        <p className="font-semibold text-[#2c2c2c]">
                                                            {order.delivery_status === 'preparing' ? '📦 En préparation'
                                                                : order.delivery_status === 'shipped'  ? '🚚 En route'
                                                                : order.delivery_status === 'delivered'? '✅ Livré'
                                                                : order.delivery_status === 'cancelled' ? '❌ Annulée'
                                                                : order.delivery_status || '—'}
                                                        </p>
                                                    </div>
                                                    {order.tracking_number && (
                                                        <div>
                                                            <p className="text-xs text-black/40 mb-1">Numéro de suivi</p>
                                                            <p className="font-semibold text-[#2c2c2c]">{order.tracking_number}</p>
                                                        </div>
                                                    )}
                                                    {order.estimated_date && (
                                                        <div>
                                                            <p className="text-xs text-black/40 mb-1">Livraison estimée</p>
                                                            <p className="font-semibold text-[#2c2c2c]">
                                                                {new Date(order.estimated_date).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ACTIONS */}
                                                {canCancel && (
                                                    <div className="pt-3 border-t border-gray-200">
                                                        <button
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            disabled={cancellingId === order.id}
                                                            className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition disabled:opacity-50">
                                                            <FiX size={14} />
                                                            {cancellingId === order.id ? 'Annulation...' : 'Annuler cette commande'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── TAB SÉCURITÉ ── */}
                {activeTab === 'securite' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8">
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-6">Changer le mot de passe</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Mot de passe actuel</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type={showPassword ? 'text' : 'password'} value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nouveau mot de passe</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type={showPassword ? 'text' : 'password'} value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirmer le nouveau mot de passe</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type={showPassword ? 'text' : 'password'} value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••" required />
                                </div>
                            </div>
                            <button type="submit" disabled={loadingPassword}
                                className="flex items-center gap-2 bg-[#2d5a27] hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50">
                                <FiLock size={16} />
                                {loadingPassword ? 'Modification...' : 'Changer le mot de passe'}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;