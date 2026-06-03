import SalesOrder from '../models/SalesOrder.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Outlet from '../models/Outlet.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Target from '../models/Target.js';
import SupportTicket from '../models/SupportTicket.js';
import ProductionOrder from '../models/ProductionOrder.js';
import Inventory from '../models/Inventory.js';
import { buildRoleFilter } from '../utils/roleFilters.js';

export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Retailer gets a lightweight, scoped response
    if (user.role === 'retailer') {
      const outletId = user._id;
      const [
        totalOrders,
        todayOrders,
        monthRevenue,
        pendingPayments,
        recentOrders,
        outlet,
      ] = await Promise.all([
        SalesOrder.countDocuments({ outlet: outletId, status: { $ne: 'cancelled' } }),
        SalesOrder.countDocuments({ outlet: outletId, status: { $ne: 'cancelled' }, orderDate: { $gte: today } }),
        Invoice.aggregate([
          { $match: { outlet: outletId, type: 'sales', invoiceDate: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$grandTotal' } } },
        ]),
        Payment.aggregate([
          { $match: { outlet: outletId, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        SalesOrder.find({ outlet: outletId, status: { $ne: 'cancelled' } })
          .populate('outlet', 'name')
          .populate('salesRep', 'name')
          .sort('-createdAt')
          .limit(5),
        Outlet.findById(outletId).select('outstandingBalance creditLimit'),
      ]);

      return res.json({
        portal: 'retailer',
        stats: {
          totalOrders,
          todayOrders,
          monthRevenue: monthRevenue[0]?.total || 0,
          pendingPayments: pendingPayments[0]?.total || 0,
          outstandingBalance: outlet?.outstandingBalance || 0,
          creditLimit: outlet?.creditLimit || 0,
          totalOutlets: 1,
          totalProducts: 0,
          totalRevenue: 0,
          activeReps: 0,
        },
        recentOrders,
        topProducts: [],
      });
    }

    const orderFilter = await buildRoleFilter(user, 'orders');
    const invoiceFilter = await buildRoleFilter(user, 'invoices');
    const paymentFilter = await buildRoleFilter(user, 'payments');
    const outletFilter = await buildRoleFilter(user, 'outlets');

    const baseOrder = { status: { $ne: 'cancelled' }, ...orderFilter };
    const monthInvoiceMatch = { type: 'sales', invoiceDate: { $gte: monthStart }, ...invoiceFilter };
    const pendingPaymentMatch = { status: 'pending', ...paymentFilter };
    const activeOutletMatch = { isActive: true, ...outletFilter };

    const role = user.role;
    const extra = {};

    if (role === 'accountant') {
      extra.pendingApprovalCount = await Payment.countDocuments({ status: 'pending' });
      extra.totalInvoices = await Invoice.countDocuments({ type: 'sales' });
    }
    if (role === 'sales_rep') {
      const target = await Target.findOne({ isActive: true, 'assignments.user': user._id }).sort('-createdAt');
      const assignment = target?.assignments?.find((a) => String(a.user) === String(user._id));
      extra.myTargetPct = assignment?.percentage || 0;
      extra.myTargetAmount = assignment?.targetAmount || user.targetAmount || 0;
    }
    if (role === 'manufacturer') {
      extra.activeProduction = await ProductionOrder.countDocuments({ status: { $in: ['planned', 'in_progress'] } });
      extra.lowStockItems = await Inventory.countDocuments({ quantity: { $lte: 10 } });
    }
    if (role === 'reception') {
      extra.openTickets = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
    }

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      monthRevenue,
      totalOutlets,
      totalProducts,
      pendingPayments,
      activeReps,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      SalesOrder.countDocuments(baseOrder),
      SalesOrder.countDocuments({ ...baseOrder, orderDate: { $gte: today } }),
      Invoice.aggregate([{ $match: { type: 'sales', ...invoiceFilter } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Invoice.aggregate([{ $match: monthInvoiceMatch }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Outlet.countDocuments(activeOutletMatch),
      Product.countDocuments({ isActive: true }),
      Payment.aggregate([{ $match: pendingPaymentMatch }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ['super_admin', 'admin', 'manager'].includes(role) ? User.countDocuments({ role: 'sales_rep', isActive: true }) : Promise.resolve(0),
      SalesOrder.find(baseOrder).populate('outlet', 'name').populate('salesRep', 'name').sort('-createdAt').limit(5),
      SalesOrder.aggregate([
        { $match: baseOrder },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.amount' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const outstanding = await Outlet.aggregate([
      { $match: outletFilter._id === null ? { _id: null } : outletFilter },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]);

    res.json({
      portal: role,
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalOutlets,
        totalProducts,
        pendingPayments: pendingPayments[0]?.total || 0,
        outstandingBalance: outstanding[0]?.total || 0,
        activeReps,
        ...extra,
      },
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesChart = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const invoiceFilter = await buildRoleFilter(req.user, 'invoices');

    const data = await Invoice.aggregate([
      { $match: { type: 'sales', invoiceDate: { $gte: sixMonthsAgo }, ...invoiceFilter } },
      {
        $group: {
          _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } },
          revenue: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    if (!['admin', 'manager', 'sales_rep'].includes(req.user.role)) {
      return res.json([]);
    }

    const targets = await Target.findOne({ isActive: true }).sort('-createdAt');
    if (targets) {
      let assignments = [...targets.assignments].sort((a, b) => b.percentage - a.percentage);
      if (req.user.role === 'sales_rep') {
        assignments = assignments.filter((a) => String(a.user) === String(req.user._id));
      }
      const populated = await User.populate(assignments, { path: 'user', select: 'name email avatar role' });
      return res.json(populated);
    }

    const orderFilter = await buildRoleFilter(req.user, 'orders');
    const leaderboard = await SalesOrder.aggregate([
      { $match: { status: { $ne: 'cancelled' }, ...orderFilter } },
      { $group: { _id: '$salesRep', totalSales: { $sum: '$grandTotal' }, orderCount: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: req.user.role === 'sales_rep' ? 1 : 10 },
    ]);
    const populated = await User.populate(leaderboard, { path: '_id', select: 'name email avatar role' });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attFilter = await buildRoleFilter(req.user, 'attendance');
    const attendance = await Attendance.find({ date: { $gte: today }, ...attFilter }).populate('user', 'name role');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
