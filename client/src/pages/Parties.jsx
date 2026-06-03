import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Phone, MapPin, Users, Truck, Star, ShoppingBag, Eye, UserCheck } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';
import { formatCurrency } from '../utils/helpers';

const TYPE_TABS = [
  { id: 'customer', label: 'Customers', icon: Users },
  { id: 'distributor', label: 'Distributors', icon: Truck },
  { id: 'super_stocker', label: 'Super Stockers', icon: Star },
  { id: 'supplier', label: 'Suppliers', icon: ShoppingBag },
  { id: 'visited', label: 'Visited', icon: Eye },
];

const TYPE_LABELS = { customer: 'Customer', distributor: 'Distributor', super_stocker: 'Super Stocker', supplier: 'Supplier', visited: 'Visited' };

function PartyForm({ form, setForm, onSave, onClose }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="so-label">Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Party name" /></div>
        <div><label className="so-label">Type *</label>
          <select className="so-input w-full" value={form.type} onChange={e => f('type', e.target.value)}>
            <option value="customer">Customer</option>
            <option value="distributor">Distributor</option>
            <option value="super_stocker">Super Stocker</option>
            <option value="supplier">Supplier</option>
            <option value="visited">Visited</option>
          </select>
        </div>
        <div><label className="so-label">Group</label><input className="so-input w-full" value={form.group} onChange={e => f('group', e.target.value)} placeholder="Optional group tag" /></div>
        <div><label className="so-label">Contact Person</label><input className="so-input w-full" value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} /></div>
        <div><label className="so-label">Phone</label><input className="so-input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="9876543210" /></div>
        <div><label className="so-label">Email</label><input className="so-input w-full" value={form.email} onChange={e => f('email', e.target.value)} /></div>
        <div><label className="so-label">GSTIN</label><input className="so-input w-full" value={form.gstin} onChange={e => f('gstin', e.target.value)} /></div>
        <div><label className="so-label">PAN</label><input className="so-input w-full" value={form.pan} onChange={e => f('pan', e.target.value)} /></div>
        <div><label className="so-label">Credit Limit (₹)</label><input type="number" className="so-input w-full" value={form.creditLimit} onChange={e => f('creditLimit', e.target.value)} /></div>
        <div><label className="so-label">Payment Terms</label>
          <select className="so-input w-full" value={form.paymentTerms} onChange={e => f('paymentTerms', e.target.value)}>
            {['Immediate', '7 days', '15 days', '30 days', '45 days', '60 days'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="so-label">Street Address</label><input className="so-input w-full" value={form.address?.street} onChange={e => fa('street', e.target.value)} /></div>
        <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city} onChange={e => fa('city', e.target.value)} /></div>
        <div><label className="so-label">State</label><input className="so-input w-full" value={form.address?.state} onChange={e => fa('state', e.target.value)} /></div>
        <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.address?.pincode} onChange={e => fa('pincode', e.target.value)} /></div>
        <div className="col-span-2"><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
        <button onClick={onSave} className="so-btn-primary flex-1">Save</button>
        <button onClick={onClose} className="so-btn-secondary flex-1">Cancel</button>
      </div>
    </div>
  );
}

export default function Parties() {
  const { type: urlType } = useParams();
  const navigate = useNavigate();
  const typeMap = { customers: 'customer', distributors: 'distributor', 'super-stockers': 'super_stocker', suppliers: 'supplier', visited: 'visited', groups: 'customer' };
  const [activeType, setActiveType] = useState(typeMap[urlType] || 'customer');
  const switchType = (id) => { setActiveType(id); const slug = { customer: 'customers', distributor: 'distributors', super_stocker: 'super-stockers', supplier: 'suppliers', visited: 'visited' }; navigate('/app/parties/' + (slug[id] || 'customers')); };
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', type: activeType, contactPerson: '', phone: '', email: '', gstin: '', pan: '', group: '', creditLimit: 0, paymentTerms: '30 days', address: { street: '', city: '', state: '', pincode: '' }, notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await api.get('/parties', { params: { type: activeType, search: search || undefined } });
    setParties(data);
  }, [activeType, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, type: activeType }); setPanelOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/parties/${editing._id}`, form);
    else await api.post('/parties', form);
    setPanelOpen(false); load();
  };

  return (
    <div className="so-page">
      <div className="so-page-header">
        <h1 className="so-page-title">Parties</h1>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Party</button>
      </div>

      {/* Type Tabs */}
      <div className="flex border-b border-[#e0e0e0] mb-5 gap-1 flex-wrap">
        {TYPE_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => switchType(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeType === t.id ? 'border-[#1e88e5] text-[#1e88e5]' : 'border-transparent text-[#616161] hover:text-[#333]'}`}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-64 mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${TYPE_LABELS[activeType]}s…`} className="so-input pl-9 w-full" />
      </div>

      {/* Table */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr>
            <th>Name</th><th>Contact</th><th>Phone</th><th>City</th>
            <th>Credit Limit</th><th>Outstanding</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {parties.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">No {TYPE_LABELS[activeType]}s found</td></tr>}
            {parties.map(p => (
              <tr key={p._id}>
                <td>
                  <p className="font-medium text-[#333]">{p.name}</p>
                  {p.group && <p className="text-xs text-[#9e9e9e]">{p.group}</p>}
                </td>
                <td>{p.contactPerson || '—'}</td>
                <td>{p.phone || '—'}</td>
                <td>{p.address?.city || '—'}</td>
                <td>{formatCurrency(p.creditLimit)}</td>
                <td className={p.outstandingBalance > 0 ? 'text-orange-600 font-medium' : ''}>{formatCurrency(p.outstandingBalance)}</td>
                <td><span className={`so-badge ${p.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => openEdit(p)} className="so-icon-btn"><Edit2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? `Edit ${TYPE_LABELS[form.type]}` : `Add ${TYPE_LABELS[activeType]}`}>
        <PartyForm form={form} setForm={setForm} onSave={save} onClose={() => setPanelOpen(false)} />
      </SlidePanel>
    </div>
  );
}
