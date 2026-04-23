import { createContext, useContext, useState } from 'react';

const SiteSettingsContext = createContext();

export const SiteSettingsProvider = ({ children }) => {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('goffa_currency') || ''
    );

    const updateCurrency = (val) => {
        setCurrency(val);
        localStorage.setItem('goffa_currency', val);
    };

    return (
        <SiteSettingsContext.Provider value={{ currency, updateCurrency }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);