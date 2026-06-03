import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Warehouse, Tag, ArrowLeftRight, Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';
import Badge from '../components/common/Badge';
import { formatCurrency } from '../utils/helpers';

// ─── ITEMS TAB ───────────────────────────────────────────────────
function ItemsTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'pcs', hsnCode: '', gstRate: 18, mrp: '', sellingPrice: '', purchasePrice: '', openingStock: 0, isActive: true });

  const load = useCallback(async () => {
    const { data } = await api.get('/inventory/items', { params: { search } });
    setItems(data);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name: '', sku: '', category: '', unit: 'pcs', hsnCode: '', gstRate: 18, mrp: '', sellingPrice: '', purchasePrice: '', openingStock: 0, isActive: true }); setPanelOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/inventory/items/${editing._id}`, form);
    else await api.post('/inventory/items', form);
    setPanelOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Item deactivate karna chahte hain?')) return;
    await api.delete(`/inventory/items/${id}`);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="so-input pl-9 w-full" />
        </div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Item</button>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr>
            <th>Item Name</th><th>SKU / Code</th><th>Category</th><th>Unit</th><th>GST</th>
            <th>MRP</th><th>Selling Price</th><th>Purchase Price</th><th>Stock</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-[#9e9e9e]">No items found</td></tr>}
            {items.map(item => (
              <tr key={item._id}>
                <td className="font-medium text-[#333]">{item.name}</td>
                <td className="font-mono text-xs">{item.sku}</td>
                <td>{item.category}</td>
                <td>{item.unit || 'pcs'}</td>
                <td>{item.gstRate}%</td>
                <td>{formatCurrency(item.mrp)}</td>
                <td className="font-medium text-[#1e88e5]">{formatCurrency(item.sellingPrice)}</td>
                <td>{formatCurrency(item.purchasePrice)}</td>
                <td>{item.stock ?? 0}</td>
                <td><span className={`so-badge ${item.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="so-icon-btn"><Edit2 size={14} /></button>
                    <button onClick={() => remove(item._id)} className="so-icon-btn text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Item Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Basmati Rice 5kg" /></div>
            <div><label className="so-label">SKU / Item Code</label><input className="so-input w-full" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="RICE-001" /></div>
            <div><label className="so-label">Category</label><input className="so-input w-full" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Grocery" /></div>
            <div><label className="so-label">Unit</label>
              <select className="so-input w-full" value={form.unit} onChange={e => f('unit', e.target.value)}>
                {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'bag', 'dozen', 'carton', 'meter'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="so-label">HSN Code</label><input className="so-input w-full" value={form.hsnCode} onChange={e => f('hsnCode', e.target.value)} placeholder="1006" /></div>
            <div><label className="so-label">GST Rate (%)</label>
              <select className="so-input w-full" value={form.gstRate} onChange={e => f('gstRate', Number(e.target.value))}>
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div><label className="so-label">MRP (₹)</label><input type="number" className="so-input w-full" value={form.mrp} onChange={e => f('mrp', e.target.value)} placeholder="0.00" /></div>
            <div><label className="so-label">Selling Price (₹)</label><input type="number" className="so-input w-full" value={form.sellingPrice} onChange={e => f('sellingPrice', e.target.value)} placeholder="0.00" /></div>
            <div><label className="so-label">Purchase Price (₹)</label><input type="number" className="so-input w-full" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} placeholder="0.00" /></div>
            {!editing && <div><label className="so-label">Opening Stock</label><input type="number" className="so-input w-full" value={form.openingStock} onChange={e => f('openingStock', Number(e.target.value))} /></div>}
            <div className="col-span-2">
              <label className="so-label flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} className="w-4 h-4 accent-[#1e88e5]" />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Item</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── WAREHOUSES TAB ─────────────────────────────────────────────
function WarehousesTab() {
  const [warehouses, setWarehouses] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: { street: '', city: '', state: '', pincode: '' }, phone: '', email: '', notes: '' });

  const load = async () => {
    const { data } = await api.get('/inventory/warehouses');
    setWarehouses(data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', address: { street: '', city: '', state: '', pincode: '' }, phone: '', email: '', notes: '' }); setPanelOpen(true); };
  const openEdit = (w) => { setEditing(w); setForm({ ...w }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/inventory/warehouses/${editing._id}`, form);
    else await api.post('/inventory/warehouses', form);
    setPanelOpen(false); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Warehouse</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.length === 0 && <p className="text-[#9e9e9e] text-sm col-span-3 text-center py-10">No warehouses added yet</p>}
        {warehouses.map(wh => (
          <div key={wh._id} className="border border-[#e0e0e0] rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-[#333]">{wh.name}</p>
                {wh.code && <p className="text-xs text-[#9e9e9e] font-mono">{wh.code}</p>}
              </div>
              <button onClick={() => openEdit(wh)} className="so-icon-btn"><Edit2 size={14} /></button>
            </div>
            <p className="text-xs text-[#757575] mb-3">{[wh.address?.city, wh.address?.state].filter(Boolean).join(', ')}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0f0f0]">
              <div><p className="text-xs text-[#9e9e9e]">SKUs</p><p className="font-semibold text-[#333]">{wh.stockCount ?? 0}</p></div>
              <div><p className="text-xs text-[#9e9e9e]">Total Qty</p><p className="font-semibold text-[#333]">{wh.totalQuantity ?? 0}</p></div>
            </div>
          </div>
        ))}
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Warehouse' : 'Add Warehouse'}>
        <div className="space-y-3">
          <div><label className="so-label">Warehouse Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Main Warehouse" /></div>
          <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="WH-001" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="so-label">Street</label><input className="so-input w-full" value={form.address?.street} onChange={e => fa('street', e.target.value)} /></div>
            <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city} onChange={e => fa('city', e.target.value)} /></div>
            <div><label className="so-label">State</label><input className="so-input w-full" value={form.address?.state} onChange={e => fa('state', e.target.value)} /></div>
            <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.address?.pincode} onChange={e => fa('pincode', e.target.value)} /></div>
            <div><label className="so-label">Phone</label><input className="so-input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── PRICE LIST TAB ─────────────────────────────────────────────
function PriceListTab() {
  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', applicableTo: 'all', validFrom: '', validTo: '', items: [], notes: '' });

  const load = async () => {
    const [l, p] = await Promise.all([api.get('/inventory/price-lists'), api.get('/inventory/items')]);
    setLists(l.data); setProducts(p.data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', applicableTo: 'all', validFrom: '', validTo: '', items: [], notes: '' }); setPanelOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...l, items: l.items || [] }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/inventory/price-lists/${editing._id}`, form);
    else await api.post('/inventory/price-lists', form);
    setPanelOpen(false); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', sellingPrice: '', discount: 0 }] }));
  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Price List</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Name</th><th>Code</th><th>Applicable To</th><th>Items</th><th>Valid Until</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lists.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No price lists</td></tr>}
            {lists.map(l => (
              <tr key={l._id}>
                <td className="font-medium">{l.name}</td>
                <td className="font-mono text-xs">{l.code}</td>
                <td className="capitalize">{l.applicableTo?.replace('_', ' ')}</td>
                <td>{l.items?.length || 0} items</td>
                <td>{l.validTo ? new Date(l.validTo).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`so-badge ${l.isActive ? 'so-badge-success' : 'so-badge-danger'}`}>{l.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => openEdit(l)} className="so-icon-btn"><Edit2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Price List' : 'New Price List'} width="w-[600px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Distributor Price" /></div>
            <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="PL-001" /></div>
            <div><label className="so-label">Applicable To</label>
              <select className="so-input w-full" value={form.applicableTo} onChange={e => f('applicableTo', e.target.value)}>
                <option value="all">All</option>
                <option value="customers">Customers</option>
                <option value="distributors">Distributors</option>
                <option value="super_stockers">Super Stockers</option>
              </select>
            </div>
            <div><label className="so-label">Valid From</label><input type="date" className="so-input w-full" value={form.validFrom?.slice(0,10)} onChange={e => f('validFrom', e.target.value)} /></div>
            <div><label className="so-label">Valid To</label><input type="date" className="so-input w-full" value={form.validTo?.slice(0,10)} onChange={e => f('validTo', e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Items</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={12} /> Add Product</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {form.items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="so-input flex-1" value={it.product} onChange={e => {
                    const prod = products.find(p => p._id === e.target.value);
                    updateItem(i, 'product', e.target.value);
                    updateItem(i, 'productName', prod?.name || '');
                    updateItem(i, 'sellingPrice', prod?.sellingPrice || '');
                  }}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="so-input w-28" placeholder="Price" value={it.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', e.target.value)} />
                  <input type="number" className="so-input w-20" placeholder="Disc%" value={it.discount} onChange={e => updateItem(i, 'discount', e.target.value)} />
                  <button onClick={() => removeItem(i)} className="so-icon-btn text-red-400 flex-shrink-0"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Price List</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── TRANSFER ORDERS TAB ────────────────────────────────────────
function TransferOrdersTab() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({ fromWarehouse: '', toWarehouse: '', items: [], notes: '' });

  const load = async () => {
    const [t, p] = await Promise.all([api.get('/inventory/transfers'), api.get('/inventory/items')]);
    setTransfers(t.data); setProducts(p.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.post('/inventory/transfers', form);
    setPanelOpen(false);
    setForm({ fromWarehouse: '', toWarehouse: '', items: [], notes: '' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/inventory/transfers/${id}`, { status });
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { product: '', productName: '', quantity: 1 }] }));
  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  const statusColor = { draft: 'so-badge-info', in_transit: 'so-badge-warning', completed: 'so-badge-success', cancelled: 'so-badge-danger' };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setPanelOpen(true)} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Transfer</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Transfer #</th><th>From</th><th>To</th><th>Items</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {transfers.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">No transfer orders</td></tr>}
            {transfers.map(t => (
              <tr key={t._id}>
                <td className="font-mono text-xs font-medium">{t.transferNumber}</td>
                <td>{t.fromWarehouse}</td>
                <td>{t.toWarehouse}</td>
                <td>{t.items?.length} items</td>
                <td><span className={`so-badge ${statusColor[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span></td>
                <td>{new Date(t.transferDate).toLocaleDateString('en-IN')}</td>
                <td>
                  {t.status === 'draft' && <button onClick={() => updateStatus(t._id, 'in_transit')} className="so-btn-secondary text-xs py-1 px-2">Dispatch</button>}
                  {t.status === 'in_transit' && <button onClick={() => updateStatus(t._id, 'completed')} className="so-btn-primary text-xs py-1 px-2">Receive</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="New Transfer Order">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">From Warehouse *</label><input className="so-input w-full" value={form.fromWarehouse} onChange={e => f('fromWarehouse', e.target.value)} placeholder="Main Warehouse" /></div>
            <div><label className="so-label">To Warehouse *</label><input className="so-input w-full" value={form.toWarehouse} onChange={e => f('toWarehouse', e.target.value)} placeholder="Branch Warehouse" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label">Items</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className="so-input flex-1" value={it.product} onChange={e => {
                  const prod = products.find(p => p._id === e.target.value);
                  updateItem(i, 'product', e.target.value);
                  updateItem(i, 'productName', prod?.name || '');
                }}>
                  <option value="">Select Item</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" className="so-input w-24" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} className="so-icon-btn text-red-400"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Create Transfer</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
const TABS = [
  { id: 'items', label: 'Items', icon: Package },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'pricelist', label: 'Price List', icon: Tag },
  { id: 'transfers', label: 'Transfer Orders', icon: ArrowLeftRight },
];

export default function InventoryNew() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathToTab = { '/app/inventory/warehouses': 'warehouses', '/app/inventory/price-list': 'pricelist', '/app/inventory/transfers': 'transfers' };
  const tabToPath = { items: '/app/inventory/items', warehouses: '/app/inventory/warehouses', pricelist: '/app/inventory/price-list', transfers: '/app/inventory/transfers' };
  const [tab, setTab] = useState(pathToTab[location.pathname] || 'items');

  const switchTab = (id) => { setTab(id); navigate(tabToPath[id]); };
  return (
    <div className="so-page">
      <div className="so-page-header">
        <h1 className="so-page-title">Inventory</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0] mb-5 gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-[#1e88e5] text-[#1e88e5]' : 'border-transparent text-[#616161] hover:text-[#333]'}`}
            >
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'items' && <ItemsTab />}
      {tab === 'warehouses' && <WarehousesTab />}
      {tab === 'pricelist' && <PriceListTab />}
      {tab === 'transfers' && <TransferOrdersTab />}
    </div>
  );
}
