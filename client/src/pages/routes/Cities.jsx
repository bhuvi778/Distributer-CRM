import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

export default function Cities() {
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', region: '', state: '', pincode: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([api.get('/route-management/cities', { params: { region: regionFilter || undefined } }), api.get('/route-management/regions')]);
      setCities(c.data); setRegions(r.data);
    } finally { setLoading(false); }
  }, [regionFilter]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, region: regionFilter || '' }); setPanelOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, region: c.region?._id || '', state: c.state || '', pincode: c.pincode || '' }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/route-management/cities/${editing._id}`, form);
      else await api.post('/route-management/cities', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-base font-semibold text-[#333]">Cities</h1><p className="text-xs text-[#757575] mt-0.5">Add cities within your regions for route planning</p></div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add City</button>
      </div>
      <div className="mb-4">
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="so-input w-52">
          <option value="">All Regions</option>
          {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>City Name</th><th>Region</th><th>State</th><th>Pincode</th><th className="w-12"></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && cities.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No cities added yet</td></tr>}
            {cities.map(c => (
              <tr key={c._id}>
                <td className="font-medium text-[#333]">{c.name}</td>
                <td>{c.region?.name || '—'}</td>
                <td>{c.state || '—'}</td>
                <td><span className="font-mono text-xs">{c.pincode || '—'}</span></td>
                <td><button onClick={() => openEdit(c)} className="so-icon-btn"><Edit2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit City' : 'Add City'}>
        <div className="space-y-3">
          <div><label className="so-label">City Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="New Delhi" /></div>
          <div><label className="so-label">Region *</label>
            <select className="so-input w-full" value={form.region} onChange={e => f('region', e.target.value)}>
              <option value="">Select Region</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div><label className="so-label">State</label><input className="so-input w-full" value={form.state} onChange={e => f('state', e.target.value)} placeholder="Delhi" /></div>
          <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.pincode} onChange={e => f('pincode', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save City</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
