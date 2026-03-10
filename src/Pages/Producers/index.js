import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSuppliers } from '../../services/suplierService';
import { MdVerified } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';

const Producers = () => {
    const [producteurs, setProducteurs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllSuppliers()
            .then(res => setProducteurs(res.data.suppliers))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdf6ec]">
                <div className="text-6xl animate-spin mb-4">🌿</div>
                <p className="text-black/50 font-semibold">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#fdf6ec] min-h-screen py-12">
            <div className="container mx-auto px-4">

                {/* TITRE */}
                <div className="text-center mb-12">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-3">
                        🌱 NOS PRODUCTEURS
                    </span>
                    <h1 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-2">
                        Rencontrez nos Artisans
                    </h1>
                    <p className="text-black/50 max-w-xl mx-auto">
                        Des producteurs passionnés qui cultivent et fabriquent avec amour les meilleurs produits de Tunisie
                    </p>
                </div>

                {producteurs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🌿</div>
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Aucun producteur pour le moment</h3>
                        <p className="text-black/50">Revenez bientôt !</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {producteurs.map((producteur) => (
                            <Link
                                key={producteur.id}
                                to={`/producteurs/${producteur.slug || producteur.id}`}
                                className="no-underline group"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent group-hover:border-emerald-500 group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300">
                                    <div className="px-5 pb-5 pt-5">

                                        {/* AVATAR + NOTE */}
                                        <div className="flex items-end justify-between mb-4">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-xl shadow-md flex items-center justify-center border-2 border-emerald-100 overflow-hidden">
                                                {producteur.images?.[0]?.url ? (
                                                    <img
                                                        src={producteur.images[0].url}
                                                        alt={producteur.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">🌿</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                                                <FaStar size={12} className="text-yellow-400" />
                                                <span className="text-xs font-bold text-yellow-700">
                                                    {producteur.product_count || 0} produits
                                                </span>
                                            </div>
                                        </div>

                                        {/* INFOS */}
                                        <h3 className="text-lg font-bold text-[#2c2c2c] mb-1 group-hover:text-emerald-600 transition-colors duration-200">
                                            {producteur.name}
                                        </h3>
                                        {producteur.address && (
                                            <p className="text-xs text-black/50 mb-3">
                                                📍 {producteur.address}
                                            </p>
                                        )}
                                        {producteur.description && (
                                            <p className="text-sm text-black/60 leading-relaxed mb-4 line-clamp-2">
                                                {producteur.description}
                                            </p>
                                        )}

                                        {/* CONTACT */}
                                        {producteur.contact && (
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                    <MdVerified size={10} /> Vérifié
                                                </span>
                                            </div>
                                        )}

                                        {/* STATS */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <span className="text-xs text-black/40">
                                                {producteur.product_count || 0} produits
                                            </span>
                                            <span className="bg-emerald-600 group-hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-300">
                                                Voir le profil →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Producers;