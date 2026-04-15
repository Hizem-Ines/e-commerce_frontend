import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { BsFillBasket3Fill, BsBoxSeam } from 'react-icons/bs';
import { useCart } from '../../../context/CartContext';

export default function CartSidebar() {
    const {
        panier,
        totalArticles,
        totalPrix,
        isOpen,
        fermerPanier,
        fermerPanierAvecDelai,
        ouvrirPanier,
        retirerDuPanier,
        changerQuantite,
        viderPanier,
    } = useCart();

    const navigate = useNavigate();

    const handleCheckout = () => {
        fermerPanier();
        navigate('/checkout');
    };

    return (
        <>
            {/* Overlay — cliquable pour fermer */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={fermerPanier}
            />

            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            {/* Sidebar */}
        
            <aside
                className={`fixed bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl
                    sm:top-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[400px] sm:rounded-none sm:max-h-none
                    ${isOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full sm:translate-y-0'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <BsFillBasket3Fill FiX size={16}/>
                        <h2 className="text-base font-semibold text-stone-800 tracking-tight">
                            Mon panier
                        </h2>
                        {totalArticles > 0 && (
                            <span className="bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {totalArticles}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={fermerPanier}
                        className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700"
                        aria-label="Fermer"
                    >
                        <FiX FiX size={16} />
                    </button>
                </div>

                {/* Liste articles */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 overscroll-contain">
                    {panier.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400 py-16">
                            <BsBoxSeam FiX size={16}/>
                            <p className="text-sm">Votre panier est vide</p>
                            <button
                                onClick={fermerPanier}
                                className="text-amber-600 text-sm font-medium hover:underline"
                            >
                                Continuer mes achats →
                            </button>
                        </div>
                    ) : (
                        panier.map((item) => (
                            <div
                                key={item.variant_id}
                                className="flex gap-3 items-start bg-stone-50 rounded-xl p-3 group"
                            >
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BsFillBasket3Fill FiX size={16}/>
                                        </div>
                                    )}
                                </div>

                                {/* Infos */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-stone-800 truncate">
                                        {item.product_name}
                                    </p>
                                    {item.attributes && (
                                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                                            {Object.values(item.attributes).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-amber-600 mt-1">
                                        {(parseFloat(item.price) * item.quantity).toFixed(2)} TND
                                    </p>

                                    {/* Quantité */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => changerQuantite(item.variant_id, item.quantity - 1)}
                                            className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center hover:bg-stone-200 transition-colors"
                                        >
                                            <FiMinus FiX size={16} />
                                        </button>
                                        <span className="text-sm font-semibold text-stone-700 w-5 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => changerQuantite(item.variant_id, item.quantity + 1)}
                                            className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center hover:bg-stone-200 transition-colors"
                                        >
                                            <FiPlus FiX size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Supprimer */}
                                <button
                                    onClick={() => retirerDuPanier(item.variant_id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                                    aria-label="Supprimer"
                                >
                                    <FiTrash2 FiX size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {panier.length > 0 && (
                    <div className="border-t border-stone-100 px-6 py-5 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-stone-500">Sous-total</span>
                            <span className="text-base font-bold text-stone-800">
                                {totalPrix.toFixed(2)} TND
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                            Passer la commande
                        </button>
                        <button
                            onClick={viderPanier}
                            className="w-full text-stone-400 hover:text-red-500 text-xs font-medium transition-colors py-1"
                        >
                            Vider le panier
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}