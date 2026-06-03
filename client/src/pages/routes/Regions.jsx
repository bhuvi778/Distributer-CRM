import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', code: '', states: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => { setLoading(true); try { const { data } = await api.get('/route-management/regions'); setRegions(data); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, code: r.code || '', states: r.states?.join(', ') || '', notes: r.notes || '' }); setPanelOpen(true); };

  const save = async () => {
    const payload = { ...form, states: form.states ? form.states.split(',').map(s => s.trim()).filter(Boolean) : [] };
    try {
      if (editing) await api.put(`/route-management/regions/${editing._id}`, payload);
      else await api.post('/route-management/regions', payload);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const remove = async (id) => { if (!confirm('Delete region?')) return; await api.delete(`/route-management/regions/${id}`); load(); };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-base font-semibold text-[#333]">Regions</h1><p className="text-xs text-[#757575] mt-0.5">Define Pan-India regions and the states they cover</p></div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Region</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Region Name</th>
              <th>Code</th>
              <th>States Covered</th>
              <th>Notes</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && regions.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No regions yet. Click "Add Region" to create one.</td></tr>
            )}
            {regions.map(r => (
              <tr key={r._id}>
                <td className="font-medium text-[#333]">{r.name}</td>
                <td><span className="font-mono text-xs">{r.code || '—'}</span></td>
                <td>
                  {r.states?.length > 0
                    ? <div className="flex flex-wrap gap-1">{r.states.map(s => <span key={s} className="so-badge so-badge-info">{s}</span>)}</div>
                    : <span className="text-[#9e9e9e]">—</span>
                  }
                </td>
                <td className="text-[#757575]">{r.notes || '—'}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="so-icon-btn"><Edit2 size={13} /></button>
                    <button onClick={() => remove(r._id)} className="so-icon-btn text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Region' : 'Add Region'}>
        <div className="space-y-3">
          <div><label className="so-label">Region Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="North India" /></div>
          <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="NI" /></div>
          <div><label className="so-label">States (comma-separated)</label><input className="so-input w-full" value={form.states} onChange={e => f('states', e.target.value)} placeholder="Delhi, Punjab, Haryana, UP" /></div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Region</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
