import User from '../models/User.js';
import {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  EMPLOYEE_ROLES,
  validateModules,
  validateActions,
  ROLE_DEFAULT_MODULES,
  pathsFromModuleIds,
} from '../config/permissions.js';

const employeeSelect = '-password';

export const getPermissionConfig = (req, res) => {
  res.json({
    modules: PERMISSION_MODULES,
    actions: PERMISSION_ACTIONS,
    roles: EMPLOYEE_ROLES,
    roleDefaults: ROLE_DEFAULT_MODULES,
  });
};

export const listEmployees = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'super_admin') {
      filter = { role: { $nin: ['super_admin'] } };
    } else if (req.user.role === 'admin') {
      filter = { role: { $nin: ['super_admin', 'admin'] } };
    } else {
      filter = { role: { $nin: ['super_admin', 'admin'] }, _id: { $ne: req.user._id } };
    }
    const employees = await User.find(filter)
      .select(employeeSelect)
      .populate('assignedRoutes', 'name code')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select(employeeSelect)
      .populate('assignedRoutes', 'name code');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot access super admin' });
    }
    if (employee.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to access admin' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      name, email, password, phone, role, jobTitle, department, employeeId,
      useCustomAccess, allowedModules, permissions, assignedRoutes, isActive, targetAmount, territory, region,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can create admin accounts' });
    }
    if (role === 'super_admin') {
      return res.status(400).json({ message: 'Cannot create super admin accounts' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    let modules = allowedModules || [];
    // If not custom, apply role defaults from client-sent data
    if (!useCustomAccess && role) {
      modules = allowedModules || [];
    }

    const employee = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'employee',
      jobTitle,
      department,
      employeeId,
      useCustomAccess: !!useCustomAccess,
      allowedModules: modules,
      permissions: validateActions(permissions),
      assignedRoutes,
      isActive: isActive !== false,
      targetAmount,
      territory,
      region,
      createdBy: req.user._id,
    });

    const populated = await User.findById(employee._id)
      .select(employeeSelect)
      .populate('assignedRoutes', 'name code');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importEmployees = async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ message: 'No user rows found' });

    const results = { imported: 0, skipped: 0, errors: [] };
    for (const [idx, row] of rows.entries()) {
      try {
        const name = String(row.name || '').trim();
        const email = String(row.email || '').trim().toLowerCase();
        const role = row.role || 'employee';
        const password = row.password || 'Welcome@123';

        if (!name || !email) {
          results.skipped += 1;
          results.errors.push({ row: idx + 1, message: 'Name and email required' });
          continue;
        }
        if (role === 'super_admin' || (role === 'admin' && req.user.role !== 'super_admin')) {
          results.skipped += 1;
          results.errors.push({ row: idx + 1, message: 'Role not allowed' });
          continue;
        }
        const exists = await User.findOne({ email });
        if (exists) {
          results.skipped += 1;
          results.errors.push({ row: idx + 1, message: 'Email already exists' });
          continue;
        }

        const defs = ROLE_DEFAULT_MODULES[role];
        const allowedModules = defs === 'all'
          ? PERMISSION_MODULES.filter((m) => !m.adminOnly).map((m) => m.path)
          : pathsFromModuleIds(defs || ROLE_DEFAULT_MODULES.employee || []);

        await User.create({
          name,
          email,
          password,
          role,
          phone: row.phone || '',
          jobTitle: row.jobTitle || row.jobtitle || '',
          department: row.department || '',
          employeeId: row.employeeId || row.employeeid || '',
          isActive: row.isActive !== false,
          allowedModules,
          permissions: validateActions(row.permissions || []),
          createdBy: req.user._id,
        });
        results.imported += 1;
      } catch (error) {
        results.skipped += 1;
        results.errors.push({ row: idx + 1, message: error.message });
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot update super admin' });
    }
    if (employee.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to update admin' });
    }

    const {
      name, email, phone, role, jobTitle, department, employeeId, password,
      useCustomAccess, allowedModules, permissions, assignedRoutes, isActive, targetAmount, territory, region,
    } = req.body;

    if (name) employee.name = name;
    if (email) employee.email = email.toLowerCase();
    if (phone !== undefined) employee.phone = phone;
    if (role) {
      if (role === 'super_admin') {
        return res.status(400).json({ message: 'Cannot set role to super admin' });
      }
      if (role === 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admin can set admin role' });
      }
      employee.role = role;
    }
    if (jobTitle !== undefined) employee.jobTitle = jobTitle;
    if (department !== undefined) employee.department = department;
    if (employeeId !== undefined) employee.employeeId = employeeId;
    if (useCustomAccess !== undefined) employee.useCustomAccess = useCustomAccess;
    if (allowedModules) employee.allowedModules = allowedModules;
    if (permissions) employee.permissions = validateActions(permissions);

    if (employee.useCustomAccess === false && employee.role && ROLE_DEFAULT_MODULES[employee.role]) {
      const defs = ROLE_DEFAULT_MODULES[employee.role];
      employee.allowedModules = defs === 'all'
        ? PERMISSION_MODULES.filter((m) => !m.adminOnly).map((m) => m.path)
        : pathsFromModuleIds(defs);
    }
    if (assignedRoutes) employee.assignedRoutes = assignedRoutes;
    if (isActive !== undefined) employee.isActive = isActive;
    if (targetAmount !== undefined) employee.targetAmount = targetAmount;
    if (territory !== undefined) employee.territory = territory;
    if (region !== undefined) employee.region = region;
    if (password) employee.password = password;

    await employee.save();

    const updated = await User.findById(employee._id)
      .select(employeeSelect)
      .populate('assignedRoutes', 'name code');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }
    if (employee.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to delete admin' });
    }
    employee.isActive = false;
    await employee.save();
    res.json({ message: 'Employee deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyRoleDefaults = async (req, res) => {
  try {
    const { role } = req.body;
    const defs = ROLE_DEFAULT_MODULES[role];
    if (!defs) return res.status(400).json({ message: 'Invalid role' });
    const modules = defs === 'all'
      ? PERMISSION_MODULES.filter((m) => !m.adminOnly).map((m) => m.path)
      : pathsFromModuleIds(defs);
    res.json({ allowedModules: modules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
