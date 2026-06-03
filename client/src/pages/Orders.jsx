import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMasterData, { invalidateMasterData } from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal, { ItemsTable } from '../components/common/DetailModal';
import LineItemsEditor from '../components/forms/LineItemsEditor';
import { calcOrderTotals } from '../utils/calculations';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate } from '../utils/helpers';

const DESCRIPTION = 'Take sales orders from field with digital catalog. Select outlet & sales rep, add products with qty/rate/discount, and system auto-calculates GST & grand total. Supports regular, van sales & return orders.';

const COLUMNS = [
  { key: 'orderNumber', label: 'Order #', accessor: 'orderNumber' },
  { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
  { key: 'rep', label: 'Sales Rep', accessor: 'salesRep.name' },
  { key: 'route', label: 'Route', accessor: 'route.name' },
  { key: 'total', label: 'Grand Total', accessor: 'grandTotal', type: 'currency' },
  { key: 'type', label: 'Type', accessor: 'orderType' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'date', label: 'Date', accessor: 'orderDate', type: 'date' },
];

const EXPORT_COLS = [
  { key: 'orderNumber', label: 'Order #', accessor: 'orderNumber' },
  { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
  { key: 'rep', label: 'Sales Rep', accessor: 'salesRep.name' },
  { key: 'route', label: 'Route', accessor: 'route.name' },
  { key: 'subtotal', label: 'Subtotal', accessor: 'subtotal' },
  { key: 'tax', label: 'Tax', accessor: 'taxTotal' },
  { key: 'total', label: 'Grand Total', accessor: 'grandTotal' },
  { key: 'type', label: 'Type', accessor: 'orderType' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'date', label: 'Date', accessor: 'orderDate', renderExport: (v) => formatDate(v) },
];

const emptyForm = () => ({
  outlet: '', salesRep: '', route: '', orderType: 'regular', status: 'draft', notes: '', items: [],
});

export default function Orders() {
  const { user, can } = useAuth();
  const { outlets, products, users, routes, loading: mdLoading } = useMasterData();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const salesReps = users.filter((u) => ['sales_rep', 'manager', 'admin'].includes(u.role));

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await api.get('/orders');
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => JSON.stringify(o).toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm(), salesRep: user?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      outlet: item.outlet?._id || item.outlet || '',
      salesRep: item.salesRep?._id || item.salesRep || '',
      route: item.route?._id || item.route || '',
      orderType: item.orderType,
      status: item.status,
      notes: item.notes || '',
      items: item.items?.map((i) => ({
        product: i.product?._id || i.product,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount || 0,
        gstRate: i.gstRate || 18,
        hsnCode: i.hsnCode,
      })) || [],
    });
    setModalOpen(true);
  };

  const handleOutletChange = (outletId) => {
    const outlet = outlets.find((o) => o._id === outletId);
    setForm({ ...form, outlet: outletId, route: outlet?.route?._id || outlet?.route || form.route });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.outlet) return alert('Please select an outlet');
    if (!form.salesRep) return alert('Please select a sales rep');
    if (!form.items.length) return alert('Please add at least one product');

    const totals = calcOrderTotals(form.items);
    const payload = {
      outlet: form.outlet,
      salesRep: form.salesRep,
      route: form.route || undefined,
      orderType: form.orderType,
      status: form.status,
      notes: form.notes,
      items: totals.items.map((i) => ({
        product: i.product,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount,
        gstRate: i.gstRate,
        amount: i.amount,
        hsnCode: i.hsnCode,
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
    };

    try {
      if (editItem) await api.put(`/orders/${editItem._id}`, payload);
      else await api.post('/orders', payload);
      setModalOpen(false);
      invalidateMasterData();
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving order');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this order?')) return;
    await api.delete(`/orders/${id}`);
    fetchOrders();
  };

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description={DESCRIPTION}
        onAdd={openCreate}
        onRefresh={fetchOrders}
        onExport={() => exportToExcel(filtered, 'sales_orders', EXPORT_COLS)}
        loading={loading}
        addLabel="New Sales Order"
      />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order #, outlet, rep..." className="input-field !pl-9 !py-2" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                {COLUMNS.map((c) => <th key={c.key} className="table-header">{c.label}</th>)}
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">No orders found. Click "New Sales Order" to create one.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell font-mono font-medium">{row.orderNumber}</td>
                  <td className="table-cell">{row.outlet?.name || '-'}</td>
                  <td className="table-cell">{row.salesRep?.name || '-'}</td>
                  <td className="table-cell">{row.route?.name || '-'}</td>
                  <td className="table-cell font-mono font-medium">{formatCurrency(row.grandTotal)}</td>
                  <td className="table-cell"><Badge status={row.orderType} /></td>
                  <td className="table-cell"><Badge status={row.status} /></td>
                  <td className="table-cell">{formatDate(row.orderDate)}</td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View Details"><Eye size={16} /></button>
                      <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      {can('deleteRecords') && (
                      <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `Edit Order ${editItem.orderNumber}` : 'Create New Sales Order'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800">
            <strong>How to create:</strong> Select outlet → Select sales rep → Add products with quantity & rate → System calculates total automatically.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Outlet / Customer *</label>
              <select value={form.outlet} onChange={(e) => handleOutletChange(e.target.value)} className="input-field" required>
                <option value="">Select outlet...</option>
                {outlets.map((o) => (
                  <option key={o._id} value={o._id}>{o.name} ({o.code}) — {o.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sales Representative *</label>
              <select value={form.salesRep} onChange={(e) => setForm({ ...form, salesRep: e.target.value })} className="input-field" required>
                <option value="">Select sales rep...</option>
                {salesReps.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Route</label>
              <select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="input-field">
                <option value="">Select route (optional)...</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>{r.name} — {r.area}, {r.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Order Type</label>
              <select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })} className="input-field">
                <option value="regular">Regular Order</option>
                <option value="van">Van Sales</option>
                <option value="return">Return Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <LineItemsEditor items={form.items} products={products} onChange={(items) => setForm({ ...form, items })} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field min-h-[60px]" placeholder="Any special instructions..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Order' : 'Create Order'}</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Sales Order Details" data={viewItem} fields={[
        { label: 'Order Number', accessor: 'orderNumber' },
        { label: 'Outlet', accessor: 'outlet.name' },
        { label: 'Sales Rep', accessor: 'salesRep.name' },
        { label: 'Route', accessor: 'route.name' },
        { label: 'Order Type', accessor: 'orderType', type: 'badge' },
        { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Subtotal', accessor: 'subtotal', type: 'currency' },
        { label: 'Tax (GST)', accessor: 'taxTotal', type: 'currency' },
        { label: 'Grand Total', accessor: 'grandTotal', type: 'currency' },
        { label: 'Order Date', accessor: 'orderDate', type: 'date' },
        { label: 'Notes', accessor: 'notes' },
      ]}>
        <ItemsTable items={viewItem?.items} showGst />
      </DetailModal>
    </div>
  );
}
