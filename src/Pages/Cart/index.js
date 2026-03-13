import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/authContext';

const Cart = () => {
    const { panier, retirerDuPanier, changerQuantite, viderPanier, totalArticles, totalPrix, loading } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // ── Panier vide ──────────────────────────────────────
    if (!loading && panier.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-4">
                <div className="text-8xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold font-serif text-[#2c2c2c] mb-3">
                    Votre panier est vide
                </h2>
                <p className="text-black/50 mb-8 text-center">
                    Découvrez nos produits artisanaux et ajoutez-les à votre panier
                </p>
                <Link to="/produits"
                    className="text-white font-bold px-8 py-3 rounded-full transition-colors duration-300 no-underline"
                    style={{ background: '#166534' }}>
                    Continuer mes achats
                </Link>
            </div>
        );
    }

    // ── Loading ──────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-[#fdf6ec]">
                <div className="text-4xl animate-spin">🌿</div>
            </div>
        );
    }

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-1">
                        Mon Panier
                    </h1>
                    <p className="text-black/50">
                        {totalArticles} article{totalArticles > 1 ? 's' : ''} dans votre panier
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LISTE PRODUITS */}
                    <div className="lg:col-span-2 space-y-4">
                        {panier.map((item) => {
                            // Support both API format and local format
                            const image    = item.images?.[0] || item.image || '🧺';
                            const nom      = item.product_name || item.nom;
                            const prix     = parseFloat(item.price || item.prix || 0);
                            const quantite = item.quantity || item.quantite || 1;
                            const itemId   = item.id;

                            return (
                                <div key={itemId}
                                    className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)] flex items-center gap-5">

                                    {/* IMAGE */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                        style={{ background: '#ecfdf5' }}>
                                        {typeof image === 'string' && image.startsWith('http') ? (
                                            <img src={image} alt={nom} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl">{image}</span>
                                        )}
                                    </div>

                                    {/* INFOS */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#2c2c2c] mb-1">{nom}</h3>

                                        {/* Attributs (couleur, taille, etc.) */}
                                        {item.attributes && item.attributes.length > 0 && (
                                            <p className="text-xs text-black/40 mb-2">
                                                {item.attributes.map(a => `${a.attribute_type}: ${a.attribute_value}`).join(' — ')}
                                            </p>
                                        )}

                                        {/* QUANTITÉ */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => changerQuantite(itemId, quantite - 1)}
                                                className="w-8 h-8 rounded-full font-bold transition-colors duration-200 flex items-center justify-center"
                                                style={{ border: '2px solid #166534', color: '#166534' }}
                                                onMouseEnter={e => { e.target.style.background = '#166534'; e.target.style.color = 'white'; }}
                                                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#166534'; }}
                                            >−</button>
                                            <span className="font-bold text-[#2c2c2c] w-6 text-center">{quantite}</span>
                                            <button
                                                onClick={() => changerQuantite(itemId, quantite + 1)}
                                                className="w-8 h-8 rounded-full font-bold transition-colors duration-200 flex items-center justify-center"
                                                style={{ border: '2px solid #166634', color: '#166634' }}
                                                onMouseEnter={e => { e.target.style.background = '#166834'; e.target.style.color = 'white'; }}
                                                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#166834'; }}
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* PRIX + SUPPRIMER */}
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <span className="text-xl font-extrabold" style={{ color: '#166534' }}>
                                            {(prix * quantite).toFixed(2)} DT
                                        </span>
                                        <button
                                            onClick={() => retirerDuPanier(itemId)}
                                            className="text-xs text-red-400 hover:text-red-600 transition-colors duration-200"
                                        >
                                            🗑 Supprimer
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* VIDER LE PANIER */}
                        <button onClick={viderPanier}
                            className="text-sm text-red-400 hover:text-red-600 font-semibold transition-colors duration-200">
                            🗑 Vider le panier
                        </button>
                    </div>

                    {/* RÉSUMÉ COMMANDE */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.07)] sticky top-4">
                            <h2 className="text-xl font-bold font-serif text-[#2c2c2c] mb-6">
                                Résumé de la commande
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-black/60">
                                    <span>Sous-total ({totalArticles} articles)</span>
                                    <span>{totalPrix.toFixed(2)} DT</span>
                                </div>
                                <div className="flex justify-between text-sm text-black/60">
                                    <span>Livraison</span>
                                    <span className="font-semibold" style={{ color: '#166534' }}>Gratuite</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-lg text-[#2c2c2c]">
                                    <span>Total</span>
                                    <span style={{ color: '#166534' }}>{totalPrix.toFixed(2)} DT</span>
                                </div>
                            </div>

                            {/* BOUTON COMMANDER */}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        navigate('/connexion');
                                    } else {
                                        navigate('/checkout');
                                    }
                                }}
                                className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 text-base mb-3 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #166534, #15803d)',
                                    boxShadow: '0 4px 20px rgba(22,101,52,0.4)'
                                }}
                            >
                                {user ? 'Commander maintenant →' : 'Se connecter pour commander →'}
                            </button>

                            <Link to="/produits"
                                className="block text-center text-sm text-black/50 hover:text-[#166534] transition-colors duration-200 no-underline">
                                ← Continuer mes achats
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;