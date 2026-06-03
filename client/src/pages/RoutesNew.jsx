import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Globe, Building2, MapPin } from 'lucide-react';
import api from '../api/axios';
import SlidePanel from '../components/common/SlidePanel';

// ─── REGIONS TAB ─────────────────────────────────────────────────
function RegionsTab() {
  const [regions, setRegions] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', states: '', notes: '' });

  const load = async () => { const { data } = await api.get('/route-management/regions'); setRegions(data); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', states: '', notes: '' }); setPanelOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r, states: r.states?.join(', ') || '' }); setPanelOpen(true); };

  const save = async () => {
    const payload = { ...form, states: form.states ? form.states.split(',').map(s => s.trim()).filter(Boolean) : [] };
    if (editing) await api.put(`/route-management/regions/${editing._id}`, payload);
    else await api.post('/route-management/regions', payload);
    setPanelOpen(false); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this region?')) return;
    await api.delete(`/route-management/regions/${id}`);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Region</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.length === 0 && <p className="text-[#9e9e9e] text-sm col-span-3 text-center py-10">No regions added yet</p>}
        {regions.map(r => (
          <div key={r._id} className="border border-[#e0e0e0] rounded-lg p-4 bg-white hover:shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-[#333]">{r.name}</p>
                {r.code && <p className="text-xs text-[#9e9e9e] font-mono">{r.code}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(r)} className="so-icon-btn"><Edit2 size={14} /></button>
                <button onClick={() => remove(r._id)} className="so-icon-btn text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            {r.states?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {r.states.map(s => <span key={s} className="so-badge so-badge-info text-xs">{s}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Region' : 'Add Region'}>
        <div className="space-y-3">
          <div><label className="so-label">Region Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. North India" /></div>
          <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="NI" /></div>
          <div><label className="so-label">States (comma-separated)</label><input className="so-input w-full" value={form.states} onChange={e => f('states', e.target.value)} placeholder="Delhi, Punjab, Haryana, UP" /></div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── CITIES TAB ──────────────────────────────────────────────────
function CitiesTab() {
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [regionFilter, setRegionFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', region: '', state: '', pincode: '' });

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      api.get('/route-management/cities', { params: { region: regionFilter || undefined } }),
      api.get('/route-management/regions'),
    ]);
    setCities(c.data); setRegions(r.data);
  }, [regionFilter]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name: '', region: regionFilter || '', state: '', pincode: '' }); setPanelOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, region: c.region?._id || '', state: c.state, pincode: c.pincode }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/route-management/cities/${editing._id}`, form);
    else await api.post('/route-management/cities', form);
    setPanelOpen(false); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="so-input w-48">
          <option value="">All Regions</option>
          {regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add City</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>City</th><th>Region</th><th>State</th><th>Pincode</th><th></th></tr></thead>
          <tbody>
            {cities.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No cities added</td></tr>}
            {cities.map(c => (
              <tr key={c._id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.region?.name || '—'}</td>
                <td>{c.state || '—'}</td>
                <td className="font-mono text-xs">{c.pincode || '—'}</td>
                <td><button onClick={() => openEdit(c)} className="so-icon-btn"><Edit2 size={14} /></button></td>
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
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── AREAS TAB ───────────────────────────────────────────────────
function AreasTab() {
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', city: '', region: '', pincode: '' });

  const load = useCallback(async () => {
    const [a, c, r] = await Promise.all([
      api.get('/route-management/areas', { params: { city: cityFilter || undefined } }),
      api.get('/route-management/cities'),
      api.get('/route-management/regions'),
    ]);
    setAreas(a.data); setCities(c.data); setRegions(r.data);
  }, [cityFilter]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name: '', city: cityFilter || '', region: '', pincode: '' }); setPanelOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ name: a.name, city: a.city?._id || '', region: a.region?._id || '', pincode: a.pincode }); setPanelOpen(true); };

  const save = async () => {
    if (editing) await api.put(`/route-management/areas/${editing._id}`, form);
    else await api.post('/route-management/areas', form);
    setPanelOpen(false); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="so-input w-48">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Area</button>
      </div>
      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Area</th><th>City</th><th>Region</th><th>Pincode</th><th></th></tr></thead>
          <tbody>
            {areas.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#9e9e9e]">No areas added</td></tr>}
            {areas.map(a => (
              <tr key={a._id}>
                <td className="font-medium">{a.name}</td>
                <td>{a.city?.name || '—'}</td>
                <td>{a.region?.name || '—'}</td>
                <td className="font-mono text-xs">{a.pincode || '—'}</td>
                <td><button onClick={() => openEdit(a)} className="so-icon-btn"><Edit2 size={14} /></button></td>
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
          <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
const TABS = [
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'cities', label: 'Cities', icon: Building2 },
  { id: 'areas', label: 'Areas', icon: MapPin },
];

export default function RoutesNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathToTab = { '/app/routes/cities': 'cities', '/app/routes/areas': 'areas' };
  const tabToPath = { regions: '/app/routes/regions', cities: '/app/routes/cities', areas: '/app/routes/areas' };
  const [tab, setTab] = useState(pathToTab[location.pathname] || 'regions');
  const switchTab = (id) => { setTab(id); navigate(tabToPath[id]); };
  return (
    <div className="so-page">
      <div className="so-page-header">
        <h1 className="so-page-title">Routes</h1>
      </div>
      <div className="flex border-b border-[#e0e0e0] mb-5 gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-[#1e88e5] text-[#1e88e5]' : 'border-transparent text-[#616161] hover:text-[#333]'}`}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>
      {tab === 'regions' && <RegionsTab />}
      {tab === 'cities' && <CitiesTab />}
      {tab === 'areas' && <AreasTab />}
    </div>
  );
}
