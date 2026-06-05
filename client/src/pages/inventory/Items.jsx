import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, ChevronDown, ChevronUp, Download, Upload, Settings2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';

// ── Constants ────────────────────────────────────────────────────
const UNITS       = ['Pcs', 'Kg', 'G', 'Ltr', 'Ml', 'Box', 'Bag', 'Dozen', 'Carton', 'Meter', 'Pack', 'Nos', 'Case', 'Strip', 'Bottle', 'Sachet'];
const GST_RATES   = [0, 3, 5, 12, 18, 28];
const CESS_RATES  = [0, 1, 2, 5, 10, 15];
const ADJ_TYPES   = [
  { value: 'add',      label: 'Add Stock (Received)' },
  { value: 'subtract', label: 'Remove Stock (Damage/Loss)' },
  { value: 'set',      label: 'Set Exact Stock (Physical Count)' },
];

const emptyForm = () => ({
  name: '', sku: '', description: '', category: '', brand: '',
  unit: 'Pcs', secondaryUnit: '', conversionFactor: 1,
  mrp: '', sellingPrice: '', purchasePrice: '',
  discount: 0, discountType: 'percent', offerText: '',
  hsnCode: '', gstRate: 18, cessRate: 0, taxInclusive: false,
  stock: 0, minStock: 0, weight: '', weightUnit: 'kg',
  images: [], batches: [], trackBatch: false,
  isActive: true,
  // UI-only
  openingStock: 0,
});

const EXPORT_COLS = [
  { key: 'sku',      label: 'Item Code',       accessor: 'sku' },
  { key: 'name',     label: 'Item Name',        accessor: 'name' },
  { key: 'category', label: 'Category',         accessor: 'category' },
  { key: 'brand',    label: 'Brand',            accessor: 'brand' },
  { key: 'unit',     label: 'Unit',             accessor: 'unit' },
  { key: 'mrp',      label: 'MRP',              accessor: 'mrp' },
  { key: 'sell',     label: 'Sell Price',       accessor: 'sellingPrice' },
  { key: 'purchase', label: 'Purchase Price',   accessor: 'purchasePrice' },
  { key: 'gst',      label: 'GST %',            accessor: 'gstRate' },
  { key: 'hsn',      label: 'HSN Code',         accessor: 'hsnCode' },
  { key: 'stock',    label: 'Stock',            accessor: 'stock' },
  { key: 'minstock', label: 'Min Stock',        accessor: 'minStock' },
  { key: 'status',   label: 'Status',           accessor: 'isActive', renderExport: v => v ? 'Active' : 'Inactive' },
];

// ── Section Header (collapsible) ─────────────────────────────────
function Section({ title, open, onToggle, children }) {
  return (
    <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f8f9fa] hover:bg-[#f0f0f0] transition-colors text-left"
      >
        <span className="text-sm font-semibold text-[#333]">{title}</span>
        {open ? <ChevronUp size={15} className="text-[#9e9e9e]" /> : <ChevronDown size={15} className="text-[#9e9e9e]" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Adjust Stock Modal ───────────────────────────────────────────
function AdjustStockModal({ item, warehouses, onClose, onDone }) {
  const [wh, setWh]       = useState('Main');
  const [adjType, setAdjType] = useState('add');
  const [adjQty, setAdjQty]   = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving]     = useState(false);

  const updatedStock = () => {
    const q = Number(adjQty) || 0;
    const cur = item.stock || 0;
    if (adjType === 'add')      return cur + q;
    if (adjType === 'subtract') return Math.max(0, cur - q);
    if (adjType === 'set')      return q;
    return cur;
  };

  const save = async () => {
    if (!adjQty) return alert('Enter quantity');
    setSaving(true);
    try {
      await api.post(`/inventory/items/${item._id}/adjust-stock`, {
        warehouse: wh, adjustmentType: adjType,
        adjustQty: Number(adjQty), comments,
      });
      onDone();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <h3 className="text-sm font-semibold text-[#333]">Adjust Stock</h3>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#333] text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Warehouse */}
          <div>
            <label className="so-label">* Warehouse</label>
            <select className="so-input w-full" value={wh} onChange={e => setWh(e.target.value)}>
              <option value="Main">Main Warehouse</option>
              {warehouses.filter(w => w.name !== 'Main').map(w => (
                <option key={w._id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>
          {/* Item name (read-only) */}
          <div>
            <label className="so-label">Item Name</label>
            <input className="so-input w-full bg-[#f5f5f5]" value={item.name} readOnly />
          </div>
          {/* Adjustment type */}
          <div>
            <label className="so-label">Select Adjustment</label>
            <select className="so-input w-full" value={adjType} onChange={e => setAdjType(e.target.value)}>
              {ADJ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {/* Current / Adjust / Updated */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="so-label">Current Stock</label>
              <input className="so-input w-full bg-[#f5f5f5]" value={`${item.stock || 0} ${item.unit || ''}`} readOnly />
            </div>
            <div>
              <label className="so-label">Adjust Quantity</label>
              <input type="number" className="so-input w-full" value={adjQty} onChange={e => setAdjQty(e.target.value)} min="0" placeholder="0" />
            </div>
            <div>
              <label className="so-label">Updated Stock</label>
              <input className="so-input w-full bg-[#e8f5e9] font-semibold text-[#2e7d32]" value={`${updatedStock()} ${item.unit || ''}`} readOnly />
            </div>
          </div>
          {/* Comments */}
          <div>
            <label className="so-label">Comments</label>
            <textarea className="so-input w-full" rows={2} value={comments} onChange={e => setComments(e.target.value)} placeholder="Reason for adjustment…" />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-[#e0e0e0]">
          <button onClick={onClose} className="so-btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="so-btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Items Page ──────────────────────────────────────────────
export default function Items() {
  const [items, setItems]           = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [panelOpen, setPanelOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [sections, setSections]     = useState({ general: true, price: true, stock: true, batch: false });
  const [adjustItem, setAdjustItem] = useState(null);
  const [saving, setSaving]         = useState(false);
  const imgRef = useRef();

  // Load items
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, whRes] = await Promise.all([
        api.get('/inventory/items', { params: { search: search || undefined, category: catFilter || undefined } }),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      const data = itemRes.data;
      setItems(data);
      setWarehouses(whRes.data);
      setCategories([...new Set(data.map(i => i.category).filter(Boolean))]);
      setBrands([...new Set(data.map(i => i.brand).filter(Boolean))]);
    } finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const displayed = brandFilter ? items.filter(i => i.brand === brandFilter) : items;

  // Open forms
  const openAdd = () => { setEditing(null); setForm(emptyForm()); setSections({ general: true, price: true, stock: true, batch: false }); setPanelOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm(), ...item, openingStock: item.stock || 0 });
    setSections({ general: true, price: true, stock: true, batch: !!item.trackBatch });
    setPanelOpen(true);
  };

  // Save
  const save = async () => {
    if (!form.name) return alert('Item name is required');
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.openingStock;
      if (editing) {
        await api.put(`/inventory/items/${editing._id}`, payload);
      } else {
        const { data } = await api.post('/inventory/items', { ...payload, openingStock: form.openingStock || 0 });
      }
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    await api.delete(`/inventory/items/${id}`);
    load();
  };

  // Image upload (base64 preview)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(p => ({ ...p, images: [...(p.images || []), ev.target.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // Form helpers
  const f   = (k, v)  => setForm(p => ({ ...p, [k]: v }));
  const tog = (sec)   => setSections(p => ({ ...p, [sec]: !p[sec] }));

  // Export
  const handleExport = () => exportToExcel(items, 'items', EXPORT_COLS);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Items</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="so-btn-secondary flex items-center gap-1.5 text-xs"><Download size={13} /> Export</button>
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs"><Upload size={13} /> Import</button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} /> New</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="so-input w-44 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="so-input w-40 text-xs">
          <option value="">Select Category</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select Brand</option>
          {brands.map(b => <option key={b}>{b}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#9e9e9e]">{displayed.length} items</span>
      </div>

      {/* ── Table ── (Item Code | Item Name | Stock | Purchase Price) */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Stock</th>
              <th>Purchase Price</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-12 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-[#9e9e9e]">No items found. <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button></td></tr>
            )}
            {displayed.map(item => (
              <tr key={item._id}>
                {/* Item Code */}
                <td>
                  <span className="font-mono text-xs text-[#1e88e5] bg-[#e3f2fd] px-2 py-0.5 rounded">
                    {item.sku || '—'}
                  </span>
                </td>
                {/* Item Name */}
                <td>
                  <div className="flex items-center gap-2">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-[#e0e0e0] flex-shrink-0" />
                      : <div className="w-8 h-8 rounded bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center flex-shrink-0"><Package size={13} className="text-[#9e9e9e]" /></div>
                    }
                    <div>
                      <p className="font-medium text-[#333] text-sm">{item.name}</p>
                      <p className="text-xs text-[#9e9e9e]">{[item.category, item.brand].filter(Boolean).join(' · ') || item.unit}</p>
                    </div>
                  </div>
                </td>
                {/* Stock */}
                <td>
                  <span className={`font-semibold text-sm ${(item.stock || 0) <= (item.minStock || 0) && item.minStock > 0 ? 'text-[#e53935]' : 'text-[#333]'}`}>
                    {item.stock ?? 0}
                  </span>
                  <span className="text-xs text-[#9e9e9e] ml-1">{item.unit}</span>
                  {(item.stock || 0) <= (item.minStock || 0) && item.minStock > 0 && (
                    <span className="ml-1 text-[10px] bg-red-50 text-red-600 px-1 rounded">Low</span>
                  )}
                </td>
                {/* Purchase Price */}
                <td>
                  <span className="font-semibold text-[#333]">{item.purchasePrice ? formatCurrency(item.purchasePrice) : '—'}</span>
                  {item.sellingPrice > 0 && (
                    <p className="text-xs text-[#9e9e9e]">Sell: {formatCurrency(item.sellingPrice)}</p>
                  )}
                </td>
                {/* Actions */}
                <td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setAdjustItem(item)} className="so-icon-btn w-7 h-7" title="Adjust Stock"><Settings2 size={12} /></button>
                    <button onClick={() => openEdit(item)} className="so-icon-btn w-7 h-7" title="Edit"><Edit2 size={12} /></button>
                    <button onClick={() => remove(item._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50" title="Deactivate"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Adjust Stock Modal ── */}
      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          warehouses={warehouses}
          onClose={() => setAdjustItem(null)}
          onDone={load}
        />
      )}

      {/* ── Create / Edit Slide Panel ── */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Item' : 'Create Item'}
        width="w-[600px]"
      >
        <div className="space-y-3">

          {/* ── GENERAL DETAILS ── */}
          <Section title="General Details" open={sections.general} onToggle={() => tog('general')}>
            <div className="space-y-3">
              {/* Item Name + Active toggle */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="so-label">Item Name *</label>
                  <input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Basmati Rice" />
                </div>
                <div className="pt-5 flex items-center gap-2">
                  <input type="checkbox" id="itemActive" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} className="w-4 h-4 accent-[#1e88e5]" />
                  <label htmlFor="itemActive" className="text-xs text-[#555] cursor-pointer whitespace-nowrap">Activate Item</label>
                </div>
              </div>

              {/* Unit + Sell Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label">Unit *</label>
                  <select className="so-input w-full" value={form.unit} onChange={e => f('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="so-label">Sell Price *</label>
                  <div className="flex gap-1">
                    <span className="so-input w-8 text-center text-[#9e9e9e] flex-shrink-0">₹</span>
                    <input type="number" className="so-input flex-1" value={form.sellingPrice} onChange={e => f('sellingPrice', e.target.value)} placeholder="0.00" min="0" />
                    <select className="so-input w-28 text-xs" value={form.taxInclusive ? 'incl' : 'excl'} onChange={e => f('taxInclusive', e.target.value === 'incl')}>
                      <option value="excl">Excl. of Tax</option>
                      <option value="incl">Incl. of Tax</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Item Code + Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label">Item Code</label>
                  <input className="so-input w-full" value={form.sku || ''} onChange={e => f('sku', e.target.value)} placeholder="RICE-001" />
                </div>
                <div>
                  <label className="so-label">Item Description</label>
                  <input className="so-input w-full" value={form.description || ''} onChange={e => f('description', e.target.value)} placeholder="Item description" />
                </div>
              </div>

              {/* Category + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label flex items-center justify-between">
                    Category
                    <button type="button" className="text-[10px] text-[#1e88e5]">+ New</button>
                  </label>
                  <input className="so-input w-full" list="cat-list" value={form.category || ''} onChange={e => f('category', e.target.value)} placeholder="Select Category" />
                  <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="so-label flex items-center justify-between">
                    Brand
                    <button type="button" className="text-[10px] text-[#1e88e5]">+ New</button>
                  </label>
                  <input className="so-input w-full" list="brand-list" value={form.brand || ''} onChange={e => f('brand', e.target.value)} placeholder="Select Brand" />
                  <datalist id="brand-list">{brands.map(b => <option key={b} value={b} />)}</datalist>
                </div>
              </div>

              {/* Upload Images */}
              <div>
                <label className="so-label">Upload Images</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(form.images || []).map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      <img src={img} alt="" className="w-full h-full object-cover rounded border border-[#e0e0e0]" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                    </div>
                  ))}
                  {(form.images || []).length < 5 && (
                    <button type="button" onClick={() => imgRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-[#e0e0e0] rounded flex flex-col items-center justify-center gap-1 hover:border-[#1e88e5] transition-colors">
                      <Plus size={16} className="text-[#9e9e9e]" />
                      <span className="text-[10px] text-[#9e9e9e]">Add</span>
                    </button>
                  )}
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </div>
            </div>
          </Section>

          {/* ── PRICE DETAILS ── */}
          <Section title="Price Details" open={sections.price} onToggle={() => tog('price')}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label">MRP</label>
                  <input type="number" className="so-input w-full" value={form.mrp} onChange={e => f('mrp', e.target.value)} placeholder="MRP" min="0" />
                </div>
                <div>
                  <label className="so-label">Purchase Price</label>
                  <div className="flex gap-1">
                    <span className="so-input w-8 text-center text-[#9e9e9e] flex-shrink-0">₹</span>
                    <input type="number" className="so-input flex-1" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} placeholder="0.00" min="0" />
                    <select className="so-input w-28 text-xs" value={form.taxInclusive ? 'incl' : 'excl'} onChange={e => f('taxInclusive', e.target.value === 'incl')}>
                      <option value="excl">Excl. of Tax</option>
                      <option value="incl">Incl. of Tax</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="so-label">HSN Code</label>
                  <input className="so-input w-full" value={form.hsnCode || ''} onChange={e => f('hsnCode', e.target.value)} placeholder="HSN code" />
                </div>
                <div>
                  <label className="so-label">GST %</label>
                  <select className="so-input w-full" value={form.gstRate} onChange={e => f('gstRate', Number(e.target.value))}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="so-label">Cess %</label>
                  <select className="so-input w-full" value={form.cessRate} onChange={e => f('cessRate', Number(e.target.value))}>
                    {CESS_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
              {/* Discount + Offer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label">Discount</label>
                  <div className="flex gap-1">
                    <input type="number" className="so-input flex-1" value={form.discount} onChange={e => f('discount', e.target.value)} placeholder="Discount" min="0" />
                    <select className="so-input w-28 text-xs" value={form.discountType} onChange={e => f('discountType', e.target.value)}>
                      <option value="percent">Amount %</option>
                      <option value="amount">Fixed ₹</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="so-label">Offer Text</label>
                  <input className="so-input w-full" value={form.offerText || ''} onChange={e => f('offerText', e.target.value)} placeholder="Show offer" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── STOCK DETAILS ── */}
          <Section title="Stock Details" open={sections.stock} onToggle={() => tog('stock')}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="so-label">{editing ? 'Current Stock' : 'Opening Stock'}</label>
                <div className="flex gap-1 items-center">
                  <input type="number" className="so-input flex-1" value={editing ? form.stock : form.openingStock}
                    onChange={e => editing ? f('stock', Number(e.target.value)) : f('openingStock', Number(e.target.value))}
                    min="0" placeholder="0" />
                  <span className="text-xs text-[#9e9e9e]">{form.unit}</span>
                </div>
              </div>
              <div>
                <label className="so-label">Weight</label>
                <div className="flex gap-1">
                  <input type="number" className="so-input flex-1" value={form.weight || ''} onChange={e => f('weight', e.target.value)} placeholder="Weight" min="0" />
                  <select className="so-input w-16 text-xs" value={form.weightUnit} onChange={e => f('weightUnit', e.target.value)}>
                    {['kg', 'g', 'lb', 'oz'].map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="so-label">Low Stock Units</label>
                <div className="flex gap-1 items-center">
                  <input type="number" className="so-input flex-1" value={form.minStock} onChange={e => f('minStock', Number(e.target.value))} min="0" placeholder="0" />
                  <span className="text-xs text-[#9e9e9e]">{form.unit}</span>
                </div>
              </div>
              {/* Secondary unit */}
              <div>
                <label className="so-label">Secondary Unit</label>
                <div className="flex gap-1">
                  <input className="so-input flex-1" value={form.secondaryUnit || ''} onChange={e => f('secondaryUnit', e.target.value)} placeholder="e.g. Case" />
                  <input type="number" className="so-input w-16" value={form.conversionFactor} onChange={e => f('conversionFactor', Number(e.target.value))} placeholder="12" min="1" title="1 Case = ? units" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── BATCH DETAILS ── */}
          <Section title="Batch Details" open={sections.batch} onToggle={() => tog('batch')}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="trackBatch" checked={form.trackBatch} onChange={e => f('trackBatch', e.target.checked)} className="w-4 h-4 accent-[#1e88e5]" />
                <label htmlFor="trackBatch" className="text-xs text-[#555] cursor-pointer">Enable batch tracking for this item</label>
              </div>
              {form.trackBatch && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="so-label mb-0">Batches</p>
                    <button type="button" onClick={() => f('batches', [...(form.batches || []), { batchNo: '', mfgDate: '', expiryDate: '', quantity: 0, purchasePrice: '' }])}
                      className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1"><Plus size={11} /> Add Batch</button>
                  </div>
                  {(form.batches || []).map((b, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 mb-2 text-xs items-center">
                      <input className="so-input col-span-1" placeholder="Batch No" value={b.batchNo} onChange={e => { const bs = [...form.batches]; bs[i].batchNo = e.target.value; f('batches', bs); }} />
                      <input type="date" className="so-input col-span-1" value={b.mfgDate?.slice(0,10) || ''} onChange={e => { const bs = [...form.batches]; bs[i].mfgDate = e.target.value; f('batches', bs); }} title="Mfg Date" />
                      <input type="date" className="so-input col-span-1" value={b.expiryDate?.slice(0,10) || ''} onChange={e => { const bs = [...form.batches]; bs[i].expiryDate = e.target.value; f('batches', bs); }} title="Expiry Date" />
                      <input type="number" className="so-input col-span-1" placeholder="Qty" value={b.quantity} onChange={e => { const bs = [...form.batches]; bs[i].quantity = Number(e.target.value); f('batches', bs); }} min="0" />
                      <button type="button" onClick={() => f('batches', form.batches.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-base text-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} disabled={saving} className="so-btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
