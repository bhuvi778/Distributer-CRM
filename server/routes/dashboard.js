import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as dash from '../controllers/dashboardController.js';

const router = Router();
router.use(protect);

router.get('/stats', dash.getDashboardStats);
router.get('/sales-chart', dash.getSalesChart);
router.get('/leaderboard', dash.getLeaderboard);
router.get('/attendance-summary', dash.getAttendanceSummary);

export default router;
