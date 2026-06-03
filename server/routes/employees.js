import { Router } from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import * as emp from '../controllers/employeeController.js';

const router = Router();

router.get('/config', protect, authorize('admin', 'manager'), emp.getPermissionConfig);
router.post('/role-defaults', protect, authorize('admin', 'manager'), emp.applyRoleDefaults);

router.route('/')
  .get(protect, authorize('admin', 'manager'), emp.listEmployees)
  .post(protect, authorize('admin'), emp.createEmployee);

router.route('/:id')
  .get(protect, authorize('admin', 'manager'), emp.getEmployee)
  .put(protect, authorize('admin'), emp.updateEmployee)
  .delete(protect, authorize('admin'), emp.deleteEmployee);

export default router;
