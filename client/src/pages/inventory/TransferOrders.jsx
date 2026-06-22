import { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
import api from '../../api/axios';

const STATUS_COLOR = {
  draft: 'so-badge-info',
  in_transit: 'so-badge-warning',
  completed: 'so-badge-success',
  cancelled: 'so-badge-danger',
};

const todayInput = () => new Date().toISOString().slice(0, 10);
const formatDate = (date) => new Date(date).toLocaleDateString('en-GB');

const emptyForm = () => ({
  transferNumber: '#',
  transferDate: todayInput(),
  fromWarehouse: '',
  toWarehouse: '',
  notes: '',
  items: [],
});

export default function TransferOrders() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [productQuery, setProductQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [transferRes, productRes, warehouseRes] = await Promise.all([
        api.get('/inventory/transfers'),
        api.get('/inventory/items'),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      setTransfers(transferRes.data || []);
      setProducts(productRes.data || []);
      setWarehouses(warehouseRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addProductByName = (value) => {
    setProductQuery(value);
    const product = products.find((item) => item.name.toLowerCase() === value.toLowerCase());
    if (!product) return;
    setForm((prev) => {
      if (prev.items.some((item) => item.product === product._id)) return prev;
      return {
        ...prev,
        items: [...prev.items, { product: product._id, productName: product.name, quantity: 1, unit: product.unit }],
      };
    });
    setProductQuery('');
  };

  const save = async () => {
    if (!form.fromWarehouse || !form.toWarehouse) return alert('Both warehouses required');
    if (!form.items.length) return alert('Add at least one item');
    try {
      const payload = { ...form };
      delete payload.transferNumber;
      await api.post('/inventory/transfers', payload);
      setCreateMode(false);
      setForm(emptyForm());
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/inventory/transfers/${id}`, { status });
    load();
  };

  const openCreate = () => {
    setForm(emptyForm());
    setProductQuery('');
    setCreateMode(true);
  };

  if (createMode) {
    return (
      <div className="so-module-page">
        <div className="so-titlebar">
          <h1 className="so-title">Create Transfer Order</h1>
          <div className="so-actions">
            <button type="button" onClick={() => setCreateMode(false)} className="so-btn-secondary border-[#174bb8] text-[#174bb8] min-w-[50px] text-lg">X</button>
            <button type="button" onClick={save} className="so-btn-primary text-lg min-w-[80px]">Save</button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <section className="bg-white border border-[#d7dce5] rounded-lg px-8 py-8">
            <h2 className="text-sm uppercase tracking-wide font-semibold text-[#667085] mb-8">Transfer Order Details</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-5">
              <div>
                <label className="so-label !text-base !text-[#667085]">Transfer Number</label>
                <input className="so-input w-full" value={form.transferNumber} onChange={(e) => f('transferNumber', e.target.value)} />
              </div>
              <div>
                <label className="so-label !text-base !text-[#667085]">Transfer Date</label>
                <input type="date" className="so-input w-full bg-[#f4f4f4] text-[#b3b3b3]" value={form.transferDate} onChange={(e) => f('transferDate', e.target.value)} />
              </div>
              <div>
                <label className="so-label !text-base !text-[#667085]">From Warehouse</label>
                <select className="so-input so-select w-full" value={form.fromWarehouse} onChange={(e) => f('fromWarehouse', e.target.value)}>
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse.name}>{warehouse.name}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label !text-base !text-[#667085]">To Warehouse</label>
                <select className="so-input so-select w-full" value={form.toWarehouse} onChange={(e) => f('toWarehouse', e.target.value)}>
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse.name}>{warehouse.name}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label !text-base !text-[#667085]">Comments</label>
                <textarea className="so-input w-full min-h-[40px]" value={form.notes} onChange={(e) => f('notes', e.target.value)} placeholder="Additional notes or remarks..." />
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#d7dce5] rounded-lg px-8 py-8">
            <h2 className="text-sm uppercase tracking-wide font-semibold text-[#667085] mb-6">Items</h2>
            <input
              className="so-input w-full bg-[#e8edf4]"
              value={productQuery}
              onChange={(e) => addProductByName(e.target.value)}
              list="transfer-products"
              placeholder="Enter product name"
            />
            <datalist id="transfer-products">
              {products.map((product) => <option key={product._id} value={product.name} />)}
            </datalist>
            {form.items.length > 0 && (
              <div className="mt-4 border border-[#d7dce5]">
                <table className="so-table">
                  <thead><tr><th>Items</th><th className="w-[170px]">Quantity</th></tr></thead>
                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={item.product}>
                        <td>{item.productName}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="so-input w-full"
                            value={item.quantity}
                            onChange={(e) => setForm((prev) => ({
                              ...prev,
                              items: prev.items.map((row, idx) => (idx === index ? { ...row, quantity: Number(e.target.value) } : row)),
                            }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  const range = `${formatDate(new Date())} - ${formatDate(new Date())}`;

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Transfer Orders</h1>
        <button type="button" onClick={openCreate} className="so-btn-primary text-lg">Create Transfer Order</button>
      </div>

      <div className="so-filterbar">
        <input className="so-input w-[378px]" readOnly value={range} />
      </div>

      <div className="so-table-panel">
        <table className="so-table">
          <thead>
            <tr>
              <th>Transfer No.</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Comment</th>
              <th>Status</th>
              <th className="w-[150px]"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-20 text-[#98a2b3]">Loading...</td></tr>}
            {!loading && transfers.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="so-empty so-empty-small">
                    <Archive className="so-box-empty-icon" strokeWidth={1.2} />
                    <span>No Data</span>
                  </div>
                </td>
              </tr>
            )}
            {transfers.map((transfer) => (
              <tr key={transfer._id}>
                <td>{transfer.transferNumber}</td>
                <td>{formatDate(transfer.transferDate)}</td>
                <td>{transfer.fromWarehouse}</td>
                <td>{transfer.toWarehouse}</td>
                <td>{transfer.notes || '-'}</td>
                <td><span className={`so-badge ${STATUS_COLOR[transfer.status] || ''}`}>{transfer.status?.replace('_', ' ')}</span></td>
                <td>
                  {transfer.status === 'draft' && <button type="button" onClick={() => updateStatus(transfer._id, 'in_transit')} className="so-btn-secondary text-sm">Dispatch</button>}
                  {transfer.status === 'in_transit' && <button type="button" onClick={() => updateStatus(transfer._id, 'completed')} className="so-btn-primary text-sm">Mark Received</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
