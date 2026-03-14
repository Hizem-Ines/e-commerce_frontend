import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

const CompleteAccount = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas !');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post(`/auth/complete-account/${token}`, {
                password:        formData.password,
                confirmPassword: formData.confirmPassword,
            });
            await loginSuccess(); // ✅ connecte automatiquement
            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lien invalide ou expiré');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fef2f2 50%, #f0fdf4 100%)' }}>
            <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center"
                style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>

                {/* LOGO */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8 no-underline">
                    <div className="relative p-3 rounded-2xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <span className="text-2xl">🧺</span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                            style={{ background: '#e63946' }}></span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-widest font-serif" style={{ color: '#166534' }}>
                            GOF<span style={{ color: '#e63946' }}>FA</span>
                        </h1>
                        <p className="text-xs font-semibold tracking-wider" style={{ color: '#4ade80' }}>artisanat tunisien</p>
                    </div>
                </Link>

                {!success ? (
                    <>
                        <div className="text-5xl mb-4">🔐</div>
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                            Créez votre mot de passe
                        </h2>
                        <p className="text-gray-500 text-sm mb-8">
                            Votre compte a été créé lors de votre commande. Définissez un mot de passe pour accéder à votre espace.
                        </p>

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-left"
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                ❌ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#e63946' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-3 rounded-xl text-sm transition focus:outline-none"
                                        style={{ border: '2px solid #e5e7eb' }}
                                        onFocus={e => e.target.style.borderColor = '#166534'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                        required minLength={6}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#e63946' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition focus:outline-none"
                                        style={{ border: '2px solid #e5e7eb' }}
                                        onFocus={e => e.target.style.borderColor = '#166534'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                style={{
                                    background: 'linear-gradient(135deg, #166534, #15803d)',
                                    boxShadow: '0 4px 20px rgba(22, 101, 52, 0.4)'
                                }}>
                                {loading ? 'Création en cours...' : 'Créer mon mot de passe →'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                            Compte activé !
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Votre mot de passe a été créé. Vous êtes maintenant connecté(e) !
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div className="h-2 rounded-full animate-pulse" style={{ width: '100%', background: '#166534' }}></div>
                        </div>
                        <Link to="/"
                            className="inline-block text-white font-bold px-8 py-3 rounded-xl no-underline transition hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                            Aller à l'accueil →
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompleteAccount;