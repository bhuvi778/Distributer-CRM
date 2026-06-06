import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Download, Upload, X } from 'lucide-react';
import api from '../../api/axios';

function Modal({ editing, regions, onClose, onSave }) {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, region: editing.region?._id || editing.region || '', state: editing.state || '', pincode: editing.pincode || '' }
      : { name: '', region: '', state: '', pincode: '' }
  );
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-fill state from selected region
  const handleRegionChange = (id) => {
    const r = regions.find(x => x._id === id);
    f('region', id);
    if (r?.states?.[0] && !form.state) f('state', r.states[0]);
  };

  const save = async () => {
    if (!form.name)   return alert('City name is required');
    if (!form.region) return alert('Region is required');
    setSaving(true);
    try {
      if (editing) await api.put(`/route-management/cities/${editing._id}`, form);
      else         await api.post('/route-management/cities', form);
      onSave();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <h3 className="text-sm font-semibold text-[#333]">{editing ? 'Edit City' : 'Create City'}</h3>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#333]"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="so-label">Region *</label>
            <select className="so-input w-full" value={form.region} onChange={e => handleRegionChange(e.target.value)}>
              <option value="">Select Region</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="so-label">City Name *</label>
            <input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Lucknow" autoFocus />
          </div>
          <div>
            <label className="so-label">State</label>
            <input className="so-input w-full" value={form.state} onChange={e => f('state', e.target.value)} placeholder="e.g. Uttar Pradesh" />
          </div>
          <div>
            <label className="so-label">Pincode</label>
            <input className="so-input w-full" value={form.pincode} onChange={e => f('pincode', e.target.value)} placeholder="226001" />
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

export default function Cities() {
  const [cities,      setCities]      = useState([]);
  const [regions,     setRegions]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [regionFilter,setRegionFilter]= useState('');
  const [modal,       setModal]       = useState(false);
  const [editing,     setEditing]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        api.get('/route-management/cities', { params: { region: regionFilter || undefined } }),
        api.get('/route-management/regions'),
      ]);
      setCities(c.data); setRegions(r.data);
    } finally { setLoading(false); }
  }, [regionFilter]);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setModal(true); };
  const openEdit = (c) => { setEditing(c); setModal(true); };
  const remove   = async (id) => { if (!confirm('Delete city?')) return; await api.delete(`/route-management/cities/${id}`); load(); };

  const displayed = cities.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Cities</h1>
        <div className="flex gap-2">
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs"><Download size={13} /> Export</button>
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs"><Upload size={13} /> Import</button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} /> New</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="so-input w-44 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="so-input w-40 text-xs">
          <option value="">All Regions</option>
          {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#9e9e9e]">{displayed.length} cities</span>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-12">S.No</th>
              <th>City Name</th>
              <th>Region</th>
              <th>State</th>
              <th>Pincode</th>
              <th className="w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-[#9e9e9e]">
                No cities yet. <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button>
              </td></tr>
            )}
            {displayed.map((c, idx) => (
              <tr key={c._id}>
                <td className="text-[#9e9e9e] text-center">{idx + 1}</td>
                <td className="font-medium text-[#333]">{c.name}</td>
                <td>{c.region?.name || '—'}</td>
                <td>{c.state || '—'}</td>
                <td><span className="font-mono text-xs">{c.pincode || '—'}</span></td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => openEdit(c)} className="so-icon-btn w-7 h-7"><Edit2 size={12} /></button>
                    <button onClick={() => remove(c._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50"><Trash2 size={12} /></button>
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
          regions={regions}
          onClose={() => { setModal(false); setEditing(null); }}
          onSave={() => { setModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
