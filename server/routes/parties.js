import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Party from '../models/Party.js';
import PartyGroup from '../models/PartyGroup.js';
import PartyVisit from '../models/PartyVisit.js';
import Settings from '../models/Settings.js';

const router = Router();
const FIELD_ROLES = ['sales_executive', 'sales_rep'];

const PARTY_SETTING_DEFAULTS = {
  route: true,
  status: true,
  creditBillLimit: true,
  sequence: false,
  erpId: false,
  mobileMandatory: false,
  customFields: [],
};

const VISIT_SETTING_DEFAULTS = {
  photoMandatory: false,
  scheduleVisit: false,
  commentOptions: 'Shop Closed, Already have stock',
  customFields: [],
};

const normalizeSettings = (type, value = {}) => {
  const defaults = type === 'visited' ? VISIT_SETTING_DEFAULTS : PARTY_SETTING_DEFAULTS;
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

const denyFieldWrite = (req, res, next) => {
  if (FIELD_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'You can view this section but cannot create or change records.' });
  }
  return next();
};

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
    const [savedGroups, partyGroups] = await Promise.all([
      PartyGroup.find({ isActive: true }).sort('name').lean(),
      Party.distinct('group', { group: { $nin: [null, ''] } }),
    ]);
    const savedNames = new Set(savedGroups.map((group) => group.name));
    const legacyGroups = partyGroups
      .filter((name) => name && !savedNames.has(name))
      .map((name) => ({ _id: `legacy-${name}`, name, isLegacy: true }));
    res.json([...savedGroups, ...legacyGroups]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/settings/:type', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const type = req.params.type || 'customer';
    res.json(normalizeSettings(type, settings.partySettings?.[type]));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/settings/:type', protect, denyFieldWrite, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const type = req.params.type || 'customer';
    const current = settings.partySettings || {};
    const next = normalizeSettings(type, req.body || {});
    settings.partySettings = { ...current, [type]: next };
    settings.markModified('partySettings');
    await settings.save();
    res.json(next);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/groups', protect, denyFieldWrite, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Group name is required' });
    const group = await PartyGroup.findOneAndUpdate(
      { name },
      { name, isActive: true },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(group);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/groups/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Group name is required' });
    const group = await PartyGroup.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/groups/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const group = await PartyGroup.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/visits', protect, async (req, res) => {
  try {
    const { search, status, partyType } = req.query;
    const filter = {};
    if (FIELD_ROLES.includes(req.user.role)) filter.createdBy = req.user._id;
    if (status) filter.status = status;
    if (partyType) filter.partyType = partyType;
    if (search) {
      filter.$or = [
        { partyName: new RegExp(search, 'i') },
        { region: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { area: new RegExp(search, 'i') },
        { comment: new RegExp(search, 'i') },
      ];
    }
    const visits = await PartyVisit.find(filter)
      .populate('party', 'name type group phone address')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json(visits);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/visits', protect, async (req, res) => {
  try {
    const body = req.body || {};
    const party = body.party ? await Party.findById(body.party).select('name type address') : null;
    const visit = await PartyVisit.create({
      party: party?._id,
      partyType: body.partyType || party?.type || 'customer',
      partyName: body.partyName || party?.name || '',
      region: body.region || '',
      city: body.city || party?.address?.city || '',
      area: body.area || '',
      comment: body.comment || '',
      status: body.status || 'active',
      location: body.location || {},
      selfie: body.selfie || '',
      partyPhoto: body.partyPhoto || '',
      createdBy: req.user._id,
    });
    const populated = await visit.populate([
      { path: 'party', select: 'name type group phone address' },
      { path: 'createdBy', select: 'name email' },
    ]);
    res.status(201).json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findById(req.params.id).populate('assignedTo', 'name phone').populate('route', 'name');
    if (!party) return res.status(404).json({ message: 'Party not found' });
    res.json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, denyFieldWrite, async (req, res) => {
  try {
    const party = await Party.create(req.body);
    res.status(201).json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(party);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, denyFieldWrite, async (req, res) => {
  try {
    await Party.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Party deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
