import { createContext, useContext, useState } from 'react';
import { CURRENCY_KEY } from '../constants/storageKeys';

const SiteSettingsContext = createContext();

export const SiteSettingsProvider = ({ children }) => {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem(CURRENCY_KEY) || ''
    );

    const updateCurrency = (val) => {
        setCurrency(val);
        localStorage.setItem(CURRENCY_KEY, val);
    };

    return (
        <SiteSettingsContext.Provider value={{ currency, updateCurrency }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);