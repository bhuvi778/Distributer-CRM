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
import { calcInvoiceTotals } from '../utils/calculations';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate } from '../utils/helpers';

const DESCRIPTION = 'Create GST-compliant invoices — Sales, Purchase, Estimate, Delivery Challan & Expense. Select outlet, add products, and system auto-calculates CGST/SGST, subtotal & grand total. Supports A4, A5 & thermal print formats with Tally sync.';

const EXPORT_COLS = [
  { key: 'invoiceNumber', label: 'Invoice #', accessor: 'invoiceNumber' },
  { key: 'type', label: 'Type', accessor: 'type' },
  { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
  { key: 'subtotal', label: 'Subtotal', accessor: 'subtotal' },
  { key: 'cgst', label: 'CGST', accessor: 'cgstTotal' },
  { key: 'sgst', label: 'SGST', accessor: 'sgstTotal' },
  { key: 'total', label: 'Grand Total', accessor: 'grandTotal' },
  { key: 'paid', label: 'Paid', accessor: 'paidAmount' },
  { key: 'due', label: 'Balance Due', accessor: 'balanceDue' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'date', label: 'Date', accessor: 'invoiceDate', renderExport: (v) => formatDate(v) },
];

const emptyForm = () => ({
  type: 'sales', outlet: '', salesRep: '', status: 'draft', printFormat: 'A4',
  gstin: '', placeOfSupply: '', notes: '', items: [],
});

export default function Invoices() {
  const { user } = useAuth();
  const { outlets, products, users, loading: mdLoading } = useMasterData();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const salesReps = users.filter((u) => ['sales_rep', 'manager', 'admin'].includes(u.role));

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/invoices');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = invoices.filter((i) => JSON.stringify(i).toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm(), salesRep: user?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      type: item.type,
      outlet: item.outlet?._id || item.outlet || '',
      salesRep: item.salesRep?._id || item.salesRep || '',
      status: item.status,
      printFormat: item.printFormat || 'A4',
      gstin: item.gstin || '',
      placeOfSupply: item.placeOfSupply || '',
      notes: item.notes || '',
      items: item.items?.map((i) => ({
        product: i.product?._id || i.product,
        productName: i.productName,
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
    setForm({ ...form, outlet: outletId, gstin: outlet?.gstin || form.gstin });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.outlet && form.type === 'sales') return alert('Please select an outlet');
    if (!form.items.length) return alert('Please add at least one product/item');

    const totals = calcInvoiceTotals(form.items);
    const payload = {
      type: form.type,
      outlet: form.outlet || undefined,
      salesRep: form.salesRep,
      status: form.status,
      printFormat: form.printFormat,
      gstin: form.gstin,
      placeOfSupply: form.placeOfSupply,
      notes: form.notes,
      items: totals.items.map((i) => ({
        product: i.product,
        productName: i.productName,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount,
        gstRate: i.gstRate,
        amount: i.amount,
        cgst: i.cgst,
        sgst: i.sgst,
      })),
      subtotal: totals.subtotal,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
    };

    try {
      if (editItem) await api.put(`/invoices/${editItem._id}`, payload);
      else await api.post('/invoices', payload);
      setModalOpen(false);
      invalidateMasterData();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    fetchData();
  };

  return (
    <div>
      <PageHeader
        title="Invoices & GST"
        description={DESCRIPTION}
        onAdd={openCreate}
        onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'gst_invoices', EXPORT_COLS)}
        loading={loading}
        addLabel="New Invoice"
      />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice #, outlet..." className="input-field !pl-9 !py-2" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Invoice #</th>
                <th className="table-header">Type</th>
                <th className="table-header">Outlet</th>
                <th className="table-header">Sales Rep</th>
                <th className="table-header">Grand Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">No invoices. Click "New Invoice" to create GST invoice.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell font-mono font-medium">{row.invoiceNumber}</td>
                  <td className="table-cell"><Badge status={row.type} /></td>
                  <td className="table-cell">{row.outlet?.name || '-'}</td>
                  <td className="table-cell">{row.salesRep?.name || '-'}</td>
                  <td className="table-cell font-mono font-medium">{formatCurrency(row.grandTotal)}</td>
                  <td className="table-cell font-mono text-green-600">{formatCurrency(row.paidAmount)}</td>
                  <td className="table-cell font-mono text-red-600">{formatCurrency(row.balanceDue)}</td>
                  <td className="table-cell"><Badge status={row.status} /></td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `Edit ${editItem.invoiceNumber}` : 'Create New Invoice'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3 bg-green-50 rounded-xl text-xs text-green-800">
            <strong>GST Invoice:</strong> Select invoice type → Choose outlet → Add products → CGST/SGST & total calculated automatically. Retailers, distributors & manufacturers all use same invoice module.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Invoice Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="sales">Sales Invoice (GST)</option>
                <option value="purchase">Purchase Invoice</option>
                <option value="estimate">Estimate / Quotation</option>
                <option value="delivery_challan">Delivery Challan</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Outlet / Customer *</label>
              <select value={form.outlet} onChange={(e) => handleOutletChange(e.target.value)} className="input-field" required={form.type === 'sales'}>
                <option value="">Select outlet...</option>
                {outlets.map((o) => (
                  <option key={o._id} value={o._id}>{o.name} ({o.type}) — Due: ₹{o.outstandingBalance}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sales Representative</label>
              <select value={form.salesRep} onChange={(e) => setForm({ ...form, salesRep: e.target.value })} className="input-field">
                <option value="">Select...</option>
                {salesReps.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">GSTIN</label>
              <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="input-field" placeholder="e.g. 07AABCS1234A1Z5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Place of Supply</label>
              <input value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} className="input-field" placeholder="State name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Print Format</label>
              <select value={form.printFormat} onChange={(e) => setForm({ ...form, printFormat: e.target.value })} className="input-field">
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="thermal">Thermal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <LineItemsEditor items={form.items} products={products} onChange={(items) => setForm({ ...form, items })} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Invoice' : 'Create Invoice'}</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Invoice Details" data={viewItem} fields={[
        { label: 'Invoice Number', accessor: 'invoiceNumber' },
        { label: 'Type', accessor: 'type', type: 'badge' },
        { label: 'Outlet', accessor: 'outlet.name' },
        { label: 'Sales Rep', accessor: 'salesRep.name' },
        { label: 'GSTIN', accessor: 'gstin' },
        { label: 'Subtotal', accessor: 'subtotal', type: 'currency' },
        { label: 'CGST', accessor: 'cgstTotal', type: 'currency' },
        { label: 'SGST', accessor: 'sgstTotal', type: 'currency' },
        { label: 'Grand Total', accessor: 'grandTotal', type: 'currency' },
        { label: 'Paid Amount', accessor: 'paidAmount', type: 'currency' },
        { label: 'Balance Due', accessor: 'balanceDue', type: 'currency' },
        { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Print Format', accessor: 'printFormat' },
        { label: 'Tally Synced', accessor: 'tallySynced', type: 'boolean' },
        { label: 'Invoice Date', accessor: 'invoiceDate', type: 'date' },
      ]}>
        <ItemsTable items={viewItem?.items} showGst />
      </DetailModal>
    </div>
  );
}
