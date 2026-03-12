import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
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
            await resetPassword(token, { password: formData.password });
            setSuccess(true);
            setTimeout(() => navigate('/connexion'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue');
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
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                            Nouveau mot de passe
                        </h2>
                        <p className="text-gray-500 text-sm mb-8">
                            Choisissez un mot de passe sécurisé d'au moins 6 caractères.
                        </p>

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                ❌ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nouveau mot de passe</label>
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
                                        required
                                        minLength={6}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirmer le mot de passe</label>
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
                                }}
                            >
                                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe →'}
                            </button>
                        </form>

                        <Link to="/connexion"
                            className="flex items-center justify-center gap-2 mt-6 text-sm font-semibold no-underline hover:underline"
                            style={{ color: '#166534' }}>
                            <FiArrowLeft size={14} /> Retour à la connexion
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                            Mot de passe modifié !
                        </h2>
                        <p className="text-gray-500 text-sm mb-2">
                            Votre mot de passe a été réinitialisé avec succès.
                        </p>
                        <p className="text-xs mb-6" style={{ color: '#166534' }}>
                            Vous allez être redirigé vers la connexion...
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div className="h-2 rounded-full animate-pulse" style={{ width: '100%', background: '#166534' }}></div>
                        </div>
                        <Link to="/connexion"
                            className="inline-block text-white font-bold px-8 py-3 rounded-xl no-underline transition-all duration-300 hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                            Se connecter →
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;