import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';

// Generic party page — used for all party types
export default function PartyPage({ type, title, description }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', type, contactPerson: '', phone: '', email: '', gstin: '', pan: '', group: '', creditLimit: 0, paymentTerms: '30 days', address: { street: '', city: '', state: '', pincode: '' }, notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/parties', { params: { type, search: search || undefined } });
      setParties(data);
    } finally { setLoading(false); }
  }, [type, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, type }); setPanelOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/parties/${editing._id}`, form);
      else await api.post('/parties', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error saving'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">{title}</h1>
          <p className="text-xs text-[#757575] mt-0.5">{description}</p>
        </div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add {title.slice(0, -1)}</button>
      </div>

      <div className="relative w-72 mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title}…`} className="so-input pl-9 w-full" />
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr><th>Name</th><th>Contact Person</th><th>Phone</th><th>City</th><th>GSTIN</th><th>Credit Limit</th><th>Outstanding</th><th>Status</th><th className="w-12"></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && parties.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-[#9e9e9e]">No {title} found. Click "Add" to create one.</td></tr>
            )}
            {parties.map(p => (
              <tr key={p._id}>
                <td>
                  <p className="font-medium text-[#333]">{p.name}</p>
                  {p.code && <p className="text-xs text-[#9e9e9e] font-mono">{p.code}</p>}
                </td>
                <td>{p.contactPerson || '—'}</td>
                <td>{p.phone || '—'}</td>
                <td>{p.address?.city || '—'}</td>
                <td><span className="font-mono text-xs">{p.gstin || '—'}</span></td>
                <td>{formatCurrency(p.creditLimit || 0)}</td>
                <td className={p.outstandingBalance > 0 ? 'font-semibold text-orange-600' : ''}>{formatCurrency(p.outstandingBalance || 0)}</td>
                <td><span className={`so-badge ${p.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => openEdit(p)} className="so-icon-btn"><Edit2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? `Edit ${title.slice(0,-1)}` : `Add ${title.slice(0,-1)}`}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Party name" /></div>
            <div><label className="so-label">Contact Person</label><input className="so-input w-full" value={form.contactPerson || ''} onChange={e => f('contactPerson', e.target.value)} /></div>
            <div><label className="so-label">Phone</label><input className="so-input w-full" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="9876543210" /></div>
            <div><label className="so-label">Email</label><input className="so-input w-full" value={form.email || ''} onChange={e => f('email', e.target.value)} /></div>
            <div><label className="so-label">GSTIN</label><input className="so-input w-full" value={form.gstin || ''} onChange={e => f('gstin', e.target.value)} /></div>
            <div><label className="so-label">PAN</label><input className="so-input w-full" value={form.pan || ''} onChange={e => f('pan', e.target.value)} /></div>
            <div><label className="so-label">Group</label><input className="so-input w-full" value={form.group || ''} onChange={e => f('group', e.target.value)} placeholder="Optional tag" /></div>
            <div><label className="so-label">Credit Limit (₹)</label><input type="number" className="so-input w-full" value={form.creditLimit || 0} onChange={e => f('creditLimit', e.target.value)} min="0" /></div>
            <div><label className="so-label">Payment Terms</label>
              <select className="so-input w-full" value={form.paymentTerms || '30 days'} onChange={e => f('paymentTerms', e.target.value)}>
                {['Immediate', '7 days', '15 days', '30 days', '45 days', '60 days'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#555] mt-1">Address</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Street</label><input className="so-input w-full" value={form.address?.street || ''} onChange={e => fa('street', e.target.value)} /></div>
            <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city || ''} onChange={e => fa('city', e.target.value)} /></div>
            <div><label className="so-label">State</label><input className="so-input w-full" value={form.address?.state || ''} onChange={e => fa('state', e.target.value)} /></div>
            <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.address?.pincode || ''} onChange={e => fa('pincode', e.target.value)} /></div>
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
