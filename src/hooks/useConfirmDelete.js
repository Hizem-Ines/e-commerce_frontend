import { useState, useCallback } from 'react';

const useConfirmDelete = (deleteFn, { onSuccess, onError } = {}) => {
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [deleting, setDeleting]           = useState(false);

    const requestDelete = useCallback((item) => setConfirmTarget(item), []);
    const cancelDelete  = useCallback(() => setConfirmTarget(null), []);

    const confirmDelete = useCallback(async () => {
        if (!confirmTarget) return;
        setDeleting(true);
        try {
            await deleteFn(confirmTarget);
            onSuccess?.(confirmTarget);
        } catch (err) {
            onError?.(err);
        } finally {
            setDeleting(false);
            setConfirmTarget(null);
        }
    }, [confirmTarget, deleteFn, onSuccess, onError]);

    return { confirmTarget, requestDelete, cancelDelete, confirmDelete, deleting };
};

export default useConfirmDelete;