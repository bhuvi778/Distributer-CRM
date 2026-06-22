import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as ctrl from '../controllers/moduleController.js';

const FIELD_ROLES = ['sales_executive', 'sales_rep'];

const denyFieldWrite = (req, res, next) => {
  if (FIELD_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'This role can view this module but cannot create or change records' });
  }
  return next();
};

const crudRoutes = (router, controller, extras = {}) => {
  router.get('/', protect, controller.getAll);
  router.get('/:id', protect, controller.getOne);
  router.post('/', protect, denyFieldWrite, extras.create || controller.create);
  router.put('/:id', protect, denyFieldWrite, extras.update || controller.update);
  router.delete('/:id', protect, denyFieldWrite, controller.remove);
  Object.entries(extras).forEach(([path, handler]) => {
    if (path !== 'create' && path !== 'update') {
      router.post(`/${path}`, protect, denyFieldWrite, handler);
      router.get(`/${path}`, protect, handler);
      router.put(`/${path}/:id`, protect, denyFieldWrite, handler);
    }
  });
};

const router = Router();

const outlets = Router();
crudRoutes(outlets, ctrl.outletCtrl);
router.use('/outlets', outlets);

const products = Router();
crudRoutes(products, ctrl.productCtrl);
router.use('/products', products);

const routes = Router();
crudRoutes(routes, ctrl.routeCtrl);
router.use('/routes', routes);

const orders = Router();
crudRoutes(orders, ctrl.salesOrderCtrl, { create: ctrl.createSalesOrder });
router.use('/orders', orders);

const invoices = Router();
crudRoutes(invoices, ctrl.invoiceCtrl, { create: ctrl.createInvoice });
router.use('/invoices', invoices);

const payments = Router();
crudRoutes(payments, ctrl.paymentCtrl, { create: ctrl.createPayment });
payments.put('/approve/:id', protect, denyFieldWrite, ctrl.approvePayment);
router.use('/payments', payments);

const inventory = Router();
crudRoutes(inventory, ctrl.inventoryCtrl);
router.use('/inventory', inventory);

const attendance = Router();
crudRoutes(attendance, ctrl.attendanceCtrl);
attendance.post('/check-in', protect, ctrl.checkIn);
attendance.post('/check-out', protect, ctrl.checkOut);
attendance.post('/mark-visit', protect, ctrl.markVisit);
attendance.delete('/mark-visit/:outletId', protect, ctrl.unmarkVisit);
attendance.get('/visit-log', protect, ctrl.getVisitLog);
router.use('/attendance', attendance);

const tracking = Router();
tracking.post('/', protect, ctrl.trackLocation);
tracking.get('/live', protect, ctrl.getLiveLocations);
tracking.get('/', protect, ctrl.locationCtrl.getAll);
router.use('/tracking', tracking);

const vanSales = Router();
crudRoutes(vanSales, ctrl.vanSalesCtrl, { create: ctrl.createVanSale, update: ctrl.updateVanSale });
router.use('/van-sales', vanSales);

const targets = Router();
crudRoutes(targets, ctrl.targetCtrl);
router.use('/targets', targets);

const production = Router();
crudRoutes(production, ctrl.productionCtrl);
router.use('/production', production);

const purchases = Router();
crudRoutes(purchases, ctrl.purchaseCtrl);
router.use('/purchases', purchases);

const purchaseReturns = Router();
crudRoutes(purchaseReturns, ctrl.purchaseReturnCtrl);
router.use('/purchase-returns', purchaseReturns);

const support = Router();
crudRoutes(support, ctrl.supportCtrl);
router.use('/support', support);

router.get('/settings', protect, ctrl.settingsCtrl.get);
router.put('/settings', protect, ctrl.settingsCtrl.update);
router.post('/settings/tally-sync', protect, denyFieldWrite, ctrl.settingsCtrl.syncTally);
router.get('/reports/outstanding', protect, ctrl.getOutstandingReport);

export default router;
