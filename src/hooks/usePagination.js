import { useState, useCallback } from 'react';

const usePagination = (initialPage = 1) => {
    const [page, setPage]             = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);

    const goTo  = useCallback((p) => setPage(p), []);
    const reset = useCallback(() => setPage(1), []);

    return { page, totalPages, setTotalPages, goTo, reset };
};

export default usePagination;