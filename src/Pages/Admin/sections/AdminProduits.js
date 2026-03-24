import { useState, useEffect } from 'react';
import { getAllProducts, deleteProduct } from '../../../services/adminService';
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';

const AdminProduits = () => {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchProduits = async () => {
        setLoading(true);
        try {
            const res = await getAllProducts({ search: search || undefined, page });
            setProduits(res.data.products);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProduits(); }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProduits();
    };

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            setProduits(prev => prev.filter(p => p.id !== id));
            setSuccessMsg('Produit supprimé avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setDeleteConfirm(null);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Produits</h2>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                    <FiPlus size={16} /> Nouveau produit
                </button>
            </div>

            {/* ALERTES */}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* RECHERCHE */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                    />
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-emerald-500 transition text-sm">
                    Rechercher
                </button>
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Produit</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Catégorie</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Producteur</th>
                                <th className="text-right px-5 py-4 font-bold text-[#2c2c2c]">Prix</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Stock</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produits.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-black/40">Aucun produit trouvé</td>
                                </tr>
                            ) : produits.map((produit) => (
                                <tr key={produit.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    {/* IMAGE + NOM */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                                                {produit.thumbnail?.[0]?.url ? (
                                                    <img src={produit.thumbnail[0].url} alt={produit.name_fr} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">🌿</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#2c2c2c] line-clamp-1">{produit.name_fr}</p>
                                                <p className="text-xs text-black/40">#{produit.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-black/60">{produit.category_name || '—'}</td>
                                    <td className="px-5 py-4 text-black/60">{produit.supplier_name || '—'}</td>
                                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                                        {produit.min_price ? formatPrice(parseFloat(produit.min_price)) : '—'}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            parseInt(produit.total_stock) > 10
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : parseInt(produit.total_stock) > 0
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {produit.total_stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            produit.is_active
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {produit.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                                <FiEdit size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(produit.id)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition ${
                                page === i + 1
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-black/50 hover:bg-emerald-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* MODAL CONFIRMATION SUPPRESSION */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer ce produit ?</h3>
                            <p className="text-black/50 text-sm mb-6">
                                Cette action est irréversible. Toutes les variantes seront supprimées.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProduits;