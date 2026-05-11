import { useEffect } from 'react';
import { addWSListener, removeWSListener } from '../utils/websocket';

const useWSListener = (key, callback, deps = []) => {
    useEffect(() => {
        addWSListener(key, callback);
        return () => removeWSListener(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
};

export default useWSListener;