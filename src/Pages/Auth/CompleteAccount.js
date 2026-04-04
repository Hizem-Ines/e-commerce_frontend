import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const CompleteAccount = () => {
    const { token }    = useParams();
    const navigate     = useNavigate();
    const { setUser }  = useAuth(); // pour connecter l'utilisateur après

    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword,    setShowPassword]    = useState(false);
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState('');
    const [success,         setSuccess]         = useState(false);

    // ── Validation mot de passe en temps réel ─────────────
    const rules = [
        { label: 'Au moins 6 caractères',         ok: password.length >= 6 },
        { label: 'Les deux mots de passe identiques', ok: password === confirmPassword && confirmPassword.length > 0 },
    ];
    const isValid = rules.every(r => r.ok);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError('');

        try {
            const res = await api.post(`/auth/complete-account/${token}`, {
                password,
                confirmPassword,
            });

            // Le backend appelle sendToken → le cookie JWT est posé automatiquement
            // On met à jour le contexte auth si possible
            if (res.data?.user && setUser) {
                setUser(res.data.user);
            }

            setSuccess(true);

            // Redirection vers home après 2 secondes
            setTimeout(() => navigate('/Home'), 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Lien invalide ou expiré. Veuillez repasser une commande.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (focused) => ({
        border: `2px solid ${focused ? '#166534' : '#e5e7eb'}`,
    });

    // ── Succès ────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: '#dcfce7' }}>
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                        Compte activé !
                    </h2>
                    <p className="text-black/50 text-sm mb-2">
                        Votre mot de passe a été défini. Vous êtes maintenant connecté.
                    </p>
                    <p className="text-xs text-black/30">Redirection vers vos page d'accueil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">

                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8 no-underline">
                    <div className="relative p-3 rounded-2xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <span className="text-2xl">🧺</span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                            style={{ background: '#e63946' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-widest font-serif" style={{ color: '#166534' }}>
                            GOF<span style={{ color: '#e63946' }}>FA</span>
                        </h1>
                        <p className="text-xs font-semibold tracking-wider" style={{ color: '#4ade80' }}>
                            artisanat tunisien
                        </p>
                    </div>
                </Link>

                {/* Titre */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: '#dcfce7' }}>
                        <FiLock size={24} style={{ color: '#166534' }} />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                        Créez votre mot de passe
                    </h2>
                    <p className="text-sm text-black/50">
                        Dernière étape pour accéder à votre compte et suivre vos commandes.
                    </p>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Mot de passe */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">
                            Nouveau mot de passe *
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Minimum 6 caractères"
                                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none transition"
                                style={inputStyle(false)}
                                onFocus={e  => (e.target.style.borderColor = '#166534')}
                                onBlur={e   => (e.target.style.borderColor = '#e5e7eb')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmer */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">
                            Confirmer le mot de passe *
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Répétez votre mot de passe"
                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition"
                                style={inputStyle(false)}
                                onFocus={e  => (e.target.style.borderColor = '#166534')}
                                onBlur={e   => (e.target.style.borderColor = '#e5e7eb')}
                            />
                        </div>
                    </div>

                    {/* Règles de validation */}
                    {password.length > 0 && (
                        <div className="rounded-xl p-3 space-y-1.5"
                            style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                            {rules.map((rule, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs transition-all">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                                        style={{
                                            background: rule.ok ? '#dcfce7' : '#f3f4f6',
                                            border: `1.5px solid ${rule.ok ? '#86efac' : '#e5e7eb'}`,
                                        }}>
                                        {rule.ok && <FiCheck size={9} style={{ color: '#166534' }} />}
                                    </div>
                                    <span style={{ color: rule.ok ? '#166534' : '#9ca3af' }}>
                                        {rule.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bouton */}
                    <button
                        type="submit"
                        disabled={loading || !isValid}
                        className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-base disabled:opacity-50 hover:scale-[1.02] mt-2"
                        style={{
                            background: 'linear-gradient(135deg, #166534, #15803d)',
                            boxShadow:  '0 4px 20px rgba(22,101,52,0.4)',
                        }}>
                        {loading ? '⏳ Activation...' : '🔐 Activer mon compte →'}
                    </button>
                </form>

                <p className="text-xs text-center text-black/30 mt-6">
                    Ce lien est valable 7 jours après votre commande.
                </p>
            </div>
        </div>
    );
};

export default CompleteAccount;