import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, FileText, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';
import { formatCurrency } from '../utils/helpers';

// ─── ESTIMATES TAB ───────────────────────────────────────────────
function EstimatesTab() {
  const [estimates, setEstimates] = useState([]);
  const [products, setProducts] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({ partyName: '', items: [], notes: '', validUntil: '' });

  const load = useCallback(async () => {
    const [e, p, o] = await Promise.all([
      api.get('/sales/estimates', { params: { search: search || undefined } }),
      api.get('/inventory/items'),
      api.get('/outlets'),
    ]);
    setEstimates(e.data); setProducts(p.data); setOutlets(o.data);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1, rate: 0, gstRate: 18, discount: 0, amount: 0 }] }));
  const updateItem = (i, k, v) => {
    setForm(p => {
      const items = p.items.map((it, idx) => {
        if (idx !== i) return it;
        const updated = { ...it, [k]: v };
        updated.amount = (updated.quantity || 0) * (updated.rate || 0) * (1 - (updated.discount || 0) / 100);
        return updated;
      });
      return { ...p, items };
    });
  };

  const total = form.items.reduce((s, it) => s + (it.amount || 0), 0);

  const save = async () => {
    const grandTotal = total * (1 + (form.items[0]?.gstRate || 18) / 100);
    await api.post('/sales/estimates', { ...form, subtotal: total, grandTotal });
    setPanelOpen(false);
    setForm({ partyName: '', items: [], notes: '', validUntil: '' });
    load();
  };

  const convert = async (id) => {
    await api.post(`/sales/estimates/${id}/convert`);
    alert('Converted to Sales Order!');
    load();
  };

  const STATUS_COLOR = { draft: 'so-badge-info', sent: 'so-badge-warning', accepted: 'so-badge-success', rejected: 'so-badge-danger', converted: 'so-badge-success', expired: 'so-badge-danger' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search estimates…" className="so-input pl-9 w-full" />
        </div>
        <button onClick={() => { setForm({ partyName: '', items: [], notes: '', validUntil: '' }); setPanelOpen(true); }} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Estimate</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Estimate #</th><th>Party</th><th>Amount</th><th>Valid Until</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {estimates.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[#9e9e9e]">No estimates yet</td></tr>}
            {estimates.map(e => (
              <tr key={e._id}>
                <td className="font-mono text-xs font-medium">{e.estimateNumber}</td>
                <td>{e.partyName || e.outlet?.name || '—'}</td>
                <td>{formatCurrency(e.grandTotal)}</td>
                <td>{e.validUntil ? new Date(e.validUntil).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`so-badge ${STATUS_COLOR[e.status] || ''} capitalize`}>{e.status}</span></td>
                <td>
                  {['draft', 'sent', 'accepted'].includes(e.status) && (
                    <button onClick={() => convert(e._id)} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                      <ChevronRight size={12} /> Convert
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Estimate" width="w-[600px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Party Name</label><input className="so-input w-full" value={form.partyName} onChange={e => setForm(p => ({ ...p, partyName: e.target.value }))} placeholder="Customer or outlet name" /></div>
            <div><label className="so-label">Valid Until</label><input type="date" className="so-input w-full" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label">Items</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 text-xs">
                  <div className="col-span-4">
                    <select className="so-input w-full text-xs" value={it.product} onChange={e => {
                      const prod = products.find(p => p._id === e.target.value);
                      updateItem(i, 'product', e.target.value);
                      updateItem(i, 'productName', prod?.name || '');
                      updateItem(i, 'rate', prod?.sellingPrice || 0);
                      updateItem(i, 'gstRate', prod?.gstRate || 18);
                    }}>
                      <option value="">Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Rate" value={it.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="so-input w-full text-xs" placeholder="Disc%" value={it.discount} onChange={e => updateItem(i, 'discount', Number(e.target.value))} /></div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-[#333] font-medium">₹{(it.amount || 0).toFixed(0)}</span>
                    <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {form.items.length > 0 && (
              <div className="flex justify-end mt-3 pt-2 border-t border-[#f0f0f0]">
                <p className="text-sm font-semibold">Total: {formatCurrency(total)}</p>
              </div>
            )}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Estimate</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── DELIVERY CHALLANS TAB ──────────────────────────────────────
function DeliveryChallansTab() {
  const [challans, setChallans] = useState([]);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({ vehicleNumber: '', items: [], notes: '' });
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      api.get('/sales/delivery-challans', { params: { search: search || undefined } }),
      api.get('/inventory/items'),
    ]);
    setChallans(c.data); setProducts(p.data);
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => { await api.put(`/sales/delivery-challans/${id}`, { status }); load(); };

  const save = async () => {
    await api.post('/sales/delivery-challans', form);
    setPanelOpen(false);
    setForm({ vehicleNumber: '', items: [], notes: '' });
    load();
  };

  const STATUS_COLOR = { pending: 'so-badge-warning', dispatched: 'so-badge-info', delivered: 'so-badge-success', returned: 'so-badge-danger' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search challans…" className="so-input pl-9 w-full" />
        </div>
        <button onClick={() => setPanelOpen(true)} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Challan</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Challan #</th><th>Party</th><th>Delivery Agent</th><th>Vehicle</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {challans.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No delivery challans</td></tr>}
            {challans.map(c => (
              <tr key={c._id}>
                <td className="font-mono text-xs font-medium">{c.challanNumber}</td>
                <td>{c.outlet?.name || c.party?.name || '—'}</td>
                <td>{c.deliveryAgent?.name || '—'}</td>
                <td>{c.vehicleNumber || '—'}</td>
                <td><span className={`so-badge ${STATUS_COLOR[c.status] || ''} capitalize`}>{c.status}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="flex gap-1">
                  {c.status === 'pending' && <button onClick={() => updateStatus(c._id, 'dispatched')} className="so-btn-secondary text-xs py-1 px-2">Dispatch</button>}
                  {c.status === 'dispatched' && <button onClick={() => updateStatus(c._id, 'delivered')} className="so-btn-primary text-xs py-1 px-2">Delivered</button>}
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
              <p className="so-label">Items</p>
              <button onClick={() => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1 }] }))} className="so-btn-secondary text-xs py-1 px-2">+ Add</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className="so-input flex-1" value={it.product} onChange={e => {
                  const prod = products.find(p => p._id === e.target.value);
                  setForm(p => ({ ...p, items: p.items.map((it2, idx) => idx === i ? { ...it2, product: e.target.value, productName: prod?.name || '' } : it2) }));
                }}>
                  <option value="">Select Item</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" className="so-input w-20" placeholder="Qty" value={it.quantity} onChange={e => setForm(p => ({ ...p, items: p.items.map((it2, idx) => idx === i ? { ...it2, quantity: Number(e.target.value) } : it2) }))} />
                <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="so-icon-btn text-red-400">✕</button>
              </div>
            ))}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Create Challan</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── SALES RETURNS TAB ──────────────────────────────────────────
function SalesReturnsTab() {
  const [returns, setReturns] = useState([]);
  const load = async () => { const { data } = await api.get('/sales/returns'); setReturns(data); };
  useEffect(() => { load(); }, []);
  const STATUS_COLOR = { pending: 'so-badge-warning', approved: 'so-badge-success', rejected: 'so-badge-danger', completed: 'so-badge-success' };

  return (
    <div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Return #</th><th>Party</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {returns.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No sales returns</td></tr>}
            {returns.map(r => (
              <tr key={r._id}>
                <td className="font-mono text-xs font-medium">{r.returnNumber}</td>
                <td>{r.outlet?.name || r.party?.name || '—'}</td>
                <td>{formatCurrency(r.grandTotal)}</td>
                <td><span className={`so-badge ${STATUS_COLOR[r.status] || ''} capitalize`}>{r.status}</span></td>
                <td>{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
const TABS = [
  { id: 'estimates', label: 'Estimates', icon: FileText },
  { id: 'orders', label: 'Sales Orders', icon: Plus },
  { id: 'invoices', label: 'Sales Invoices', icon: FileText },
  { id: 'challans', label: 'Delivery Challans', icon: Truck },
  { id: 'returns', label: 'Sales Returns', icon: RotateCcw },
];

export default function SalesNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathToTab = { '/app/sales/orders': 'orders', '/app/sales/invoices': 'invoices', '/app/sales/delivery-challans': 'challans', '/app/sales/returns': 'returns' };
  const tabToPath = { estimates: '/app/sales/estimates', orders: '/app/sales/orders', invoices: '/app/sales/invoices', challans: '/app/sales/delivery-challans', returns: '/app/sales/returns' };
  const [tab, setTab] = useState(pathToTab[location.pathname] || 'estimates');
  const switchTab = (id) => { setTab(id); navigate(tabToPath[id]); };
  return (
    <div className="so-page">
      <div className="so-page-header">
        <h1 className="so-page-title">Sales</h1>
      </div>
      <div className="flex border-b border-[#e0e0e0] mb-5 gap-1 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-[#1e88e5] text-[#1e88e5]' : 'border-transparent text-[#616161] hover:text-[#333]'}`}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>
      {tab === 'estimates' && <EstimatesTab />}
      {tab === 'orders' && <div className="text-center py-16 text-[#9e9e9e]">Sales Orders — use existing Orders page or manage here</div>}
      {tab === 'invoices' && <div className="text-center py-16 text-[#9e9e9e]">Sales Invoices — use existing Invoices page</div>}
      {tab === 'challans' && <DeliveryChallansTab />}
      {tab === 'returns' && <SalesReturnsTab />}
    </div>
  );
}
