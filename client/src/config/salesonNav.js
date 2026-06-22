import {
  LayoutDashboard, MapPin, Package, Users, Truck, ShoppingCart,
  ClipboardList, Globe, Clock, UserCog, Target, CreditCard, TrendingUp,
  FileText, RotateCcw, Warehouse, Tag, ArrowLeftRight, Building2,
  Trophy, Wallet,
} from 'lucide-react';

/**
 * Full nav definition — each item has a moduleId (or array) that must be in user's allowed paths.
 * getSalesOnNav() filters this dynamically per user.
 */
export const SALESON_NAV_DEF = [
  {
    type: 'link',
    path: '/app/dashboard',
    moduleId: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    type: 'link',
    path: '/app/tracking',
    moduleId: 'tracking',
    icon: MapPin,
    label: 'Live Location',
  },
  {
    type: 'group',
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    items: [
      { path: '/app/inventory/items',      moduleId: 'inventory-items',      label: 'Items' },
      { path: '/app/inventory/warehouses', moduleId: 'inventory-warehouses', label: 'Warehouses' },
      { path: '/app/inventory/price-list', moduleId: 'inventory-pricelist',  label: 'Price Lists' },
      { path: '/app/inventory/transfers',  moduleId: 'inventory-transfers',  label: 'Transfer Orders' },
    ],
  },  {
    type: 'link',
    path: '/app/leads',
    moduleId: 'leads',
    icon: TrendingUp,
    label: 'Leads',
  },
  {
    type: 'group',
    id: 'parties',
    label: 'Parties',
    icon: Users,
    items: [
      { path: '/app/parties/customers',      moduleId: 'parties-customers',     label: 'Customers' },
      { path: '/app/parties/distributors',   moduleId: 'parties-distributors',  label: 'Distributors' },
      { path: '/app/parties/super-stockers', moduleId: 'parties-superstockers', label: 'Super Stockers' },
      { path: '/app/parties/suppliers',      moduleId: 'parties-suppliers',     label: 'Suppliers' },
      { path: '/app/parties/visited',        moduleId: 'parties-visited',       label: 'Visited' },
      { path: '/app/parties/groups',         moduleId: 'parties-groups',        label: 'Groups' },
    ],
  },
  {
    type: 'group',
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    items: [
      { path: '/app/sales/estimates',         moduleId: 'sales-estimates', label: 'Estimates' },
      { path: '/app/sales/orders',            moduleId: 'sales-orders',    label: 'Sales Orders' },
      { path: '/app/production/production-orders', moduleId: 'production', label: 'Production' },
      { path: '/app/reports',                  moduleId: 'reports',         label: 'Report' },
      { path: '/app/sales/invoices',          moduleId: 'sales-invoices',  label: 'Sales Invoices' },
      { path: '/app/sales/delivery-challans', moduleId: 'sales-delivery',  label: 'Delivery Challans' },
      { path: '/app/sales/returns',           moduleId: 'sales-returns',   label: 'Sales Returns' },
      { path: '/app/sales/credit-note',       moduleId: 'sales-credit-note', label: 'Credit Note' },
    ],
  },
  {
    type: 'group',
    id: 'purchases',
    label: 'Purchases',
    icon: ClipboardList,
    items: [
      { path: '/app/purchases',  moduleId: 'purchases',  label: 'Purchase Orders' },
    ],
  },
  {
    type: 'group',
    id: 'production',
    label: 'Production',
    icon: ClipboardList,
    items: [
      { path: '/app/production/grm',               moduleId: 'production', label: 'GRM' },
      { path: '/app/production/bom',               moduleId: 'production', label: 'BOM' },
      { path: '/app/production/work-orders',       moduleId: 'production', label: 'Work Orders' },
      { path: '/app/production/production-orders', moduleId: 'production', label: 'Production Orders' },
    ],
  },
  {
    type: 'link',
    path: '/app/van-sales',
    moduleId: 'van-sales',
    icon: Truck,
    label: 'Van Sales',
  },
  {
    type: 'link',
    path: '/app/sales/delivery-challans',
    moduleId: 'delivery',
    icon: FileText,
    label: 'Delivery',
  },
  {
    type: 'group',
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    items: [
      { path: '/app/payments/in',  moduleId: 'payments', label: 'Payment In' },
      { path: '/app/payments/out', moduleId: 'payments', label: 'Payment Out' },
    ],
  },
  {
    type: 'group',
    id: 'routes',
    label: 'Routes',
    icon: Globe,
    items: [
      { path: '/app/routes/regions', moduleId: 'routes-regions', label: 'Regions' },
      { path: '/app/routes/cities',  moduleId: 'routes-cities',  label: 'Cities' },
      { path: '/app/routes/areas',   moduleId: 'routes-areas',   label: 'Areas' },
    ],
  },
  {
    type: 'link',
    path: '/app/attendance',
    moduleId: 'attendance',
    icon: Clock,
    label: 'Attendance',
  },
  {
    type: 'link',
    path: '/app/employees',
    moduleId: 'employees',
    icon: UserCog,
    label: 'Users',
  },
  {
    type: 'link',
    path: '/app/targets',
    moduleId: 'targets',
    icon: Trophy,
    label: 'Achievements',
  },
  {
    type: 'link',
    path: '/app/expenses',
    moduleId: 'expenses',
    icon: Wallet,
    label: 'Expenses',
  },
];

// ─────────────────────────────────────────────────────────────────
// Build nav dynamically based on user's allowed paths
// ─────────────────────────────────────────────────────────────────
export function getSalesOnNav(user, canAccessPath) {
  if (!user) return [];

  return SALESON_NAV_DEF.map((item) => {
    if (item.type === 'link') {
      return canAccessPath(user, item.path) ? item : null;
    }
    // Group: keep only sub-items the user can access
    const visibleItems = item.items.filter((sub) => canAccessPath(user, sub.path));
    return visibleItems.length > 0 ? { ...item, items: visibleItems } : null;
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
export function isNavActive(pathname, item) {
  if (item.type === 'link') return pathname === item.path || pathname.startsWith(item.path + '/');
  return item.items?.some((sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'));
}

export function isGroupOpen(pathname, item) {
  return item.items?.some((sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'));
}

export const getPageTitle = (pathname) => {
  const flat = [];
  SALESON_NAV_DEF.forEach((item) => {
    if (item.type === 'link') flat.push({ path: item.path, label: item.label });
    else item.items?.forEach((sub) => flat.push({ path: sub.path, label: sub.label }));
  });
  return (
    flat.find((x) => pathname === x.path || pathname.startsWith(x.path + '/'))?.label ||
    pathname.split('/').pop()?.replace(/-/g, ' ') ||
    'Dashboard'
  );
};
