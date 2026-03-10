import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdVerified } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import API from '../../services/api';

const Producers = () => {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Charger les fournisseurs depuis l'API
    useEffect(() => {
        const fetchFournisseurs = async () => {
            try {
                const res = await API.get('/suppliers');
                setFournisseurs(res.data.suppliers);
            } catch (err) {
                setError("Erreur lors du chargement des fournisseurs");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFournisseurs();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
            <p className="text-emerald-600 font-bold text-lg animate-pulse">
                Chargement des fournisseurs...
            </p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
            <p className="text-red-500 font-bold">{error}</p>
        </div>
    );

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

                {/* ÉTAT VIDE */}
                {fournisseurs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏭</div>
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">
                            Aucun fournisseur trouvé
                        </h3>
                        <p className="text-black/50">Revenez bientôt !</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fournisseurs.map((fournisseur) => (
                            // ✅ Navigation via slug au lieu du nom encodé
                            <Link
                                key={fournisseur.id}
                                to={`/fournisseurs/${fournisseur.slug}`}
                                className="no-underline group"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.07)] border-2 border-transparent group-hover:border-emerald-500 group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300">

                                    {/* BANNIÈRE / IMAGE */}
                                    <div className="h-24 bg-gradient-to-br from-emerald-400 to-teal-500 relative">
                                        {/* ✅ Première image du fournisseur si elle existe */}
                                        {fournisseur.images?.[0]?.url && (
                                            <img
                                                src={fournisseur.images[0].url}
                                                alt={fournisseur.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>

                                    <div className="px-5 pb-5">
                                        {/* AVATAR + NOTE */}
                                        <div className="flex items-end justify-between -mt-1 mb-4">
                                            <div className="w-14 h-14 bg-white rounded-xl shadow-md flex items-center justify-center text-2xl border-4 border-white">
                                                🏭
                                            </div>
                                            {/* ✅ Note moyenne calculée depuis product_count */}
                                            {fournisseur.product_count > 0 && (
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full mb-1">
                                                    <FaStar size={12} className="text-yellow-400" />
                                                    <span className="text-xs font-bold text-yellow-700">
                                                        {fournisseur.product_count} produit{fournisseur.product_count > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* INFOS */}
                                        <h3 className="text-lg font-bold text-[#2c2c2c] mb-1 group-hover:text-emerald-600 transition-colors duration-200">
                                            {fournisseur.name}
                                        </h3>

                                        {/* ✅ Adresse depuis la BDD */}
                                        {fournisseur.address && (
                                            <p className="text-xs text-black/50 mb-3">
                                                📍 {fournisseur.address}
                                            </p>
                                        )}

                                        {/* ✅ Description depuis la BDD */}
                                        {fournisseur.description && (
                                            <p className="text-sm text-black/60 leading-relaxed mb-4 line-clamp-2">
                                                {fournisseur.description}
                                            </p>
                                        )}

                                        {/* ✅ Badge vérifié si website renseigné */}
                                        {fournisseur.website && (
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                    <MdVerified size={10} /> Vérifié
                                                </span>
                                                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                                                    🌐 Site web
                                                </span>
                                            </div>
                                        )}

                                        {/* FOOTER CARTE */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            {/* ✅ Contact depuis la BDD */}
                                            <span className="text-xs text-black/40 truncate max-w-[120px]">
                                                {fournisseur.contact || ''}
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
