import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiSearch, FiTrash2, FiEdit, FiX, FiCheck } from 'react-icons/fi';

const AdminUtilisateurs = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // ── Edit modal state ─────────────────────────────────
    const [editUser, setEditUser] = useState(null); // user object being edited
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/users', { params: { search: search || undefined } });
            setUsers(res.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/auth/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            setSuccessMsg('Utilisateur supprimé avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/auth/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setSuccessMsg('Rôle mis à jour.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la mise à jour.');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    // ── Open edit modal ──────────────────────────────────
    const openEdit = (user) => {
        setEditUser(user);
        setEditForm({
            name:        user.name        || '',
            email:       user.email       || '',
            phone:       user.phone       || '',
            address:     user.address     || '',
            city:        user.city        || '',
            role:        user.role        || 'user',
            is_verified: user.is_verified ?? true,
            is_active:   user.is_active   ?? true,
            newPassword: '',
        });
    };

    const closeEdit = () => {
        setEditUser(null);
        setEditForm({});
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleEditSubmit = async () => {
        setEditLoading(true);
        try {
            const payload = { ...editForm };
            // Don't send empty password
            if (!payload.newPassword) delete payload.newPassword;

            const res = await api.put(`/auth/users/${editUser.id}`, payload);
            const updated = res.data.user;
            setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setSuccessMsg('Utilisateur mis à jour avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
            closeEdit();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la mise à jour.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Utilisateurs</h2>
                <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full">
                    {users.length} utilisateur{users.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* ALERTES */}
            {successMsg && <div className="bg-emerald-50 border border-#b6eac7 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* RECHERCHE */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42]  focus:outline-none text-sm transition"
                    />
                </div>
                <button type="submit" className="bg-[#2d5a27] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#4a8c42]  transition text-sm">
                    Rechercher
                </button>
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <table className="w-full text-sm min-w-[600px]">
                        <thead>
                            <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Utilisateur</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Email</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Rôle</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Vérifié</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Inscription</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-black/40">Aucun utilisateur trouvé</td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#2d5a27] font-black text-sm overflow-hidden shrink-0">
                                                {user.avatar
                                                    ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    : user.name?.[0]?.toUpperCase()
                                                }
                                            </div>
                                            <p className="font-bold text-[#2c2c2c]">{user.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-black/60">{user.email}</td>
                                    <td className="px-5 py-4 text-center">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`text-xs font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                                                user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            <option value="user">Client</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            user.is_verified
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {user.is_verified ? '✅ Oui' : '⏳ Non'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-black/50 text-xs">
                                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                                                title="Modifier"
                                            >
                                                <FiEdit size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                                                title="Supprimer"
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

            {/* ── MODAL SUPPRESSION ─────────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer cet utilisateur ?</h3>
                        <p className="text-black/50 text-sm mb-6">Cette action est irréversible.</p>
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
            )}

            {/* ── MODAL ÉDITION ─────────────────────────────── */}
            {editUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-100 bg-[#f9f5f0]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#2d5a27] font-black overflow-hidden shrink-0">
                                    {editUser.avatar
                                        ? <img src={editUser.avatar} alt={editUser.name} className="w-full h-full object-cover" />
                                        : editUser.name?.[0]?.toUpperCase()
                                    }
                                </div>
                                <div>
                                    <p className="font-bold text-[#2c2c2c] text-sm">{editUser.name}</p>
                                    <p className="text-xs text-black/40">{editUser.email}</p>
                                </div>
                            </div>
                            <button onClick={closeEdit} className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40">
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-4 sm:px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                            {/* Row : Nom + Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => handleEditChange('name', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => handleEditChange('email', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Row : Téléphone + Ville */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={e => handleEditChange('phone', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Ville</label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={e => handleEditChange('city', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Adresse */}
                            <div>
                                <label className="block text-xs font-bold text-black/50 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={e => handleEditChange('address', e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                />
                            </div>

                            {/* Row : Rôle + Statuts */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Rôle</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => handleEditChange('role', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition bg-white"
                                    >
                                        <option value="user">Client</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Email vérifié</label>
                                    <select
                                        value={editForm.is_verified ? 'true' : 'false'}
                                        onChange={e => handleEditChange('is_verified', e.target.value === 'true')}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition bg-white"
                                    >
                                        <option value="true">✅ Oui</option>
                                        <option value="false">⏳ Non</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-black/50 mb-1">Compte actif</label>
                                    <select
                                        value={editForm.is_active ? 'true' : 'false'}
                                        onChange={e => handleEditChange('is_active', e.target.value === 'true')}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition bg-white"
                                    >
                                        <option value="true">🟢 Actif</option>
                                        <option value="false">🔴 Suspendu</option>
                                    </select>
                                </div>
                            </div>

                            {/* Nouveau mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-black/50 mb-1">
                                    Nouveau mot de passe <span className="font-normal text-black/30">(laisser vide pour ne pas modifier)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editForm.newPassword}
                                    onChange={e => handleEditChange('newPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4a8c42]  focus:outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-[#fafafa]">
                            <button
                                onClick={closeEdit}
                                className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={editLoading}
                                className="flex-1 bg-[#2d5a27] hover:bg-[#4a8c42]  disabled:opacity-60 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
                            >
                                {editLoading ? (
                                    <span className="animate-spin">🌿</span>
                                ) : (
                                    <><FiCheck size={15} /> Enregistrer</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUtilisateurs;