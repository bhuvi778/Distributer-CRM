import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, X } from 'lucide-react';
import api from '../../api/axios';

// ── Modal (center popup — image style) ───────────────────────────
function RouteModal({ editing, regions, cities, warehouses, onClose, onSave }) {
  const emptyForm = {
    name: '',
    region: '',
    city: '',
    warehouse: '',
    pincode: '',
  };

  const [form, setForm] = useState(
    editing
      ? {
          name:      editing.name      || '',
          region:    editing.region?._id || editing.region || '',
          city:      editing.city?._id   || editing.city   || '',
          warehouse: editing.warehouse  || '',
          pincode:   editing.pincode    || '',
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [pinQuery, setPinQuery] = useState(editing?.pincode || editing?.name || '');
  const [pinSuggestions, setPinSuggestions] = useState([]);

  // Filter cities by selected region
  const filteredCities = form.region
    ? cities.filter(c => (c.region?._id || c.region) === form.region)
    : cities;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const q = pinQuery.trim();
    if (q.length < 2) {
      setPinSuggestions([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/pincodes/search', { params: { q } });
        setPinSuggestions(data);
      } catch {
        setPinSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pinQuery]);

  const selectPincode = (pin) => {
    setForm(p => ({
      ...p,
      name: p.name || pin.name,
      pincode: pin.pincode,
    }));
    setPinQuery(`${pin.pincode} - ${pin.name}`);
    setPinSuggestions([]);
  };

  const handleSave = async () => {
    if (!form.name)   return alert('Name is required');
    if (!form.region) return alert('Region is required');
    if (!form.city)   return alert('City is required');
    setSaving(true);
    try {
      if (editing) await api.put(`/route-management/areas/${editing._id}`, form);
      else         await api.post('/route-management/areas', form);
      onSave();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving');
    } finally { setSaving(false); }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0]">
          <h3 className="text-sm font-semibold text-[#333]">
            {editing ? 'Edit Route' : 'Create Route'}
          </h3>
          <button onClick={onClose} className="text-[#9e9e9e] hover:text-[#333] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Region + City (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="so-label">Region *</label>
              <select
                className="so-input w-full"
                value={form.region}
                onChange={e => { f('region', e.target.value); f('city', ''); }}
              >
                <option value="">Select Region</option>
                {regions.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="so-label">City *</label>
              <select
                className="so-input w-full"
                value={form.city}
                onChange={e => f('city', e.target.value)}
              >
                <option value="">Select City</option>
                {filteredCities.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <label className="so-label">Warehouse *</label>
            <select
              className="so-input w-full"
              value={form.warehouse}
              onChange={e => f('warehouse', e.target.value)}
            >
              <option value="">Select Warehouse</option>
              <option value="Main">Main Warehouse</option>
              {warehouses.map(w => (
                <option key={w._id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="so-label">Name *</label>
            <input
              className="so-input w-full"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              placeholder="Area / Route name"
              autoFocus
            />
          </div>

          <div>
            <label className="so-label">Pincode</label>
            <input
              className="so-input w-full"
              value={form.pincode}
              onChange={e => { f('pincode', e.target.value); setPinQuery(e.target.value); }}
              placeholder="Type pincode or post office"
            />
            {pinSuggestions.length > 0 && (
              <div className="mt-2 border border-[#e0e0e0] rounded bg-white max-h-40 overflow-auto">
                {pinSuggestions.map((pin) => (
                  <button key={`${pin.name}-${pin.pincode}`} type="button" onClick={() => selectPincode(pin)} className="block w-full text-left px-3 py-2 text-xs hover:bg-[#f5f5f5]">
                    <span className="font-mono">{pin.pincode}</span> - {pin.name}, {pin.district}, {pin.state}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#e0e0e0]">
          <button onClick={onClose} className="so-btn-secondary px-6">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="so-btn-primary px-6">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Areas Page ───────────────────────────────────────────────
export default function Areas() {
  const [areas,      setAreas]      = useState([]);
  const [cities,     setCities]     = useState([]);
  const [regions,    setRegions]    = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter,setStateFilter]= useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, r, w] = await Promise.all([
        api.get('/route-management/areas', { params: { city: cityFilter || undefined } }),
        api.get('/route-management/cities'),
        api.get('/route-management/regions'),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      setAreas(a.data);
      setCities(c.data);
      setRegions(r.data);
      setWarehouses(w.data);
    } finally { setLoading(false); }
  }, [cityFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this area?')) return;
    await api.delete(`/route-management/areas/${id}`);
    load();
  };

  // Filter display
  const displayed = areas.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const matchCity   = !cityFilter  || (a.city?._id || a.city) === cityFilter;
    const matchState  = !stateFilter || a.city?.state?.toLowerCase().includes(stateFilter.toLowerCase());
    return matchSearch && matchCity && matchState;
  });

  // Unique states for filter
  const states = [...new Set(cities.map(c => c.state).filter(Boolean))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">Areas</h1>
        <div className="flex items-center gap-2">
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          <button className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Upload size={13} /> Import
          </button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="so-input w-44 pr-9"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>

        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select City</option>
          {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select State</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>

        <span className="ml-auto text-xs text-[#9e9e9e]">{displayed.length} areas</span>
      </div>

      {/* Table */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-12">S.No</th>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Warehouse</th>
              <th>Pincode</th>
              <th>Region</th>
              <th className="w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>
            )}
            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[#9e9e9e]">
                  No areas found.{' '}
                  <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button>
                </td>
              </tr>
            )}
            {displayed.map((a, idx) => (
              <tr key={a._id}>
                <td className="text-[#9e9e9e] text-center">{idx + 1}</td>
                <td className="font-medium text-[#333]">{a.name}</td>
                <td>{a.city?.name || '—'}</td>
                <td>{a.city?.state || '—'}</td>
                <td>{a.warehouse || '—'}</td>
                <td><span className="font-mono text-xs">{a.pincode || '—'}</span></td>
                <td>{a.region?.name || '—'}</td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => openEdit(a)} className="so-icon-btn w-7 h-7" title="Edit">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="so-icon-btn w-7 h-7 text-red-400 hover:bg-red-50" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <RouteModal
          editing={editing}
          regions={regions}
          cities={cities}
          warehouses={warehouses}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={() => { setModalOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
