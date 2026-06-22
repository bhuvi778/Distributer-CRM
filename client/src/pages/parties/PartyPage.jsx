import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Edit2, MapPin, Plus, Search, Settings, Upload } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { exportToExcel } from '../../utils/exportExcel';
import useIndiaLocations from '../../hooks/useIndiaLocations';

const PAGE_SIZE = 30;
const TITLE_BY_TYPE = {
  customer: 'Customer',
  distributor: 'Distributor',
  super_stocker: 'Super Stocker',
  supplier: 'Supplier',
  visited: 'Party Visited',
};

const emptyAddress = () => ({ street: '', city: '', state: '', pincode: '', country: 'India' });
const emptyForm = (type) => ({
  name: '',
  code: '',
  type,
  contactPerson: '',
  phone: '',
  email: '',
  status: 'active',
  group: '',
  gstin: '',
  address: emptyAddress(),
  billingAddress: emptyAddress(),
  shippingAddress: emptyAddress(),
  geoLocation: { lat: '', lng: '' },
  creditLimit: 0,
  notes: '',
  isActive: true,
});

const EXPORT_COLS = [
  { key: 'name', label: 'Name', accessor: 'name' },
  { key: 'code', label: 'Code', accessor: 'code' },
  { key: 'phone', label: 'Mobile', accessor: 'phone' },
  { key: 'email', label: 'Email', accessor: 'email' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'group', label: 'Group', accessor: 'group' },
  { key: 'city', label: 'City', accessor: 'address.city' },
  { key: 'state', label: 'State', accessor: 'address.state' },
];

const displayRange = (count, page) => {
  if (!count) return '1 - 0 of 0';
  const start = (page - 1) * PAGE_SIZE + 1;
  return `${start} - ${Math.min(page * PAGE_SIZE, count)} of ${count}`;
};

const normalize = (party, type) => ({
  ...emptyForm(type),
  ...party,
  address: party.address || party.billingAddress || emptyAddress(),
  billingAddress: party.billingAddress || party.address || emptyAddress(),
  shippingAddress: party.shippingAddress || party.address || emptyAddress(),
  geoLocation: party.geoLocation || { lat: '', lng: '' },
  status: party.status || (party.isActive === false ? 'inactive' : 'active'),
});

export default function PartyPage({ type, title }) {
  const pageTitle = title || TITLE_BY_TYPE[type] || 'Party';
  const isVisited = type === 'visited';
  const [parties, setParties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visitedBy, setVisitedBy] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange] = useState('22/06/2026 - 22/06/2026');
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(type));
  const importRef = useRef(null);
  const { states, cities, loadingCities } = useIndiaLocations(form.address?.state);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [partyRes, groupRes] = await Promise.all([
        api.get('/parties', { params: { type, search: search || undefined } }),
        api.get('/parties/groups').catch(() => ({ data: [] })),
      ]);
      setParties(Array.isArray(partyRes.data) ? partyRes.data : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, visitedBy, statusFilter]);

  const filtered = useMemo(() => {
    return parties.filter((party) => {
      const matchesStatus = !statusFilter || party.status === statusFilter || (statusFilter === 'active' && party.isActive !== false);
      const matchesVisited = !visitedBy || party.assignedTo?.name === visitedBy;
      return matchesStatus && matchesVisited;
    });
  }, [parties, statusFilter, visitedBy]);

  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visitors = [...new Set(parties.map((party) => party.assignedTo?.name).filter(Boolean))];

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const fa = (key, value) => setForm((prev) => ({
    ...prev,
    address: { ...(prev.address || emptyAddress()), [key]: value },
    billingAddress: { ...(prev.billingAddress || emptyAddress()), [key]: value },
  }));
  const setState = (state) => setForm((prev) => ({
    ...prev,
    address: { ...(prev.address || emptyAddress()), state, city: '' },
    billingAddress: { ...(prev.billingAddress || emptyAddress()), state, city: '' },
  }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(type));
    setPanelOpen(true);
  };

  const openEdit = (party) => {
    setEditing(party);
    setForm(normalize(party, type));
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Name is required');
    const payload = {
      ...form,
      type,
      isActive: form.status !== 'inactive',
      billingAddress: form.address,
    };
    try {
      if (editing) await api.put(`/parties/${editing._id}`, payload);
      else await api.post('/parties', payload);
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving party');
    }
  };

  const handleImport = (event) => {
    event.target.value = '';
    alert('Import template support will use the existing parties CSV flow.');
  };

  return (
    <div className="so-module-page so-party-page">
      <div className="so-titlebar">
        <h1 className="so-title">{pageTitle}</h1>
        <div className="so-actions">
          {isVisited ? (
            <button type="button" className="so-icon-btn !w-[46px] !h-9" title="Settings"><Settings size={18} /></button>
          ) : (
            <>
              <button type="button" className="so-icon-btn !w-[58px] !h-9 border-[#174bb8] text-[#174bb8]" title="Map"><MapPin size={20} /></button>
              <button type="button" className="so-icon-btn !w-[58px] !h-9" title="Settings"><Settings size={18} /></button>
              <button type="button" onClick={() => exportToExcel(filtered, `${type}_parties`, EXPORT_COLS)} className="so-btn-secondary text-sm"><Download size={15} /> Export</button>
              <button type="button" onClick={() => importRef.current?.click()} className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>
              <button type="button" onClick={openAdd} className="so-btn-primary text-sm"><Plus size={15} /> New</button>
              <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
            </>
          )}
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={load}><Search size={18} /></button>
        </div>
        {isVisited && (
          <>
            <input className="so-input w-[240px]" value={dateRange} readOnly />
            <div className="flex-1" />
            <select className="so-input so-select w-[190px]" value={visitedBy} onChange={(event) => setVisitedBy(event.target.value)}>
              <option value="">Select Visited By</option>
              {visitors.map((visitor) => <option key={visitor} value={visitor}>{visitor}</option>)}
            </select>
            <select className="so-input so-select w-[190px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </>
        )}
        {!isVisited && <div className="flex-1" />}
        <div className="ml-auto flex items-center gap-2 text-sm text-[#111827]">
          <span>{displayRange(filtered.length, page)}</span>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronLeft size={14} /></button>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>Sorry! No parties found.</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Group</th>
                <th>City</th>
                <th>Status</th>
                <th className="w-[70px]"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((party) => (
                <tr key={party._id}>
                  <td>{party.name}</td>
                  <td>{party.phone || '-'}</td>
                  <td>{party.group || '-'}</td>
                  <td>{party.address?.city || party.billingAddress?.city || '-'}</td>
                  <td><span className={`so-badge ${party.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>{party.status || 'active'}</span></td>
                  <td><button type="button" onClick={() => openEdit(party)} className="so-icon-btn"><Edit2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? `Edit ${pageTitle}` : `Create ${pageTitle}`}
        width="w-[600px]"
        hideClose
        bodyClassName="p-4"
        headerActions={(
          <>
            <button type="button" onClick={save} className="so-btn-primary text-sm min-w-[67px]">Save</button>
            <button type="button" onClick={() => setPanelOpen(false)} className="text-sm px-3">Cancel</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="so-form-section-title">General Details</div>
          <div className="so-form-grid">
            <div>
              <label className="so-label">Name *</label>
              <input className="so-input w-full" value={form.name} onChange={(event) => f('name', event.target.value)} />
            </div>
            <div>
              <label className="so-label">Mobile</label>
              <input className="so-input w-full" value={form.phone || ''} onChange={(event) => f('phone', event.target.value)} />
            </div>
            <div>
              <label className="so-label">Code</label>
              <input className="so-input w-full" value={form.code || ''} onChange={(event) => f('code', event.target.value)} />
            </div>
            <div>
              <label className="so-label">Email</label>
              <input className="so-input w-full" value={form.email || ''} onChange={(event) => f('email', event.target.value)} />
            </div>
            <div>
              <label className="so-label">Group</label>
              <select className="so-input so-select w-full" value={form.group || ''} onChange={(event) => f('group', event.target.value)}>
                <option value="">Select Group</option>
                {groups.map((group) => <option key={group._id || group.name} value={group.name}>{group.name}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">Status</label>
              <select className="so-input so-select w-full" value={form.status || 'active'} onChange={(event) => f('status', event.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="so-label">Address</label>
              <textarea className="so-input w-full min-h-[72px]" value={form.address?.street || ''} onChange={(event) => fa('street', event.target.value)} />
            </div>
            <div>
              <label className="so-label">State</label>
              <select className="so-input so-select w-full" value={form.address?.state || ''} onChange={(event) => setState(event.target.value)}>
                <option value="">Select State</option>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">City</label>
              <select className="so-input so-select w-full" value={form.address?.city || ''} onChange={(event) => fa('city', event.target.value)} disabled={!form.address?.state || loadingCities}>
                <option value="">{loadingCities ? 'Loading cities...' : 'Select City'}</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">GSTIN</label>
              <input className="so-input w-full" value={form.gstin || ''} onChange={(event) => f('gstin', event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="so-label">Credit Limit</label>
              <input type="number" className="so-input w-full" value={form.creditLimit || 0} onChange={(event) => f('creditLimit', Number(event.target.value))} />
            </div>
            <div className="col-span-2">
              <label className="so-label">Notes</label>
              <textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={(event) => f('notes', event.target.value)} />
            </div>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
