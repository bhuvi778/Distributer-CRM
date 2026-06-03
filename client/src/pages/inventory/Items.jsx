import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'bag', 'dozen', 'carton', 'meter', 'pack'];
const GST_RATES = [0, 5, 12, 18, 28];

const emptyForm = { name: '', sku: '', category: '', unit: 'pcs', hsnCode: '', gstRate: 18, mrp: '', sellingPrice: '', purchasePrice: '', openingStock: 0, isActive: true };

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/items', { params: { search: search || undefined } });
      setItems(data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/inventory/items/${editing._id}`, form);
      else await api.post('/inventory/items', form);
      setPanelOpen(false);
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error saving'); }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    await api.delete(`/inventory/items/${id}`);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Items</h1>
          <p className="text-xs text-[#757575] mt-0.5">Manage products, pricing and stock units</p>
        </div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Search */}
      <div className="relative w-72 mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…" className="so-input pl-9 w-full" />
      </div>

      {/* Table */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Item Name</th><th>Item Code / SKU</th><th>Category</th><th>Unit</th>
              <th>GST %</th><th>MRP</th><th>Selling Price</th><th>Purchase Price</th>
              <th>Stock</th><th>Status</th><th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={11} className="text-center py-12 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={11} className="text-center py-12 text-[#9e9e9e]">No items found. Click "Add Item" to create one.</td></tr>
            )}
            {items.map(item => (
              <tr key={item._id}>
                <td className="font-medium text-[#333]">{item.name}</td>
                <td><span className="font-mono text-xs bg-[#f5f5f5] px-1.5 py-0.5 rounded">{item.sku || '—'}</span></td>
                <td>{item.category || '—'}</td>
                <td>{item.unit || 'pcs'}</td>
                <td>{item.gstRate}%</td>
                <td>{item.mrp ? formatCurrency(item.mrp) : '—'}</td>
                <td className="font-semibold text-[#1e88e5]">{formatCurrency(item.sellingPrice)}</td>
                <td>{item.purchasePrice ? formatCurrency(item.purchasePrice) : '—'}</td>
                <td>{item.stock ?? 0}</td>
                <td>
                  <span className={`so-badge ${item.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="so-icon-btn" title="Edit"><Edit2 size={13} /></button>
                    <button onClick={() => remove(item._id)} className="so-icon-btn text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide Panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Item' : 'Add New Item'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="so-label">Item Name *</label>
              <input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Basmati Rice 5kg" />
            </div>
            <div>
              <label className="so-label">Item Code / SKU</label>
              <input className="so-input w-full" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="RICE-001" />
            </div>
            <div>
              <label className="so-label">Category</label>
              <input className="so-input w-full" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Grocery, FMCG, etc." />
            </div>
            <div>
              <label className="so-label">Unit</label>
              <select className="so-input w-full" value={form.unit} onChange={e => f('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">HSN Code</label>
              <input className="so-input w-full" value={form.hsnCode} onChange={e => f('hsnCode', e.target.value)} placeholder="1006" />
            </div>
            <div>
              <label className="so-label">GST Rate</label>
              <select className="so-input w-full" value={form.gstRate} onChange={e => f('gstRate', Number(e.target.value))}>
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">MRP (₹)</label>
              <input type="number" className="so-input w-full" value={form.mrp} onChange={e => f('mrp', e.target.value)} placeholder="0.00" min="0" />
            </div>
            <div>
              <label className="so-label">Selling Price (₹)</label>
              <input type="number" className="so-input w-full" value={form.sellingPrice} onChange={e => f('sellingPrice', e.target.value)} placeholder="0.00" min="0" />
            </div>
            <div>
              <label className="so-label">Purchase Price (₹)</label>
              <input type="number" className="so-input w-full" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} placeholder="0.00" min="0" />
            </div>
            {!editing && (
              <div>
                <label className="so-label">Opening Stock (qty)</label>
                <input type="number" className="so-input w-full" value={form.openingStock} onChange={e => f('openingStock', Number(e.target.value))} min="0" />
              </div>
            )}
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="itemActive" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} className="w-4 h-4 accent-[#1e88e5]" />
              <label htmlFor="itemActive" className="so-label mb-0 cursor-pointer">Active</label>
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Item</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
