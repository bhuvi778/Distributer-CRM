import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import Modal from './Modal';
import Badge from './Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function DataPage({
  title, subtitle, endpoint, columns, formFields, defaultForm = {},
  renderActions, onCreate, formatRow,
}) {
  const writeEndpoint = endpoint.split('?')[0];
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(endpoint);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [endpoint]);

  const filtered = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (onCreate && !editItem) {
        await onCreate(form);
      } else if (editItem) {
        await api.put(`${writeEndpoint}/${editItem._id}`, form);
      } else {
        await api.post(writeEndpoint, form);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    await api.delete(`${writeEndpoint}/${id}`);
    fetchData();
  };

  const renderCell = (col, row) => {
    const val = col.accessor.split('.').reduce((o, k) => o?.[k], row);
    if (col.render) return col.render(val, row);
    if (col.type === 'currency') return formatCurrency(val);
    if (col.type === 'date') return formatDate(val);
    if (col.type === 'badge') return <Badge status={val} />;
    if (col.type === 'boolean') return val ? '✓' : '✗';
    return val ?? '-';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-surface-800/60 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary !px-3">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="input-field !pl-9 !py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="table-header">{col.label}</th>
                ))}
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="table-cell text-center py-12 text-surface-800/40">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="table-cell text-center py-12 text-surface-800/40">No data found</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="hover:bg-surface-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="table-cell">{renderCell(col, row)}</td>
                  ))}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      {renderActions?.(row, fetchData)}
                      <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit' : 'Create New'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formFields.map((field) => (
              <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="input-field"
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="input-field min-h-[80px]"
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="input-field"
                    required={field.required}
                    step={field.step}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
