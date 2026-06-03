import { useState, useEffect, useMemo } from 'react';
import { Percent, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import SalesOnListPage, { SalesOnSearchInput, SalesOnFilterSelect } from '../components/common/SalesOnListPage';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency } from '../utils/helpers';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', brand: '', unit: 'Pcs', hsnCode: '', gstRate: 18,
    mrp: 0, sellingPrice: 0, purchasePrice: 0, stock: 0, minStock: 10,
    customFields: { size: '', color: '', batchNo: '' },
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/products');
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

  const filtered = products.filter((p) => {
    const matchSearch = JSON.stringify(p).toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    const matchBrand = !brand || p.brand === brand;
    return matchSearch && matchCat && matchBrand;
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', sku: '', category: '', brand: '', unit: 'Pcs', hsnCode: '', gstRate: 18, mrp: 0, sellingPrice: 0, purchasePrice: 0, stock: 0, minStock: 10, customFields: { size: '', color: '', batchNo: '' } });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, customFields: item.customFields || { size: '', color: '', batchNo: '' } });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert('Item name required');
    try {
      if (editItem) await api.put(`/products/${editItem._id}`, form);
      else await api.post('/products', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  return (
    <>
      <SalesOnListPage
        title="Items"
        onAdd={openCreate}
        onImport={() => exportToExcel(filtered, 'items', [
          { key: 'sku', label: 'Item Code', accessor: 'sku' },
          { key: 'name', label: 'Item Name', accessor: 'name' },
          { key: 'stock', label: 'Stock', accessor: 'stock' },
          { key: 'sellingPrice', label: 'Selling Price', accessor: 'sellingPrice' },
          { key: 'purchasePrice', label: 'Purchase Price', accessor: 'purchasePrice' },
        ])}
        totalCount={filtered.length}
        pageStart={filtered.length ? 1 : 0}
        pageEnd={filtered.length}
        filters={
          <>
            <SalesOnSearchInput value={search} onChange={setSearch} placeholder="Search" />
            <SalesOnFilterSelect label="Select Category" value={category} onChange={setCategory} options={categories} />
            <SalesOnFilterSelect label="Select Brand" value={brand} onChange={setBrand} options={brands} />
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-12">#</th>
                <th className="table-header">Item Code</th>
                <th className="table-header">Item Name</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Selling Price</th>
                <th className="table-header">Purchase Price</th>
                <th className="table-header w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell text-center py-8">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-8">No items found</td></tr>
              ) : filtered.map((row, idx) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell text-center text-surface-800/50">{idx + 1}</td>
                  <td className="table-cell font-mono text-surface-800/60">{row.sku || '—'}</td>
                  <td className="table-cell font-medium">{row.name}</td>
                  <td className="table-cell">
                    <span className={row.stock < 0 ? 'text-red-600' : ''}>{row.stock} {row.unit || 'Pcs'}</span>
                  </td>
                  <td className="table-cell">{formatCurrency(row.sellingPrice)}</td>
                  <td className="table-cell">{formatCurrency(row.purchasePrice)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(row)} className="p-1.5 hover:bg-surface-100 rounded" title="GST / Edit">
                        <Percent size={16} />
                      </button>
                      <button type="button" onClick={() => openEdit(row)} className="p-1.5 hover:bg-surface-100 rounded">
                        <Edit2 size={14} />
                      </button>
                      <button type="button" onClick={async () => { if (confirm('Delete item?')) { await api.delete(`/products/${row._id}`); fetchData(); } }} className="p-1.5 hover:bg-red-50 text-red-500 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SalesOnListPage>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Item' : 'Add Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Item Code / SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                {['Pcs', 'Kg', 'Ltr', 'Box', 'Nos', 'Pkt'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">HSN Code</label>
              <input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">GST %</label>
              <input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label">Purchase Price (₹)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label">MRP (₹)</label>
              <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Item</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
