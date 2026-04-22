import { createContext, useContext, useState } from 'react';

const SiteSettingsContext = createContext();

export const SiteSettingsProvider = ({ children }) => {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('goffa_currency') || 'CHF'
    );

    const updateCurrency = (val) => {
        const clean = val.trim();
        if (!clean) return;
        setCurrency(clean);
        localStorage.setItem('goffa_currency', clean);
    };

    return (
        <SiteSettingsContext.Provider value={{ currency, updateCurrency }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);