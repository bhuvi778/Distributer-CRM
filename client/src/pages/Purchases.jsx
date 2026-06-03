import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../api/axios';
import useMasterData from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal, { ItemsTable } from '../components/common/DetailModal';
import LineItemsEditor from '../components/forms/LineItemsEditor';
import { calcOrderTotals } from '../utils/calculations';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate } from '../utils/helpers';

const DESCRIPTION = 'Manage purchase orders from suppliers. Add products, quantities & rates — total calculated automatically. Received status updates inventory.';

export default function Purchases() {
  const { products } = useMasterData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ supplier: '', status: 'draft', notes: '', items: [] });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/purchases');
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier) return alert('Supplier name required');
    if (!form.items.length) return alert('Add at least one product');
    const totals = calcOrderTotals(form.items);
    const payload = {
      supplier: form.supplier, status: form.status, notes: form.notes,
      items: totals.items.map((i) => ({ product: i.product, productName: i.productName, quantity: i.quantity, rate: i.rate, gstRate: i.gstRate, amount: i.amount })),
      subtotal: totals.subtotal, taxTotal: totals.taxTotal, grandTotal: totals.grandTotal,
    };
    try {
      if (editItem) await api.put(`/purchases/${editItem._id}`, payload);
      else await api.post('/purchases', payload);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  return (
    <div>
      <PageHeader title="Purchases" description={DESCRIPTION}
        onAdd={() => { setEditItem(null); setForm({ supplier: '', status: 'draft', notes: '', items: [] }); setModalOpen(true); }}
        onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'purchases', [
          { key: 'no', label: 'PO #', accessor: 'purchaseNumber' }, { key: 'supplier', label: 'Supplier', accessor: 'supplier' },
          { key: 'total', label: 'Total', accessor: 'grandTotal' }, { key: 'status', label: 'Status', accessor: 'status' },
        ])} loading={loading} addLabel="New Purchase" />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input-field max-w-sm !py-2" /></div>
        <table className="w-full">
          <thead className="bg-surface-50/80">
            <tr>
              <th className="table-header">PO #</th><th className="table-header">Supplier</th>
              <th className="table-header">Items</th><th className="table-header">Total</th>
              <th className="table-header">Status</th><th className="table-header">Date</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map((row) => (
              <tr key={row._id} className="hover:bg-surface-50/50">
                <td className="table-cell font-mono">{row.purchaseNumber}</td>
                <td className="table-cell font-medium">{row.supplier}</td>
                <td className="table-cell">{row.items?.length || 0}</td>
                <td className="table-cell font-mono">{formatCurrency(row.grandTotal)}</td>
                <td className="table-cell"><Badge status={row.status} /></td>
                <td className="table-cell">{formatDate(row.purchaseDate)}</td>
                <td className="table-cell text-right">
                  <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg inline-block"><Eye size={16} /></button>
                  <button onClick={() => { setEditItem(row); setForm({ supplier: row.supplier, status: row.status, notes: row.notes || '', items: row.items || [] }); setModalOpen(true); }} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg inline-block"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Purchase' : 'New Purchase Order'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Supplier Name *</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="draft">Draft</option><option value="ordered">Ordered</option>
                <option value="received">Received</option><option value="cancelled">Cancelled</option>
              </select></div>
          </div>
          <LineItemsEditor items={form.items} products={products} onChange={(items) => setForm({ ...form, items })} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Purchase</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Purchase Details" data={viewItem} fields={[
        { label: 'PO Number', accessor: 'purchaseNumber' }, { label: 'Supplier', accessor: 'supplier' },
        { label: 'Subtotal', accessor: 'subtotal', type: 'currency' }, { label: 'Tax', accessor: 'taxTotal', type: 'currency' },
        { label: 'Grand Total', accessor: 'grandTotal', type: 'currency' }, { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Date', accessor: 'purchaseDate', type: 'date' },
      ]}>
        <ItemsTable items={viewItem?.items} showGst />
      </DetailModal>
    </div>
  );
}
