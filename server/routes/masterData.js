import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { buildRoleFilter } from '../utils/roleFilters.js';
import Outlet from '../models/Outlet.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Route from '../models/Route.js';
import Invoice from '../models/Invoice.js';

const router = Router();

router.get('/', protect, async (req, res) => {
  try {
    const outletFilter = await buildRoleFilter(req.user, 'outlets');
    const [outlets, products, users, routes, invoices] = await Promise.all([
      Outlet.find({ isActive: true, ...outletFilter }).select('name code type phone outstandingBalance creditLimit route gstin').populate('route', 'name').sort('name'),
      Product.find({ isActive: true }).select('name sku sellingPrice gstRate hsnCode stock unit category').sort('name'),
      User.find({ isActive: true }).select('name email role phone territory').sort('name'),
      ['admin', 'manager'].includes(req.user.role)
        ? Route.find({ isActive: true }).select('name code area city assignedReps').sort('name')
        : Route.find({ isActive: true, assignedReps: req.user._id }).select('name code area city assignedReps').sort('name'),
      Invoice.find({ balanceDue: { $gt: 0 }, type: 'sales', ...(await buildRoleFilter(req.user, 'invoices')) })
        .select('invoiceNumber outlet grandTotal paidAmount balanceDue status')
        .populate('outlet', 'name code').sort('-createdAt').limit(200),
    ]);
    res.json({ outlets, products, users, routes, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
