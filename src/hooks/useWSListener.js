import { useEffect, useRef } from 'react';
import { addWSListener, removeWSListener } from '../utils/websocket';

const useWSListener = (key, callback, deps = []) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        const handler = (data) => callbackRef.current(data);
        addWSListener(key, handler);
        return () => removeWSListener(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, ...deps]);
};

export default useWSListener;