import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Edit2, Search, Trash2, Upload, X } from 'lucide-react';
import api from '../../api/axios';

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
        <div className="px-5 py-7 min-h-[310px]">{children}</div>
        <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} disabled={saving} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function AreaModal({ editing, regions, cities, warehouses, onClose, onSaved }) {
  const [form, setForm] = useState({
    region: editing?.region?._id || editing?.region || '',
    city: editing?.city?._id || editing?.city || '',
    warehouse: editing?.warehouse || '',
    name: editing?.name || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const filteredCities = form.region ? cities.filter((city) => (city.region?._id || city.region) === form.region) : cities;

  const save = async () => {
    if (!form.region) return alert('Region is required');
    if (!form.city) return alert('City is required');
    if (!form.warehouse) return alert('Warehouse is required');
    if (!form.name.trim()) return alert('Name is required');
    setSaving(true);
    try {
      if (editing) await api.put(`/route-management/areas/${editing._id}`, form);
      else await api.post('/route-management/areas', form);
      onSaved();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving route');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteDialog title={editing ? 'Edit Route' : 'Create Route'} onClose={onClose} onSave={save} saving={saving}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="so-label text-base">Region<span className="text-red-500">*</span></label>
            <select className="so-input so-select w-full" value={form.region} onChange={(event) => { set('region', event.target.value); set('city', ''); }}>
              <option value="">Select Region</option>
              {regions.map((region) => <option key={region._id} value={region._id}>{region.name}</option>)}
            </select>
          </div>
          <div>
            <label className="so-label text-base">City<span className="text-red-500">*</span></label>
            <select className="so-input so-select w-full" value={form.city} onChange={(event) => set('city', event.target.value)}>
              <option value="">Select City</option>
              {filteredCities.map((city) => <option key={city._id} value={city._id}>{city.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="so-label text-base">Warehouse<span className="text-red-500">*</span></label>
          <select className="so-input so-select w-[286px]" value={form.warehouse} onChange={(event) => set('warehouse', event.target.value)}>
            <option value="">Select Warehouse</option>
            <option value="Main Warehouse">Main Warehouse</option>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse.name}>{warehouse.name}</option>)}
          </select>
        </div>

        <div>
          <label className="so-label text-base">Name<span className="text-red-500">*</span></label>
          <input className="so-input w-full" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Name" autoFocus />
        </div>
      </div>
    </RouteDialog>
  );
}

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [areaRes, cityRes, regionRes, warehouseRes] = await Promise.all([
        api.get('/route-management/areas', { params: { region: regionFilter || undefined, city: cityFilter || undefined, warehouse: warehouseFilter || undefined } }),
        api.get('/route-management/cities'),
        api.get('/route-management/regions'),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      setAreas(Array.isArray(areaRes.data) ? areaRes.data : []);
      setCities(Array.isArray(cityRes.data) ? cityRes.data : []);
      setRegions(Array.isArray(regionRes.data) ? regionRes.data : []);
      setWarehouses(Array.isArray(warehouseRes.data) ? warehouseRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [regionFilter, cityFilter, warehouseFilter]);

  useEffect(() => { load(); }, [load]);

  const filteredCities = regionFilter ? cities.filter((city) => (city.region?._id || city.region) === regionFilter) : cities;
  const displayed = useMemo(() => (
    areas.filter((area) => {
      const matchesSearch = !search || area.name?.toLowerCase().includes(search.toLowerCase());
      const matchesWarehouse = !warehouseFilter || area.warehouse === warehouseFilter;
      return matchesSearch && matchesWarehouse;
    })
  ), [areas, search, warehouseFilter]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (area) => { setEditing(area); setModalOpen(true); };
  const remove = async (id) => {
    if (!confirm('Delete route?')) return;
    await api.delete(`/route-management/areas/${id}`);
    load();
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Areas</h1>
        <div className="so-actions">
          <button type="button" className="so-btn-secondary text-sm"><Download size={15} /> Export</button>
          <button type="button" className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>
          <button type="button" onClick={openAdd} className="so-btn-primary text-sm">+ New</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" onClick={load} className="so-search-button"><Search size={18} /></button>
        </div>
        <select className="so-input so-select w-[240px]" value={regionFilter} onChange={(event) => { setRegionFilter(event.target.value); setCityFilter(''); }}>
          <option value="">Select Region</option>
          {regions.map((region) => <option key={region._id} value={region._id}>{region.name}</option>)}
        </select>
        <select className="so-input so-select w-[240px]" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
          <option value="">Select City</option>
          {filteredCities.map((city) => <option key={city._id} value={city._id}>{city.name}</option>)}
        </select>
        <select className="so-input so-select w-[240px]" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
          <option value="">Select Warehouse</option>
          <option value="Main Warehouse">Main Warehouse</option>
          {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse.name}>{warehouse.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>Sorry! No routes found.</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr><th className="w-[90px]">S.No</th><th>Name</th><th>Region</th><th>City</th><th>Warehouse</th><th className="w-[170px]">Action</th></tr>
            </thead>
            <tbody>
              {displayed.map((area, index) => (
                <tr key={area._id}>
                  <td>{index + 1}</td>
                  <td>{area.name}</td>
                  <td>{area.region?.name || '-'}</td>
                  <td>{area.city?.name || '-'}</td>
                  <td>{area.warehouse || '-'}</td>
                  <td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(area)} className="so-icon-btn !w-10 !h-10"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => remove(area._id)} className="so-icon-btn !w-10 !h-10"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <AreaModal
          editing={editing}
          regions={regions}
          cities={cities}
          warehouses={warehouses}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => { setModalOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
