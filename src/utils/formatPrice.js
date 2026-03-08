const formatPrice = (prix) => {
    return `${parseFloat(prix || 0).toFixed(2)} DT`;
};

export default formatPrice;