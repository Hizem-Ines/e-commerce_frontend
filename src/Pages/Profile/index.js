import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { updateProfile, updatePassword } from '../../services/authService';
import { getMyOrders } from '../../services/orderService';
import {
    FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiSave,
    FiShoppingBag, FiHeart, FiPackage, FiChevronDown, FiChevronUp,
    FiExternalLink, FiAlertCircle, FiMapPin, FiPhone,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import formatPrice from '../../utils/formatPrice';
import {
  getMyReclamations,
} from '../../services/reclamationService';

import { addWSListener, removeWSListener } from '../../utils/websocket';
// ✅ Clés FR pour correspondre à la DB
const STATUS_LABELS = {
    en_attente:     { label: 'En attente',     color: '#f59e0b', bg: '#fef3c7' },
    confirmee:      { label: 'Confirmée',       color: '#3b82f6', bg: '#dbeafe' },
    en_preparation: { label: 'En préparation',  color: '#f97316', bg: '#ffedd5' },
    expediee:       { label: 'Expédiée',        color: '#8b5cf6', bg: '#ede9fe' },
    livree:         { label: 'Livrée',          color: '#166534', bg: '#dcfce7' },
    annulee:        { label: 'Annulée',         color: '#dc2626', bg: '#fee2e2' },
    remboursee:     { label: 'Remboursée',      color: '#6b7280', bg: '#f3f4f6' },
};

// ✅ Statuts livraison DB (deliveries.status)
const getDeliveryLabel = (s) => {
    const map = {
        en_preparation: '📦 En préparation',
        expedie:        '🚚 En route',
        en_transit:     '🚚 En transit',
        en_cours:       '🚚 En cours',
        livre:          '✅ Livré',
        echec:          '❌ Échec de livraison',
        retourne:       '↩️ Retourné',
    };
    return map[s] || s || '—';
};

const Profile = () => {
    const { user }     = useAuth();
    const { currency } = useSiteSettings();

    const [activeTab,        setActiveTab]        = useState('profil');
    const [showPassword,     setShowPassword]     = useState(false);
    const [successMsg,       setSuccessMsg]       = useState('');
    const [errorMsg,         setErrorMsg]         = useState('');
    const [loadingProfile,   setLoadingProfile]   = useState(false);
    const [loadingPassword,  setLoadingPassword]  = useState(false);
    const [avatarPreview,    setAvatarPreview]    = useState(user?.avatar || null);
    const [deleteAvatar,     setDeleteAvatar]     = useState(false);

    // ── Dirty tracking ────────────────────────────────────
    const [profileDirty,  setProfileDirty]  = useState(false);
    const [passwordDirty, setPasswordDirty] = useState(false);
    const [avatarDirty,   setAvatarDirty]   = useState(false);

    const isProfileDirty  = profileDirty || avatarDirty;
    const isPasswordDirty = passwordDirty;
    const currentTabDirty = activeTab === 'profil' ? isProfileDirty : activeTab === 'securite' ? isPasswordDirty : false;

    // ── Commandes ─────────────────────────────────────────
    const [orders,         setOrders]         = useState([]);
    const [ordersLoading,  setOrdersLoading]  = useState(false);
    const [expandedOrder,  setExpandedOrder]  = useState(null);

    // ── Réclamations ──────────────────────────────────────────
    const [reclamations,         setReclamations]         = useState([]);
    const [reclamationsLoading,  setReclamationsLoading]  = useState(false);

    const fileInputRef = useRef(null);

    // ── Données profil de base ─────────────────────────────
    const [profileData, setProfileData] = useState({
        name:    user?.name    || '',
        email:   user?.email   || '',
        phone:   user?.phone   || '',
        address: user?.address || '',
        city:    user?.city    || '',
    });

    const savedProfileRef = useRef({
        name:    user?.name    || '',
        phone:   user?.phone   || '',
        address: user?.address || '',
        city:    user?.city    || '',
    });

    // ── Adresse de livraison préférée ──────────────────────
    const [shippingData, setShippingData] = useState({
        shipping_full_name:   user?.shipping_full_name   || '',
        shipping_phone:       user?.shipping_phone       || '',
        shipping_address:     user?.shipping_address     || '',
        shipping_city:        user?.shipping_city        || '',
        shipping_governorate: user?.shipping_governorate || '',
        shipping_postal_code: user?.shipping_postal_code || '',
        shipping_country:     user?.shipping_country     || 'CH',
    });

    const savedShippingRef = useRef({ ...shippingData });
    const [shippingDirty, setShippingDirty] = useState(false);

    // ── Adresse de facturation préférée ───────────────────
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(false);

    const [billingData, setBillingData] = useState({
        billing_full_name:   user?.billing_full_name   || '',
        billing_phone:       user?.billing_phone       || '',
        billing_address:     user?.billing_address     || '',
        billing_city:        user?.billing_city        || '',
        billing_governorate: user?.billing_governorate || '',
        billing_postal_code: user?.billing_postal_code || '',
        billing_country:     user?.billing_country     || 'CH',
    });

    const savedBillingRef  = useRef({ ...billingData });
    const [billingDirty, setBillingDirty] = useState(false);

    const isProfileSectionDirty = isProfileDirty || shippingDirty || billingDirty;

    // ── Mot de passe ──────────────────────────────────────
    const [passwordData, setPasswordData] = useState({
        currentPassword:  '',
        newPassword:      '',
        confirmPassword:  '',
    });

    const showSuccess = (msg) => { setSuccessMsg(msg); setErrorMsg('');  setTimeout(() => setSuccessMsg(''), 3500); };
    const showError   = (msg) => { setErrorMsg(msg);  setSuccessMsg(''); setTimeout(() => setErrorMsg(''),  3500); };

    // ── Warn before unload ────────────────────────────────
    useEffect(() => {
        const handle = (e) => { if (isProfileSectionDirty || isPasswordDirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handle);
        return () => window.removeEventListener('beforeunload', handle);
    }, [isProfileSectionDirty, isPasswordDirty]);

    // ── Tab switch guard ──────────────────────────────────
    const handleTabChange = (tabId) => {
        if (tabId === activeTab) return;
        if (currentTabDirty) {
            if (!window.confirm('Vous avez des modifications non sauvegardées. Continuer ?')) return;
            if (activeTab === 'profil') {
                setProfileDirty(false); setAvatarDirty(false); setShippingDirty(false); setBillingDirty(false);
                setAvatarPreview(user?.avatar || null);
                setProfileData({
                    name:    savedProfileRef.current.name,
                    email:   user?.email || '',
                    phone:   savedProfileRef.current.phone,
                    address: savedProfileRef.current.address,
                    city:    savedProfileRef.current.city,
                });
                setShippingData({ ...savedShippingRef.current });
                setBillingData({ ...savedBillingRef.current });
            } else if (activeTab === 'securite') {
                setPasswordDirty(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        }
        setActiveTab(tabId);
    };

    // ── Charger commandes ─────────────────────────────────
    useEffect(() => {
        if (activeTab === 'commandes') {
            setOrdersLoading(true);
            getMyOrders()
                .then(res => setOrders(res.data.orders || []))
                .catch(() => setOrders([]))
                .finally(() => setOrdersLoading(false));
        }
    }, [activeTab]);

    // ── Charger réclamations ──────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'reclamations') return;
        setReclamationsLoading(true);

        getMyReclamations()
            .then(res => setReclamations(Array.isArray(res) ? res : (res.reclamations || [])))
            .catch(() => setReclamations([]))
            .finally(() => setReclamationsLoading(false));

    }, [activeTab]);

    useEffect(() => {
        addWSListener("profile-reclamations", (data) => {
            if (data.type === "RECLAMATION_UPDATE") {
                setReclamations((prev) =>
                    prev.map((r) =>
                        r.id === data.id
                            ? { ...r, status: data.status, admin_response: data.admin_response || r.admin_response }
                            : r
                    )
                );
            }
        });

        return () => removeWSListener("profile-reclamations");
    }, []);

    // ── Handlers dirty ────────────────────────────────────
    const handleProfileChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
        const updated = { ...profileData, [field]: value };
        const saved   = savedProfileRef.current;
        setProfileDirty(
            updated.name !== saved.name || updated.phone !== saved.phone ||
            updated.address !== saved.address || updated.city !== saved.city
        );
    };

    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingData(prev => ({ ...prev, [name]: value }));
        setShippingDirty(true);
    };

    const handleBillingChange = (e) => {
        const { name, value } = e.target;
        setBillingData(prev => ({ ...prev, [name]: value }));
        setBillingDirty(true);
    };

    const handleBillingSameToggle = () => {
        const next = !billingSameAsShipping;
        setBillingSameAsShipping(next);
        if (next) {
            // Copier shipping vers billing
            setBillingData({
                billing_full_name:   shippingData.shipping_full_name,
                billing_phone:       shippingData.shipping_phone,
                billing_address:     shippingData.shipping_address,
                billing_city:        shippingData.shipping_city,
                billing_governorate: shippingData.shipping_governorate,
                billing_postal_code: shippingData.shipping_postal_code,
                billing_country:     shippingData.shipping_country,
            });
            setBillingDirty(true);
        }
    };

    // ── Avatar ────────────────────────────────────────────
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) { setAvatarPreview(URL.createObjectURL(file)); setDeleteAvatar(false); setAvatarDirty(true); }
    };

    const handleDeleteAvatar = () => {
        setAvatarPreview(null); setDeleteAvatar(true);
        setAvatarDirty(!!user?.avatar);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Submit profil ─────────────────────────────────────
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            const fd = new FormData();
            fd.append('name',    profileData.name);
            fd.append('phone',   profileData.phone);
            fd.append('address', profileData.address);
            fd.append('city',    profileData.city);

            // ✅ Champs shipping
            Object.entries(shippingData).forEach(([k, v]) => fd.append(k, v || ''));

            // ✅ Champs billing (ou copie depuis shipping si cochée)
            if (billingSameAsShipping) {
                fd.append('billing_full_name',   shippingData.shipping_full_name);
                fd.append('billing_phone',        shippingData.shipping_phone);
                fd.append('billing_address',      shippingData.shipping_address);
                fd.append('billing_city',         shippingData.shipping_city);
                fd.append('billing_governorate',  shippingData.shipping_governorate);
                fd.append('billing_postal_code',  shippingData.shipping_postal_code);
                fd.append('billing_country',      shippingData.shipping_country);
            } else {
                Object.entries(billingData).forEach(([k, v]) => fd.append(k, v || ''));
            }

            if (fileInputRef.current?.files[0]) {
                fd.append('avatar', fileInputRef.current.files[0]);
            } else if (deleteAvatar) {
                fd.append('deleteAvatar', 'true');
            }

            await updateProfile(fd);

            // Marquer comme sauvegardé
            savedProfileRef.current  = { name: profileData.name, phone: profileData.phone, address: profileData.address, city: profileData.city };
            savedShippingRef.current = { ...shippingData };
            savedBillingRef.current  = { ...billingData };
            setProfileDirty(false); setAvatarDirty(false); setShippingDirty(false); setBillingDirty(false);
            showSuccess('Profil mis à jour avec succès !');
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordChange = (field, value) => {
        const updated = { ...passwordData, [field]: value };
        setPasswordData(updated);
        setPasswordDirty(updated.currentPassword !== '' || updated.newPassword !== '' || updated.confirmPassword !== '');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) { showError('Les mots de passe ne correspondent pas !'); return; }
        setLoadingPassword(true);
        try {
            await updatePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
            showSuccess('Mot de passe modifié avec succès !');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordDirty(false);
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoadingPassword(false);
        }
    };

    const tabs = [
        { id: 'profil',       label: 'Informations', icon: <FiUser size={16} />,        dirty: isProfileSectionDirty },
        { id: 'commandes',    label: 'Commandes',    icon: <FiPackage size={16} />,      dirty: false                  },
        { id: 'reclamations', label: 'Réclamations', icon: <FiAlertCircle size={16} />, dirty: false                  },
        { id: 'securite',     label: 'Sécurité',     icon: <FiLock size={16} />,         dirty: isPasswordDirty        },
    ];

    // ── Styles champs ─────────────────────────────────────
    const inputBase = "w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm transition border-gray-200 focus:border-[#4a8c42]";

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* TITRE */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-1">Mon Profil</h1>
                    <p className="text-black/50">Gérez vos informations personnelles</p>
                </div>

                {/* CARTE UTILISATEUR */}
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                    <div className="flex gap-4 text-center self-end sm:self-auto">
                        <Link to="/favoris" className="no-underline">
                            <div className="bg-red-50 p-3 rounded-xl"><FiHeart className="text-red-500 mx-auto mb-1" size={20} /><p className="text-xs font-bold text-black/50">Favoris</p></div>
                        </Link>
                        <Link to="/panier" className="no-underline">
                            <div className="bg-emerald-50 p-3 rounded-xl"><FiShoppingBag className="text-[#2d5a27] mx-auto mb-1" size={20} /><p className="text-xs font-bold text-black/50">Panier</p></div>
                        </Link>
                    </div>
                </div>

                {/* ALERTES */}
                {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">✅ {successMsg}</div>}
                {errorMsg   && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">❌ {errorMsg}</div>}

                {/* TABS */}
                <div className="flex bg-white rounded-2xl p-1 shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-6 gap-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 relative ${
                                activeTab === tab.id ? 'bg-[#2d5a27] text-white shadow-lg' : 'text-black/50 hover:text-[#2d5a27]'
                            }`}>
                            {tab.icon} <span className="hidden xs:inline sm:inline">{tab.label}</span>
                            {tab.dirty && (
                                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${activeTab === tab.id ? 'bg-amber-300' : 'bg-amber-400'}`} title="Modifications non sauvegardées" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════
                    TAB PROFIL
                ══════════════════════════════════════════════════ */}
                {activeTab === 'profil' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-5">

                        {/* ── Informations personnelles ── */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#2c2c2c]">Informations personnelles</h3>
                                {isProfileSectionDirty && (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                        <FiAlertCircle size={13} /> Modifications non sauvegardées
                                    </span>
                                )}
                            </div>

                            {/* AVATAR */}
                            <div className="flex items-center gap-5 pb-5 border-b border-gray-100 mb-5">
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center overflow-hidden border-2 transition ${avatarDirty ? 'border-amber-400' : 'border-[#b6eac7]'}`}>
                                        {avatarPreview
                                            ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                            : <span className="text-3xl font-black text-[#2d5a27]">{user?.name?.[0]?.toUpperCase()}</span>}
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current.click()}
                                        className="absolute -bottom-2 -right-2 bg-[#2d5a27] text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-[#4a8c42] transition shadow-lg text-xs">
                                        ✏️
                                    </button>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#2c2c2c] mb-1">Photo de profil</p>
                                    <p className="text-xs text-black/40 mb-2">JPG, PNG — max 2MB</p>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="text-xs font-bold text-[#2d5a27] hover:underline">Changer</button>
                                        {avatarPreview && (<><span className="text-black/20">|</span><button type="button" onClick={handleDeleteAvatar} className="text-xs font-bold text-red-500 hover:underline">Supprimer</button></>)}
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>

                            <div className="space-y-4">
                                {/* NOM */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input type="text" value={profileData.name}
                                            onChange={(e) => handleProfileChange('name', e.target.value)}
                                            className={`${inputBase} pl-10`} placeholder="Votre nom complet" />
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
                                {/* TÉLÉPHONE */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                    <div className="relative">
                                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input type="tel" value={profileData.phone}
                                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                                            className={`${inputBase} pl-10`} placeholder="+41 79 XXX XX XX" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Adresse de livraison préférée ── */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5 sm:p-8">
                            <h3 className="text-lg font-bold text-[#2c2c2c] mb-1 flex items-center gap-2">
                                <FiMapPin style={{ color: '#e63946' }} /> Adresse de livraison préférée
                            </h3>
                            <p className="text-xs text-black/40 mb-5">
                                Pré-remplie automatiquement au checkout lors de votre prochaine commande.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet</label>
                                    <input type="text" name="shipping_full_name" value={shippingData.shipping_full_name}
                                        onChange={handleShippingChange} placeholder="Nom pour la livraison"
                                        className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                    <input type="tel" name="shipping_phone" value={shippingData.shipping_phone}
                                        onChange={handleShippingChange} placeholder="+41 79 XXX XX XX"
                                        className={inputBase} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse</label>
                                    <input type="text" name="shipping_address" value={shippingData.shipping_address}
                                        onChange={handleShippingChange} placeholder="Rue, numéro..."
                                        className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">NPA</label>
                                    <input type="text" name="shipping_postal_code" value={shippingData.shipping_postal_code}
                                        onChange={handleShippingChange} placeholder="8001" maxLength={4}
                                        className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Localité</label>
                                    <input type="text" name="shipping_city" value={shippingData.shipping_city}
                                        onChange={handleShippingChange} placeholder="Zurich"
                                        className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Canton</label>
                                    <input type="text" name="shipping_governorate" value={shippingData.shipping_governorate}
                                        onChange={handleShippingChange} placeholder="ZH"
                                        className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Pays</label>
                                    <input type="text" name="shipping_country" value={shippingData.shipping_country}
                                        onChange={handleShippingChange} placeholder="CH"
                                        className={inputBase} />
                                </div>
                            </div>
                        </div>

                        {/* ── Adresse de facturation préférée ── */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5 sm:p-8">
                            <h3 className="text-lg font-bold text-[#2c2c2c] mb-4 flex items-center gap-2">
                                <FiMapPin style={{ color: '#6366f1' }} /> Adresse de facturation préférée
                            </h3>

                            {/* Checkbox identique */}
                            <label className="flex items-center gap-3 cursor-pointer mb-5">
                                <div
                                    onClick={handleBillingSameToggle}
                                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 ${
                                        billingSameAsShipping ? 'border-[#166534] bg-[#166534]' : 'border-gray-300 bg-white'
                                    }`}
                                >
                                    {billingSameAsShipping && <span className="text-white text-xs font-bold">✓</span>}
                                </div>
                                <span className="text-sm font-semibold text-[#2c2c2c]">
                                    Identique à l'adresse de livraison
                                </span>
                            </label>

                            {!billingSameAsShipping && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet</label>
                                        <input type="text" name="billing_full_name" value={billingData.billing_full_name}
                                            onChange={handleBillingChange} placeholder="Nom pour la facture"
                                            className={inputBase} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                        <input type="tel" name="billing_phone" value={billingData.billing_phone}
                                            onChange={handleBillingChange} placeholder="+41 79 XXX XX XX"
                                            className={inputBase} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse</label>
                                        <input type="text" name="billing_address" value={billingData.billing_address}
                                            onChange={handleBillingChange} placeholder="Rue, numéro..."
                                            className={inputBase} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">NPA</label>
                                        <input type="text" name="billing_postal_code" value={billingData.billing_postal_code}
                                            onChange={handleBillingChange} placeholder="8001" maxLength={4}
                                            className={inputBase} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Localité</label>
                                        <input type="text" name="billing_city" value={billingData.billing_city}
                                            onChange={handleBillingChange} placeholder="Zurich"
                                            className={inputBase} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Canton</label>
                                        <input type="text" name="billing_governorate" value={billingData.billing_governorate}
                                            onChange={handleBillingChange} placeholder="ZH"
                                            className={inputBase} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Pays</label>
                                        <input type="text" name="billing_country" value={billingData.billing_country}
                                            onChange={handleBillingChange} placeholder="CH"
                                            className={inputBase} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bouton sauvegarder */}
                        <button type="submit" disabled={loadingProfile || !isProfileSectionDirty}
                            className={`flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all duration-300 ${
                                isProfileSectionDirty
                                    ? 'bg-[#2d5a27] hover:bg-[#4a8c42] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            } disabled:opacity-50`}>
                            <FiSave size={16} />
                            {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                            {isProfileSectionDirty && <span className="ml-1 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />}
                        </button>
                    </form>
                )}

                {/* ══════════════════════════════════════════════════
                    TAB COMMANDES
                ══════════════════════════════════════════════════ */}
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
                                <Link to="/produits" className="inline-block text-white font-bold px-6 py-3 rounded-xl no-underline" style={{ background: '#166534' }}>
                                    Découvrir nos produits →
                                </Link>
                            </div>
                        ) : orders.map(order => {
                            // ✅ Clé FR depuis DB
                            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.en_attente;
                            const isExpanded = expandedOrder === order.id;

                            return (
                                <div key={order.id} className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                                    {/* EN-TÊTE */}
                                    <div className="p-4 sm:p-5 flex items-center gap-3 flex-wrap">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: statusInfo.bg }}>
                                            <FiPackage size={20} style={{ color: statusInfo.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-black text-[#2c2c2c] text-sm">
                                                    {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                                                </span>
                                                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-black/40">
                                                {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {' · '}{order.item_count} article{order.item_count > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                            <span className="text-lg font-black" style={{ color: '#166534' }}>
                                                {formatPrice(parseFloat(order.total_price), currency)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/commandes/${order.id}`}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl no-underline transition-all"
                                                    style={{ background: '#ecfdf5', color: '#166534', border: '1.5px solid #bbf7d0' }}>
                                                    <FiExternalLink size={13} /><span>Détails</span>
                                                </Link>
                                                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                                                    style={isExpanded
                                                        ? { background: '#2d5a27', color: 'white', border: '1.5px solid #2d5a27' }
                                                        : { background: '#f3f4f6', color: '#6b7280', border: '1.5px solid #e5e7eb' }}>
                                                    {isExpanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                                                    <span>{isExpanded ? 'Réduire' : 'Aperçu'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DÉTAILS */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-5 space-y-4" style={{ background: '#fafafa' }}>
                                            {/* Articles */}
                                            {order.items?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Articles commandés</p>
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                                                                {item.product_image
                                                                    ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                    : <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm text-[#2c2c2c] truncate">{item.product_name}</p>
                                                                <p className="text-xs text-black/40">Qté : {item.quantity}</p>
                                                            </div>
                                                            {/* ✅ Utiliser unit_price (champ retourné par getMyOrders) */}
                                                            <span className="font-black text-sm shrink-0" style={{ color: '#166534' }}>
                                                                {formatPrice(parseFloat(item.unit_price ?? item.price_at_order) * item.quantity, currency)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Livraison */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-black/40 mb-1">Adresse de livraison</p>
                                                    <p className="font-semibold text-[#2c2c2c]">{order.shipping_address}, {order.shipping_city}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-black/40 mb-1">Statut livraison</p>
                                                    {/* ✅ Utiliser getDeliveryLabel avec valeurs DB FR */}
                                                    <p className="font-semibold text-[#2c2c2c]">{getDeliveryLabel(order.delivery_status)}</p>
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
                                                        <p className="font-semibold text-[#2c2c2c]">{new Date(order.estimated_date).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    TAB RÉCLAMATIONS
                ══════════════════════════════════════════════════ */}
                {activeTab === 'reclamations' && (() => {
                    const STATUS_RECL = {
                        en_attente: { label: 'En attente',   color: '#f59e0b', bg: '#fef3c7' },
                        en_cours:   { label: 'En cours',     color: '#3b82f6', bg: '#dbeafe' },
                        urgente:    { label: 'Urgente ⚡',   color: '#ea580c', bg: '#ffedd5' },
                        en_retard:  { label: 'En retard ⏰', color: '#dc2626', bg: '#fee2e2' },
                        resolue:    { label: 'Résolue ✅',   color: '#166534', bg: '#dcfce7' },
                        rejetee:    { label: 'Rejetée',      color: '#6b7280', bg: '#f3f4f6' },
                    };
                    return (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[#2c2c2c]">Mes réclamations</h3>
                                <Link
                                    to="/reclamations"
                                    className="flex items-center gap-2 bg-[#2d5a27] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#4a8c42] transition text-sm no-underline"
                                >
                                    + Nouvelle réclamation
                                </Link>
                            </div>

                            {/* Liste */}
                            {reclamationsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="text-4xl animate-spin">🌿</div>
                                </div>
                            ) : reclamations.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-12 text-center">
                                    <div className="text-6xl mb-4">📭</div>
                                    <h4 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucune réclamation</h4>
                                    <p className="text-black/50 text-sm">Vous n'avez pas encore soumis de réclamation.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {reclamations.map(r => {
                                        const cfg = STATUS_RECL[r.status] || STATUS_RECL.en_attente;
                                        return (
                                            <div key={r.id} className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <p className="font-bold text-sm text-[#2c2c2c]">
                                                            #{r.id.slice(0, 8).toUpperCase()}
                                                            {r.order_number && (
                                                                <span className="ml-2 font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                                                                    Cmd {r.order_number}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-black/40 mt-0.5">
                                                            {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0"
                                                        style={{ background: cfg.bg, color: cfg.color }}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-black/60 line-clamp-2 mb-3">{r.message}</p>
                                                {r.admin_response && (
                                                    <div className="bg-emerald-50 rounded-xl p-3 border-l-4 border-emerald-400">
                                                        <p className="text-xs font-bold text-emerald-700 mb-1">Réponse de l'équipe GOFFA :</p>
                                                        <p className="text-sm text-[#2c2c2c]">{r.admin_response}</p>
                                                        {r.responded_at && (
                                                            <p className="text-xs text-black/30 mt-1">
                                                                {new Date(r.responded_at).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ══════════════════════════════════════════════════
                    TAB SÉCURITÉ
                ══════════════════════════════════════════════════ */}
                {activeTab === 'securite' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#2c2c2c]">Changer le mot de passe</h3>
                            {isPasswordDirty && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                    <FiAlertCircle size={13} /> Modifications non sauvegardées
                                </span>
                            )}
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            {[
                                { field: 'currentPassword',  label: 'Mot de passe actuel',               placeholder: '••••••••', show: true  },
                                { field: 'newPassword',      label: 'Nouveau mot de passe',              placeholder: '••••••••', show: false },
                                { field: 'confirmPassword',  label: 'Confirmer le nouveau mot de passe', placeholder: '••••••••', show: false },
                            ].map(({ field, label, placeholder, show }) => (
                                <div key={field}>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData[field]}
                                            onChange={(e) => handlePasswordChange(field, e.target.value)}
                                            className={`${inputBase} pl-10 ${show ? 'pr-10' : ''}`}
                                            placeholder={placeholder} required />
                                        {show && (
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button type="submit" disabled={loadingPassword || !isPasswordDirty}
                                className={`flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all duration-300 ${
                                    isPasswordDirty ? 'bg-[#2d5a27] hover:bg-[#4a8c42] text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                } disabled:opacity-50`}>
                                <FiLock size={16} />
                                {loadingPassword ? 'Modification...' : 'Changer le mot de passe'}
                                {isPasswordDirty && <span className="ml-1 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;