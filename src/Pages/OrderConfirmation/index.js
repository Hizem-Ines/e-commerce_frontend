import { useLocation, useParams, Link } from 'react-router-dom';
import { FiPackage, FiMapPin, FiCreditCard, FiHome } from 'react-icons/fi';

const OrderConfirmation = () => {
    const { state } = useLocation();
    const order = state?.order;

    return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">

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

                {/* ICÔNE SUCCÈS */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#dcfce7' }}>
                    <span className="text-4xl">✅</span>
                </div>

                <h2 className="text-3xl font-black font-serif text-[#2c2c2c] mb-2">
                    Commande confirmée !
                </h2>
                <p className="text-black/50 text-sm mb-8">
                    Merci pour votre commande. Vous recevrez un email de confirmation.
                </p>

                {/* DÉTAILS COMMANDE */}
                {order && (
                    <div className="rounded-2xl p-5 mb-8 text-left space-y-4"
                        style={{ background: '#f9f5f0' }}>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: '#dcfce7' }}>
                                <FiPackage style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Numéro de commande</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">#{order.id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: '#dcfce7' }}>
                                <FiMapPin style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Livraison à</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">
                                    {order.shipping_address}, {order.shipping_city}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: '#dcfce7' }}>
                                <FiCreditCard style={{ color: '#166534' }} size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-black/40">Paiement</p>
                                <p className="font-bold text-sm text-[#2c2c2c]">
                                    {order.payment_method === 'cod'    ? '💵 Paiement à la livraison' :
                                     order.payment_method === 'stripe' ? '💳 Carte bancaire' : order.payment_method}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                            <span className="font-bold text-[#2c2c2c]">Total payé</span>
                            <span className="text-xl font-black" style={{ color: '#166534' }}>
                                {parseFloat(order.total_price).toFixed(2)} DT
                            </span>
                        </div>
                    </div>
                )}

                {/* NOTICE GUEST */}
                {!order?.user_id && (
                    <div className="rounded-xl p-4 mb-6 text-sm"
                        style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                        <p className="font-bold text-yellow-800 mb-1">📧 Vérifiez votre email !</p>
                        <p className="text-yellow-700 text-xs">
                            Un compte a été créé pour vous. Consultez votre email pour définir votre mot de passe et suivre vos commandes.
                        </p>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex flex-col gap-3">
                    <Link to="/"
                        className="flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl no-underline transition hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <FiHome size={16} /> Retour à l'accueil
                    </Link>
                    <Link to="/produits"
                        className="text-sm font-semibold no-underline hover:underline"
                        style={{ color: '#166534' }}>
                        Continuer mes achats →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;