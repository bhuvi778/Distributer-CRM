import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Lead from '../models/Lead.js';

const router = Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status, source, type, search, assignedTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (type) filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const leads = await Lead.find(filter).populate('assignedTo', 'name').sort('-createdAt');
    res.json(leads);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, assignedTo: req.body.assignedTo || req.user._id });
    res.status(201).json(lead);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lead);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
