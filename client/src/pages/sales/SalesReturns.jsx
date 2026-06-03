import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';

const STATUS_COLOR = { pending: 'so-badge-warning', approved: 'so-badge-success', rejected: 'so-badge-danger', completed: 'so-badge-success' };

export default function SalesReturns() {
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const emptyForm = { notes: '', items: [] };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([api.get('/sales/returns'), api.get('/inventory/items')]);
      setReturns(r.data); setProducts(p.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => { await api.put(`/sales/returns/${id}`, { status }); load(); };

  const save = async () => {
    if (!form.items.length) return alert('Add at least one item');
    try {
      const grandTotal = form.items.reduce((s, it) => s + ((it.quantity || 0) * (it.rate || 0)), 0);
      await api.post('/sales/returns', { ...form, grandTotal, subtotal: grandTotal });
      setPanelOpen(false); setForm(emptyForm); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Sales Returns</h1>
          <p className="text-xs text-[#757575] mt-0.5">Manage product returns from customers with credit notes</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setPanelOpen(true); }} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Return</button>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Return #</th><th>Party</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && returns.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No sales returns yet</td></tr>}
            {returns.map(r => (
              <tr key={r._id}>
                <td><span className="font-mono text-xs font-medium text-[#1e88e5]">{r.returnNumber}</span></td>
                <td>{r.outlet?.name || r.party?.name || '—'}</td>
                <td>{r.items?.length || 0} items</td>
                <td>{formatCurrency(r.grandTotal)}</td>
                <td><span className={`so-badge ${STATUS_COLOR[r.status] || ''} capitalize`}>{r.status}</span></td>
                <td>{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
                <td>
                  {r.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(r._id, 'approved')} className="so-btn-primary text-xs py-1 px-2">Approve</button>
                      <button onClick={() => updateStatus(r._id, 'rejected')} className="so-btn-secondary text-xs py-1 px-2">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Sales Return">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Returned Items</p>
              <button onClick={() => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1, rate: 0, reason: '' }] }))} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add Item</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 mb-2 items-center text-xs">
                <div className="col-span-4">
                  <select className="so-input w-full text-xs" value={it.product} onChange={e => {
                    const prod = products.find(p => p._id === e.target.value);
                    updateItem(i, 'product', e.target.value);
                    updateItem(i, 'productName', prod?.name || '');
                    updateItem(i, 'rate', prod?.sellingPrice || 0);
                  }}>
                    <option value="">Select Item</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} /></div>
                <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Rate" value={it.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} /></div>
                <div className="col-span-3"><input className="so-input w-full text-xs" placeholder="Reason" value={it.reason} onChange={e => updateItem(i, 'reason', e.target.value)} /></div>
                <div className="col-span-1 text-right"><button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 text-base">×</button></div>
              </div>
            ))}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Submit Return</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
