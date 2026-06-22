import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Plus, Search, Settings, X,
} from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import useMasterData from '../../hooks/useMasterData';
import { exportToExcel } from '../../utils/exportExcel';
import { formatCurrency } from '../../utils/helpers';

const PAGE_SIZE = 30;

const SETTINGS_DEFAULTS = {
  vehicleNo: false,
  ewayBillNo: false,
  creditPeriod: false,
  roundOff: false,
  termsAndConditions: false,
  minOrderValue: '',
  discountName: '',
  discountType: 'Percent',
  chargesName: '',
  customFields: [],
};

const ESTIMATE_SETTINGS_DEFAULTS = {
  ...SETTINGS_DEFAULTS,
  poNumber: '',
};

const statusOptions = ['draft', 'sent', 'accepted', 'pending', 'approved', 'delivered', 'cancelled'];

const getValue = (obj, keys, fallback = '-') => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const getTransactionNumber = (row) => getValue(row, [
  'estimateNumber', 'orderNumber', 'invoiceNumber', 'challanNumber', 'returnNumber', 'creditNoteNumber', 'purchaseNumber', 'purchaseReturnNumber', 'referenceNumber',
], '-');

const getParty = (row) => getValue(row, ['partyName', 'supplier', 'outlet.name', 'party.name', 'customerName'], '-');
const getUser = (row) => getValue(row, ['createdBy.name', 'salesRep.name', 'deliveryAgent.name', 'processedBy.name'], '-');
const getAmount = (row) => Number(getValue(row, ['grandTotal', 'amount', 'subtotal'], 0)) || 0;
const getDate = (row) => getValue(row, ['invoiceDate', 'orderDate', 'returnDate', 'purchaseDate', 'createdAt'], null);
const getGstin = (row) => getValue(row, ['gstin', 'outlet.gstin', 'party.gstin'], '-');
const getDue = (row) => Number(getValue(row, ['balanceDue', 'dueAmount'], 0)) || 0;
const getComment = (row) => getValue(row, ['comment', 'notes', 'reason'], '-');

const COLUMN_DEFS = [
  { key: 'date', label: 'Date', locked: false },
  { key: 'transactionNo', label: 'Transaction No', locked: true },
  { key: 'partyName', label: 'Party Name', locked: true },
  { key: 'gstin', label: 'GSTIN', locked: false },
  { key: 'amount', label: 'Amount', locked: false },
  { key: 'due', label: 'Due', locked: false },
  { key: 'comment', label: 'Comment', locked: false },
  { key: 'createdBy', label: 'Created By', locked: false },
  { key: 'status', label: 'Status', locked: false },
];

const DEFAULT_VISIBLE_COLUMNS = {
  date: true,
  transactionNo: true,
  partyName: true,
  gstin: false,
  amount: true,
  due: true,
  comment: true,
  createdBy: true,
  status: true,
};

function TxSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`so-settings-switch ${checked ? 'so-settings-switch-on' : ''}`}
      aria-pressed={checked}
    />
  );
}

function TxSettingRow({ label, checked, onChange }) {
  return (
    <div className="so-settings-row">
      <span>{label}</span>
      <TxSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function TransactionSettingsModal({
  estimateMode,
  settings,
  setSetting,
  newCustomField,
  setNewCustomField,
  addCustomField,
  removeCustomField,
  onClose,
  onSave,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(650px,calc(100vw-32px))] max-h-[calc(100vh-72px)] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl flex flex-col">
        <div className="h-[70px] flex items-center justify-between px-7 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">Transaction Settings</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]">
            <X size={22} />
          </button>
        </div>

        <div className="px-7 py-4 overflow-y-auto">
          <TxSettingRow label="Vehicle No." checked={!!settings.vehicleNo} onChange={(value) => setSetting('vehicleNo', value)} />
          <TxSettingRow label="E-way Bill No" checked={!!settings.ewayBillNo} onChange={(value) => setSetting('ewayBillNo', value)} />
          <TxSettingRow label="Credit Period" checked={!!settings.creditPeriod} onChange={(value) => setSetting('creditPeriod', value)} />
          <TxSettingRow label="Round Off." checked={!!settings.roundOff} onChange={(value) => setSetting('roundOff', value)} />
          <TxSettingRow label="Terms and conditions" checked={!!settings.termsAndConditions} onChange={(value) => setSetting('termsAndConditions', value)} />

          <div className="border-t border-[#eceff4] mt-8 pt-7 space-y-3">
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Min. Order Value:</label>
              <input
                className="so-input w-[112px]"
                value={settings.minOrderValue || ''}
                onChange={(event) => setSetting('minOrderValue', event.target.value)}
                placeholder="₹"
              />
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Discounts ( - ):</label>
              <div className="flex items-center gap-2">
                <input
                  className="so-input w-[202px]"
                  value={settings.discountName || ''}
                  onChange={(event) => setSetting('discountName', event.target.value)}
                  placeholder="Discount"
                />
                <select
                  className="so-input so-select w-[120px]"
                  value={settings.discountType || 'Percent'}
                  onChange={(event) => setSetting('discountType', event.target.value)}
                >
                  <option>Percent</option>
                  <option>Amount</option>
                </select>
                <button type="button" className="so-icon-btn !rounded-full !w-10 !h-10 text-[#333]">-</button>
              </div>
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <span />
              <button type="button" onClick={addCustomField} className="h-10 w-[230px] border border-dashed border-[#d7dce5] text-[#333] text-base">
                <Plus size={16} className="inline mr-2" /> Add Custom Field
              </button>
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-[15px] text-[#2b2f36]">Charges ( + ):</label>
              <button type="button" onClick={addCustomField} className="h-10 w-[230px] border border-dashed border-[#d7dce5] text-[#333] text-base">
                <Plus size={16} className="inline mr-2" /> Add Custom Field
              </button>
            </div>
            {estimateMode && (
              <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                <span />
                <input
                  className="so-input w-[230px]"
                  value={settings.poNumber || ''}
                  onChange={(event) => setSetting('poNumber', event.target.value)}
                  placeholder="PO Number"
                />
              </div>
            )}
          </div>

          <div className="py-4 border-t border-[#eceff4] mt-4">
            {(settings.customFields || []).map((field, index) => (
              <div key={`${field.label}-${index}`} className="flex items-center justify-center gap-2 mb-2">
                <input
                  className="so-input w-[230px]"
                  value={field.label}
                  onChange={(event) => setSetting('customFields', settings.customFields.map((item, idx) => (
                    idx === index ? { ...item, label: event.target.value } : item
                  )))}
                />
                <button type="button" onClick={() => removeCustomField(index)} className="so-icon-btn !w-10 !h-10"><X size={16} /></button>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2">
              <input
                className="so-input w-[230px]"
                value={newCustomField}
                onChange={(event) => setNewCustomField(event.target.value)}
                placeholder="Custom field"
                onKeyDown={(event) => { if (event.key === 'Enter') addCustomField(); }}
              />
              <button type="button" onClick={addCustomField} className="text-[#0057d8] text-sm">+ Add custom field</button>
            </div>
          </div>
        </div>

        <div className="h-[62px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[37px] min-w-[82px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} className="h-[37px] min-w-[66px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

function SalesFilterPopover({
  activeTab,
  setActiveTab,
  routes,
  warehouses,
  groups,
  routeFilter,
  setRouteFilter,
  warehouseFilter,
  setWarehouseFilter,
  partyGroupFilter,
  setPartyGroupFilter,
  draftColumns,
  setDraftColumns,
  onApply,
}) {
  const toggleColumn = (key) => {
    const column = COLUMN_DEFS.find((item) => item.key === key);
    if (column?.locked) return;
    setDraftColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="absolute left-1/2 top-[calc(100%+24px)] z-40 w-[352px] -translate-x-1/2 rounded-[2px] bg-white shadow-2xl border border-[#eceff4]">
      <div className="absolute -top-3 left-[calc(50%-11px)] h-6 w-6 rotate-45 bg-white border-l border-t border-[#eceff4]" />
      <div className="relative p-5">
        <div className="flex items-center gap-10 border-b border-[#eceff4]">
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`h-11 text-base ${activeTab === 'filters' ? 'text-[#174bb8] border-b-2 border-[#174bb8]' : 'text-[#111827]'}`}
          >
            Filters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`h-11 text-base ${activeTab === 'columns' ? 'text-[#174bb8] border-b-2 border-[#174bb8]' : 'text-[#111827]'}`}
          >
            Columns
          </button>
        </div>

        {activeTab === 'filters' ? (
          <div className="min-h-[348px] pt-5">
            <label className="so-label text-base !mb-2">Route</label>
            <select className="so-input so-select w-full mb-4" value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)}>
              <option value="">Select Route</option>
              {routes.map((route) => <option key={route._id || route.name} value={route.name}>{route.name}</option>)}
            </select>
            <label className="so-label text-base !mb-2">Warehouse</label>
            <select className="so-input so-select w-full mb-4" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => <option key={warehouse._id || warehouse.name} value={warehouse.name}>{warehouse.name}</option>)}
            </select>
            <label className="so-label text-base !mb-2">Party Group</label>
            <select className="so-input so-select w-full" value={partyGroupFilter} onChange={(event) => setPartyGroupFilter(event.target.value)}>
              <option value="">Select Group</option>
              {groups.map((group) => <option key={group._id || group.name} value={group.name}>{group.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="min-h-[348px] pt-5">
            <div className="space-y-3">
              {COLUMN_DEFS.map((column) => (
                <label key={column.key} className={`flex items-center gap-3 text-base ${column.locked ? 'text-[#b8bdc6]' : 'text-[#111827]'}`}>
                  <input
                    type="checkbox"
                    checked={!!draftColumns[column.key]}
                    disabled={column.locked}
                    onChange={() => toggleColumn(column.key)}
                    className="h-5 w-5 rounded border-[#d7dce5] accent-[#174bb8]"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#eceff4] pt-7 flex justify-end">
          <button type="button" onClick={onApply} className="h-[38px] min-w-[72px] rounded-[3px] bg-[#174bb8] px-4 text-white text-base font-semibold">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

const buildExportCols = () => [
  { key: 'number', label: 'No.', renderExport: (_, row) => getTransactionNumber(row) },
  { key: 'date', label: 'Date', renderExport: (_, row) => getDate(row) ? new Date(getDate(row)).toLocaleDateString('en-IN') : '' },
  { key: 'party', label: 'Party', renderExport: (_, row) => getParty(row) },
  { key: 'user', label: 'User', renderExport: (_, row) => getUser(row) },
  { key: 'amount', label: 'Amount', renderExport: (_, row) => getAmount(row) },
  { key: 'status', label: 'Status', accessor: 'status' },
];

export default function SalesTransactionPage({
  type,
  title,
  createLabel,
  endpoint,
  createEndpoint,
  endpointParams,
  emptyText = 'Sorry! No invoices found.',
  settingsMode = 'standard',
  createEnabled = true,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [partyGroupFilter, setPartyGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('filters');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [draftColumns, setDraftColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [settings, setSettings] = useState(settingsMode === 'estimate' ? ESTIMATE_SETTINGS_DEFAULTS : SETTINGS_DEFAULTS);
  const [newCustomField, setNewCustomField] = useState('');
  const [groups, setGroups] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({
    partyName: '',
    outlet: '',
    salesRep: '',
    product: '',
    quantity: 1,
    rate: 0,
    amount: 0,
    vehicleNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { outlets, products, users, routes, warehouses } = useMasterData();

  const defaults = settingsMode === 'estimate' ? ESTIMATE_SETTINGS_DEFAULTS : SETTINGS_DEFAULTS;

  const load = useCallback(async () => {
    if (!endpoint) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(endpoint, { params: { ...(endpointParams || {}), search: search || undefined, status: status || undefined } });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, endpointParams, search, status]);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get(`/sales/settings/${type}`);
      setSettings({ ...defaults, ...(data || {}) });
    } catch {
      setSettings(defaults);
    }
  }, [type, defaults]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => {
    api.get('/parties/groups')
      .then(({ data }) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, []);
  useEffect(() => { setPage(1); }, [search, status, userFilter, routeFilter, warehouseFilter, partyGroupFilter]);

  const filtered = useMemo(() => rows.filter((row) => {
    const blob = JSON.stringify(row).toLowerCase();
    const matchesSearch = !search || blob.includes(search.toLowerCase());
    const matchesUser = !userFilter || getUser(row) === userFilter;
    const routeName = getValue(row, ['route.name', 'outlet.route.name'], '');
    const warehouseName = getValue(row, ['warehouse.name', 'warehouse'], '');
    const groupName = getValue(row, ['group', 'party.group', 'outlet.group'], '');
    const matchesRoute = !routeFilter || routeName === routeFilter;
    const matchesWarehouse = !warehouseFilter || warehouseName === warehouseFilter;
    const matchesGroup = !partyGroupFilter || groupName === partyGroupFilter;
    return matchesSearch && matchesUser && matchesRoute && matchesWarehouse && matchesGroup;
  }), [rows, search, userFilter, routeFilter, warehouseFilter, partyGroupFilter]);

  const usersForFilter = [...new Set(rows.map((row) => getUser(row)).filter((value) => value && value !== '-'))];
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const totalAmount = filtered.reduce((sum, row) => sum + getAmount(row), 0);
  const displayRange = filtered.length ? `${((page - 1) * PAGE_SIZE) + 1} - ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}` : '1 - 0 of 0';

  const setSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const addCustomField = () => {
    const label = newCustomField.trim() || 'Custom Field';
    setSettings((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label, enabled: true }],
    }));
    setNewCustomField('');
  };

  const removeCustomField = (index) => setSettings((prev) => ({
    ...prev,
    customFields: (prev.customFields || []).filter((_, idx) => idx !== index),
  }));

  const saveSettings = async () => {
    try {
      const { data } = await api.put(`/sales/settings/${type}`, settings);
      setSettings({ ...defaults, ...(data || {}) });
      setSettingsOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving settings');
    }
  };

  const openCreate = () => {
    setForm({
      partyName: '',
      outlet: '',
      salesRep: users[0]?._id || '',
      product: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      vehicleNumber: '',
      notes: '',
    });
    setPanelOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && createEnabled) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, createEnabled]);

  const saveCreate = async () => {
    if (!createEndpoint || !createEnabled) {
      setPanelOpen(false);
      return;
    }
    const product = products.find((item) => item._id === form.product);
    const amount = Number(form.amount || (Number(form.quantity || 0) * Number(form.rate || 0))) || 0;
    const item = form.product ? [{
      product: form.product,
      productName: product?.name || '',
      sku: product?.sku || '',
      quantity: Number(form.quantity || 1),
      rate: Number(form.rate || 0),
      gstRate: product?.gstRate || 18,
      amount,
    }] : [];

    const payloads = {
      estimate: { partyName: form.partyName, outlet: form.outlet || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      order: { outlet: form.outlet, salesRep: form.salesRep, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      invoice: { type: 'sales', outlet: form.outlet || undefined, salesRep: form.salesRep || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      challan: { outlet: form.outlet || undefined, vehicleNumber: form.vehicleNumber, items: item.map((entry) => ({ ...entry, unit: product?.unit || '' })), notes: form.notes },
      return: { outlet: form.outlet || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      credit_note: { partyName: form.partyName, outlet: form.outlet || undefined, amount, notes: form.notes },
      purchase_order: { supplier: form.partyName, outlet: form.outlet || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      purchase_invoice: { type: 'purchase', outlet: form.outlet || undefined, salesRep: form.salesRep || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
      purchase_return: { supplier: form.partyName, outlet: form.outlet || undefined, items: item, subtotal: amount, grandTotal: amount, notes: form.notes },
    };

    if (type === 'order' && (!form.outlet || !form.salesRep || !form.product)) {
      alert('Sales order ke liye Outlet, Sales Rep aur Product required hain');
      return;
    }
    if (type === 'purchase_order' && !form.partyName.trim()) {
      alert('Supplier name required');
      return;
    }

    setSaving(true);
    try {
      await api.post(createEndpoint, payloads[type] || payloads.credit_note);
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="so-titlebar">
        <h1 className="so-title">{title}</h1>
        <div className="so-actions">
          <span className="h-7 px-3 rounded-[2px] bg-[#1687d9] text-white text-sm flex items-center">Total : ₹ {totalAmount.toLocaleString('en-IN')}</span>
          <button type="button" onClick={() => setSettingsOpen(true)} className="so-icon-btn !w-[58px] !h-9" title="Settings"><Settings size={18} /></button>
          <button type="button" onClick={() => exportToExcel(filtered, type, buildExportCols())} className="so-btn-secondary text-sm">
            Export As <ChevronDown size={15} />
          </button>
          <button type="button" onClick={openCreate} className="so-btn-primary text-sm">{createLabel}</button>
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={load}><Search size={18} /></button>
        </div>
        <input className="so-input w-[240px]" value="22/06/2026 - 22/06/2026" readOnly />
        <select className="so-input so-select w-[240px]" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
          <option value="">Select User</option>
          {usersForFilter.map((user) => <option key={user} value={user}>{user}</option>)}
        </select>
        <select className="so-input so-select w-[240px]" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Select Status</option>
          {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDraftColumns(visibleColumns);
              setFiltersOpen((open) => !open);
            }}
            className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"
          >
            <Filter size={15} /> Filters
          </button>
          {filtersOpen && (
            <SalesFilterPopover
              activeTab={filterTab}
              setActiveTab={setFilterTab}
              routes={routes || []}
              warehouses={warehouses || []}
              groups={groups}
              routeFilter={routeFilter}
              setRouteFilter={setRouteFilter}
              warehouseFilter={warehouseFilter}
              setWarehouseFilter={setWarehouseFilter}
              partyGroupFilter={partyGroupFilter}
              setPartyGroupFilter={setPartyGroupFilter}
              draftColumns={draftColumns}
              setDraftColumns={setDraftColumns}
              onApply={() => {
                setVisibleColumns(draftColumns);
                setFiltersOpen(false);
              }}
            />
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-[#111827]">
          <span>{displayRange}</span>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronLeft size={14} /></button>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="so-icon-btn !w-10 !h-9 text-[#174bb8] disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div className="so-empty"><p>Loading...</p></div>
      ) : displayed.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-illustration" />
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="so-table-panel">
          <table className="so-table">
            <thead>
              <tr>
                {visibleColumns.transactionNo && <th>Transaction No</th>}
                {visibleColumns.date && <th>Date</th>}
                {visibleColumns.partyName && <th>Party Name</th>}
                {visibleColumns.gstin && <th>GSTIN</th>}
                {visibleColumns.amount && <th className="text-right">Amount</th>}
                {visibleColumns.due && <th className="text-right">Due</th>}
                {visibleColumns.comment && <th>Comment</th>}
                {visibleColumns.createdBy && <th>Created By</th>}
                {visibleColumns.status && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => (
                <tr key={row._id}>
                  {visibleColumns.transactionNo && <td className="font-mono text-xs text-[#174bb8]">{getTransactionNumber(row)}</td>}
                  {visibleColumns.date && <td>{getDate(row) ? new Date(getDate(row)).toLocaleDateString('en-IN') : '-'}</td>}
                  {visibleColumns.partyName && <td>{getParty(row)}</td>}
                  {visibleColumns.gstin && <td>{getGstin(row)}</td>}
                  {visibleColumns.amount && <td className="text-right font-medium">{formatCurrency(getAmount(row))}</td>}
                  {visibleColumns.due && <td className="text-right font-medium">{formatCurrency(getDue(row))}</td>}
                  {visibleColumns.comment && <td>{getComment(row)}</td>}
                  {visibleColumns.createdBy && <td>{getUser(row)}</td>}
                  {visibleColumns.status && <td><span className="so-badge so-badge-info capitalize">{row.status || 'draft'}</span></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={createLabel.replace(/^Create /, 'Create ')}
        width="w-[620px]"
        hideClose
        bodyClassName="p-4"
        headerActions={(
          <>
            <button type="button" onClick={saveCreate} disabled={saving} className="so-btn-primary text-sm min-w-[67px]">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setPanelOpen(false)} className="text-sm px-3">Cancel</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="so-form-section-title">General Details</div>
          <div className="so-form-grid">
            <div>
              <label className="so-label">Party Name</label>
              <input className="so-input w-full" value={form.partyName} onChange={(event) => setForm((prev) => ({ ...prev, partyName: event.target.value }))} placeholder="Name" />
            </div>
            <div>
              <label className="so-label">Outlet</label>
              <select className="so-input so-select w-full" value={form.outlet} onChange={(event) => setForm((prev) => ({ ...prev, outlet: event.target.value }))}>
                <option value="">Select Outlet</option>
                {outlets.map((outlet) => <option key={outlet._id} value={outlet._id}>{outlet.name}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">Sales Rep</label>
              <select className="so-input so-select w-full" value={form.salesRep} onChange={(event) => setForm((prev) => ({ ...prev, salesRep: event.target.value }))}>
                <option value="">Select User</option>
                {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
              </select>
            </div>
            {settings.vehicleNo && (
              <div>
                <label className="so-label">Vehicle No.</label>
                <input className="so-input w-full" value={form.vehicleNumber} onChange={(event) => setForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
              </div>
            )}
            <div>
              <label className="so-label">Item</label>
              <select className="so-input so-select w-full" value={form.product} onChange={(event) => {
                const product = products.find((item) => item._id === event.target.value);
                setForm((prev) => ({ ...prev, product: event.target.value, rate: product?.sellingPrice || product?.rate || 0 }));
              }}>
                <option value="">Select Item</option>
                {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
              </select>
            </div>
            <div>
              <label className="so-label">Quantity</label>
              <input type="number" className="so-input w-full" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="so-label">Rate</label>
              <input type="number" className="so-input w-full" value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="so-label">Amount</label>
              <input type="number" className="so-input w-full" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))} placeholder="Auto from item if blank" />
            </div>
            {(settings.customFields || []).map((field) => (
              <div key={field.label}>
                <label className="so-label">{field.label}</label>
                <input className="so-input w-full" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="so-label">Notes</label>
              <textarea className="so-input w-full" rows={3} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
          </div>
        </div>
      </SlidePanel>

      {settingsOpen && (
        <TransactionSettingsModal
          estimateMode={settingsMode === 'estimate'}
          settings={settings}
          setSetting={setSetting}
          newCustomField={newCustomField}
          setNewCustomField={setNewCustomField}
          addCustomField={addCustomField}
          removeCustomField={removeCustomField}
          onClose={() => setSettingsOpen(false)}
          onSave={saveSettings}
        />
      )}
    </div>
  );
}
