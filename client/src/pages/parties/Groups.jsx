import { useEffect, useMemo, useState } from 'react';
import { Archive, Edit2, Plus, Search, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '' };

export default function Groups() {
  const { user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/parties/groups');
      setGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => group.name?.toLowerCase().includes(term));
  }, [groups, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (group) => {
    if (group.isLegacy) return;
    setEditing(group);
    setForm({ name: group.name || '' });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Group name is required');
    try {
      if (editing) await api.put(`/parties/groups/${editing._id}`, form);
      else await api.post('/parties/groups', form);
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving group');
    }
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Groups</h1>
        {!isFieldReadOnly && <button type="button" onClick={openCreate} className="so-btn-primary text-sm"><Plus size={15} /> New</button>}
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button"><Search size={18} /></button>
        </div>
      </div>

      <div className="so-table-panel min-h-[445px]">
        <table className="so-table">
          <thead>
            <tr>
              <th>Name</th>
              {!isFieldReadOnly && <th className="w-[90px]"></th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={2} className="text-center py-16 text-[#98a2b3]">Loading...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={2}>
                  <div className="so-empty so-empty-small min-h-[220px]">
                    <Archive className="so-box-empty-icon" strokeWidth={1.2} />
                    <span>No Data</span>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((group) => (
              <tr key={group._id || group.name}>
                <td>{group.name}</td>
                {!isFieldReadOnly && (
                  <td className="text-right">
                    {!group.isLegacy && (
                    <button type="button" onClick={() => openEdit(group)} className="so-icon-btn"><Edit2 size={14} /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setModalOpen(false)} />
          <div className="relative w-[624px] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl">
            <div className="h-[68px] flex items-center justify-between px-5 border-b border-[#d7dce5]">
              <h2 className="text-xl font-semibold text-[#202733]">Group</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[#777] hover:text-[#111]">
                <X size={22} strokeWidth={3} />
              </button>
            </div>
            <div className="px-5 py-7">
              <label className="so-label !text-lg">Name</label>
              <input className="so-input w-full" value={form.name} onChange={(event) => setForm({ name: event.target.value })} placeholder="Name" autoFocus />
            </div>
            <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
              <button type="button" onClick={save} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
