import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, X, Upload, Download } from 'lucide-react';
import api from '../../api/axios';
import SlidePanel from '../../components/common/SlidePanel';
import { exportToExcel } from '../../utils/exportExcel';

const PRICING_TYPES = [
  { value: 'markup', label: 'Markup %' },
  { value: 'markdown', label: 'Markdown %' },
  { value: 'fixed', label: 'Fixed' },
];

const emptyForm = {
  name: '',
  code: '',
  applicableTo: 'all',
  pricingType: 'fixed',
  markupPercent: 0,
  markdownPercent: 0,
  fixedAmount: 0,
  validFrom: '',
  validTo: '',
  isActive: true,
  items: [],
  notes: '',
};

const EXPORT_COLS = [
  { key: 'name', label: 'Name', accessor: 'name' },
  { key: 'code', label: 'Code', accessor: 'code' },
  { key: 'applicableTo', label: 'Applicable To', accessor: 'applicableTo' },
  { key: 'pricingType', label: 'Pricing Type', accessor: 'pricingType' },
  { key: 'markupPercent', label: 'Markup %', accessor: 'markupPercent' },
  { key: 'markdownPercent', label: 'Markdown %', accessor: 'markdownPercent' },
  { key: 'fixedAmount', label: 'Fixed Amount', accessor: 'fixedAmount' },
  { key: 'items', label: 'Items', accessor: 'items', renderExport: (v) => v?.length || 0 },
  { key: 'status', label: 'Status', accessor: 'isActive', renderExport: (v) => v !== false ? 'Active' : 'Inactive' },
];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line) => line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(headers.map((h, idx) => [h, cells[idx] || '']));
  });
};

const toNumber = (value) => Number(value || 0);

const basePriceFor = (product) => toNumber(product?.sellingPrice || product?.purchasePrice || product?.mrp || 0);

const calculatePrice = ({ product, pricingType, markupPercent, markdownPercent, fixedAmount }) => {
  const base = basePriceFor(product);
  if (pricingType === 'markup') return Math.round(base * (1 + toNumber(markupPercent) / 100) * 100) / 100;
  if (pricingType === 'markdown') return Math.round(base * (1 - toNumber(markdownPercent) / 100) * 100) / 100;
  return Math.round(toNumber(fixedAmount || base) * 100) / 100;
};

export default function PriceList() {
  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const importRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([api.get('/inventory/price-lists'), api.get('/inventory/items')]);
      setLists(l.data);
      setProducts(p.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const normalizeItem = (item) => ({
    ...item,
    product: item.product?._id || item.product || '',
    pricingType: item.pricingType || 'fixed',
    markupPercent: item.markupPercent || 0,
    markdownPercent: item.markdownPercent || 0,
    sellingPrice: item.sellingPrice || '',
    discount: item.discount || 0,
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPanelOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...emptyForm, ...l, items: (l.items || []).map(normalizeItem) }); setPanelOpen(true); };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateItem = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const addItem = () => setForm(p => ({
    ...p,
    items: [
      ...p.items,
      {
        product: '',
        productName: '',
        pricingType: p.pricingType,
        markupPercent: p.markupPercent,
        markdownPercent: p.markdownPercent,
        sellingPrice: p.fixedAmount || '',
        discount: 0,
      },
    ],
  }));

  const applyProduct = (i, productId) => {
    const product = products.find(p => p._id === productId);
    setForm(p => ({
      ...p,
      items: p.items.map((it, idx) => idx === i ? {
        ...it,
        product: productId,
        productName: product?.name || '',
        sellingPrice: calculatePrice({
          product,
          pricingType: it.pricingType || p.pricingType,
          markupPercent: it.markupPercent ?? p.markupPercent,
          markdownPercent: it.markdownPercent ?? p.markdownPercent,
          fixedAmount: it.sellingPrice || p.fixedAmount,
        }),
      } : it),
    }));
  };

  const recalcItem = (i, patch = {}) => {
    setForm(p => ({
      ...p,
      items: p.items.map((it, idx) => {
        if (idx !== i) return it;
        const next = { ...it, ...patch };
        const product = products.find(prod => prod._id === next.product);
        return { ...next, sellingPrice: calculatePrice({ product, ...next }) };
      }),
    }));
  };

  const save = async () => {
    if (!form.name) return alert('Price list name is required');
    const payload = {
      ...form,
      markupPercent: toNumber(form.markupPercent),
      markdownPercent: toNumber(form.markdownPercent),
      fixedAmount: toNumber(form.fixedAmount),
      items: form.items.map((item) => ({
        ...item,
        sellingPrice: toNumber(item.sellingPrice),
        discount: toNumber(item.discount),
      })),
    };
    try {
      if (editing) await api.put(`/inventory/price-lists/${editing._id}`, payload);
      else await api.post('/inventory/price-lists', payload);
      setPanelOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCSV(await file.text());
      const grouped = new Map();
      rows.forEach((row) => {
        const name = row.pricelistname || row.name;
        if (!name) return;
        const key = row.code || name;
        const product = products.find((p) =>
          p.sku?.toLowerCase() === row.itemcode?.toLowerCase() ||
          p.name?.toLowerCase() === row.itemname?.toLowerCase()
        );
        const current = grouped.get(key) || {
          name,
          code: row.code,
          applicableTo: row.applicableto || 'all',
          pricingType: row.pricingtype || 'fixed',
          markupPercent: toNumber(row.markuppercent || row.markup),
          markdownPercent: toNumber(row.markdownpercent || row.markdown),
          fixedAmount: toNumber(row.fixedamount || row.fixedprice),
          isActive: !['inactive', 'false', 'no'].includes(String(row.status || '').toLowerCase()),
          items: [],
          notes: row.notes || '',
        };
        if (product || row.itemname) {
          current.items.push({
            product: product?._id,
            productName: product?.name || row.itemname,
            pricingType: row.pricingtype || current.pricingType,
            markupPercent: toNumber(row.markuppercent || row.markup || current.markupPercent),
            markdownPercent: toNumber(row.markdownpercent || row.markdown || current.markdownPercent),
            sellingPrice: toNumber(row.sellingprice || row.price || row.fixedamount || product?.sellingPrice),
            discount: toNumber(row.discount),
          });
        }
        grouped.set(key, current);
      });
      const payload = [...grouped.values()];
      if (!payload.length) return alert('No valid price list rows found');
      const { data } = await api.post('/inventory/price-lists/import', { rows: payload });
      alert(`${data.imported || 0} price lists imported`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Price List</h1>
          <p className="text-xs text-[#757575] mt-0.5">Set markup, markdown, or fixed pricing for customers and channels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => importRef.current?.click()} className="so-btn-secondary flex items-center gap-1.5 text-xs"><Upload size={13} /> Import</button>
          <button onClick={() => exportToExcel(lists, 'price_lists', EXPORT_COLS)} className="so-btn-secondary flex items-center gap-1.5 text-xs"><Download size={13} /> Export</button>
          <button onClick={openAdd} className="so-btn-primary flex items-center gap-1.5"><Plus size={15} /> New Price List</button>
          <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead><tr><th>Name</th><th>Code</th><th>Applicable To</th><th>Method</th><th>Items</th><th>Valid From</th><th>Valid To</th><th>Status</th><th className="w-12"></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="text-center py-10 text-[#9e9e9e]">Loading...</td></tr>}
            {!loading && lists.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-[#9e9e9e]">No price lists created yet</td></tr>}
            {lists.map(l => (
              <tr key={l._id}>
                <td className="font-medium text-[#333]">{l.name}</td>
                <td><span className="font-mono text-xs">{l.code || '-'}</span></td>
                <td className="capitalize">{l.applicableTo?.replace('_', ' ')}</td>
                <td className="capitalize">{l.pricingType || 'fixed'}</td>
                <td>{l.items?.length || 0} items</td>
                <td>{l.validFrom ? new Date(l.validFrom).toLocaleDateString('en-IN') : '-'}</td>
                <td>{l.validTo ? new Date(l.validTo).toLocaleDateString('en-IN') : '-'}</td>
                <td><span className={`so-badge ${l.isActive !== false ? 'so-badge-success' : 'so-badge-danger'}`}>{l.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => openEdit(l)} className="so-icon-btn"><Edit2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Edit Price List' : 'New Price List'} width="w-[720px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="so-label">Name *</label><input className="so-input w-full" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Distributor Price" /></div>
            <div><label className="so-label">Code</label><input className="so-input w-full" value={form.code || ''} onChange={e => f('code', e.target.value)} placeholder="PL-001" /></div>
            <div><label className="so-label">Applicable To</label>
              <select className="so-input w-full" value={form.applicableTo} onChange={e => f('applicableTo', e.target.value)}>
                <option value="all">All</option>
                <option value="customers">Customers</option>
                <option value="distributors">Distributors</option>
                <option value="super_stockers">Super Stockers</option>
              </select>
            </div>
            <div><label className="so-label">Pricing Method</label>
              <select className="so-input w-full" value={form.pricingType} onChange={e => f('pricingType', e.target.value)}>
                {PRICING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="so-label">Markup %</label><input type="number" className="so-input w-full" value={form.markupPercent} onChange={e => f('markupPercent', e.target.value)} min="0" /></div>
            <div><label className="so-label">Markdown %</label><input type="number" className="so-input w-full" value={form.markdownPercent} onChange={e => f('markdownPercent', e.target.value)} min="0" /></div>
            <div><label className="so-label">Fixed Amount</label><input type="number" className="so-input w-full" value={form.fixedAmount} onChange={e => f('fixedAmount', e.target.value)} min="0" /></div>
            <div><label className="so-label">Status</label>
              <select className="so-input w-full" value={form.isActive !== false ? 'active' : 'inactive'} onChange={e => f('isActive', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div><label className="so-label">Valid From</label><input type="date" className="so-input w-full" value={form.validFrom?.slice(0,10) || ''} onChange={e => f('validFrom', e.target.value)} /></div>
            <div><label className="so-label">Valid To</label><input type="date" className="so-input w-full" value={form.validTo?.slice(0,10) || ''} onChange={e => f('validTo', e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="so-label mb-0">Products & Prices</p>
              <button onClick={addItem} className="so-btn-secondary text-xs py-1 px-2 flex items-center gap-1"><Plus size={11} /> Add Product</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {form.items.length === 0 && <p className="text-xs text-[#9e9e9e] text-center py-4">No products added yet</p>}
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_90px_90px_100px_70px_32px] gap-2 items-center">
                  <select className="so-input text-xs" value={it.product} onChange={e => applyProduct(i, e.target.value)}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <select className="so-input text-xs" value={it.pricingType || form.pricingType} onChange={e => recalcItem(i, { pricingType: e.target.value })}>
                    {PRICING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input type="number" className="so-input text-xs" placeholder="Markup" value={it.markupPercent || 0} onChange={e => recalcItem(i, { markupPercent: e.target.value })} />
                  <input type="number" className="so-input text-xs" placeholder="Markdown" value={it.markdownPercent || 0} onChange={e => recalcItem(i, { markdownPercent: e.target.value })} />
                  <input type="number" className="so-input text-xs" placeholder="Price" value={it.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', e.target.value)} />
                  <input type="number" className="so-input text-xs" placeholder="Disc%" value={it.discount} onChange={e => updateItem(i, 'discount', e.target.value)} />
                  <button onClick={() => removeItem(i)} className="so-icon-btn text-red-400 flex-shrink-0"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
          <div><label className="so-label">Notes</label><textarea className="so-input w-full" rows={2} value={form.notes || ''} onChange={e => f('notes', e.target.value)} /></div>
          <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
            <button onClick={save} className="so-btn-primary flex-1">Save Price List</button>
            <button onClick={() => setPanelOpen(false)} className="so-btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
