import { useMemo, useState } from 'react';
import {
  Box, CalendarDays, CreditCard, FileText, Filter, Menu, Package, ShoppingCart, Users, X,
} from 'lucide-react';

const reportGroups = [
  {
    title: 'Transaction',
    icon: FileText,
    reports: ['All Transaction'],
  },
  {
    title: 'Sales',
    icon: CreditCard,
    reports: [
      'Sales By Party',
      'Item Sales By User',
      'Sales By User',
      'Sales By Route',
      'Sales By Item',
      'Sales By Category',
      'Sales By Brand',
      'Order Fulfillment',
      'Order Fulfillment By Item',
      'Van Sales By Item',
      'Van Sales Reconciliation By Item',
    ],
  },
  {
    title: 'Item',
    icon: Box,
    reports: ['Stock Summary', 'Item details', 'Rate List', 'Stock Adjustment', 'Low Stock Summary', 'Stock Summary By Brand', 'Stock Summary By Category'],
  },
  {
    title: 'GST',
    icon: Package,
    reports: ['GSTR-1', 'GSTR-2', 'E-Invoice'],
  },
  {
    title: 'Party',
    icon: Users,
    reports: [
      'Party Wise Outstanding',
      'Customer Statement',
      'Party Statement',
      'Distributor Statement',
      'Supplier Statement',
      'Party Last Visited',
      'Party Visited',
      'Party Not Visited',
      'Party Added By User',
      'Party Transaction by Item',
    ],
  },
  {
    title: 'Purchase',
    icon: ShoppingCart,
    reports: ['Purchase By Party', 'Purchase By Item', 'Purchase By Brand'],
  },
  {
    title: 'Payment',
    icon: CreditCard,
    reports: ['Payment Received', 'Payment Detail', 'Payment Received By User', 'Payment Received By Party', 'Payment Made', 'Expenses', 'Expense Detail'],
  },
  {
    title: 'Production',
    icon: Box,
    reports: ['Production Detail By Item', 'Production Raw Materials'],
  },
  {
    title: 'User',
    icon: Users,
    reports: ['User Summary', 'Attendance', 'Activity Log'],
  },
  {
    title: 'Delivery',
    icon: Package,
    reports: ['All Shipment'],
  },
  {
    title: 'Primary',
    icon: Box,
    reports: ['Sales By Item'],
  },
];

const reportColumns = {
  'Payment Received': ['Payment No', 'Discount', 'Amount', 'Collected By'],
  'All Transaction': ['Date', 'Transaction No', 'Party Name', 'Amount', 'Status'],
  Attendance: ['Name', 'In', 'Out', 'Working hrs', 'Comment'],
  'User Summary': ['User Name', 'Mobile', 'Email', 'Role', 'Status'],
};

function BoxEmpty() {
  return (
    <div className="so-empty so-empty-small min-h-[205px]">
      <svg className="so-box-empty-icon" viewBox="0 0 64 48" fill="none" aria-hidden="true">
        <path d="M15 17L24 7H40L49 17V38H15V17Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M15 17H27L30 22H35L38 17H49" stroke="currentColor" strokeWidth="1.7" />
        <ellipse cx="32" cy="41" rx="23" ry="4" fill="currentColor" opacity="0.18" />
      </svg>
      <span>No Data</span>
    </div>
  );
}

function ReportMenu({ selected, onSelect }) {
  const [search, setSearch] = useState('');
  const groups = useMemo(() => reportGroups.map((group) => ({
    ...group,
    reports: group.reports.filter((report) => report.toLowerCase().includes(search.toLowerCase())),
  })).filter((group) => group.reports.length), [search]);

  return (
    <div className="w-[344px] bg-white border-r border-[#d7dce5] shadow-xl max-h-[665px] overflow-y-auto">
      <div className="p-2">
        <input className="so-input w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
      </div>
      {groups.map((group) => (
        <div key={group.title}>
          <div className="h-[43px] px-4 bg-[#f2f5fb] border border-[#d7dce5] flex items-center text-base">{group.title}</div>
          {group.reports.map((report) => (
            <button
              key={report}
              type="button"
              onClick={() => onSelect(report)}
              className={`block w-full h-[43px] pl-8 pr-4 text-left border-b border-dashed border-[#d7dce5] text-base ${selected === report ? 'text-[#174bb8] font-semibold' : 'text-[#697080]'}`}
            >
              {report}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function ReportsLanding({ onSelect }) {
  return (
    <div className="so-module-page bg-white">
      <div className="so-titlebar">
        <h1 className="so-title">Reports</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-14 px-8 py-10">
        {reportGroups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title} className="min-h-[146px]">
              <div className="flex items-center gap-3 mb-5">
                <Icon size={20} strokeWidth={1.55} className="text-[#303030]" />
                <h2 className="text-[21px] font-normal text-[#222]">{group.title}</h2>
              </div>
              <div>
                {group.reports.map((report) => (
                  <button
                    key={report}
                    type="button"
                    onClick={() => onSelect(report)}
                    className="block w-full h-[52px] text-left px-3 border-b border-dashed border-[#d7dce5] text-[#0070d9] text-lg"
                  >
                    {report}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ReportDetail({ selected, setSelected, goBack }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const columns = reportColumns[selected] || ['Date', 'Party Name', 'Item Name', 'Quantity', 'Amount', 'Status'];

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Reports</h1>
        <div className="so-actions">
          <div className="relative h-[38px] w-[380px]">
            <input className="so-input h-full w-full pr-10" value="22/06/2026 - 22/06/2026" readOnly />
            <CalendarDays size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b6bcc6]" />
          </div>
          <button type="button" className="so-btn-secondary text-sm">Export As</button>
        </div>
      </div>

      <div className="so-filterbar">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} className="h-[42px] w-[42px] rounded-[3px] border border-[#174bb8] bg-[#eef4ff] text-[#174bb8] inline-flex items-center justify-center shadow-[0_0_0_2px_rgba(23,75,184,0.16)]">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <button type="button" onClick={goBack} className="text-[#0070d9] text-base">All Reports</button>
        <span className="text-[#a6adbb]">›</span>
        <span className="text-base text-[#111827]">{selected}</span>
        <span className="text-[#a6adbb]">|</span>
        <button type="button" className="ml-auto so-btn-secondary border-[#174bb8] text-[#174bb8] text-sm"><Filter size={15} /> Filters</button>
      </div>

      <div className="flex">
        {menuOpen && <ReportMenu selected={selected} onSelect={(report) => { setSelected(report); setMenuOpen(false); }} />}
        <div className="flex-1">
          <div className="so-table-panel !mt-3 min-h-[560px]">
            <table className="so-table">
              <thead>
                <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length}><BoxEmpty /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [selected, setSelected] = useState('');

  if (!selected) return <ReportsLanding onSelect={setSelected} />;
  return <ReportDetail selected={selected} setSelected={setSelected} goBack={() => setSelected('')} />;
}
