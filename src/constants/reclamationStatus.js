export const RECLAMATION_STATUS_CONFIG = {
    en_attente: { label: 'En attente',    color: 'bg-amber-100 text-amber-700'     },
    en_cours:   { label: 'En cours',      color: 'bg-blue-100 text-blue-700'       },
    urgente:    { label: 'Urgente ⚡',    color: 'bg-orange-100 text-orange-700'   },
    en_retard:  { label: 'En retard ⏰',  color: 'bg-red-100 text-red-700'         },
    resolue:    { label: 'Résolue',       color: 'bg-emerald-100 text-emerald-700' },
    rejetee:    { label: 'Rejetée',       color: 'bg-gray-100 text-gray-600'       },
};

// Statuts disponibles dans le formulaire de réponse admin uniquement
export const RECLAMATION_STATUS_OPTIONS_ADMIN = {
    en_cours: { label: 'En cours' },
    resolue:  { label: 'Résolue'  },
    rejetee:  { label: 'Rejetée'  },
};

// Statuts terminaux — plus de réponse possible
export const RECLAMATION_CLOSED_STATUSES = ['resolue', 'rejetee'];

export const COMPLAINT_TYPE_ICONS = {
    produit_defectueux: '💔',
    commande_non_recue: '📦',
    produit_incorrect:  '❓',
    retard_livraison:   '🚚',
    remboursement:      '↩️',
    autre:              '💬',
};