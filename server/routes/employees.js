import { Router } from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import * as emp from '../controllers/employeeController.js';

const router = Router();

router.get('/config', protect, authorize('super_admin', 'admin', 'manager'), emp.getPermissionConfig);
router.post('/role-defaults', protect, authorize('super_admin', 'admin', 'manager'), emp.applyRoleDefaults);
router.post('/import', protect, authorize('super_admin', 'admin'), emp.importEmployees);

router.route('/')
  .get(protect, authorize('super_admin', 'admin', 'manager'), emp.listEmployees)
  .post(protect, authorize('super_admin', 'admin'), emp.createEmployee);

router.route('/:id')
  .get(protect, authorize('super_admin', 'admin', 'manager'), emp.getEmployee)
  .put(protect, authorize('super_admin', 'admin'), emp.updateEmployee)
  .delete(protect, authorize('super_admin', 'admin'), emp.deleteEmployee);

export default router;
