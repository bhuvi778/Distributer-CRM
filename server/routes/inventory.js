import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Warehouse from '../models/Warehouse.js';
import PriceList from '../models/PriceList.js';
import TransferOrder from '../models/TransferOrder.js';
import ItemOption from '../models/ItemOption.js';

const router = Router();
const FIELD_ROLES = ['sales_executive', 'sales_rep'];

const denyFieldWrite = (req, res, next) => {
  if (FIELD_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'You can view inventory but cannot create or change records.' });
  }
  return next();
};

const OPTION_TYPES = ['category', 'brand'];

const normalizeOptionName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const syncProductOptions = async (type) => {
  const field = type === 'category' ? 'category' : 'brand';
  const names = (await Product.distinct(field, { [field]: { $nin: [null, ''] } }))
    .map(normalizeOptionName)
    .filter(Boolean);

  for (const name of names) {
    const exists = await ItemOption.findOne({ type, name });
    if (!exists) await ItemOption.create({ type, name, isActive: true });
  }
};

router.get('/item-options', protect, async (req, res) => {
  try {
    const type = req.query.type;
    if (type && !OPTION_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid option type' });
    }

    const types = type ? [type] : OPTION_TYPES;
    await Promise.all(types.map(syncProductOptions));

    const filter = { isActive: true };
    if (type) filter.type = type;
    const options = await ItemOption.find(filter).sort({ type: 1, name: 1 });
    res.json(options);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/item-options', protect, denyFieldWrite, async (req, res) => {
  try {
    const type = String(req.body.type || '').trim();
    const name = normalizeOptionName(req.body.name);
    if (!OPTION_TYPES.includes(type)) return res.status(400).json({ message: 'Invalid option type' });
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const option = await ItemOption.findOneAndUpdate(
      { type, name },
      { type, name, isActive: true, createdBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(201).json(option);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Option already exists' });
    res.status(500).json({ message: e.message });
  }
});

router.delete('/item-options/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const option = await ItemOption.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!option) return res.status(404).json({ message: 'Option not found' });
    res.json({ message: 'Option deleted', option });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── ITEMS (Products) ───────────────────────────────────────────
router.get('/items', protect, async (req, res) => {
  try {
    const { search, category, status, warehouse } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }];
    if (category) filter.category = category;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    const items = await Product.find(filter).sort('-createdAt').lean();
    if (!warehouse) return res.json(items);

    const stock = await Inventory.find({ warehouse }).lean();
    const stockByProduct = new Map(stock.map((row) => [row.product.toString(), row]));
    res.json(items.map((item) => {
      const inv = stockByProduct.get(item._id.toString());
      return {
        ...item,
        selectedWarehouse: warehouse,
        stock: inv?.quantity ?? 0,
        availableQty: inv?.availableQty ?? 0,
        reservedQty: inv?.reservedQty ?? 0,
      };
    }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/items', protect, denyFieldWrite, async (req, res) => {
  try {
    const item = await Product.create(req.body);
    const warehouse = req.body.warehouse || 'Main';
    await Inventory.create({ product: item._id, quantity: req.body.openingStock || 0, availableQty: req.body.openingStock || 0, warehouse });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/items/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (req.body.warehouse && req.body.stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { product: item._id, warehouse: req.body.warehouse },
        { quantity: Number(req.body.stock) || 0, availableQty: Number(req.body.stock) || 0 },
        { upsert: true }
      );
    }
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/items/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Stock adjustment
router.post('/items/:id/adjust-stock', protect, denyFieldWrite, async (req, res) => {
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
    const filter = {};
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;
    const warehouses = await Warehouse.find(filter).populate('manager', 'name email').sort('name');
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

router.post('/warehouses', protect, denyFieldWrite, async (req, res) => {
  try {
    const wh = await Warehouse.create(req.body);
    res.status(201).json(wh);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/warehouses/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(wh);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/warehouses/import', protect, denyFieldWrite, async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ message: 'No warehouse rows found' });
    let imported = 0;
    for (const row of rows) {
      if (!row.name || !row.address?.street || !row.address?.state) continue;
      const payload = {
        name: row.name,
        code: row.code || undefined,
        type: row.type || 'primary',
        gstin: row.gstin || '',
        address: {
          street: row.address.street,
          city: row.address.city || '',
          state: row.address.state,
          pincode: row.address.pincode || '',
        },
        phone: row.phone || '',
        email: row.email || '',
        isActive: row.isActive !== false,
        notes: row.notes || '',
      };
      if (payload.code) {
        await Warehouse.findOneAndUpdate({ code: payload.code }, payload, { upsert: true, runValidators: true, new: true });
      } else {
        await Warehouse.create(payload);
      }
      imported += 1;
    }
    res.json({ imported });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/warehouses/:id', protect, denyFieldWrite, async (req, res) => {
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

router.post('/price-lists', protect, denyFieldWrite, async (req, res) => {
  try {
    const list = await PriceList.create(req.body);
    res.status(201).json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/price-lists/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const list = await PriceList.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/price-lists/import', protect, denyFieldWrite, async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ message: 'No price list rows found' });
    let imported = 0;
    for (const row of rows) {
      if (!row.name) continue;
      const payload = {
        name: row.name,
        code: row.code || undefined,
        applicableTo: row.applicableTo || 'all',
        pricingType: row.pricingType || 'fixed',
        markupPercent: Number(row.markupPercent || 0),
        markdownPercent: Number(row.markdownPercent || 0),
        fixedAmount: Number(row.fixedAmount || 0),
        isActive: row.isActive !== false,
        validFrom: row.validFrom || undefined,
        validTo: row.validTo || undefined,
        notes: row.notes || '',
        items: row.items || [],
      };
      if (payload.code) {
        await PriceList.findOneAndUpdate({ code: payload.code }, payload, { upsert: true, runValidators: true, new: true });
      } else {
        await PriceList.create(payload);
      }
      imported += 1;
    }
    res.json({ imported });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/price-lists/:id', protect, denyFieldWrite, async (req, res) => {
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

router.post('/transfers', protect, denyFieldWrite, async (req, res) => {
  try {
    const transfer = await TransferOrder.create({ ...req.body, requestedBy: req.user._id });
    res.status(201).json(transfer);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/transfers/:id', protect, denyFieldWrite, async (req, res) => {
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
