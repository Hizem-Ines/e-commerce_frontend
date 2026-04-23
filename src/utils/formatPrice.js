const formatPrice = (amount, currency = '') => {
    const n = parseFloat(amount);
    if (isNaN(n)) return '—';
    if (!currency || !currency.trim()) return n.toFixed(2);
    return `${currency.trim()} ${n.toFixed(2)}`;
};

export default formatPrice;