import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Download, Upload, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';
import useIndiaLocations from '../../hooks/useIndiaLocations';
import useMasterData from '../../hooks/useMasterData';

const PAGE_SIZE = 30;
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];
const IMPORT_TEMPLATE = [
  'businessName', 'code', 'contactPerson', 'phone', 'email', 'status', 'region',
  'city', 'state', 'route', 'gstin', 'openingBalance', 'openingBalanceType',
  'creditPeriod', 'creditLimit', 'creditBillLimit', 'stateOfSupply',
];
const EXPORT_COLS = [
  { key: 'id', label: 'Id', accessor: '_id' },
  { key: 'name', label: 'Business Name', accessor: 'name' },
  { key: 'code', label: 'Code', accessor: 'code' },
  { key: 'phone', label: 'Mobile', accessor: 'phone' },
  { key: 'email', label: 'Email', accessor: 'email' },
  { key: 'status', label: 'Status', accessor: 'status' },
  { key: 'route', label: 'Route', accessor: 'route.name' },
  { key: 'city', label: 'City', accessor: 'address.city' },
  { key: 'state', label: 'State', accessor: 'address.state' },
  { key: 'gst', label: 'GST', accessor: 'gstin' },
  { key: 'creditLimit', label: 'Credit Limit', accessor: 'creditLimit' },
  { key: 'creditBillLimit', label: 'Credit Bill Limit', accessor: 'creditBillLimit' },
];

const shortId = (id) => String(id || '').slice(-7).toUpperCase();
const routeId = (route) => (typeof route === 'object' ? route?._id : route) || '';

const emptyAddress = () => ({ street: '', city: '', state: '', pincode: '', country: 'India' });
const makeEmptyForm = (type) => ({
  name: '',
  code: '',
  type,
  contactPerson: '',
  phone: '',
  email: '',
  status: 'active',
  isActive: true,
  region: '',
  route: '',
  group: '',
  gstin: '',
  pan: '',
  geoLocation: { lat: '', lng: '' },
  address: emptyAddress(),
  billingAddress: emptyAddress(),
  shippingAddress: emptyAddress(),
  openingBalance: 0,
  openingBalanceType: 'to_collect',
  creditPeriod: 0,
  creditLimit: 0,
  creditBillLimit: 0,
  stateOfSupply: '',
  paymentTerms: '30 days',
  roleRule: '',
  customFields: [{ name: '', value: '' }],
  sequence: 0,
  mobileMandatory: false,
  ekycId: '',
  documents: [],
  accessDetails: { loginEnabled: false, portalRole: '', username: '' },
  loginEmail: '',
  loginPassword: '',
  notes: '',
});

function normalizeParty(p, type) {
  const billing = p.billingAddress || p.address || emptyAddress();
  const shipping = p.shippingAddress || p.address || emptyAddress();
  return {
    ...makeEmptyForm(type),
    ...p,
    status: p.status || (p.isActive === false ? 'inactive' : 'active'),
    route: routeId(p.route),
    address: p.address || billing,
    billingAddress: billing,
    shippingAddress: shipping,
    geoLocation: p.geoLocation || { lat: '', lng: '' },
    customFields: p.customFields?.length ? p.customFields : [{ name: '', value: '' }],
    documents: p.documents || [],
    accessDetails: { loginEnabled: false, portalRole: '', username: '', ...(p.accessDetails || {}) },
  };
}

function Section({ title, children }) {
  return (
    <section className="pt-4 border-t border-[#eeeeee] first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold text-[#333] mb-3">{title}</h3>
      {children}
    </section>
  );
}

export default function PartyPage({ type, title, description }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(makeEmptyForm(type));
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const { routes } = useMasterData();
  const { states, cities: billingCities, loadingCities: billingLoading } = useIndiaLocations(form.billingAddress?.state);
  const { cities: shippingCities, loadingCities: shippingLoading } = useIndiaLocations(form.shippingAddress?.state);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/parties', { params: { type, search: search || undefined } });
      setParties(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => { setPage(1); }, [search, regionFilter, cityFilter]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => parties.filter((p) => {
    const haystack = [
      p.name, p.code, p.phone, p.email, p.contactPerson, p.gstin,
      p.address?.city, p.billingAddress?.city, p.address?.state, p.region,
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    const matchesRegion = !regionFilter || p.region === regionFilter;
    const city = p.address?.city || p.billingAddress?.city || '';
    const matchesCity = !cityFilter || city.toLowerCase().includes(cityFilter.toLowerCase());
    return matchesSearch && matchesRegion && matchesCity;
  }), [parties, search, regionFilter, cityFilter]);

  const cities = useMemo(
    () => [...new Set(parties.map((p) => p.address?.city || p.billingAddress?.city).filter(Boolean))],
    [parties]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const f = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const nested = (group, key, value) => setForm((p) => ({ ...p, [group]: { ...(p[group] || {}), [key]: value } }));
  const billingState = (state) => setForm((p) => ({
    ...p,
    billingAddress: { ...(p.billingAddress || emptyAddress()), state, city: '' },
    address: { ...(p.address || emptyAddress()), state, city: '' },
  }));
  const billingField = (key, value) => setForm((p) => ({
    ...p,
    billingAddress: { ...(p.billingAddress || emptyAddress()), [key]: value },
    address: { ...(p.address || emptyAddress()), [key]: value },
  }));
  const customField = (key, value) => setForm((p) => ({
    ...p,
    customFields: [{ ...(p.customFields?.[0] || {}), [key]: value }],
  }));

  const openAdd = () => {
    setEditing(null);
    setForm(makeEmptyForm(type));
    setPanelOpen(true);
  };

  const openEdit = (party) => {
    setEditing(party);
    setForm(normalizeParty(party, type));
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Business Name is required');
    if (form.mobileMandatory && !form.phone.trim()) return alert('Mobile Number is mandatory');
    const payload = {
      ...form,
      type,
      route: form.route || undefined,
      isActive: form.status === 'active',
      address: form.billingAddress || form.address,
      customFields: (form.customFields || []).filter((x) => x.name || x.value),
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

  const handleExport = () => exportToExcel(filtered, `${type}_parties`, EXPORT_COLS);

  const downloadTemplate = () => {
    const csv = `${IMPORT_TEMPLATE.join(',')}\nExample Business,CUST-001,Contact Name,9876543210,email@example.com,active,North,Delhi,Delhi,,07AABCS1234A1Z5,0,to_collect,30,50000,10,Delhi`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_import_template.csv`;
    a.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = String(ev.target.result || '').split(/\r?\n/).filter(Boolean);
      const headers = lines[0]?.split(',').map((h) => h.trim().replace(/"/g, '')) || [];
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] || '' }), {});
      }).filter((row) => row.businessName || row.name);
      setImportRows(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importRows.length) return alert('No valid rows found');
    setImporting(true);
    try {
      let success = 0;
      for (const row of importRows) {
        const billingAddress = {
          street: row.billingAddress || '',
          city: row.city || '',
          state: row.state || '',
          pincode: row.pincode || '',
          country: 'India',
        };
        const payload = {
          type,
          name: row.businessName || row.name,
          code: row.code,
          contactPerson: row.contactPerson,
          phone: row.phone,
          email: row.email,
          status: row.status || 'active',
          isActive: (row.status || 'active') === 'active',
          region: row.region,
          gstin: row.gstin,
          openingBalance: Number(row.openingBalance) || 0,
          openingBalanceType: row.openingBalanceType || 'to_collect',
          creditPeriod: Number(row.creditPeriod) || 0,
          creditLimit: Number(row.creditLimit) || 0,
          creditBillLimit: Number(row.creditBillLimit) || 0,
          stateOfSupply: row.stateOfSupply,
          address: billingAddress,
          billingAddress,
          shippingAddress: billingAddress,
        };
        try {
          await api.post('/parties', payload);
          success += 1;
        } catch {}
      }
      alert(`Imported ${success} of ${importRows.length} records`);
      setImportOpen(false);
      setImportRows([]);
      load();
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-[#333]">{title}</h1>
          {description && <p className="text-xs text-[#757575] mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Upload size={13} /> Import
          </button>
          <button onClick={handleExport} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="so-input w-52 pr-9" />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="so-input w-40 text-xs">
          <option value="">Select Region</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="so-input w-40 text-xs">
          <option value="">Select City</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1 text-xs text-[#757575]">
          <span>{filtered.length ? Math.min((page - 1) * PAGE_SIZE + 1, filtered.length) : 0} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="so-icon-btn w-6 h-6 disabled:opacity-40"><ChevronLeft size={13} /></button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="so-icon-btn w-6 h-6 disabled:opacity-40"><ChevronRight size={13} /></button>
        </div>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-24">Id</th>
              <th>Business Name</th>
              <th>Code</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Credit</th>
              <th>Geo Location</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-10 text-[#9e9e9e]">Loading...</td></tr>}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-[#9e9e9e]">No {title} found. <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button></td></tr>
            )}
            {displayed.map((p) => (
              <tr key={p._id}>
                <td><span className="font-mono text-xs text-[#9e9e9e]">{shortId(p._id)}</span></td>
                <td>
                  <p className="font-medium text-[#333]">{p.name}</p>
                  {p.contactPerson && <p className="text-xs text-[#9e9e9e]">{p.contactPerson}</p>}
                </td>
                <td><span className="font-mono text-xs">{p.code || '-'}</span></td>
                <td>{p.phone || '-'}</td>
                <td><span className={`so-badge ${p.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>{p.status || (p.isActive !== false ? 'active' : 'inactive')}</span></td>
                <td>
                  <p className="text-xs text-[#757575]">Limit: {formatCurrency(p.creditLimit || 0)}</p>
                  <p className="text-xs text-[#757575]">Bills: {p.creditBillLimit || 0}</p>
                </td>
                <td>
                  {(p.address?.city || p.address?.state || p.geoLocation?.lat) ? (
                    <div className="flex items-center gap-1 text-xs text-[#555]">
                      <MapPin size={11} className="text-[#9e9e9e] flex-shrink-0" />
                      {[p.address?.city, p.address?.state].filter(Boolean).join(', ') || `${p.geoLocation.lat}, ${p.geoLocation.lng}`}
                    </div>
                  ) : <span className="text-[#9e9e9e]">-</span>}
                </td>
                <td>
                  <button onClick={() => openEdit(p)} className="so-icon-btn w-7 h-7"><Edit2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`} width="w-[720px]">
        <div className="space-y-5">
          <Section title="General Details">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="so-label">Business Name *</label>
                <input className="so-input w-full" value={form.name} onChange={(e) => f('name', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Code</label>
                <input className="so-input w-full" value={form.code || ''} onChange={(e) => f('code', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Contact Person</label>
                <input className="so-input w-full" value={form.contactPerson || ''} onChange={(e) => f('contactPerson', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Mobile Number {form.mobileMandatory ? '*' : ''}</label>
                <input className="so-input w-full" value={form.phone || ''} onChange={(e) => f('phone', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Email</label>
                <input className="so-input w-full" value={form.email || ''} onChange={(e) => f('email', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Status</label>
                <select className="so-input w-full" value={form.status || 'active'} onChange={(e) => f('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Region</label>
                <select className="so-input w-full" value={form.region || ''} onChange={(e) => f('region', e.target.value)}>
                  <option value="">Select Region</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Route</label>
                <select className="so-input w-full" value={form.route || ''} onChange={(e) => f('route', e.target.value)}>
                  <option value="">Select Route</option>
                  {routes.map((r) => <option key={r._id} value={r._id}>{r.name || r.routeName || r.code}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">City</label>
                <select className="so-input w-full" value={form.billingAddress?.city || ''} onChange={(e) => billingField('city', e.target.value)} disabled={!form.billingAddress?.state || billingLoading}>
                  <option value="">{billingLoading ? 'Loading cities...' : 'Select City'}</option>
                  {billingCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Geo Location</label>
                <div className="grid grid-cols-2 gap-2">
                  <input className="so-input w-full" value={form.geoLocation?.lat || ''} onChange={(e) => nested('geoLocation', 'lat', e.target.value)} placeholder="Latitude" />
                  <input className="so-input w-full" value={form.geoLocation?.lng || ''} onChange={(e) => nested('geoLocation', 'lng', e.target.value)} placeholder="Longitude" />
                </div>
              </div>
            </div>
          </Section>

          {['distributor', 'super_stocker'].includes(type) && (
            <Section title="Access Details">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-[#555] col-span-2">
                  <input type="checkbox" checked={!!form.accessDetails?.loginEnabled} onChange={(e) => nested('accessDetails', 'loginEnabled', e.target.checked)} />
                  Enable portal access
                </label>
                <div>
                  <label className="so-label">Login Email</label>
                  <input className="so-input w-full" value={form.loginEmail || ''} onChange={(e) => f('loginEmail', e.target.value)} />
                </div>
                <div>
                  <label className="so-label">Login Password</label>
                  <input className="so-input w-full" value={form.loginPassword || ''} onChange={(e) => f('loginPassword', e.target.value)} type="password" />
                </div>
                <div>
                  <label className="so-label">Portal Role</label>
                  <input className="so-input w-full" value={form.accessDetails?.portalRole || ''} onChange={(e) => nested('accessDetails', 'portalRole', e.target.value)} placeholder="Distributor" />
                </div>
                <div>
                  <label className="so-label">Username</label>
                  <input className="so-input w-full" value={form.accessDetails?.username || ''} onChange={(e) => nested('accessDetails', 'username', e.target.value)} />
                </div>
              </div>
            </Section>
          )}

          <Section title="Other Details">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="so-label">Billing Address</label>
                <input className="so-input w-full" value={form.billingAddress?.street || ''} onChange={(e) => billingField('street', e.target.value)} placeholder="Street / Area" />
              </div>
              <div>
                <label className="so-label">Billing State</label>
                <select className="so-input w-full" value={form.billingAddress?.state || ''} onChange={(e) => billingState(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Billing Pincode</label>
                <input className="so-input w-full" value={form.billingAddress?.pincode || ''} onChange={(e) => billingField('pincode', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="so-label">Shipping Address</label>
                <input className="so-input w-full" value={form.shippingAddress?.street || ''} onChange={(e) => nested('shippingAddress', 'street', e.target.value)} placeholder="Street / Area" />
              </div>
              <div>
                <label className="so-label">Shipping State</label>
                <select className="so-input w-full" value={form.shippingAddress?.state || ''} onChange={(e) => setForm((p) => ({ ...p, shippingAddress: { ...(p.shippingAddress || emptyAddress()), state: e.target.value, city: '' } }))}>
                  <option value="">Select State</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Shipping City</label>
                <select className="so-input w-full" value={form.shippingAddress?.city || ''} onChange={(e) => nested('shippingAddress', 'city', e.target.value)} disabled={!form.shippingAddress?.state || shippingLoading}>
                  <option value="">{shippingLoading ? 'Loading cities...' : 'Select City'}</option>
                  {shippingCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Shipping Pincode</label>
                <input className="so-input w-full" value={form.shippingAddress?.pincode || ''} onChange={(e) => nested('shippingAddress', 'pincode', e.target.value)} />
              </div>
              <div>
                <label className="so-label">GST</label>
                <input className="so-input w-full" value={form.gstin || ''} onChange={(e) => f('gstin', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Opening Balance</label>
                <div className="grid grid-cols-[1fr_130px] gap-2">
                  <input type="number" className="so-input w-full" value={form.openingBalance || 0} onChange={(e) => f('openingBalance', Number(e.target.value))} />
                  <select className="so-input w-full" value={form.openingBalanceType || 'to_collect'} onChange={(e) => f('openingBalanceType', e.target.value)}>
                    <option value="to_collect">To Collect</option>
                    <option value="to_pay">To Pay</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="so-label">Credit Period</label>
                <input type="number" className="so-input w-full" value={form.creditPeriod || 0} onChange={(e) => f('creditPeriod', Number(e.target.value))} placeholder="Days" />
              </div>
              <div>
                <label className="so-label">Credit Limit</label>
                <input type="number" className="so-input w-full" value={form.creditLimit || 0} onChange={(e) => f('creditLimit', Number(e.target.value))} />
              </div>
              <div>
                <label className="so-label">Credit Bill Limit</label>
                <input type="number" className="so-input w-full" value={form.creditBillLimit || 0} onChange={(e) => f('creditBillLimit', Number(e.target.value))} />
              </div>
              <div>
                <label className="so-label">State of Supply</label>
                <select className="so-input w-full" value={form.stateOfSupply || ''} onChange={(e) => f('stateOfSupply', e.target.value)}>
                  <option value="">Select State</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="so-label">Rule / Role</label>
                <input className="so-input w-full" value={form.roleRule || ''} onChange={(e) => f('roleRule', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Add Custom Field</label>
                <div className="grid grid-cols-2 gap-2">
                  <input className="so-input w-full" value={form.customFields?.[0]?.name || ''} onChange={(e) => customField('name', e.target.value)} placeholder="Field name" />
                  <input className="so-input w-full" value={form.customFields?.[0]?.value || ''} onChange={(e) => customField('value', e.target.value)} placeholder="Value" />
                </div>
              </div>
              <div>
                <label className="so-label">Sequence</label>
                <input type="number" className="so-input w-full" value={form.sequence || 0} onChange={(e) => f('sequence', Number(e.target.value))} />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#555] pt-6">
                <input type="checkbox" checked={!!form.mobileMandatory} onChange={(e) => f('mobileMandatory', e.target.checked)} />
                Mobile Number Mandatory
              </label>
              <div>
                <label className="so-label">eKYC ID</label>
                <input className="so-input w-full" value={form.ekycId || ''} onChange={(e) => f('ekycId', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Documents">
            <div className="space-y-3">
              <input
                type="file"
                multiple
                className="so-input w-full text-xs"
                onChange={(e) => f('documents', Array.from(e.target.files || []).map((file) => ({ name: file.name, type: file.type, url: '' })))}
              />
              {form.documents?.length > 0 && (
                <div className="text-xs text-[#757575] space-y-1">
                  {form.documents.map((doc, idx) => <p key={`${doc.name}-${idx}`}>{doc.name}</p>)}
                </div>
              )}
              <textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={(e) => f('notes', e.target.value)} placeholder="Notes" />
            </div>
          </Section>

          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>

      <SlidePanel open={importOpen} onClose={() => { setImportOpen(false); setImportRows([]); }} title={`Import ${title}`} width="w-[560px]">
        <div className="space-y-4">
          <button onClick={downloadTemplate} className="so-btn-secondary w-full flex items-center justify-center gap-2 py-2">
            <Download size={14} /> Download CSV Template
          </button>
          <div>
            <label className="so-label">Upload CSV File</label>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="so-input w-full text-xs" />
          </div>
          {importRows.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-[#e0e0e0] rounded text-xs">
              <table className="w-full">
                <thead className="bg-[#f5f5f5] sticky top-0">
                  <tr><th className="px-3 py-2 text-left">Business Name</th><th className="px-3 py-2 text-left">Mobile</th><th className="px-3 py-2 text-left">City</th></tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-[#f5f5f5]">
                      <td className="px-3 py-1.5">{r.businessName || r.name}</td>
                      <td className="px-3 py-1.5">{r.phone}</td>
                      <td className="px-3 py-1.5">{r.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={handleImport} disabled={!importRows.length || importing} className="so-btn-primary flex-1">
              {importing ? 'Importing...' : `Import ${importRows.length || ''} Records`}
            </button>
            <button onClick={() => { setImportOpen(false); setImportRows([]); }} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
