import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

const STATUS_COLOR = { draft: 'so-badge-info', in_transit: 'so-badge-warning', completed: 'so-badge-success', cancelled: 'so-badge-danger' };

export default function TransferOrders() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const emptyForm = { fromWarehouse: '', toWarehouse: '', items: [], notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([api.get('/inventory/transfers'), api.get('/inventory/items')]);
      setTransfers(t.data); setProducts(p.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.fromWarehouse || !form.toWarehouse) return alert('Both warehouses required');
    if (!form.items.length) return alert('Add at least one item');
    try {
      await api.post('/inventory/transfers', form);
      setPanelOpen(false); setForm(emptyForm); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/inventory/transfers/${id}`, { status }); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1 }] }));
  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Transfer Orders</h1>
          <p className="text-xs text-[#757575] mt-0.5">Move stock between warehouses</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setPanelOpen(true); }} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Transfer</button>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Transfer #</th><th>From Warehouse</th><th>To Warehouse</th><th>Items</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && transfers.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No transfer orders yet</td></tr>}
            {transfers.map(t => (
              <tr key={t._id}>
                <td><span className="font-mono text-xs font-medium">{t.transferNumber}</span></td>
                <td>{t.fromWarehouse}</td>
                <td>{t.toWarehouse}</td>
                <td>{t.items?.length} items</td>
                <td><span className={`so-badge ${STATUS_COLOR[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span></td>
                <td>{new Date(t.transferDate).toLocaleDateString('en-IN')}</td>
                <td>
                  {t.status === 'draft' && <button onClick={() => updateStatus(t._id, 'in_transit')} className="so-btn-secondary text-xs py-1 px-2">Dispatch</button>}
                  {t.status === 'in_transit' && <button onClick={() => updateStatus(t._id, 'completed')} className="so-btn-primary text-xs py-1 px-2">Mark Received</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Transfer Order">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">From Warehouse *</label><input className="so-input w-full" value={form.fromWarehouse} onChange={e => f('fromWarehouse', e.target.value)} placeholder="e.g. Main Warehouse" /></div>
            <div><label className="so-label">To Warehouse *</label><input className="so-input w-full" value={form.toWarehouse} onChange={e => f('toWarehouse', e.target.value)} placeholder="e.g. Branch Warehouse" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Items to Transfer</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add Item</button>
            </div>
            {form.items.length === 0 && <p className="text-xs text-[#9e9e9e] text-center py-3">No items added</p>}
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
                <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="so-icon-btn text-red-400 flex-shrink-0"><X size={13} /></button>
              </div>
            ))}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Create Transfer</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
