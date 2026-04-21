const formatPrice = (amount, showChf = false) => {
    const n = parseFloat(amount);
    if (isNaN(n)) return '—';
    if (showChf) return `CHF ${n.toFixed(2)}`;
    return `${n.toFixed(3)} DT`;
};

export default formatPrice;