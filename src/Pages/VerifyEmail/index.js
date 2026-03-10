import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../services/authService';
import { useAuth } from '../../context/authContext';

const VerifyEmail = () => {
    const { token } = useParams();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
    const verify = async () => {
        try {
            await verifyEmail(token);
            setStatus('success');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Lien invalide ou expiré');
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
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg">
                        <span className="text-2xl">🧺</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-emerald-600 tracking-widest font-serif">GOFFA</h1>
                        <p className="text-xs text-emerald-500 font-semibold tracking-wider">artisanat tunisien</p>
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
                            Votre compte est activé. Vous allez être redirigé vers l'accueil...
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                            <div className="bg-emerald-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                        <Link
                            to="/"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl no-underline transition-all duration-300 inline-block"
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
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl no-underline transition-all duration-300 inline-block"
                            >
                                Se connecter
                            </Link>
                            <Link
                                to="/"
                                className="text-emerald-600 hover:underline font-semibold text-sm no-underline"
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