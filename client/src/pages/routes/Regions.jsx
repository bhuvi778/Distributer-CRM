import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Download, Upload, X } from 'lucide-react';
import api from '../../api/axios';

function Modal({ editing, onClose, onSave }) {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, code: editing.code || '', states: editing.states?.join(', ') || '', notes: editing.notes || '' }
      : { name: '', code: '', states: '', notes: '' }
  );
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) return alert('Region name is required');
    setSaving(true);
    try {
      const payload = { ...form, states: form.states ? form.states.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (editing) await api.put(`/route-management/regions/${editing._id}`, payload);
      else         await api.post('/route-management/regions', payload);
      onSave();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <h3 className="text-sm font-semibold text-[#333]">{editing ? 'Edit Region' : 'Create Region'}</h3>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#333]"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="so-label">Region Name *</label>
            <input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. North India" autoFocus />
          </div>
          <div>
            <label className="so-label">Code</label>
            <input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="e.g. NI" />
          </div>
          <div>
            <label className="so-label">States (comma-separated)</label>
            <input className="so-input w-full" value={form.states} onChange={e => f('states', e.target.value)} placeholder="Delhi, Punjab, Haryana, UP" />
          </div>
          <div>
            <label className="so-label">Notes</label>
            <textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} />
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

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/route-management/regions'); setRegions(data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setModal(true); };
  const openEdit = (r) => { setEditing(r); setModal(true); };
  const remove   = async (id) => { if (!confirm('Delete region?')) return; await api.delete(`/route-management/regions/${id}`); load(); };

  const displayed = regions.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Regions</h1>
        <div className="flex gap-2">
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs"><Download size={13} /> Export</button>
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs"><Upload size={13} /> Import</button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} /> New</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="so-input w-44 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <span className="ml-auto text-xs text-[#9e9e9e]">{displayed.length} regions</span>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-12">S.No</th>
              <th>Region Name</th>
              <th>Code</th>
              <th>States Covered</th>
              <th>Notes</th>
              <th className="w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-[#9e9e9e]">
                No regions yet. <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button>
              </td></tr>
            )}
            {displayed.map((r, idx) => (
              <tr key={r._id}>
                <td className="text-[#9e9e9e] text-center">{idx + 1}</td>
                <td className="font-medium text-[#333]">{r.name}</td>
                <td><span className="font-mono text-xs">{r.code || '—'}</span></td>
                <td>
                  {r.states?.length > 0
                    ? <div className="flex flex-wrap gap-1">{r.states.map(s => <span key={s} className="so-badge so-badge-info">{s}</span>)}</div>
                    : <span className="text-[#9e9e9e]">—</span>}
                </td>
                <td className="text-[#757575] text-xs">{r.notes || '—'}</td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => openEdit(r)} className="so-icon-btn w-7 h-7"><Edit2 size={12} /></button>
                    <button onClick={() => remove(r._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          editing={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSave={() => { setModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
