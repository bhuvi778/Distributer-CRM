/** Roles with full org-wide data access */
const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'manager'];

export async function getUserRouteIds(user) {
  if (!user.assignedRoutes?.length) return [];
  return user.assignedRoutes.map((r) => r._id || r);
}

export async function getUserOutletIds(user) {
  const Outlet = (await import('../models/Outlet.js')).default;
  const routeIds = await getUserRouteIds(user);
  const filter = { $or: [{ assignedTo: user._id }] };
  if (routeIds.length) filter.$or.push({ route: { $in: routeIds } });
  const outlets = await Outlet.find(filter).select('_id');
  return outlets.map((o) => o._id);
}

export async function buildRoleFilter(user, resource) {
  if (!user || FULL_ACCESS_ROLES.includes(user.role)) return {};

  const routeIds = await getUserRouteIds(user);
  const outletIds = await getUserOutletIds(user);

  switch (user.role) {
    case 'accountant':
      switch (resource) {
        case 'attendance':
        case 'van-sales':
        case 'targets':
          return { _id: null };
        default:
          return {};
      }

    case 'sales_rep':
      switch (resource) {
        case 'outlets':
          return outletIds.length ? { _id: { $in: outletIds } } : { assignedTo: user._id };
        case 'orders':
        case 'invoices':
          return {
            $or: [
              { salesRep: user._id },
              ...(outletIds.length ? [{ outlet: { $in: outletIds } }] : []),
            ],
          };
        case 'payments':
          return {
            $or: [
              { collectedBy: user._id },
              ...(outletIds.length ? [{ outlet: { $in: outletIds } }] : []),
            ],
          };
        case 'van-sales':
          return { salesRep: user._id };
        case 'attendance':
          return { user: user._id };
        default:
          return { salesRep: user._id };
      }

    case 'retailer':
      // Retailers only see their own outlet's data
      switch (resource) {
        case 'outlets':
          return { _id: user._id };
        case 'orders':
          return { outlet: user._id };
        case 'invoices':
          return { outlet: user._id };
        case 'payments':
          return { outlet: user._id };
        default:
          return { outlet: user._id };
      }

    case 'distributor':
      switch (resource) {
        case 'outlets':
          return outletIds.length ? { _id: { $in: outletIds } } : { type: { $in: ['retailer', 'wholesaler'] } };
        case 'orders':
        case 'invoices':
        case 'payments':
          return outletIds.length ? { outlet: { $in: outletIds } } : {};
        default:
          return {};
      }

    case 'manufacturer':
      switch (resource) {
        case 'production':
        case 'purchases':
        case 'products':
        case 'inventory':
          return {};
        case 'orders':
        case 'invoices':
          return { orderType: { $ne: 'van' } };
        default:
          return {};
      }

    case 'reception':
    case 'employee':
      switch (resource) {
        case 'outlets':
          return { isActive: true };
        case 'support':
          return {};
        default:
          return { _id: null };
      }

    default:
      return {};
  }
}

export function canApprovePayments(role) {
  return ['admin', 'manager', 'accountant'].includes(role);
}

export function canManageUsers(role) {
  return role === 'admin';
}

export function canDelete(role) {
  return ['admin', 'manager'].includes(role);
}
