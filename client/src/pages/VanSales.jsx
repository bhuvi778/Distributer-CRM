import { useState, useEffect } from 'react';
import { Search, Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMasterData from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal from '../components/common/DetailModal';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate } from '../utils/helpers';

const DESCRIPTION = 'Create van sales assignments with warehouse, assigned user, vehicle number, and product loading details.';

const emptyForm = (userId = '') => ({
  tripId: '',
  warehouse: '',
  assignedTo: userId,
  vehicleNo: '',
  status: 'loading',
  loadIn: [],
});

export default function VanSales() {
  const { user } = useAuth();
  const { users, products, warehouses } = useMasterData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm(user?._id || ''));

  const assignableUsers = users.filter((u) => ['sales_rep', 'sales_executive', 'manager', 'employee'].includes(u.role));

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/van-sales');
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const addLoadItem = () => {
    setForm({
      ...form,
      loadIn: [
        ...form.loadIn,
        { serialNo: String(form.loadIn.length + 1), product: '', itemCode: '', itemName: '', qty: 0, unit: '' },
      ],
    });
  };

  const updateLoadItem = (idx, field, val) => {
    const loadIn = [...form.loadIn];
    loadIn[idx] = { ...loadIn[idx], [field]: val };
    if (field === 'product') {
      const p = products.find((x) => x._id === val);
      if (p) {
        loadIn[idx] = {
          ...loadIn[idx],
          itemCode: p.sku || '',
          itemName: p.name || '',
          productName: p.name || '',
          unit: p.unit || 'Pcs',
        };
      }
    }
    if (field === 'qty') loadIn[idx].loadedQty = Number(val);
    setForm({ ...form, loadIn });
  };

  const removeLoadItem = (idx) => {
    const loadIn = form.loadIn
      .filter((_, itemIdx) => itemIdx !== idx)
      .map((item, itemIdx) => ({ ...item, serialNo: String(itemIdx + 1) }));
    setForm({ ...form, loadIn });
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm(user?._id || ''));
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      tripId: item.tripId || '',
      warehouse: item.warehouse || '',
      assignedTo: item.assignedTo?._id || item.assignedTo || item.salesRep?._id || item.salesRep || '',
      vehicleNo: item.vehicleNo || item.vanNumber || '',
      status: item.status || 'loading',
      loadIn: (item.loadIn || []).map((line, idx) => ({
        ...line,
        product: line.product?._id || line.product || '',
        serialNo: line.serialNo || String(idx + 1),
        itemCode: line.itemCode || line.product?.sku || '',
        itemName: line.itemName || line.productName || line.product?.name || '',
        qty: line.qty ?? line.loadedQty ?? 0,
        unit: line.unit || line.product?.unit || '',
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.warehouse) return alert('Warehouse is required');
    if (!form.assignedTo) return alert('Assign to user is required');
    if (!form.vehicleNo) return alert('Vehicle number is required');
    if (!form.loadIn.length) return alert('Add at least one product');

    const payload = {
      ...form,
      vanNumber: form.vehicleNo,
      salesRep: form.assignedTo,
      loadIn: form.loadIn.map((item, idx) => ({
        ...item,
        serialNo: item.serialNo || String(idx + 1),
        qty: Number(item.qty || 0),
        loadedQty: Number(item.qty || item.loadedQty || 0),
        productName: item.itemName,
      })),
    };

    try {
      if (editItem) await api.put(`/van-sales/${editItem._id}`, payload);
      else await api.post('/van-sales', payload);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  return (
    <div>
      <PageHeader
        title="Van Sales"
        description={DESCRIPTION}
        onAdd={openCreate}
        onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'van_sales', [
          { key: 'tripId', label: 'ID', accessor: 'tripId' },
          { key: 'warehouse', label: 'Warehouse', accessor: 'warehouse' },
          { key: 'assignedTo', label: 'Assigned To', accessor: 'assignedTo.name' },
          { key: 'vehicleNo', label: 'Vehicle No.', accessor: 'vehicleNo' },
          { key: 'sales', label: 'Total Sales', accessor: 'totalSales' },
          { key: 'collection', label: 'Collection', accessor: 'totalCollection' },
          { key: 'status', label: 'Status', accessor: 'status' },
          { key: 'date', label: 'Date', accessor: 'date', renderExport: (v) => formatDate(v) },
        ])}
        loading={loading}
        addLabel="New Van Sales"
      />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, warehouse, user..." className="input-field !pl-9 !py-2" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Warehouse</th>
                <th className="table-header">Assigned To</th>
                <th className="table-header">Vehicle No.</th>
                <th className="table-header">Total Sales</th>
                <th className="table-header">Collection</th>
                <th className="table-header">Items</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={10} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="table-cell text-center py-12 text-surface-800/40">No van sales records found.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell font-mono font-medium">{row.tripId || row._id?.slice(-6)}</td>
                  <td className="table-cell">{row.warehouse || '-'}</td>
                  <td className="table-cell">{row.assignedTo?.name || row.salesRep?.name || '-'}</td>
                  <td className="table-cell font-mono">{row.vehicleNo || row.vanNumber || '-'}</td>
                  <td className="table-cell font-mono">{formatCurrency(row.totalSales)}</td>
                  <td className="table-cell font-mono text-green-600">{formatCurrency(row.totalCollection)}</td>
                  <td className="table-cell">{row.loadIn?.length || 0} items</td>
                  <td className="table-cell"><Badge status={row.status} /></td>
                  <td className="table-cell">{formatDate(row.date)}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-block" title="View"><Eye size={16} /></button>
                    <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg inline-block" title="Edit"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Van Sales' : 'New Van Sales'} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ID</label>
              <input value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })} className="input-field" placeholder="Auto-generated if blank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Warehouse *</label>
              <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} className="input-field" required>
                <option value="">Select warehouse...</option>
                <option value="Main">Main Warehouse</option>
                {warehouses.map((w) => <option key={w._id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assign To User *</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="input-field" required>
                <option value="">Select user...</option>
                {assignableUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Vehicle No. *</label>
              <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} className="input-field" placeholder="e.g. DL-01-AB-1234" required />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Item Details</label>
              <button type="button" onClick={addLoadItem} className="text-sm text-brand-600 flex items-center gap-1"><Plus size={14} /> Add Product</button>
            </div>
            {form.loadIn.length > 0 && (
              <div className="hidden md:grid grid-cols-[70px_140px_1fr_110px_120px_36px] gap-2 px-2 pb-1 text-xs font-medium text-surface-800/60">
                <span>Serial No.</span><span>Item Code</span><span>Item Name</span><span>Qty</span><span>Unit</span><span />
              </div>
            )}
            {form.loadIn.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[70px_140px_1fr_110px_120px_36px] gap-2 mb-2 p-2 bg-surface-50 rounded-lg">
                <input value={item.serialNo} onChange={(e) => updateLoadItem(idx, 'serialNo', e.target.value)} className="input-field !py-1.5" placeholder="S.No" />
                <input value={item.itemCode} onChange={(e) => updateLoadItem(idx, 'itemCode', e.target.value)} className="input-field !py-1.5" placeholder="Item code" />
                <select value={item.product || ''} onChange={(e) => updateLoadItem(idx, 'product', e.target.value)} className="input-field !py-1.5">
                  <option value="">Select item...</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" min="0" placeholder="Qty" value={item.qty} onChange={(e) => updateLoadItem(idx, 'qty', Number(e.target.value))} className="input-field !py-1.5" />
                <input value={item.unit} onChange={(e) => updateLoadItem(idx, 'unit', e.target.value)} className="input-field !py-1.5" placeholder="Unit" />
                <button type="button" onClick={() => removeLoadItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Remove"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Van Sales</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Van Sales Details" data={viewItem} fields={[
        { label: 'ID', accessor: 'tripId' },
        { label: 'Warehouse', accessor: 'warehouse' },
        { label: 'Assigned To', accessor: 'assignedTo.name' },
        { label: 'Vehicle No.', accessor: 'vehicleNo' },
        { label: 'Total Sales', accessor: 'totalSales', type: 'currency' },
        { label: 'Total Collection', accessor: 'totalCollection', type: 'currency' },
        { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Date', accessor: 'date', type: 'date' },
        { label: 'Load Items', accessor: 'loadIn', render: (v) => v?.length ? `${v.length} products loaded` : 'None' },
      ]} />
    </div>
  );
}
