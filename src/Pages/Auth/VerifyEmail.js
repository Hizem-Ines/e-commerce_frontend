import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../services/authService';
import { useAuth } from '../../context/authContext';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth(); // ✅ récupère l'user après vérification
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const verify = async () => {
            try {
                await verifyEmail(decodeURIComponent(token));
                await loginSuccess(); // ✅ met à jour l'user dans le context → connecté automatiquement
                setStatus('success');
                setTimeout(() => navigate('/'), 3000);
            } catch (err) {
                const msg = err.response?.data?.message || '';

                if (msg.toLowerCase().includes('déjà vérifié')) {
                    setStatus('success');
                    setTimeout(() => navigate('/'), 2000);
                    return;
                }

                setStatus('error');
                setMessage(msg || 'Lien invalide ou expiré');
            }
        };

        verify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">

                {/* LOGO */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8 no-underline">
                    <div className="bg-gradient-to-br from-[#2d5a27] to-teal-600 p-3 rounded-2xl shadow-lg">
                        <span className="text-2xl">🧺</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#2d5a27] tracking-widest font-serif">GOFFA</h1>
                        <p className="text-xs text-[#4a8c42]  font-semibold tracking-wider">artisanat tunisien</p>
                    </div>
                </Link>

                {/* LOADING */}
                {status === 'loading' && (
                    <div>
                        <div className="text-6xl mb-4 animate-spin inline-block">🌿</div>
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                            Vérification en cours...
                        </h2>
                        <p className="text-black/50 text-sm">
                            Veuillez patienter quelques secondes
                        </p>
                    </div>
                )}

                {/* SUCCESS */}
                {status === 'success' && (
                    <div>
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                            Email vérifié !
                        </h2>
                        <p className="text-black/50 text-sm mb-6">
                            Votre compte est activé. Vous êtes maintenant connecté(e) !
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div className="bg-[#2d5a27] h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                        <Link
                            to="/"
                            className="bg-[#2d5a27] hover:bg-[#4a8c42]  text-white font-bold px-8 py-3 rounded-xl no-underline transition-all duration-300 inline-block"
                        >
                            Aller à l'accueil →
                        </Link>
                    </div>
                )}

                {/* ERROR */}
                {status === 'error' && (
                    <div>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold font-serif text-[#2c2c2c] mb-2">
                            Lien invalide
                        </h2>
                        <p className="text-black/50 text-sm mb-6">
                            {message}
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/connexion"
                                className="bg-[#2d5a27] hover:bg-[#4a8c42]  text-white font-bold px-8 py-3 rounded-xl no-underline transition-all duration-300 inline-block"
                            >
                                Se connecter
                            </Link>
                            <Link
                                to="/"
                                className="text-[#2d5a27] hover:underline font-semibold text-sm no-underline"
                            >
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;