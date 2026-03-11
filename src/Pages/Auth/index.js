import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiEye, FiEyeOff, FiShoppingCart, FiHeart, FiTrendingUp, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/authContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        prenom: '',
        nom: '',
        telephone: '',
        adresse: '',
        ville: ''
    });

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin && formData.password !== formData.confirmPassword) {
            alert('Les mots de passe ne correspondent pas !');
            return;
        }

        try {
            if (isLogin) {
                await login({
                    email: formData.email,
                    password: formData.password,
                });
                navigate('/');
            } else {
                await register({
                    name: `${formData.prenom} ${formData.nom}`,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.telephone,
                    address: formData.adresse,
                    city: formData.ville,
                });
                alert('Compte créé ! Vérifiez votre email pour activer votre compte.');
                setIsLogin(true);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Une erreur est survenue');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
            <div className="max-w-5xl w-full grid grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

                {/* ===== COLONNE GAUCHE — FORMULAIRE ===== */}
                <div className="p-10 overflow-y-auto max-h-screen">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-3 mb-8 no-underline">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg">
                            <span className="text-2xl">🧺</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-emerald-600 tracking-widest font-serif">GOFFA</h1>
                            <p className="text-xs text-emerald-500 font-semibold tracking-wider">artisanat tunisien</p>
                        </div>
                    </Link>

                    {/* TOGGLE */}
                    <div className="flex bg-gray-100 rounded-full p-1 mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                                isLogin
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                                !isLogin
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Créer un compte
                        </button>
                    </div>

                    {/* TITRE */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-black text-gray-900 mb-1">
                            {isLogin ? 'Bienvenue ! 👋' : 'Rejoignez-nous 🌿'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {isLogin
                                ? 'Connectez-vous pour accéder à votre compte'
                                : 'Créez votre compte et commencez à commander'}
                        </p>
                    </div>

                    {/* FORMULAIRE */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* NOM + PRÉNOM */}
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Prénom</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleChange}
                                            placeholder="Votre prénom"
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            placeholder="Votre nom"
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EMAIL */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="votre.email@exemple.com"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                    required
                                />
                            </div>
                        </div>

                        {/* TÉLÉPHONE */}
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        placeholder="+216 XX XXX XXX"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        {/* MOT DE PASSE */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* CONFIRMER MOT DE PASSE */}
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ADRESSE + VILLE */}
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Adresse</label>
                                    <div className="relative">
                                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="adresse"
                                            value={formData.adresse}
                                            onChange={handleChange}
                                            placeholder="Rue, numéro..."
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Ville</label>
                                    <select
                                        name="ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                        required={!isLogin}
                                    >
                                        <option value="">Ville</option>
                                        <option value="tunis">Tunis</option>
                                        <option value="sfax">Sfax</option>
                                        <option value="sousse">Sousse</option>
                                        <option value="bizerte">Bizerte</option>
                                        <option value="gabes">Gabès</option>
                                        <option value="ariana">Ariana</option>
                                        <option value="kairouan">Kairouan</option>
                                        <option value="nabeul">Nabeul</option>
                                        <option value="monastir">Monastir</option>
                                        <option value="mahdia">Mahdia</option>
                                        <option value="tozeur">Tozeur</option>
                                        <option value="kasserine">Kasserine</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* SE SOUVENIR / MOT DE PASSE OUBLIÉ */}
                        {isLogin && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-emerald-600" />
                                    <span className="text-xs text-gray-600">Se souvenir de moi</span>
                                </label>
                                <button type="button" className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        )}

                        {/* CGV */}
                        {!isLogin && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 accent-emerald-600 mt-0.5" required />
                                <span className="text-xs text-gray-600">
                                    J'accepte les{' '}
                                    <button type="button" className="text-emerald-600 font-semibold hover:underline">CGV</button>
                                    {' '}et la{' '}
                                    <button type="button" className="text-emerald-600 font-semibold hover:underline">Politique de Confidentialité</button>
                                </span>
                            </label>
                        )}

                        {/* BOUTON SUBMIT */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-emerald-300/40 hover:scale-105"
                        >
                            {isLogin ? 'Se connecter →' : 'Créer mon compte →'}
                        </button>

                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center my-5">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-xs text-gray-400 font-semibold">OU</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* SOCIAL LOGIN */}
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                            className="w-full border-2 border-gray-200 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuer avec Google
                        </button>
                        <button className="w-full border-2 border-gray-200 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm">
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continuer avec Facebook
                        </button>
                    </div>

                </div>

                {/* ===== COLONNE DROITE — VISUEL ===== */}
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 flex flex-col justify-between text-white relative overflow-hidden">

                    {/* MOTIF */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />

                    <div className="relative z-10">

                        {/* BADGE */}
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-6">
                            {isLogin ? '🌟 Bon retour parmi nous !' : '🎉 Rejoignez notre communauté'}
                        </div>

                        {/* TITRE */}
                        <h2 className="text-4xl font-black mb-3 leading-tight font-serif">
                            {isLogin
                                ? 'Vos produits artisanaux vous attendent !'
                                : 'Commencez votre voyage artisanal'}
                        </h2>
                        <p className="text-emerald-100 mb-8 text-base">
                            {isLogin
                                ? 'Accédez à votre panier, vos favoris et votre historique de commandes'
                                : 'Découvrez des milliers de produits artisanaux et naturels de Tunisie'}
                        </p>

                        {/* AVANTAGES */}
                        <div className="space-y-4">
                            {[
                                { icone: <FiShoppingCart className="w-5 h-5" />, titre: 'Commandez facilement', desc: 'Des milliers de produits artisanaux livrés chez vous' },
                                { icone: <FiHeart className="w-5 h-5" />, titre: 'Favoris & Historique', desc: 'Retrouvez vos produits préférés en un clic' },
                                { icone: <FiTrendingUp className="w-5 h-5" />, titre: 'Offres exclusives', desc: 'Accédez aux promotions réservées aux membres' },
                                { icone: <FiShield className="w-5 h-5" />, titre: '100% Sécurisé', desc: 'Vos données sont protégées et cryptées' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl shrink-0">
                                        {item.icone}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-0.5">{item.titre}</h3>
                                        <p className="text-emerald-100 text-xs">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                        {[
                            { chiffre: '5000+', label: 'Produits bio' },
                            { chiffre: '15K+', label: 'Clients satisfaits' },
                            { chiffre: '98%', label: 'Satisfaction' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-black mb-1">{stat.chiffre}</div>
                                <div className="text-xs text-emerald-100">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* DÉCORATION */}
                    <div className="absolute bottom-0 right-0 text-8xl opacity-10">🧺</div>
                </div>

            </div>
        </div>
    );
};

export default Auth;