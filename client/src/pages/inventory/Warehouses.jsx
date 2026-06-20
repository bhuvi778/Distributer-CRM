import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Download, Upload } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { exportToExcel } from '../../utils/exportExcel';

const WAREHOUSE_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'transit', label: 'Transit' },
  { value: 'retail', label: 'Retail' },
  { value: 'virtual', label: 'Virtual' },
];

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
  { key: 'name', label: 'Warehouse Name', accessor: 'name' },
  { key: 'code', label: 'Code', accessor: 'code' },
  { key: 'type', label: 'Type', accessor: 'type' },
  { key: 'gstin', label: 'GST', accessor: 'gstin' },
  { key: 'address', label: 'Address', accessor: 'address.street' },
  { key: 'city', label: 'City', accessor: 'address.city' },
  { key: 'state', label: 'State', accessor: 'address.state' },
  { key: 'pincode', label: 'Pincode', accessor: 'address.pincode' },
  { key: 'phone', label: 'Phone', accessor: 'phone' },
  { key: 'email', label: 'Email', accessor: 'email' },
  { key: 'status', label: 'Status', accessor: 'isActive', renderExport: (v) => v !== false ? 'Active' : 'Inactive' },
  { key: 'skus', label: 'SKUs', accessor: 'stockCount' },
  { key: 'qty', label: 'Total Qty', accessor: 'totalQuantity' },
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
      phone: row.phone,
      email: row.email,
      isActive: !['inactive', 'false', 'no'].includes(String(row.status || '').toLowerCase()),
      notes: row.notes,
    };
  });
};

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const importRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/warehouses');
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (w) => {
    setEditing(w);
    setForm({ ...emptyForm, ...w, address: { ...emptyForm.address, ...(w.address || {}) } });
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name) return alert('Warehouse name is required');
    if (!form.address?.street) return alert('Address is required');
    if (!form.address?.state) return alert('State is required');
    try {
      if (editing) await api.put(`/inventory/warehouses/${editing._id}`, form);
      else await api.post('/inventory/warehouses', form);
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fa = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

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
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Warehouses</h1>
          <p className="text-xs text-[#757575] mt-0.5">Manage storage locations and track stock per warehouse</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => importRef.current?.click()} className="so-btn-secondary flex items-center gap-1.5 text-xs"><Upload size={13} /> Import</button>
          <button onClick={() => exportToExcel(warehouses, 'warehouses', EXPORT_COLS)} className="so-btn-secondary flex items-center gap-1.5 text-xs"><Download size={13} /> Export All</button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> Add Warehouse</button>
          <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Warehouse Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>GST</th>
              <th>Address</th>
              <th>Phone</th>
              <th>SKUs</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="text-center py-10 text-[#9e9e9e]">Loading...</td></tr>}
            {!loading && warehouses.length === 0 && (
              <tr><td colSpan={10} className="text-center py-10 text-[#9e9e9e]">No warehouses added yet. Click "Add Warehouse" to create one.</td></tr>
            )}
            {warehouses.map(wh => (
              <tr key={wh._id}>
                <td className="font-medium text-[#333]">{wh.name}</td>
                <td><span className="font-mono text-xs">{wh.code || '-'}</span></td>
                <td className="capitalize">{wh.type || 'primary'}</td>
                <td><span className="font-mono text-xs">{wh.gstin || '-'}</span></td>
                <td className="text-[#757575]">{[wh.address?.street, wh.address?.city, wh.address?.state, wh.address?.pincode].filter(Boolean).join(', ') || '-'}</td>
                <td>{wh.phone || '-'}</td>
                <td><span className="font-semibold text-[#333]">{wh.stockCount ?? 0}</span></td>
                <td><span className="font-semibold text-[#333]">{wh.totalQuantity ?? 0}</span></td>
                <td>
                  <span className={`so-badge ${wh.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>
                    {wh.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => exportOne(wh)} className="so-icon-btn" title="Export Warehouse"><Download size={13} /></button>
                    <button onClick={() => openEdit(wh)} className="so-icon-btn" title="Edit"><Edit2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Warehouse' : 'Add Warehouse'}>
        <div className="space-y-3">
          <div><label className="so-label">Warehouse Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Main Warehouse" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code} onChange={e => f('code', e.target.value)} placeholder="WH-001" /></div>
            <div><label className="so-label">GST</label><input className="so-input w-full" value={form.gstin || ''} onChange={e => f('gstin', e.target.value.toUpperCase())} placeholder="GSTIN" /></div>
            <div><label className="so-label">Type</label>
              <select className="so-input w-full" value={form.type || 'primary'} onChange={e => f('type', e.target.value)}>
                {WAREHOUSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="so-label">Status</label>
              <select className="so-input w-full" value={form.isActive !== false ? 'active' : 'inactive'} onChange={e => f('isActive', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div><label className="so-label">Address *</label><input className="so-input w-full" value={form.address?.street || ''} onChange={e => fa('street', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">City</label><input className="so-input w-full" value={form.address?.city || ''} onChange={e => fa('city', e.target.value)} /></div>
            <div><label className="so-label">State *</label><input className="so-input w-full" value={form.address?.state || ''} onChange={e => fa('state', e.target.value)} /></div>
            <div><label className="so-label">Pincode</label><input className="so-input w-full" value={form.address?.pincode || ''} onChange={e => fa('pincode', e.target.value)} /></div>
            <div><label className="so-label">Phone</label><input className="so-input w-full" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          </div>
          <div><label className="so-label">Email</label><input className="so-input w-full" value={form.email} onChange={e => f('email', e.target.value)} /></div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Warehouse</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
