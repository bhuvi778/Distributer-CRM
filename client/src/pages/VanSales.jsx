import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMasterData from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal from '../components/common/DetailModal';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate } from '../utils/helpers';

const DESCRIPTION = 'Manage van sales operations — assign van to sales rep & route, load inventory in/out, track total sales & collection. EOD summary shows daily performance.';

export default function VanSales() {
  const { user } = useAuth();
  const { users, routes, products } = useMasterData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    vanNumber: '', salesRep: '', route: '', status: 'loading',
    totalSales: 0, totalCollection: 0, loadIn: [],
  });

  const salesReps = users.filter((u) => ['sales_rep', 'manager'].includes(u.role));

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/van-sales');
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const addLoadItem = () => {
    setForm({ ...form, loadIn: [...form.loadIn, { product: '', productName: '', loadedQty: 0, soldQty: 0, returnedQty: 0 }] });
  };

  const updateLoadItem = (idx, field, val) => {
    const loadIn = [...form.loadIn];
    loadIn[idx] = { ...loadIn[idx], [field]: val };
    if (field === 'product') {
      const p = products.find((x) => x._id === val);
      if (p) loadIn[idx].productName = p.name;
    }
    setForm({ ...form, loadIn });
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ vanNumber: '', salesRep: user?._id || '', route: '', status: 'loading', totalSales: 0, totalCollection: 0, loadIn: [] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      vanNumber: item.vanNumber,
      salesRep: item.salesRep?._id || item.salesRep,
      route: item.route?._id || item.route,
      status: item.status,
      totalSales: item.totalSales,
      totalCollection: item.totalCollection,
      loadIn: item.loadIn || [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vanNumber || !form.salesRep) return alert('Van number and sales rep required');
    try {
      if (editItem) await api.put(`/van-sales/${editItem._id}`, form);
      else await api.post('/van-sales', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  return (
    <div>
      <PageHeader title="Van Sales" description={DESCRIPTION} onAdd={openCreate} onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'van_sales', [
          { key: 'van', label: 'Van #', accessor: 'vanNumber' },
          { key: 'rep', label: 'Sales Rep', accessor: 'salesRep.name' },
          { key: 'route', label: 'Route', accessor: 'route.name' },
          { key: 'sales', label: 'Total Sales', accessor: 'totalSales' },
          { key: 'collection', label: 'Collection', accessor: 'totalCollection' },
          { key: 'status', label: 'Status', accessor: 'status' },
          { key: 'date', label: 'Date', accessor: 'date', renderExport: (v) => formatDate(v) },
        ])} loading={loading} addLabel="New Van Trip" />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search van #, rep..." className="input-field max-w-sm !py-2" /></div>
        <table className="w-full">
          <thead className="bg-surface-50/80">
            <tr>
              <th className="table-header">Van #</th>
              <th className="table-header">Sales Rep</th>
              <th className="table-header">Route</th>
              <th className="table-header">Total Sales</th>
              <th className="table-header">Collection</th>
              <th className="table-header">Load Items</th>
              <th className="table-header">Status</th>
              <th className="table-header">Date</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map((row) => (
              <tr key={row._id} className="hover:bg-surface-50/50">
                <td className="table-cell font-mono font-medium">{row.vanNumber}</td>
                <td className="table-cell">{row.salesRep?.name}</td>
                <td className="table-cell">{row.route?.name || '-'}</td>
                <td className="table-cell font-mono">{formatCurrency(row.totalSales)}</td>
                <td className="table-cell font-mono text-green-600">{formatCurrency(row.totalCollection)}</td>
                <td className="table-cell">{row.loadIn?.length || 0} items</td>
                <td className="table-cell"><Badge status={row.status} /></td>
                <td className="table-cell">{formatDate(row.date)}</td>
                <td className="table-cell text-right">
                  <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-block"><Eye size={16} /></button>
                  <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg inline-block"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Van Trip' : 'New Van Sales Trip'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-orange-50 rounded-xl text-xs text-orange-800">
            Enter van details → Assign sales rep & route → Load products with quantities → Track sales & collection at EOD.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Van Number *</label>
              <input value={form.vanNumber} onChange={(e) => setForm({ ...form, vanNumber: e.target.value })} className="input-field" placeholder="e.g. DL-01-AB-1234" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sales Rep *</label>
              <select value={form.salesRep} onChange={(e) => setForm({ ...form, salesRep: e.target.value })} className="input-field" required>
                <option value="">Select...</option>
                {salesReps.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Route</label>
              <select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="input-field">
                <option value="">Select route...</option>
                {routes.map((r) => <option key={r._id} value={r._id}>{r.name} — {r.area}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="loading">Loading</option>
                <option value="on_route">On Route</option>
                <option value="completed">Completed</option>
                <option value="settled">Settled (EOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Sales (₹)</label>
              <input type="number" value={form.totalSales} onChange={(e) => setForm({ ...form, totalSales: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Collection (₹)</label>
              <input type="number" value={form.totalCollection} onChange={(e) => setForm({ ...form, totalCollection: Number(e.target.value) })} className="input-field" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Load In — Products on Van</label>
              <button type="button" onClick={addLoadItem} className="text-sm text-brand-600 flex items-center gap-1"><Plus size={14} /> Add Product</button>
            </div>
            {form.loadIn.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 mb-2 p-2 bg-surface-50 rounded-lg">
                <select value={item.product} onChange={(e) => updateLoadItem(idx, 'product', e.target.value)} className="input-field !py-1.5 col-span-2">
                  <option value="">Product...</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="Loaded Qty" value={item.loadedQty} onChange={(e) => updateLoadItem(idx, 'loadedQty', Number(e.target.value))} className="input-field !py-1.5" />
                <input type="number" placeholder="Sold Qty" value={item.soldQty} onChange={(e) => updateLoadItem(idx, 'soldQty', Number(e.target.value))} className="input-field !py-1.5" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Van Trip</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Van Sales Details" data={viewItem} fields={[
        { label: 'Van Number', accessor: 'vanNumber' },
        { label: 'Sales Rep', accessor: 'salesRep.name' },
        { label: 'Route', accessor: 'route.name' },
        { label: 'Total Sales', accessor: 'totalSales', type: 'currency' },
        { label: 'Total Collection', accessor: 'totalCollection', type: 'currency' },
        { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Date', accessor: 'date', type: 'date' },
        { label: 'Load Items', accessor: 'loadIn', render: (v) => v?.length ? `${v.length} products loaded` : 'None' },
      ]} />
    </div>
  );
}
