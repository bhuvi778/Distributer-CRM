/** All sidebar modules admin can grant to employees */
export const PERMISSION_MODULES = [
  { id: 'dashboard', path: '/app/dashboard', label: 'Dashboard', section: 'Overview' },
  { id: 'tracking', path: '/app/tracking', label: 'Live Tracking', section: 'Overview' },
  { id: 'attendance', path: '/app/attendance', label: 'Attendance', section: 'Overview' },
  { id: 'orders', path: '/app/orders', label: 'Sales Orders', section: 'Sales' },
  { id: 'invoices', path: '/app/invoices', label: 'Invoices & GST', section: 'Sales' },
  { id: 'payments', path: '/app/payments', label: 'Payment Collection', section: 'Sales' },
  { id: 'payment-in', path: '/app/payments/in', label: 'Payment In', section: 'Sales' },
  { id: 'payment-out', path: '/app/payments/out', label: 'Payment Out', section: 'Sales' },
  { id: 'van-sales', path: '/app/van-sales', label: 'Van Sales', section: 'Sales' },
  { id: 'targets', path: '/app/targets', label: 'Target Meter', section: 'Sales' },
  { id: 'outlets', path: '/app/outlets', label: 'Outlets / Customers', section: 'Operations' },
  { id: 'parties-groups', path: '/app/parties/groups', label: 'Party Groups', section: 'Operations' },
  { id: 'products', path: '/app/products', label: 'Products & SKUs', section: 'Operations' },
  { id: 'inventory', path: '/app/inventory', label: 'Inventory', section: 'Operations' },
  { id: 'routes', path: '/app/routes', label: 'Route Planner', section: 'Operations' },
  { id: 'purchases', path: '/app/purchases', label: 'Purchases', section: 'Operations' },
  { id: 'purchase-orders', path: '/app/purchases/orders', label: 'Purchase Orders', section: 'Operations' },
  { id: 'purchase-invoices', path: '/app/purchases/invoices', label: 'Purchase Invoices', section: 'Operations' },
  { id: 'purchase-returns', path: '/app/purchases/returns', label: 'Purchase Returns', section: 'Operations' },
  { id: 'production', path: '/app/production', label: 'Production', section: 'Operations' },
  { id: 'reports', path: '/app/reports', label: 'Business Reports', section: 'Insights' },
  { id: 'campaigns', path: '/app/campaigns', label: 'Campaigns', section: 'Retailer Growth' },
  { id: 'feedback', path: '/app/feedback', label: 'Feedback', section: 'Retailer Growth' },
  { id: 'add-customers', path: '/app/add-customers', label: 'Add Customers', section: 'Retailer Growth' },
  { id: 'support', path: '/app/support', label: 'Support', section: 'Insights' },
  { id: 'settings', path: '/app/settings', label: 'Settings', section: 'Insights' },
  { id: 'employees', path: '/app/employees', label: 'Employees', section: 'Admin', adminOnly: true },
];

export const PERMISSION_ACTIONS = [
  { id: 'approve_payments', label: 'Approve / Reject Payments', description: 'Payment collection approve karna' },
  { id: 'delete_records', label: 'Delete Records', description: 'Orders, invoices etc. delete karna' },
  { id: 'company_settings', label: 'Company Settings', description: 'GST, Tally, company details edit' },
  { id: 'manage_targets', label: 'Manage Targets', description: 'Sales targets set karna' },
  { id: 'manage_routes', label: 'Manage Routes', description: 'Route planner edit karna' },
  { id: 'manage_employees', label: 'Manage Employees', description: 'Employees add/edit karna' },
  { id: 'view_all_tracking', label: 'View All Team Tracking', description: 'Saari sales team ki live location' },
];

export const EMPLOYEE_ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'sales_rep', label: 'Sales Representative' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'reception', label: 'Reception' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'employee', label: 'General Employee' },
];

export const ROLE_DEFAULT_MODULES = {
  manager: 'all',
  sales_rep: ['dashboard', 'attendance', 'orders', 'invoices', 'payments', 'van-sales', 'targets', 'outlets', 'support', 'settings'],
  accountant: ['dashboard', 'invoices', 'payments', 'purchases', 'reports', 'support', 'settings'],
  reception: ['dashboard', 'outlets', 'support', 'settings'],
  distributor: ['dashboard', 'orders', 'invoices', 'payments', 'payment-in', 'payment-out', 'outlets', 'products', 'inventory', 'reports', 'campaigns', 'feedback', 'add-customers', 'support', 'settings', 'employees'],
  manufacturer: ['dashboard', 'products', 'inventory', 'purchases', 'production', 'orders', 'invoices', 'reports', 'support', 'settings'],
  employee: ['dashboard', 'support', 'settings'],
};

export const pathsFromModuleIds = (ids) =>
  PERMISSION_MODULES.filter((m) => ids.includes(m.id)).map((m) => m.path);

export const moduleIdsFromPaths = (paths) =>
  PERMISSION_MODULES.filter((m) => paths.includes(m.path)).map((m) => m.id);

export const validateModules = (paths) => {
  const valid = PERMISSION_MODULES.map((m) => m.path);
  return (paths || []).filter((p) => valid.includes(p));
};

export const validateActions = (actions) => {
  const valid = PERMISSION_ACTIONS.map((a) => a.id);
  return (actions || []).filter((a) => valid.includes(a));
};
