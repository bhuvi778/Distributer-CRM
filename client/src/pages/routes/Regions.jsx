import { useEffect, useMemo, useState } from 'react';
import { Edit2, Search, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const DEFAULT_REGIONS = [
  'North India',
  'South India',
  'East India',
  'West India',
  'Central India',
  'Delhi NCR',
  'Maharashtra',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
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
        <div className="px-5 py-7 min-h-[140px]">{children}</div>
        <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} disabled={saving} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function RegionModal({ editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return alert('Name is required');
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (editing) await api.put(`/route-management/regions/${editing._id}`, payload);
      else await api.post('/route-management/regions', payload);
      onSaved();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving region');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteDialog title={editing ? 'Edit Region' : 'Create Region'} onClose={onClose} onSave={save} saving={saving}>
      <label className="so-label text-base">Name<span className="text-red-500">*</span></label>
      <input className="so-input w-full" list="region-options" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" autoFocus />
      <datalist id="region-options">{DEFAULT_REGIONS.map((region) => <option key={region} value={region} />)}</datalist>
    </RouteDialog>
  );
}

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [autoAdding, setAutoAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/route-management/regions');
      setRegions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayed = useMemo(() => (
    regions.filter((region) => !search || region.name?.toLowerCase().includes(search.toLowerCase()))
  ), [regions, search]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (region) => { setEditing(region); setModalOpen(true); };
  const remove = async (id) => {
    if (!confirm('Delete region?')) return;
    await api.delete(`/route-management/regions/${id}`);
    load();
  };
  const autoAdd = async () => {
    setAutoAdding(true);
    try {
      const existing = new Set(regions.map((region) => region.name?.toLowerCase()));
      const missing = DEFAULT_REGIONS.filter((region) => !existing.has(region.toLowerCase()));
      await Promise.all(missing.map((name) => api.post('/route-management/regions', { name })));
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error auto adding regions');
    } finally {
      setAutoAdding(false);
    }
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Regions</h1>
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
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>Sorry! No regions found.</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr><th className="w-[90px]">S.No</th><th>Name</th><th className="w-[170px]">Action</th></tr>
            </thead>
            <tbody>
              {displayed.map((region, index) => (
                <tr key={region._id}>
                  <td>{index + 1}</td>
                  <td>{region.name}</td>
                  <td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(region)} className="so-icon-btn !w-10 !h-10"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => remove(region._id)} className="so-icon-btn !w-10 !h-10"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <RegionModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => { setModalOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
