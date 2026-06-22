import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useMasterData, { invalidateMasterData } from '../hooks/useMasterData';
import SlidePanel from '../components/common/SlidePanel';
import { formatCurrency } from '../utils/helpers';

const PAGE_SIZE = 30;
const todayText = '22/06/2026';
const dateRange = '22/06/2026 - 22/06/2026';

const modeOptions = [
  ['cash', 'Cash'],
  ['upi', 'UPI'],
  ['cheque', 'Cheque'],
  ['bank_transfer', 'Bank Transfer'],
  ['card', 'Card'],
];

const emptyForm = (paymentType) => ({
  partyType: paymentType === 'out' ? 'Supplier' : 'Customer',
  paymentNumber: '',
  partyName: '',
  party: '',
  outlet: '',
  collectedBy: '',
  paymentDate: todayText,
  mode: 'cash',
  comments: '',
  attachment: null,
  otherPayment: 0,
  discount: 0,
});

const displayRange = (count, page) => {
  if (!count) return '1 - 0 of 0';
  const start = (page - 1) * PAGE_SIZE + 1;
  return `${start} - ${Math.min(page * PAGE_SIZE, count)} of ${count}`;
};

const getPartyName = (payment, isOut) => (
  isOut
    ? payment.party?.name || payment.paidToName || payment.outlet?.name || '-'
    : payment.outlet?.name || payment.party?.name || payment.paidToName || '-'
);

function PaymentPanel({ open, onClose, isOut, form, setForm, users, onSave, saving }) {
  const fileRef = useRef(null);
  const amount = Math.max(0, Number(form.otherPayment || 0) - Number(form.discount || 0));

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Create payment"
      width="w-[750px]"
      hideClose
      bodyClassName="p-0 flex flex-col"
      headerActions={(
        <>
          <button type="button" onClick={onSave} disabled={saving} className="so-btn-primary text-sm min-w-[82px]">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onClose} className="text-sm px-3">Cancel</button>
        </>
      )}
    >
      <div className="flex-1 overflow-y-auto px-9 py-7">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="so-label text-base">Party Type</label>
            <select className="so-input so-select w-full" value={form.partyType} onChange={(event) => set('partyType', event.target.value)}>
              {isOut ? (
                <>
                  <option>Supplier</option>
                  <option>Customer</option>
                  <option>Distributor</option>
                  <option>Employee</option>
                </>
              ) : (
                <>
                  <option>Customer</option>
                  <option>Distributor</option>
                  <option>Super Stocker</option>
                  <option>Supplier</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="so-label text-base">Payment No.</label>
            <input className="so-input w-full" value={form.paymentNumber} onChange={(event) => set('paymentNumber', event.target.value)} placeholder="Enter payment number" />
          </div>

          <div>
            <label className="so-label text-base">Party name</label>
            <input className="so-input w-full" value={form.partyName} onChange={(event) => set('partyName', event.target.value)} placeholder="Enter party name" />
          </div>
          <div>
            <label className="so-label text-base">Collected By</label>
            <select className="so-input so-select w-full" value={form.collectedBy} onChange={(event) => set('collectedBy', event.target.value)}>
              <option value="">Select User</option>
              {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
            </select>
          </div>

          <div>
            <label className="so-label text-base">Payment date</label>
            <input className="so-input w-full" value={form.paymentDate} onChange={(event) => set('paymentDate', event.target.value)} />
          </div>
          <div>
            <label className="so-label text-base">Payment type</label>
            <select className="so-input so-select w-full" value={form.mode} onChange={(event) => set('mode', event.target.value)}>
              {modeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label className="so-label text-base">Comment</label>
            <textarea className="so-input w-full min-h-[64px]" value={form.comments} onChange={(event) => set('comments', event.target.value)} placeholder="Comment" />
          </div>
          <div>
            <label className="so-label text-base">Attachment</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="h-[80px] w-[86px] border border-dashed border-[#d7dce5] bg-white text-[#333] text-xl">+</button>
            <div className="text-base mt-1">Upload</div>
            <input ref={fileRef} type="file" className="hidden" onChange={(event) => set('attachment', event.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="border-t border-[#eceff4] mt-16 pt-7 space-y-3">
          <div className="grid grid-cols-[1fr_200px] items-center gap-6">
            <label className="text-right text-base text-[#2b2f36]">Other Payment</label>
            <input type="number" className="so-input w-full" value={form.otherPayment} onChange={(event) => set('otherPayment', event.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_200px] items-center gap-6">
            <label className="text-right text-base text-[#2b2f36]">Discount (-)</label>
            <input type="number" className="so-input w-full" value={form.discount} onChange={(event) => set('discount', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="border-t border-[#eceff4] px-9 py-6">
        <div className="flex items-center justify-end gap-10 text-base">
          <span className="font-semibold">Payment amount</span>
          <span>₹</span>
          <span className="min-w-[32px] text-right font-semibold">{amount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </SlidePanel>
  );
}

export default function Payments({ forcedType }) {
  const { user } = useAuth();
  const location = useLocation();
  const paymentType = forcedType || (location.pathname.includes('/out') ? 'out' : 'in');
  const isOut = paymentType === 'out';
  const title = isOut ? 'Payment Out' : 'Payment In';
  const { users } = useMasterData();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm(paymentType));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments', { params: { paymentType } });
      setPayments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [paymentType]);

  useEffect(() => {
    fetchData();
    setForm(emptyForm(paymentType));
    setPanelOpen(false);
    setPage(1);
  }, [fetchData, paymentType]);

  useEffect(() => { setPage(1); }, [search, status, mode, userFilter]);

  const filtered = useMemo(() => payments.filter((payment) => {
    const blob = JSON.stringify(payment).toLowerCase();
    const matchesSearch = !search || blob.includes(search.toLowerCase());
    const matchesStatus = !status || payment.status === status;
    const matchesMode = !mode || payment.mode === mode;
    const matchesUser = !userFilter || payment.collectedBy?.name === userFilter;
    return matchesSearch && matchesStatus && matchesMode && matchesUser;
  }), [payments, search, status, mode, userFilter]);

  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const total = filtered.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const usersForFilter = [...new Set(payments.map((payment) => payment.collectedBy?.name).filter(Boolean))];

  const openCreate = () => {
    setForm({ ...emptyForm(paymentType), collectedBy: user?._id || '' });
    setPanelOpen(true);
  };

  const save = async () => {
    const amount = Math.max(0, Number(form.otherPayment || 0) - Number(form.discount || 0));
    if (!form.partyName.trim()) return alert('Party name is required');
    if (amount <= 0) return alert('Payment amount is required');

    const payload = {
      paymentType,
      paidToName: form.partyName.trim(),
      amount,
      mode: form.mode,
      referenceNo: form.paymentNumber,
      notes: form.comments,
      status: 'approved',
      collectedBy: form.collectedBy || user?._id,
    };

    setSaving(true);
    try {
      await api.post('/payments', payload);
      setPanelOpen(false);
      invalidateMasterData();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="so-titlebar">
        <h1 className="so-title">{title}</h1>
        <div className="so-actions">
          <span className="h-7 px-3 rounded-[2px] bg-[#1687d9] text-white text-sm flex items-center">Total : ₹ {total.toLocaleString('en-IN')}</span>
          <button type="button" onClick={openCreate} className="so-btn-primary text-sm">Create {title}</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={fetchData}><Search size={18} /></button>
        </div>
        <input className="so-input w-[240px]" value={dateRange} readOnly />
        <select className="so-input so-select w-[240px]" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Select Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="so-input so-select w-[240px]" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="">Select Type</option>
          {modeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="so-input so-select w-[240px]" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
          <option value="">Select User</option>
          {usersForFilter.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2 text-sm text-[#111827]">
          <span>{displayRange(filtered.length, page)}</span>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronLeft size={14} /></button>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>Sorry! No payments found.</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr>
                <th>Payment No.</th>
                <th>Party</th>
                <th>Payment Type</th>
                <th>Created By</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((payment) => (
                <tr key={payment._id}>
                  <td className="font-mono text-xs text-[#174bb8]">{payment.paymentNumber}</td>
                  <td>{getPartyName(payment, isOut)}</td>
                  <td className="capitalize">{payment.mode?.replace('_', ' ') || '-'}</td>
                  <td>{payment.collectedBy?.name || '-'}</td>
                  <td><span className="so-badge so-badge-info capitalize">{payment.status || 'approved'}</span></td>
                  <td className="text-right font-medium">{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaymentPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        isOut={isOut}
        form={form}
        setForm={setForm}
        users={users || []}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}
