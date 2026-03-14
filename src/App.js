import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './Components/layout/Layout';
import Home from './Pages/Home';
import Cart from './Pages/Cart';
import NotFound from './Pages/NotFound';
import Products from './Pages/Products';
import ProductDetail from './Pages/ProductDetail';
import Wishlist from './Pages/Wishlist';
import Producers from './Pages/Producers';
import ProducerDetail from './Pages/ProducerDetail';
import Auth from './Pages/Auth';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/authContext';
import Profile from './Pages/Profile';
import VerifyEmail from './Pages/Auth/VerifyEmail'
import ForgotPassword from './Pages/Auth/Forgotpassword';
import ResetPassword  from './Pages/Auth/Resetpassword';
import LoginSuccess from './Pages/Auth/LoginSuccess';
import Checkout from './Pages/Checkout';
import OrderConfirmation from './Pages/OrderConfirmation';
import CompleteAccount from './Pages/Auth/CompleteAccount';
import OrderDetail from './Pages/OrderDetail';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <Routes>
                            <Route path="/connexion" element={<Auth />} />
                            <Route path="/verify-email/:token" element={<VerifyEmail />} />
                            <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} /> 
                            <Route path="/reset-password/:token" element={<ResetPassword />} /> 
                            <Route path="/login/success" element={<LoginSuccess />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/commande-confirmee/:orderId" element={<OrderConfirmation />} />
                            <Route path="/complete-account/:token" element={<CompleteAccount />} />
                            <Route element={<Layout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/produits" element={<Products />} />
                                <Route path="/produits/:id" element={<ProductDetail />} />
                                <Route path="/panier" element={<Cart />} />
                                <Route path="/favoris" element={<Wishlist />} />
                                <Route path="/producteurs" element={<Producers />} />
                                <Route path="/producteurs/:nom" element={<ProducerDetail />} />
                                <Route path="/profil" element={<Profile />} />
                                <Route path="/commandes/:orderId" element={<OrderDetail />} />
                                <Route path="*" element={<NotFound />} />
                            </Route>
                        </Routes>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;