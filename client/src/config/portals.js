import {
  Shield, Users, ShoppingCart, Calculator, Building2, Factory, HeadphonesIcon,
  LayoutDashboard, Map, Clock, FileText, CreditCard, Truck, Target, Package,
  ClipboardList, Route, BarChart3, Settings, UserCog, UserCheck, Store, Crown,
} from 'lucide-react';

export const PORTALS = [
  {
    id: 'super_admin',
    role: 'super_admin',
    label: 'Super Admin',
    tagline: 'Complete System Control',
    description: 'Manage all admins, view all data, full system control.',
    icon: Crown,
    accent: 'bg-red-700',
    features: ['Create distributors', 'Create manufacturers', 'View all data', 'Complete access'],
    demo: { email: 'superadmin@saleson.com', password: 'password123', name: 'Super Admin' },
  },
  {
    id: 'distributor',
    role: 'distributor',
    label: 'Distributor Portal',
    tagline: 'Manage Company Team',
    description: 'Create sales representatives, manage inventory, campaigns and customers.',
    icon: Shield,
    accent: 'bg-brand-900',
    features: ['Create sales team', 'Inventory', 'Campaigns', 'Reports'],
    demo: { email: 'distributor@saleson.com', password: 'password123', name: 'Distributor User' },
  },
  {
    id: 'sales_rep',
    role: 'sales_rep',
    label: 'Sales Representative',
    tagline: 'Field Operations',
    description: 'Manage customers, orders, payments and attendance.',
    icon: UserCheck,
    accent: 'bg-teal-700',
    features: ['Customers', 'Orders', 'Payments', 'Attendance'],
    demo: { email: 'salesrep@saleson.com', password: 'password123', name: 'Sales Representative' },
  },
];

export const getPortalById = (id) => PORTALS.find((p) => p.id === id);
export const getPortalByRole = (role) => PORTALS.find((p) => p.role === role);

export const NAV_BY_ROLE = {
  super_admin: [
    { title: 'Overview', items: [
      { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/app/tracking', icon: Map, label: 'Live Tracking' },
      { path: '/app/attendance', icon: Clock, label: 'Attendance' },
    ]},
    { title: 'Admins', items: [
      { path: '/app/admins', icon: Shield, label: 'Manage Admins' },
      { path: '/app/employees', icon: Users, label: 'All Employees' },
    ]},
    { title: 'Operations', items: [
      { path: '/app/orders', icon: ShoppingCart, label: 'All Orders' },
      { path: '/app/invoices', icon: FileText, label: 'Invoices' },
      { path: '/app/payments', icon: CreditCard, label: 'Payments' },
      { path: '/app/outlets', icon: Users, label: 'All Retailers' },
      { path: '/app/products', icon: Package, label: 'Products' },
      { path: '/app/inventory', icon: ClipboardList, label: 'Inventory' },
    ]},
    { title: 'Reports & Settings', items: [
      { path: '/app/reports', icon: BarChart3, label: 'Reports' },
      { path: '/app/settings', icon: Settings, label: 'Settings' },
    ]},
  ],
  admin: [
    { title: 'Overview', items: [
      { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/app/tracking', icon: Map, label: 'Team Tracking' },
      { path: '/app/attendance', icon: Clock, label: 'Attendance' },
    ]},
    { title: 'Team', items: [
      { path: '/app/employees', icon: Users, label: 'My Team' },
    ]},
    { title: 'Sales', items: [
      { path: '/app/orders', icon: ShoppingCart, label: 'Orders' },
      { path: '/app/invoices', icon: FileText, label: 'Invoices' },
      { path: '/app/payments', icon: CreditCard, label: 'Payments' },
      { path: '/app/targets', icon: Target, label: 'Targets' },
    ]},
    { title: 'Operations', items: [
      { path: '/app/outlets', icon: Users, label: 'Retailers' },
      { path: '/app/products', icon: Package, label: 'Products' },
      { path: '/app/inventory', icon: ClipboardList, label: 'Inventory' },
      { path: '/app/routes', icon: Route, label: 'Routes' },
    ]},
    { title: 'Reports & Settings', items: [
      { path: '/app/reports', icon: BarChart3, label: 'Reports' },
      { path: '/app/support', icon: HeadphonesIcon, label: 'Support' },
      { path: '/app/settings', icon: Settings, label: 'Settings' },
    ]},
  ],
  sales_executive: [
    { title: 'My Day', items: [
      { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/app/attendance', icon: Clock, label: 'Mark Attendance' },
      { path: '/app/tracking', icon: Map, label: 'Location Tracking' },
    ]},
    { title: 'Retailers', items: [
      { path: '/app/retailer-list', icon: Users, label: 'My Retailers' },
      { path: '/app/outlets', icon: Users, label: 'Add Retailer' },
      { path: '/app/retailer-dues', icon: CreditCard, label: 'Retailer Dues' },
    ]},
    { title: 'Orders & Payments', items: [
      { path: '/app/orders', icon: ShoppingCart, label: 'Take Order' },
      { path: '/app/payments', icon: CreditCard, label: 'Collect Payment' },
    ]},
    { title: 'Settings', items: [
      { path: '/app/support', icon: HeadphonesIcon, label: 'Support' },
      { path: '/app/settings', icon: Settings, label: 'Settings' },
    ]},
  ],
  retailer: [
    { title: 'Dashboard', items: [
      { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { title: 'Orders', items: [
      { path: '/app/orders', icon: ShoppingCart, label: 'My Orders' },
    ]},
    { title: 'Payments', items: [
      { path: '/app/payments', icon: CreditCard, label: 'My Payments' },
    ]},
    { title: 'Support', items: [
      { path: '/app/support', icon: HeadphonesIcon, label: 'Support' },
      { path: '/app/settings', icon: Settings, label: 'Settings' },
    ]},
  ],
};

export const getNavSectionsForUser = (user, canAccessPath) => {
  if (!user) return [];
  const role = user.role || 'retailer';
  let sections = NAV_BY_ROLE[role] || NAV_BY_ROLE.retailer;

  sections = sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canAccessPath(user, item.path)),
    }))
    .filter((sec) => sec.items.length > 0);
  return sections;
};
