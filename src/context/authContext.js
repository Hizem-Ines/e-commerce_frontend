import { createContext, useContext, useState, useEffect } from 'react';
import {
    getMe,
    login as loginService,
    logout as logoutService,
    register as registerService,
    verifyMfa as verifyMfaService,
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMe()
            .then(res => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (data) => {
        const res = await loginService(data);
        // MFA required → don't set user yet, return the response for the caller to handle
        if (res.data.mfaRequired) return res;
        // Direct login (shouldn't happen with current backend, but safe fallback)
        setUser(res.data.user);
        return res;
    };

    const verifyMfaLogin = async ({ mfaSessionToken, otp }) => {
        const res = await verifyMfaService({ mfaSessionToken, otp });
        setUser(res.data.user);
        return res;
    };

    const register = async (data) => {
        const res = await registerService(data);
        return res;
    };

    const logout = async () => {
        await logoutService();
        setUser(null);
    };

    // Clears local state only — does NOT call the API (no cookie clearing)
    const localLogout = () => {
        setUser(null);
    };

    // Utilisé après Google OAuth pour récupérer l'utilisateur connecté
    const loginSuccess = async () => {
        try {
            const res = await getMe();
            setUser(res.data.user);
        } catch {
            setUser(null);
        }
    };

    return (
       <AuthContext.Provider value={{ user, loading, login, verifyMfaLogin, register, logout, localLogout, loginSuccess }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);