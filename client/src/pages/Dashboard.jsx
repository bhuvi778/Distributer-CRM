import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CreditCard,
  Download,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Sparkles,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';
import api from '../api/axios';
import useMasterData from '../hooks/useMasterData';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/exportExcel';

const fmt = (date) => date.toISOString().slice(0, 10);
const today = fmt(new Date());

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-GB');
};

const formatMoney = (value) => `₹ ${Number(value || 0).toLocaleString('en-IN')}`;

function StatusTile({ title, value, subValue, icon: Icon, color, to, active }) {
  return (
    <Link
      to={to}
      className={`flex h-[132px] items-center justify-between rounded-[12px] bg-white px-5 py-4 text-slate-900 no-underline shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.13)] ${
        active ? 'border-b-[3px] border-[#174bb8]' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="text-[16px] font-semibold text-[#2b2f36]">{title}</div>
        <div className="mt-1 text-[19px] font-medium text-[#020617]">{value}</div>
        <div className="mt-3 text-[15px] text-[#17406b]">{subValue}</div>
      </div>
      <div className="flex h-[69px] w-[69px] items-center justify-center rounded-[8px]" style={{ background: color }}>
        <Icon size={33} className="text-white" strokeWidth={1.9} />
      </div>
    </Link>
  );
}

function QuickRow({ label, value, icon: Icon, color, to }) {
  return (
    <Link
      to={to}
      className="flex min-h-[62px] items-center justify-between px-4 text-slate-900 no-underline transition hover:bg-[#f8fafc]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[8px]" style={{ background: color }}>
          <Icon size={22} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-medium">{label}</span>
      </div>
      <span className="text-[15px] font-semibold text-[#ff3038]">{value}</span>
    </Link>
  );
}

function QuickStats({ stats }) {
  const items = [
    { label: 'To collect', value: Number(stats.pendingPayments || 0), icon: CreditCard, color: '#13c996', to: '/app/payments/in' },
    { label: 'To pay', value: Number(stats.toPay || 0), icon: CreditCard, color: '#8781df', to: '/app/payments/out' },
    { label: 'Low Stock Count', value: Number(stats.lowStockItems || 0), icon: Package, color: '#e84d3d', to: '/app/inventory/items' },
    { label: 'Stock Value', value: Number(stats.stockValue || 0), icon: ShoppingCart, color: '#f59e0b', to: '/app/inventory/items' },
    { label: 'Product Count', value: Number(stats.totalProducts || 0), icon: Tag, color: '#20bfdb', to: '/app/inventory/items' },
    { label: 'Party Count', value: Number(stats.totalOutlets || 0), icon: Users, color: '#13c996', to: '/app/parties/customers' },
  ];

  return (
    <aside className="overflow-hidden rounded-[12px] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
      <div className="h-[70px] bg-[#fafafa] px-5 py-5 text-[18px] font-medium text-[#101828]">Quick Statistics</div>
      <div className="py-2">
        {items.map((item) => (
          <QuickRow key={item.label} {...item} />
        ))}
      </div>
    </aside>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { users } = useMasterData();
  const [stats, setStats] = useState(null);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedUser, setSelectedUser] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);
  const [refillState, setRefillState] = useState(() => ({
    autoRefill: localStorage.getItem('autoRefill') === 'true',
    credits: Number(localStorage.getItem('refillCredits') || 25),
  }));

  const loadStats = useCallback(() => {
    api.get('/dashboard/stats', { params: { from: dateFrom, to: dateTo, user: selectedUser || undefined } })
      .then((response) => setStats(response.data?.stats || response.data || {}))
      .catch(() => setStats({}));
  }, [dateFrom, dateTo, selectedUser]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const s = stats || {};
  const dateRange = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
  const showRetailerTools = ['retailer', 'distributor', 'super_admin'].includes(user?.role);
  const exportDashboard = () => {
    exportToExcel([
      { metric: 'Orders', value: s.totalOrders || s.todayOrders || 0 },
      { metric: 'Invoices', value: s.totalInvoices || 0 },
      { metric: 'Payment In', value: s.pendingPayments || 0 },
      { metric: 'Products', value: s.totalProducts || 0 },
      { metric: 'Parties', value: s.totalOutlets || 0 },
      { metric: 'Outstanding', value: s.outstandingBalance || 0 },
    ], 'dashboard-summary', [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ]);
  };
  const toggleAutoRefill = () => {
    const next = !refillState.autoRefill;
    setRefillState((prev) => ({ ...prev, autoRefill: next }));
    localStorage.setItem('autoRefill', String(next));
  };
  const addCredits = () => {
    setRefillState((prev) => {
      const credits = prev.credits + 25;
      localStorage.setItem('refillCredits', String(credits));
      return { ...prev, credits };
    });
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#eef1f5] px-3 py-4">
      <style>
        {`
          .whatsapp-float,
          .whatsapp_float,
          .wa-widget,
          .floating-whatsapp,
          iframe[src*="whatsapp"] {
            display: none !important;
          }
        `}
      </style>

      <div className="mb-5 flex items-center justify-end gap-4">
        <button type="button" onClick={exportDashboard} className="so-btn-secondary text-sm">
          <Download size={15} /> Export
        </button>
        <input
          className="h-10 w-[278px] border border-[#cfd6df] bg-white px-3 text-[17px] text-[#344054] outline-none"
          value={dateRange}
          onChange={(event) => {
            const [from, to] = event.target.value.split('-').map((part) => part.trim());
            if (from && to) {
              const [fd, fm, fy] = from.split('/');
              const [td, tm, ty] = to.split('/');
              setDateFrom(`${fy}-${fm}-${fd}`);
              setDateTo(`${ty}-${tm}-${td}`);
            }
          }}
        />
        <select
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
          className="h-10 w-[172px] border border-[#cfd6df] bg-white px-3 text-[15px] text-slate-500 outline-none"
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>{user.name}</option>
          ))}
        </select>
      </div>

      {showRetailerTools && (
        <section className="mb-6 grid grid-cols-4 gap-5">
          <div className="rounded-[12px] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
            <div className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[#101828]">
              <Sparkles size={18} className="text-[#174bb8]" /> Customer Life Cycle
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-[#475467]">
              {['Lead', 'First Buy', 'Repeat', 'Loyal'].map((step, index) => (
                <div key={step} className={`rounded-[4px] px-2 py-3 ${index < 2 ? 'bg-[#dbeafe] text-[#174bb8]' : 'bg-[#f1f5f9]'}`}>{step}</div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setDemoOpen(true)} className="rounded-[12px] bg-white p-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.13)]">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#174bb8] text-white"><CalendarCheck size={19} /></div>
            <div className="text-[16px] font-semibold text-[#101828]">Book a Demo</div>
            <div className="mt-1 text-sm text-[#667085]">Schedule walkthrough for campaigns and customer tools.</div>
          </button>
          <button type="button" onClick={toggleAutoRefill} className="rounded-[12px] bg-white p-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
            <div className="mb-2 flex items-center justify-between">
              <RefreshCw size={22} className="text-[#0f766e]" />
              <span className={`so-settings-switch ${refillState.autoRefill ? 'so-settings-switch-on' : ''}`} />
            </div>
            <div className="text-[16px] font-semibold text-[#101828]">Auto Refill</div>
            <div className="mt-1 text-sm text-[#667085]">{refillState.autoRefill ? 'Enabled' : 'Disabled'}</div>
          </button>
          <button type="button" onClick={addCredits} className="rounded-[12px] bg-white p-5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
            <div className="text-[16px] font-semibold text-[#101828]">Refill Credits</div>
            <div className="mt-2 text-3xl font-semibold text-[#174bb8]">{refillState.credits}</div>
            <div className="mt-1 text-sm text-[#667085]">Click to add 25 credits</div>
          </button>
        </section>
      )}

      <div className="grid grid-cols-[1fr_380px] gap-10">
        <section>
          <div className="grid grid-cols-4 gap-9">
            <StatusTile
              active
              title="Order"
              value={formatMoney(s.totalOrdersAmount || s.orderAmount || 0)}
              subValue={Number(s.totalOrders || s.todayOrders || 0)}
              icon={IndianRupee}
              color="#13c996"
              to="/app/sales/orders"
            />
            <StatusTile
              title="Invoice"
              value={formatMoney(s.totalInvoicesAmount || s.invoiceAmount || 0)}
              subValue={Number(s.totalInvoices || 0)}
              icon={IndianRupee}
              color="#ff8508"
              to="/app/sales/invoices"
            />
            <StatusTile
              title="Visited"
              value={Number(s.visitedCount || s.visited || 0)}
              subValue=""
              icon={MapPin}
              color="#3863ff"
              to="/app/parties/visited"
            />
            <StatusTile
              title="Payment In"
              value={formatMoney(s.pendingPayments || 0)}
              subValue={Number(s.paymentInCount || 0)}
              icon={CreditCard}
              color="#13c996"
              to="/app/payments/in"
            />
          </div>
        </section>

        <QuickStats stats={s} />
      </div>

      {!stats && (
        <div className="mt-12 text-center text-sm text-slate-500">Loading dashboard...</div>
      )}

      <Modal isOpen={demoOpen} onClose={() => setDemoOpen(false)} title="Book a Demo" size="md">
        <div className="space-y-4">
          <input className="so-input w-full" defaultValue={user?.name || ''} placeholder="Name" />
          <input className="so-input w-full" defaultValue={user?.email || ''} placeholder="Email" />
          <select className="so-input so-select w-full" defaultValue="Customer growth suite">
            <option>Customer growth suite</option>
            <option>Inventory and routes</option>
            <option>Payments and reports</option>
          </select>
          <button type="button" onClick={() => { alert('Demo request saved'); setDemoOpen(false); }} className="so-btn-primary w-full justify-center">
            Confirm Demo Request
          </button>
        </div>
      </Modal>
    </div>
  );
}
