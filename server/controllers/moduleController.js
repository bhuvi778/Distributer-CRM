import { userCanDelete, userCanApprovePayments, userCanEditSettings } from '../utils/userPermissions.js';
import createCRUD from '../utils/createCRUD.js';
import Outlet from '../models/Outlet.js';
import Product from '../models/Product.js';
import Route from '../models/Route.js';
import SalesOrder from '../models/SalesOrder.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Inventory from '../models/Inventory.js';
import Attendance from '../models/Attendance.js';
import LocationTrack from '../models/LocationTrack.js';
import VanSales from '../models/VanSales.js';
import Target from '../models/Target.js';
import ProductionOrder from '../models/ProductionOrder.js';
import Purchase from '../models/Purchase.js';
import Settings from '../models/Settings.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

export const outletCtrl = createCRUD(Outlet, ['route', 'assignedTo'], 'outlets');
export const productCtrl = createCRUD(Product);
export const routeCtrl = createCRUD(Route, ['assignedReps', 'outlets']);
export const salesOrderCtrl = createCRUD(SalesOrder, ['outlet', 'salesRep', 'route', 'items.product'], 'orders');
export const invoiceCtrl = createCRUD(Invoice, ['outlet', 'salesRep', 'salesOrder'], 'invoices');
export const paymentCtrl = createCRUD(Payment, ['outlet', 'party', 'invoice', 'collectedBy'], 'payments');
export const inventoryCtrl = createCRUD(Inventory, ['product']);
export const attendanceCtrl = createCRUD(Attendance, ['user'], 'attendance');
export const locationCtrl = createCRUD(LocationTrack, ['user', 'route']);
export const vanSalesCtrl = createCRUD(VanSales, ['assignedTo', 'salesRep', 'route', 'loadIn.product', 'loadOut.product'], 'van-sales');
export const targetCtrl = createCRUD(Target, ['assignments.user']);
export const productionCtrl = createCRUD(ProductionOrder, ['finishedGood', 'bom.rawMaterial'], 'production');
export const purchaseCtrl = createCRUD(Purchase, ['outlet', 'items.product'], 'purchases');
export const supportCtrl = createCRUD(SupportTicket, ['createdBy', 'assignedTo', 'messages.sender']);

export const settingsCtrl = {
  get: async (req, res) => {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  update: async (req, res) => {
    try {
      if (!userCanEditSettings(req.user)) {
        return res.status(403).json({ message: 'You do not have permission to change company settings' });
      }
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create(req.body);
      else settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  syncTally: async (req, res) => {
    try {
      if (!userCanEditSettings(req.user)) {
        return res.status(403).json({ message: 'You do not have permission to sync with Tally' });
      }
      const settings = await Settings.findOne();
      settings.tallyIntegration.lastSync = new Date();
      await settings.save();
      res.json({ message: 'Tally sync initiated successfully', lastSync: settings.tallyIntegration.lastSync });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

export const checkIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let record = await Attendance.findOne({ user: req.user._id, date: today });
    if (record?.checkIn) return res.status(400).json({ message: 'Already checked in' });

    const data = {
      user: req.user._id,
      date: today,
      checkIn: new Date(),
      checkInLocation: req.body.location,
      status: 'present',
    };
    record = record
      ? await Attendance.findByIdAndUpdate(record._id, data, { new: true })
      : await Attendance.create(data);
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    if (!record?.checkIn) return res.status(400).json({ message: 'Not checked in' });
    if (record.checkOut) return res.status(400).json({ message: 'Already checked out' });

    const checkOut = new Date();
    const hours = (checkOut - record.checkIn) / (1000 * 60 * 60);
    record.checkOut = checkOut;
    record.checkOutLocation = req.body.location;
    record.workingHours = Math.round(hours * 100) / 100;
    record.overtime = hours > 8 ? Math.round((hours - 8) * 100) / 100 : 0;
    record.undertime = hours < 8 ? Math.round((8 - hours) * 100) / 100 : 0;
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markVisit = async (req, res) => {
  try {
    const { outletId, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ user: req.user._id, date: targetDate });
    if (!record) {
      record = await Attendance.create({
        user: req.user._id,
        date: targetDate,
        status: 'present',
        visitedOutlets: [outletId],
      });
    } else {
      if (!record.visitedOutlets.includes(outletId)) {
        record.visitedOutlets.push(outletId);
        await record.save();
      }
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unmarkVisit = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ user: req.user._id, date: targetDate });
    if (record) {
      record.visitedOutlets = record.visitedOutlets.filter(
        (id) => id.toString() !== req.params.outletId
      );
      await record.save();
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVisitLog = async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUser = userId || req.user._id;

    const records = await Attendance.find({ user: targetUser })
      .select('date visitedOutlets')
      .sort('-date');

    const visitLog = {};
    records.forEach((record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      visitLog[dateKey] = record.visitedOutlets.map((id) => id.toString());
    });

    res.json(visitLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const trackLocation = async (req, res) => {
  try {
    const track = await LocationTrack.create({ ...req.body, user: req.user._id });
    await User.findByIdAndUpdate(req.user._id, {
      lastLocation: { lat: req.body.lat, lng: req.body.lng, updatedAt: new Date() },
    });
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveLocations = async (req, res) => {
  try {
    if (!['admin', 'manager', 'sales_executive'].includes(req.user.role) && !req.user.permissions?.includes('view_all_tracking')) {
      const self = await User.findById(req.user._id).select('name email lastLocation assignedRoutes territory');
      return res.json(self?.lastLocation ? [self] : []);
    }
    const reps = await User.find({ role: { $in: ['sales_rep', 'sales_executive'] }, isActive: true, 'lastLocation.lat': { $exists: true } })
      .select('name email lastLocation assignedRoutes territory');
    res.json(reps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOutstandingReport = async (req, res) => {
  try {
    const outlets = await Outlet.find({ outstandingBalance: { $gt: 0 } })
      .select('name code outstandingBalance creditLimit phone route')
      .populate('route', 'name')
      .sort('-outstandingBalance');
    res.json(outlets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const paymentType = req.body.paymentType === 'out' ? 'out' : 'in';
    const payment = await Payment.create({
      ...req.body,
      paymentType,
      invoice: paymentType === 'out' ? undefined : req.body.invoice,
      outlet: paymentType === 'in' ? req.body.outlet : req.body.outlet || undefined,
      collectedBy: req.body.collectedBy || req.user._id,
    });
    const populated = await Payment.findById(payment._id)
      .populate('outlet', 'name code')
      .populate('party', 'name code type')
      .populate('invoice', 'invoiceNumber balanceDue')
      .populate('collectedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approvePayment = async (req, res) => {
  try {
      if (!userCanApprovePayments(req.user)) {
        return res.status(403).json({ message: 'You do not have permission to approve payments' });
      }
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (payment.paymentType !== 'out' && payment.status === 'approved' && payment.invoice) {
      const invoice = await Invoice.findById(payment.invoice);
      invoice.paidAmount += payment.amount;
      invoice.balanceDue = invoice.grandTotal - invoice.paidAmount;
      invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partial';
      await invoice.save();
      await Outlet.findByIdAndUpdate(payment.outlet, { $inc: { outstandingBalance: -payment.amount } });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVanSale = async (req, res) => {
  try {
    const body = { ...req.body };
    body.vehicleNo = body.vehicleNo || body.vanNumber;
    body.vanNumber = body.vanNumber || body.vehicleNo;
    body.assignedTo = body.assignedTo || body.salesRep;
    body.salesRep = body.salesRep || body.assignedTo;
    body.loadIn = (body.loadIn || []).map((item, idx) => {
      const qty = Number(item.qty ?? item.loadedQty ?? 0);
      return {
        ...item,
        serialNo: item.serialNo || String(idx + 1),
        itemCode: item.itemCode || item.product?.sku,
        itemName: item.itemName || item.productName || item.product?.name,
        productName: item.productName || item.itemName || item.product?.name,
        unit: item.unit || item.product?.unit,
        qty,
        loadedQty: Number(item.loadedQty ?? qty),
      };
    });
    const vanSale = await VanSales.create(body);
    const populated = await VanSales.findById(vanSale._id)
      .populate('assignedTo', 'name')
      .populate('salesRep', 'name')
      .populate('route', 'name area')
      .populate('loadIn.product', 'name sku unit');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVanSale = async (req, res) => {
  try {
    const body = { ...req.body };
    body.vehicleNo = body.vehicleNo || body.vanNumber;
    body.vanNumber = body.vanNumber || body.vehicleNo;
    body.assignedTo = body.assignedTo || body.salesRep;
    body.salesRep = body.salesRep || body.assignedTo;
    body.loadIn = (body.loadIn || []).map((item, idx) => {
      const qty = Number(item.qty ?? item.loadedQty ?? 0);
      return {
        ...item,
        serialNo: item.serialNo || String(idx + 1),
        itemName: item.itemName || item.productName,
        productName: item.productName || item.itemName,
        qty,
        loadedQty: Number(item.loadedQty ?? qty),
      };
    });
    const vanSale = await VanSales.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
      .populate('assignedTo', 'name')
      .populate('salesRep', 'name')
      .populate('route', 'name area')
      .populate('loadIn.product', 'name sku unit');
    if (!vanSale) return res.status(404).json({ message: 'Not found' });
    res.json(vanSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSalesOrder = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    let subtotal = 0, taxTotal = 0, discountTotal = 0;

    const processedItems = items.map((item) => {
      const amount = item.quantity * item.rate * (1 - (item.discount || 0) / 100);
      const tax = amount * (item.gstRate || 18) / 100;
      subtotal += amount;
      taxTotal += tax;
      discountTotal += item.quantity * item.rate * ((item.discount || 0) / 100);
      return { ...item, amount: Math.round(amount * 100) / 100 };
    });

    const order = await SalesOrder.create({
      ...rest,
      items: processedItems,
      salesRep: rest.salesRep || req.user._id,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      grandTotal: Math.round((subtotal + taxTotal) * 100) / 100,
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    let subtotal = 0, cgstTotal = 0, sgstTotal = 0;

    const processedItems = items.map((item) => {
      const amount = item.quantity * item.rate * (1 - (item.discount || 0) / 100);
      const tax = amount * (item.gstRate || 18) / 100;
      subtotal += amount;
      cgstTotal += tax / 2;
      sgstTotal += tax / 2;
      return {
        ...item,
        amount: Math.round(amount * 100) / 100,
        cgst: Math.round(tax / 2 * 100) / 100,
        sgst: Math.round(tax / 2 * 100) / 100,
      };
    });

    const grandTotal = subtotal + cgstTotal + sgstTotal;
    const invoice = await Invoice.create({
      ...rest,
      items: processedItems,
      salesRep: rest.salesRep || req.user._id,
      subtotal: Math.round(subtotal * 100) / 100,
      cgstTotal: Math.round(cgstTotal * 100) / 100,
      sgstTotal: Math.round(sgstTotal * 100) / 100,
      taxTotal: Math.round((cgstTotal + sgstTotal) * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      balanceDue: Math.round(grandTotal * 100) / 100,
    });

    if (rest.outlet) {
      await Outlet.findByIdAndUpdate(rest.outlet, { $inc: { outstandingBalance: grandTotal } });
    }
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
