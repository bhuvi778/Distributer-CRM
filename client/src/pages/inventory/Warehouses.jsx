import { useState, useEffect, useRef } from 'react';
import { Download, Edit2, Plus, Search, Upload } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { exportToExcel } from '../../utils/exportExcel';
import useIndiaLocations from '../../hooks/useIndiaLocations';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  code: '',
  type: 'primary',
  gstin: '',
  address: { street: '', city: '', state: '', pincode: '' },
  phone: '',
  email: '',
  isActive: true,
  notes: '',
};

const EXPORT_COLS = [
  { key: 'name', label: 'Name', accessor: 'name' },
  { key: 'address', label: 'Address', accessor: 'address.street' },
  { key: 'status', label: 'Status', accessor: 'isActive', renderExport: (v) => (v !== false ? 'Active' : 'Inactive') },
  { key: 'primary', label: 'Primary', accessor: 'type' },
];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line) => line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = Object.fromEntries(headers.map((h, idx) => [h, cells[idx] || '']));
    return {
      name: row.warehousename || row.name,
      code: row.code,
      type: row.type || 'primary',
      gstin: row.gst || row.gstin,
      address: {
        street: row.address || row.street,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
      },
      phone: row.phone || row.mobile,
      email: row.email,
      isActive: !['inactive', 'false', 'no'].includes(String(row.status || '').toLowerCase()),
      notes: row.notes,
    };
  });
};

export default function Warehouses() {
  const { user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const importRef = useRef(null);
  const { states } = useIndiaLocations(form.address?.state);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/warehouses');
      setWarehouses(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = warehouses.filter((warehouse) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [warehouse.name, warehouse.address?.street, warehouse.address?.city, warehouse.address?.state]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setPanelOpen(true);
  };

  const openEdit = (warehouse) => {
    setEditing(warehouse);
    setForm({ ...emptyForm, ...warehouse, address: { ...emptyForm.address, ...(warehouse.address || {}) } });
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name) return alert('Name is required');
    if (!form.address?.street) return alert('Address is required');
    if (!form.address?.state) return alert('State of supply is required');
    try {
      if (editing) await api.put(`/inventory/warehouses/${editing._id}`, form);
      else await api.post('/inventory/warehouses', form);
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const fa = (key, value) => setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCSV(await file.text()).filter((row) => row.name && row.address.street && row.address.state);
      if (!rows.length) return alert('No valid warehouse rows found. Name, Address, and State are mandatory.');
      const { data } = await api.post('/inventory/warehouses/import', { rows });
      alert(`${data.imported || 0} warehouses imported`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  const exportOne = (warehouse) => exportToExcel([warehouse], `warehouse_${warehouse.code || warehouse.name}`, EXPORT_COLS);

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Warehouse</h1>
        <div className="so-actions">
          {!isFieldReadOnly && (
            <>
              <button type="button" onClick={() => importRef.current?.click()} className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>
              <button type="button" onClick={openAdd} className="so-btn-primary text-sm"><Plus size={15} /> New</button>
              <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
            </>
          )}
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button"><Search size={21} /></button>
        </div>
      </div>

      <div className="so-table-panel !mt-3">
        <table className="so-table">
          <thead>
            <tr>
              <th className="w-[66px]">S.No</th>
              <th>Name</th>
              <th>Address</th>
              <th>Status</th>
              <th>Primary</th>
              <th className="w-[106px]"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-[#98a2b3]">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[#98a2b3]">No Data</td></tr>}
            {filtered.map((warehouse, index) => (
              <tr key={warehouse._id}>
                <td>{index + 1}</td>
                <td>{warehouse.name}</td>
                <td>{[warehouse.address?.street, warehouse.address?.city].filter(Boolean).join(', ') || '-'}</td>
                <td><span className={`so-switch ${warehouse.isActive !== false ? 'so-switch-on' : ''}`} /></td>
                <td>{warehouse.type === 'primary' && <span className="px-2.5 py-0.5 rounded bg-[#07b719] text-white font-semibold text-sm">Primary</span>}</td>
                <td>
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => exportOne(warehouse)} className="so-icon-btn !w-8 !h-8"><Download size={14} /></button>
                    {!isFieldReadOnly && <button type="button" onClick={() => openEdit(warehouse)} className="so-icon-btn !w-8 !h-8"><Edit2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Warehouse' : 'Create Warehouse'}
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
        <FormSection title="General Details">
          <div className="space-y-4 p-2">
            <div className="so-form-grid">
              <div>
                <label className="so-label">Name<span className="text-red-500">*</span></label>
                <input className="so-input w-full" value={form.name} onChange={(e) => f('name', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Mobile</label>
                <input className="so-input w-full" value={form.phone || ''} onChange={(e) => f('phone', e.target.value)} />
              </div>
              <div>
                <label className="so-label">Address</label>
                <textarea className="so-input w-full min-h-[72px]" value={form.address?.street || ''} onChange={(e) => fa('street', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="so-label">Email</label>
                <input className="so-input w-full" value={form.email || ''} onChange={(e) => f('email', e.target.value)} />
              </div>
              <div>
                <label className="so-label">GSTIN</label>
                <input className="so-input w-full" value={form.gstin || ''} onChange={(e) => f('gstin', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="so-label">State of supply</label>
                <select className="so-input so-select w-full" value={form.address?.state || ''} onChange={(e) => fa('state', e.target.value)}>
                  <option value="">Select State</option>
                  {states.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
            </div>
          </div>
        </FormSection>
      </SlidePanel>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section>
      <div className="so-form-section-title">{title}</div>
      {children}
    </section>
  );
}
