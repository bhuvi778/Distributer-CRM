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
    role: 'Distributor',
    name: 'Distributor User',
    email: 'distributor@saleson.com',
    password: 'password123',
    appRole: 'distributor',
    permissions: [],
  },
  {
    role: 'Sales Representative',
    name: 'Sales Representative',
    email: 'salesrep@saleson.com',
    password: 'password123',
    appRole: 'sales_rep',
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
