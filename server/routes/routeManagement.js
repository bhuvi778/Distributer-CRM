import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { Region, City, Area } from '../models/Region.js';

const router = Router();

// ─── REGIONS ────────────────────────────────────────────────────
router.get('/regions', protect, async (req, res) => {
  try {
    const regions = await Region.find({ isActive: true }).populate('manager', 'name').sort('name');
    res.json(regions);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/regions', protect, async (req, res) => {
  try {
    const region = await Region.create(req.body);
    res.status(201).json(region);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/regions/:id', protect, async (req, res) => {
  try {
    const region = await Region.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(region);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/regions/:id', protect, async (req, res) => {
  try {
    await Region.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Region deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── CITIES ─────────────────────────────────────────────────────
router.get('/cities', protect, async (req, res) => {
  try {
    const { region } = req.query;
    const filter = { isActive: true };
    if (region) filter.region = region;
    const cities = await City.find(filter).populate('region', 'name').sort('name');
    res.json(cities);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/cities', protect, async (req, res) => {
  try {
    const city = await City.create(req.body);
    res.status(201).json(city);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/cities/:id', protect, async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(city);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/cities/:id', protect, async (req, res) => {
  try {
    await City.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'City deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── AREAS ──────────────────────────────────────────────────────
router.get('/areas', protect, async (req, res) => {
  try {
    const { city, region } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = city;
    if (region) filter.region = region;
    const areas = await Area.find(filter).populate('city', 'name').populate('region', 'name').populate('assignedRep', 'name').sort('name');
    res.json(areas);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/areas', protect, async (req, res) => {
  try {
    const area = await Area.create(req.body);
    res.status(201).json(area);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/areas/:id', protect, async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(area);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/areas/:id', protect, async (req, res) => {
  try {
    await Area.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Area deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
