export const ORDER_STATUS_CONFIG = {
    en_attente:     { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700'   },
    confirmee:      { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700'       },
    en_preparation: { label: 'En cours',    color: 'bg-orange-100 text-orange-700'   },
    expediee:       { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700'   },
    livree:         { label: 'Livrée',      color: 'bg-emerald-100 text-emerald-700' },
    annulee:        { label: 'Annulée',     color: 'bg-red-100 text-red-700'         },
    remboursee:     { label: 'Remboursée',  color: 'bg-gray-100 text-gray-600'       },
    en_reclamation: { label: 'En réclamation', color: 'bg-orange-100 text-orange-700' },
    retournee:      { label: 'Retournée',       color: 'bg-slate-100 text-slate-600'  },
};

// Statuts modifiables par l'admin (annulee gérée séparément via modal)
export const ORDER_STATUS_OPTIONS = [
    'en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'remboursee',
];

export const PAYMENT_LABELS = {
    card:  '💳 Carte bancaire',
    twint: '📱 Twint',
};

export const DELIVERY_STATUS_OPTIONS = [
    { value: 'en_preparation', label: 'En préparation' },
    { value: 'expediee',       label: 'Expédiée'       },
    { value: 'en_transit',     label: 'En transit'     },
    { value: 'livre',          label: 'Livrée'         },
    { value: 'echec',          label: 'Échec'          },
    { value: 'retourne',       label: 'Retourné'       },
    { value: 'en_cours', label: 'En cours de livraison' },
];

// Format inline (hex) — utilisé dans Profile et OrderDetail
export const ORDER_STATUS_INLINE = {
    en_attente:     { label: 'En attente',     color: '#f59e0b', bg: '#fef3c7' },
    confirmee:      { label: 'Confirmée',       color: '#3b82f6', bg: '#dbeafe' },
    en_preparation: { label: 'En préparation',  color: '#f97316', bg: '#ffedd5' },
    expediee:       { label: 'Expédiée',        color: '#8b5cf6', bg: '#ede9fe' },
    livree:         { label: 'Livrée',          color: '#166534', bg: '#dcfce7' },
    annulee:        { label: 'Annulée',         color: '#dc2626', bg: '#fee2e2' },
    remboursee:     { label: 'Remboursée',      color: '#6b7280', bg: '#f3f4f6' },
    en_reclamation: { label: 'En réclamation', color: '#ea580c', bg: '#ffedd5' },
    retournee:      { label: 'Retournée',       color: '#475569', bg: '#f1f5f9' },
};

// Couleurs hex pures — utilisées dans les charts (AdminStats)
export const ORDER_STATUS_COLORS = {
    en_attente: '#f59e0b',
    confirmee:  '#3b82f6',
    expediee:   '#8b5cf6',
    livree:     '#10b981',
    annulee:    '#ef4444',
};

// Étapes livraison — utilisées dans OrderDetail
export const DELIVERY_STEPS = [
    { key: 'en_preparation', label: 'En préparation', icon: '📦' },
    { key: 'expediee',       label: 'Expédiée',        icon: '🚚' },
    { key: 'livre',          label: 'Livrée',          icon: '✅' },
];

// Helper livraison — utilisé dans Profile
export const getDeliveryLabel = (s) => {
    const map = {
        en_preparation: '📦 En préparation',
        expediee:       '🚚 En route',
        en_transit:     '🚚 En transit',
        en_cours:       '🚚 En cours',
        livre:          '✅ Livré',
        echec:          '❌ Échec de livraison',
        retourne:       '↩️ Retourné',
    };
    return map[s] || s || '—';
};