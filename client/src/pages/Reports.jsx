import { useState, useEffect } from 'react';
import { Download, FileText, IndianRupee, TrendingUp, Users, ShoppingCart, CreditCard, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import { exportToExcel } from '../utils/exportExcel';
import { formatCurrency } from '../utils/helpers';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DESCRIPTION = 'Complete business analytics — revenue trends, top products, outlet-wise outstanding, and section-wise Excel downloads for every module (Orders, Invoices, Payments, Inventory, Outlets).';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [sectionData, setSectionData] = useState({});

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(console.error);
    api.get('/dashboard/sales-chart').then((r) => {
      setChartData(r.data.map((d) => ({
        name: `${d._id.month}/${d._id.year}`,
        revenue: d.revenue,
        orders: d.count,
      })));
    }).catch(console.error);
    api.get('/reports/outstanding').then((r) => setOutstanding(r.data)).catch(console.error);
  }, []);

  const downloadSection = async (key, endpoint, filename, columns) => {
    try {
      let data = sectionData[key];
      if (!data) {
        const { data: res } = await api.get(endpoint);
        data = res;
        setSectionData((prev) => ({ ...prev, [key]: res }));
      }
      exportToExcel(data, filename, columns);
    } catch (err) {
      alert('Failed to export: ' + (err.response?.data?.message || err.message));
    }
  };

  const topProducts = stats?.topProducts?.map((p) => ({
    name: p._id?.substring(0, 25) || 'Unknown',
    revenue: p.revenue,
    qty: p.totalQty,
  })) || [];

  const reportSections = [
    {
      icon: ShoppingCart, title: 'Sales Orders Report', desc: 'All orders with outlet, rep, amount & status',
      action: () => downloadSection('orders', '/orders', 'sales_orders_report', [
        { key: 'no', label: 'Order #', accessor: 'orderNumber' },
        { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
        { key: 'rep', label: 'Sales Rep', accessor: 'salesRep.name' },
        { key: 'total', label: 'Amount', accessor: 'grandTotal' },
        { key: 'status', label: 'Status', accessor: 'status' },
      ]),
    },
    {
      icon: FileText, title: 'GST Invoices Report', desc: 'All invoices with GST breakdown & balance due',
      action: () => downloadSection('invoices', '/invoices', 'gst_invoices_report', [
        { key: 'no', label: 'Invoice #', accessor: 'invoiceNumber' },
        { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
        { key: 'total', label: 'Grand Total', accessor: 'grandTotal' },
        { key: 'paid', label: 'Paid', accessor: 'paidAmount' },
        { key: 'due', label: 'Balance', accessor: 'balanceDue' },
        { key: 'status', label: 'Status', accessor: 'status' },
      ]),
    },
    {
      icon: CreditCard, title: 'Payment Collection Report', desc: 'All collections with mode, status & collector',
      action: () => downloadSection('payments', '/payments', 'payment_collection_report', [
        { key: 'no', label: 'Payment #', accessor: 'paymentNumber' },
        { key: 'outlet', label: 'Outlet', accessor: 'outlet.name' },
        { key: 'amount', label: 'Amount', accessor: 'amount' },
        { key: 'mode', label: 'Mode', accessor: 'mode' },
        { key: 'by', label: 'Collected By', accessor: 'collectedBy.name' },
        { key: 'status', label: 'Status', accessor: 'status' },
      ]),
    },
    {
      icon: Users, title: 'Outlets / Retailers Report', desc: 'All outlets with type, outstanding & credit limit',
      action: () => downloadSection('outlets', '/outlets', 'outlets_retailers_report', [
        { key: 'name', label: 'Name', accessor: 'name' },
        { key: 'code', label: 'Code', accessor: 'code' },
        { key: 'type', label: 'Type', accessor: 'type' },
        { key: 'phone', label: 'Phone', accessor: 'phone' },
        { key: 'outstanding', label: 'Outstanding', accessor: 'outstandingBalance' },
        { key: 'credit', label: 'Credit Limit', accessor: 'creditLimit' },
      ]),
    },
    {
      icon: Package, title: 'Inventory Stock Report', desc: 'Product-wise stock across warehouses',
      action: () => downloadSection('inventory', '/inventory', 'inventory_stock_report', [
        { key: 'product', label: 'Product', accessor: 'product.name' },
        { key: 'sku', label: 'SKU', accessor: 'product.sku' },
        { key: 'warehouse', label: 'Warehouse', accessor: 'warehouse' },
        { key: 'qty', label: 'Quantity', accessor: 'quantity' },
        { key: 'available', label: 'Available', accessor: 'availableQty' },
      ]),
    },
    {
      icon: TrendingUp, title: 'Outstanding Payments Report', desc: 'Outlet-wise dues for collection planning',
      action: () => exportToExcel(outstanding, 'outstanding_payments_report', [
        { key: 'name', label: 'Outlet', accessor: 'name' },
        { key: 'code', label: 'Code', accessor: 'code' },
        { key: 'route', label: 'Route', accessor: 'route.name' },
        { key: 'phone', label: 'Phone', accessor: 'phone' },
        { key: 'outstanding', label: 'Outstanding', accessor: 'outstandingBalance' },
        { key: 'credit', label: 'Credit Limit', accessor: 'creditLimit' },
      ]),
    },
  ];

  return (
    <div>
      <PageHeader title="Business Reports" description={DESCRIPTION} />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Revenue" value={formatCurrency(stats.stats.totalRevenue)} icon={IndianRupee} color="brand" />
          <StatCard title="Total Orders" value={stats.stats.totalOrders} icon={FileText} color="accent" />
          <StatCard title="Outstanding" value={formatCurrency(stats.stats.outstandingBalance)} icon={TrendingUp} color="orange" />
          <StatCard title="Active Outlets" value={stats.stats.totalOutlets} icon={Users} color="purple" />
        </div>
      )}

      {/* Section-wise Excel Downloads */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Download Section Reports (Excel)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportSections.map(({ icon: Icon, title, desc, action }) => (
            <div key={title} className="glass-card p-5 hover:shadow-glow transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 rounded-lg"><Icon size={20} className="text-brand-600" /></div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{title}</h3>
                  <p className="text-xs text-surface-800/50 mt-1 leading-relaxed">{desc}</p>
                  <button onClick={action} className="mt-3 text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
                    <Download size={12} /> Download Excel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Revenue Trend</h3>
            <button onClick={() => exportToExcel(chartData, 'revenue_trend', [
              { key: 'month', label: 'Month', accessor: 'name' },
              { key: 'revenue', label: 'Revenue', accessor: 'revenue' },
              { key: 'orders', label: 'Orders', accessor: 'orders' },
            ])} className="text-xs text-brand-600 flex items-center gap-1"><Download size={12} /> Excel</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Top Products</h3>
            <button onClick={() => exportToExcel(topProducts, 'top_products', [
              { key: 'name', label: 'Product', accessor: 'name' },
              { key: 'revenue', label: 'Revenue', accessor: 'revenue' },
              { key: 'qty', label: 'Qty Sold', accessor: 'qty' },
            ])} className="text-xs text-brand-600 flex items-center gap-1"><Download size={12} /> Excel</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={topProducts} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name?.substring(0, 12)} (${(percent * 100).toFixed(0)}%)`}>
                {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Outlet-wise Outstanding (Distributor / Retailer)</h3>
          <button onClick={() => exportToExcel(outstanding, 'outstanding_outlets', [
            { key: 'name', label: 'Outlet', accessor: 'name' },
            { key: 'code', label: 'Code', accessor: 'code' },
            { key: 'route', label: 'Route', accessor: 'route.name' },
            { key: 'outstanding', label: 'Outstanding', accessor: 'outstandingBalance' },
            { key: 'credit', label: 'Credit Limit', accessor: 'creditLimit' },
          ])} className="btn-secondary !text-xs !py-1.5 !px-3"><Download size={14} /> Export Excel</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Outlet</th>
                <th className="table-header">Code</th>
                <th className="table-header">Route</th>
                <th className="table-header">Phone</th>
                <th className="table-header text-right">Outstanding</th>
                <th className="table-header text-right">Credit Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {outstanding.map((o) => (
                <tr key={o._id} className="hover:bg-surface-50/50">
                  <td className="table-cell font-medium">{o.name}</td>
                  <td className="table-cell">{o.code}</td>
                  <td className="table-cell">{o.route?.name || '-'}</td>
                  <td className="table-cell">{o.phone}</td>
                  <td className="table-cell text-right font-mono font-medium text-red-600">{formatCurrency(o.outstandingBalance)}</td>
                  <td className="table-cell text-right font-mono">{formatCurrency(o.creditLimit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
        <strong>Note on Retailers:</strong> SalesOn mein Retailer, Distributor aur Manufacturer sab ek hi system use karte hain.
        DistriFlow mein bhi aisa hi hai — Outlets section mein type select karo (Retailer / Distributor / Wholesaler).
        Retailer ke liye alag module ki zaroorat nahi, same invoices, orders, payments sab kaam karte hain.
      </div>
    </div>
  );
}
