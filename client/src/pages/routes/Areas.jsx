import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const emptyForm = { name: '', city: '', region: '', pincode: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, r] = await Promise.all([
        api.get('/route-management/areas', { params: { city: cityFilter || undefined } }),
        api.get('/route-management/cities'),
        api.get('/route-management/regions'),
      ]);
      setAreas(a.data); setCities(c.data); setRegions(r.data);
    } finally { setLoading(false); }
  }, [cityFilter]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, city: cityFilter || '' }); setPanelOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ name: a.name, city: a.city?._id || '', region: a.region?._id || '', pincode: a.pincode || '' }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/route-management/areas/${editing._id}`, form);
      else await api.post('/route-management/areas', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-base font-semibold text-[#333]">Areas</h1><p className="text-xs text-[#757575] mt-0.5">Define delivery areas within cities for precise route management</p></div>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Area</button>
      </div>
      <div className="mb-4">
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="so-input w-52">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Area Name</th><th>City</th><th>Region</th><th>Pincode</th><th className="w-12"></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>}
            {!loading && areas.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No areas added yet</td></tr>}
            {areas.map(a => (
              <tr key={a._id}>
                <td className="font-medium text-[#333]">{a.name}</td>
                <td>{a.city?.name || '—'}</td>
                <td>{a.region?.name || '—'}</td>
                <td><span className="font-mono text-xs">{a.pincode || '—'}</span></td>
                <td><button onClick={() => openEdit(a)} className="so-icon-btn"><Edit2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Area' : 'Add Area'}>
        <div className="space-y-3">
          <div><label className="so-label">Area Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Connaught Place" /></div>
          <div><label className="so-label">City *</label>
            <select className="so-input w-full" value={form.city} onChange={e => f('city', e.target.value)}>
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="so-label">Region</label>
            <select className="so-input w-full" value={form.region} onChange={e => f('region', e.target.value)}>
              <option value="">Select Region</option>
              {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.pincode} onChange={e => f('pincode', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Area</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
