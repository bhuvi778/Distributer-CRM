import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Printer, Download, X, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';

// ── Helpers ──────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

const calcLine = (item) => {
  const qty   = Number(item.quantity)    || 0;
  const free  = Number(item.freeQty)     || 0;
  const rate  = Number(item.rate)        || 0;
  const disc  = Number(item.discount)    || 0;
  const gst   = Number(item.gstRate)     || 0;
  const cess  = Number(item.cessRate)    || 0;

  const baseAmt   = qty * rate;
  const discAmt   = item.discountType === 'amount' ? disc : (baseAmt * disc) / 100;
  const taxable   = baseAmt - discAmt;
  const taxAmt    = (taxable * (gst + cess)) / 100;
  const amount    = taxable + (item.taxInclusive ? 0 : taxAmt);
  const cgst      = (taxable * gst) / 200;   // half of CGST
  const sgst      = cgst;

  return { ...item, baseAmt, discAmt, taxable, taxAmt, amount: taxable + taxAmt, cgst, sgst };
};

const calcTotals = (items) => {
  const lines     = items.map(calcLine);
  const taxable   = lines.reduce((s, l) => s + l.taxable, 0);
  const cgstTotal = lines.reduce((s, l) => s + l.cgst,    0);
  const sgstTotal = lines.reduce((s, l) => s + l.sgst,    0);
  const taxTotal  = cgstTotal + sgstTotal;
  const discTotal = lines.reduce((s, l) => s + l.discAmt, 0);
  return { lines, taxable, cgstTotal, sgstTotal, taxTotal, discTotal, grandTotal: taxable + taxTotal };
};

const STATUS_COLORS = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-50 text-blue-700',
  paid:     'bg-green-50 text-green-700',
  partial:  'bg-yellow-50 text-yellow-700',
  overdue:  'bg-red-50 text-red-700',
  cancelled:'bg-red-100 text-red-800',
};

const EXPORT_COLS = [
  { key: 'inv',    label: 'Invoice #',    accessor: 'invoiceNumber' },
  { key: 'party',  label: 'Party',        accessor: 'outlet.name' },
  { key: 'date',   label: 'Date',         accessor: 'invoiceDate', renderExport: v => formatDate(v) },
  { key: 'total',  label: 'Grand Total',  accessor: 'grandTotal' },
  { key: 'paid',   label: 'Paid',         accessor: 'paidAmount' },
  { key: 'due',    label: 'Balance Due',  accessor: 'balanceDue' },
  { key: 'status', label: 'Status',       accessor: 'status' },
];

// ── Empty line ────────────────────────────────────────────────────
const emptyLine = () => ({
  product: '', productName: '', hsnCode: '', unit: 'Pcs',
  mrp: '', quantity: 1, freeQty: 0, replaceQty: 0,
  rate: '', discount: 0, discountType: 'percent',
  gstRate: 18, cessRate: 0, taxInclusive: false,
  batchNo: '',
});

// ── Create / Edit Invoice Form ────────────────────────────────────
function InvoiceForm({ editing, outlets, products, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    partyType: 'Distributor',
    outlet: editing?.outlet?._id || editing?.outlet || '',
    partyName: editing?.outlet?.name || '',
    partyMobile: '',
    date: editing?.invoiceDate?.slice(0, 10) || TODAY,
    vehicleNo: editing?.vehicleNo || '',
    warehouse: editing?.warehouse || '',
    createdBy: editing?.salesRep?._id || editing?.salesRep || '',
    customField: '',
    items: editing?.items?.length ? editing.items.map(i => ({ ...emptyLine(), ...i, product: i.product?._id || i.product || '' })) : [emptyLine()],
    billDiscount: editing?.billDiscount || 0,
    cash: editing?.cash || 0,
    tcs: editing?.tcs || 0,
    notes: editing?.notes || '',
    status: editing?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // When outlet changes — auto-fill mobile
  const handleOutletChange = (id) => {
    const o = outlets.find(x => x._id === id);
    setForm(p => ({ ...p, outlet: id, partyName: o?.name || '', partyMobile: o?.phone || '' }));
  };

  // Line item helpers
  const updateLine = (i, k, v) => setForm(p => ({
    ...p,
    items: p.items.map((it, idx) => {
      if (idx !== i) return it;
      const updated = { ...it, [k]: v };
      // Auto-fill rate from product
      if (k === 'product') {
        const prod = products.find(x => x._id === v);
        if (prod) {
          updated.productName = prod.name;
          updated.hsnCode     = prod.hsnCode || '';
          updated.unit        = prod.unit    || 'Pcs';
          updated.mrp         = prod.mrp     || '';
          updated.rate        = prod.sellingPrice || '';
          updated.gstRate     = prod.gstRate  || 18;
        }
      }
      return updated;
    }),
  }));

  const addLine  = () => setForm(p => ({ ...p, items: [...p.items, emptyLine()] }));
  const removeLine = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const { lines, taxable, cgstTotal, sgstTotal, discTotal, grandTotal } = calcTotals(form.items);

  const handleSave = async () => {
    if (!form.outlet) return alert('Select a party');
    if (!form.items.some(i => i.product || i.productName)) return alert('Add at least one item');
    setSaving(true);
    try {
      const payload = {
        type: 'sales',
        outlet:      form.outlet,
        salesRep:    form.createdBy || undefined,
        invoiceDate: form.date,
        vehicleNo:   form.vehicleNo,
        warehouse:   form.warehouse,
        items:       lines.map(l => ({
          product:      l.product || undefined,
          productName:  l.productName,
          hsnCode:      l.hsnCode,
          unit:         l.unit,
          mrp:          Number(l.mrp)       || 0,
          quantity:     Number(l.quantity)  || 0,
          freeQty:      Number(l.freeQty)   || 0,
          replaceQty:   Number(l.replaceQty)|| 0,
          rate:         Number(l.rate)      || 0,
          discount:     Number(l.discount)  || 0,
          discountType: l.discountType,
          gstRate:      Number(l.gstRate)   || 0,
          cessRate:     Number(l.cessRate)  || 0,
          taxInclusive: l.taxInclusive,
          amount:       l.amount,
          cgst:         l.cgst,
          sgst:         l.sgst,
          batchNo:      l.batchNo,
        })),
        subtotal:     taxable,
        cgstTotal,
        sgstTotal,
        taxTotal:     cgstTotal + sgstTotal,
        discountTotal: discTotal,
        grandTotal,
        billDiscount: Number(form.billDiscount) || 0,
        cash:         Number(form.cash)         || 0,
        tcs:          Number(form.tcs)          || 0,
        notes:        form.notes,
        status:       form.status,
      };
      if (editing) await api.put(`/invoices/${editing._id}`, payload);
      else          await api.post('/invoices', payload);
      onSave();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving invoice');
    } finally { setSaving(false); }
  };

  const filteredProducts = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-10">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-semibold text-[#333]">{editing ? 'Edit Sales Invoice' : 'Create Sales Invoice'}</h1>
        <div className="flex gap-2">
          <button onClick={onCancel} className="so-btn-secondary text-sm px-5">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="so-btn-primary text-sm px-5">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-4">

        {/* ── BILL TO + Invoice Meta ── */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left — Bill To */}
            <div>
              <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Bill To</p>
              <div className="space-y-2">
                {/* Party type + Party selector */}
                <div className="flex gap-2 items-center">
                  <select
                    className="so-input w-32 text-xs"
                    value={form.partyType}
                    onChange={e => f('partyType', e.target.value)}
                  >
                    <option>Customer</option>
                    <option>Distributor</option>
                    <option>Super Stocker</option>
                    <option>Supplier</option>
                  </select>
                  <select
                    className="so-input flex-1"
                    value={form.outlet}
                    onChange={e => handleOutletChange(e.target.value)}
                  >
                    <option value="">Select Party…</option>
                    {outlets.map(o => (
                      <option key={o._id} value={o._id}>{o.name}</option>
                    ))}
                  </select>
                  <button type="button" className="text-[#1e88e5] text-xs whitespace-nowrap hover:underline">+ New</button>
                </div>

                {form.partyName && (
                  <div className="text-sm font-medium text-[#333] px-1">{form.partyName}</div>
                )}
                {form.partyMobile && (
                  <div className="text-xs text-[#757575] px-1">Mobile: {form.partyMobile}</div>
                )}
              </div>
            </div>

            {/* Right — Invoice meta */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="so-label">Date</label>
                  <input type="date" className="so-input w-full" value={form.date} onChange={e => f('date', e.target.value)} />
                </div>
                <div>
                  <label className="so-label">Vehicle No</label>
                  <input className="so-input w-full" value={form.vehicleNo} onChange={e => f('vehicleNo', e.target.value)} placeholder="Vehicle number" />
                </div>
                <div>
                  <label className="so-label">Warehouse</label>
                  <select className="so-input w-full" value={form.warehouse} onChange={e => f('warehouse', e.target.value)}>
                    <option value="">Select Warehouse</option>
                    <option value="Main">Main Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="so-label">Created By</label>
                  <select className="so-input w-full" value={form.createdBy} onChange={e => f('createdBy', e.target.value)}>
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#e0e0e0]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-8">S.No</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] min-w-[200px]">ITEMS</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-20">MRP</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-28">QUANTITY</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-16">FREE</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-16">REPLACE</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-24">RATE/ITEM</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-28">DISCOUNT/ITEM</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#555] w-20">TAX</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#555] w-24">AMOUNT</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {form.items.map((item, i) => {
                  const line = calcLine(item);
                  return (
                    <tr key={i} className="hover:bg-[#fafafa]">
                      {/* S.No */}
                      <td className="px-3 py-2 text-[#9e9e9e]">{i + 1}</td>

                      {/* Item selector */}
                      <td className="px-3 py-2">
                        <select
                          className="so-input w-full text-xs"
                          value={item.product}
                          onChange={e => updateLine(i, 'product', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                        {item.batchNo !== undefined && (
                          <input
                            className="so-input w-full mt-1 text-[10px]"
                            value={item.batchNo}
                            onChange={e => updateLine(i, 'batchNo', e.target.value)}
                            placeholder="Select Batch"
                          />
                        )}
                      </td>

                      {/* MRP */}
                      <td className="px-3 py-2">
                        <input type="number" className="so-input w-full text-xs" value={item.mrp} onChange={e => updateLine(i, 'mrp', e.target.value)} placeholder="0" min="0" />
                      </td>

                      {/* Quantity + Unit */}
                      <td className="px-3 py-2">
                        <div className="flex gap-1 items-center">
                          <input type="number" className="so-input w-14 text-xs" value={item.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} min="0" placeholder="0" />
                          <select className="so-input w-14 text-[10px]" value={item.unit} onChange={e => updateLine(i, 'unit', e.target.value)}>
                            {['Pcs','Kg','Ltr','Box','Bag','Case','Nos','Pack'].map(u => <option key={u}>{u}</option>)}
                          </select>
                        </div>
                      </td>

                      {/* Free */}
                      <td className="px-3 py-2">
                        <input type="number" className="so-input w-14 text-xs" value={item.freeQty} onChange={e => updateLine(i, 'freeQty', e.target.value)} min="0" placeholder="0" />
                      </td>

                      {/* Replace */}
                      <td className="px-3 py-2">
                        <input type="number" className="so-input w-14 text-xs" value={item.replaceQty} onChange={e => updateLine(i, 'replaceQty', e.target.value)} min="0" placeholder="0" />
                      </td>

                      {/* Rate */}
                      <td className="px-3 py-2">
                        <input type="number" className="so-input w-20 text-xs" value={item.rate} onChange={e => updateLine(i, 'rate', e.target.value)} min="0" placeholder="0" />
                        <p className="text-[9px] text-[#9e9e9e] mt-0.5">{item.taxInclusive ? 'Incl. of taxes' : ''}</p>
                      </td>

                      {/* Discount */}
                      <td className="px-3 py-2">
                        <div className="flex gap-1 items-center">
                          <span className="text-[#9e9e9e] text-[10px]">%</span>
                          <input type="number" className="so-input w-14 text-xs" value={item.discount} onChange={e => updateLine(i, 'discount', e.target.value)} min="0" placeholder="0.00" />
                        </div>
                        {line.discAmt > 0 && <p className="text-[9px] text-[#757575] mt-0.5">Rs: {line.discAmt.toFixed(2)}</p>}
                      </td>

                      {/* Tax */}
                      <td className="px-3 py-2">
                        <select className="so-input w-16 text-[10px]" value={item.gstRate} onChange={e => updateLine(i, 'gstRate', Number(e.target.value))}>
                          {[0,3,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                        {line.taxAmt > 0 && <p className="text-[9px] text-[#757575] mt-0.5">{formatCurrency(line.taxAmt)}</p>}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2 text-right font-semibold text-[#333]">
                        {formatCurrency(line.amount || 0)}
                      </td>

                      {/* Remove */}
                      <td className="px-2 py-2">
                        {form.items.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-[#bdbdbd] hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          <div className="px-4 py-2 border-t border-[#f0f0f0] flex items-center gap-3">
            <button onClick={addLine} className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1">
              <Plus size={12} /> New
            </button>
            <input
              className="so-input flex-1 text-xs"
              placeholder="Enter product name to search…"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── TOTALS ── */}
        <div className="flex justify-end">
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-4 w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#555]">Taxable Amount :</span>
              <span className="font-semibold">₹ {taxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#555]">SGST :</span>
              <span>₹ {sgstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#555]">CGST :</span>
              <span>₹ {cgstTotal.toFixed(2)}</span>
            </div>

            {/* Cash */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#555]">CASH :</span>
              <input
                type="number"
                className="so-input w-28 text-right text-xs"
                value={form.cash}
                onChange={e => f('cash', e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Bill Discount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#555]">Bill Discount :</span>
              <input
                type="number"
                className="so-input w-28 text-right text-xs"
                value={form.billDiscount}
                onChange={e => f('billDiscount', e.target.value)}
                placeholder="0"
              />
            </div>

            {/* TCS */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#555]">TCS :</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#9e9e9e]">%</span>
                <input
                  type="number"
                  className="so-input w-24 text-right text-xs"
                  value={form.tcs}
                  onChange={e => f('tcs', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="border-t border-[#e0e0e0] pt-2 flex justify-between text-base font-bold">
              <span className="text-[#333]">Grand Total :</span>
              <span className="text-[#1e88e5]">
                {formatCurrency(
                  grandTotal
                  - (Number(form.billDiscount) || 0)
                  + (grandTotal * (Number(form.tcs) || 0) / 100)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
          <label className="so-label">Notes</label>
          <textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Any additional notes…" />
        </div>

      </div>
    </div>
  );
}

// ── Invoice List ─────────────────────────────────────────────────
export default function SalesInvoices() {
  const [invoices, setInvoices]   = useState([]);
  const [outlets, setOutlets]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [creating, setCreating]   = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, outRes, prodRes, userRes] = await Promise.all([
        api.get('/invoices', { params: { type: 'sales' } }),
        api.get('/outlets').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] })),
      ]);
      setInvoices(invRes.data.filter ? invRes.data.filter(i => i.type === 'sales') : invRes.data);
      setOutlets(outRes.data);
      setProducts(prodRes.data);
      setUsers(userRes.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(i => {
    const matchSearch = !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  // Show create/edit form full-page
  if (creating || editing) {
    return (
      <InvoiceForm
        editing={editing}
        outlets={outlets}
        products={products}
        users={users}
        onSave={() => { setCreating(false); setEditing(null); load(); }}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Sales Invoices</h1>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel(filtered, 'sales_invoices', EXPORT_COLS)} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          <button onClick={() => setCreating(true)} className="so-btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> New Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="so-input w-44 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="so-input w-32 text-xs">
          <option value="">All Status</option>
          {['draft','sent','paid','partial','overdue','cancelled'].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-[#9e9e9e] self-center">{filtered.length} invoices</span>
      </div>

      {/* Table */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Party</th>
              <th>Date</th>
              <th>Taxable Amt</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Grand Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={11} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-10 text-[#9e9e9e]">
                No invoices found. <button onClick={() => setCreating(true)} className="text-[#1e88e5] hover:underline">Create one</button>
              </td></tr>
            )}
            {filtered.map(inv => (
              <tr key={inv._id}>
                <td><span className="font-mono text-xs text-[#1e88e5] font-semibold">{inv.invoiceNumber}</span></td>
                <td className="font-medium text-[#333]">{inv.outlet?.name || '—'}</td>
                <td className="text-xs text-[#757575]">{formatDate(inv.invoiceDate)}</td>
                <td>{formatCurrency(inv.subtotal)}</td>
                <td>{formatCurrency(inv.cgstTotal)}</td>
                <td>{formatCurrency(inv.sgstTotal)}</td>
                <td className="font-semibold text-[#333]">{formatCurrency(inv.grandTotal)}</td>
                <td className="text-green-600">{formatCurrency(inv.paidAmount)}</td>
                <td className={inv.balanceDue > 0 ? 'text-red-600 font-medium' : ''}>{formatCurrency(inv.balanceDue)}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditing(inv)} className="so-icon-btn w-7 h-7" title="Edit"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(inv._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50" title="Delete"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
