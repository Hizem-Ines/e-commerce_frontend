import { useState, useCallback } from 'react';

const useToast = (duration = 3000) => {
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg,   setErrorMsg]   = useState('');

    const showSuccess = useCallback((msg) => {
        setSuccessMsg(msg);
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), duration);
    }, [duration]);

    const showError = useCallback((msg) => {
        setErrorMsg(msg);
        setSuccessMsg('');
        setTimeout(() => setErrorMsg(''), duration);
    }, [duration]);

    return { successMsg, errorMsg, showSuccess, showError };
};

export default useToast;