import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const LoginSuccess = () => {
    const { loginSuccess } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleSuccess = async () => {
            await loginSuccess(); // ✅ récupère l'user depuis le cookie Google
            navigate('/');        // ✅ redirige vers l'accueil connecté
        };
        handleSuccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fef2f2 50%, #f0fdf4 100%)' }}>
            <div className="bg-white rounded-3xl p-12 text-center"
                style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>
                <div className="text-6xl mb-4 animate-spin inline-block">🌿</div>
                <h2 className="text-2xl font-black font-serif text-gray-900 mb-2">
                    Connexion en cours...
                </h2>
                <p className="text-gray-500 text-sm">
                    Veuillez patienter quelques secondes
                </p>
            </div>
        </div>
    );
};

export default LoginSuccess;