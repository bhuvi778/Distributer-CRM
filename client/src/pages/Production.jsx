import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search, Settings, Upload, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

const todayRange = '22/06/2026 - 22/06/2026';

const CONFIG = {
  grm: {
    type: 'grm',
    title: 'Goods Receipt',
    createLabel: 'Create goods receipt',
    primary: true,
    settings: true,
    export: true,
    filters: true,
    emptyText: 'Sorry! No invoices found.',
    columns: [
      { label: 'Receipt No', value: (row) => row.orderNumber || row.referenceNumber || '-' },
      { label: 'Date', value: (row) => formatDate(row.createdAt) },
      { label: 'Supplier', value: (row) => row.supplier || row.partyName || '-' },
      { label: 'Amount', value: (row) => row.actualCost || 0 },
      { label: 'Status', value: (row) => row.status || 'draft' },
    ],
  },
  bom: {
    type: 'bom',
    title: 'Bill Of Material',
    createLabel: 'Create BOM',
    import: true,
    filters: true,
    boxEmpty: true,
    columns: [
      { label: 'BOM ID', value: (row) => row.orderNumber || row._id?.slice(-6) || '-' },
      { label: 'BOM Name', value: (row) => row.title || '-' },
      { label: 'Item Code', value: (row) => row.itemCode || '-' },
      { label: 'Item Name', value: (row) => row.materialName || '-' },
      { label: 'No of RM', value: (row) => row.bom?.length || 0 },
      { label: 'Modified On', value: (row) => formatDate(row.updatedAt || row.createdAt) },
    ],
  },
  'work-orders': {
    type: 'work_order',
    title: 'Work Order',
    createLabel: 'Create work order',
    primary: true,
    settings: true,
    export: true,
    filters: true,
    emptyText: 'Sorry! No invoices found.',
    columns: [
      { label: 'Order ID', value: (row) => row.orderNumber || '-' },
      { label: 'Ref No.', value: (row) => row.referenceNumber || '-' },
      { label: 'FG Code', value: (row) => row.itemCode || '-' },
      { label: 'FG Name', value: (row) => row.materialName || row.title || '-' },
      { label: 'Status', value: (row) => row.status || '-' },
      { label: 'Created On', value: (row) => formatDate(row.createdAt) },
    ],
  },
  'production-orders': {
    type: 'production_order',
    title: 'Production Orders',
    createLabel: 'Create Production Order',
    boxEmpty: true,
    columns: [
      { label: 'Order ID', value: (row) => row.orderNumber || '-' },
      { label: 'Ref No.', value: (row) => row.referenceNumber || '-' },
      { label: 'FG Code', value: (row) => row.itemCode || '-' },
      { label: 'FG Name', value: (row) => row.materialName || row.title || '-' },
      { label: 'Status', value: (row) => row.status || '-' },
      { label: 'Created On', value: (row) => formatDate(row.createdAt) },
    ],
  },
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function SettingsSwitch({ checked, onChange }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`so-settings-switch ${checked ? 'so-settings-switch-on' : ''}`} />;
}

function TransactionSettings({ settings, setSettings, onClose, onSave }) {
  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const addCustomField = (kind) => setSettings((prev) => ({
    ...prev,
    [kind]: [...(prev[kind] || []), { label: 'Add Custom Field' }],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(650px,calc(100vw-32px))] max-h-[calc(100vh-72px)] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl flex flex-col">
        <div className="h-[70px] flex items-center justify-between px-7 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">Transaction Settings</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]"><X size={22} /></button>
        </div>
        <div className="px-7 py-4 overflow-y-auto">
          {[
            ['vehicleNo', 'Vehicle No.'],
            ['ewayBillNo', 'E-way Bill No'],
            ['creditPeriod', 'Credit Period'],
            ['roundOff', 'Round Off.'],
            ['terms', 'Terms and conditions'],
          ].map(([key, label]) => (
            <div key={key} className="so-settings-row">
              <span>{label}</span>
              <SettingsSwitch checked={!!settings[key]} onChange={(value) => set(key, value)} />
            </div>
          ))}

          <div className="border-t border-[#eceff4] mt-8 pt-7 space-y-3">
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Min. Order Value:</label>
              <input className="so-input w-[112px]" value={settings.minOrderValue || ''} onChange={(event) => set('minOrderValue', event.target.value)} placeholder="₹" />
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Discounts ( - ):</label>
              <div className="flex items-center gap-2">
                <input className="so-input w-[202px]" value={settings.discount || ''} onChange={(event) => set('discount', event.target.value)} placeholder="Discount" />
                <select className="so-input so-select w-[120px]" value={settings.discountType || 'Percent'} onChange={(event) => set('discountType', event.target.value)}>
                  <option>Percent</option>
                  <option>Amount</option>
                </select>
                <button type="button" className="so-icon-btn !rounded-full !w-10 !h-10 text-[#333]">-</button>
              </div>
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <span />
              <button type="button" onClick={() => addCustomField('discountFields')} className="h-10 w-[230px] border border-dashed border-[#d7dce5] text-[#333] text-base">+ Add Custom Field</button>
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Charges ( + ):</label>
              <button type="button" onClick={() => addCustomField('chargeFields')} className="h-10 w-[230px] border border-dashed border-[#d7dce5] text-[#333] text-base">+ Add Custom Field</button>
            </div>
          </div>
          <button type="button" onClick={() => addCustomField('customFields')} className="mt-4 w-full text-center text-[#0057d8] text-sm">+ Add custom field</button>
        </div>
        <div className="h-[62px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[37px] min-w-[82px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} className="h-[37px] min-w-[66px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

function FilterPopover({ onApply }) {
  const [tab, setTab] = useState('filters');
  const columns = ['Date', 'Transaction No', 'Party Name', 'GSTIN', 'Amount', 'Due', 'Comment', 'Created By', 'Status'];

  return (
    <div className="absolute left-1/2 top-[calc(100%+24px)] z-40 w-[352px] -translate-x-1/2 rounded-[2px] bg-white shadow-2xl border border-[#eceff4]">
      <div className="absolute -top-3 left-[calc(50%-11px)] h-6 w-6 rotate-45 bg-white border-l border-t border-[#eceff4]" />
      <div className="relative p-5">
        <div className="flex items-center gap-10 border-b border-[#eceff4]">
          <button type="button" onClick={() => setTab('filters')} className={`h-11 text-base ${tab === 'filters' ? 'text-[#174bb8] border-b-2 border-[#174bb8]' : 'text-[#111827]'}`}>Filters</button>
          <button type="button" onClick={() => setTab('columns')} className={`h-11 text-base ${tab === 'columns' ? 'text-[#174bb8] border-b-2 border-[#174bb8]' : 'text-[#111827]'}`}>Columns</button>
        </div>
        {tab === 'filters' ? (
          <div className="min-h-[348px] pt-5">
            <label className="so-label text-base !mb-2">Route</label>
            <select className="so-input so-select w-full mb-4"><option>Select Route</option></select>
            <label className="so-label text-base !mb-2">Warehouse</label>
            <select className="so-input so-select w-full mb-4"><option>Select Warehouse</option></select>
            <label className="so-label text-base !mb-2">Party Group</label>
            <select className="so-input so-select w-full"><option>Select Group</option></select>
          </div>
        ) : (
          <div className="min-h-[348px] pt-5 space-y-3">
            {columns.map((column, index) => (
              <label key={column} className={`flex items-center gap-3 text-base ${index === 1 || index === 2 ? 'text-[#b8bdc6]' : 'text-[#111827]'}`}>
                <input type="checkbox" defaultChecked={index !== 3} disabled={index === 1 || index === 2} className="h-5 w-5 rounded border-[#d7dce5] accent-[#174bb8]" />
                {column}
              </label>
            ))}
          </div>
        )}
        <div className="border-t border-[#eceff4] pt-7 flex justify-end">
          <button type="button" onClick={onApply} className="h-[38px] min-w-[72px] rounded-[3px] bg-[#174bb8] px-4 text-white text-base font-semibold">Apply</button>
        </div>
      </div>
    </div>
  );
}

export default function Production() {
  const { pathname } = useLocation();
  const key = pathname.split('/').filter(Boolean).pop();
  const config = CONFIG[key] || CONFIG['production-orders'];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settings, setSettings] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/production', { params: { productionType: config.type, status: status || undefined } });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.type, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((row) => !search || JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const totalAmount = filtered.reduce((sum, row) => sum + Number(row.actualCost || 0), 0);

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <div className="flex items-center gap-3">
          <h1 className="so-title">{config.title}</h1>
          {config.primary && (
            <>
              <span className="text-[#9aa0aa]">|</span>
              <button type="button" className="h-10 min-w-[148px] rounded-[3px] bg-[#009b83] px-4 text-white text-base font-semibold inline-flex items-center justify-between gap-6">
                Primary <ChevronDown size={18} />
              </button>
            </>
          )}
        </div>
        <div className="so-actions">
          {config.settings && <span className="h-7 px-3 rounded-[2px] bg-[#1687d9] text-white text-sm flex items-center">Total : ₹ {totalAmount.toLocaleString('en-IN')}</span>}
          {config.settings && <button type="button" onClick={() => setSettingsOpen(true)} className="so-icon-btn !w-[58px] !h-9" title="Settings"><Settings size={18} /></button>}
          {config.export && <button type="button" className="so-btn-secondary text-sm">Export As <ChevronDown size={15} /></button>}
          {config.import && <button type="button" className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>}
          <button type="button" className="so-btn-primary text-sm">{config.createLabel}</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={load}><Search size={18} /></button>
        </div>
        <input className="so-input w-[240px]" value={todayRange} readOnly />
        {config.title !== 'Bill Of Material' && (
          <>
            <select className="so-input so-select w-[240px]" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
              <option value="">Select User</option>
            </select>
            <select className="so-input so-select w-[240px]" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Select Status</option>
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
            </select>
          </>
        )}
        {config.filters && (
          <div className="relative">
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm">
              <Filter size={15} /> Filters
            </button>
            {filtersOpen && <FilterPopover onApply={() => setFiltersOpen(false)} />}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm text-[#111827]">
          <span>{filtered.length ? `1 - ${filtered.length} of ${filtered.length}` : '1 - 0 of 0'}</span>
          <button type="button" className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40" disabled><ChevronLeft size={14} /></button>
          <button type="button" className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40" disabled><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="so-table-panel !mt-0 min-h-[556px]">
        <table className="so-table">
          <thead>
            <tr>{config.columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={config.columns.length} className="text-center py-10 text-[#9e9e9e]">Loading...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={config.columns.length}>
                  {config.boxEmpty ? (
                    <div className="so-empty so-empty-small min-h-[205px]">
                      <svg className="so-box-empty-icon" viewBox="0 0 64 48" fill="none" aria-hidden="true">
                        <path d="M15 17L24 7H40L49 17V38H15V17Z" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M15 17H27L30 22H35L38 17H49" stroke="currentColor" strokeWidth="1.7" />
                        <ellipse cx="32" cy="41" rx="23" ry="4" fill="currentColor" opacity="0.18" />
                      </svg>
                      <span>No Data</span>
                    </div>
                  ) : (
                    <div className="so-empty min-h-[360px]">
                      <div className="so-empty-illustration" />
                      <p>{config.emptyText}</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
            {!loading && filtered.map((row) => (
              <tr key={row._id}>{config.columns.map((column) => <td key={column.label}>{column.value(row)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      {settingsOpen && <TransactionSettings settings={settings} setSettings={setSettings} onClose={() => setSettingsOpen(false)} onSave={() => setSettingsOpen(false)} />}
    </div>
  );
}
