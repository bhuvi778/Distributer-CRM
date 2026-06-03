import { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

export default function PriceList() {
  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', code: '', applicableTo: 'all', validFrom: '', validTo: '', items: [], notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([api.get('/inventory/price-lists'), api.get('/inventory/items')]);
      setLists(l.data); setProducts(p.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...l, items: l.items || [] }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/inventory/price-lists/${editing._id}`, form);
      else await api.post('/inventory/price-lists', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', sellingPrice: '', discount: 0 }] }));
  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Price List</h1>
          <p className="text-xs text-[#757575] mt-0.5">Set custom pricing for customers, distributors and super stockers</p>
        </div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Price List</button>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Name</th><th>Code</th><th>Applicable To</th><th>Items</th><th>Valid From</th><th>Valid To</th><th>Status</th><th className="w-12"></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && lists.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No price lists created yet</td></tr>}
            {lists.map(l => (
              <tr key={l._id}>
                <td className="font-medium text-[#333]">{l.name}</td>
                <td><span className="font-mono text-xs">{l.code || '—'}</span></td>
                <td className="capitalize">{l.applicableTo?.replace('_', ' ')}</td>
                <td>{l.items?.length || 0} items</td>
                <td>{l.validFrom ? new Date(l.validFrom).toLocaleDateString('en-IN') : '—'}</td>
                <td>{l.validTo ? new Date(l.validTo).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`so-badge ${l.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>{l.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => openEdit(l)} className="so-icon-btn"><Edit2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Price List' : 'New Price List'} width="w-[600px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Distributor Price" /></div>
            <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="PL-001" /></div>
            <div><label className="so-label">Applicable To</label>
              <select className="so-input w-full" value={form.applicableTo} onChange={e => f('applicableTo', e.target.value)}>
                <option value="all">All</option>
                <option value="customers">Customers</option>
                <option value="distributors">Distributors</option>
                <option value="super_stockers">Super Stockers</option>
              </select>
            </div>
            <div><label className="so-label">Valid From</label><input type="date" className="so-input w-full" value={form.validFrom?.slice(0,10) || ''} onChange={e => f('validFrom', e.target.value)} /></div>
            <div><label className="so-label">Valid To</label><input type="date" className="so-input w-full" value={form.validTo?.slice(0,10) || ''} onChange={e => f('validTo', e.target.value)} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Products & Prices</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add Product</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {form.items.length === 0 && <p className="text-xs text-[#9e9e9e] text-center py-4">No products added yet</p>}
              {form.items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="so-input flex-1 text-xs" value={it.product} onChange={e => {
                    const prod = products.find(p => p._id === e.target.value);
                    updateItem(i, 'product', e.target.value);
                    updateItem(i, 'productName', prod?.name || '');
                    if (!it.sellingPrice) updateItem(i, 'sellingPrice', prod?.sellingPrice || '');
                  }}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="so-input w-24 text-xs" placeholder="Price ₹" value={it.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', e.target.value)} />
                  <input type="number" className="so-input w-16 text-xs" placeholder="Disc%" value={it.discount} onChange={e => updateItem(i, 'discount', e.target.value)} />
                  <button onClick={() => removeItem(i)} className="so-icon-btn text-red-400 flex-shrink-0"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Price List</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
