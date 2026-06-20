import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();

const INDIA_POST_BASE = 'https://api.postalpincode.in';
const OGD_PINCODE_RESOURCE = 'https://api.data.gov.in/catalog/709e9d78-bf11-487d-93fd-d547d24cc0ef';

const normalizePostOffice = (postOffice) => ({
  name: postOffice.Name || postOffice.officename || '',
  pincode: String(postOffice.Pincode || postOffice.pincode || ''),
  district: postOffice.District || postOffice.district || '',
  state: postOffice.State || postOffice.statename || postOffice.StateName || '',
  region: postOffice.Region || postOffice.regionname || '',
  circle: postOffice.Circle || postOffice.circlename || '',
  deliveryStatus: postOffice.DeliveryStatus || postOffice.deliverystatus || '',
});

const uniqueByOfficeAndPin = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.name}-${item.pincode}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return item.pincode;
  });
};

router.get('/search', protect, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const path = /^\d{6}$/.test(q) ? `pincode/${q}` : `postoffice/${encodeURIComponent(q)}`;
    const response = await fetch(`${INDIA_POST_BASE}/${path}`);
    const data = await response.json();
    const records = data?.[0]?.PostOffice || [];
    res.json(uniqueByOfficeAndPin(records.map(normalizePostOffice)).slice(0, 50));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to search pincodes' });
  }
});

router.get('/directory', protect, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const apiKey = process.env.OGD_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const url = `${OGD_PINCODE_RESOURCE}?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    const records = (data.records || data.items || []).map(normalizePostOffice);
    res.json({
      count: data.count || records.length,
      total: data.total || data.total_count,
      offset,
      limit,
      records: uniqueByOfficeAndPin(records),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load pincode directory' });
  }
});

export default router;
