import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Download, Upload, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';

const PAGE_SIZE = 30;

// ── Import template columns per type ────────────────────────────
const IMPORT_TEMPLATE = ['name', 'phone', 'email', 'gstin', 'pan', 'group', 'contactPerson', 'creditLimit', 'paymentTerms', 'address_street', 'address_city', 'address_state', 'address_pincode', 'notes'];

const EXPORT_COLS = [
  { key: 'id',      label: 'Id',         accessor: '_id' },
  { key: 'name',    label: 'Name',        accessor: 'name' },
  { key: 'code',    label: 'Party Code',  accessor: 'code' },
  { key: 'phone',   label: 'Mobile',      accessor: 'phone' },
  { key: 'balance', label: 'Balance',     accessor: 'outstandingBalance' },
  { key: 'city',    label: 'City',        accessor: 'address.city' },
  { key: 'state',   label: 'State',       accessor: 'address.state' },
  { key: 'gstin',   label: 'GSTIN',       accessor: 'gstin' },
  { key: 'contact', label: 'Contact Person', accessor: 'contactPerson' },
  { key: 'email',   label: 'Email',       accessor: 'email' },
  { key: 'credit',  label: 'Credit Limit', accessor: 'creditLimit' },
  { key: 'terms',   label: 'Payment Terms', accessor: 'paymentTerms' },
  { key: 'status',  label: 'Status',      accessor: 'isActive', renderExport: v => v ? 'Active' : 'Inactive' },
];

// Short sequential ID from mongo _id last 7 chars
const shortId = (id) => String(id).slice(-7).toUpperCase();

export default function PartyPage({ type, title, description }) {
  const [parties, setParties]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [cityFilter, setCityFilter]     = useState('');
  const [groupFilter, setGroupFilter]   = useState('');
  const [groups, setGroups]       = useState([]);
  const [cities, setCities]       = useState([]);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting]   = useState(false);
  const fileRef = useRef();

  const emptyForm = {
    name: '', type, contactPerson: '', phone: '', email: '', gstin: '', pan: '',
    group: '', creditLimit: 0, paymentTerms: '30 days',
    address: { street: '', city: '', state: '', pincode: '' }, notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/parties', {
        params: {
          type,
          search:  search  || undefined,
          group:   groupFilter || undefined,
          page,
          limit:   PAGE_SIZE,
        },
      });
      // Filter by city client-side (simple)
      const filtered = cityFilter
        ? data.filter(p => p.address?.city?.toLowerCase().includes(cityFilter.toLowerCase()))
        : data;
      setParties(filtered);
      setTotal(filtered.length);

      // Derive unique groups & cities for filters
      setGroups([...new Set(data.map(p => p.group).filter(Boolean))]);
      setCities([...new Set(data.map(p => p.address?.city).filter(Boolean))]);
    } finally { setLoading(false); }
  }, [type, search, groupFilter, cityFilter, page]);

  useEffect(() => { setPage(1); }, [search, groupFilter, cityFilter]);
  useEffect(() => { load(); }, [load]);

  // Paginate client-side
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const displayed  = parties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD ──────────────────────────────────────────────────────
  const openAdd  = () => { setEditing(null); setForm({ ...emptyForm, type }); setPanelOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setPanelOpen(true); };

  const save = async () => {
    try {
      if (editing) await api.put(`/parties/${editing._id}`, form);
      else         await api.post('/parties', form);
      setPanelOpen(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const f  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  // ── Export ────────────────────────────────────────────────────
  const handleExport = () => exportToExcel(parties, `${type}_parties`, EXPORT_COLS);

  // ── Import ────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = IMPORT_TEMPLATE.join(',') + '\n' +
      `Example ${title.slice(0,-1)},9876543210,email@example.com,07AABCS1234A1Z5,,Group1,Contact Name,50000,30 days,Street,City,State,110001,Notes`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_import_template.csv`;
    a.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      }).filter(r => r.name);
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
        const payload = {
          name: row.name, type,
          phone: row.phone, email: row.email,
          gstin: row.gstin, pan: row.pan,
          group: row.group, contactPerson: row.contactPerson,
          creditLimit: Number(row.creditLimit) || 0,
          paymentTerms: row.paymentTerms || '30 days',
          address: { street: row.address_street, city: row.address_city, state: row.address_state, pincode: row.address_pincode },
          notes: row.notes,
        };
        try { await api.post('/parties', payload); success++; } catch {}
      }
      alert(`✅ Imported ${success} of ${importRows.length} records`);
      setImportOpen(false); setImportRows([]); load();
    } finally { setImporting(false); }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-[#333]">{title}</h1>
        <div className="flex items-center gap-2">
          {/* Import */}
          <button onClick={() => setImportOpen(true)} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Upload size={13} /> Import
          </button>
          {/* Export */}
          <button onClick={handleExport} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          {/* New */}
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {/* ── Filters row (exactly like image) ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="so-input w-44 pr-9"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
        </div>

        {/* Region filter */}
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select Region</option>
          {['North', 'South', 'East', 'West', 'Central'].map(r => <option key={r}>{r}</option>)}
        </select>

        {/* City filter */}
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select City</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Group filter */}
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="so-input w-36 text-xs">
          <option value="">Select Group</option>
          {groups.map(g => <option key={g}>{g}</option>)}
        </select>

        {/* Pagination count */}
        <div className="ml-auto flex items-center gap-1 text-xs text-[#757575]">
          <span>{Math.min((page-1)*PAGE_SIZE+1, total)} – {Math.min(page*PAGE_SIZE, total)} of {total}</span>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="so-icon-btn w-6 h-6 disabled:opacity-40"><ChevronLeft size={13} /></button>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="so-icon-btn w-6 h-6 disabled:opacity-40"><ChevronRight size={13} /></button>
        </div>
      </div>

      {/* ── Table (SalesOn image style) ── */}
      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-24">Id</th>
              <th>Name</th>
              <th>Party Code</th>
              <th>Mobile</th>
              <th>Balance</th>
              <th>Geo Location</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-10 text-[#9e9e9e]">Loading…</td></tr>
            )}
            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#9e9e9e]">
                  No {title} found.{' '}
                  <button onClick={openAdd} className="text-[#1e88e5] hover:underline">Add one</button>
                </td>
              </tr>
            )}
            {displayed.map(p => (
              <tr key={p._id}>
                {/* Id — short numeric style like image */}
                <td>
                  <span className="font-mono text-xs text-[#9e9e9e]">{shortId(p._id)}</span>
                </td>
                {/* Name */}
                <td>
                  <p className="font-medium text-[#333]">{p.name}</p>
                  {p.contactPerson && <p className="text-xs text-[#9e9e9e]">{p.contactPerson}</p>}
                </td>
                {/* Party Code */}
                <td>
                  <span className="font-mono text-xs">{p.code || '—'}</span>
                </td>
                {/* Mobile */}
                <td>{p.phone || '—'}</td>
                {/* Balance */}
                <td>
                  <span className={`font-semibold text-sm ${p.outstandingBalance > 0 ? 'text-[#e53935]' : 'text-[#333]'}`}>
                    {p.outstandingBalance ? formatCurrency(p.outstandingBalance) : '₹ 0'}
                  </span>
                </td>
                {/* Geo Location */}
                <td>
                  {(p.address?.city || p.address?.state) ? (
                    <div className="flex items-center gap-1 text-xs text-[#555]">
                      <MapPin size={11} className="text-[#9e9e9e] flex-shrink-0" />
                      {[p.address?.city, p.address?.state].filter(Boolean).join(', ')}
                    </div>
                  ) : <span className="text-[#9e9e9e]">—</span>}
                </td>
                {/* Edit */}
                <td>
                  <button onClick={() => openEdit(p)} className="so-icon-btn w-7 h-7">
                    <Edit2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-[#757575]">
          <span>{total} total records</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="so-btn-secondary py-1 px-2 text-xs disabled:opacity-40">Prev</button>
            <span className="px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="so-btn-secondary py-1 px-2 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* ── Add / Edit SlidePanel ── */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? `Edit ${title.slice(0,-1)}` : `Add ${title.slice(0,-1)}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="so-label">Name *</label>
              <input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Party name" />
            </div>
            <div>
              <label className="so-label">Party Code</label>
              <input className="so-input w-full" value={form.code || ''} onChange={e => f('code', e.target.value)} placeholder="DIST-001" />
            </div>
            <div>
              <label className="so-label">Contact Person</label>
              <input className="so-input w-full" value={form.contactPerson || ''} onChange={e => f('contactPerson', e.target.value)} />
            </div>
            <div>
              <label className="so-label">Mobile *</label>
              <input className="so-input w-full" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="so-label">Email</label>
              <input className="so-input w-full" value={form.email || ''} onChange={e => f('email', e.target.value)} />
            </div>
            <div>
              <label className="so-label">GSTIN</label>
              <input className="so-input w-full" value={form.gstin || ''} onChange={e => f('gstin', e.target.value)} />
            </div>
            <div>
              <label className="so-label">PAN</label>
              <input className="so-input w-full" value={form.pan || ''} onChange={e => f('pan', e.target.value)} />
            </div>
            <div>
              <label className="so-label">Group</label>
              <input className="so-input w-full" value={form.group || ''} onChange={e => f('group', e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="so-label">Credit Limit (₹)</label>
              <input type="number" className="so-input w-full" value={form.creditLimit || 0} onChange={e => f('creditLimit', Number(e.target.value))} min="0" />
            </div>
            <div>
              <label className="so-label">Payment Terms</label>
              <select className="so-input w-full" value={form.paymentTerms || '30 days'} onChange={e => f('paymentTerms', e.target.value)}>
                {['Immediate','7 days','15 days','30 days','45 days','60 days'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#555] mb-2">Address / Geo Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="so-label">Street</label>
                <input className="so-input w-full" value={form.address?.street || ''} onChange={e => fa('street', e.target.value)} />
              </div>
              <div>
                <label className="so-label">City</label>
                <input className="so-input w-full" value={form.address?.city || ''} onChange={e => fa('city', e.target.value)} />
              </div>
              <div>
                <label className="so-label">State</label>
                <input className="so-input w-full" value={form.address?.state || ''} onChange={e => fa('state', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Pincode</label>
                <input className="so-input w-full" value={form.address?.pincode || ''} onChange={e => fa('pincode', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="so-label">Notes</label>
            <textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={e => f('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>

      {/* ── Import Panel ── */}
      <SlidePanel open={importOpen} onClose={() => { setImportOpen(false); setImportRows([]); }} title={`Import ${title}`} width="w-[560px]">
        <div className="space-y-4">
          <div className="bg-[#e3f2fd] border border-[#90caf9] rounded p-3 text-xs text-[#1565c0]">
            <p className="font-semibold mb-1">How to import:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Download the CSV template below</li>
              <li>Fill in your data (do not change column headers)</li>
              <li>Upload the filled CSV file</li>
              <li>Preview and confirm import</li>
            </ol>
          </div>

          <button onClick={downloadTemplate} className="so-btn-secondary w-full flex items-center justify-center gap-2 py-2">
            <Download size={14} /> Download CSV Template
          </button>

          <div>
            <label className="so-label">Upload CSV File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="so-input w-full text-xs"
            />
          </div>

          {importRows.length > 0 && (
            <div>
              <p className="text-xs text-[#555] mb-2 font-semibold">{importRows.length} records ready to import:</p>
              <div className="max-h-48 overflow-y-auto border border-[#e0e0e0] rounded text-xs">
                <table className="w-full">
                  <thead className="bg-[#f5f5f5] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-[#555]">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#555]">Mobile</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#555]">City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5]">
                    {importRows.slice(0, 20).map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className="px-3 py-1.5">{r.phone}</td>
                        <td className="px-3 py-1.5">{r.address_city}</td>
                      </tr>
                    ))}
                    {importRows.length > 20 && (
                      <tr><td colSpan={3} className="px-3 py-2 text-[#9e9e9e] text-center">+{importRows.length - 20} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button
              onClick={handleImport}
              disabled={!importRows.length || importing}
              className="so-btn-primary flex-1"
            >
              {importing ? 'Importing…' : `Import ${importRows.length || ''} Records`}
            </button>
            <button onClick={() => { setImportOpen(false); setImportRows([]); }} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
