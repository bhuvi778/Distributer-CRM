import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Download } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/helpers';
import { exportToExcel } from '../utils/exportExcel';

// ── Expense categories ────────────────────────────────────────────
const CATEGORIES = [
  'Travel', 'Food & Beverage', 'Fuel', 'Accommodation',
  'Communication', 'Office Supplies', 'Marketing', 'Maintenance', 'Other',
];

const STATUS_COLORS = {
  pending:  'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

// ── Center Modal ─────────────────────────────────────────────────
function ExpenseModal({ editing, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(
    editing
      ? { ...editing, date: editing.date?.slice(0, 10) || today }
      : { title: '', category: 'Travel', amount: '', date: today, description: '', status: 'pending' }
  );
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title)  return alert('Title is required');
    if (!form.amount) return alert('Amount is required');
    setSaving(true);
    try {
      if (editing) await api.put(`/expenses/${editing._id}`, form);
      else         await api.post('/expenses', form);
      onSave();
    } catch (e) { alert(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <h3 className="text-sm font-semibold text-[#333]">{editing ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#333]"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="so-label">Title *</label>
            <input className="so-input w-full" value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Fuel for delivery" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="so-label">Category</label>
              <select className="so-input w-full" value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">Amount (₹) *</label>
              <input type="number" className="so-input w-full" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0.00" min="0" />
            </div>
            <div>
              <label className="so-label">Date</label>
              <input type="date" className="so-input w-full" value={form.date} onChange={e => f('date', e.target.value)} />
            </div>
            <div>
              <label className="so-label">Status</label>
              <select className="so-input w-full" value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div>
            <label className="so-label">Description</label>
            <textarea className="so-input w-full" rows={2} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Additional details…" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#e0e0e0]">
          <button onClick={onClose} className="so-btn-secondary px-6">Cancel</button>
          <button onClick={save} disabled={saving} className="so-btn-primary px-6">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data);
    } catch {
      // Expenses module may not have API yet — show empty
      setExpenses([]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setModal(true); };
  const openEdit = (e) => { setEditing(e); setModal(true); };
  const remove   = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); load(); }
    catch { setExpenses(p => p.filter(e => e._id !== id)); }
  };

  const displayed = expenses.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalAmt = displayed.reduce((s, e) => s + Number(e.amount || 0), 0);

  const EXPORT_COLS = [
    { key: 'title',    label: 'Title',    accessor: 'title' },
    { key: 'category', label: 'Category', accessor: 'category' },
    { key: 'amount',   label: 'Amount',   accessor: 'amount' },
    { key: 'date',     label: 'Date',     accessor: 'date', renderExport: v => formatDate(v) },
    { key: 'status',   label: 'Status',   accessor: 'status' },
  ];

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Expenses</h1>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel(displayed, 'expenses', EXPORT_COLS)} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-3">
          <p className="text-xs text-[#9e9e9e]">Total Expenses</p>
          <p className="text-lg font-bold text-[#333] mt-0.5">{formatCurrency(totalAmt)}</p>
        </div>
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-3">
          <p className="text-xs text-[#9e9e9e]">Pending</p>
          <p className="text-lg font-bold text-yellow-600 mt-0.5">
            {formatCurrency(displayed.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount || 0), 0))}
          </p>
        </div>
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-3">
          <p className="text-xs text-[#9e9e9e]">Approved</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">
            {formatCurrency(displayed.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="so-input w-44 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="so-input w-40 text-xs">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#9e9e9e] self-center">{displayed.length} records</span>
      </div>

      {/* Table */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-10">S.No</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th className="w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">
                No expenses yet. <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button>
              </td></tr>
            )}
            {displayed.map((e, idx) => (
              <tr key={e._id}>
                <td className="text-[#9e9e9e] text-center">{idx + 1}</td>
                <td>
                  <p className="font-medium text-[#333]">{e.title}</p>
                  {e.description && <p className="text-xs text-[#9e9e9e]">{e.description}</p>}
                </td>
                <td>
                  <span className="so-badge so-badge-info">{e.category}</span>
                </td>
                <td className="font-semibold text-[#333]">{formatCurrency(e.amount)}</td>
                <td className="text-xs text-[#757575]">{formatDate(e.date)}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${STATUS_COLORS[e.status] || ''}`}>
                    {e.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => openEdit(e)} className="so-icon-btn w-7 h-7"><Edit2 size={12} /></button>
                    <button onClick={() => remove(e._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ExpenseModal
          editing={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSave={() => { setModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
