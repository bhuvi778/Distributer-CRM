import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Party from '../models/Party.js';

const router = Router();

// GET all with filters
router.get('/', protect, async (req, res) => {
  try {
    const { type, search, group, isActive } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (group) filter.group = group;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true;
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { gstin: new RegExp(search, 'i') },
    ];
    const parties = await Party.find(filter).populate('assignedTo', 'name').populate('route', 'name').sort('-createdAt');
    res.json(parties);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/groups', protect, async (req, res) => {
  try {
    const groups = await Party.distinct('group', { group: { $nin: [null, ''] } });
    res.json(groups);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findById(req.params.id).populate('assignedTo', 'name phone').populate('route', 'name');
    if (!party) return res.status(404).json({ message: 'Party not found' });
    res.json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const party = await Party.create(req.body);
    res.status(201).json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Party.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Party deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
