import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Warehouse from '../models/Warehouse.js';
import PriceList from '../models/PriceList.js';
import TransferOrder from '../models/TransferOrder.js';

const router = Router();

// ─── ITEMS (Products) ───────────────────────────────────────────
router.get('/items', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }];
    if (category) filter.category = category;
    const items = await Product.find(filter).sort('-createdAt');
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/items', protect, async (req, res) => {
  try {
    const item = await Product.create(req.body);
    await Inventory.create({ product: item._id, quantity: req.body.openingStock || 0, availableQty: req.body.openingStock || 0, warehouse: 'Main' });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/items/:id', protect, async (req, res) => {
  try {
    const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/items/:id', protect, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Stock adjustment
router.post('/items/:id/adjust-stock', protect, async (req, res) => {
  try {
    const { warehouse, adjustmentType, adjustQty, comments } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Item not found' });

    let newStock = product.stock;
    if (adjustmentType === 'add')      newStock = product.stock + Number(adjustQty);
    if (adjustmentType === 'subtract') newStock = Math.max(0, product.stock - Number(adjustQty));
    if (adjustmentType === 'set')      newStock = Number(adjustQty);

    product.stock = newStock;
    await product.save();

    // Also update inventory record
    await Inventory.findOneAndUpdate(
      { product: product._id, warehouse: warehouse || 'Main' },
      { quantity: newStock, availableQty: newStock },
      { upsert: true }
    );

    res.json({ stock: newStock, message: 'Stock adjusted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── WAREHOUSES ─────────────────────────────────────────────────
router.get('/warehouses', protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email').sort('name');
    // Attach stock summary for each warehouse
    const result = await Promise.all(warehouses.map(async (wh) => {
      const stockCount = await Inventory.countDocuments({ warehouse: wh.name });
      const totalQty = await Inventory.aggregate([
        { $match: { warehouse: wh.name } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      return { ...wh.toObject(), stockCount, totalQuantity: totalQty[0]?.total || 0 };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/warehouses', protect, async (req, res) => {
  try {
    const wh = await Warehouse.create(req.body);
    res.status(201).json(wh);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/warehouses/:id', protect, async (req, res) => {
  try {
    const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(wh);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/warehouses/:id', protect, async (req, res) => {
  try {
    await Warehouse.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Warehouse deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Stock per warehouse
router.get('/warehouses/:name/stock', protect, async (req, res) => {
  try {
    const stock = await Inventory.find({ warehouse: req.params.name }).populate('product', 'name sku category mrp sellingPrice');
    res.json(stock);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── PRICE LISTS ────────────────────────────────────────────────
router.get('/price-lists', protect, async (req, res) => {
  try {
    const lists = await PriceList.find({ isActive: true }).populate('items.product', 'name sku').sort('-createdAt');
    res.json(lists);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/price-lists', protect, async (req, res) => {
  try {
    const list = await PriceList.create(req.body);
    res.status(201).json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/price-lists/:id', protect, async (req, res) => {
  try {
    const list = await PriceList.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/price-lists/:id', protect, async (req, res) => {
  try {
    await PriceList.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Price list deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── TRANSFER ORDERS ────────────────────────────────────────────
router.get('/transfers', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.transferNumber = new RegExp(search, 'i');
    const transfers = await TransferOrder.find(filter)
      .populate('items.product', 'name sku')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort('-createdAt');
    res.json(transfers);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/transfers', protect, async (req, res) => {
  try {
    const transfer = await TransferOrder.create({ ...req.body, requestedBy: req.user._id });
    res.status(201).json(transfer);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/transfers/:id', protect, async (req, res) => {
  try {
    if (req.body.status === 'completed' && !req.body.approvedBy) {
      req.body.approvedBy = req.user._id;
      req.body.receivedDate = new Date();
    }
    const transfer = await TransferOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(transfer);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
