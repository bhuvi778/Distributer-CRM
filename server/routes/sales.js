import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Estimate from '../models/Estimate.js';
import SalesOrder from '../models/SalesOrder.js';
import Invoice from '../models/Invoice.js';
import DeliveryChallan from '../models/DeliveryChallan.js';
import SalesReturn from '../models/SalesReturn.js';

const router = Router();

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

router.post('/estimates', protect, async (req, res) => {
  try {
    const est = await Estimate.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(est);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/estimates/:id', protect, async (req, res) => {
  try {
    const est = await Estimate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(est);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Convert estimate to order
router.post('/estimates/:id/convert', protect, async (req, res) => {
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

router.post('/delivery-challans', protect, async (req, res) => {
  try {
    const challan = await DeliveryChallan.create(req.body);
    res.status(201).json(challan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/delivery-challans/:id', protect, async (req, res) => {
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

router.post('/returns', protect, async (req, res) => {
  try {
    const ret = await SalesReturn.create(req.body);
    res.status(201).json(ret);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/returns/:id', protect, async (req, res) => {
  try {
    if (req.body.status === 'approved' || req.body.status === 'rejected') {
      req.body.processedBy = req.user._id;
    }
    const ret = await SalesReturn.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ret);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
