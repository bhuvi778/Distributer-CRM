import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Edit2, Plus, Search, Settings, Trash2, Upload, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';

const UNITS = ['Pcs', 'Kg', 'G', 'Ltr', 'Ml', 'Box', 'Bag', 'Dozen', 'Carton', 'Meter', 'Pack', 'Nos', 'Case'];
const GST_RATES = [0, 3, 5, 12, 18, 28];
const CESS_RATES = [0, 1, 2, 5, 10, 15];

const emptyForm = () => ({
  name: '',
  sku: '',
  description: '',
  category: '',
  brand: '',
  warehouse: 'Main',
  unit: '',
  mrp: '',
  sellingPrice: '',
  purchasePrice: '',
  discount: '',
  discountType: 'amount',
  offerText: '',
  hsnCode: '',
  gstRate: '',
  cessRate: '',
  taxInclusive: false,
  stock: '',
  minStock: 0,
  images: [],
  isActive: true,
  openingStock: '',
});

const EXPORT_COLS = [
  { key: 'sku', label: 'Item Code', accessor: 'sku' },
  { key: 'name', label: 'Item Name', accessor: 'name' },
  { key: 'category', label: 'Category', accessor: 'category' },
  { key: 'brand', label: 'Brand', accessor: 'brand' },
  { key: 'unit', label: 'Unit', accessor: 'unit' },
  { key: 'sell', label: 'Sell Price', accessor: 'sellingPrice' },
  { key: 'purchase', label: 'Purchase Price', accessor: 'purchasePrice' },
  { key: 'stock', label: 'Stock', accessor: 'stock' },
  { key: 'status', label: 'Status', accessor: 'isActive', renderExport: (v) => (v ? 'Active' : 'Inactive') },
];

function FormSection({ title, children }) {
  return (
    <section className="space-y-7">
      <div className="so-form-section-title">{title}</div>
      <div>{children}</div>
    </section>
  );
}

function CurrencyField({ value, onChange, placeholder }) {
  return (
    <div className="flex">
      <span className="so-input-addon">₹</span>
      <input className="so-input flex-1 rounded-none" type="number" min="0" value={value} onChange={onChange} placeholder={placeholder} />
      <select className="so-input so-select w-[126px] rounded-l-none" defaultValue="excl">
        <option value="excl">Excl. of Tax</option>
        <option value="incl">Incl. of Tax</option>
      </select>
    </div>
  );
}

export default function Items() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, whRes] = await Promise.all([
        api.get('/inventory/items', {
          params: {
            search: search || undefined,
            status: statusFilter || undefined,
            warehouse: warehouseFilter || undefined,
          },
        }),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      const data = itemRes.data || [];
      setItems(data);
      setWarehouses(whRes.data || []);
      setCategories([...new Set(data.map((i) => i.category).filter(Boolean))]);
      setBrands([...new Set(data.map((i) => i.brand).filter(Boolean))]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, warehouseFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), warehouse: warehouseFilter || 'Main' });
    setPanelOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...emptyForm(),
      ...item,
      warehouse: warehouseFilter || item.selectedWarehouse || 'Main',
      openingStock: item.stock || '',
    });
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name) return alert('Item name is required');
    if (!form.unit) return alert('Unit is required');
    if (!form.sellingPrice) return alert('Sell price is required');
    setSaving(true);
    try {
      const payload = { ...form, stock: Number(form.stock || form.openingStock || 0) };
      delete payload.openingStock;
      if (editing) {
        await api.put(`/inventory/items/${editing._id}`, payload);
      } else {
        await api.post('/inventory/items', {
          ...payload,
          openingStock: Number(form.openingStock || form.stock || 0),
          warehouse: form.warehouse || 'Main',
        });
      }
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    await api.delete(`/inventory/items/${id}`);
    load();
  };

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - (form.images || []).length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm((prev) => ({ ...prev, images: [...(prev.images || []), ev.target.result].slice(0, 5) }));
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (idx) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const totalCount = items.length;

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Items</h1>
        <div className="so-actions">
          <button type="button" className="so-icon-btn !w-[58px] !h-9" title="Settings"><Settings size={20} /></button>
          <button type="button" onClick={() => exportToExcel(items, 'items', EXPORT_COLS)} className="so-btn-secondary text-lg"><Download size={18} /> Export</button>
          <button type="button" className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-lg"><Upload size={18} /> Import</button>
          <button type="button" onClick={openAdd} className="so-btn-primary text-lg"><Plus size={18} /> New</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={load}><Search size={21} /></button>
        </div>
        <div className="flex-1" />
        <select className="so-input so-select w-[240px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="so-input so-select w-[240px]" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">Select Warehouse</option>
          <option value="Main">Main Warehouse</option>
          {warehouses.map((w) => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
        <div className="ml-14 flex items-center gap-3 text-sm text-[#111827]">
          <span>1 - {totalCount} of {totalCount}</span>
          <button type="button" className="so-icon-btn !w-12 !h-11 text-[#174bb8] text-xl">‹</button>
          <button type="button" className="so-icon-btn !w-12 !h-11 text-[#174bb8] text-xl">›</button>
        </div>
      </div>

      <div className="so-content-area">
        {loading ? (
          <div className="so-table-panel so-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-illustration" />
            <p>Sorry! No items found.</p>
          </div>
        ) : (
          <div className="so-table-panel">
            <table className="so-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Stock</th>
                  <th>Purchase Price</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.sku || '-'}</td>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.stock ?? 0} {item.unit}</td>
                    <td>{item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(item)} className="so-icon-btn"><Edit2 size={15} /></button>
                        <button type="button" onClick={() => remove(item._id)} className="so-icon-btn"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Items' : 'Create Items'}
        width="w-[740px]"
        hideClose
        bodyClassName="p-3"
        headerActions={(
          <>
            <button type="button" onClick={save} disabled={saving} className="so-btn-primary text-lg min-w-[84px]">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setPanelOpen(false)} className="text-lg px-4">Cancel</button>
          </>
        )}
      >
        <div className="space-y-8">
          <FormSection title="General Details">
            <div className="space-y-3 px-3">
              <div className="grid grid-cols-[1fr_168px] gap-3 items-end">
                <div>
                  <label className="so-label">Item Name<span className="text-red-500">*</span></label>
                  <input className="so-input w-full" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Name of item" />
                </div>
                <button type="button" onClick={() => f('isActive', !form.isActive)} className="flex items-center gap-3 h-10 text-lg">
                  <span className={`so-switch ${form.isActive ? 'so-switch-on' : ''}`} />
                  Activate item
                </button>
              </div>

              <div className="so-form-grid">
                <div>
                  <label className="so-label">Unit<span className="text-red-500">*</span></label>
                  <select className="so-input so-select w-full" value={form.unit} onChange={(e) => f('unit', e.target.value)}>
                    <option value="">Select Unit</option>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="so-label">Sell price<span className="text-red-500">*</span></label>
                  <CurrencyField value={form.sellingPrice} onChange={(e) => f('sellingPrice', e.target.value)} placeholder="Sale-price" />
                </div>
              </div>

              <div className="so-form-grid">
                <div>
                  <label className="so-label">Item Code</label>
                  <input className="so-input w-full" value={form.sku} onChange={(e) => f('sku', e.target.value)} placeholder="Item code" />
                </div>
                <div>
                  <label className="so-label">Item Description</label>
                  <textarea className="so-input w-full min-h-[90px]" value={form.description} onChange={(e) => f('description', e.target.value)} placeholder="Item description" />
                </div>
              </div>

              <div className="so-form-grid">
                <div>
                  <label className="so-label flex justify-between">Category <span className="text-[#0057ff]">+ New</span></label>
                  <input className="so-input w-full" list="item-categories" value={form.category} onChange={(e) => f('category', e.target.value)} placeholder="Select Category" />
                  <datalist id="item-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="so-label flex justify-between">Brand <span className="text-[#0057ff]">+ New</span></label>
                  <input className="so-input w-full" list="item-brands" value={form.brand} onChange={(e) => f('brand', e.target.value)} placeholder="Select Brand" />
                  <datalist id="item-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
                </div>
              </div>

              <div>
                <label className="so-label">Upload images</label>
                <div className="flex gap-3">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const image = form.images?.[idx];
                    return (
                      <button key={idx} type="button" onClick={() => (image ? undefined : imgRef.current?.click())} className="so-image-slot overflow-hidden">
                        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <Plus size={46} strokeWidth={1.5} />}
                        <span className="so-image-slot-remove" onClick={(e) => { e.stopPropagation(); if (image) removeImage(idx); }}>×</span>
                      </button>
                    );
                  })}
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Price Details">
            <div className="space-y-3 px-3">
              <div className="so-form-grid">
                <div>
                  <label className="so-label">MRP</label>
                  <input type="number" min="0" className="so-input w-full" value={form.mrp} onChange={(e) => f('mrp', e.target.value)} placeholder="MRP" />
                </div>
                <div>
                  <label className="so-label">Purchase price</label>
                  <CurrencyField value={form.purchasePrice} onChange={(e) => f('purchasePrice', e.target.value)} placeholder="Purchase-price" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="so-label">HSN Code</label>
                  <input className="so-input w-full" value={form.hsnCode} onChange={(e) => f('hsnCode', e.target.value)} placeholder="HSN code" />
                </div>
                <div>
                  <label className="so-label">GST %</label>
                  <select className="so-input so-select w-full" value={form.gstRate} onChange={(e) => f('gstRate', e.target.value)}>
                    <option value="">Select Tax</option>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="so-label">Cess %</label>
                  <select className="so-input so-select w-full" value={form.cessRate} onChange={(e) => f('cessRate', e.target.value)}>
                    <option value="">Select Cess</option>
                    {CESS_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
              <div className="so-form-grid">
                <div>
                  <label className="so-label">Discount</label>
                  <div className="flex">
                    <input type="number" min="0" className="so-input flex-1 rounded-r-none" value={form.discount} onChange={(e) => f('discount', e.target.value)} placeholder="Discount" />
                    <select className="so-input so-select w-[104px] rounded-l-none" value={form.discountType} onChange={(e) => f('discountType', e.target.value)}>
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="so-label">Offer text</label>
                  <input className="so-input w-full" value={form.offerText} onChange={(e) => f('offerText', e.target.value)} placeholder="Show offer" />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Stock Details">
            <div className="px-3 max-w-[330px]">
              <label className="so-label">Stock</label>
              <input type="number" min="0" className="so-input w-full" value={editing ? form.stock : form.openingStock} onChange={(e) => (editing ? f('stock', e.target.value) : f('openingStock', e.target.value))} placeholder="Stock" />
            </div>
          </FormSection>
        </div>
      </SlidePanel>
    </div>
  );
}
