import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Layout from './Components/layout/Layout';
import Home from './Pages/Home';
import Cart from './Pages/Cart';
import NotFound from './Pages/NotFound';
import Products from './Pages/Products';
import Faq from './Pages/Faq';
import ProductDetail from './Pages/ProductDetail';
import Wishlist from './Pages/Wishlist';
import Producers from './Pages/Producers';
import ProducerDetail from './Pages/ProducerDetail';
import Auth from './Pages/Auth';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/authContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Profile from './Pages/Profile';
import VerifyEmail from './Pages/Auth/VerifyEmail';
import ForgotPassword from './Pages/Auth/Forgotpassword';
import ResetPassword from './Pages/Auth/Resetpassword';
import LoginSuccess from './Pages/Auth/LoginSuccess';
import Checkout from './Pages/Checkout';
import OrderConfirmation from './Pages/OrderConfirmation';
import CompleteAccount from './Pages/Auth/CompleteAccount';
import OrderDetail from './Pages/OrderDetail';
import Offres from './Pages/Offres';
import Reclamations from './Pages/Reclamations';
import Admin from './Pages/Admin';
import Recipes from './Pages/Recipes';
import RecipesDetail from './Pages/RecipesDetail';
import Unsubscribe from './Pages/Unsubscribe';
import CartSidebar from './Components/layout/CartSidebar';
import ScrollToTop from './Components/scrolltotop/ScrollToTop';
import Conseiller from './Pages/Conseiller';
import { connectWebSocket, disconnectWebSocket, addWSListener, removeWSListener } from './utils/websocket';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from './Components/common/ProtectedRoute';


// ══════════════════════════════════════════════════════════════
// TOAST CONFIG — tous les types WS
// ══════════════════════════════════════════════════════════════
const WS_TOAST_CONFIG = {
    // ── Commandes ──────────────────────────────────────────
    ORDER_CONFIRMED: {
        icon:    "✅",
        label:   (d) => `Commande #${d.order_number} confirmée`,
        bg:      "#dcfce7",
        color:   "#166534",
        border:  "#bbf7d0",
        link:    (d) => `/profil#commandes`,
    },
    ORDER_STATUS_UPDATE: {
        icon:    "📦",
        label:   (d) => `Commande #${d.order_number} — statut mis à jour`,
        bg:      "#dbeafe",
        color:   "#1d4ed8",
        border:  "#bfdbfe",
        link:    (d) => `/profil#commandes`,
    },
    ORDER_PAYMENT_FAILED: {
        icon:    "❌",
        label:   (d) => `Paiement échoué — commande #${d.order_number}`,
        bg:      "#fee2e2",
        color:   "#dc2626",
        border:  "#fecaca",
        link:    (d) => `/profil#commandes`,
    },
    ORDER_CANCELLED: {
        icon:    "🚫",
        label:   (d) => `Commande #${d.order_number} annulée`,
        bg:      "#f3f4f6",
        color:   "#374151",
        border:  "#e5e7eb",
        link:    (d) => `/profil#commandes`,
    },
    // ── Réclamations ───────────────────────────────────────
    RECLAMATION_UPDATE: {
        icon:    "📋",
        label:   (d) =>
            d.status === "resolue"  ? `Réclamation résolue ✅` :
            d.status === "rejetee"  ? `Réclamation rejetée` :
            d.status === "en_cours" ? `Réclamation en cours de traitement` :
            `Réclamation mise à jour`,
        bg:      "#f0fdf4",
        color:   "#166534",
        border:  "#bbf7d0",
        link:    (d) => `/profil#reclamations`,
    },
    NEW_RECLAMATION: {
        icon:      "📋",
        label:     (d) => `Nouvelle réclamation de ${d.user_name}`,
        bg:        "#fefce8",
        color:     "#854d0e",
        border:    "#fde68a",
        link:      () => `/admin#reclamations`,
        adminOnly: true,
    },
    // ── FAQ ────────────────────────────────────────────────
    NEW_FAQ_QUESTION: {
        icon:    "❓",
        label:   (d) => `Nouvelle question de ${d.user_name}`,
        bg:      "#fefce8",
        color:   "#854d0e",
        border:  "#fde68a",
        link:    (d) => `/admin#faq?tab=questions`,
        adminOnly: true,
    },
    // ── Compte ─────────────────────────────────────────────
    ACCOUNT_SUSPENDED: {
        icon:    "⚠️",
        label:   () => "Votre compte a été suspendu",
        bg:      "#fee2e2",
        color:   "#dc2626",
        border:  "#fecaca",
        link:    null,
    },
};

// ══════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ══════════════════════════════════════════════════════════════
const ToastItem = ({ toast, onClose }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (toast.link) navigate(toast.link);
        onClose(toast.id);
    };

    return (
        <div
            onClick={handleClick}
            style={{
                background:   toast.bg,
                color:        toast.color,
                border:       `1.5px solid ${toast.border}`,
            }}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg cursor-pointer
                       transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                       max-w-sm w-full"
        >
            <span className="text-lg shrink-0 mt-0.5">{toast.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug">{toast.label}</p>
                {toast.link && (
                    <p className="text-xs mt-0.5 underline opacity-60">Voir →</p>
                )}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(toast.id); }}
                className="shrink-0 opacity-40 hover:opacity-100 transition text-lg leading-none mt-0.5"
            >
                ×
            </button>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ══════════════════════════════════════════════════════════════
const ToastContainer = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onClose={onClose} />
                </div>
            ))}
        </div>,
        document.body
    );
};

// ══════════════════════════════════════════════════════════════
// WS CONNECTOR — gère connexion + toasts globaux
// ══════════════════════════════════════════════════════════════
function WSConnector({ onToast }) {
    const { user, localLogout } = useAuth();
    const navigate = useNavigate();
    const localLogoutRef = useRef(localLogout);
    const navigateRef = useRef(navigate);

    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    useEffect(() => {
        localLogoutRef.current = localLogout;
    }, [localLogout]);

    useEffect(() => {
        if (!user?.id) return;

        connectWebSocket(user.id, user.role === 'admin' ? 'admin' : 'user');
console.log('[WS connect]', user.id, user.role);
        addWSListener("app-global", (data) => {
            if (data.type === "ACCOUNT_SUSPENDED") {
                // Only logout if this message is for the currently logged-in user
                if (data.userId && String(data.userId) !== String(user?.id)) return;
                onToast(data);
                setTimeout(() => {
                    localLogoutRef.current();
                    navigateRef.current('/connexion');
                }, 3000);
                return;
            }

            onToast(data);
        });

        return () => {
            removeWSListener("app-global");
            disconnectWebSocket();
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

// ══════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════
export default function App() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((data) => {
        const config = WS_TOAST_CONFIG[data.type];
        if (!config) return;

        const toast = {
            id:     Date.now(),
            icon:   config.icon,
            label:  config.label(data),
            bg:     config.bg,
            color:  config.color,
            border: config.border,
            link:   config.link ? config.link(data) : null,
        };

        setToasts(prev => [toast, ...prev].slice(0, 5)); // max 5 toasts

        // Auto-dismiss après 5s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
                <WSConnector onToast={addToast} />
                <SiteSettingsProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <CartSidebar />
                            <ToastContainer toasts={toasts} onClose={removeToast} />
                            <Routes>
                                <Route path="/admin" element={
                                    <ProtectedRoute requiredRole="admin">
                                        <Admin />
                                    </ProtectedRoute>
                                } />
                                <Route path="/connexion" element={<Auth />} />
                                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                                <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                <Route path="/login/success" element={<LoginSuccess />} />
                                <Route path="/checkout" element={
                                    <ProtectedRoute>
                                        <Checkout />
                                    </ProtectedRoute>
                                } />
                                <Route path="/commande-confirmee/:orderId" element={<OrderConfirmation />} />
                                <Route path="/complete-account/:token" element={<CompleteAccount />} />
                                <Route element={<Layout />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/conseiller" element={<Conseiller />} />
                                    <Route path="/faq" element={<Faq />} />
                                    <Route path="/produits" element={<Products />} />
                                    <Route path="/produits/:id" element={<ProductDetail />} />
                                    <Route path="/panier" element={<Cart />} />
                                    <Route path="/favoris" element={<Wishlist />} />
                                    <Route path="/reclamations" element={<Reclamations />} />
                                    <Route path="/producteurs" element={<Producers />} />
                                    <Route path="/producteurs/:nom" element={<ProducerDetail />} />
                                    <Route path="/profil" element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/commandes/:orderId" element={
                                        <ProtectedRoute>
                                            <OrderDetail />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/offres" element={<Offres />} />
                                    <Route path="/recettes" element={<Recipes />} />
                                    <Route path="/recettes/:slug" element={<RecipesDetail />} />
                                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                                    <Route path="*" element={<NotFound />} />
                                </Route>
                            </Routes>
                        </WishlistProvider>
                    </CartProvider>
                </SiteSettingsProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}