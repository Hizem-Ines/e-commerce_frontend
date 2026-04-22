const formatPrice = (amount, currency = 'CHF') => {
    const n = parseFloat(amount);
    if (isNaN(n)) return '—';
    return `${currency} ${n.toFixed(2)}`;
};

export default formatPrice;