import { createContext, useContext, useState } from 'react';

const SiteSettingsContext = createContext();

export const SiteSettingsProvider = ({ children }) => {
    const [showChf, setShowChf] = useState(
        () => localStorage.getItem('goffa_show_chf') === 'true'
    );

    const toggleChf = (val) => {
        setShowChf(val);
        localStorage.setItem('goffa_show_chf', String(val));
    };

    return (
        <SiteSettingsContext.Provider value={{ showChf, toggleChf }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);