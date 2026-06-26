import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Search, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const DEFAULT_CITY_NAMES = [
  'New Delhi',
  'Gurugram',
  'Noida',
  'Mumbai',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
];

function RouteDialog({ title, children, onClose, onSave, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(624px,calc(100vw-32px))] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl">
        <div className="h-[68px] flex items-center justify-between px-5 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]">
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="px-5 py-7 min-h-[220px]">{children}</div>
        <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} disabled={saving} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function CityModal({ editing, regions, onClose, onSaved }) {
  const [form, setForm] = useState({
    region: editing?.region?._id || editing?.region || '',
    name: editing?.name || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.region) return alert('Region is required');
    if (!form.name.trim()) return alert('Name is required');
    setSaving(true);
    try {
      if (editing) await api.put(`/route-management/cities/${editing._id}`, form);
      else await api.post('/route-management/cities', form);
      onSaved();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving city');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteDialog title={editing ? 'Edit City' : 'Create City'} onClose={onClose} onSave={save} saving={saving}>
      <div className="space-y-4">
        <div>
          <label className="so-label text-base">Region<span className="text-red-500">*</span></label>
          <select className="so-input so-select w-[286px]" value={form.region} onChange={(event) => set('region', event.target.value)}>
            <option value="">Select Region</option>
            {regions.map((region) => <option key={region._id} value={region._id}>{region.name}</option>)}
          </select>
        </div>
        <div>
          <label className="so-label text-base">Name<span className="text-red-500">*</span></label>
          <input className="so-input w-full" list="city-options" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Name" autoFocus />
          <datalist id="city-options">{DEFAULT_CITY_NAMES.map((city) => <option key={city} value={city} />)}</datalist>
        </div>
      </div>
    </RouteDialog>
  );
}

export default function Cities() {
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [autoAdding, setAutoAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cityRes, regionRes] = await Promise.all([
        api.get('/route-management/cities', { params: { region: regionFilter || undefined } }),
        api.get('/route-management/regions'),
      ]);
      setCities(Array.isArray(cityRes.data) ? cityRes.data : []);
      setRegions(Array.isArray(regionRes.data) ? regionRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [regionFilter]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => (
    cities.filter((city) => !search || city.name?.toLowerCase().includes(search.toLowerCase()))
  ), [cities, search]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (city) => { setEditing(city); setModalOpen(true); };
  const remove = async (id) => {
    if (!confirm('Delete city?')) return;
    await api.delete(`/route-management/cities/${id}`);
    load();
  };
  const autoAdd = async () => {
    const region = regionFilter || regions[0]?._id;
    if (!region) return alert('Create or select a region first');
    setAutoAdding(true);
    try {
      const existing = new Set(cities.filter((city) => (city.region?._id || city.region) === region).map((city) => city.name?.toLowerCase()));
      const missing = DEFAULT_CITY_NAMES.filter((city) => !existing.has(city.toLowerCase()));
      await Promise.all(missing.map((name) => api.post('/route-management/cities', { region, name })));
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error auto adding cities');
    } finally {
      setAutoAdding(false);
    }
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Cities</h1>
        <div className="so-actions">
          <button type="button" onClick={autoAdd} disabled={autoAdding} className="so-btn-secondary text-sm">{autoAdding ? 'Adding...' : 'Auto Add'}</button>
          <button type="button" onClick={openAdd} className="so-btn-primary text-sm">+ New</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" onClick={load} className="so-search-button"><Search size={18} /></button>
        </div>
        <select className="so-input so-select w-[240px]" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
          <option value="">Select Region</option>
          {regions.map((region) => <option key={region._id} value={region._id}>{region.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>Sorry! No cities found.</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr><th className="w-[165px]">S.No</th><th>Name</th><th>Region</th><th className="w-[330px]">Action</th></tr>
            </thead>
            <tbody>
              {displayed.map((city, index) => (
                <tr key={city._id}>
                  <td>{index + 1}</td>
                  <td>{city.name}</td>
                  <td>{city.region?.name || '-'}</td>
                  <td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(city)} className="so-icon-btn !w-10 !h-10"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => remove(city._id)} className="so-icon-btn !w-10 !h-10"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CityModal
          editing={editing}
          regions={regions}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => { setModalOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
