import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiTrash2, FiPlus, FiEdit } from 'react-icons/fi';
import CategoryImageUpload from '../../../Components/admin/CategoryImageUpload';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);       // flat list of ALL categories
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ name_fr: '', name_ar: '', parent_id: '' });
    const [formLoading, setFormLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories');

            const roots = res.data.categories;
const flat = [];
roots.forEach(root => {
    const { children, ...rootData } = root;

    // Sum product counts from all children
    const totalProducts = (children || []).reduce(
        (sum, child) => sum + (parseInt(child.product_count) || 0),
        0
    );

    flat.push({
        ...rootData,
        product_count: totalProducts, // ← sum of children's products
        images: typeof rootData.images === 'string'
            ? JSON.parse(rootData.images)
            : rootData.images ?? [],
    });

    if (children?.length > 0) {
        children.forEach(child => flat.push({
            ...child,
            product_count: parseInt(child.product_count) || 0, // ← own products
            images: typeof child.images === 'string'
                ? JSON.parse(child.images)
                : child.images ?? [],
        }));
    }
});
setCategories(flat);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    // These now work correctly because the list is flat
    const parentCategories = categories.filter(c => !c.parent_id);
    const subCategories    = categories.filter(c =>  c.parent_id);

    // ✅ FIX 3: Called by CategoryImageUpload after a successful image save
    // Updates just that one category in state without re-fetching everything
    const handleCategoryUpdated = (updatedCategory) => {
        setCategories(prev =>
            prev.map(c => c.id === updatedCategory.id ? {
                ...updatedCategory,
                // parse images if backend returns it as a string
                images: typeof updatedCategory.images === 'string'
                    ? JSON.parse(updatedCategory.images)
                    : updatedCategory.images ?? []
            } : c)
        );
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            setCategories(prev => prev.filter(c => c.id !== id));
            setSuccessMsg('Catégorie supprimée avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (editItem) {
                await api.put(`/categories/${editItem.id}`, formData);
                setSuccessMsg('Catégorie mise à jour.');
            } else {
                await api.post('/categories', formData);
                setSuccessMsg('Catégorie créée avec succès.');
            }
            setShowForm(false);
            setEditItem(null);
            setFormData({ name_fr: '', name_ar: '', parent_id: '' });
            fetchCategories();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setEditItem(cat);
        setFormData({ name_fr: cat.name_fr, name_ar: cat.name_ar || '', parent_id: cat.parent_id || '' });
        setShowForm(true);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Catégories</h2>
                <button
                    onClick={() => { setShowForm(true); setEditItem(null); setFormData({ name_fr: '', name_ar: '', parent_id: '' }); }}
                    className="flex items-center gap-2 bg-[#2d5a27] hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                    <FiPlus size={16} /> Nouvelle catégorie
                </button>
            </div>

            {/* ALERTES */}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg   && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-4xl animate-spin">🌿</div>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ── CATÉGORIES PRINCIPALES ─────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-[#f9f5f0]">
                            <h3 className="font-bold text-[#2c2c2c]">Catégories principales ({parentCategories.length})</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                
                                    <th className="text-left px-5 py-3 font-bold text-black/50">Image</th>
                                    <th className="text-left px-5 py-3 font-bold text-black/50">Nom (FR)</th>
                                    <th className="text-left px-5 py-3 font-bold text-black/50">Slug</th>
                                    <th className="text-center px-5 py-3 font-bold text-black/50">Produits</th>
                                    <th className="text-center px-5 py-3 font-bold text-black/50">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parentCategories.map(cat => (
                                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">

                                        {/* ✅ FIX 2: Show image + upload component inline */}
                                        <td className="px-5 py-3">
                                            <CategoryImageUpload
                                                category={cat}
                                                onUpdated={handleCategoryUpdated}
                                            />
                                        </td>

                                        <td className="px-5 py-4 font-bold text-[#2c2c2c]">{cat.name_fr}</td>
                                        <td className="px-5 py-4 text-black/40 text-xs font-mono">{cat.slug}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                                                {cat.product_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(cat)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                                    <FiEdit size={14} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── SOUS-CATÉGORIES ────────────────────────────────── */}
                    {subCategories.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-[#f9f5f0]">
                                <h3 className="font-bold text-[#2c2c2c]">Sous-catégories ({subCategories.length})</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-5 py-3 font-bold text-black/50">Image</th>
                                        <th className="text-left px-5 py-3 font-bold text-black/50">Nom (FR)</th>
                                        <th className="text-left px-5 py-3 font-bold text-black/50">Catégorie parente</th>
                                        <th className="text-left px-5 py-3 font-bold text-black/50">Slug</th>
                                        <th className="text-center px-5 py-3 font-bold text-black/50">Produits</th>
                                        <th className="text-center px-5 py-3 font-bold text-black/50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subCategories.map(cat => (
                                        <tr key={cat.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                            <td className="px-5 py-3">
                                                <CategoryImageUpload
                                                    category={cat}
                                                    onUpdated={handleCategoryUpdated}
                                                />
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-[#2c2c2c]">{cat.name_fr}</td>
                                            <td className="px-5 py-4 text-black/60">
                                                {parentCategories.find(p => p.id === cat.parent_id)?.name_fr || '—'}
                                            </td>
                                            <td className="px-5 py-4 text-black/40 text-xs font-mono">{cat.slug}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                                                    {cat.product_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(cat)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-xl transition">
                                                        <FiEdit size={14} />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition">
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL FORMULAIRE */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#2c2c2c]">
                                {editItem ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-black/40 hover:text-black text-2xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom en français *</label>
                                <input
                                    type="text"
                                    value={formData.name_fr}
                                    onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                                    placeholder="Ex: Huiles & Olives"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom en arabe</label>
                                <input
                                    type="text"
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="الزيوت والزيتون"
                                    dir="rtl"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Catégorie parente</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                                >
                                    <option value="">Aucune (catégorie principale)</option>
                                    {parentCategories.map(p => (
                                        <option key={p.id} value={p.id}>{p.name_fr}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
                                    className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                                    Annuler
                                </button>
                                <button type="submit" disabled={formLoading}
                                    className="flex-1 bg-[#2d5a27] hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                                    {formLoading ? 'Sauvegarde...' : editItem ? 'Modifier' : 'Créer'}
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
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer cette catégorie ?</h3>
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

export default AdminCategories;