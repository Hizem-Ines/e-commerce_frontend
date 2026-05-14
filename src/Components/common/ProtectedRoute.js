import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen bg-[#f9f5f0] flex items-center justify-center">
            <div className="text-4xl animate-spin">🌿</div>
        </div>
    );

    if (!user) return <Navigate to="/connexion" replace />;
    if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;