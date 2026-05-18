// components/admin/AdminAIChat.jsx
import { useState, useRef, useEffect } from 'react';
import {
  FiSend, FiCpu, FiShoppingCart, FiPackage,
  FiUsers, FiAlertCircle, FiStar, FiMail,
  FiTag, FiHelpCircle, FiTrash2, FiZap,
} from 'react-icons/fi';
import api from '../../../services/api'; 

// ─────────────────────────────────────────────────────────────
// SUGGESTIONS PAR CATÉGORIE
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'orders',
    label: 'Commandes',
    icon: FiShoppingCart,
    color: 'blue',
    suggestions: [
      'Quel est le chiffre d\'affaires ce mois-ci ?',
      'Combien de commandes sont en attente ?',
      'Quelles commandes ont du retard de livraison ?',
      'Quel est le panier moyen de nos clients ?',
    ],
  },
  {
    key: 'products',
    label: 'Produits',
    icon: FiPackage,
    color: 'emerald',
    suggestions: [
      'Quels produits sont presque en rupture de stock ?',
      'Quels produits se vendent le moins ce mois-ci ?',
      'Quelle catégorie génère le plus de ventes ?',
      'Quels produits ont les meilleures notes ?',
    ],
  },
  {
    key: 'users',
    label: 'Clients',
    icon: FiUsers,
    color: 'violet',
    suggestions: [
      'Quels clients commandent le plus souvent ?',
      'Combien de nouveaux inscrits cette semaine ?',
      'Quels clients sont inactifs depuis 60 jours ?',
      'Quel est le client qui a dépensé le plus ?',
    ],
  },
  {
    key: 'reclamations',
    label: 'Réclamations',
    icon: FiAlertCircle,
    color: 'red',
    suggestions: [
      'Quels sont les problèmes les plus signalés ?',
      'Combien de réclamations non traitées ?',
      'Résume les plaintes de cette semaine',
      'Y a-t-il des réclamations urgentes ?',
    ],
  },
  {
    key: 'reviews',
    label: 'Avis',
    icon: FiStar,
    color: 'amber',
    suggestions: [
      'Résume les avis négatifs récents',
      'Quels produits ont les pires notes ?',
      'Quel est notre score de satisfaction global ?',
      'Quels produits ont les meilleurs avis ?',
    ],
  },
  {
    key: 'email',
    label: 'Email IA',
    icon: FiMail,
    color: 'teal',
    suggestions: [
      'Génère un email pour la promotion Eid',
      'Rédige une campagne pour les nouveaux produits d\'été',
      'Écris un email de relance pour clients inactifs',
      'Génère un email de bienvenue pour nouveaux inscrits',
    ],
  },
  {
    key: 'promotions',
    label: 'Promotions',
    icon: FiTag,
    color: 'orange',
    suggestions: [
      'Quelles promotions sont actives en ce moment ?',
      'Quels produits méritent une promotion ?',
      'Suggère des produits à mettre en solde',
    ],
  },
  {
    key: 'faq',
    label: 'FAQ',
    icon: FiHelpCircle,
    color: 'slate',
    suggestions: [
      'Génère des FAQ depuis les réclamations récentes',
      'Quelles questions reviennent le plus souvent ?',
    ],
  },
];

// Couleurs Tailwind par clé
const COLOR_MAP = {
  blue:    { tab: 'bg-blue-50 text-blue-700 border-blue-200',    chip: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
  emerald: { tab: 'bg-emerald-50 text-emerald-700 border-emerald-200', chip: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
  violet:  { tab: 'bg-violet-50 text-violet-700 border-violet-200', chip: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200' },
  red:     { tab: 'bg-red-50 text-red-700 border-red-200',       chip: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
  amber:   { tab: 'bg-amber-50 text-amber-700 border-amber-200', chip: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
  teal:    { tab: 'bg-teal-50 text-teal-700 border-teal-200',    chip: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' },
  orange:  { tab: 'bg-orange-50 text-orange-700 border-orange-200', chip: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' },
  slate:   { tab: 'bg-slate-50 text-slate-700 border-slate-200', chip: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200' },
};

// ─────────────────────────────────────────────────────────────
// MESSAGE FORMATÉ (markdown léger)
// ─────────────────────────────────────────────────────────────
function FormattedMessage({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**'))
          return <p key={i} className="font-semibold text-gray-900">{line.replace(/\*\*/g, '')}</p>;
        if (line.startsWith('- ') || line.startsWith('• '))
          return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-emerald-500">{line.slice(2)}</p>;
        if (line.trim() === '')
          return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminAIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '**Bonjour ! Je suis votre assistant GOFFA BI** 👋\n\nPosez-moi des questions sur vos ventes, produits, clients, réclamations ou demandez-moi de générer des emails.\n\nChoisissez une catégorie ci-dessous ou écrivez directement votre question.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('orders');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const isFirstMessage = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Une erreur est survenue. Vérifiez votre connexion et réessayez.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '**Conversation réinitialisée** ✨\n\nComment puis-je vous aider ?',
    }]);
  };

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);
  const colors = COLOR_MAP[activeCat?.color || 'emerald'];

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
        <div className="p-2.5 bg-emerald-600 rounded-xl shadow-sm">
          <FiCpu className="text-white text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm">Assistant GOFFA BI</h2>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Powered by Gemini AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">
            {messages.length - 1} message{messages.length > 2 ? 's' : ''}
          </span>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Réinitialiser la conversation"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── MESSAGES ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {/* Avatar assistant */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                <FiZap size={13} className="text-emerald-600" />
              </div>
            )}

            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant'
                  ? <FormattedMessage content={msg.content} />
                  : <p>{msg.content}</p>
                }
              </div>
              <span className="text-[10px] text-gray-400 px-1">
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FiZap size={13} className="text-emerald-600" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── SUGGESTIONS (seulement au début) ────────── */}
      {isFirstMessage && (
        <div className="px-4 pb-3 border-t border-gray-50 pt-3 bg-gray-50/50">
          {/* Onglets catégories */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border
                    ${isActive
                      ? COLOR_MAP[cat.color].tab + ' shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={11} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Chips de suggestions */}
          <div className="flex flex-col gap-1.5 mt-2">
            {activeCat?.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className={`text-left text-xs px-3 py-2 rounded-xl transition ${colors.chip}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── INPUT ───────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez votre question sur les données GOFFA..."
              rows={1}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 pr-4
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         resize-none leading-relaxed placeholder:text-gray-400"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm flex-shrink-0"
          >
            <FiSend size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Entrée pour envoyer · Shift+Entrée pour sauter une ligne
        </p>
      </div>
    </div>
  );
}