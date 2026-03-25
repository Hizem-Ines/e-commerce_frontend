import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiSearch, FiTrash2 } from 'react-icons/fi';

const AdminUtilisateurs = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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

    useEffect(() => { fetchUsers(); }, []);

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

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Utilisateurs</h2>
                <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full">
                    {users.length} utilisateur{users.length > 1 ? 's' : ''}
                </span>
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
                        placeholder="Rechercher un utilisateur..."
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
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm overflow-hidden shrink-0">
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
                                        <button
                                            onClick={() => setDeleteConfirm(user.id)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                                        >
                                            <FiTrash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL SUPPRESSION */}
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
        </div>
    );
};

export default AdminUtilisateurs;