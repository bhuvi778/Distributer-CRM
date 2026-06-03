import { useState, useEffect } from 'react';
import { Search, Eye, DollarSign, CreditCard, Receipt, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/helpers';
import DetailModal from '../components/common/DetailModal';

export default function RetailerDues() {
  const [outlets, setOutlets] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [outletInvoices, setOutletInvoices] = useState([]);
  const [outletPayments, setOutletPayments] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [outletsRes, invoicesRes, paymentsRes] = await Promise.all([
        api.get('/outlets'),
        api.get('/invoices'),
        api.get('/payments'),
      ]);
      setOutlets(outletsRes.data);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredOutlets = outlets.filter((o) => {
    if (!o.outstandingBalance || o.outstandingBalance <= 0) return false;
    return o.name?.toLowerCase().includes(search.toLowerCase()) ||
           o.code?.toLowerCase().includes(search.toLowerCase()) ||
           o.phone?.includes(search);
  });

  const totalDues = filteredOutlets.reduce((sum, o) => sum + (o.outstandingBalance || 0), 0);

  const handleViewDues = async (outlet) => {
    setSelectedOutlet(outlet);
    const relatedInvoices = invoices.filter((inv) => {
      const outletId = inv.outlet?._id || inv.outlet;
      return outletId === outlet._id && inv.balanceDue > 0;
    });
    const relatedPayments = payments.filter((pay) => {
      const outletId = pay.outlet?._id || pay.outlet;
      return outletId === outlet._id;
    });
    setOutletInvoices(relatedInvoices);
    setOutletPayments(relatedPayments);
    setDetailModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Retailer Dues</h1>
          <p className="text-surface-800/60 mt-1">Check outstanding balances and transaction history</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={20} className="text-red-500" />
          <div>
            <p className="text-xs text-red-600 font-medium">Total Outstanding</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(totalDues)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or phone..."
              className="input-field !pl-9 !py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Retailer</th>
                <th className="table-header">Code</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Outstanding</th>
                <th className="table-header">Credit Limit</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8 text-surface-800/40">Loading...</td>
                </tr>
              ) : filteredOutlets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8 text-surface-800/40">No retailers with outstanding balance</td>
                </tr>
              ) : (
                filteredOutlets.map((outlet) => (
                  <tr key={outlet._id} className="hover:bg-surface-50/50">
                    <td className="table-cell font-medium">{outlet.name}</td>
                    <td className="table-cell text-surface-800/60">{outlet.code || '-'}</td>
                    <td className="table-cell">{outlet.phone || '-'}</td>
                    <td className="table-cell">
                      <span className="text-red-600 font-semibold">{formatCurrency(outlet.outstandingBalance || 0)}</span>
                    </td>
                    <td className="table-cell text-surface-800/60">{formatCurrency(outlet.creditLimit || 0)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleViewDues(outlet)}
                        className="btn-secondary !py-1.5 !px-3 text-xs"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Dues: ${selectedOutlet?.name || ''}`}
        size="xl"
      >
        {selectedOutlet && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600 mb-1">Outstanding</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(selectedOutlet.outstandingBalance || 0)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 mb-1">Credit Limit</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(selectedOutlet.creditLimit || 0)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Pending Invoices</p>
                <p className="text-lg font-bold text-blue-700">{outletInvoices.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 mb-1">Total Payments</p>
                <p className="text-lg font-bold text-purple-700">{outletPayments.length}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={18} className="text-brand-500" />
                <h3 className="font-semibold">Pending Invoices</h3>
              </div>
              {outletInvoices.length === 0 ? (
                <p className="text-sm text-surface-800/40 py-4 text-center">No pending invoices</p>
              ) : (
                <div className="overflow-x-auto border border-surface-200 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-surface-50/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Invoice #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-surface-800/60">Total</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-surface-800/60">Paid</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-surface-800/60">Balance</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {outletInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="px-3 py-2 text-sm font-mono">{inv.invoiceNumber}</td>
                          <td className="px-3 py-2 text-sm">{formatDate(inv.invoiceDate)}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(inv.grandTotal)}</td>
                          <td className="px-3 py-2 text-sm text-right text-green-600">{formatCurrency(inv.paidAmount)}</td>
                          <td className="px-3 py-2 text-sm text-right text-red-600 font-semibold">{formatCurrency(inv.balanceDue)}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              inv.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-brand-500" />
                <h3 className="font-semibold">Recent Payments</h3>
              </div>
              {outletPayments.length === 0 ? (
                <p className="text-sm text-surface-800/40 py-4 text-center">No payments recorded</p>
              ) : (
                <div className="overflow-x-auto border border-surface-200 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-surface-50/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Payment #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-surface-800/60">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Mode</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-800/60">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {outletPayments.slice(0, 10).map((pay) => (
                        <tr key={pay._id}>
                          <td className="px-3 py-2 text-sm font-mono">{pay.paymentNumber}</td>
                          <td className="px-3 py-2 text-sm">{formatDate(pay.paymentDate)}</td>
                          <td className="px-3 py-2 text-sm text-right text-green-600 font-semibold">{formatCurrency(pay.amount)}</td>
                          <td className="px-3 py-2 text-sm capitalize">{pay.mode}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              pay.status === 'approved' ? 'bg-green-100 text-green-700' :
                              pay.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}