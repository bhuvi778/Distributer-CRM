import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

const STATUS_COLOR = { pending: 'so-badge-warning', dispatched: 'so-badge-info', delivered: 'so-badge-success', returned: 'so-badge-danger' };

export default function DeliveryChallans() {
  const [challans, setChallans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const emptyForm = { vehicleNumber: '', notes: '', items: [] };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get('/sales/delivery-challans', { params: { search: search || undefined } }),
        api.get('/inventory/items'),
      ]);
      setChallans(c.data); setProducts(p.data);
    } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => { await api.put(`/sales/delivery-challans/${id}`, { status }); load(); };

  const save = async () => {
    if (!form.items.length) return alert('Add at least one item');
    try { await api.post('/sales/delivery-challans', form); setPanelOpen(false); setForm(emptyForm); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Delivery Challans</h1>
          <p className="text-xs text-[#757575] mt-0.5">Track dispatches and delivery of goods to customers</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setPanelOpen(true); }} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Challan</button>
      </div>

      <div className="relative w-72 mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search challans…" className="so-input pl-9 w-full" />
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Challan #</th><th>Party</th><th>Delivery Agent</th><th>Vehicle</th><th>Items</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && challans.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No delivery challans yet</td></tr>}
            {challans.map(c => (
              <tr key={c._id}>
                <td><span className="font-mono text-xs font-medium text-[#1e88e5]">{c.challanNumber}</span></td>
                <td>{c.outlet?.name || c.party?.name || '—'}</td>
                <td>{c.deliveryAgent?.name || '—'}</td>
                <td>{c.vehicleNumber || '—'}</td>
                <td>{c.items?.length || 0} items</td>
                <td><span className={`so-badge ${STATUS_COLOR[c.status] || ''} capitalize`}>{c.status}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="flex gap-1">
                  {c.status === 'pending' && <button onClick={() => updateStatus(c._id, 'dispatched')} className="so-btn-secondary text-xs py-1 px-2">Dispatch</button>}
                  {c.status === 'dispatched' && <button onClick={() => updateStatus(c._id, 'delivered')} className="so-btn-primary text-xs py-1 px-2">Mark Delivered</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Delivery Challan">
        <div className="space-y-4">
          <div><label className="so-label">Vehicle Number</label><input className="so-input w-full" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))} placeholder="MH-01-AB-1234" /></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Items</p>
              <button onClick={() => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1 }] }))} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add</button>
            </div>
            {form.items.length === 0 && <p className="text-xs text-[#9e9e9e] text-center py-3 border border-dashed border-[#e0e0e0] rounded">No items added yet</p>}
            {form.items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select className="so-input flex-1 text-xs" value={it.product} onChange={e => {
                  const prod = products.find(p => p._id === e.target.value);
                  updateItem(i, 'product', e.target.value);
                  updateItem(i, 'productName', prod?.name || '');
                }}>
                  <option value="">Select Item</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" className="so-input w-20 text-xs" placeholder="Qty" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="so-icon-btn text-red-400"><X size={13} /></button>
              </div>
            ))}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Create Challan</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
