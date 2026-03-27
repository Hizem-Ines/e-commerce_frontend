import { useState, useEffect, useRef } from 'react';
import { getAllProducts, deleteProduct, createProduct, updateProduct, getAllCategories, getAllSuppliers } from '../../../services/adminService';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiUpload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import api from '../../../services/api'; // ← used for variant sub-routes

// ─── Blank form state ────────────────────────────────────────────────────────
const BLANK_FORM = {
    name_fr: '', name_ar: '',
    description_fr: '', description_ar: '',
    ethical_info_fr: '', ethical_info_ar: '',
    origin: '',
    usage_fr: '', usage_ar: '',
    ingredients_fr: '', ingredients_ar: '',
    precautions_fr: '', precautions_ar: '',
    certifications: '',
    supplier_id: '', category_id: '',
    slug: '',
    is_active: true, is_featured: false,
};

const BLANK_VARIANT = {
    price: '', compare_price: '', cost_price: '',
    stock: '0', sku: '', weight_grams: '',
    attributes: [{ type_fr: '', value_fr: '', type_ar: '', value_ar: '' }],
};

// ─── Field component ─────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full bg-[#f9f5f0] border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25";
const textareaCls = inputCls + " resize-none";

// ─── Variant Edit Row (for edit mode) ────────────────────────────────────────
const VariantEditRow = ({ variant, productId, onUpdated, onDeleted }) => {
    const [editing, setEditing] = useState(false);
    const [vals, setVals]       = useState({
        price:         variant.price         ?? '',
        compare_price: variant.compare_price ?? '',
        cost_price:    variant.cost_price    ?? '',
        stock:         variant.stock         ?? 0,
        sku:           variant.sku           ?? '',
        weight_grams:  variant.weight_grams  ?? '',
        is_active:     variant.is_active     ?? true,
    });
    const [saving,   setSaving]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [err,      setErr]      = useState('');

    const set = (k, v) => setVals(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!vals.price || parseFloat(vals.price) < 0) { setErr('Prix invalide'); return; }
        setSaving(true); setErr('');
        try {
            const fd = new FormData();
            Object.entries(vals).forEach(([k, v]) => fd.append(k, String(v)));
            const res = await api.put(`/products/${productId}/variants/${variant.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUpdated(res.data.variant);
            setEditing(false);
        } catch (e) {
            setErr(e.response?.data?.message || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const del = async () => {
        if (!window.confirm('Supprimer cette variante ?')) return;
        setDeleting(true);
        try {
            await api.delete(`/products/${productId}/variants/${variant.id}`);
            onDeleted(variant.id);
        } catch (e) {
            setErr(e.response?.data?.message || 'Erreur suppression');
            setDeleting(false);
        }
    };

    // Build a readable label from attributes
    const attrLabel = variant.attributes?.length
        ? variant.attributes.map(a => `${a.type_fr}: ${a.value_fr}`).join(' · ')
        : 'Variante sans attribut';

    return (
        <div className="bg-[#f9f5f0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-sm text-[#2c2c2c]">{attrLabel}</p>
                    {!editing && (
                        <p className="text-xs text-black/40 mt-0.5">
                            Prix: <span className="font-bold text-emerald-600">{formatPrice(parseFloat(variant.price))}</span>
                            {' · '}Stock: <span className="font-bold">{variant.stock}</span>
                            {variant.sku && ` · SKU: ${variant.sku}`}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${vals.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                                {vals.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {!editing ? (
                        <>
                            <button onClick={() => setEditing(true)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition text-xs font-bold flex items-center gap-1">
                                <FiEdit size={13}/> Modifier
                            </button>
                            <button onClick={del} disabled={deleting} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition text-xs font-bold flex items-center gap-1">
                                <FiTrash2 size={13}/> {deleting ? '...' : 'Supprimer'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                                {saving ? '⏳' : '💾 Sauver'}
                            </button>
                            <button onClick={() => { setEditing(false); setErr(''); }} className="px-3 py-1.5 border border-gray-200 text-black/50 rounded-xl text-xs font-bold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                        </>
                    )}
                </div>
            </div>

            {err && <p className="text-red-500 text-xs font-semibold">❌ {err}</p>}

            {editing && (
                <div className="space-y-3 pt-2 border-t border-black/5">
                    <div className="grid grid-cols-4 gap-3">
                        <Field label="Prix *">
                            <input type="number" min="0" step="0.01" className={inputCls} value={vals.price} onChange={e => set('price', e.target.value)} />
                        </Field>
                        <Field label="Prix barré">
                            <input type="number" min="0" step="0.01" className={inputCls} value={vals.compare_price} onChange={e => set('compare_price', e.target.value)} />
                        </Field>
                        <Field label="Coût">
                            <input type="number" min="0" step="0.01" className={inputCls} value={vals.cost_price} onChange={e => set('cost_price', e.target.value)} />
                        </Field>
                        <Field label="Stock">
                            <input type="number" min="0" className={inputCls} value={vals.stock} onChange={e => set('stock', e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="SKU">
                            <input className={inputCls} value={vals.sku} onChange={e => set('sku', e.target.value)} placeholder="ex: ARG-500ML" />
                        </Field>
                        <Field label="Poids (g)">
                            <input type="number" min="0" className={inputCls} value={vals.weight_grams} onChange={e => set('weight_grams', e.target.value)} />
                        </Field>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => set('is_active', !vals.is_active)}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 relative shrink-0 ${vals.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${vals.is_active ? 'left-5' : 'left-0.5'}`}/>
                        </button>
                        <span className="text-xs font-bold text-black/50">{vals.is_active ? 'Variante active' : 'Variante inactive'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Add Variant Form (for edit mode) ────────────────────────────────────────
const AddVariantForm = ({ productId, onAdded, onCancel }) => {
    const [v, setV]     = useState({ ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '', type_ar: '', value_ar: '' }] });
    const [saving, setSaving] = useState(false);
    const [err,    setErr]    = useState('');

    const set     = (k, val) => setV(p => ({ ...p, [k]: val }));
    const setAttr = (ai, k, val) => setV(p => ({ ...p, attributes: p.attributes.map((a, j) => j === ai ? { ...a, [k]: val } : a) }));
    const addAttr = () => setV(p => ({ ...p, attributes: [...p.attributes, { type_fr: '', value_fr: '', type_ar: '', value_ar: '' }] }));
    const remAttr = (ai) => setV(p => ({ ...p, attributes: p.attributes.filter((_, j) => j !== ai) }));

    const save = async () => {
        if (!v.price || parseFloat(v.price) < 0) { setErr('Prix invalide'); return; }
        setSaving(true); setErr('');
        try {
            const fd = new FormData();
            fd.append('price',         v.price);
            if (v.compare_price) fd.append('compare_price', v.compare_price);
            if (v.cost_price)    fd.append('cost_price',    v.cost_price);
            fd.append('stock',         v.stock || '0');
            if (v.sku)           fd.append('sku',           v.sku);
            if (v.weight_grams)  fd.append('weight_grams',  v.weight_grams);
            const cleanAttrs = v.attributes.filter(a => a.type_fr && a.value_fr);
            if (cleanAttrs.length) fd.append('attributes', JSON.stringify(cleanAttrs));

            const res = await api.post(`/products/${productId}/variants`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onAdded(res.data.variant);
        } catch (e) {
            setErr(e.response?.data?.message || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-5 space-y-4 bg-emerald-50/30">
            <p className="font-bold text-sm text-emerald-700">➕ Nouvelle variante</p>
            {err && <p className="text-red-500 text-xs font-semibold">❌ {err}</p>}

            <div className="grid grid-cols-4 gap-3">
                <Field label="Prix *">
                    <input type="number" min="0" step="0.01" className={inputCls} value={v.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Prix barré">
                    <input type="number" min="0" step="0.01" className={inputCls} value={v.compare_price} onChange={e => set('compare_price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Coût">
                    <input type="number" min="0" step="0.01" className={inputCls} value={v.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Stock">
                    <input type="number" min="0" className={inputCls} value={v.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="SKU">
                    <input className={inputCls} value={v.sku} onChange={e => set('sku', e.target.value)} placeholder="ex: ARG-500ML" />
                </Field>
                <Field label="Poids (g)">
                    <input type="number" min="0" className={inputCls} value={v.weight_grams} onChange={e => set('weight_grams', e.target.value)} placeholder="500" />
                </Field>
            </div>

            <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Attributs</p>
                <div className="space-y-2">
                    {v.attributes.map((a, ai) => (
                        <div key={ai} className="flex gap-2 items-center">
                            <input className={inputCls + " flex-1"} value={a.type_fr} onChange={e => setAttr(ai, 'type_fr', e.target.value)} placeholder="Type (ex: Poids)" />
                            <input className={inputCls + " flex-1"} value={a.value_fr} onChange={e => setAttr(ai, 'value_fr', e.target.value)} placeholder="Valeur (ex: 500ml)" />
                            {v.attributes.length > 1 && (
                                <button onClick={() => remAttr(ai)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><FiX size={12}/></button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={addAttr} className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">+ Ajouter attribut</button>
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 border border-gray-200 text-black/50 font-bold py-2 rounded-xl text-xs hover:bg-gray-50 transition">Annuler</button>
                <button onClick={save} disabled={saving} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition">
                    {saving ? '⏳ Ajout...' : '✅ Ajouter la variante'}
                </button>
            </div>
        </div>
    );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────
const ProductFormModal = ({ product, categories, suppliers, onClose, onSaved }) => {
    const isEdit = !!product;
    const [form, setForm] = useState(isEdit ? {
        name_fr: product.name_fr || '',
        name_ar: product.name_ar || '',
        description_fr: product.description_fr || '',
        description_ar: product.description_ar || '',
        ethical_info_fr: product.ethical_info_fr || '',
        ethical_info_ar: product.ethical_info_ar || '',
        origin: product.origin || '',
        usage_fr: product.usage_fr || '',
        usage_ar: product.usage_ar || '',
        ingredients_fr: product.ingredients_fr || '',
        ingredients_ar: product.ingredients_ar || '',
        precautions_fr: product.precautions_fr || '',
        precautions_ar: product.precautions_ar || '',
        certifications: Array.isArray(product.certifications)
            ? product.certifications.join(', ')
            : (product.certifications || ''),
        supplier_id: product.supplier_id || '',
        category_id: product.category_id || '',
        slug: product.slug || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
    } : { ...BLANK_FORM });

    // For create mode
    const [variants, setVariants] = useState(
        [{ ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '', type_ar: '', value_ar: '' }] }]
    );

    // For edit mode — live list of existing variants
    const [editVariants, setEditVariants] = useState(product?.variants || []);
    const [showAddVariant, setShowAddVariant] = useState(false);

    const [images, setImages]   = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [tab, setTab]         = useState('general');
    const [showAr, setShowAr]   = useState(false);
    const fileRef = useRef();

    // Fetch full product with variants when editing (list view may not include variants)
    useEffect(() => {
        if (isEdit && product.id) {
            api.get(`/products/${product.id}`).then(res => {
                setEditVariants(res.data.product?.variants || []);
            }).catch(() => {});
        }
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Image picker
    const handleImages = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    // Variant helpers (create mode)
    const setVariant = (vi, k, v) => setVariants(vs => vs.map((vt, i) => i === vi ? { ...vt, [k]: v } : vt));
    const setAttr    = (vi, ai, k, v) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: vt.attributes.map((a, j) => j === ai ? { ...a, [k]: v } : a),
    }));
    const addAttr    = (vi) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: [...vt.attributes, { type_fr: '', value_fr: '', type_ar: '', value_ar: '' }],
    }));
    const removeAttr = (vi, ai) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: vt.attributes.filter((_, j) => j !== ai),
    }));
    const addVariant    = () => setVariants(vs => [...vs, { ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '', type_ar: '', value_ar: '' }] }]);
    const removeVariant = (vi) => setVariants(vs => vs.filter((_, i) => i !== vi));

    const handleSubmit = async () => {
        setError('');
        if (!form.name_fr.trim())        { setError('Le nom (FR) est obligatoire.');         setTab('general');  return; }
        if (!form.description_fr.trim()) { setError('La description (FR) est obligatoire.'); setTab('general');  return; }
        if (!form.category_id)           { setError('La catégorie est obligatoire.');        setTab('general');  return; }
        if (!isEdit && variants.length === 0) { setError('Au moins une variante est requise.'); setTab('variants'); return; }
        if (!isEdit && variants.some(v => !v.price || parseFloat(v.price) < 0)) {
            setError('Chaque variante doit avoir un prix valide.'); setTab('variants'); return;
        }

        setLoading(true);
        try {
            const fd = new FormData();

            Object.entries(form).forEach(([k, v]) => {
                if (k === 'certifications') {
                    const arr = v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
                    if (arr.length) fd.append('certifications', JSON.stringify(arr));
                } else if (k === 'is_active' || k === 'is_featured') {
                    fd.append(k, String(v));
                } else if (v !== '' && v !== null && v !== undefined) {
                    fd.append(k, v);
                }
            });

            images.forEach(img => fd.append('images', img));

            if (!isEdit) {
                const cleanVariants = variants.map(v => ({
                    price:         parseFloat(v.price),
                    compare_price: v.compare_price ? parseFloat(v.compare_price) : null,
                    cost_price:    v.cost_price    ? parseFloat(v.cost_price)    : null,
                    stock:         parseInt(v.stock) || 0,
                    sku:           v.sku           || null,
                    weight_grams:  v.weight_grams  ? parseInt(v.weight_grams)   : null,
                    attributes:    v.attributes.filter(a => a.type_fr && a.value_fr),
                }));
                fd.append('variants', JSON.stringify(cleanVariants));
            }

            if (isEdit) {
                await updateProduct(product.id, fd);
            } else {
                await createProduct(fd);
            }

            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general',  label: '📝 Général' },
        { id: 'details',  label: '📦 Détails' },
        { id: 'variants', label: '🎛️ Variantes' },
        { id: 'images',   label: '🖼️ Images' },
        { id: 'settings', label: '⚙️ Paramètres' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold font-serif text-[#2c2c2c]">
                            {isEdit ? '✏️ Modifier le produit' : '✨ Nouveau produit'}
                        </h2>
                        {isEdit && <p className="text-xs text-black/40 mt-0.5">{product.name_fr}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-black/40 hover:text-black/70">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Required fields legend */}
                <div className="px-7 pt-3 shrink-0">
                    <p className="text-xs text-black/35"><span className="text-red-400 font-bold">*</span> Champ obligatoire</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-7 mt-3 bg-red-50 border border-red-200 text-red-700 font-semibold px-4 py-3 rounded-xl text-sm flex items-center gap-2 shrink-0">
                        ❌ {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-7 shrink-0 overflow-x-auto mt-3">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                                tab === t.id
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-black/40 hover:text-black/70'
                            }`}
                        >
                            {t.label}
                            {t.id === 'variants' && (
                                <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    {isEdit ? editVariants.length : variants.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-6">

                    {/* ── GÉNÉRAL ──────────────────────────────────── */}
                    {tab === 'general' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Nom (FR)" required>
                                    <input className={inputCls} value={form.name_fr} onChange={e => set('name_fr', e.target.value)} placeholder="ex: Huile d'argan bio" />
                                </Field>
                                <Field label="Catégorie" required>
                                    <select className={inputCls} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                                        <option value="">— Choisir —</option>
                                        {categories.map(c => (
                                            <optgroup key={c.id} label={c.name_fr}>
                                                <option value={c.id}>{c.name_fr}</option>
                                                {c.children?.map(s => (
                                                    <option key={s.id} value={s.id}>　↳ {s.name_fr}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <Field label="Description (FR)" required>
                                <textarea className={textareaCls} rows={4} value={form.description_fr} onChange={e => set('description_fr', e.target.value)} placeholder="Décrivez le produit en détail..." />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Fournisseur">
                                    <select className={inputCls} value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                                        <option value="">— Aucun —</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Origine">
                                    <input className={inputCls} value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="ex: Maroc, Tunisie..." />
                                </Field>
                            </div>

                            <Field label="Info éthique (FR)">
                                <textarea className={textareaCls} rows={2} value={form.ethical_info_fr} onChange={e => set('ethical_info_fr', e.target.value)} placeholder="Engagements éthiques, labels..." />
                            </Field>

                            {/* Arabic toggle */}
                            <button
                                onClick={() => setShowAr(a => !a)}
                                className="flex items-center gap-2 text-xs font-bold text-black/40 hover:text-emerald-600 transition"
                            >
                                {showAr ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                                Champs arabes (عربي)
                            </button>

                            {showAr && (
                                <div className="space-y-4 border-l-4 border-emerald-100 pl-4" dir="rtl">
                                    <Field label="الاسم (AR)">
                                        <input className={inputCls} value={form.name_ar} onChange={e => set('name_ar', e.target.value)} placeholder="اسم المنتج" />
                                    </Field>
                                    <Field label="الوصف (AR)">
                                        <textarea className={textareaCls} rows={3} value={form.description_ar} onChange={e => set('description_ar', e.target.value)} placeholder="وصف المنتج بالعربية" />
                                    </Field>
                                    <Field label="المعلومات الأخلاقية (AR)">
                                        <textarea className={textareaCls} rows={2} value={form.ethical_info_ar} onChange={e => set('ethical_info_ar', e.target.value)} />
                                    </Field>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DÉTAILS ───────────────────────────────────── */}
                    {tab === 'details' && (
                        <div className="space-y-5">
                            <Field label="Mode d'emploi (FR)">
                                <textarea className={textareaCls} rows={3} value={form.usage_fr} onChange={e => set('usage_fr', e.target.value)} placeholder="Instructions d'utilisation..." />
                            </Field>
                            <Field label="Ingrédients (FR)">
                                <textarea className={textareaCls} rows={3} value={form.ingredients_fr} onChange={e => set('ingredients_fr', e.target.value)} placeholder="Liste des ingrédients..." />
                            </Field>
                            <Field label="Précautions (FR)">
                                <textarea className={textareaCls} rows={2} value={form.precautions_fr} onChange={e => set('precautions_fr', e.target.value)} placeholder="Précautions d'emploi..." />
                            </Field>
                            <Field label="Certifications (séparées par virgule)">
                                <input className={inputCls} value={form.certifications} onChange={e => set('certifications', e.target.value)} placeholder="ex: bio, halal, vegan" />
                            </Field>
                            <Field label="Slug URL">
                                <input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-généré si vide" />
                            </Field>
                        </div>
                    )}

                    {/* ── VARIANTES ────────────────────────────────── */}
                    {tab === 'variants' && (
                        <div className="space-y-4">
                            {/* ─ EDIT MODE: manage existing variants ─ */}
                            {isEdit ? (
                                <>
                                    {editVariants.length === 0 ? (
                                        <p className="text-sm text-black/40 text-center py-6">Aucune variante active</p>
                                    ) : (
                                        editVariants.map(v => (
                                            <VariantEditRow
                                                key={v.id}
                                                variant={v}
                                                productId={product.id}
                                                onUpdated={updated => setEditVariants(prev => prev.map(x => x.id === updated.id ? updated : x))}
                                                onDeleted={vid    => setEditVariants(prev => prev.filter(x => x.id !== vid))}
                                            />
                                        ))
                                    )}

                                    {showAddVariant ? (
                                        <AddVariantForm
                                            productId={product.id}
                                            onAdded={newV => { setEditVariants(prev => [...prev, newV]); setShowAddVariant(false); }}
                                            onCancel={() => setShowAddVariant(false)}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => setShowAddVariant(true)}
                                            className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-600 font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50"
                                        >
                                            + Ajouter une variante
                                        </button>
                                    )}
                                </>
                            ) : (
                                /* ─ CREATE MODE ─ */
                                <>
                                    {variants.map((v, vi) => (
                                        <div key={vi} className="bg-[#f9f5f0] rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-sm text-[#2c2c2c]">Variante {vi + 1}</p>
                                                {variants.length > 1 && (
                                                    <button onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600 transition p-1">
                                                        <FiX size={14}/>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-4 gap-3">
                                                <Field label="Prix" required>
                                                    <input type="number" min="0" step="0.01" className={inputCls} value={v.price} onChange={e => setVariant(vi, 'price', e.target.value)} placeholder="0.00" />
                                                </Field>
                                                <Field label="Prix barré">
                                                    <input type="number" min="0" step="0.01" className={inputCls} value={v.compare_price} onChange={e => setVariant(vi, 'compare_price', e.target.value)} placeholder="0.00" />
                                                </Field>
                                                <Field label="Coût">
                                                    <input type="number" min="0" step="0.01" className={inputCls} value={v.cost_price} onChange={e => setVariant(vi, 'cost_price', e.target.value)} placeholder="0.00" />
                                                </Field>
                                                <Field label="Stock">
                                                    <input type="number" min="0" className={inputCls} value={v.stock} onChange={e => setVariant(vi, 'stock', e.target.value)} placeholder="0" />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="SKU">
                                                    <input className={inputCls} value={v.sku} onChange={e => setVariant(vi, 'sku', e.target.value)} placeholder="ex: ARG-500ML" />
                                                </Field>
                                                <Field label="Poids (g)">
                                                    <input type="number" min="0" className={inputCls} value={v.weight_grams} onChange={e => setVariant(vi, 'weight_grams', e.target.value)} placeholder="500" />
                                                </Field>
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Attributs</p>
                                                <div className="space-y-2">
                                                    {v.attributes.map((a, ai) => (
                                                        <div key={ai} className="flex gap-2 items-center">
                                                            <input className={inputCls + " flex-1"} value={a.type_fr} onChange={e => setAttr(vi, ai, 'type_fr', e.target.value)} placeholder="Type (ex: Poids)" />
                                                            <input className={inputCls + " flex-1"} value={a.value_fr} onChange={e => setAttr(vi, ai, 'value_fr', e.target.value)} placeholder="Valeur (ex: 500ml)" />
                                                            {v.attributes.length > 1 && (
                                                                <button onClick={() => removeAttr(vi, ai)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                                                                    <FiX size={12}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => addAttr(vi)} className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                                                    + Ajouter attribut
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addVariant}
                                        className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-600 font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50"
                                    >
                                        + Ajouter une variante
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── IMAGES ───────────────────────────────────── */}
                    {tab === 'images' && (
                        <div className="space-y-5">
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl py-10 flex flex-col items-center gap-3 text-emerald-600 hover:bg-emerald-50 transition"
                            >
                                <FiUpload size={28} />
                                <p className="font-bold text-sm">Cliquer pour uploader des images</p>
                                <p className="text-xs text-black/30">JPG, PNG, WEBP — Plusieurs fichiers acceptés</p>
                            </button>
                            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />

                            {previews.length > 0 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#ecfdf5]">
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => {
                                                    setImages(imgs => imgs.filter((_, j) => j !== i));
                                                    setPreviews(ps => ps.filter((_, j) => j !== i));
                                                }}
                                                className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 rounded-full p-0.5 hover:bg-red-500 hover:text-white transition"
                                            >
                                                <FiX size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isEdit && product.images?.length > 0 && previews.length === 0 && (
                                <div>
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Images actuelles</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {product.images.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#ecfdf5]">
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-black/30 mt-2">Uploader de nouvelles images pour remplacer celles-ci.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PARAMÈTRES ───────────────────────────────── */}
                    {tab === 'settings' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-[#f9f5f0] rounded-xl px-5 py-4">
                                <div>
                                    <p className="font-bold text-sm text-[#2c2c2c]">Produit actif</p>
                                    <p className="text-xs text-black/40">Visible sur le site si activé</p>
                                </div>
                                <button
                                    onClick={() => set('is_active', !form.is_active)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-6' : 'left-0.5'}`}/>
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-[#f9f5f0] rounded-xl px-5 py-4">
                                <div>
                                    <p className="font-bold text-sm text-[#2c2c2c]">Coup de cœur ✨</p>
                                    <p className="text-xs text-black/40">Mis en avant sur la page d'accueil</p>
                                </div>
                                <button
                                    onClick={() => set('is_featured', !form.is_featured)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.is_featured ? 'bg-amber-400' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.is_featured ? 'left-6' : 'left-0.5'}`}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-7 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
                    <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm">
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-2 flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
                    >
                        {loading
                            ? '⏳ Enregistrement...'
                            : isEdit ? '💾 Enregistrer les modifications' : '✅ Créer le produit'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main AdminProduits ───────────────────────────────────────────────────────
const AdminProduits = () => {
    const [produits, setProduits]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [search, setSearch]               = useState('');
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [successMsg, setSuccessMsg]       = useState('');
    const [errorMsg, setErrorMsg]           = useState('');
    const [showModal, setShowModal]         = useState(false);
    const [editProduct, setEditProduct]     = useState(null);
    const [categories, setCategories]       = useState([]);
    const [suppliers, setSuppliers]         = useState([]);

    useEffect(() => {
        getAllCategories().then(r => setCategories(r.data.categories || [])).catch(console.error);
        getAllSuppliers?.()?.then(r => setSuppliers(r.data.suppliers || [])).catch(() => {});
    }, []);

    const fetchProduits = async () => {
        setLoading(true);
        try {
            const res = await getAllProducts({ search: search || undefined, page });
            setProduits(res.data.products);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProduits(); }, [page]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProduits(); };

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            setProduits(prev => prev.filter(p => p.id !== id));
            setSuccessMsg('Produit supprimé avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const openCreate = () => { setEditProduct(null); setShowModal(true); };
    const openEdit   = (p)  => { setEditProduct(p);   setShowModal(true); };
    const closeModal = ()   => { setShowModal(false);  setEditProduct(null); };

    const handleSaved = () => {
        closeModal();
        setPage(1);
        fetchProduits();
        setSuccessMsg(editProduct ? 'Produit modifié avec succès.' : 'Produit créé avec succès.');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Produits</h2>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                    <FiPlus size={16} /> Nouveau produit
                </button>
            </div>

            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg   && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* RECHERCHE */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
                    />
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-emerald-500 transition text-sm">
                    Rechercher
                </button>
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Produit</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Catégorie</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Producteur</th>
                                <th className="text-right px-5 py-4 font-bold text-[#2c2c2c]">Prix</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Stock</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produits.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-black/40">Aucun produit trouvé</td></tr>
                            ) : produits.map((produit) => (
                                <tr key={produit.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                                                {produit.images?.[0]?.url ? (
                                                    <img src={produit.images[0].url} alt={produit.name_fr} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">🌿</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#2c2c2c] line-clamp-1">{produit.name_fr}</p>
                                                <p className="text-xs text-black/40">#{produit.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-black/60">{produit.category_name || '—'}</td>
                                    <td className="px-5 py-4 text-black/60">{produit.supplier_name || '—'}</td>
                                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                                        {produit.min_price ? formatPrice(parseFloat(produit.min_price)) : '—'}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            parseInt(produit.total_stock) > 10 ? 'bg-emerald-100 text-emerald-700'
                                            : parseInt(produit.total_stock) > 0 ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {produit.total_stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            produit.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {produit.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openEdit(produit)}
                                                className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition"
                                                title="Modifier"
                                            >
                                                <FiEdit size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(produit.id)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                                                title="Supprimer"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition ${
                                page === i + 1 ? 'bg-emerald-600 text-white' : 'bg-white text-black/50 hover:bg-emerald-100'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-[#2c2c2c] mb-2">Supprimer ce produit ?</h3>
                            <p className="text-black/50 text-sm mb-6">Cette action est irréversible. Toutes les variantes seront supprimées.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                                    Annuler
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <ProductFormModal
                    product={editProduct}
                    categories={categories}
                    suppliers={suppliers}
                    onClose={closeModal}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default AdminProduits;