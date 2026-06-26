import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Edit2, Plus, Search, Settings, Trash2, Upload, X } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { formatCurrency } from '../../utils/helpers';
import { exportToExcel } from '../../utils/exportExcel';
import { useAuth } from '../../context/AuthContext';

const UNITS = ['Pcs', 'Kg', 'G', 'Ltr', 'Ml', 'Box', 'Bag', 'Dozen', 'Carton', 'Meter', 'Pack', 'Nos', 'Case'];
const GST_RATES = [0, 3, 5, 12, 18, 28];
const CESS_RATES = [0, 1, 2, 5, 10, 15];
const ITEM_SETTING_DEFAULTS = {
  showCategory: true,
  showBrand: true,
  showDescription: true,
  showImages: true,
  showMrp: true,
  showPurchasePrice: true,
  showHsn: true,
  showGst: true,
  showCess: true,
  showDiscount: true,
  showOfferText: true,
  showStock: true,
  requireHsn: false,
  autoSku: true,
  defaultUnit: 'Pcs',
  defaultGstRate: 18,
  lowStockThreshold: 10,
};

const emptyForm = () => ({
  name: '',
  sku: '',
  description: '',
  category: '',
  brand: '',
  warehouse: 'Main',
  unit: '',
  mrp: '',
  sellingPrice: '',
  purchasePrice: '',
  discount: '',
  discountType: 'amount',
  offerText: '',
  hsnCode: '',
  gstRate: '',
  cessRate: '',
  taxInclusive: false,
  stock: '',
  minStock: 0,
  images: [],
  isActive: true,
  openingStock: '',
});

const EXPORT_COLS = [
  { key: 'sku', label: 'Item Code', accessor: 'sku' },
  { key: 'name', label: 'Item Name', accessor: 'name' },
  { key: 'category', label: 'Category', accessor: 'category' },
  { key: 'brand', label: 'Brand', accessor: 'brand' },
  { key: 'unit', label: 'Unit', accessor: 'unit' },
  { key: 'sell', label: 'Sell Price', accessor: 'sellingPrice' },
  { key: 'purchase', label: 'Purchase Price', accessor: 'purchasePrice' },
  { key: 'stock', label: 'Stock', accessor: 'stock' },
  { key: 'status', label: 'Status', accessor: 'isActive', renderExport: (v) => (v ? 'Active' : 'Inactive') },
];

function FormSection({ title, children }) {
  return (
    <section className="space-y-7">
      <div className="so-form-section-title">{title}</div>
      <div>{children}</div>
    </section>
  );
}

function CurrencyField({ value, onChange, placeholder }) {
  return (
    <div className="flex">
      <span className="so-input-addon">₹</span>
      <input className="so-input flex-1 rounded-none" type="number" min="0" value={value} onChange={onChange} placeholder={placeholder} />
      <select className="so-input so-select w-[101px] rounded-l-none" defaultValue="excl">
        <option value="excl">Excl. of Tax</option>
        <option value="incl">Incl. of Tax</option>
      </select>
    </div>
  );
}

function SettingSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`so-settings-switch ${checked ? 'so-settings-switch-on' : ''}`}
      aria-pressed={checked}
    />
  );
}

function ItemSettingsModal({ settings, setSettings, saving, onClose, onSave }) {
  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const rows = [
    ['showCategory', 'Category'],
    ['showBrand', 'Brand'],
    ['showDescription', 'Description'],
    ['showImages', 'Images'],
    ['showMrp', 'MRP'],
    ['showPurchasePrice', 'Purchase price'],
    ['showHsn', 'HSN code'],
    ['showGst', 'GST rate'],
    ['showCess', 'Cess rate'],
    ['showDiscount', 'Discount'],
    ['showOfferText', 'Offer text'],
    ['showStock', 'Stock entry'],
    ['requireHsn', 'Make HSN mandatory'],
    ['autoSku', 'Auto-generate item code'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(680px,calc(100vw-32px))] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl">
        <div className="h-[66px] flex items-center justify-between px-5 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">Item Settings</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]">
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {rows.map(([key, label]) => (
              <div key={key} className="so-settings-row">
                <span>{label}</span>
                <SettingSwitch checked={!!settings[key]} onChange={(value) => set(key, value)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[#e5e7eb] pt-5">
            <label>
              <span className="so-label">Default unit</span>
              <select className="so-input so-select w-full" value={settings.defaultUnit || 'Pcs'} onChange={(event) => set('defaultUnit', event.target.value)}>
                {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </label>
            <label>
              <span className="so-label">Default GST %</span>
              <select className="so-input so-select w-full" value={settings.defaultGstRate ?? 18} onChange={(event) => set('defaultGstRate', Number(event.target.value))}>
                {GST_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
            </label>
            <label>
              <span className="so-label">Low stock threshold</span>
              <input className="so-input w-full" type="number" min="0" value={settings.lowStockThreshold ?? 10} onChange={(event) => set('lowStockThreshold', Number(event.target.value || 0))} />
            </label>
          </div>
        </div>
        <div className="h-[66px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[122px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
          <button type="button" onClick={onSave} disabled={saving} className="h-[34px] min-w-[104px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function ItemOptionModal({ type, options, value, saving, onNameChange, onCreate, onDelete, onClose }) {
  const title = type === 'category' ? 'Categories' : 'Brands';
  const label = type === 'category' ? 'Category name' : 'Brand name';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-[min(560px,calc(100vw-32px))] bg-white rounded-[3px] border border-[#d7dce5] shadow-2xl">
        <div className="h-[66px] flex items-center justify-between px-5 border-b border-[#eceff4]">
          <h2 className="text-xl font-semibold text-[#202733]">Manage {title}</h2>
          <button type="button" onClick={onClose} className="text-[#777] hover:text-[#111]">
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex gap-2">
            <input
              className="so-input flex-1"
              value={value}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={label}
              autoFocus
            />
            <button type="button" onClick={onCreate} disabled={saving} className="so-btn-primary text-sm min-w-[96px]">
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto border border-[#e5e7eb]">
            {options.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#667085]">No {title.toLowerCase()} added yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] text-left">
                    <th className="h-11 px-4 font-semibold text-[#101828]">Name</th>
                    <th className="h-11 w-[90px] px-4 font-semibold text-[#101828]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option) => (
                    <tr key={option._id} className="border-t border-[#e5e7eb]">
                      <td className="h-12 px-4 font-medium text-[#101828]">{option.name}</td>
                      <td className="h-12 px-4">
                        <button type="button" onClick={() => onDelete(option)} className="so-icon-btn !h-8 !w-8" title={`Delete ${option.name}`}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="h-[58px] px-5 border-t border-[#d7dce5] bg-[#fafafa] flex items-center justify-end">
          <button type="button" onClick={onClose} className="h-[34px] min-w-[104px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Items() {
  const { user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [settingsDoc, setSettingsDoc] = useState(null);
  const [itemSettings, setItemSettings] = useState(ITEM_SETTING_DEFAULTS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [optionModal, setOptionModal] = useState(null);
  const [optionName, setOptionName] = useState('');
  const [optionSaving, setOptionSaving] = useState(false);
  const imgRef = useRef(null);

  const loadItemOptions = useCallback(async () => {
    const { data } = await api.get('/inventory/item-options');
    const rows = Array.isArray(data) ? data : [];
    setCategories(rows.filter((option) => option.type === 'category'));
    setBrands(rows.filter((option) => option.type === 'brand'));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, whRes, optionRes] = await Promise.all([
        api.get('/inventory/items', {
          params: {
            search: search || undefined,
            status: statusFilter || undefined,
            warehouse: warehouseFilter || undefined,
          },
        }),
        api.get('/inventory/warehouses').catch(() => ({ data: [] })),
        api.get('/inventory/item-options').catch(() => ({ data: [] })),
      ]);
      const data = itemRes.data || [];
      const options = Array.isArray(optionRes.data) ? optionRes.data : [];
      setItems(data);
      setWarehouses(whRes.data || []);
      setCategories(options.filter((option) => option.type === 'category'));
      setBrands(options.filter((option) => option.type === 'brand'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, warehouseFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        setSettingsDoc(data || {});
        setItemSettings({ ...ITEM_SETTING_DEFAULTS, ...(data?.itemSettings || {}) });
      })
      .catch(() => setItemSettings(ITEM_SETTING_DEFAULTS));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm(),
      warehouse: warehouseFilter || 'Main',
      unit: itemSettings.defaultUnit || 'Pcs',
      gstRate: itemSettings.defaultGstRate ?? '',
      minStock: itemSettings.lowStockThreshold ?? 0,
    });
    setPanelOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && !isFieldReadOnly) {
      openAdd();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isFieldReadOnly]);

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...emptyForm(),
      ...item,
      warehouse: warehouseFilter || item.selectedWarehouse || 'Main',
      openingStock: item.stock || '',
    });
    setPanelOpen(true);
  };

  const save = async () => {
    if (!form.name) return alert('Item name is required');
    if (!form.unit) return alert('Unit is required');
    if (!form.sellingPrice) return alert('Sell price is required');
    if (itemSettings.requireHsn && !form.hsnCode) return alert('HSN code is required by item settings');
    setSaving(true);
    try {
      const sku = form.sku || (itemSettings.autoSku ? `ITEM-${Date.now().toString().slice(-6)}` : '');
      const payload = { ...form, sku, stock: Number(form.stock || form.openingStock || 0) };
      delete payload.openingStock;
      if (editing) {
        await api.put(`/inventory/items/${editing._id}`, payload);
      } else {
        await api.post('/inventory/items', {
          ...payload,
          openingStock: Number(form.openingStock || form.stock || 0),
          warehouse: form.warehouse || 'Main',
        });
      }
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    await api.delete(`/inventory/items/${id}`);
    load();
  };

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const openOptionModal = (type) => {
    setOptionModal(type);
    setOptionName('');
  };

  const createOption = async () => {
    const name = optionName.trim();
    if (!name) return alert('Name is required');
    setOptionSaving(true);
    try {
      const { data } = await api.post('/inventory/item-options', { type: optionModal, name });
      await loadItemOptions();
      f(optionModal, data.name);
      setOptionName('');
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving option');
    } finally {
      setOptionSaving(false);
    }
  };

  const deleteOption = async (option) => {
    if (!confirm(`Delete ${option.name}?`)) return;
    setOptionSaving(true);
    try {
      await api.delete(`/inventory/item-options/${option._id}`);
      if (form[option.type] === option.name) f(option.type, '');
      await loadItemOptions();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting option');
    } finally {
      setOptionSaving(false);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - (form.images || []).length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm((prev) => ({ ...prev, images: [...(prev.images || []), ev.target.result].slice(0, 5) }));
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (idx) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const saveItemSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload = { ...(settingsDoc || {}), itemSettings };
      const { data } = await api.put('/settings', payload);
      setSettingsDoc(data);
      setItemSettings({ ...ITEM_SETTING_DEFAULTS, ...(data?.itemSettings || itemSettings) });
      setSettingsOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving item settings');
    } finally {
      setSettingsSaving(false);
    }
  };
  const totalCount = items.length;

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Items</h1>
        <div className="so-actions">
          {!isFieldReadOnly && <button type="button" onClick={() => setSettingsOpen(true)} className="so-icon-btn !w-[46px] !h-7" title="Settings"><Settings size={16} /></button>}
          <button type="button" onClick={() => exportToExcel(items, 'items', EXPORT_COLS)} className="so-btn-secondary text-sm"><Download size={15} /> Export</button>
          {!isFieldReadOnly && (
            <>
              <button type="button" className="so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Upload size={15} /> Import</button>
              <button type="button" onClick={openAdd} className="so-btn-primary text-sm"><Plus size={15} /> New</button>
            </>
          )}
        </div>
      </div>

      <div className="so-filterbar">
        <div className="so-search-group">
          <input className="so-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
          <button type="button" className="so-search-button" onClick={load}><Search size={21} /></button>
        </div>
        <div className="flex-1" />
        <select className="so-input so-select w-[192px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="so-input so-select w-[192px]" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">Select Warehouse</option>
          <option value="Main">Main Warehouse</option>
          {warehouses.map((w) => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
        <div className="ml-14 flex items-center gap-3 text-sm text-[#111827]">
          <span>1 - {totalCount} of {totalCount}</span>
          <button type="button" className="so-icon-btn !w-10 !h-9 text-[#174bb8] text-base">‹</button>
          <button type="button" className="so-icon-btn !w-10 !h-9 text-[#174bb8] text-base">›</button>
        </div>
      </div>

      <div className="so-content-area">
        {loading ? (
          <div className="so-table-panel so-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-illustration" />
            <p>Sorry! No items found.</p>
          </div>
        ) : (
          <div className="so-table-panel">
            <table className="so-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  {itemSettings.showCategory && <th>Category</th>}
                  {itemSettings.showBrand && <th>Brand</th>}
                  <th>Stock</th>
                  <th>Purchase Price</th>
                  {!isFieldReadOnly && <th className="w-24"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.sku || '-'}</td>
                    <td className="font-medium">{item.name}</td>
                    {itemSettings.showCategory && <td>{item.category || '-'}</td>}
                    {itemSettings.showBrand && <td>{item.brand || '-'}</td>}
                    <td>{item.stock ?? 0} {item.unit}</td>
                    <td>{item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'}</td>
                    {!isFieldReadOnly && (
                      <td>
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openEdit(item)} className="so-icon-btn"><Edit2 size={15} /></button>
                          <button type="button" onClick={() => remove(item._id)} className="so-icon-btn"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Items' : 'Create Items'}
        width="w-[592px]"
        hideClose
        bodyClassName="p-3"
        headerActions={(
          <>
            <button type="button" onClick={save} disabled={saving} className="so-btn-primary text-sm min-w-[67px]">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setPanelOpen(false)} className="text-sm px-3">Cancel</button>
          </>
        )}
      >
        <div className="space-y-8">
          <FormSection title="General Details">
            <div className="space-y-3 px-3">
              <div className="grid grid-cols-[1fr_134px] gap-3 items-end">
                <div>
                  <label className="so-label">Item Name<span className="text-red-500">*</span></label>
                  <input className="so-input w-full" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Name of item" />
                </div>
                <button type="button" onClick={() => f('isActive', !form.isActive)} className="flex items-center gap-2 h-8 text-sm">
                  <span className={`so-switch ${form.isActive ? 'so-switch-on' : ''}`} />
                  Activate item
                </button>
              </div>

              <div className="so-form-grid">
                <div>
                  <label className="so-label">Unit<span className="text-red-500">*</span></label>
                  <select className="so-input so-select w-full" value={form.unit} onChange={(e) => f('unit', e.target.value)}>
                    <option value="">Select Unit</option>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="so-label">Sell price<span className="text-red-500">*</span></label>
                  <CurrencyField value={form.sellingPrice} onChange={(e) => f('sellingPrice', e.target.value)} placeholder="Sale-price" />
                </div>
              </div>

              <div className="so-form-grid">
                <div>
                  <label className="so-label">Item Code</label>
                  <input className="so-input w-full" value={form.sku} onChange={(e) => f('sku', e.target.value)} placeholder="Item code" />
                </div>
                {itemSettings.showDescription && <div>
                  <label className="so-label">Item Description</label>
                  <textarea className="so-input w-full min-h-[72px]" value={form.description} onChange={(e) => f('description', e.target.value)} placeholder="Item description" />
                </div>}
              </div>

              {(itemSettings.showCategory || itemSettings.showBrand) && <div className="so-form-grid">
                {itemSettings.showCategory && <div>
                  <label className="so-label flex justify-between">
                    <span>Category</span>
                    <button type="button" onClick={() => openOptionModal('category')} className="text-[#0057ff]">+ New</button>
                  </label>
                  <select className="so-input so-select w-full" value={form.category} onChange={(e) => f('category', e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}
                  </select>
                </div>}
                {itemSettings.showBrand && <div>
                  <label className="so-label flex justify-between">
                    <span>Brand</span>
                    <button type="button" onClick={() => openOptionModal('brand')} className="text-[#0057ff]">+ New</button>
                  </label>
                  <select className="so-input so-select w-full" value={form.brand} onChange={(e) => f('brand', e.target.value)}>
                    <option value="">Select Brand</option>
                    {brands.map((brand) => <option key={brand._id} value={brand.name}>{brand.name}</option>)}
                  </select>
                </div>}
              </div>}

              {itemSettings.showImages && <div>
                <label className="so-label">Upload images</label>
                <div className="flex gap-3">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const image = form.images?.[idx];
                    return (
                      <button key={idx} type="button" onClick={() => (image ? undefined : imgRef.current?.click())} className="so-image-slot overflow-hidden">
                        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <Plus size={46} strokeWidth={1.5} />}
                        <span className="so-image-slot-remove" onClick={(e) => { e.stopPropagation(); if (image) removeImage(idx); }}>×</span>
                      </button>
                    );
                  })}
                  <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </div>}
            </div>
          </FormSection>

          <FormSection title="Price Details">
            <div className="space-y-3 px-3">
              {(itemSettings.showMrp || itemSettings.showPurchasePrice) && <div className="so-form-grid">
                {itemSettings.showMrp && <div>
                  <label className="so-label">MRP</label>
                  <input type="number" min="0" className="so-input w-full" value={form.mrp} onChange={(e) => f('mrp', e.target.value)} placeholder="MRP" />
                </div>}
                {itemSettings.showPurchasePrice && <div>
                  <label className="so-label">Purchase price</label>
                  <CurrencyField value={form.purchasePrice} onChange={(e) => f('purchasePrice', e.target.value)} placeholder="Purchase-price" />
                </div>}
              </div>}
              {(itemSettings.showHsn || itemSettings.showGst || itemSettings.showCess) && <div className="grid grid-cols-3 gap-3">
                {itemSettings.showHsn && <div>
                  <label className="so-label">HSN Code{itemSettings.requireHsn && <span className="text-red-500">*</span>}</label>
                  <input className="so-input w-full" value={form.hsnCode} onChange={(e) => f('hsnCode', e.target.value)} placeholder="HSN code" />
                </div>}
                {itemSettings.showGst && <div>
                  <label className="so-label">GST %</label>
                  <select className="so-input so-select w-full" value={form.gstRate} onChange={(e) => f('gstRate', e.target.value)}>
                    <option value="">Select Tax</option>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>}
                {itemSettings.showCess && <div>
                  <label className="so-label">Cess %</label>
                  <select className="so-input so-select w-full" value={form.cessRate} onChange={(e) => f('cessRate', e.target.value)}>
                    <option value="">Select Cess</option>
                    {CESS_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>}
              </div>}
              {(itemSettings.showDiscount || itemSettings.showOfferText) && <div className="so-form-grid">
                {itemSettings.showDiscount && <div>
                  <label className="so-label">Discount</label>
                  <div className="flex">
                    <input type="number" min="0" className="so-input flex-1 rounded-r-none" value={form.discount} onChange={(e) => f('discount', e.target.value)} placeholder="Discount" />
                    <select className="so-input so-select w-[83px] rounded-l-none" value={form.discountType} onChange={(e) => f('discountType', e.target.value)}>
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                </div>}
                {itemSettings.showOfferText && <div>
                  <label className="so-label">Offer text</label>
                  <input className="so-input w-full" value={form.offerText} onChange={(e) => f('offerText', e.target.value)} placeholder="Show offer" />
                </div>}
              </div>}
            </div>
          </FormSection>

          {itemSettings.showStock && <FormSection title="Stock Details">
            <div className="px-3 max-w-[264px]">
              <label className="so-label">Stock</label>
              <input type="number" min="0" className="so-input w-full" value={editing ? form.stock : form.openingStock} onChange={(e) => (editing ? f('stock', e.target.value) : f('openingStock', e.target.value))} placeholder="Stock" />
            </div>
          </FormSection>}
        </div>
      </SlidePanel>
      {settingsOpen && (
        <ItemSettingsModal
          settings={itemSettings}
          setSettings={setItemSettings}
          saving={settingsSaving}
          onClose={() => setSettingsOpen(false)}
          onSave={saveItemSettings}
        />
      )}
      {optionModal && (
        <ItemOptionModal
          type={optionModal}
          options={optionModal === 'category' ? categories : brands}
          value={optionName}
          saving={optionSaving}
          onNameChange={setOptionName}
          onCreate={createOption}
          onDelete={deleteOption}
          onClose={() => setOptionModal(null)}
        />
      )}
    </div>
  );
}
