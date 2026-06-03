import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Phone, TrendingUp, Calendar } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STATUS_COLORS = { new: 'so-badge-info', contacted: 'so-badge-warning', qualified: 'so-badge-success', proposal: 'so-badge-info', negotiation: 'so-badge-warning', won: 'so-badge-success', lost: 'so-badge-danger' };
const SOURCES = ['manual', 'outsourcing', 'referral', 'website', 'social_media', 'other'];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', contactPerson: '', phone: '', email: '', source: 'manual', status: 'new', type: 'customer', address: { city: '', state: '' }, expectedValue: '', followUpDate: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await api.get('/leads', { params: { search: search || undefined, status: statusFilter || undefined } });
    setLeads(data);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...l, followUpDate: l.followUpDate?.slice(0, 10) || '' }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/leads/${editing._id}`, form);
    else await api.post('/leads', form);
    setPanelOpen(false); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  // Stats
  const stats = STATUSES.reduce((acc, s) => ({ ...acc, [s]: leads.filter(l => l.status === s).length }), {});

  return (
    <div className="so-page">
      <div className="so-page-header">
        <h1 className="so-page-title">Leads</h1>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Lead</button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`border rounded-lg px-3 py-2 text-left transition-all ${statusFilter === s ? 'border-[#1e88e5] bg-[#e3f2fd]' : 'border-[#e0e0e0] bg-white hover:border-[#1e88e5]'}`}>
            <p className="text-xl font-bold text-[#333]">{stats[s] || 0}</p>
            <p className="text-xs text-[#757575] capitalize">{s}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" className="so-input pl-9 w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="so-input w-40">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr>
            <th>Name</th><th>Type</th><th>Phone</th><th>Source</th>
            <th>Expected Value</th><th>Follow Up</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {leads.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No leads found</td></tr>}
            {leads.map(l => (
              <tr key={l._id}>
                <td>
                  <p className="font-medium text-[#333]">{l.name}</p>
                  {l.contactPerson && <p className="text-xs text-[#9e9e9e]">{l.contactPerson}</p>}
                </td>
                <td className="capitalize">{l.type?.replace('_', ' ')}</td>
                <td>{l.phone}</td>
                <td className="capitalize">{l.source?.replace('_', ' ')}</td>
                <td>₹{Number(l.expectedValue || 0).toLocaleString('en-IN')}</td>
                <td>{l.followUpDate ? new Date(l.followUpDate).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`so-badge ${STATUS_COLORS[l.status] || ''} capitalize`}>{l.status}</span></td>
                <td><button onClick={() => openEdit(l)} className="so-icon-btn"><Edit2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Lead' : 'Add Lead'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Lead Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Company or person name" /></div>
            <div><label className="so-label">Contact Person</label><input className="so-input w-full" value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} /></div>
            <div><label className="so-label">Phone *</label><input className="so-input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
            <div><label className="so-label">Email</label><input className="so-input w-full" value={form.email} onChange={e => f('email', e.target.value)} /></div>
            <div><label className="so-label">Type</label>
              <select className="so-input w-full" value={form.type} onChange={e => f('type', e.target.value)}>
                <option value="customer">Customer</option>
                <option value="distributor">Distributor</option>
                <option value="super_stocker">Super Stocker</option>
                <option value="retailer">Retailer</option>
              </select>
            </div>
            <div><label className="so-label">Source</label>
              <select className="so-input w-full" value={form.source} onChange={e => f('source', e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><label className="so-label">Status</label>
              <select className="so-input w-full" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div><label className="so-label">Expected Value (₹)</label><input type="number" className="so-input w-full" value={form.expectedValue} onChange={e => f('expectedValue', e.target.value)} /></div>
            <div><label className="so-label">Follow Up Date</label><input type="date" className="so-input w-full" value={form.followUpDate} onChange={e => f('followUpDate', e.target.value)} /></div>
            <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city} onChange={e => fa('city', e.target.value)} /></div>
            <div><label className="so-label">State</label><input className="so-input w-full" value={form.address?.state} onChange={e => fa('state', e.target.value)} /></div>
            <div className="col-span-2"><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Lead</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
