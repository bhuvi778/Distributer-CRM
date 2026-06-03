import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, Check, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMasterData, { invalidateMasterData } from '../hooks/useMasterData';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import DetailModal from '../components/common/DetailModal';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency, formatDate, formatDateTime } from '../utils/helpers';

const DESCRIPTION = 'Collect invoice-wise partial or full payments on the go. Select outlet, link to invoice, enter amount & payment mode. Manager can approve/reject pending payments to adjust customer outstanding balance.';

const EXPORT_COLS = [
  { key: 'paymentNumber', label: 'Payment #', accessor: 'paymentNumber' },
  { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
  { key: 'invoice', label: 'Invoice #', accessor: 'invoice.invoiceNumber' },
  { key: 'amount', label: 'Amount', accessor: 'amount' },
  { key: 'mode', label: 'Mode', accessor: 'mode' },
  { key: 'collectedBy', label: 'Collected By', accessor: 'collectedBy.name' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'reference', label: 'Reference', accessor: 'referenceNo' },
  { key: 'date', label: 'Date', accessor: 'paymentDate', renderExport: (v) => formatDate(v) },
];

const emptyForm = () => ({
  outlet: '', invoice: '', amount: '', mode: 'cash', referenceNo: '', notes: '', status: 'pending', isPartial: false,
});

export default function Payments() {
  const { user, can } = useAuth();
  const { outlets, invoices, loading: mdLoading } = useMasterData();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get('/payments');
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = payments.filter((p) => JSON.stringify(p).toLowerCase().includes(search.toLowerCase()));

  const outletInvoices = form.outlet
    ? invoices.filter((i) => (i.outlet?._id || i.outlet) === form.outlet)
    : invoices;

  const selectedInvoice = invoices.find((i) => i._id === form.invoice);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      outlet: item.outlet?._id || item.outlet || '',
      invoice: item.invoice?._id || item.invoice || '',
      amount: item.amount,
      mode: item.mode,
      referenceNo: item.referenceNo || '',
      notes: item.notes || '',
      status: item.status,
      isPartial: item.isPartial || false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.outlet) return alert('Please select an outlet');
    if (!form.amount || Number(form.amount) <= 0) return alert('Please enter valid amount');

    const payload = {
      outlet: form.outlet,
      invoice: form.invoice || undefined,
      amount: Number(form.amount),
      mode: form.mode,
      referenceNo: form.referenceNo,
      notes: form.notes,
      status: editItem ? form.status : 'pending',
      isPartial: form.isPartial,
      collectedBy: user?._id,
    };

    try {
      if (editItem) await api.put(`/payments/${editItem._id}`, payload);
      else await api.post('/payments', payload);
      setModalOpen(false);
      invalidateMasterData();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving payment');
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/payments/approve/${id}`, { status });
      invalidateMasterData();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    fetchData();
  };

  return (
    <div>
      <PageHeader
        title="Payment Collection"
        description={DESCRIPTION}
        onAdd={openCreate}
        onRefresh={fetchData}
        onExport={() => exportToExcel(filtered, 'payment_collections', EXPORT_COLS)}
        loading={loading}
        addLabel="Collect Payment"
      />

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payment #, outlet..." className="input-field !pl-9 !py-2" />
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg">Pending: {payments.filter(p => p.status === 'pending').length}</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg">Approved: {payments.filter(p => p.status === 'approved').length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Payment #</th>
                <th className="table-header">Outlet</th>
                <th className="table-header">Invoice</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Mode</th>
                <th className="table-header">Collected By</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-surface-800/40">No payments recorded. Click "Collect Payment" to add.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="hover:bg-surface-50/50">
                  <td className="table-cell font-mono font-medium">{row.paymentNumber}</td>
                  <td className="table-cell">{row.outlet?.name || '-'}</td>
                  <td className="table-cell font-mono text-sm">{row.invoice?.invoiceNumber || '-'}</td>
                  <td className="table-cell font-mono font-medium text-green-700">{formatCurrency(row.amount)}</td>
                  <td className="table-cell"><Badge status={row.mode} label={row.mode?.toUpperCase()} /></td>
                  <td className="table-cell">{row.collectedBy?.name || '-'}</td>
                  <td className="table-cell"><Badge status={row.status} /></td>
                  <td className="table-cell">{formatDate(row.paymentDate)}</td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewItem(row)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View"><Eye size={16} /></button>
                      {row.status === 'pending' && can('approvePayments') && (
                        <>
                          <button onClick={() => handleApprove(row._id, 'approved')} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg" title="Approve"><Check size={16} /></button>
                          <button onClick={() => handleApprove(row._id, 'rejected')} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg" title="Reject"><X size={16} /></button>
                        </>
                      )}
                      <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `Edit ${editItem.paymentNumber}` : 'Collect New Payment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
            <strong>How to collect:</strong> Select outlet → Choose invoice (optional) → Enter amount → Select payment mode (Cash/UPI/Cheque) → Submit for approval.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Outlet / Store *</label>
              <select value={form.outlet} onChange={(e) => setForm({ ...form, outlet: e.target.value, invoice: '' })} className="input-field" required>
                <option value="">Select outlet...</option>
                {outlets.map((o) => (
                  <option key={o._id} value={o._id}>{o.name} — Outstanding: ₹{o.outstandingBalance}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Link to Invoice</label>
              <select value={form.invoice} onChange={(e) => {
                const inv = invoices.find((i) => i._id === e.target.value);
                setForm({ ...form, invoice: e.target.value, amount: inv ? inv.balanceDue : form.amount });
              }} className="input-field">
                <option value="">Select invoice (optional)...</option>
                {outletInvoices.map((i) => (
                  <option key={i._id} value={i._id}>{i.invoiceNumber} — Due: ₹{i.balanceDue}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount (₹) *</label>
              <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" required />
              {selectedInvoice && (
                <p className="text-xs text-surface-800/50 mt-1">Invoice balance: {formatCurrency(selectedInvoice.balanceDue)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Mode *</label>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="input-field">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reference / UTR No</label>
              <input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} className="input-field" placeholder="UPI ref, cheque no..." />
            </div>
            {editItem && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Approval Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPartial} onChange={(e) => setForm({ ...form, isPartial: e.target.checked })} />
                Partial payment (remaining balance will stay on invoice)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Payment' : 'Submit Collection'}</button>
          </div>
        </form>
      </Modal>

      <DetailModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Payment Details" data={viewItem} fields={[
        { label: 'Payment Number', accessor: 'paymentNumber' },
        { label: 'Outlet', accessor: 'outlet.name' },
        { label: 'Invoice', accessor: 'invoice.invoiceNumber' },
        { label: 'Amount', accessor: 'amount', type: 'currency' },
        { label: 'Payment Mode', accessor: 'mode', type: 'badge' },
        { label: 'Collected By', accessor: 'collectedBy.name' },
        { label: 'Status', accessor: 'status', type: 'badge' },
        { label: 'Reference No', accessor: 'referenceNo' },
        { label: 'Partial Payment', accessor: 'isPartial', type: 'boolean' },
        { label: 'Payment Date', accessor: 'paymentDate', type: 'datetime' },
        { label: 'Notes', accessor: 'notes' },
      ]} />
    </div>
  );
}
