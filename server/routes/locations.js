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

const FALLBACK_CITIES = {
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Andhra Pradesh': ['Amaravati', 'Anantapur', 'Guntur', 'Kakinada', 'Kurnool', 'Nellore', 'Tirupati', 'Vijayawada', 'Visakhapatnam'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  Assam: ['Dibrugarh', 'Dispur', 'Guwahati', 'Jorhat', 'Silchar', 'Tezpur', 'Tinsukia'],
  Bihar: ['Bhagalpur', 'Bihar Sharif', 'Darbhanga', 'Gaya', 'Muzaffarpur', 'Patna', 'Purnia'],
  Chandigarh: ['Chandigarh'],
  Chhattisgarh: ['Bhilai', 'Bilaspur', 'Durg', 'Korba', 'Raipur'],
  'Dadra and Nagar Haveli': ['Silvassa'],
  'Daman and Diu': ['Daman', 'Diu'],
  Delhi: ['Central Delhi', 'Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi'],
  Goa: ['Mapusa', 'Margao', 'Panaji', 'Ponda', 'Vasco da Gama'],
  Gujarat: ['Ahmedabad', 'Anand', 'Bhavnagar', 'Gandhinagar', 'Jamnagar', 'Rajkot', 'Surat', 'Vadodara'],
  Haryana: ['Ambala', 'Faridabad', 'Gurugram', 'Hisar', 'Karnal', 'Panipat', 'Rohtak', 'Sonipat'],
  'Himachal Pradesh': ['Dharamshala', 'Kullu', 'Mandi', 'Shimla', 'Solan'],
  'Jammu and Kashmir': ['Anantnag', 'Baramulla', 'Jammu', 'Srinagar', 'Udhampur'],
  Jharkhand: ['Bokaro', 'Deoghar', 'Dhanbad', 'Hazaribagh', 'Jamshedpur', 'Ranchi'],
  Karnataka: ['Belagavi', 'Bengaluru', 'Hubballi', 'Kalaburagi', 'Mangaluru', 'Mysuru', 'Shivamogga'],
  Kerala: ['Alappuzha', 'Kochi', 'Kollam', 'Kozhikode', 'Thrissur', 'Thiruvananthapuram'],
  Ladakh: ['Kargil', 'Leh'],
  Lakshadweep: ['Kavaratti'],
  'Madhya Pradesh': ['Bhopal', 'Gwalior', 'Indore', 'Jabalpur', 'Rewa', 'Sagar', 'Ujjain'],
  Maharashtra: ['Ahmednagar', 'Aurangabad', 'Kolhapur', 'Mumbai', 'Nagpur', 'Nashik', 'Pune', 'Solapur', 'Thane'],
  Manipur: ['Bishnupur', 'Churachandpur', 'Imphal', 'Thoubal'],
  Meghalaya: ['Jowai', 'Shillong', 'Tura'],
  Mizoram: ['Aizawl', 'Champhai', 'Lunglei'],
  Nagaland: ['Dimapur', 'Kohima', 'Mokokchung'],
  Odisha: ['Balasore', 'Berhampur', 'Bhubaneswar', 'Cuttack', 'Puri', 'Rourkela', 'Sambalpur'],
  Puducherry: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
  Punjab: ['Amritsar', 'Bathinda', 'Jalandhar', 'Ludhiana', 'Mohali', 'Patiala'],
  Rajasthan: ['Ajmer', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
  Sikkim: ['Gangtok', 'Gyalshing', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Erode', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Vellore'],
  Telangana: ['Hyderabad', 'Karimnagar', 'Khammam', 'Nizamabad', 'Ramagundam', 'Warangal'],
  Tripura: ['Agartala', 'Dharmanagar', 'Udaipur'],
  'Uttar Pradesh': ['Agra', 'Aligarh', 'Bareilly', 'Ghaziabad', 'Gorakhpur', 'Kanpur', 'Lucknow', 'Meerut', 'Noida', 'Prayagraj', 'Varanasi'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Nainital', 'Roorkee', 'Rudrapur'],
  'West Bengal': ['Asansol', 'Durgapur', 'Howrah', 'Kolkata', 'Siliguri'],
};

let statesCache = null;
const citiesCache = new Map();

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
    if (statesCache) return res.json(statesCache);
    const data = await fetchJson('/countries/states', { country: 'India' });
    const states = data?.data?.states?.map((state) => state.name).filter(Boolean) || FALLBACK_STATES;
    statesCache = [...new Set(states.length ? states : FALLBACK_STATES)].sort();
    res.json(statesCache);
  } catch {
    res.json(FALLBACK_STATES);
  }
});

router.get('/cities', protect, async (req, res) => {
  try {
    const state = String(req.query.state || '').trim();
    if (!state) return res.json([]);
    if (citiesCache.has(state)) return res.json(citiesCache.get(state));
    const data = await fetchJson('/countries/state/cities', { country: 'India', state });
    const cities = Array.isArray(data?.data) && data.data.length ? data.data : FALLBACK_CITIES[state] || [];
    const result = [...new Set(cities.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    citiesCache.set(state, result);
    res.json(result);
  } catch (error) {
    res.json(FALLBACK_CITIES[String(req.query.state || '').trim()] || []);
  }
});

export default router;
