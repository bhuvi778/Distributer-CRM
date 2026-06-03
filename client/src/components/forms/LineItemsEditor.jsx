import { Plus, Trash2 } from 'lucide-react';
import { calcLineItem } from '../../utils/calculations';
import { formatCurrency } from '../../utils/helpers';

export default function LineItemsEditor({ items, products, onChange, showGst = true }) {
  const addItem = () => {
    onChange([...items, { product: '', productName: '', sku: '', quantity: 1, rate: 0, discount: 0, gstRate: 18 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'product') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        updated[index].productName = prod.name;
        updated[index].sku = prod.sku;
        updated[index].rate = prod.sellingPrice;
        updated[index].gstRate = prod.gstRate || 18;
        updated[index].hsnCode = prod.hsnCode;
      }
    }
    onChange(updated);
  };

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const lines = items.map(calcLineItem);
  const subtotal = lines.reduce((s, i) => s + i.amount, 0);
  const taxTotal = lines.reduce((s, i) => s + i.tax, 0);
  const grandTotal = subtotal + taxTotal;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">Products / Line Items</label>
        <button type="button" onClick={addItem} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-surface-100 rounded-xl text-center text-sm text-surface-800/40">
          No products added. Click "Add Product" to select items from catalog.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-surface-50 rounded-xl">
              <div className="col-span-12 sm:col-span-4">
                <label className="text-xs text-surface-800/50 mb-1 block">Product</label>
                <select
                  value={item.product || ''}
                  onChange={(e) => updateItem(index, 'product', e.target.value)}
                  className="input-field !py-2 !text-sm"
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.stock}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-surface-800/50 mb-1 block">Qty</label>
                <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="input-field !py-2 !text-sm" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-surface-800/50 mb-1 block">Rate (₹)</label>
                <input type="number" min="0" value={item.rate} onChange={(e) => updateItem(index, 'rate', Number(e.target.value))} className="input-field !py-2 !text-sm" />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <label className="text-xs text-surface-800/50 mb-1 block">Disc%</label>
                <input type="number" min="0" max="100" value={item.discount || 0} onChange={(e) => updateItem(index, 'discount', Number(e.target.value))} className="input-field !py-2 !text-sm" />
              </div>
              {showGst && (
                <div className="col-span-4 sm:col-span-1">
                  <label className="text-xs text-surface-800/50 mb-1 block">GST%</label>
                  <input type="number" value={item.gstRate || 18} onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value))} className="input-field !py-2 !text-sm" />
                </div>
              )}
              <div className="col-span-8 sm:col-span-1 flex items-end">
                <p className="text-sm font-mono font-medium py-2">{formatCurrency(lines[index]?.amount || 0)}</p>
              </div>
              <div className="col-span-4 sm:col-span-1 flex items-end justify-end">
                <button type="button" onClick={() => removeItem(index)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="w-64 space-y-1 p-4 bg-brand-50 rounded-xl text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>GST/Tax</span><span className="font-mono">{formatCurrency(taxTotal)}</span></div>
            <div className="flex justify-between font-bold text-brand-700 pt-1 border-t border-brand-200">
              <span>Grand Total</span><span className="font-mono">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
