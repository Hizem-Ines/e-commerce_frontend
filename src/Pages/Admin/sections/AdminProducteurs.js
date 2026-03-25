import { useState, useEffect } from 'react';
import { getAllSuppliers, deleteSupplier } from '../../../services/adminService';
import { FiTrash2, FiPlus, FiSearch, FiEdit } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

const AdminProducteurs = () => {
    const [producteurs, setProducteurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', address: '', contact: '', website: '' });
    const [formLoading, setFormLoading] = useState(false);

    const fetchProducteurs = async () => {
        setLoading(true);
        try {
            const res = await getAllSuppliers();
            setProducteurs(res.data.suppliers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducteurs(); }, []);

    const filtered = producteurs.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.address || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id) => {
        try {
            await deleteSupplier(id);
            setProducteurs(prev => prev.filter(p => p.id !== id));
            setSuccessMsg('Producteur supprimé avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const { default: api } = await import('../../../services/api');
            await api.post('/suppliers', formData);
            setSuccessMsg('Producteur créé avec succès.');
            setShowForm(false);
            setFormData({ name: '', description: '', address: '', contact: '', website: '' });
            fetchProducteurs();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la création.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Producteurs</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                    <FiPlus size={16} /> Nouveau producteur
                </button>
            </div>

            {/* ALERTES */}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* RECHERCHE */}
            <div className="relative mb-6">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un producteur..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                />
            </div>

            {/* GRILLE */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-4xl animate-spin">🌿</div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-black/40">Aucun producteur trouvé</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.07)]">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {p.images?.[0]?.url
                                            ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                                            : <span className="text-xl">🌿</span>
                                        }
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#2c2c2c] text-sm">{p.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                                            <MdVerified size={12} /> Vérifié
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                        <FiEdit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(p.id)}
                                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            {p.address && <p className="text-xs text-black/50 mb-2">📍 {p.address}</p>}
                            {p.contact && <p className="text-xs text-black/50 mb-2">📞 {p.contact}</p>}
                            {p.description && (
                                <p className="text-xs text-black/60 line-clamp-2 mb-3">{p.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-xs text-black/40">{p.product_count || 0} produits</span>
                                <span className="text-xs font-bold text-emerald-600">{p.slug}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CRÉATION */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#2c2c2c]">Nouveau producteur</h3>
                            <button onClick={() => setShowForm(false)} className="text-black/40 hover:text-black text-2xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateSupplier} className="space-y-4">
                            {[
                                { label: 'Nom *', key: 'name', placeholder: 'Nom du producteur', required: true },
                                { label: 'Adresse', key: 'address', placeholder: 'Ville, Tunisie' },
                                { label: 'Contact', key: 'contact', placeholder: '+216 XX XXX XXX' },
                                { label: 'Site web', key: 'website', placeholder: 'https://...' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{field.label}</label>
                                    <input
                                        type="text"
                                        value={formData[field.key]}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Description du producteur..."
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                                >
                                    {formLoading ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SUPPRESSION */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer ce producteur ?</h3>
                        <p className="text-black/50 text-sm mb-6">Les produits liés seront dissociés.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition">Annuler</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducteurs;