import { useState, useEffect, useCallback } from 'react';
import { getAllReviews, deleteReview } from '../../../services/reviewService';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// MODAL CONFIRMATION SUPPRESSION
// ─────────────────────────────────────────────────────────────
const ModalConfirm = ({ avis, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="text-center mb-5">
                <p className="text-4xl mb-3">🗑️</p>
                <h3 className="text-lg font-bold text-[#2c2c2c] mb-1">Supprimer cet avis ?</h3>
                <p className="text-sm text-black/50">
                    Avis de <span className="font-bold text-[#2c2c2c]">{avis.user_name || 'Utilisateur supprimé'}</span> sur{' '}
                    <span className="font-bold text-[#2c2c2c]">{avis.product_name}</span>
                </p>
            </div>
            <div className="bg-[#f9f5f0] rounded-xl p-4 mb-5">
                <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < avis.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                </div>
                <p className="text-sm text-black/60 italic line-clamp-3">"{avis.comment}"</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    Annuler
                </button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                    {loading ? 'Suppression...' : 'Supprimer'}
                </button>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// BADGE NOTE
// ─────────────────────────────────────────────────────────────
const BadgeNote = ({ rating }) => {
    const colors = {
        5: 'bg-emerald-100 text-emerald-700',
        4: 'bg-green-100 text-green-700',
        3: 'bg-yellow-100 text-yellow-700',
        2: 'bg-orange-100 text-orange-700',
        1: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${colors[rating]}`}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────
// ADMIN AVIS
// ─────────────────────────────────────────────────────────────
const AdminAvis = () => {
    const [reviews, setReviews]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);

    // Filtres
    const [filterRating, setFilterRating]     = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo]     = useState('');

    // Suppression
    const [toDelete, setToDelete]       = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toast, setToast]             = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchReviews = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const params = { page: p };
            if (filterRating)   params.rating    = filterRating;
            if (filterDateFrom) params.date_from = filterDateFrom;
            if (filterDateTo)   params.date_to   = filterDateTo;

            const res = await getAllReviews(params);
            setReviews(res.data.reviews);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch {
            // silencieux
        } finally {
            setLoading(false);
        }
    }, [page, filterRating, filterDateFrom, filterDateTo]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleFilter = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReviews(1);
    };

    const handleReset = () => {
        setFilterRating('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setPage(1);
        // useEffect va se re-déclencher via les dépendances
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setDeleteLoading(true);
        try {
            await deleteReview(toDelete.id);
            showToast('Avis supprimé avec succès.');
            setToDelete(null);
            // Recharger la page courante (ou précédente si plus d'items)
            const newPage = reviews.length === 1 && page > 1 ? page - 1 : page;
            setPage(newPage);
            fetchReviews(newPage);
        } catch {
            showToast('Erreur lors de la suppression.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Stats locales rapides
    const moyenneLocale = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : '—';

    return (
        <div className="space-y-6">

            {/* TOAST */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-[#2d5a27] text-white font-bold px-5 py-3 rounded-xl shadow-xl text-sm animate-fade-in">
                    ✅ {toast}
                </div>
            )}

            {/* MODAL */}
            {toDelete && (
                <ModalConfirm
                    avis={toDelete}
                    onConfirm={handleDelete}
                    onCancel={() => setToDelete(null)}
                    loading={deleteLoading}
                />
            )}

            {/* EN-TÊTE */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des avis</h2>
                    <p className="text-sm text-black/40 mt-0.5">
                        {total} avis au total
                    </p>
                </div>
            </div>

            {/* FILTRES */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] p-5">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
                    {/* Filtre note */}
                    <div className="flex flex-col gap-1 min-w-[120px]">
                        <label className="text-xs font-bold text-black/50 uppercase tracking-wide">Note</label>
                        <select
                            value={filterRating}
                            onChange={e => setFilterRating(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-[#4a8c42] focus:outline-none bg-white"
                        >
                            <option value="">Toutes</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                            <option value="4">⭐⭐⭐⭐ (4)</option>
                            <option value="3">⭐⭐⭐ (3)</option>
                            <option value="2">⭐⭐ (2)</option>
                            <option value="1">⭐ (1)</option>
                        </select>
                    </div>

                    {/* Date début */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-black/50 uppercase tracking-wide">Du</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-[#4a8c42] focus:outline-none"
                        />
                    </div>

                    {/* Date fin */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-black/50 uppercase tracking-wide">Au</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-[#4a8c42] focus:outline-none"
                        />
                    </div>

                    <button type="submit"
                        className="bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                        Filtrer
                    </button>
                    <button type="button" onClick={handleReset}
                        className="border-2 border-gray-200 text-black/50 hover:bg-gray-50 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                        Réinitialiser
                    </button>
                </form>
            </div>

            {/* TABLEAU */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-5xl animate-spin">🌿</div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">💬</p>
                        <p className="font-bold text-[#2c2c2c] text-lg mb-1">Aucun avis trouvé</p>
                        <p className="text-sm text-black/40">Modifiez les filtres ou attendez les premiers avis.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                        <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Utilisateur</th>
                                        <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Produit</th>
                                        <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Note</th>
                                        <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Commentaire</th>
                                        <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Date</th>
                                        <th className="text-right px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map((avis, i) => (
                                        <tr key={avis.id} className={`border-b border-gray-50 hover:bg-[#fdfaf6] transition-colors ${i % 2 !== 0 ? 'bg-[#fafafa]' : ''}`}>
                                            {/* Utilisateur */}
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-[#2c2c2c]">{avis.user_name || <span className="text-black/30 italic">Supprimé</span>}</p>
                                                <p className="text-xs text-black/40 mt-0.5">{avis.user_email || '—'}</p>
                                            </td>
                                            {/* Produit */}
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/produits/${avis.product_id}`}
                                                    target="_blank"
                                                    className="font-semibold text-[#2d5a27] hover:underline no-underline line-clamp-2 max-w-[160px] block"
                                                >
                                                    {avis.product_name}
                                                </Link>
                                            </td>
                                            {/* Note */}
                                            <td className="px-5 py-4 text-center">
                                                <BadgeNote rating={avis.rating} />
                                            </td>
                                            {/* Commentaire */}
                                            <td className="px-5 py-4 max-w-xs">
                                                <p className="text-black/60 text-sm line-clamp-2">{avis.comment}</p>
                                            </td>
                                            {/* Date */}
                                            <td className="px-5 py-4 text-black/40 whitespace-nowrap">
                                                {new Date(avis.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => setToDelete(avis)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors font-bold text-xs border border-red-200 hover:border-red-300"
                                                    title="Supprimer"
                                                >
                                                     Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {reviews.map(avis => (
                                <div key={avis.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-[#2c2c2c] text-sm">{avis.user_name || <span className="text-black/30 italic">Supprimé</span>}</p>
                                            <p className="text-xs text-black/40">{avis.user_email}</p>
                                        </div>
                                        <BadgeNote rating={avis.rating} />
                                    </div>
                                    <Link to={`/produits/${avis.product_id}`} target="_blank"
                                        className="text-xs font-bold text-[#2d5a27] no-underline hover:underline block">
                                        📦 {avis.product_name}
                                    </Link>
                                    <p className="text-sm text-black/60 leading-relaxed line-clamp-3">{avis.comment}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-black/30">
                                            {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                        <button onClick={() => setToDelete(avis)}
                                            className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
                                             Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm text-black/40">
                        Page <span className="font-bold text-[#2c2c2c]">{page}</span> sur <span className="font-bold text-[#2c2c2c]">{totalPages}</span>
                        {' '}— <span className="font-bold">{total}</span> avis
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-sm text-black/60 hover:border-[#4a8c42] hover:text-[#2d5a27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Précédent
                        </button>
                        {/* Pages proches */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-black/30 text-sm">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-colors ${p === page ? 'border-[#2d5a27] bg-[#2d5a27] text-white' : 'border-gray-200 text-black/60 hover:border-[#4a8c42]'}`}
                                    >
                                        {p}
                                    </button>
                                )
                            )
                        }
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-sm text-black/60 hover:border-[#4a8c42] hover:text-[#2d5a27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Suivant →
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminAvis;