import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllProducts, deleteProduct, createProduct, updateProduct, getAllCategories, getAllSuppliers } from '../../../services/adminService';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiUpload } from 'react-icons/fi';
import formatPrice from '../../../utils/formatPrice';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import api from '../../../services/api';
import { FiTag } from "react-icons/fi";

const BLANK_FORM = {
    name_fr: '', description_fr: '', ethical_info_fr: '', origin: '',
    usage_fr: '', ingredients_fr: '', precautions_fr: '', certifications: '',
    supplier_id: '', category_id: '', slug: '',
    is_active: true, is_featured: false, is_new: false,
    low_stock_threshold: 5,
};

const BLANK_VARIANT = {
    price: '', cost_price: '',
    stock: '0', sku: '', weight_grams: '',
    attributes: [{ type_fr: '', value_fr: '', unit: '' }],
};

const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full bg-[#f9f5f0] border-2 border-transparent focus:border-[#4a8c42] focus:bg-white rounded-xl px-4 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25";
const textareaCls = inputCls + " resize-none";

// ─── VariantEditRow — inchangé ────────────────────────────────────────────────
const VariantPromotions = ({ variantId, productId }) => {
  const [promos, setPromos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const [form, setForm] = useState({
    discount_type: 'percent', discount_value: '',
    starts_at: new Date().toISOString().slice(0, 10),
    expires_at: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/variants/${variantId}/promotions`);
      setPromos(res.data.promotions || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [productId, variantId]);

  useEffect(() => { load(); }, [load]);

  const isActivePromo = (p) =>
    p.is_active &&
    new Date(p.starts_at) <= new Date() &&
    new Date(p.expires_at) > new Date();

  const handleCreate = async () => {
    if (!form.discount_value || !form.expires_at) {
      setErr('Valeur et date d\'expiration requis.'); return;
    }
    setSaving(true); setErr('');
    try {
      await api.post(`/products/${productId}/variants/${variantId}/promotions`, form);
      setShowForm(false);
      setForm({ discount_type: 'percent', discount_value: '', starts_at: new Date().toISOString().slice(0,10), expires_at: '' });
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (promo) => {
    try {
      await api.put(`/products/${productId}/variants/${variantId}/promotions/${promo.id}`, {
        is_active: !promo.is_active
      });
      load();
    } catch { /* silent */ }
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      await api.delete(`/products/${productId}/variants/${variantId}/promotions/${promoId}`);
      load();
    } catch { /* silent */ }
  };

  return (
    <div className="mt-3 pt-3 border-t border-black/5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-black/40 uppercase tracking-wider">🏷️ Promotions variante</p>
        <button
          onClick={() => setShowForm(s => !s)}
          className="text-xs font-bold text-[#2d5a27] hover:text-emerald-700 flex items-center gap-1"
        >
          <FiPlus size={12}/> Ajouter
        </button>
      </div>

      {err && <p className="text-red-500 text-xs font-semibold">❌ {err}</p>}

      {showForm && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-black/40 mb-1">Type</label>
              <select
                className={inputCls}
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black/40 mb-1">
                Valeur {form.discount_type === 'percent' ? '(1-100%)' : ''}
              </label>
              <input
                type="number" min="0"
                max={form.discount_type === 'percent' ? 100 : undefined}
                step={form.discount_type === 'percent' ? 1 : 0.5}
                className={inputCls}
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percent' ? '20' : '5.000'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-black/40 mb-1">Début</label>
              <input type="date" className={inputCls}
                value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/40 mb-1">Expiration *</label>
              <input type="date" className={inputCls}
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setErr(''); }}
              className="flex-1 border border-gray-200 text-black/40 text-xs font-bold py-2 rounded-xl hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="flex-[2] bg-[#2d5a27] hover:bg-[#4a8c42] text-white text-xs font-bold py-2 rounded-xl disabled:opacity-50">
              {saving ? '⏳' : '✅ Créer la promo'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-black/30 text-center py-2">Chargement...</p>
      ) : promos.length === 0 ? (
        <p className="text-xs text-black/25 text-center py-1">Aucune promotion</p>
      ) : (
        <div className="space-y-2">
          {promos.map(p => {
            const active = isActivePromo(p);
            const expired = new Date(p.expires_at) <= new Date();
            return (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-emerald-500 animate-pulse' : expired ? 'bg-red-400' : 'bg-gray-300'}`} />
                  <div>
                    <span className="text-xs font-bold text-[#2c2c2c]">
                      {p.discount_type === 'percent' ? `−${p.discount_value}%` : `−${parseFloat(p.discount_value).toFixed(3)} DT`}
                    </span>
                    <p className="text-xs text-black/35">
                      {new Date(p.starts_at).toLocaleDateString('fr-FR')} → {new Date(p.expires_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(p)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${p.is_active ? 'bg-[#4a8c42]' : 'bg-gray-300'}`}
                    title={p.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${p.is_active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-1 text-red-400 hover:text-red-600 transition">
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const VariantEditRow = ({ variant, productId, onDeleted, onChange }) => {
  const [showPromos, setShowPromos] = useState(false);
  const [vals, setVals] = useState({
    price:        variant.price        ?? '',
    cost_price:   variant.cost_price   ?? '',
    stock:        variant.stock        ?? 0,
    sku:          variant.sku          ?? '',
    weight_grams: variant.weight_grams ?? '',
    is_active:    variant.is_active    ?? true,
    attributes:   variant.attributes?.map(a => ({ type_fr: a.type_fr, value_fr: a.value_fr, unit: a.unit ?? '' })) ?? [],
  });
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => {
    const next = { ...vals, [k]: v };
    setVals(next);
    onChange(variant.id, next);
  };

  const setAttrField = (ai, k, v) => {
    const next = {
      ...vals,
      attributes: vals.attributes.map((a, j) => j === ai ? { ...a, [k]: v } : a),
    };
    setVals(next);
    onChange(variant.id, next);
  };

  const addAttr = () => {
    const next = { ...vals, attributes: [...vals.attributes, { type_fr: '', value_fr: '', unit: '' }] };
    setVals(next);
    onChange(variant.id, next);
  };

  const removeAttr = (ai) => {
    const next = { ...vals, attributes: vals.attributes.filter((_, j) => j !== ai) };
    setVals(next);
    onChange(variant.id, next);
  };

  const del = async () => {
    if (!window.confirm('Supprimer cette variante ?')) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${productId}/variants/${variant.id}`);
      onDeleted(variant.id);
    } catch (e) { setErr(e.response?.data?.message || 'Erreur suppression'); setDeleting(false); }
  };

  const attrLabel = vals.attributes.filter(a => a.type_fr && a.value_fr).length
    ? vals.attributes.filter(a => a.type_fr && a.value_fr).map(a => `${a.type_fr}: ${a.value_fr}`).join(' · ')
    : 'Variante sans attribut';

  return (
    <div className="bg-[#f9f5f0] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-[#2c2c2c]">{attrLabel}</p>
        <div className="flex gap-1">
          <button
            onClick={() => setShowPromos(s => !s)}
            className="p-2 hover:bg-amber-50 text-amber-500 rounded-xl transition text-xs font-bold flex items-center gap-1"
          >
            <FiTag size={13}/> Promos
          </button>
          <button onClick={del} disabled={deleting} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition text-xs font-bold flex items-center gap-1">
            <FiTrash2 size={13}/> {deleting ? '...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {err && <p className="text-red-500 text-xs font-semibold">❌ {err}</p>}

      <div className="space-y-3 pt-2 border-t border-black/5">
        {/* Attributs */}
        <div>
          <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2">Attributs</p>
          <div className="space-y-2">
            {vals.attributes.map((a, ai) => (
              <div key={ai} className="flex gap-2 items-center">
                <input className={inputCls + " flex-1"} value={a.type_fr}
                    onChange={e => setAttrField(ai, 'type_fr', e.target.value)}
                    placeholder="Type (ex: Poids)" />
                    <input className={inputCls + " flex-1"} value={a.value_fr}
                    onChange={e => setAttrField(ai, 'value_fr', e.target.value)}
                    placeholder="Valeur (ex: 500)" />
                    <input className="bg-[#f9f5f0] border-2 border-transparent focus:border-[#4a8c42] focus:bg-white rounded-xl px-3 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25 w-20 shrink-0"
                    value={a.unit ?? ''}
                    onChange={e => setAttrField(ai, 'unit', e.target.value)}
                    placeholder="Unité" />
                    {vals.attributes.length > 1 && (
                    <button onClick={() => removeAttr(ai)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><FiX size={12}/></button>
                    )}
              </div>
            ))}
          </div>
          <button onClick={addAttr} className="mt-2 text-xs font-bold text-[#2d5a27] hover:text-emerald-700 transition">+ Ajouter attribut</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Prix *">
            <input type="number" min="0" step="0.01" className={inputCls} value={vals.price} onChange={e => set('price', e.target.value)} />
          </Field>
          <Field label="Coût">
            <input type="number" min="0" step="0.01" className={inputCls} value={vals.cost_price} onChange={e => set('cost_price', e.target.value)} />
          </Field>
          <Field label="Stock">
            <input type="number" min="0" className={inputCls} value={vals.stock} onChange={e => set('stock', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative shrink-0 ${vals.is_active ? 'bg-[#4a8c42]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${vals.is_active ? 'left-5' : 'left-0.5'}`}/>
          </button>
          <span className="text-xs font-bold text-black/50">{vals.is_active ? 'Variante active' : 'Variante inactive'}</span>
        </div>
      </div>

      {showPromos && <VariantPromotions variantId={variant.id} productId={productId} />}
    </div>
  );
};

// ─── AddVariantForm — inchangé ────────────────────────────────────────────────
const AddVariantForm = ({ productId, onAdded, onCancel }) => {
    const [v, setV]       = useState({ ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '', unit: '' }] });
    const [saving, setSaving] = useState(false);
    const [err, setErr]   = useState('');

    const set     = (k, val) => setV(p => ({ ...p, [k]: val }));
    const setAttr = (ai, k, val) => setV(p => ({ ...p, attributes: p.attributes.map((a, j) => j === ai ? { ...a, [k]: val } : a) }));
    const addAttr = () => setV(p => ({ ...p, attributes: [...p.attributes, { type_fr: '', value_fr: '', unit: '' }] }));
    const remAttr = (ai) => setV(p => ({ ...p, attributes: p.attributes.filter((_, j) => j !== ai) }));

    const save = async () => {
        if (!v.price || parseFloat(v.price) < 0) { setErr('Prix invalide'); return; }
        setSaving(true); setErr('');
        try {
            const fd = new FormData();
            fd.append('price', v.price);
            if (v.cost_price)    fd.append('cost_price', v.cost_price);
            fd.append('stock', v.stock || '0');
            if (v.sku)          fd.append('sku', v.sku);
            if (v.weight_grams) fd.append('weight_grams', v.weight_grams);
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Prix *">
                    <input type="number" min="0" step="0.01" className={inputCls} value={v.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Coût">
                    <input type="number" min="0" step="0.01" className={inputCls} value={v.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="Stock">
                    <input type="number" min="0" className={inputCls} value={v.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <input className={inputCls + " flex-1"} value={a.type_fr}
                                onChange={e => setAttr(ai, 'type_fr', e.target.value)} placeholder="Type (ex: Poids)" />
                                <input className={inputCls + " flex-1"} value={a.value_fr}
                                onChange={e => setAttr(ai, 'value_fr', e.target.value)} placeholder="Valeur (ex: 500)" />
                            <input className="bg-[#f9f5f0] border-2 border-transparent focus:border-[#4a8c42] focus:bg-white rounded-xl px-3 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25 w-20 shrink-0"
                                value={a.unit ?? ''}
                                onChange={e => setAttr(ai, 'unit', e.target.value)} placeholder="Unité" />
                            {v.attributes.length > 1 && (
                                <button onClick={() => remAttr(ai)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><FiX size={12}/></button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={addAttr} className="mt-2 text-xs font-bold text-[#2d5a27] hover:text-emerald-700 transition">+ Ajouter attribut</button>
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onCancel} className="flex-1 border border-gray-200 text-black/50 font-bold py-2 rounded-xl text-xs hover:bg-gray-50 transition">Annuler</button>
                <button onClick={save} disabled={saving} className="flex-[2] bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition">
                    {saving ? '⏳ Ajout...' : '✅ Ajouter la variante'}
                </button>
            </div>
        </div>
    );
};

// ─── ToggleRow helper ─────────────────────────────────────────────────────────
const ToggleRow = ({ label, sub, value, onChange, color = 'bg-[#4a8c42]' }) => (
    <div className="flex items-center justify-between bg-[#f9f5f0] rounded-xl px-5 py-4">
        <div>
            <p className="font-bold text-sm text-[#2c2c2c]">{label}</p>
            {sub && <p className="text-xs text-black/40">{sub}</p>}
        </div>
        <button
            onClick={() => onChange(!value)}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${value ? color : 'bg-gray-300'}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-6' : 'left-0.5'}`}/>
        </button>
    </div>
);

// ─── ProductFormModal ─────────────────────────────────────────────────────────
const ProductFormModal = ({ product, categories, suppliers, onClose, onSaved }) => {
    const isEdit = !!product;

    const [form, setForm] = useState(isEdit ? {
        name_fr:         product.name_fr        || '',
        description_fr:  product.description_fr || '',
        ethical_info_fr: product.ethical_info_fr || '',
        origin:          product.origin          || '',
        usage_fr:        product.usage_fr        || '',
        ingredients_fr:  product.ingredients_fr  || '',
        precautions_fr:  product.precautions_fr  || '',
        certifications:  Array.isArray(product.certifications)
            ? product.certifications.join(', ')
            : (product.certifications || ''),
        supplier_id:         product.supplier_id  || '',
        category_id:         product.category_id  || '',
        slug:                product.slug          || '',
        is_active:           product.is_active     ?? true,
        is_featured:         product.is_featured   ?? false,
        is_new:              product.is_new        ?? false,
        low_stock_threshold: product.low_stock_threshold ?? 5,
    } : { ...BLANK_FORM });

    const [variants, setVariants]         = useState([{ ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '' , unit: ''}] }]);
    const [editVariants, setEditVariants] = useState(product?.variants || []);
    const [showAddVariant, setShowAddVariant] = useState(false);
    const [variantEdits, setVariantEdits] = useState({}); 
    const [images, setImages]     = useState([]);
    const [previews, setPreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);   
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [tab, setTab]           = useState('general');
    const fileRef = useRef();
    const [formLoading, setFormLoading] = useState(isEdit);

    useEffect(() => {
        if (!isEdit || !product.id) return;
        setFormLoading(true);
        api.get(`/products/admin/${product.id}?admin=true`)
            .then(res => {
                const p = res.data.product || res.data;
                if (!p) return;
                console.log("Produit chargé :", p);
                // Derive threshold from first variant if not on product level
                const threshold = p.low_stock_threshold
                    ?? p.variants?.[0]?.low_stock_threshold
                    ?? 5;
                setForm({
                    name_fr:         p.name_fr        || '',
                    description_fr:  p.description_fr || '',
                    ethical_info_fr: p.ethical_info_fr || '',
                    origin:          p.origin          || '',
                    usage_fr:        p.usage_fr        || '',
                    ingredients_fr:  p.ingredients_fr  || '',
                    precautions_fr:  p.precautions_fr  || '',
                    certifications:  Array.isArray(p.certifications)
                        ? p.certifications.join(', ')
                        : (p.certifications || ''),
                    supplier_id:         p.supplier_id  || '',
                    category_id:         p.category_id  || '',
                    slug:                p.slug          || '',
                    is_active:           p.is_active     ?? true,
                    is_featured:         p.is_featured   ?? false,
                    is_new:              p.is_new        ?? false,
                    low_stock_threshold: threshold,
                });
                setEditVariants(p.variants || []);
                setExistingImages(p.images || []);
            })
            .catch(() => {})
            .finally(() => setFormLoading(false));
    }, [isEdit, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleImages = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const setVariant = (vi, k, v) => setVariants(vs => vs.map((vt, i) => i === vi ? { ...vt, [k]: v } : vt));
    const setAttr    = (vi, ai, k, v) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: vt.attributes.map((a, j) => j === ai ? { ...a, [k]: v } : a),
    }));
    const addAttr    = (vi) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: [...vt.attributes, { type_fr: '', value_fr: '' , unit: ''}],
    }));
    const removeAttr = (vi, ai) => setVariants(vs => vs.map((vt, i) => i !== vi ? vt : {
        ...vt, attributes: vt.attributes.filter((_, j) => j !== ai),
    }));
    const addVariant    = () => setVariants(vs => [...vs, { ...BLANK_VARIANT, attributes: [{ type_fr: '', value_fr: '', unit: '' }] }]);
    const removeVariant = (vi) => setVariants(vs => vs.filter((_, i) => i !== vi));

    const handleSubmit = async () => {
        setError('');
        if (!form.name_fr.trim())        { setError('Le nom (FR) est obligatoire.');         setTab('general');  return; }
        if (!form.description_fr.trim()) { setError('La description (FR) est obligatoire.'); setTab('general');  return; }
        if (!form.category_id)           { setError('La catégorie est obligatoire.');         setTab('general');  return; }
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
                } else if (['is_active', 'is_featured', 'is_new'].includes(k)) {
                    fd.append(k, String(v));
                } else if (k === 'low_stock_threshold') {
                    fd.append(k, String(parseInt(v) || 5));
                } else if (v !== '' && v !== null && v !== undefined) {
                    fd.append(k, v);
                }
            });

            images.forEach(img => fd.append('images', img));
            fd.append('existingImages', JSON.stringify(existingImages)); 

            if (!isEdit) {
                const cleanVariants = variants.map(v => ({
                    price:         parseFloat(v.price),
                    cost_price:    v.cost_price    ? parseFloat(v.cost_price)    : null,
                    stock:         parseInt(v.stock) || 0,
                    sku:           v.sku           || null,
                    weight_grams:  v.weight_grams  ? parseInt(v.weight_grams)   : null,
                    attributes:    v.attributes.filter(a => a.type_fr && a.value_fr),
                    low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
                }));
                fd.append('variants', JSON.stringify(cleanVariants));
            }

            isEdit ? await updateProduct(product.id, fd) : await createProduct(fd);
            // Sauvegarde les variantes modifiées
            if (isEdit && Object.keys(variantEdits).length > 0) {
            await Promise.all(
                Object.entries(variantEdits).map(([variantId, vals]) => {
                const fd2 = new FormData();
                fd2.append('price',        String(vals.price));
                fd2.append('cost_price',   String(vals.cost_price));
                fd2.append('stock',        String(vals.stock));
                fd2.append('sku',          String(vals.sku));
                fd2.append('weight_grams', String(vals.weight_grams));
                fd2.append('is_active',    String(vals.is_active));
                const cleanAttrs = vals.attributes.filter(a => a.type_fr && a.value_fr);
                if (cleanAttrs.length) fd2.append('attributes', JSON.stringify(cleanAttrs));
                return api.put(`/products/${product.id}/variants/${variantId}`, fd2, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                })
            );
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
                <div className="flex items-center justify-between px-4 sm:px-7 py-5 border-b border-gray-100 shrink-0">
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

                <div className="px-4 sm:px-7 pt-3 shrink-0">
                    <p className="text-xs text-black/35"><span className="text-red-400 font-bold">*</span> Champ obligatoire</p>
                </div>

                {error && (
                    <div className="mx-4 sm:mx-7 mt-3 bg-red-50 border border-red-200 text-red-700 font-semibold px-4 py-3 rounded-xl text-sm flex items-center gap-2 shrink-0">
                        ❌ {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-4 sm:px-7 shrink-0 overflow-x-auto mt-3">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                                tab === t.id ? 'border-[#2d5a27] text-[#2d5a27]' : 'border-transparent text-black/40 hover:text-black/70'
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
                <div className="overflow-y-auto flex-1 px-4 sm:px-7 py-6">

                    {formLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="text-3xl animate-spin">🌿</div>
                            <p className="text-sm text-black/40 font-medium">Chargement des données...</p>
                        </div>
                    )}

                    {/* GÉNÉRAL */}
                    {!formLoading && tab === 'general' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </div>
                    )}

                    {/* DÉTAILS */}
                    {!formLoading && tab === 'details' && (
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

                    {/* VARIANTES */}
                    {!formLoading && tab === 'variants' && (
                        <div className="space-y-4">
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
                                                onChange={(id, vals) => setVariantEdits(prev => ({ ...prev, [id]: vals }))}
                                                onDeleted={vid => setEditVariants(prev => prev.filter(x => x.id !== vid))}
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
                                            className="w-full border-2 border-dashed border-emerald-300 hover:border-[#4a8c42] text-[#2d5a27] font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50"
                                        >
                                            + Ajouter une variante
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {variants.map((v, vi) => (
                                        <div key={vi} className="bg-[#f9f5f0] rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-sm text-[#2c2c2c]">Variante {vi + 1}</p>
                                                {variants.length > 1 && (
                                                    <button onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600 transition p-1"><FiX size={14}/></button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <Field label="Prix" required>
                                                    <input type="number" min="0" step="0.01" className={inputCls} value={v.price} onChange={e => setVariant(vi, 'price', e.target.value)} placeholder="0.00" />
                                                </Field>
                                                <Field label="Coût">
                                                    <input type="number" min="0" step="0.01" className={inputCls} value={v.cost_price} onChange={e => setVariant(vi, 'cost_price', e.target.value)} placeholder="0.00" />
                                                </Field>
                                                <Field label="Stock">
                                                    <input type="number" min="0" className={inputCls} value={v.stock} onChange={e => setVariant(vi, 'stock', e.target.value)} placeholder="0" />
                                                </Field>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                            <input className={inputCls + " flex-1"} value={a.type_fr}
                                                                onChange={e => setAttr(vi, ai, 'type_fr', e.target.value)}
                                                                placeholder="Type (ex: Poids)" />
                                                                <input className={inputCls + " flex-1"} value={a.value_fr}
                                                                onChange={e => setAttr(vi, ai, 'value_fr', e.target.value)}
                                                                placeholder="Valeur (ex: 500)" />
                                                                <input className="bg-[#f9f5f0] border-2 border-transparent focus:border-[#4a8c42] focus:bg-white rounded-xl px-3 py-2.5 text-sm text-[#2c2c2c] outline-none transition placeholder-black/25 w-20 shrink-0"
                                                                value={a.unit ?? ''}
                                                                onChange={e => setAttr(vi, ai, 'unit', e.target.value)}
                                                                placeholder="Unité" />
                                                                {v.attributes.length > 1 && (
                                                                <button onClick={() => removeAttr(vi, ai)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><FiX size={12}/></button>
                                                                )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => addAttr(vi)} className="mt-2 text-xs font-bold text-[#2d5a27] hover:text-emerald-700 transition">+ Ajouter attribut</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addVariant}
                                        className="w-full border-2 border-dashed border-emerald-300 hover:border-[#4a8c42] text-[#2d5a27] font-bold py-3 rounded-xl text-sm transition hover:bg-emerald-50"
                                    >
                                        + Ajouter une variante
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                 {/* IMAGES - avec suppression possible */}
                    {!formLoading && tab === 'images' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="w-full border-2 border-dashed border-emerald-300 hover:border-[#4a8c42] rounded-2xl py-10 flex flex-col items-center gap-3 text-[#2d5a27] hover:bg-emerald-50 transition"
                            >
                                <FiUpload size={28} />
                                <p className="font-bold text-sm">Ajouter de nouvelles photos</p>
                                <p className="text-xs text-black/30">JPG, PNG, WEBP — Plusieurs fichiers acceptés</p>
                            </button>
                            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />

                            {/* Images existantes avec bouton supprimer */}
                            {isEdit && existingImages.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">📸 Images actuelles</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {existingImages.map((img, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#ecfdf5] group">
                                                <img 
                                                    src={img.url} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (!window.confirm('Supprimer cette image ?')) return;
                                                        setExistingImages(prev => prev.filter((_, index) => index !== i));
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                                    title="Supprimer cette image"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Nouvelles images en preview */}
                            {previews.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">➕ Nouvelles images à ajouter</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {previews.map((src, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#ecfdf5]">
                                                <img src={src} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        setImages(imgs => imgs.filter((_, j) => j !== i));
                                                        setPreviews(ps => ps.filter((_, j) => j !== i));
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isEdit && previews.length === 0 && (
                                <p className="text-xs text-black/30 text-center py-8">Aucune image sélectionnée pour le nouveau produit</p>
                            )}
                        </div>
                    )}

                    {/* ── PARAMÈTRES ── avec is_new, is_featured, low_stock_threshold */}
                    {!formLoading && tab === 'settings' && (
                        <div className="space-y-4">

                            <ToggleRow
                                label="Produit actif"
                                sub="Visible sur le site si activé"
                                value={form.is_active}
                                onChange={v => set('is_active', v)}
                            />

                            <ToggleRow
                                label="Coup de cœur ❤️"
                                sub="Apparaît dans la section « Nos Sélections » sur la page d'accueil"
                                value={form.is_featured}
                                onChange={v => set('is_featured', v)}
                                color="bg-[#c8872a]"
                            />

                            <ToggleRow
                                label="Nouveau 🆕"
                                sub={
                                    form.is_new
                                        ? "Badge actif — désactiver pour le retirer manuellement"
                                        : "Badge inactif — s'active automatiquement si le produit a moins de 30 jours"
                                }
                                value={form.is_new}
                                onChange={v => set('is_new', v)}
                                color="bg-blue-400"
                            />

                            {/* Seuil stock faible */}
                            <div className="bg-[#f9f5f0] rounded-xl px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-sm text-[#2c2c2c]">Seuil stock faible</p>
                                        <p className="text-xs text-black/40">Alerte quand le stock passe sous ce niveau</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => set('low_stock_threshold', Math.max(1, (parseInt(form.low_stock_threshold) || 5) - 1))}
                                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold text-black/50 hover:bg-gray-100 transition flex items-center justify-center text-lg"
                                        >−</button>
                                        <input
                                            type="number"
                                            min="1"
                                            max="999"
                                            value={form.low_stock_threshold}
                                            onChange={e => set('low_stock_threshold', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center bg-white border-2 border-gray-200 focus:border-[#4a8c42] rounded-xl px-2 py-1.5 text-sm font-bold text-[#2c2c2c] outline-none transition"
                                        />
                                        <button
                                            onClick={() => set('low_stock_threshold', (parseInt(form.low_stock_threshold) || 5) + 1)}
                                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold text-black/50 hover:bg-gray-100 transition flex items-center justify-center text-lg"
                                        >+</button>
                                    </div>
                                </div>
                                <p className="text-xs text-black/30">
                                    S'applique à toutes les variantes de ce produit.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-4 sm:px-7 py-5 border-t border-gray-100 bg-[#fdf6ec] shrink-0">
                    <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-black/60 font-bold py-3 rounded-xl hover:bg-gray-100 transition text-sm">
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] bg-[#2d5a27] hover:bg-[#4a8c42] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
                    >
                        {loading ? '⏳ Enregistrement...' : isEdit ? '💾 Enregistrer les modifications' : '✅ Créer le produit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main AdminProduits ───────────────────────────────────────────────────────
const AdminProduits = () => {
    const { currency, updateCurrency } = useSiteSettings();
    const [currencyInput, setCurrencyInput] = useState(currency);

    const [produits, setProduits]               = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [search, setSearch]                   = useState('');
    const [committedSearch, setCommittedSearch] = useState('');
    const [page, setPage]                       = useState(1);
    const [totalPages, setTotalPages]           = useState(1);
    const [deleteConfirm, setDeleteConfirm]     = useState(null);
    const [successMsg, setSuccessMsg]           = useState('');
    const [errorMsg, setErrorMsg]               = useState('');
    const [showModal, setShowModal]             = useState(false);
    const [editProduct, setEditProduct]         = useState(null);
    const [categories, setCategories]           = useState([]);
    const [suppliers, setSuppliers]             = useState([]);

    // ── Filtres ──────────────────────────────────────────────────────────────
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterStatus,   setFilterStatus]   = useState('');   // '' | 'true' | 'false'

    useEffect(() => {
        getAllCategories().then(r => setCategories(r.data.categories || [])).catch(console.error);
        getAllSuppliers?.()?.then(r => setSuppliers(r.data.suppliers || [])).catch(() => {});
    }, []);

    const fetchProduits = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search: committedSearch || undefined, page };
            if (filterCategory) params.category_id = filterCategory;
            if (filterSupplier) params.supplier_id  = filterSupplier;
            if (filterStatus !== '') params.is_active = filterStatus;

            const res = await getAllProducts(params);
            setProduits(res.data.products);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, committedSearch, filterCategory, filterSupplier, filterStatus]);

    useEffect(() => { fetchProduits(); }, [fetchProduits]);

    // reset page quand un filtre change
    const applyFilter = (setter) => (val) => {
        setPage(1);
        setter(val);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setCommittedSearch(search);
    };

    const clearFilters = () => {
        setPage(1);
        setFilterCategory('');
        setFilterSupplier('');
        setFilterStatus('');
        setSearch('');
        setCommittedSearch('');
    };

    const hasActiveFilters = filterCategory || filterSupplier || filterStatus !== '' || committedSearch;

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

    // aplatir catégories pour le select
    const flatCategories = categories.flatMap(c => [
        { id: c.id, label: c.name_fr },
        ...(c.children || []).map(s => ({ id: s.id, label: `↳ ${s.name_fr}` })),
    ]);

    const selectCls = "bg-white border-2 border-gray-200 hover:border-[#4a8c42] focus:border-[#4a8c42] rounded-xl px-3 py-2.5 text-sm text-[#2c2c2c] outline-none transition cursor-pointer";

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-bold font-serif text-[#2c2c2c]">Gestion des Produits</h2>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* ── Currency ── */}
                    <div className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-[#4a8c42] transition rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-black/40 whitespace-nowrap hidden sm:block">
                            Devise :
                        </span>
                        <input
                            type="text"
                            value={currencyInput}
                            onChange={e => setCurrencyInput(e.target.value)}
                            onBlur={() => updateCurrency(currencyInput)}
                            onKeyDown={e => e.key === 'Enter' && updateCurrency(currencyInput)}
                            className="w-14 text-center text-sm font-black text-[#2d5a27] outline-none bg-transparent placeholder-black/25"
                            maxLength={6}
                        />
                        <span className="text-xs text-black/25 hidden sm:block">↵</span>
                    </div>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-[#2d5a27] hover:bg-[#4a8c42] text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                    >
                        <FiPlus size={16} /> Nouveau produit
                    </button>
                </div>
            </div>

            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">✅ {successMsg}</div>}
            {errorMsg   && <div className="bg-red-50 border border-red-200 text-red-700 font-semibold px-5 py-3 rounded-xl mb-5 text-sm">❌ {errorMsg}</div>}

            {/* ── Recherche ── */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-3">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4a8c42] focus:outline-none text-sm transition"
                    />
                </div>
                <button type="submit" className="bg-[#2d5a27] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#4a8c42] transition text-sm">
                    Rechercher
                </button>
            </form>

            {/* ── Filtres ── */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Catégorie */}
                    <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                        <label className="text-xs font-bold text-black/40 uppercase tracking-wider">Catégorie</label>
                        <select
                            className={selectCls}
                            value={filterCategory}
                            onChange={e => applyFilter(setFilterCategory)(e.target.value)}
                        >
                            <option value="">Toutes</option>
                            {flatCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fournisseur */}
                    <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                        <label className="text-xs font-bold text-black/40 uppercase tracking-wider">Fournisseur</label>
                        <select
                            className={selectCls}
                            value={filterSupplier}
                            onChange={e => applyFilter(setFilterSupplier)(e.target.value)}
                        >
                            <option value="">Tous</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Statut */}
                    <div className="flex flex-col gap-1 min-w-[120px] flex-1">
                        <label className="text-xs font-bold text-black/40 uppercase tracking-wider">Statut</label>
                        <select
                            className={selectCls}
                            value={filterStatus}
                            onChange={e => applyFilter(setFilterStatus)(e.target.value)}
                        >
                            <option value="">Tous</option>
                            <option value="true"> Actifs</option>
                            <option value="false"> Inactifs</option>
                        </select>
                    </div>

                    {/* Bouton reset — visible seulement si filtres actifs */}
                    {hasActiveFilters && (
                        <div className="flex flex-col gap-1 shrink-0 self-end">
                            <label className="text-xs font-bold text-black/0 uppercase tracking-wider select-none">⠀</label>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 border-2 border-gray-200 text-black/50 hover:border-red-300 hover:text-red-500 font-bold px-4 py-2.5 rounded-xl text-sm transition"
                            >
                                <FiX size={14}/> Réinitialiser
                            </button>
                        </div>
                    )}
                </div>

                {/* Résumé filtres actifs */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {committedSearch && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                🔍 "{committedSearch}"
                                <button onClick={() => { setSearch(''); setCommittedSearch(''); setPage(1); }} className="hover:text-red-500 ml-0.5"><FiX size={10}/></button>
                            </span>
                        )}
                        {filterCategory && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                📁 {flatCategories.find(c => c.id === filterCategory)?.label}
                                <button onClick={() => applyFilter(setFilterCategory)('')} className="hover:text-red-500 ml-0.5"><FiX size={10}/></button>
                            </span>
                        )}
                        {filterSupplier && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                🏭 {suppliers.find(s => s.id === filterSupplier)?.name}
                                <button onClick={() => applyFilter(setFilterSupplier)('')} className="hover:text-red-500 ml-0.5"><FiX size={10}/></button>
                            </span>
                        )}
                        {filterStatus !== '' && (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                {filterStatus === 'true' ? '✅ Actifs' : '⛔ Inactifs'}
                                <button onClick={() => applyFilter(setFilterStatus)('')} className="hover:text-red-500 ml-0.5"><FiX size={10}/></button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.07)] overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-4xl animate-spin">🌿</div>
                    </div>
                ) : (
                    <table className="w-full text-sm min-w-[580px]">
                        <thead>
                            <tr className="bg-[#f9f5f0] border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Produit</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Catégorie</th>
                                <th className="text-left px-5 py-4 font-bold text-[#2c2c2c]">Producteur</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Statut</th>
                                <th className="text-center px-5 py-4 font-bold text-[#2c2c2c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produits.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2 text-black/30">
                                            <span className="text-4xl">🔍</span>
                                            <p className="font-medium text-sm">Aucun produit trouvé</p>
                                            {hasActiveFilters && (
                                                <button onClick={clearFilters} className="text-xs text-[#2d5a27] font-bold hover:underline mt-1">
                                                    Réinitialiser les filtres
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : produits.map(produit => (
                                <tr key={produit.id} className="border-b border-gray-50 hover:bg-[#fdf6ec] transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                                                {produit.images?.[0]?.url
                                                    ? <img src={produit.images[0].url} alt={produit.name_fr} className="w-full h-full object-cover" />
                                                    : <span className="text-lg">🌿</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#2c2c2c] line-clamp-1">{produit.name_fr}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <p className="text-xs text-black/40">#{produit.id.slice(0, 8)}</p>
                                                    {produit.min_price && (
                                                        <p className="text-xs font-bold text-[#2d5a27]">
                                                            dès {formatPrice(parseFloat(produit.min_price), currency)}
                                                        </p>
                                                    )}
                                                    {produit.is_new      && <span className="text-xs bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">Nouveau</span>}
                                                    {produit.is_featured && <span className="text-xs bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">❤️ Coup de cœur</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-black/60">{produit.category_name || '—'}</td>
                                    <td className="px-5 py-4 text-black/60">{produit.supplier_name || '—'}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${produit.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {produit.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEdit(produit)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition" title="Modifier">
                                                <FiEdit size={15} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(produit.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition" title="Supprimer">
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition ${page === i + 1 ? 'bg-[#2d5a27] text-white' : 'bg-white text-black/50 hover:bg-emerald-100'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
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
            )}

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