import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, Edit2, Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PRICING_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'markup', label: 'Markup %' },
  { value: 'markdown', label: 'Markdown %' },
];

const emptyForm = {
  name: '',
  notes: '',
  pricingType: 'fixed',
  fixedAmount: 0,
  markupPercent: 0,
  markdownPercent: 0,
  isActive: true,
  items: [],
};

const toNumber = (value) => Number(value || 0);

export default function PriceList() {
  const { user } = useAuth();
  const isFieldReadOnly = ['sales_executive', 'sales_rep'].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [importEnabled, setImportEnabled] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, productRes] = await Promise.all([
        api.get('/inventory/price-lists'),
        api.get('/inventory/items'),
      ]);
      setLists(listRes.data || []);
      setProducts(productRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImportEnabled(false);
    setCreateMode(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && !isFieldReadOnly) {
      openAdd();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isFieldReadOnly]);

  const openEdit = (list) => {
    setEditing(list);
    setForm({
      ...emptyForm,
      ...list,
      items: (list.items || []).map((item) => ({
        ...item,
        product: item.product?._id || item.product || '',
        productName: item.product?.name || item.productName || '',
      })),
    });
    setImportEnabled(false);
    setCreateMode(true);
  };

  const f = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateItem = (index, key, value) => setForm((prev) => ({
    ...prev,
    items: prev.items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
  }));

  const save = async () => {
    if (!form.name) return alert('Price list name is required');
    const payload = {
      ...form,
      fixedAmount: toNumber(form.fixedAmount),
      markupPercent: toNumber(form.markupPercent),
      markdownPercent: toNumber(form.markdownPercent),
      items: form.items.map((item) => ({ ...item, sellingPrice: toNumber(item.sellingPrice), discount: toNumber(item.discount) })),
    };
    try {
      if (editing) await api.put(`/inventory/price-lists/${editing._id}`, payload);
      else await api.post('/inventory/price-lists', payload);
      setCreateMode(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  if (createMode) {
    return (
      <div className="so-module-page bg-white">
        <div className="so-titlebar">
          <h1 className="so-title">Create Price List</h1>
          <div className="so-actions">
            <button type="button" onClick={save} className="so-btn-primary text-sm min-w-[66px]">Save</button>
            <button type="button" onClick={() => setCreateMode(false)} className="min-h-7 px-4 rounded-[3px] bg-[#66717d] text-white text-sm font-semibold">Cancel</button>
          </div>
        </div>

        <div className="grid grid-cols-[39%_61%] min-h-[calc(100vh-107px)] bg-white">
          <div className="px-10 pt-12">
            <div className="grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-7 items-start max-w-[438px]">
              <label className="text-sm text-right pt-2"><span className="text-red-500">*</span> Name:</label>
              <input className="so-input w-full" value={form.name} onChange={(e) => f('name', e.target.value)} />

              <label className="text-sm text-right pt-2">Description:</label>
              <textarea className="so-input w-full min-h-[54px]" value={form.notes || ''} onChange={(e) => f('notes', e.target.value)} />

              <label className="text-sm text-right pt-2"><span className="text-red-500">*</span> Type:</label>
              <select className="so-input so-select w-[157px]" value={form.pricingType} onChange={(e) => f('pricingType', e.target.value)}>
                {PRICING_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <div className="mt-11 border-t border-[#e2e6ef] max-w-[438px] pt-6">
              <button
                type="button"
                onClick={() => setImportEnabled((value) => !value)}
                className="h-[54px] w-full max-w-[405px] bg-[#f0f3fb] rounded-[4px] flex items-center px-6 gap-3 text-base"
              >
                <span className={`so-switch ${importEnabled ? 'so-switch-on' : ''}`} />
                Import price list
              </button>
            </div>
          </div>

          <div className="border-l border-[#e1e5ee] pt-11 pr-4">
            <div className="grid grid-cols-2 text-sm text-[#586174] mb-6 px-0">
              <span>Brand</span>
              <span>Category</span>
            </div>
            <div className="border border-[#d7dce5] min-h-[336px]">
              <table className="so-table">
                <thead>
                  <tr>
                    <th>Items</th>
                    <th>Sell Price</th>
                    <th>Custom Price</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-16 text-[#b5bac4]">No Data</td>
                    </tr>
                  )}
                  {form.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName || products.find((p) => p._id === item.product)?.name || '-'}</td>
                      <td>{item.sellingPrice || '-'}</td>
                      <td><input className="so-input w-full" value={item.sellingPrice || ''} onChange={(e) => updateItem(index, 'sellingPrice', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Price Lists</h1>
        {!isFieldReadOnly && <button type="button" onClick={openAdd} className="so-btn-primary text-sm"><Plus size={15} /> New</button>}
      </div>

      <div className="so-table-panel !mt-2.5 min-h-[445px]">
        <table className="so-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              {!isFieldReadOnly && <th className="w-[64px]"></th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="text-center py-16 text-[#98a2b3]">Loading...</td></tr>}
            {!loading && lists.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="so-empty so-empty-small">
                    <Archive className="so-box-empty-icon" strokeWidth={1.2} />
                    <span>No Data</span>
                  </div>
                </td>
              </tr>
            )}
            {lists.map((list) => (
              <tr key={list._id}>
                <td>{list.name}</td>
                <td>{list.notes || '-'}</td>
                <td className="capitalize">{list.pricingType || 'fixed'}</td>
                {!isFieldReadOnly && <td><button type="button" onClick={() => openEdit(list)} className="so-icon-btn"><Edit2 size={15} /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
