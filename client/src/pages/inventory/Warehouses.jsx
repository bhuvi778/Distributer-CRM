import { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', code: '', address: { street: '', city: '', state: '', pincode: '' }, phone: '', email: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/inventory/warehouses'); setWarehouses(data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, code: w.code || '', address: w.address || { street: '', city: '', state: '', pincode: '' }, phone: w.phone || '', email: w.email || '', notes: w.notes || '' });
    setPanelOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await api.put(`/inventory/warehouses/${editing._id}`, form);
      else await api.post('/inventory/warehouses', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Warehouses</h1>
          <p className="text-xs text-[#757575] mt-0.5">Manage your storage locations and track stock per warehouse</p>
        </div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Add Warehouse
        </button>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Warehouse Name</th>
              <th>Code</th>
              <th>Location</th>
              <th>Phone</th>
              <th>SKUs</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>
            )}
            {!loading && warehouses.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No warehouses added yet. Click "Add Warehouse" to create one.</td></tr>
            )}
            {warehouses.map(wh => (
              <tr key={wh._id}>
                <td className="font-medium text-[#333]">{wh.name}</td>
                <td><span className="font-mono text-xs">{wh.code || '—'}</span></td>
                <td className="text-[#757575]">
                  {[wh.address?.city, wh.address?.state, wh.address?.pincode].filter(Boolean).join(', ') || '—'}
                </td>
                <td>{wh.phone || '—'}</td>
                <td>
                  <span className="font-semibold text-[#333]">{wh.stockCount ?? 0}</span>
                </td>
                <td>
                  <span className="font-semibold text-[#333]">{wh.totalQuantity ?? 0}</span>
                </td>
                <td>
                  <span className={`so-badge ${wh.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>
                    {wh.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => openEdit(wh)} className="so-icon-btn"><Edit2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Warehouse' : 'Add Warehouse'}>
        <div className="space-y-3">
          <div><label className="so-label">Warehouse Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Main Warehouse" /></div>
          <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="WH-001" /></div>
          <div><label className="so-label">Street Address</label><input className="so-input w-full" value={form.address?.street || ''} onChange={e => fa('street', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city || ''} onChange={e => fa('city', e.target.value)} /></div>
            <div><label className="so-label">State</label><input className="so-input w-full" value={form.address?.state || ''} onChange={e => fa('state', e.target.value)} /></div>
            <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.address?.pincode || ''} onChange={e => fa('pincode', e.target.value)} /></div>
            <div><label className="so-label">Phone</label><input className="so-input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          </div>
          <div><label className="so-label">Email</label><input className="so-input w-full" value={form.email} onChange={e => f('email', e.target.value)} /></div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Warehouse</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
