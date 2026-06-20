/** All sidebar modules admin can grant to employees */
export const PERMISSION_MODULES = [
  // Overview
  { id: 'dashboard',   path: '/app/dashboard',  label: 'Dashboard',       section: 'Overview' },
  { id: 'tracking',    path: '/app/tracking',   label: 'Live Location',    section: 'Overview' },
  { id: 'attendance',  path: '/app/attendance', label: 'Attendance',       section: 'Overview' },

  // Leads
  { id: 'leads',       path: '/app/leads',      label: 'Leads',            section: 'Leads' },

  // Inventory sub-modules
  { id: 'inventory-items',      path: '/app/inventory/items',      label: 'Items',           section: 'Inventory' },
  { id: 'inventory-warehouses', path: '/app/inventory/warehouses', label: 'Warehouses',      section: 'Inventory' },
  { id: 'inventory-pricelist',  path: '/app/inventory/price-list', label: 'Price List',      section: 'Inventory' },
  { id: 'inventory-transfers',  path: '/app/inventory/transfers',  label: 'Transfer Orders', section: 'Inventory' },

  // Parties sub-modules
  { id: 'parties-customers',    path: '/app/parties/customers',     label: 'Customers',      section: 'Parties' },
  { id: 'parties-distributors', path: '/app/parties/distributors',  label: 'Distributors',   section: 'Parties' },
  { id: 'parties-superstockers',path: '/app/parties/super-stockers',label: 'Super Stockers', section: 'Parties' },
  { id: 'parties-suppliers',    path: '/app/parties/suppliers',     label: 'Suppliers',      section: 'Parties' },
  { id: 'parties-visited',      path: '/app/parties/visited',       label: 'Visited',        section: 'Parties' },

  // Sales sub-modules
  { id: 'sales-estimates', path: '/app/sales/estimates',         label: 'Estimates',         section: 'Sales' },
  { id: 'sales-orders',    path: '/app/sales/orders',            label: 'Sales Orders',      section: 'Sales' },
  { id: 'sales-invoices',  path: '/app/sales/invoices',          label: 'Sales Invoices',    section: 'Sales' },
  { id: 'sales-delivery',  path: '/app/sales/delivery-challans', label: 'Delivery Challans', section: 'Sales' },
  { id: 'sales-returns',   path: '/app/sales/returns',           label: 'Sales Returns',     section: 'Sales' },

  // Purchases
  { id: 'purchases',   path: '/app/purchases',   label: 'Purchase Orders', section: 'Purchases' },
  { id: 'production',  path: '/app/production',  label: 'Production',      section: 'Production' },

  // Van Sales
  { id: 'van-sales',   path: '/app/van-sales',   label: 'Van Sales',       section: 'Van Sales' },

  // Delivery (shortcut to delivery challans)
  { id: 'delivery',    path: '/app/sales/delivery-challans', label: 'Delivery', section: 'Delivery' },

  // Finance
  { id: 'payments',    path: '/app/payments',    label: 'Payment Collection', section: 'Finance' },
  { id: 'invoices',    path: '/app/invoices',    label: 'Invoices & GST',     section: 'Finance' },
  { id: 'reports',     path: '/app/reports',     label: 'Business Reports',   section: 'Finance' },

  // Routes sub-modules
  { id: 'routes-regions', path: '/app/routes/regions', label: 'Regions', section: 'Routes' },
  { id: 'routes-cities',  path: '/app/routes/cities',  label: 'Cities',  section: 'Routes' },
  { id: 'routes-areas',   path: '/app/routes/areas',   label: 'Areas',   section: 'Routes' },

  // Targets
  { id: 'targets',     path: '/app/targets',     label: 'Targets',          section: 'Targets' },

  // Expenses
  { id: 'expenses',    path: '/app/expenses',    label: 'Expenses',         section: 'Other' },

  // Settings & Support
  { id: 'support',     path: '/app/support',     label: 'Support',          section: 'Other' },
  { id: 'settings',    path: '/app/settings',    label: 'Settings',         section: 'Other' },

  // Admin only
  { id: 'employees',   path: '/app/employees',   label: 'Users & Roles',    section: 'Admin', adminOnly: true },
  { id: 'admins',      path: '/app/admins',       label: 'Admins',           section: 'Admin', adminOnly: true },
];

export const PERMISSION_ACTIONS = [
  { id: 'approve_payments', label: 'Approve / Reject Payments', description: 'Payment collection approve karna' },
  { id: 'delete_records', label: 'Delete Records', description: 'Orders, invoices etc. delete karna' },
  { id: 'company_settings', label: 'Company Settings', description: 'GST, Tally, company details edit' },
  { id: 'manage_targets', label: 'Manage Targets', description: 'Sales targets set karna' },
  { id: 'manage_routes', label: 'Manage Routes', description: 'Route planner edit karna' },
  { id: 'manage_employees', label: 'Manage Employees', description: 'Employees add/edit karna' },
  { id: 'manage_admins', label: 'Manage Admins', description: 'Admins add/edit karna' },
  { id: 'view_all_tracking', label: 'View All Team Tracking', description: 'Saari sales team ki live location' },
  { id: 'view_all_data', label: 'View All Data', description: 'Sabhi admins ka data dekhe' },
];

export const USER_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales_rep', label: 'Sales Representative' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'reception', label: 'Reception' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'employee', label: 'General Employee' },
];

export const ROLE_HIERARCHY = {
  super_admin: 1,
  admin: 2,
  sales_executive: 3,
  retailer: 4,
};

export const ROLE_META = {
  super_admin: { label: 'Super Admin Portal', description: 'Complete system control - manage all admins' },
  admin: { label: 'Admin Portal', description: 'Manage your team - sales executives & employees' },
  sales_executive: { label: 'Sales Executive Portal', description: 'Field operations - manage retailers, take orders' },
  retailer: { label: 'Retailer Portal', description: 'Place orders and track transactions' },
};

export const ROLE_DEFAULT_MODULES = {
  super_admin: 'all',
  admin: [
    'dashboard','tracking','attendance','leads',
    'inventory-items','inventory-warehouses','inventory-pricelist','inventory-transfers',
    'parties-customers','parties-distributors','parties-superstockers','parties-suppliers','parties-visited',
    'sales-estimates','sales-orders','sales-invoices','sales-delivery','sales-returns',
    'purchases','production','van-sales',
    'payments','invoices','reports',
    'routes-regions','routes-cities','routes-areas',
    'targets','support','settings','employees',
  ],
  sales_executive: [
    'dashboard',
    'parties-customers','parties-distributors','parties-superstockers','parties-suppliers','parties-visited',
    'inventory-items',
    'sales-estimates','sales-orders','sales-invoices','sales-delivery','sales-returns',
    'attendance',
    'targets',
    'expenses',
    'payments','support','settings',
  ],
  sales_rep: [
    'dashboard',
    'parties-customers','parties-visited',
    'inventory-items',
    'sales-orders','sales-delivery',
    'attendance',
    'targets',
    'expenses',
    'payments','support','settings',
  ],
  manager: [
    'dashboard','tracking','attendance','leads',
    'inventory-items','inventory-warehouses',
    'parties-customers','parties-distributors',
    'sales-estimates','sales-orders','sales-invoices','sales-delivery','sales-returns',
    'payments','invoices','reports',
    'routes-regions','routes-cities','routes-areas',
    'targets','support','settings',
  ],
  accountant: [
    'dashboard','sales-invoices','invoices','payments','purchases','reports','support','settings',
  ],
  distributor: [
    'dashboard','inventory-items',
    'parties-customers','parties-visited',
    'sales-orders','sales-invoices',
    'payments','reports','support','settings',
  ],
  manufacturer: [
    'dashboard','inventory-items','inventory-warehouses',
    'purchases','production',
    'sales-orders','sales-invoices',
    'reports','support','settings',
  ],
  reception:  ['dashboard','parties-customers','support','settings'],
  employee:   ['dashboard','support','settings'],
  retailer:   ['dashboard','sales-orders','payments','support','settings'],
};

export const pathsFromModuleIds = (ids) =>
  PERMISSION_MODULES.filter((m) => ids.includes(m.id)).map((m) => m.path);

export const moduleIdsFromPaths = (paths) =>
  PERMISSION_MODULES.filter((m) => paths.includes(m.path)).map((m) => m.id);

export const getUserAllowedPaths = (user) => {
  if (!user) return [];
  if (user.role === 'super_admin') return PERMISSION_MODULES.map((m) => m.path);

  // If custom access is ON → use allowedModules (array of paths) directly
  if (user.useCustomAccess && user.allowedModules?.length) {
    return user.allowedModules;
  }

  // Otherwise use role defaults
  const defs = ROLE_DEFAULT_MODULES[user.role];
  if (!defs) return ['/app/dashboard'];
  if (defs === 'all') return PERMISSION_MODULES.filter((m) => !m.adminOnly).map((m) => m.path);
  return defs.map((id) => PERMISSION_MODULES.find((m) => m.id === id)?.path).filter(Boolean);
};

export const canAccessPath = (user, path) => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const allowed = getUserAllowedPaths(user);
  // Exact match OR the path is a sub-path of an allowed path
  // OR an allowed path is a sub-path of the requested path (parent path access for index redirects)
  return allowed.some(p =>
    path === p ||
    path.startsWith(p + '/') ||
    p.startsWith(path + '/')
  );
};

export const canNavPath = (user, path) => canAccessPath(user, path);

const ACTION_ROLE_DEFAULTS = {
  approve_payments: ['super_admin', 'admin'],
  delete_records: ['super_admin', 'admin'],
  company_settings: ['super_admin', 'admin'],
  manage_targets: ['super_admin', 'admin'],
  manage_routes: ['super_admin', 'admin'],
  manage_employees: ['super_admin', 'admin'],
  manage_admins: ['super_admin'],
  view_all_tracking: ['super_admin', 'admin'],
  view_all_data: ['super_admin'],
};

const ACTION_ALIASES = {
  approvePayments: 'approve_payments',
  deleteRecords: 'delete_records',
  companySettings: 'company_settings',
  manageTargets: 'manage_targets',
  manageRoutes: 'manage_routes',
  manageEmployees: 'manage_employees',
  manageAdmins: 'manage_admins',
  viewAllTracking: 'view_all_tracking',
  viewAllData: 'view_all_data',
};

export const canDo = (user, action) => {
  if (!user) return false;
  const key = ACTION_ALIASES[action] || action;
  if (user.role === 'super_admin') return true;
  if (user.permissions?.includes('*')) return true;
  if (user.permissions?.includes(key)) return true;
  return ACTION_ROLE_DEFAULTS[key]?.includes(user.role) ?? false;
};

export const canManageUser = (manager, targetUser) => {
  if (!manager || !targetUser) return false;
  if (manager.role === 'super_admin') return true;
  if (manager.role === 'admin' && targetUser.role !== 'super_admin') return true;
  if (manager.role === 'sales_executive' && targetUser.role === 'retailer') return true;
  return false;
};

export const canViewUserData = (viewer, targetUser) => {
  if (!viewer || !targetUser) return false;
  if (viewer.role === 'super_admin') return true;
  if (viewer.role === 'admin' && targetUser.createdBy?.toString() === viewer._id?.toString()) return true;
  if (viewer.role === 'sales_executive' && targetUser.role === 'retailer' && targetUser.assignedTo?.toString() === viewer._id?.toString()) return true;
  return false;
};

export const getDefaultPath = (user) => {
  const paths = getUserAllowedPaths(user);
  return paths[0] || '/app/dashboard';
};

export const getPortalLabel = (user) => {
  if (!user) return 'DistriFlow';
  return ROLE_META[user.role]?.label || 'DistriFlow';
};

export const getRoleDefaultModuleIds = (role) => {
  const defs = ROLE_DEFAULT_MODULES[role];
  if (!defs) return ['dashboard', 'support', 'settings'];
  if (defs === 'all') return PERMISSION_MODULES.filter((m) => !m.adminOnly).map((m) => m.id);
  return defs;
};

export const getRoleDefaultActions = (role) => {
  return Object.entries(ACTION_ROLE_DEFAULTS)
    .filter(([, roles]) => roles.includes(role))
    .map(([action]) => action);
};
