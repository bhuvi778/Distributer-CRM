import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronRight, Eye } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';

const STATUS_COLOR = { draft: 'so-badge-info', sent: 'so-badge-warning', accepted: 'so-badge-success', rejected: 'so-badge-danger', converted: 'so-badge-success', expired: 'so-badge-danger' };

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const emptyForm = { partyName: '', validUntil: '', items: [], notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        api.get('/sales/estimates', { params: { search: search || undefined } }),
        api.get('/inventory/items'),
      ]);
      setEstimates(e.data); setProducts(p.data);
    } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1, rate: 0, gstRate: 18, discount: 0, amount: 0 }] }));
  const updateItem = (i, k, v) => setForm(p => {
    const items = p.items.map((it, idx) => {
      if (idx !== i) return it;
      const u = { ...it, [k]: v };
      u.amount = (u.quantity || 0) * (u.rate || 0) * (1 - (u.discount || 0) / 100);
      return u;
    });
    return { ...p, items };
  });

  const subTotal = form.items.reduce((s, it) => s + (it.amount || 0), 0);

  const save = async () => {
    if (!form.partyName) return alert('Party name required');
    if (!form.items.length) return alert('Add at least one item');
    try {
      const taxTotal = form.items.reduce((s, it) => s + (it.amount || 0) * (it.gstRate || 0) / 100, 0);
      await api.post('/sales/estimates', { ...form, subtotal: subTotal, taxTotal, grandTotal: subTotal + taxTotal });
      setPanelOpen(false); setForm(emptyForm); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const convert = async (id) => {
    if (!confirm('Convert this estimate to a Sales Order?')) return;
    try { await api.post(`/sales/estimates/${id}/convert`); alert('Converted to Sales Order successfully!'); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Estimates</h1>
          <p className="text-xs text-[#757575] mt-0.5">Create price quotes for customers — convert to orders when accepted</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setPanelOpen(true); }} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Estimate</button>
      </div>

      <div className="relative w-72 mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search estimates…" className="so-input pl-9 w-full" />
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Estimate #</th><th>Party / Customer</th><th>Items</th><th>Subtotal</th><th>Grand Total</th><th>Valid Until</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && estimates.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No estimates yet. Create one to get started.</td></tr>}
            {estimates.map(e => (
              <tr key={e._id}>
                <td><span className="font-mono text-xs font-medium text-[#1e88e5]">{e.estimateNumber}</span></td>
                <td className="font-medium">{e.partyName || e.outlet?.name || '—'}</td>
                <td>{e.items?.length || 0}</td>
                <td>{formatCurrency(e.subtotal)}</td>
                <td className="font-semibold">{formatCurrency(e.grandTotal)}</td>
                <td>{e.validUntil ? new Date(e.validUntil).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`so-badge ${STATUS_COLOR[e.status] || ''} capitalize`}>{e.status}</span></td>
                <td>
                  {['draft', 'sent', 'accepted'].includes(e.status) && (
                    <button onClick={() => convert(e._id)} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1 whitespace-nowrap">
                      <ChevronRight size={12} /> Convert to Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Estimate" width="w-[620px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Party / Customer Name *</label><input className="so-input w-full" value={form.partyName} onChange={e => setForm(p => ({ ...p, partyName: e.target.value }))} placeholder="Customer or company name" /></div>
            <div><label className="so-label">Valid Until</label><input type="date" className="so-input w-full" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Line Items</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add Item</button>
            </div>
            {form.items.length === 0 && <p className="text-xs text-[#9e9e9e] text-center py-4 border border-dashed border-[#e0e0e0] rounded">No items added yet</p>}
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 text-xs items-center">
                  <div className="col-span-4">
                    <select className="so-input w-full text-xs" value={it.product} onChange={e => {
                      const prod = products.find(p => p._id === e.target.value);
                      updateItem(i, 'product', e.target.value);
                      updateItem(i, 'productName', prod?.name || '');
                      updateItem(i, 'rate', prod?.sellingPrice || 0);
                      updateItem(i, 'gstRate', prod?.gstRate || 18);
                    }}>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Qty" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Rate ₹" min="0" value={it.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Disc%" min="0" max="100" value={it.discount} onChange={e => updateItem(i, 'discount', Number(e.target.value))} /></div>
                  <div className="col-span-1 text-right font-medium text-[#333]">₹{(it.amount || 0).toFixed(0)}</div>
                  <div className="col-span-1 text-right"><button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 text-base leading-none">×</button></div>
                </div>
              ))}
            </div>
            {form.items.length > 0 && (
              <div className="flex justify-end gap-4 mt-3 pt-2 border-t border-[#f0f0f0] text-sm">
                <span className="text-[#757575]">Subtotal: <strong className="text-[#333]">{formatCurrency(subTotal)}</strong></span>
              </div>
            )}
          </div>
          <div><label className="so-label">Notes / Terms</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment terms, delivery notes, etc." /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Create Estimate</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
