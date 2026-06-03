import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';

const router = Router();

router.post('/register', protect, authorize('super_admin', 'admin'), auth.register);
router.post('/login', auth.login);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, auth.updateProfile);
router.put('/location', protect, auth.updateLocation);
router.get('/users', protect, authorize('super_admin', 'admin'), auth.getUsers);
router.get('/admin-stats', protect, authorize('super_admin'), auth.getAdminStats);
router.put('/users/:id', protect, authorize('super_admin', 'admin'), auth.updateUser);
router.delete('/users/:id', protect, authorize('super_admin'), auth.deleteUser);

export default router;
