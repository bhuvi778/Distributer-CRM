import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, IndianRupee, MapPin, CreditCard, Package, Users,
  TrendingUp, AlertCircle, BarChart3, Eye, Trophy, Clock,
  Factory, HeadphonesIcon, Target, FileText, ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';

// ── Date helpers ─────────────────────────────────────────────────
const fmt = (d) => d.toISOString().slice(0, 10);
const today = fmt(new Date());
const startOfMonth = fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

// ── Stat Card (image style) ───────────────────────────────────────
function DashCard({ label, value, sub, icon: Icon, bg = '#1e88e5', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#e0e0e0] rounded-lg p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg + '20' }}>
        <Icon size={22} style={{ color: bg }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#757575] mb-0.5">{label}</p>
        <p className="text-xl font-bold text-[#333] leading-none">{value}</p>
        {sub !== undefined && <p className="text-xs text-[#9e9e9e] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Quick Statistics sidebar ──────────────────────────────────────
function QuickStats({ items }) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e0e0]">
        <p className="text-xs font-semibold text-[#555] uppercase tracking-wider">Quick Statistics</p>
      </div>
      <div className="divide-y divide-[#f5f5f5]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: item.color + '20' }}>
                <item.icon size={13} style={{ color: item.color }} />
              </div>
              <span className="text-xs text-[#555]">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-[#333]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Date Filter bar ───────────────────────────────────────────────
function DateFilter({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <input type="date" value={from} onChange={e => onChange(e.target.value, to)}
        className="border border-[#e0e0e0] rounded px-2 py-1.5 text-xs text-[#333] bg-white" />
      <span className="text-[#9e9e9e]">—</span>
      <input type="date" value={to} onChange={e => onChange(from, e.target.value)}
        className="border border-[#e0e0e0] rounded px-2 py-1.5 text-xs text-[#333] bg-white" />
    </div>
  );
}

// ── Recent Orders ─────────────────────────────────────────────────
function RecentOrders({ orders }) {
  if (!orders?.length) return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center text-sm text-[#9e9e9e]">No recent orders</div>
  );
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e0e0e0] flex items-center justify-between">
        <p className="text-sm font-semibold text-[#333]">Recent Orders</p>
        <Link to="/app/sales/orders" className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1">
          View all <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="divide-y divide-[#f5f5f5]">
        {orders.map(o => (
          <div key={o._id} className="flex items-center justify-between px-4 py-3 hover:bg-[#fafafa]">
            <div>
              <p className="text-sm font-medium text-[#333]">{o.orderNumber}</p>
              <p className="text-xs text-[#9e9e9e]">{o.outlet?.name || '—'} · {o.salesRep?.name || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(o.grandTotal)}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                o.status === 'delivered' ? 'bg-green-50 text-green-700' :
                o.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROLE DASHBOARDS
// ─────────────────────────────────────────────────────────────────

// ── Admin / Super Admin / Manager ────────────────────────────────
function AdminDashboard({ user, stats, chartData }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'To Collect', value: formatCurrency(s.pendingPayments), icon: CreditCard, color: '#e53935' },
    { label: 'Outstanding', value: formatCurrency(s.outstandingBalance), icon: IndianRupee, color: '#fb8c00' },
    { label: 'Low Stock Items', value: s.lowStockItems || 0, icon: AlertCircle, color: '#e53935' },
    { label: 'Total Products', value: s.totalProducts, icon: Package, color: '#43a047' },
    { label: 'Active Outlets', value: s.totalOutlets, icon: Users, color: '#1e88e5' },
    { label: 'Active Sales Reps', value: s.activeReps || 0, icon: Users, color: '#8e24aa' },
    { label: 'Month Revenue', value: formatCurrency(s.monthRevenue), icon: TrendingUp, color: '#00897b' },
    { label: 'Total Orders', value: s.totalOrders, icon: ShoppingCart, color: '#f4511e' },
  ];

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Today's Orders" value={s.todayOrders} sub="Orders placed today" icon={ShoppingCart} bg="#1e88e5" />
        <DashCard label="Month Revenue" value={formatCurrency(s.monthRevenue)} sub="This month" icon={IndianRupee} bg="#43a047" />
        <DashCard label="Active Outlets" value={s.totalOutlets} sub="Customers & retailers" icon={Users} bg="#8e24aa" />
        <DashCard label="Pending Payments" value={formatCurrency(s.pendingPayments)} sub="To be collected" icon={CreditCard} bg="#fb8c00" />
      </div>

      {/* Main content + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — chart + orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sales chart */}
          {chartData.length > 0 && (
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <p className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                <BarChart3 size={15} className="text-[#1e88e5]" /> Sales Revenue Trend
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9e9e9e' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e0e0e0' }} />
                  <Bar dataKey="revenue" fill="#1e88e5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <RecentOrders orders={stats.recentOrders} />
        </div>

        {/* Right — quick stats */}
        <div>
          <QuickStats items={quickStats} />
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/app/sales/orders" className="so-btn-primary text-center text-sm py-2">+ New Order</Link>
            <Link to="/app/parties/customers" className="so-btn-secondary text-center text-sm py-2">View Customers</Link>
            <Link to="/app/inventory/items" className="so-btn-secondary text-center text-sm py-2">Check Inventory</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sales Executive / Sales Rep ───────────────────────────────────
function SalesDashboard({ user, stats }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'To Collect', value: formatCurrency(s.pendingPayments), icon: CreditCard, color: '#e53935' },
    { label: 'Month Sales', value: formatCurrency(s.monthRevenue), icon: TrendingUp, color: '#43a047' },
    { label: 'Total Orders', value: s.totalOrders, icon: ShoppingCart, color: '#1e88e5' },
    { label: 'My Outlets', value: s.totalOutlets, icon: Users, color: '#8e24aa' },
    { label: 'Today Orders', value: s.todayOrders, icon: ShoppingCart, color: '#fb8c00' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Today's Orders" value={s.todayOrders} icon={ShoppingCart} bg="#1e88e5" />
        <DashCard label="Month Sales" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} bg="#43a047" />
        <DashCard label="To Collect" value={formatCurrency(s.pendingPayments)} icon={CreditCard} bg="#e53935" />
        <DashCard label="My Outlets" value={s.totalOutlets} icon={Users} bg="#8e24aa" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrders orders={stats.recentOrders} />
        </div>
        <div className="space-y-3">
          <QuickStats items={quickStats} />
          <Link to="/app/sales/orders" className="so-btn-primary w-full text-center block py-2 text-sm">+ Take Order</Link>
          <Link to="/app/payments" className="so-btn-secondary w-full text-center block py-2 text-sm">Collect Payment</Link>
        </div>
      </div>
    </div>
  );
}

// ── Retailer ──────────────────────────────────────────────────────
function RetailerDashboard({ user, stats }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'Outstanding Due', value: formatCurrency(s.outstandingBalance), icon: CreditCard, color: '#e53935' },
    { label: 'Credit Limit', value: formatCurrency(s.creditLimit || 0), icon: IndianRupee, color: '#43a047' },
    { label: 'Total Orders', value: s.totalOrders, icon: ShoppingCart, color: '#1e88e5' },
    { label: 'Pending Payments', value: formatCurrency(s.pendingPayments), icon: CreditCard, color: '#fb8c00' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="My Orders" value={s.totalOrders} icon={ShoppingCart} bg="#1e88e5" />
        <DashCard label="Today's Orders" value={s.todayOrders} icon={ShoppingCart} bg="#43a047" />
        <DashCard label="Month Purchases" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} bg="#8e24aa" />
        <DashCard label="Outstanding Due" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} bg="#e53935" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders orders={stats.recentOrders} /></div>
        <div className="space-y-3">
          <QuickStats items={quickStats} />
          <Link to="/app/sales/orders" className="so-btn-primary w-full text-center block py-2 text-sm">+ Place Order</Link>
          <Link to="/app/payments" className="so-btn-secondary w-full text-center block py-2 text-sm">View Payments</Link>
        </div>
      </div>
    </div>
  );
}

// ── Accountant ────────────────────────────────────────────────────
function AccountantDashboard({ stats }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'Pending Approvals', value: s.pendingApprovalCount || 0, icon: AlertCircle, color: '#e53935' },
    { label: 'Total Invoices', value: s.totalInvoices || 0, icon: FileText, color: '#1e88e5' },
    { label: 'Month Revenue', value: formatCurrency(s.monthRevenue), icon: TrendingUp, color: '#43a047' },
    { label: 'Outstanding', value: formatCurrency(s.outstandingBalance), icon: CreditCard, color: '#fb8c00' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Month Revenue" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} bg="#43a047" />
        <DashCard label="Outstanding" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} bg="#fb8c00" />
        <DashCard label="Pending Approvals" value={s.pendingApprovalCount || 0} icon={AlertCircle} bg="#e53935" />
        <DashCard label="Total Invoices" value={s.totalInvoices || 0} icon={FileText} bg="#1e88e5" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders orders={stats.recentOrders} /></div>
        <div className="space-y-3">
          <QuickStats items={quickStats} />
          <Link to="/app/payments" className="so-btn-primary w-full text-center block py-2 text-sm">Review Payments</Link>
          <Link to="/app/invoices" className="so-btn-secondary w-full text-center block py-2 text-sm">Invoices & GST</Link>
        </div>
      </div>
    </div>
  );
}

// ── Manufacturer ──────────────────────────────────────────────────
function ManufacturerDashboard({ stats }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'Active Production', value: s.activeProduction || 0, icon: Factory, color: '#1e88e5' },
    { label: 'Low Stock Items', value: s.lowStockItems || 0, icon: AlertCircle, color: '#e53935' },
    { label: 'Total Products', value: s.totalProducts, icon: Package, color: '#43a047' },
    { label: 'Today Orders', value: s.todayOrders, icon: ShoppingCart, color: '#fb8c00' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Active Production" value={s.activeProduction || 0} icon={Factory} bg="#1e88e5" />
        <DashCard label="Low Stock" value={s.lowStockItems || 0} icon={AlertCircle} bg="#e53935" />
        <DashCard label="Total Products" value={s.totalProducts} icon={Package} bg="#43a047" />
        <DashCard label="Dispatch Orders" value={s.todayOrders} icon={ShoppingCart} bg="#8e24aa" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders orders={stats.recentOrders} /></div>
        <div className="space-y-3">
          <QuickStats items={quickStats} />
          <Link to="/app/production" className="so-btn-primary w-full text-center block py-2 text-sm">Work Orders</Link>
          <Link to="/app/inventory/items" className="so-btn-secondary w-full text-center block py-2 text-sm">Inventory</Link>
        </div>
      </div>
    </div>
  );
}

// ── Distributor ───────────────────────────────────────────────────
function DistributorDashboard({ stats }) {
  const s = stats.stats;
  const quickStats = [
    { label: 'Month Sales', value: formatCurrency(s.monthRevenue), icon: TrendingUp, color: '#43a047' },
    { label: 'My Retailers', value: s.totalOutlets, icon: Users, color: '#1e88e5' },
    { label: 'Outstanding', value: formatCurrency(s.outstandingBalance), icon: CreditCard, color: '#fb8c00' },
    { label: 'Today Orders', value: s.todayOrders, icon: ShoppingCart, color: '#8e24aa' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashCard label="Month Sales" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} bg="#43a047" />
        <DashCard label="My Retailers" value={s.totalOutlets} icon={Users} bg="#1e88e5" />
        <DashCard label="Outstanding" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} bg="#fb8c00" />
        <DashCard label="Today's Orders" value={s.todayOrders} icon={ShoppingCart} bg="#8e24aa" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RecentOrders orders={stats.recentOrders} /></div>
        <QuickStats items={quickStats} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const [dateFrom, setDateFrom] = useState(startOfMonth);
  const [dateTo, setDateTo]   = useState(today);
  const [stats, setStats]       = useState(null);
  const [chartData, setChartData] = useState([]);

  const loadStats = useCallback(() => {
    api.get('/dashboard/stats', { params: { from: dateFrom, to: dateTo } })
      .then(r => setStats(r.data)).catch(console.error);

    if (['super_admin', 'admin', 'manager', 'distributor'].includes(role)) {
      api.get('/dashboard/sales-chart')
        .then(r => setChartData(r.data.map(d => ({
          name: `${String(d._id.month).padStart(2,'0')}/${d._id.year}`,
          revenue: d.revenue,
        })))).catch(console.error);
    }
  }, [dateFrom, dateTo, role]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[#9e9e9e] animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-base font-semibold text-[#333]">
            Dashboard — {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-[#9e9e9e]">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <DateFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
      </div>

      {/* Role-based dashboard */}
      {['super_admin', 'admin', 'manager'].includes(role) && (
        <AdminDashboard user={user} stats={stats} chartData={chartData} />
      )}
      {['sales_executive', 'sales_rep'].includes(role) && (
        <SalesDashboard user={user} stats={stats} />
      )}
      {role === 'retailer' && <RetailerDashboard user={user} stats={stats} />}
      {role === 'accountant' && <AccountantDashboard stats={stats} />}
      {role === 'manufacturer' && <ManufacturerDashboard stats={stats} />}
      {role === 'distributor' && <DistributorDashboard stats={stats} />}
      {['reception', 'employee'].includes(role) && (
        <div className="grid grid-cols-2 gap-3">
          <DashCard label="Support Tickets" value={stats.stats.openTickets || 0} icon={HeadphonesIcon} bg="#1e88e5" />
          <DashCard label="Active Customers" value={stats.stats.totalOutlets} icon={Users} bg="#43a047" />
        </div>
      )}
    </div>
  );
}
