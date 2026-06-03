import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../api/axios';
import useMasterData, { invalidateMasterData } from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import DetailModal from '../components/common/DetailModal';
import { exportToExcel } from '../utils/exportExcel';
import { formatDate } from '../utils/helpers';

const DESCRIPTION = 'Real-time stock tracking across warehouses. Select product from catalog, enter quantity, batch no, and custom fields (Size, Color). Available qty = Total − Reserved.';

const EXPORT_COLS = [
  { key: 'product', label: 'Product', accessor: 'product.name' },
  { key: 'sku', label: 'SKU', accessor: 'product.sku' },
  { key: 'category', label: 'Category', accessor: 'product.category' },
  { key: 'warehouse', label: 'Warehouse', accessor: 'warehouse' },
  { key: 'qty', label: 'Quantity', accessor: 'quantity' },
  { key: 'reserved', label: 'Reserved', accessor: 'reservedQty' },
  { key: 'available', label: 'Available', accessor: 'availableQty' },
  { key: 'batch', label: 'Batch No', accessor: 'batchNo' },
];

export default function Inventory() {
  const { products } = useMasterData();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ product: '', warehouse: 'Main', quantity: 0, reservedQty: 0, batchNo: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/inventory');
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter((i) => JSON.stringify(i).toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditItem(null);
    setForm({ product: '', warehouse: 'Main', quantity: 0, reservedQty: 0, batchNo: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      product: item.product?._id || item.product,
      warehouse: item.warehouse || 'Main',
      quantity: item.quantity,
      reservedQty: item.reservedQty || 0,
      batchNo: item.batchNo || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product) return alert('Please select a product');
    try {
      if (editItem) await api.put(`/inventory/${editItem._id}`, form);
      else await api.post('/inventory', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this inventory record?')) return;
    await api.delete(`/inventory/${id}`);
    fetchData();
  };

  const selectedProduct = products.find((p) => p._id === form.product);

  return (
    <div>
      <PageHeader title="Inventory Management" description={DESCRIPTION} onAdd={openCreate} onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'inventory_stock', EXPORT_COLS)} loading={loading} addLabel="Add Stock Entry" />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, SKU, batch..." className="input-field max-w-sm !py-2" /></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Product Name</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Category</th>
                <th className="table-header">Warehouse</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Reserved</th>
                <th className="table-header">Available</th>
                <th className="table-header">Batch No</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">No inventory. Add stock entry with product name.</td></tr>
                : filtered.map((row) => (
                  <tr key={row._id} className="hover:bg-surface-50/50">
                    <td className="table-cell font-medium">{row.product?.name || '-'}</td>
                    <td className="table-cell font-mono text-sm">{row.product?.sku || '-'}</td>
                    <td className="table-cell">{row.product?.category || '-'}</td>
                    <td className="table-cell">{row.warehouse}</td>
                    <td className="table-cell font-mono">{row.quantity}</td>
                    <td className="table-cell font-mono text-orange-600">{row.reservedQty}</td>
                    <td className="table-cell font-mono font-medium text-green-600">{row.availableQty}</td>
                    <td className="table-cell">{row.batchNo || '-'}</td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Eye size={16} /></button>
                        <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Stock' : 'Add Stock Entry'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-800">
            Select product from catalog → Enter warehouse & quantity → Add batch no for traceability.
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Product *</label>
            <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="input-field" required>
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Catalog Stock: {p.stock} {p.unit}</option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs text-surface-800/50 mt-1">HSN: {selectedProduct.hsnCode} | MRP: ₹{selectedProduct.sellingPrice} | Category: {selectedProduct.category}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Warehouse</label>
              <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} className="input-field">
                <option value="Main">Main Warehouse</option>
                <option value="Secondary">Secondary</option>
                <option value="Van">Van Stock</option>
                <option value="Transit">In Transit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Batch No</label>
              <input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} className="input-field" placeholder="e.g. B2024-001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantity *</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reserved Qty</label>
              <input type="number" min="0" value={form.reservedQty} onChange={(e) => setForm({ ...form, reservedQty: Number(e.target.value) })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Add Stock'}</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Inventory Details" data={viewItem} fields={[
        { label: 'Product', accessor: 'product.name' },
        { label: 'SKU', accessor: 'product.sku' },
        { label: 'Category', accessor: 'product.category' },
        { label: 'Warehouse', accessor: 'warehouse' },
        { label: 'Quantity', accessor: 'quantity' },
        { label: 'Reserved', accessor: 'reservedQty' },
        { label: 'Available', accessor: 'availableQty' },
        { label: 'Batch No', accessor: 'batchNo' },
        { label: 'Last Updated', accessor: 'updatedAt', type: 'datetime' },
      ]} />
    </div>
  );
}
