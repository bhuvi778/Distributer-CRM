import { PERMISSION_ACTIONS } from '../config/permissions.js';

const ACTION_ROLE_DEFAULTS = {
  approve_payments: ['admin', 'manager', 'accountant'],
  delete_records: ['admin', 'manager'],
  company_settings: ['admin', 'manager'],
  manage_targets: ['admin', 'manager'],
  manage_routes: ['admin', 'manager'],
  manage_employees: ['admin'],
  view_all_tracking: ['admin', 'manager'],
};

export const userCan = (user, action) => {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  if (user.permissions?.includes('*')) return true;
  if (user.permissions?.includes(action)) return true;
  return ACTION_ROLE_DEFAULTS[action]?.includes(user.role) ?? false;
};

export const userCanDelete = (user) => userCan(user, 'delete_records');
export const userCanApprovePayments = (user) => userCan(user, 'approve_payments');
export const userCanEditSettings = (user) => userCan(user, 'company_settings');
