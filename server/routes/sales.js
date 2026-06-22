import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Estimate from '../models/Estimate.js';
import SalesOrder from '../models/SalesOrder.js';
import Invoice from '../models/Invoice.js';
import DeliveryChallan from '../models/DeliveryChallan.js';
import SalesReturn from '../models/SalesReturn.js';
import CreditNote from '../models/CreditNote.js';
import Settings from '../models/Settings.js';

const router = Router();
const FIELD_ROLES = ['sales_executive', 'sales_rep'];

const denyFieldWrite = (req, res, next) => {
  if (FIELD_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'This role can view sales records but cannot create or change them' });
  }
  return next();
};

const TRANSACTION_SETTING_DEFAULTS = {
  vehicleNo: false,
  ewayBillNo: false,
  creditPeriod: false,
  roundOff: false,
  termsAndConditions: false,
  minOrderValue: '',
  discountName: '',
  discountType: 'Percent',
  chargesName: '',
  customFields: [],
};

const ESTIMATE_SETTING_DEFAULTS = {
  ...TRANSACTION_SETTING_DEFAULTS,
  poNumber: '',
};

const normalizeTransactionSettings = (type, value = {}) => {
  const defaults = type === 'estimate' ? ESTIMATE_SETTING_DEFAULTS : TRANSACTION_SETTING_DEFAULTS;
  const customFields = Array.isArray(value.customFields)
    ? value.customFields
      .map((field) => ({
        label: String(field.label || '').trim(),
        enabled: field.enabled !== false,
      }))
      .filter((field, index, fields) => (
        field.label && fields.findIndex((item) => item.label.toLowerCase() === field.label.toLowerCase()) === index
      ))
    : [];

  return {
    ...defaults,
    ...value,
    customFields,
  };
};

router.get('/settings/:type', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const type = req.params.type || 'invoice';
    res.json(normalizeTransactionSettings(type, settings.transactionSettings?.[type]));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/settings/:type', protect, denyFieldWrite, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const type = req.params.type || 'invoice';
    const current = settings.transactionSettings || {};
    const next = normalizeTransactionSettings(type, req.body || {});
    settings.transactionSettings = { ...current, [type]: next };
    settings.markModified('transactionSettings');
    await settings.save();
    res.json(next);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── ESTIMATES ─────────────────────────────────────────────────
router.get('/estimates', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { estimateNumber: new RegExp(search, 'i') },
      { partyName: new RegExp(search, 'i') },
    ];
    const estimates = await Estimate.find(filter).populate('outlet', 'name').populate('party', 'name').populate('createdBy', 'name').sort('-createdAt');
    res.json(estimates);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/estimates', protect, denyFieldWrite, async (req, res) => {
  try {
    const est = await Estimate.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(est);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/estimates/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const est = await Estimate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(est);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Convert estimate to order
router.post('/estimates/:id/convert', protect, denyFieldWrite, async (req, res) => {
  try {
    const est = await Estimate.findById(req.params.id);
    if (!est) return res.status(404).json({ message: 'Estimate not found' });
    const order = await SalesOrder.create({
      outlet: est.outlet,
      salesRep: req.user._id,
      items: est.items,
      subtotal: est.subtotal,
      taxTotal: est.taxTotal,
      grandTotal: est.grandTotal,
      status: 'pending',
      notes: `Converted from ${est.estimateNumber}`,
    });
    await Estimate.findByIdAndUpdate(est._id, { status: 'converted', convertedToOrder: order._id });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── DELIVERY CHALLANS ──────────────────────────────────────────
router.get('/delivery-challans', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.challanNumber = new RegExp(search, 'i');
    const challans = await DeliveryChallan.find(filter)
      .populate('outlet', 'name')
      .populate('party', 'name')
      .populate('salesOrder', 'orderNumber')
      .populate('deliveryAgent', 'name')
      .sort('-createdAt');
    res.json(challans);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/delivery-challans', protect, denyFieldWrite, async (req, res) => {
  try {
    const challan = await DeliveryChallan.create(req.body);
    res.status(201).json(challan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/delivery-challans/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    if (req.body.status === 'delivered') req.body.deliveredDate = new Date();
    if (req.body.status === 'dispatched') req.body.dispatchDate = new Date();
    const challan = await DeliveryChallan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(challan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── SALES RETURNS ──────────────────────────────────────────────
router.get('/returns', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.returnNumber = new RegExp(search, 'i');
    const returns = await SalesReturn.find(filter)
      .populate('outlet', 'name')
      .populate('party', 'name')
      .populate('salesOrder', 'orderNumber')
      .populate('processedBy', 'name')
      .sort('-createdAt');
    res.json(returns);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/returns', protect, denyFieldWrite, async (req, res) => {
  try {
    const ret = await SalesReturn.create(req.body);
    res.status(201).json(ret);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/returns/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      req.body.processedBy = req.user._id;
    }
    const ret = await SalesReturn.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ret);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/credit-notes', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { creditNoteNumber: new RegExp(search, 'i') },
      { partyName: new RegExp(search, 'i') },
    ];
    const notes = await CreditNote.find(filter)
      .populate('outlet', 'name')
      .populate('party', 'name')
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(notes);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/credit-notes', protect, denyFieldWrite, async (req, res) => {
  try {
    const note = await CreditNote.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(note);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/credit-notes/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const note = await CreditNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(note);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
