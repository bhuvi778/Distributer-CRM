import { X } from 'lucide-react';
import Badge from './Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';

function Row({ label, value, mono }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between py-2 border-b border-surface-100 last:border-0 gap-4">
      <span className="text-sm text-surface-800/60 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function DetailModal({ isOpen, onClose, title, data, fields, children }) {
  if (!isOpen || !data) return null;

  const renderValue = (field, val) => {
    if (field.render) return field.render(val, data);
    if (field.type === 'currency') return formatCurrency(val);
    if (field.type === 'date') return formatDate(val);
    if (field.type === 'datetime') return formatDateTime(val);
    if (field.type === 'badge') return <Badge status={val} />;
    if (field.type === 'boolean') return val ? 'Yes' : 'No';
    return val ?? '-';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50/50">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {data.orderNumber && <p className="text-xs text-surface-800/50 font-mono">{data.orderNumber}</p>}
            {data.invoiceNumber && <p className="text-xs text-surface-800/50 font-mono">{data.invoiceNumber}</p>}
            {data.paymentNumber && <p className="text-xs text-surface-800/50 font-mono">{data.paymentNumber}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {fields?.map((f) => {
            const val = f.accessor.split('.').reduce((o, k) => o?.[k], data);
            return (
              <Row key={f.label} label={f.label} value={renderValue(f, val)} mono={f.type === 'currency'} />
            );
          })}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ItemsTable({ items, showGst = false }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2">Line Items</h4>
      <div className="overflow-x-auto rounded-xl border border-surface-100">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold">Product</th>
              <th className="px-3 py-2 text-right text-xs font-semibold">Qty</th>
              <th className="px-3 py-2 text-right text-xs font-semibold">Rate</th>
              {showGst && <th className="px-3 py-2 text-right text-xs font-semibold">GST%</th>}
              <th className="px-3 py-2 text-right text-xs font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{item.productName || item.name || '-'}</td>
                <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.rate)}</td>
                {showGst && <td className="px-3 py-2 text-right">{item.gstRate}%</td>}
                <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
