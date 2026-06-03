import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee, ShoppingCart, Users, CreditCard, TrendingUp, Trophy, Calendar,
  Clock, Target, Factory, HeadphonesIcon, FileText, Package, AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { getPortalByRole } from '../config/portals';

const CHART_COLOR = '#0d9488';

function WelcomeHeader({ user, roleMeta, portal, extra }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm text-surface-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-xl font-semibold text-surface-900 mt-0.5">
          {portal?.label || 'Dashboard'} — {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">{roleMeta?.description}</p>
      </div>
      {extra}
    </div>
  );
}

function RecentOrdersTable({ orders }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-800">Recent Orders</h3>
      </div>
      <div className="divide-y divide-surface-100">
        {!orders?.length && <p className="text-sm text-surface-400 text-center py-8">No recent orders</p>}
        {orders?.map((order) => (
          <div key={order._id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-800">{order.orderNumber}</p>
              <p className="text-xs text-surface-500 truncate">{order.outlet?.name} · {order.salesRep?.name}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-sm font-mono font-medium">{formatCurrency(order.grandTotal)}</p>
              <Badge status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesRepDashboard({ user, stats, chartData, leaderboard, attendance, roleMeta, portal }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader
        user={user}
        roleMeta={roleMeta}
        portal={portal}
        extra={user?.assignedRoutes?.length > 0 && (
          <div className="px-3 py-2 bg-white border border-surface-200 rounded-md text-sm">
            <span className="text-surface-500">My Routes: </span>
            <span className="font-medium">{user.assignedRoutes.map((r) => r.name || r).join(', ')}</span>
          </div>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="My Target" value={`${s.myTargetPct || 0}%`} icon={Target} color="accent" />
        <StatCard title="Today's Orders" value={s.todayOrders} icon={ShoppingCart} color="brand" />
        <StatCard title="Month Sales" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} color="purple" />
        <StatCard title="Collections Pending" value={formatCurrency(s.pendingPayments)} icon={CreditCard} color="orange" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/orders" className="btn-primary !py-2 !text-sm">+ Take Order</Link>
        <Link to="/app/payments" className="btn-secondary !py-2 !text-sm">Collect Payment</Link>
        <Link to="/app/attendance" className="btn-secondary !py-2 !text-sm"><Clock size={14} /> Mark Attendance</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrdersTable orders={stats.recentOrders} />
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" /> My Target Progress
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-6">No target assigned yet</p>
          ) : leaderboard.map((item, i) => {
            const rep = item.user || item._id;
            const pct = item.percentage || 0;
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{rep?.name}</span>
                  <span className="font-mono text-accent-700">{pct}%</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-2">
                  <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AccountantDashboard({ user, stats, roleMeta, portal }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader user={user} roleMeta={roleMeta} portal={portal} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Month Revenue" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} color="brand" />
        <StatCard title="Outstanding" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} color="orange" />
        <StatCard title="Pending Approvals" value={s.pendingApprovalCount || 0} icon={AlertCircle} color="accent" />
        <StatCard title="Total Invoices" value={s.totalInvoices || 0} icon={FileText} color="purple" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/payments" className="btn-primary !py-2 !text-sm">Review Payments</Link>
        <Link to="/app/invoices" className="btn-secondary !py-2 !text-sm">Invoices & GST</Link>
        <Link to="/app/reports" className="btn-secondary !py-2 !text-sm">Financial Reports</Link>
      </div>
      <RecentOrdersTable orders={stats.recentOrders} />
    </div>
  );
}

function ManufacturerDashboard({ user, stats, roleMeta, portal }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader user={user} roleMeta={roleMeta} portal={portal} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Active Production" value={s.activeProduction || 0} icon={Factory} color="brand" />
        <StatCard title="Low Stock Items" value={s.lowStockItems || 0} icon={Package} color="orange" />
        <StatCard title="Total Products" value={s.totalProducts} icon={Package} color="accent" />
        <StatCard title="Dispatch Orders" value={s.todayOrders} icon={ShoppingCart} color="purple" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/production" className="btn-primary !py-2 !text-sm">Work Orders</Link>
        <Link to="/app/inventory" className="btn-secondary !py-2 !text-sm">Inventory</Link>
        <Link to="/app/purchases" className="btn-secondary !py-2 !text-sm">Raw Material</Link>
      </div>
      <RecentOrdersTable orders={stats.recentOrders} />
    </div>
  );
}

function ReceptionDashboard({ user, stats, roleMeta, portal }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader user={user} roleMeta={roleMeta} portal={portal} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard title="Active Customers" value={s.totalOutlets} icon={Users} color="brand" />
        <StatCard title="Open Tickets" value={s.openTickets || 0} icon={HeadphonesIcon} color="accent" />
        <StatCard title="Support" value="Active" icon={HeadphonesIcon} color="purple" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/outlets" className="btn-primary !py-2 !text-sm">Customer Lookup</Link>
        <Link to="/app/support" className="btn-secondary !py-2 !text-sm">New Support Ticket</Link>
      </div>
    </div>
  );
}

function RetailerDashboard({ user, stats, roleMeta, portal }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader user={user} roleMeta={roleMeta} portal={portal} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="My Orders" value={s.totalOrders} icon={ShoppingCart} color="brand" />
        <StatCard title="Month Purchases" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} color="accent" />
        <StatCard title="Outstanding Due" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} color="orange" />
        <StatCard title="Today's Orders" value={s.todayOrders} icon={ShoppingCart} color="purple" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/orders" className="btn-primary !py-2 !text-sm">+ Place Order</Link>
        <Link to="/app/payments" className="btn-secondary !py-2 !text-sm">View Payments</Link>
        <Link to="/app/support" className="btn-secondary !py-2 !text-sm">Support</Link>
      </div>
      <RecentOrdersTable orders={stats.recentOrders} />
    </div>
  );
}

function AdminManagerDashboard({ user, stats, chartData, leaderboard, attendance, roleMeta, portal, isManager }) {
  const s = stats.stats;
  return (
    <div>
      <WelcomeHeader user={user} roleMeta={roleMeta} portal={portal} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Month Revenue" value={formatCurrency(s.monthRevenue)} icon={IndianRupee} color="brand" change="+12.5%" changeType="up" />
        <StatCard title="Today's Orders" value={s.todayOrders} icon={ShoppingCart} color="accent" />
        <StatCard title="Active Outlets" value={s.totalOutlets} icon={Users} color="purple" />
        <StatCard title="Outstanding" value={formatCurrency(s.outstandingBalance)} icon={CreditCard} color="orange" />
      </div>
      {!isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard title="Active Sales Reps" value={s.activeReps} icon={Users} color="brand" />
          <StatCard title="Pending Payments" value={formatCurrency(s.pendingPayments)} icon={CreditCard} color="orange" />
        </div>
      )}
      {isManager && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link to="/app/tracking" className="btn-primary !py-2 !text-sm">Live Team Tracking</Link>
          <Link to="/app/payments" className="btn-secondary !py-2 !text-sm">Approve Payments</Link>
          <Link to="/app/targets" className="btn-secondary !py-2 !text-sm">Team Targets</Link>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent-600" /> Sales Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="revenue" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" /> Target Leaderboard
          </h3>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((item, i) => {
              const rep = item.user || item._id;
              const pct = item.percentage || 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded text-xs font-semibold flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-600'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rep?.name || 'Unknown'}</p>
                    <div className="w-full bg-surface-100 rounded-full h-1.5 mt-1">
                      <div className="bg-accent-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono">{pct}%</span>
                </div>
              );
            })}
            {!leaderboard.length && <p className="text-sm text-surface-400 text-center py-4">No data</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrdersTable orders={stats.recentOrders} />
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 flex items-center gap-2">
            <Calendar size={15} className="text-surface-400" />
            <h3 className="text-sm font-semibold text-surface-800">Today's Attendance</h3>
          </div>
          <div className="divide-y divide-surface-100">
            {!attendance.length && <p className="text-sm text-surface-400 text-center py-8">No records today</p>}
            {attendance.map((a) => (
              <div key={a._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{a.user?.name}</p>
                  <p className="text-xs text-surface-500">
                    In: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, roleMeta, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const portal = getPortalByRole(user?.role);
  const role = user?.role;

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(console.error);
    if (['super_admin', 'admin', 'manager', 'distributor'].includes(role)) {
      api.get('/dashboard/sales-chart').then((r) => {
        setChartData(r.data.map((d) => ({ name: `${d._id.month}/${d._id.year}`, revenue: d.revenue, orders: d.count })));
      }).catch(console.error);
    }
    if (['super_admin', 'admin', 'manager', 'sales_rep'].includes(role)) {
      api.get('/dashboard/leaderboard').then((r) => setLeaderboard(r.data)).catch(console.error);
    }
    if (['super_admin', 'admin', 'manager'].includes(role)) {
      api.get('/dashboard/attendance-summary').then((r) => setAttendance(r.data)).catch(console.error);
    }
  }, [role]);

  if (!stats) {
    return <div className="flex items-center justify-center h-64 text-sm text-surface-400">Loading dashboard...</div>;
  }

  const props = { user, stats, chartData, leaderboard, attendance, roleMeta, portal };

  if (role === 'sales_rep') return <SalesRepDashboard {...props} />;
  if (role === 'accountant') return <AccountantDashboard {...props} />;
  if (role === 'manufacturer') return <ManufacturerDashboard {...props} />;
  if (role === 'reception') return <ReceptionDashboard {...props} />;
  if (role === 'retailer') return <RetailerDashboard {...props} />;
  if (role === 'distributor') {
    const s = stats.stats;
    return (
      <div className="bg-white border border-[#e0e0e0] rounded min-h-[calc(100vh-80px)]">
        <div className="px-4 py-3 border-b border-[#e0e0e0]">
          <h1 className="text-base font-semibold text-[#333]">Dashboard</h1>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa]">
            <p className="text-xs text-[#757575]">Month Sales</p>
            <p className="text-lg font-semibold text-[#333] mt-1">{formatCurrency(s.monthRevenue)}</p>
          </div>
          <div className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa]">
            <p className="text-xs text-[#757575]">My Retailers</p>
            <p className="text-lg font-semibold text-[#333] mt-1">{s.totalOutlets}</p>
          </div>
          <div className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa]">
            <p className="text-xs text-[#757575]">Outstanding</p>
            <p className="text-lg font-semibold text-[#333] mt-1">{formatCurrency(s.outstandingBalance)}</p>
          </div>
          <div className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa]">
            <p className="text-xs text-[#757575]">Today&apos;s Orders</p>
            <p className="text-lg font-semibold text-[#333] mt-1">{s.todayOrders}</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <RecentOrdersTable orders={stats.recentOrders} />
        </div>
      </div>
    );
  }

  return <AdminManagerDashboard {...props} isManager={isManager} />;
}
