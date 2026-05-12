import { useState, useCallback } from 'react';

const useModal = () => {
    const [target, setTarget] = useState(null);

    const open   = useCallback((item = true) => setTarget(item), []);
    const close  = useCallback(() => setTarget(null), []);
    const isOpen = target !== null;

    return { target, open, close, isOpen };
};

export default useModal;