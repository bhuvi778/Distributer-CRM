import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();
const LOCATION_API = 'https://countriesnow.space/api/v0.1';

const FALLBACK_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

const fetchJson = async (path, body) => {
  const response = await fetch(`${LOCATION_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
};

router.get('/states', protect, async (req, res) => {
  try {
    const data = await fetchJson('/countries/states', { country: 'India' });
    const states = data?.data?.states?.map((state) => state.name).filter(Boolean) || FALLBACK_STATES;
    res.json([...new Set(states)].sort());
  } catch {
    res.json(FALLBACK_STATES);
  }
});

router.get('/cities', protect, async (req, res) => {
  try {
    const state = String(req.query.state || '').trim();
    if (!state) return res.json([]);
    const data = await fetchJson('/countries/state/cities', { country: 'India', state });
    const cities = Array.isArray(data?.data) ? data.data : [];
    res.json([...new Set(cities.filter(Boolean))].sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load cities' });
  }
});

export default router;
