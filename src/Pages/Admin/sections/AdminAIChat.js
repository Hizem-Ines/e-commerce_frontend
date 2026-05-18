// components/admin/AdminAIChat.jsx
import { useState, useRef, useEffect } from 'react';
import {
  FiSend, FiCpu, FiShoppingCart, FiPackage,
  FiUsers, FiAlertCircle, FiStar, FiMail,
  FiTag, FiHelpCircle, FiTrash2, FiZap,
  FiTrendingUp, FiTrendingDown, FiMinus,
  FiCopy, FiCheck, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import api from '../../../services/api';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'orders', label: 'Commandes', icon: FiShoppingCart, color: 'blue',
    suggestions: [
      "Quel est le chiffre d'affaires ce mois-ci ?",
      'Combien de commandes sont en attente ?',
      'Quelles commandes ont du retard de livraison ?',
      'Quel est le panier moyen de nos clients ?',
    ],
  },
  {
    key: 'products', label: 'Produits', icon: FiPackage, color: 'emerald',
    suggestions: [
      'Quels produits sont presque en rupture de stock ?',
      'Quels produits se vendent le moins ce mois-ci ?',
      'Quelle catégorie génère le plus de ventes ?',
      'Quels produits ont les meilleures notes ?',
    ],
  },
  {
    key: 'users', label: 'Clients', icon: FiUsers, color: 'violet',
    suggestions: [
      'Quels clients commandent le plus souvent ?',
      'Combien de nouveaux inscrits cette semaine ?',
      'Quels clients sont inactifs depuis 60 jours ?',
      'Quel est le client qui a dépensé le plus ?',
    ],
  },
  {
    key: 'complaints', label: 'Réclamations', icon: FiAlertCircle, color: 'red',
    suggestions: [
      'Quels sont les problèmes les plus signalés ?',
      'Combien de réclamations non traitées ?',
      'Résume les plaintes de cette semaine',
      'Y a-t-il des réclamations urgentes ?',
    ],
  },
  {
    key: 'reviews', label: 'Avis', icon: FiStar, color: 'amber',
    suggestions: [
      'Résume les avis négatifs récents',
      'Quels produits ont les pires notes ?',
      'Quel est notre score de satisfaction global ?',
      'Quels produits ont les meilleurs avis ?',
    ],
  },
  {
    key: 'email', label: 'Email IA', icon: FiMail, color: 'teal',
    suggestions: [
      'Génère un email pour la promotion Eid',
      "Rédige une campagne pour les nouveaux produits d'été",
      'Écris un email de relance pour clients inactifs',
      'Génère un email de bienvenue pour nouveaux inscrits',
    ],
  },
  {
    key: 'promotions', label: 'Promotions', icon: FiTag, color: 'orange',
    suggestions: [
      'Quelles promotions sont actives en ce moment ?',
      'Quels produits méritent une promotion ?',
      'Suggère des produits à mettre en solde',
    ],
  },
  {
    key: 'faq', label: 'FAQ', icon: FiHelpCircle, color: 'slate',
    suggestions: [
      'Génère des FAQ depuis les réclamations récentes',
      'Quelles questions reviennent le plus souvent ?',
    ],
  },
];

const COLOR_MAP = {
  blue:    { tab: 'bg-blue-50 text-blue-700 border-blue-200',     chip: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
  emerald: { tab: 'bg-emerald-50 text-emerald-700 border-emerald-200', chip: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
  violet:  { tab: 'bg-violet-50 text-violet-700 border-violet-200',  chip: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200' },
  red:     { tab: 'bg-red-50 text-red-700 border-red-200',         chip: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
  amber:   { tab: 'bg-amber-50 text-amber-700 border-amber-200',   chip: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
  teal:    { tab: 'bg-teal-50 text-teal-700 border-teal-200',      chip: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200' },
  orange:  { tab: 'bg-orange-50 text-orange-700 border-orange-200', chip: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' },
  slate:   { tab: 'bg-slate-50 text-slate-700 border-slate-200',   chip: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200' },
};

const HIGHLIGHT_COLOR_MAP = {
  blue:    'bg-blue-50 border-blue-200 text-blue-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  red:     'bg-red-50 border-red-200 text-red-900',
  amber:   'bg-amber-50 border-amber-200 text-amber-900',
  violet:  'bg-violet-50 border-violet-200 text-violet-900',
  orange:  'bg-orange-50 border-orange-200 text-orange-900',
  teal:    'bg-teal-50 border-teal-200 text-teal-900',
  slate:   'bg-slate-100 border-slate-200 text-slate-900',
};

// ─────────────────────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────────────────────
function HighlightCards({ highlights }) {
  if (!highlights?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3 w-full">
      {highlights.map((h, i) => {
        const cls = HIGHLIGHT_COLOR_MAP[h.color] || HIGHLIGHT_COLOR_MAP.slate;
        const isUp   = h.trend?.startsWith('+');
        const isDown = h.trend?.startsWith('-');
        return (
          <div key={i} className={`rounded-xl border p-3 ${cls}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1.5">{h.label}</p>
            <p className="text-xl font-bold leading-none">{h.value}</p>
            {h.trend && (
              <p className={`flex items-center gap-1 text-[11px] font-semibold mt-2
                ${isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
                {isUp ? <FiTrendingUp size={10} /> : isDown ? <FiTrendingDown size={10} /> : <FiMinus size={10} />}
                {h.trend}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMAIL PREVIEW
// ─────────────────────────────────────────────────────────────
function EmailPreview({ email }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (!email) return null;

  const copy = () => {
    navigator.clipboard.writeText(`Objet : ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 w-full rounded-xl border border-teal-200 overflow-hidden shadow-sm">
      {/* Top bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-600">
        <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
          <FiMail size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-white flex-1">Email généré par IA</span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-teal-100 hover:text-white transition font-medium">
          {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      {/* Subject line */}
      <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">Objet</span>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{email.subject}</p>
        {email.preview_text && (
          <p className="text-xs text-teal-500 mt-0.5 italic">↳ {email.preview_text}</p>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-white">
        <p className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-4' : ''}`}>
          {email.body}
        </p>
        <button onClick={() => setExpanded(p => !p)}
          className="flex items-center gap-1 mt-2.5 text-xs text-teal-600 hover:text-teal-800 font-semibold transition">
          {expanded ? <><FiChevronUp size={11} /> Réduire</> : <><FiChevronDown size={11} /> Voir l'email complet</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ ACCORDION
// ─────────────────────────────────────────────────────────────
function FAQCards({ faqs }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!faqs?.length) return null;

  const catStyle = {
    livraison: 'bg-blue-100 text-blue-700',
    paiement:  'bg-amber-100 text-amber-700',
    produits:  'bg-emerald-100 text-emerald-700',
    retours:   'bg-orange-100 text-orange-700',
    autre:     'bg-slate-100 text-slate-600',
  };

  return (
    <div className="mt-3 w-full space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 mb-2">
        {faqs.length} FAQ{faqs.length > 1 ? 's' : ''} générée{faqs.length > 1 ? 's' : ''}
      </p>
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-gray-50 transition"
          >
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${catStyle[faq.category] || catStyle.autre}`}>
              {faq.category}
            </span>
            <span className="text-xs font-semibold text-gray-800 flex-1 leading-snug">{faq.question_fr}</span>
            {openIdx === i
              ? <FiChevronUp size={13} className="text-gray-400 flex-shrink-0" />
              : <FiChevronDown size={13} className="text-gray-400 flex-shrink-0" />
            }
          </button>
          {openIdx === i && (
            <div className="px-3.5 pb-3">
              <p className="text-xs text-gray-600 leading-relaxed border-l-2 border-emerald-400 pl-3 ml-1">
                {faq.answer_fr}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────────────────────
function FormattedMessage({ content }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (/^\*\*.*\*\*$/.test(line.trim()))
          return <p key={i} className="font-bold text-gray-900 text-[13px]">{line.replace(/\*\*/g, '')}</p>;

        if (/^[-•]\s/.test(line))
          return (
            <div key={i} className="flex items-start gap-2.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-[6px]" />
              <span className="text-gray-700">{line.slice(2)}</span>
            </div>
          );

        if (line.trim() === '') return <div key={i} className="h-1.5" />;

        // Inline **bold**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-gray-700">
            {parts.map((p, j) =>
              /^\*\*.*\*\*$/.test(p)
                ? <strong key={j} className="font-semibold text-gray-900">{p.replace(/\*\*/g, '')}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function AdminAIChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '**Bonjour ! Je suis votre assistant GOFFA BI** 👋\n\nPosez-moi des questions sur vos ventes, produits, clients, réclamations ou demandez-moi de générer des emails.\n\nChoisissez une catégorie ci-dessous ou écrivez directement.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('orders');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const isFirst   = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();
    try {
      const { data } = await api.post('/admin/ai/chat', { message: msg });
      setMessages(p => [...p, {
        role: 'assistant',
        content:    data.reply,
        highlights: data.highlights || [],
        email:      data.email      || null,
        faqs:       data.faqs       || null,
        intent:     data.intent,
      }]);
    } catch {
      setMessages(p => [...p, {
        role: 'assistant',
        content: '❌ Une erreur est survenue. Vérifiez votre connexion et réessayez.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([{ role: 'assistant', content: '**Conversation réinitialisée** ✨\n\nComment puis-je vous aider ?' }]);
    setActiveCategory('orders');
  };

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);
  const chips     = COLOR_MAP[activeCat?.color || 'emerald'];

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="relative flex items-center gap-3 px-5 py-4 border-b border-gray-100 overflow-hidden bg-gradient-to-r from-emerald-600/[0.06] to-transparent">
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-200/30 blur-xl pointer-events-none" />

        <div className="relative p-2.5 bg-emerald-600 rounded-xl shadow-sm shadow-emerald-300/40">
          <FiCpu className="text-white text-lg" />
        </div>
        <div className="relative flex-1">
          <h2 className="font-semibold text-gray-900 text-sm">Assistant GOFFA BI</h2>
          <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gemini AI · Données en temps réel
          </p>
        </div>
        {messages.length > 1 && (
          <span className="relative text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
              {Math.ceil((messages.length - 1) / 2)}
            </span>
            échange{Math.ceil((messages.length - 1) / 2) > 1 ? 's' : ''}
          </span>
        )}
        <button onClick={clear} title="Réinitialiser"
          className="relative p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
          <FiTrash2 size={14} />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <FiZap size={12} className="text-white" />
              </div>
            )}

            <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end max-w-[80%]' : 'items-start max-w-[90%]'}`}>

              {/* Bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm
                ${msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm shadow-emerald-200/60'
                  : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                    : 'bg-gray-50 border border-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant'
                  ? <FormattedMessage content={msg.content} />
                  : <p className="leading-relaxed">{msg.content}</p>
                }
              </div>

              {/* Rich extras */}
              {msg.role === 'assistant' && <>
                <HighlightCards highlights={msg.highlights} />
                <EmailPreview   email={msg.email} />
                <FAQCards       faqs={msg.faqs} />
              </>}

              <span className="text-[10px] text-gray-400 px-1">
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FiZap size={12} className="text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5">
                {[0, 160, 320].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* SUGGESTIONS */}
      {isFirst && (
        <div className="border-t border-gray-100 bg-gray-50/70 px-4 pt-3 pb-3">
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const active = activeCategory === cat.key;
              return (
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition border flex-shrink-0
                    ${active ? COLOR_MAP[cat.color].tab + ' shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  <Icon size={11} />{cat.label}
                </button>
              );
            })}
          </div>

          {/* Chip list */}
          <div className="flex flex-col gap-1.5 mt-1">
            {activeCat?.suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className={`text-left text-xs px-3.5 py-2.5 rounded-xl font-medium transition ${chips.chip}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Posez votre question sur les données GOFFA..."
            rows={1}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       resize-none leading-relaxed placeholder:text-gray-400
                       bg-gray-50 focus:bg-white transition-colors"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition
                       shadow-sm shadow-emerald-200 flex-shrink-0">
            <FiSend size={15} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Entrée pour envoyer · Shift+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}