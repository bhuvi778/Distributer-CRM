import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../api/axios';
import useMasterData from '../hooks/useMasterData';
import SalesOnListPage, { SalesOnSearchInput } from '../components/common/SalesOnListPage';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal from '../components/common/DetailModal';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency } from '../utils/helpers';

const EXPORT_COLS = [
  { key: 'name', label: 'Name', accessor: 'name' },
  { key: 'code', label: 'Code', accessor: 'code' },
  { key: 'type', label: 'Type', accessor: 'type' },
  { key: 'contact', label: 'Contact', accessor: 'contactPerson' },
  { key: 'phone', label: 'Phone', accessor: 'phone' },
  { key: 'city', label: 'City', accessor: 'address.city' },
  { key: 'gstin', label: 'GSTIN', accessor: 'gstin' },
  { key: 'outstanding', label: 'Outstanding', accessor: 'outstandingBalance' },
  { key: 'credit', label: 'Credit Limit', accessor: 'creditLimit' },
];

const emptyForm = () => ({
  name: '', code: '', type: 'retailer', contactPerson: '', phone: '', email: '',
  gstin: '', pan: '', creditLimit: 0, paymentTerms: '30 days', category: '',
  address: { street: '', city: '', state: '', pincode: '' },
  route: '', assignedTo: '',
});

export default function Outlets() {
  const { routes, users } = useMasterData();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const salesReps = users.filter((u) => ['sales_rep', 'manager'].includes(u.role));

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/outlets');
    setOutlets(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = outlets.filter((o) => JSON.stringify(o).toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditItem(null); setForm(emptyForm()); setModalOpen(true); };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, code: item.code || '', type: item.type, contactPerson: item.contactPerson || '',
      phone: item.phone || '', email: item.email || '', gstin: item.gstin || '', pan: item.pan || '',
      creditLimit: item.creditLimit || 0, paymentTerms: item.paymentTerms || '30 days', category: item.category || '',
      address: item.address || { street: '', city: '', state: '', pincode: '' },
      route: item.route?._id || item.route || '',
      assignedTo: item.assignedTo?._id || item.assignedTo || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert('Outlet name required');
    try {
      if (editItem) await api.put(`/outlets/${editItem._id}`, form);
      else await api.post('/outlets', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  const setAddr = (field, val) => setForm({ ...form, address: { ...form.address, [field]: val } });

  return (
    <>
      <SalesOnListPage
        title="Parties"
        onAdd={openCreate}
        onImport={() => exportToExcel(filtered, 'parties', EXPORT_COLS)}
        totalCount={filtered.length}
        pageStart={filtered.length ? 1 : 0}
        pageEnd={filtered.length}
        filters={<SalesOnSearchInput value={search} onChange={setSearch} placeholder="Search" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-12">#</th>
                <th className="table-header">Name</th>
                <th className="table-header">Code</th>
                <th className="table-header">Type</th>
                <th className="table-header">Phone</th>
                <th className="table-header">City</th>
                <th className="table-header">Outstanding</th>
                <th className="table-header w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell text-center py-8">Loading...</td></tr>
              ) : filtered.map((row, idx) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell text-center text-surface-800/50">{idx + 1}</td>
                  <td className="table-cell font-medium">{row.name}</td>
                  <td className="table-cell text-surface-800/60">{row.code || '—'}</td>
                  <td className="table-cell capitalize">{row.type}</td>
                  <td className="table-cell">{row.phone || '—'}</td>
                  <td className="table-cell">{row.address?.city || '—'}</td>
                  <td className="table-cell">{formatCurrency(row.outstandingBalance)}</td>
                  <td className="table-cell">
                    <button onClick={() => setViewItem(row)} className="p-1 hover:bg-surface-100 rounded"><Eye size={15} /></button>
                    <button onClick={() => openEdit(row)} className="p-1 hover:bg-surface-100 rounded"><Edit2 size={15} /></button>
                    <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/outlets/${row._id}`); fetchData(); } }} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SalesOnListPage>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Outlet' : 'Add New Outlet'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-800">
            Retailer, Distributor ya Wholesaler — type select karo. Baaki details bharo. Yehi outlet Sales Order aur Invoice mein dikhega.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Outlet Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1.5">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-field" placeholder="OUT-001" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="retailer">Retailer</option>
                <option value="distributor">Distributor</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="direct">Direct Customer</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1.5">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">GSTIN</label>
              <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">PAN</label>
              <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Credit Limit (₹)</label>
              <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Payment Terms</label>
              <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Route</label>
              <select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="input-field">
                <option value="">Select route...</option>
                {routes.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1.5">Assigned Sales Rep</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="input-field">
                <option value="">Select rep...</option>
                {salesReps.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1.5">Street Address</label>
              <input value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">City</label>
              <input value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">State</label>
              <input value={form.address.state} onChange={(e) => setAddr('state', e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Pincode</label>
              <input value={form.address.pincode} onChange={(e) => setAddr('pincode', e.target.value)} className="input-field" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create Outlet'}</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Outlet Details" data={viewItem} fields={[
        { label: 'Name', accessor: 'name' }, { label: 'Code', accessor: 'code' },
        { label: 'Type', accessor: 'type', type: 'badge' }, { label: 'Contact', accessor: 'contactPerson' },
        { label: 'Phone', accessor: 'phone' }, { label: 'Email', accessor: 'email' },
        { label: 'GSTIN', accessor: 'gstin' }, { label: 'Credit Limit', accessor: 'creditLimit', type: 'currency' },
        { label: 'Outstanding', accessor: 'outstandingBalance', type: 'currency' },
        { label: 'Route', accessor: 'route.name' }, { label: 'Assigned To', accessor: 'assignedTo.name' },
        { label: 'Address', accessor: 'address.street' },
        { label: 'City', accessor: 'address.city' }, { label: 'State', accessor: 'address.state' },
      ]} />
    </>
  );
}
