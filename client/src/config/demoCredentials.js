export const DEMO_CREDENTIALS = [
  {
    role: 'Super Admin',
    name: 'Super Admin',
    email: 'superadmin@saleson.com',
    password: 'password123',
    appRole: 'super_admin',
    permissions: ['*'],
  },
  {
    role: 'Admin',
    name: 'Admin User',
    email: 'admin@saleson.com',
    password: 'password123',
    appRole: 'admin',
    permissions: ['*'],
  },
  {
    role: 'Manufacturer',
    name: 'Manufacturer User',
    email: 'manufacturer@saleson.com',
    password: 'password123',
    appRole: 'manufacturer',
    permissions: [],
  },
  {
    role: 'Distributor',
    name: 'Distributor User',
    email: 'distributor@saleson.com',
    password: 'password123',
    appRole: 'distributor',
    permissions: [],
  },
  {
    role: 'Sales Executive',
    name: 'Sales Executive',
    email: 'sales@saleson.com',
    password: 'password123',
    appRole: 'sales_executive',
    permissions: [],
  },
];

export const getDemoUser = (email, password) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const account = DEMO_CREDENTIALS.find(
    (demo) => demo.email === normalizedEmail && demo.password === password
  );

  if (!account) return null;

  return {
    _id: `demo-${account.appRole}`,
    name: account.name,
    email: account.email,
    role: account.appRole,
    permissions: account.permissions,
    allowedModules: [],
    useCustomAccess: false,
    isDemoUser: true,
  };
};
