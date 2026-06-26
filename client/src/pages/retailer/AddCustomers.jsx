import { useState } from 'react';
import { Plus, Upload, Users } from 'lucide-react';

const CHANNEL_LOGOS = [
  { name: 'Shopify', url: 'https://logo.clearbit.com/shopify.com' },
  { name: 'Amazon', url: 'https://logo.clearbit.com/amazon.in' },
  { name: 'WooCommerce', url: 'https://logo.clearbit.com/woocommerce.com' },
  { name: 'Magento', url: 'https://logo.clearbit.com/magento.com' },
  { name: 'Flipkart', url: 'https://logo.clearbit.com/flipkart.com' },
  { name: 'Meesho', url: 'https://logo.clearbit.com/meesho.com' },
];

const loadCustomers = () => JSON.parse(localStorage.getItem('retailerCustomers') || '[]');
const saveCustomers = (customers) => localStorage.setItem('retailerCustomers', JSON.stringify(customers));

export default function AddCustomers() {
  const [customers, setCustomers] = useState(loadCustomers);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'Walk-in' });

  const addCustomer = () => {
    if (!form.name.trim()) return alert('Customer name is required');
    if (!form.phone.trim()) return alert('Phone is required');
    const next = [{ ...form, id: Date.now(), createdAt: new Date().toISOString() }, ...customers];
    setCustomers(next);
    saveCustomers(next);
    setForm({ name: '', phone: '', email: '', source: form.source });
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Add Customers</h1>
        <div className="rounded-[3px] bg-[#eff6ff] px-3 py-2 text-sm font-semibold text-[#174bb8]">{customers.length} Customers</div>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-6">
        <section className="so-table-panel p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[6px] bg-[#174bb8] text-white"><Users size={20} /></div>
            <div>
              <h2 className="text-lg font-semibold text-[#101828]">Customer details</h2>
              <p className="text-sm text-[#667085]">Add customers manually or import from commerce channels.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="so-label">Name</span>
              <input className="so-input w-full" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Customer name" />
            </label>
            <label className="block">
              <span className="so-label">Phone</span>
              <input className="so-input w-full" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="9876543210" />
            </label>
            <label className="block">
              <span className="so-label">Email</span>
              <input className="so-input w-full" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="customer@example.com" />
            </label>
            <label className="block">
              <span className="so-label">Source</span>
              <select className="so-input so-select w-full" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
                <option>Walk-in</option>
                <option>Shopify</option>
                <option>Amazon</option>
                <option>WooCommerce</option>
                <option>Magento</option>
                <option>Flipkart</option>
                <option>Meesho</option>
              </select>
            </label>
            <button type="button" onClick={addCustomer} className="so-btn-primary w-full justify-center">
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="so-table-panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#101828]">
              <Upload size={18} /> E-commerce imports
            </div>
            <div className="grid grid-cols-3 gap-4">
              {CHANNEL_LOGOS.map((channel) => (
                <button key={channel.name} type="button" onClick={() => setForm((prev) => ({ ...prev, source: channel.name }))} className="flex h-[86px] items-center gap-3 rounded-[6px] border border-[#d7dce5] bg-white px-4 text-left hover:border-[#174bb8]">
                  <img src={channel.url} alt={channel.name} className="h-9 w-9 object-contain" />
                  <span className="font-semibold text-[#101828]">{channel.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="so-table-panel">
            <table className="so-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Source</th></tr></thead>
              <tbody>
                {customers.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-[#667085]">No customers added yet.</td></tr>}
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
