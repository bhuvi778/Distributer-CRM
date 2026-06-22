import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Edit2, MapPin, Plus, Search, Settings, Upload, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { exportToExcel } from '../../utils/exportExcel';
import useIndiaLocations from '../../hooks/useIndiaLocations';
import useMasterData from '../../hooks/useMasterData';
import { useAuth } from '../../context/AuthContext';

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
  creditBillLimit: 0,
  sequence: 0,
  ekycId: '',
  notes: '',
  isActive: true,
  customFields: [],
});

const PARTY_SETTINGS_DEFAULTS = {
  route: true,
  status: true,
  creditBillLimit: true,
  sequence: false,
  erpId: false,
  mobileMandatory: false,
  customFields: [],
};

const VISIT_SETTINGS_DEFAULTS = {
  photoMandatory: false,
  scheduleVisit: false,
  commentOptions: 'Shop Closed, Already have stock',
  customFields: [],
};

const VISIT_PARTY_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'super_stocker', label: 'Super Stocker' },
  { value: 'supplier', label: 'Supplier' },
];

const emptyVisitForm = () => ({
  partyType: 'customer',
  party: '',
  partyName: '',
  region: '',
  city: '',
  area: '',
  comment: '',
  status: 'active',
  location: { lat: '', lng: '' },
  selfie: '',
  partyPhoto: '',
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

const formatVisitDate = (date) => (date ? new Date(date).toLocaleDateString('en-GB') : '-');

const normalize = (party, type) => ({
  ...emptyForm(type),
  ...party,
  address: party.address || party.billingAddress || emptyAddress(),
  billingAddress: party.billingAddress || party.address || emptyAddress(),
  shippingAddress: party.shippingAddress || party.address || emptyAddress(),
  geoLocation: party.geoLocation || { lat: '', lng: '' },
  route: party.route?._id || party.route || '',
  status: party.status || (party.isActive === false ? 'inactive' : 'active'),
});

function SettingsSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`so-settings-switch ${checked ? 'so-settings-switch-on' : ''}`}
      aria-pressed={checked}
    />
  );
}

function SettingsRow({ label, checked, onChange }) {
  return (
    <div className="so-settings-row">
      <span>{label}</span>
      <SettingsSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function PartySettingsModal({
  isVisited,
  settings,
  setSetting,
  newCustomField,
  setNewCustomField,
  addCustomField,
  toggleCustomField,
  onClose,
  onSave,
}) {
  const title = isVisited ? 'Visit Settings' : 'Party Settings';
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

        <div className="px-8 py-4">
          {isVisited ? (
            <>
              <SettingsRow label="Photo Mandatory" checked={!!settings.photoMandatory} onChange={(value) => setSetting('photoMandatory', value)} />
              <SettingsRow label="Schedule Visit" checked={!!settings.scheduleVisit} onChange={(value) => setSetting('scheduleVisit', value)} />
              <div className="so-settings-comment-row">
                <label>Comment Options :</label>
                <textarea
                  className="so-input w-full min-h-[56px]"
                  value={settings.commentOptions || ''}
                  onChange={(event) => setSetting('commentOptions', event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <SettingsRow label="Route" checked={!!settings.route} onChange={(value) => setSetting('route', value)} />
              <SettingsRow label="Status" checked={!!settings.status} onChange={(value) => setSetting('status', value)} />
              <SettingsRow label="Credit Bill Limit" checked={!!settings.creditBillLimit} onChange={(value) => setSetting('creditBillLimit', value)} />
              <SettingsRow label="Sequence" checked={!!settings.sequence} onChange={(value) => setSetting('sequence', value)} />
              <SettingsRow label="ERP Id" checked={!!settings.erpId} onChange={(value) => setSetting('erpId', value)} />
              <SettingsRow label="Mobile Mandatory" checked={!!settings.mobileMandatory} onChange={(value) => setSetting('mobileMandatory', value)} />
            </>
          )}

          {(settings.customFields || []).map((field, index) => (
            <SettingsRow
              key={`${field.label}-${index}`}
              label={field.label}
              checked={field.enabled !== false}
              onChange={() => toggleCustomField(index)}
            />
          ))}

          <div className="py-4 border-t border-[#eceff4]">
            <div className="flex items-center justify-center gap-2">
              <input
                className="so-input w-[220px]"
                value={newCustomField}
                onChange={(event) => setNewCustomField(event.target.value)}
                placeholder="Custom field name"
                onKeyDown={(event) => { if (event.key === 'Enter') addCustomField(); }}
              />
              <button type="button" onClick={addCustomField} className="text-[#0057d8] text-base">+ Add custom field</button>
            </div>
          </div>
        </div>

        <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function PartyPage({ type, title }) {
  const { user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageTitle = title || TITLE_BY_TYPE[type] || 'Party';
  const isVisited = type === 'visited';
  const [parties, setParties] = useState([]);
  const [visitParties, setVisitParties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [visitedBy, setVisitedBy] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange] = useState('22/06/2026 - 22/06/2026');
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visitPanelOpen, setVisitPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [partySettings, setPartySettings] = useState(isVisited ? VISIT_SETTINGS_DEFAULTS : PARTY_SETTINGS_DEFAULTS);
  const [newCustomField, setNewCustomField] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(type));
  const [visitForm, setVisitForm] = useState(emptyVisitForm());
  const importRef = useRef(null);
  const selfieRef = useRef(null);
  const partyPhotoRef = useRef(null);
  const { states, cities, loadingCities } = useIndiaLocations(form.address?.state);
  const { routes } = useMasterData();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = isVisited
        ? [
          api.get('/parties/visits', { params: { search: search || undefined } }),
          api.get('/parties/groups').catch(() => ({ data: [] })),
          Promise.all(VISIT_PARTY_TYPES.map((item) => api.get('/parties', { params: { type: item.value } }).catch(() => ({ data: [] })))),
        ]
        : [
          api.get('/parties', { params: { type, search: search || undefined } }),
          api.get('/parties/groups').catch(() => ({ data: [] })),
        ];
      const [partyRes, groupRes, partyLists] = await Promise.all(requests);
      setParties(Array.isArray(partyRes.data) ? partyRes.data : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
      if (isVisited) setVisitParties((partyLists || []).flatMap((res) => res.data || []));
    } finally {
      setLoading(false);
    }
  }, [type, search, isVisited]);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get(`/parties/settings/${type}`);
      setPartySettings({ ...(isVisited ? VISIT_SETTINGS_DEFAULTS : PARTY_SETTINGS_DEFAULTS), ...(data || {}) });
    } catch {
      setPartySettings(isVisited ? VISIT_SETTINGS_DEFAULTS : PARTY_SETTINGS_DEFAULTS);
    }
  }, [type, isVisited]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { setPage(1); }, [search, groupFilter, visitedBy, statusFilter]);

  const filtered = useMemo(() => {
    return parties.filter((party) => {
      if (isVisited) {
        const matchesStatus = !statusFilter || party.status === statusFilter;
        const matchesVisited = !visitedBy || party.createdBy?.name === visitedBy;
        return matchesStatus && matchesVisited;
      }
      const matchesStatus = !statusFilter || party.status === statusFilter || (statusFilter === 'active' && party.isActive !== false);
      const matchesVisited = !visitedBy || party.assignedTo?.name === visitedBy;
      const matchesGroup = !groupFilter || party.group === groupFilter;
      return matchesStatus && matchesVisited && matchesGroup;
    });
  }, [parties, statusFilter, visitedBy, groupFilter, isVisited]);

  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visitors = [...new Set(parties.map((party) => (isVisited ? party.createdBy?.name : party.assignedTo?.name)).filter(Boolean))];

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
  const setFormCustomField = (label, value) => setForm((prev) => {
    const existing = Array.isArray(prev.customFields) ? prev.customFields : [];
    const found = existing.some((field) => field.name === label);
    return {
      ...prev,
      customFields: found
        ? existing.map((field) => (field.name === label ? { ...field, value } : field))
        : [...existing, { name: label, value }],
    };
  });
  const getFormCustomField = (label) => (form.customFields || []).find((field) => field.name === label)?.value || '';

  const openAdd = () => {
    if (isFieldReadOnly) return;
    setEditing(null);
    setForm(emptyForm(type));
    setPanelOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && !isVisited && !isFieldReadOnly) {
      openAdd();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, type, isVisited, isFieldReadOnly]);

  const openEdit = (party) => {
    if (isFieldReadOnly) return;
    setEditing(party);
    setForm(normalize(party, type));
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Name is required');
    if (!isVisited && partySettings.mobileMandatory && !form.phone.trim()) return alert('Mobile is mandatory');
    const payload = {
      ...form,
      type,
      isActive: form.status !== 'inactive',
      billingAddress: form.address,
      customFields: (form.customFields || []).filter((field) => field.name || field.value),
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

  const openSettings = () => {
    setNewCustomField('');
    setSettingsOpen(true);
  };

  const setting = (key, value) => setPartySettings((prev) => ({ ...prev, [key]: value }));

  const addCustomField = () => {
    const label = newCustomField.trim();
    if (!label) return;
    setPartySettings((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).some((field) => field.label?.toLowerCase() === label.toLowerCase())
        ? prev.customFields
        : [...(prev.customFields || []), { label, enabled: true }],
    }));
    setNewCustomField('');
  };

  const toggleCustomField = (index) => setPartySettings((prev) => ({
    ...prev,
    customFields: (prev.customFields || []).map((field, idx) => (
      idx === index ? { ...field, enabled: field.enabled === false } : field
    )),
  }));

  const saveSettings = async () => {
    try {
      const { data } = await api.put(`/parties/settings/${type}`, partySettings);
      setPartySettings({ ...(isVisited ? VISIT_SETTINGS_DEFAULTS : PARTY_SETTINGS_DEFAULTS), ...(data || {}) });
      setSettingsOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving settings');
    }
  };

  const handleImport = (event) => {
    event.target.value = '';
    alert('Import template support will use the existing parties CSV flow.');
  };

  const vf = (key, value) => setVisitForm((prev) => ({ ...prev, [key]: value }));

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitForm((prev) => ({
          ...prev,
          location: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          },
        }));
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const openVisitPanel = () => {
    setVisitForm(emptyVisitForm());
    setVisitPanelOpen(true);
    captureLocation();
  };

  const handleVisitPartyChange = (partyId) => {
    const party = visitParties.find((item) => item._id === partyId);
    setVisitForm((prev) => ({
      ...prev,
      party: partyId,
      partyType: party?.type || prev.partyType,
      partyName: party?.name || '',
      city: party?.address?.city || party?.billingAddress?.city || prev.city,
    }));
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleVisitImage = async (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;
    vf(key, await fileToDataUrl(file));
    event.target.value = '';
  };

  const saveVisit = async () => {
    if (!visitForm.party && !visitForm.partyName.trim()) return alert('Party is required');
    if (partySettings.photoMandatory && !visitForm.selfie) return alert('Selfie is mandatory');
    try {
      await api.post('/parties/visits', visitForm);
      setVisitPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving visit');
    }
  };

  return (
    <div className="so-module-page so-party-page">
      <div className="so-titlebar">
        <h1 className="so-title">{pageTitle}</h1>
        <div className="so-actions">
          {isVisited ? (
            <>
              {isFieldReadOnly && <button type="button" onClick={openVisitPanel} className="so-btn-primary text-sm"><Plus size={15} /> Mark Visit</button>}
              {!isFieldReadOnly && <button type="button" onClick={openSettings} className="so-icon-btn !w-[46px] !h-9" title="Settings"><Settings size={18} /></button>}
            </>
          ) : (
            <>
              {!isFieldReadOnly && (
                <>
                  <button type="button" className="so-icon-btn !w-[58px] !h-9 border-[#174bb8] text-[#174bb8]" title="Map"><MapPin size={20} /></button>
                  <button type="button" onClick={openSettings} className="so-icon-btn !w-[58px] !h-9" title="Settings"><Settings size={18} /></button>
                  <button type="button" onClick={() => exportToExcel(filtered, `${type}_parties`, EXPORT_COLS)} className="so-btn-secondary text-sm"><Download size={15} /> Export</button>
                  <button type="button" onClick={() => importRef.current?.click()} className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>
                  <button type="button" onClick={openAdd} className="so-btn-primary text-sm"><Plus size={15} /> New</button>
                  <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
                </>
              )}
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
        {!isVisited && (
          <>
            <div className="flex-1" />
            <select className="so-input so-select w-[190px]" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="">Select Group</option>
              {groups.map((group) => <option key={group._id || group.name} value={group.name}>{group.name}</option>)}
            </select>
          </>
        )}
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
          {isVisited ? (
            <table className="so-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>Location</th>
                  <th>Comment</th>
                  <th>Visited By</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((visit) => (
                  <tr key={visit._id}>
                    <td>{formatVisitDate(visit.createdAt)}</td>
                    <td>{visit.party?.name || visit.partyName || '-'}</td>
                    <td>{VISIT_PARTY_TYPES.find((item) => item.value === visit.partyType)?.label || visit.partyType || '-'}</td>
                    <td>{visit.region || visit.city || '-'}</td>
                    <td>{visit.location?.lat && visit.location?.lng ? `${visit.location.lat}, ${visit.location.lng}` : '-'}</td>
                    <td>{visit.comment || '-'}</td>
                    <td>{visit.createdBy?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="so-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Group</th>
                  <th>City</th>
                  <th>Status</th>
                  {!isFieldReadOnly && <th className="w-[70px]"></th>}
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
                    {!isFieldReadOnly && <td><button type="button" onClick={() => openEdit(party)} className="so-icon-btn"><Edit2 size={14} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
              <label className="so-label">Mobile{partySettings.mobileMandatory ? ' *' : ''}</label>
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
            {partySettings.route && (
              <div>
                <label className="so-label">Route</label>
                <select className="so-input so-select w-full" value={form.route || ''} onChange={(event) => f('route', event.target.value)}>
                  <option value="">Select Route</option>
                  {routes.map((route) => <option key={route._id} value={route._id}>{route.name}</option>)}
                </select>
              </div>
            )}
            {partySettings.status && (
              <div>
                <label className="so-label">Status</label>
                <select className="so-input so-select w-full" value={form.status || 'active'} onChange={(event) => f('status', event.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            )}
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
            {partySettings.creditBillLimit && (
              <div>
                <label className="so-label">Credit Bill Limit</label>
                <input type="number" className="so-input w-full" value={form.creditBillLimit || 0} onChange={(event) => f('creditBillLimit', Number(event.target.value))} />
              </div>
            )}
            {partySettings.sequence && (
              <div>
                <label className="so-label">Sequence</label>
                <input type="number" className="so-input w-full" value={form.sequence || 0} onChange={(event) => f('sequence', Number(event.target.value))} />
              </div>
            )}
            {partySettings.erpId && (
              <div>
                <label className="so-label">ERP Id</label>
                <input className="so-input w-full" value={form.ekycId || ''} onChange={(event) => f('ekycId', event.target.value)} />
              </div>
            )}
            <div className="col-span-2">
              <label className="so-label">Notes</label>
              <textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={(event) => f('notes', event.target.value)} />
            </div>
            {(partySettings.customFields || []).filter((field) => field.enabled !== false).map((field) => (
              <div key={field.label}>
                <label className="so-label">{field.label}</label>
                <input className="so-input w-full" value={getFormCustomField(field.label)} onChange={(event) => setFormCustomField(field.label, event.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </SlidePanel>

      <SlidePanel
        open={visitPanelOpen}
        onClose={() => setVisitPanelOpen(false)}
        title="Mark Visit"
        width="w-[600px]"
        hideClose
        bodyClassName="p-4"
        headerActions={(
          <>
            <button type="button" onClick={saveVisit} className="so-btn-primary text-sm min-w-[67px]">Save</button>
            <button type="button" onClick={() => setVisitPanelOpen(false)} className="text-sm px-3">Cancel</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="so-form-section-title">Visit Details</div>
          <div className="so-form-grid">
            <div>
              <label className="so-label">Party Type *</label>
              <select className="so-input so-select w-full" value={visitForm.partyType} onChange={(event) => vf('partyType', event.target.value)}>
                {VISIT_PARTY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">Party *</label>
              <select className="so-input so-select w-full" value={visitForm.party} onChange={(event) => handleVisitPartyChange(event.target.value)}>
                <option value="">Select Party</option>
                {visitParties.filter((party) => party.type === visitForm.partyType).map((party) => (
                  <option key={party._id} value={party._id}>{party.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="so-label">Region</label>
              <input className="so-input w-full" value={visitForm.region} onChange={(event) => vf('region', event.target.value)} placeholder="Region" />
            </div>
            <div>
              <label className="so-label">City</label>
              <input className="so-input w-full" value={visitForm.city} onChange={(event) => vf('city', event.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="so-label">Area</label>
              <input className="so-input w-full" value={visitForm.area} onChange={(event) => vf('area', event.target.value)} placeholder="Area" />
            </div>
            <div>
              <label className="so-label">Location</label>
              <div className="flex gap-2">
                <input className="so-input flex-1" value={visitForm.location.lat && visitForm.location.lng ? `${visitForm.location.lat}, ${visitForm.location.lng}` : ''} readOnly placeholder="Current location" />
                <button type="button" onClick={captureLocation} className="so-btn-secondary text-sm">GPS</button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="so-label">Comment</label>
              <textarea className="so-input w-full min-h-[72px]" value={visitForm.comment} onChange={(event) => vf('comment', event.target.value)} placeholder={partySettings.commentOptions || 'Visit comment'} />
            </div>
            <div>
              <label className="so-label">Selfie{partySettings.photoMandatory ? ' *' : ''}</label>
              <button type="button" onClick={() => selfieRef.current?.click()} className="so-upload-box w-full h-[118px]">
                {visitForm.selfie ? <img src={visitForm.selfie} alt="" className="h-full w-full object-cover" /> : <span>+ Upload</span>}
              </button>
              <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleVisitImage(event, 'selfie')} />
            </div>
            <div>
              <label className="so-label">Customer Photo</label>
              <button type="button" onClick={() => partyPhotoRef.current?.click()} className="so-upload-box w-full h-[118px]">
                {visitForm.partyPhoto ? <img src={visitForm.partyPhoto} alt="" className="h-full w-full object-cover" /> : <span>+ Upload</span>}
              </button>
              <input ref={partyPhotoRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleVisitImage(event, 'partyPhoto')} />
            </div>
          </div>
        </div>
      </SlidePanel>

      {settingsOpen && (
        <PartySettingsModal
          isVisited={isVisited}
          settings={partySettings}
          setSetting={setting}
          newCustomField={newCustomField}
          setNewCustomField={setNewCustomField}
          addCustomField={addCustomField}
          toggleCustomField={toggleCustomField}
          onClose={() => setSettingsOpen(false)}
          onSave={saveSettings}
        />
      )}
    </div>
  );
}
