import { useState , useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiEye, FiEyeOff, FiGift, FiStar, FiPackage, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/authContext';
import logo from '../../assets/images/goffa-logo.png';

const Auth = () => {
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    // ── MFA state ─────────────────────────────────────────
    const [mfaRequired,     setMfaRequired]     = useState(false);
    const [mfaSessionToken, setMfaSessionToken] = useState('');
    const [otp,             setOtp]             = useState('');

    const { login, register, verifyMfaLogin } = useAuth();
    const navigate = useNavigate();

    const [oauthError, setOauthError] = useState('');
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'suspended') {
            setOauthError('Votre compte a été suspendu. Contactez le support.');
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ── Login / Register submit ───────────────────────────
    const handleSubmit = async (e) => {
        setAuthError('');
        setAuthSuccess('');
        e.preventDefault();
        if (isSubmitting) return;

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setAuthError('Les mots de passe ne correspondent pas !');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isLogin) {
                const res = await login({ email: formData.email, password: formData.password });
                if (res.data.mfaRequired) {
                    // Backend sent an OTP — show the MFA step
                    setMfaSessionToken(res.data.mfaSessionToken);
                    setMfaRequired(true);
                } else {
                    // Direct login (fallback — not expected with current backend)
                    navigate('/');
                }
            } else {
                await register({
                    name:     `${formData.prenom} ${formData.nom}`,
                    email:    formData.email,
                    password: formData.password,
                    phone:    formData.telephone,
                    address:  formData.adresse,
                    city:     formData.ville,
                });
                setAuthSuccess('Compte créé ! Vérifiez votre email pour activer votre compte.');
                setIsLogin(true);
            }
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── MFA submit ────────────────────────────────────────
    const handleMfaSubmit = async (e) => {
        setAuthError('');
        setAuthSuccess('');
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await verifyMfaLogin({ mfaSessionToken, otp });
            navigate('/login/success');

        } catch (err) {
            setAuthError(err.response?.data?.message || 'Code incorrect ou expiré. Réessayez.');
            setOtp(''); // vide le champ pour ressaisir
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── couleurs GOFFA ─── */
    const GREEN_DARK  = '#2d5a27';
    const GREEN_MID   = '#3a7232';
    const GREEN_LIGHT = '#4a8f3f';
    const LIGHT_GREEN= '#8faa8b';

    const inputStyle  = { border: `2px solid #e5e7eb` };
    const focusBorder = (e) => (e.target.style.borderColor = GREEN_DARK);
    const blurBorder  = (e) => (e.target.style.borderColor = '#e5e7eb');

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 md:p-6"
            style={{ background: `linear-gradient(135deg, #f0fdf4 0%, #fef2f2 50%, #f0fdf4 100%)` }}
        >
            <div
                className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
            >

                {/* ══════════════════ COLONNE GAUCHE — FORMULAIRE ══════════════════ */}
                <div className="p-6 md:p-10 overflow-y-auto max-h-screen">

                    {/* LOGO IMAGE */}
                    <Link to="/" className="flex items-center gap-3 mb-8 no-underline">
                        <div
                            className="relative rounded-2xl shadow-lg overflow-hidden"
                            style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})` }}
                        >
                            <img
                                src={logo}
                                alt="GOFFA logo"
                                className="w-full h-full object-contain p-1"
                            />
                            <span
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                                style={{ background: LIGHT_GREEN}}
                            />
                        </div>
                        <div>
                            <h1
                                className="text-2xl font-black tracking-widest font-serif"
                                style={{ color: GREEN_DARK }}
                            >
                                GOFFA
                            </h1>
                            <p className="text-xs font-semibold tracking-wider" style={{ color: GREEN_LIGHT }}>
                                artisanat · livré en Suisse
                            </p>
                        </div>
                    </Link>

                    {/* ════════════════ MFA STEP ════════════════ */}
                    {mfaRequired ? (
                        <div>
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">📬</div>
                                <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                                    Vérification en deux étapes
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    Un code à 6 chiffres a été envoyé à votre adresse email.
                                    Il expire dans <span className="font-bold text-gray-700">10 minutes</span>.
                                </p>
                            </div>

                            {authError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                                        ⚠️ {authError}
                                    </div>
                                )}
                                <form onSubmit={handleMfaSubmit} className="space-y-5">
                                <div>
                                    
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 text-center">
                                        Code de vérification
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 rounded-xl transition focus:outline-none"
                                        style={{
                                            border: `2px solid ${otp.length === 6 ? GREEN_DARK : '#e5e7eb'}`,
                                            letterSpacing: '0.4em',
                                        }}
                                        onFocus={focusBorder}
                                        onBlur={blurBorder}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || otp.length !== 6}
                                    className="w-full text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                    style={{
                                        background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})`,
                                        boxShadow: `0 4px 20px rgba(45, 90, 39, 0.4)`,
                                    }}
                                >
                                    {isSubmitting ? 'Vérification...' : 'Confirmer le code →'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setMfaRequired(false); setOtp(''); }}
                                    className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 hover:underline transition py-2"
                                >
                                    ← Retour à la connexion
                                </button>
                            </form>
                        </div>

                    ) : (
                        /* ════════════════ LOGIN / REGISTER STEP ════════════════ */
                        <>
                            {oauthError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-6">
                            ⚠️ {oauthError}
                        </div>
                    )}
                    {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                            ⚠️ {authError}
                        </div>
                    )}
                    {authSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                            ✅ {authSuccess}
                        </div>
                    )}

                    {/* TOGGLE */}
                    <div className="flex rounded-full p-1 mb-8" style={{ background: '#f3f4f6' }}>
                                {[
                                    { label: 'Connexion',       active: isLogin,  onClick: () => setIsLogin(true)  },
                                    { label: 'Créer un compte', active: !isLogin, onClick: () => setIsLogin(false) },
                                ].map(({ label, active, onClick }) => (
                                    <button
                                        key={label}
                                        onClick={onClick}
                                        className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                                            active ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        style={active ? { background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})` } : {}}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* TITRE */}
                            <div className="mb-6">
                                <h2 className="text-3xl font-black text-gray-900 mb-1">
                                    {isLogin ? 'Bienvenue ! 👋' : 'Rejoignez-nous 🌿'}
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    {isLogin
                                        ? 'Connectez-vous pour accéder à votre compte'
                                        : "Créez votre compte et découvrez l'artisanat"}
                                </p>
                            </div>

                            {/* FORMULAIRE */}
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* NOM + PRÉNOM */}
                                {!isLogin && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Prénom', name: 'prenom', placeholder: 'Votre prénom' },
                                            { label: 'Nom',    name: 'nom',    placeholder: 'Votre nom'    },
                                        ].map(({ label, name, placeholder }) => (
                                            <div key={name}>
                                                <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
                                                <div className="relative">
                                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                                    <input
                                                        type="text"
                                                        name={name}
                                                        value={formData[name]}
                                                        onChange={handleChange}
                                                        placeholder={placeholder}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                                        style={inputStyle}
                                                        onFocus={focusBorder}
                                                        onBlur={blurBorder}
                                                        required={!isLogin}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* EMAIL */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="votre.email@exemple.ch"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                            style={inputStyle}
                                            onFocus={focusBorder}
                                            onBlur={blurBorder}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* TÉLÉPHONE */}
                                {!isLogin && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Téléphone</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                            <input
                                                type="tel"
                                                name="telephone"
                                                value={formData.telephone}
                                                onChange={handleChange}
                                                placeholder="+41 XX XXX XX XX"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                                style={inputStyle}
                                                onFocus={focusBorder}
                                                onBlur={blurBorder}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* MOT DE PASSE */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Mot de passe</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm transition focus:outline-none"
                                            style={inputStyle}
                                            onFocus={focusBorder}
                                            onBlur={blurBorder}
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
                                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                                style={inputStyle}
                                                onFocus={focusBorder}
                                                onBlur={blurBorder}
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
                                                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                                <input
                                                    type="text"
                                                    name="adresse"
                                                    value={formData.adresse}
                                                    onChange={handleChange}
                                                    placeholder="Rue du Marché 12"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                                    style={inputStyle}
                                                    onFocus={focusBorder}
                                                    onBlur={blurBorder}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Localité</label>
                                            <div className="relative">
                                                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: LIGHT_GREEN}} />
                                                <input
                                                    type="text"
                                                    name="ville"
                                                    value={formData.ville}
                                                    onChange={handleChange}
                                                    placeholder="Zurich"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                                    style={inputStyle}
                                                    onFocus={focusBorder}
                                                    onBlur={blurBorder}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MOT DE PASSE OUBLIÉ */}
                                {isLogin && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/mot-de-passe-oublie')}
                                            className="text-xs font-bold hover:underline"
                                            style={{ color: LIGHT_GREEN}}
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    </div>
                                )}

                                {/* SUBMIT */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})`,
                                        boxShadow: `0 4px 20px rgba(45, 90, 39, 0.4)`
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 30px rgba(45, 90, 39, 0.6)`)}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 20px rgba(45, 90, 39, 0.4)`)}
                                >
                                    {isSubmitting ? 'Chargement...' : (isLogin ? 'Se connecter →' : 'Créer mon compte →')}
                                </button>
                            </form>

                            {/* DIVIDER */}
                            <div className="flex items-center my-5">
                                <div className="flex-1 border-t border-gray-200" />
                                <span className="px-4 text-xs text-gray-400 font-semibold">OU</span>
                                <div className="flex-1 border-t border-gray-200" />
                            </div>

                            {/* SOCIAL LOGIN */}
                            <button
                                onClick={() => (window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`)}
                                className="w-full py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm"
                                style={{ border: '2px solid #e5e7eb' }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continuer avec Google
                            </button>
                        </>
                    )}
                </div>

                {/* ══════════════════ COLONNE DROITE — VISUEL ══════════════════ */}
                <div
                    className="hidden md:flex p-10 flex-col justify-between text-white relative overflow-hidden"
                    style={{ background: `linear-gradient(160deg, #1a3d15 0%, ${GREEN_DARK} 55%, ${GREEN_MID} 100%)` }}
                >
                    {/* MOTIF POINTS */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />

                    {/* LUEURS DÉCORATIVES */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
                        style={{ background: LIGHT_GREEN, filter: 'blur(70px)', transform: 'translate(35%, -35%)' }} />
                    <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-15"
                        style={{ background: LIGHT_GREEN, filter: 'blur(55px)', transform: 'translate(-35%, 35%)' }} />
                    <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full opacity-10"
                        style={{ background: '#ffffff', filter: 'blur(60px)', transform: 'translate(-50%, -50%)' }} />

                    {/* ── HAUT ── */}
                    <div className="relative z-10">

                        {/* BADGE VIVANT */}
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIGHT_GREEN}} />
                            {mfaRequired
                                ? 'Vérification de votre identité'
                                : isLogin
                                    ? 'Bon retour parmi nous !'
                                    : 'Rejoignez notre communauté'}
                        </div>

                        {/* LOGO centré dans la colonne droite */}
                        <div className="flex justify-center mb-8">
                            <div
                                className="rounded-3xl p-4 shadow-2xl"
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    width: 110, height: 110
                                }}
                            >
                                <img src={logo} alt="GOFFA" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        {/* TITRE & SLOGAN */}
                        <h2 className="text-4xl font-black mb-3 leading-tight font-serif text-center">
                            {mfaRequired
                                ? <>Sécurité<br />renforcée</>
                                : isLogin
                                    ? <>Vos créations<br />vous attendent</>
                                    : <>L'artisanat,<br />réinventé</>}
                        </h2>
                        <p className="text-base opacity-75 text-center mb-10 leading-relaxed">
                            {mfaRequired
                                ? 'Vérifiez votre identité avec le code envoyé par email pour finaliser la connexion.'
                                : isLogin
                                    ? 'Retrouvez vos favoris, suivez vos commandes et découvrez de nouvelles créations.'
                                    : 'Des pièces artisanales authentiques, livrées directement chez vous en Suisse.'}
                        </p>

                        {/* VALEURS */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: <FiGift    className="w-5 h-5" />, titre: 'Fait main',            desc: 'Savoir-faire ancestral' },
                                { icon: <FiStar    className="w-5 h-5" />, titre: 'Sélection curatée',    desc: 'Qualité certifiée'     },
                                { icon: <FiPackage className="w-5 h-5" />, titre: 'Livraison en Suisse',  desc: 'Partout en Suisse'     },
                                { icon: <FiShield  className="w-5 h-5" />, titre: 'Paiement sécurisé',    desc: 'Données protégées'     },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-2 p-4 rounded-2xl"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.15)'
                                    }}
                                >
                                    <div
                                        className="p-2 rounded-xl w-fit"
                                        style={{ background: 'rgba(255,255,255,0.15)' }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm leading-tight">{item.titre}</p>
                                        <p className="text-xs opacity-65 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── BAS — slogan final ── */}
                    <div
                        className="relative z-10 pt-6 text-center"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        <p className="text-xs opacity-50 mt-1 tracking-widest uppercase">
                            GOFFA · Artisanat · Suisse
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Auth;