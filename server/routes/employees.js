import { Router } from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import * as emp from '../controllers/employeeController.js';

const router = Router();

router.get('/config', protect, authorize('super_admin', 'admin', 'manager', 'distributor', 'manufacturer'), emp.getPermissionConfig);
router.post('/role-defaults', protect, authorize('super_admin', 'admin', 'manager', 'distributor', 'manufacturer'), emp.applyRoleDefaults);
router.post('/import', protect, authorize('super_admin', 'admin', 'distributor', 'manufacturer'), emp.importEmployees);

router.route('/')
  .get(protect, authorize('super_admin', 'admin', 'manager', 'distributor', 'manufacturer'), emp.listEmployees)
  .post(protect, authorize('super_admin', 'admin', 'distributor', 'manufacturer'), emp.createEmployee);

router.route('/:id')
  .get(protect, authorize('super_admin', 'admin', 'manager', 'distributor', 'manufacturer'), emp.getEmployee)
  .put(protect, authorize('super_admin', 'admin', 'distributor', 'manufacturer'), emp.updateEmployee)
  .delete(protect, authorize('super_admin', 'admin', 'distributor', 'manufacturer'), emp.deleteEmployee);

export default router;
