import { useState, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { updateProfile, updatePassword } from '../../services/authService';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiSave, FiShoppingBag, FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('profil');
    const [showPassword, setShowPassword] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const showError = (msg) => {
        setErrorMsg(msg);
        setSuccessMsg('');
        setTimeout(() => setErrorMsg(''), 3000);
    };

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
        if (fileInputRef.current?.files[0]) {
            formData.append('avatar', fileInputRef.current.files[0]);
        }
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
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError('Les mots de passe ne correspondent pas !');
            return;
        }
        setLoadingPassword(true);
        try {
            await updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            showSuccess('Mot de passe modifié avec succès !');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoadingPassword(false);
        }
    };

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
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-black text-emerald-600 shrink-0 overflow-hidden">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.[0]?.toUpperCase()
                        )}
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
                                <FiShoppingBag className="text-emerald-600 mx-auto mb-1" size={20} />
                                <p className="text-xs font-bold text-black/50">Panier</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* ALERTES */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">
                        ✅ {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-6 text-sm">
                        ❌ {errorMsg}
                    </div>
                )}

                {/* TABS */}
                <div className="flex bg-white rounded-2xl p-1 shadow-[0_4px_15px_rgba(0,0,0,0.07)] mb-6 gap-1">
                    {[
                        { id: 'profil', label: 'Informations', icon: <FiUser size={16} /> },
                        { id: 'securite', label: 'Sécurité', icon: <FiLock size={16} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'text-black/50 hover:text-emerald-600'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB PROFIL */}
                {activeTab === 'profil' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8">
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-6">Informations personnelles</h3>
                        <form onSubmit={handleProfileSubmit} className="space-y-5">

                            {/* AVATAR */}
                            <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-black text-emerald-600">
                                                {user?.name?.[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-emerald-500 transition shadow-lg text-xs"
                                    >
                                        ✏️
                                    </button>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#2c2c2c] mb-1">Photo de profil</p>
                                    <p className="text-xs text-black/40 mb-2">JPG, PNG — max 2MB</p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                        Changer la photo
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            {/* NOM */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom complet</label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="Votre nom complet"
                                    />
                                </div>
                            </div>

                            {/* EMAIL (lecture seule) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-black/40 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-black/30 mt-1">L'email ne peut pas être modifié</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingProfile}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                                <FiSave size={16} />
                                {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB SÉCURITÉ */}
                {activeTab === 'securite' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-8">
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-6">Changer le mot de passe</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Mot de passe actuel</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••"
                                        required
                                    />
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
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirmer le nouveau mot de passe</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingPassword}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
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