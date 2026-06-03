import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus, Shield, Users, Store, ShoppingCart, IndianRupee, CreditCard } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';

const emptyForm = () => ({
  name: '', email: '', password: '', phone: '', role: 'admin', territory: '', region: '',
});

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/admin-stats');
      setAdmins(data.stats);
      setSystemStats(data.systemStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = admins.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.territory?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm(emptyForm()); setModalOpen(true); };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      email: item.email,
      password: '',
      phone: item.phone || '',
      role: 'admin',
      territory: item.territory || '',
      region: item.region || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return alert('Name and email required');
    if (!editItem && !form.password) return alert('Password required for new admin');

    try {
      if (editItem) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editItem._id}`, payload);
      } else {
        await api.post('/auth/register', form);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin?')) return;
    await api.delete(`/auth/users/${id}`);
    fetchData();
  };

  return (
    <div>
      <PageHeader
        title="Manage Admins"
        description="Create and manage admin accounts (created by Super Admin)"
        onAdd={openCreate}
        onRefresh={fetchData}
        loading={loading}
        addLabel="Add Admin"
      />

      {/* System-wide Stats Cards */}
      {systemStats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard 
            title="Total Admins" 
            value={systemStats.totalAdmins} 
            icon={<Shield size={24} />} 
            color="text-blue-500" 
            bgColor="bg-blue-50" 
          />
          <StatCard 
            title="Total Employees" 
            value={systemStats.totalEmployees} 
            icon={<Users size={24} />} 
            color="text-green-500" 
            bgColor="bg-green-50" 
          />
          <StatCard 
            title="Total Outlets" 
            value={systemStats.totalOutlets} 
            icon={<Store size={24} />} 
            color="text-purple-500" 
            bgColor="bg-purple-50" 
          />
          <StatCard 
            title="Total Orders" 
            value={systemStats.totalOrders} 
            icon={<ShoppingCart size={24} />} 
            color="text-orange-500" 
            bgColor="bg-orange-50" 
          />
          <StatCard 
            title="Total Revenue" 
            value={`₹${(systemStats.totalRevenue || 0).toLocaleString()}`} 
            icon={<IndianRupee size={24} />} 
            color="text-emerald-500" 
            bgColor="bg-emerald-50" 
          />
          <StatCard 
            title="Total Payments" 
            value={`₹${(systemStats.totalPayments || 0).toLocaleString()}`} 
            icon={<CreditCard size={24} />} 
            color="text-indigo-500" 
            bgColor="bg-indigo-50" 
          />
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admins..." className="input-field !pl-9 !py-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header w-12">#</th>
                <th className="table-header">Name</th>
                <th className="table-header">Employees</th>
                <th className="table-header">Outlets</th>
                <th className="table-header">Orders</th>
                <th className="table-header">Revenue</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan="8" className="table-cell text-center py-8">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="table-cell text-center py-8 text-surface-800/40">No admins found</td></tr>
              ) : (
                filtered.map((admin, idx) => (
                  <tr key={admin._id} className="hover:bg-surface-50/50">
                    <td className="table-cell text-center text-surface-800/50">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-brand-500" />
                        <div>
                          <span className="font-medium block">{admin.name}</span>
                          <span className="text-xs text-surface-500">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <Badge variant="info">{admin.employeeCount || 0}</Badge>
                    </td>
                    <td className="table-cell">
                      <Badge variant="success">{admin.outletCount || 0}</Badge>
                    </td>
                    <td className="table-cell">
                      <Badge variant="warning">{admin.orderCount || 0}</Badge>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-emerald-600">
                        ₹{(admin.totalRevenue || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(admin)} className="btn-secondary !py-1.5 !px-3"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(admin._id)} className="btn-secondary !py-1.5 !px-3 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Admin' : 'Add Admin'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{editItem ? 'New Password (leave blank)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required={!editItem} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Territory</label>
              <input value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-accent">{editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}