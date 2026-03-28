// ============================================================
// Market Route — data.gov.in Agmarknet + realistic fallback data
// GET /api/market?commodity=Rice&limit=50
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Realistic fallback mandi price data (updated March 2025 averages)
const FALLBACK_PRICES = {
  rice:      [{ commodity: 'Rice', variety: 'Common', market: 'Pune', state: 'Maharashtra', district: 'Pune', min_price: '1900', modal_price: '2200', max_price: '2500', arrival_date: '28/03/2025' }, { commodity: 'Rice', variety: 'Basmati', market: 'Nashik', state: 'Maharashtra', district: 'Nashik', min_price: '3500', modal_price: '4000', max_price: '4500', arrival_date: '28/03/2025' }],
  wheat:     [{ commodity: 'Wheat', variety: 'Dara', market: 'Indore', state: 'Madhya Pradesh', district: 'Indore', min_price: '2100', modal_price: '2350', max_price: '2600', arrival_date: '28/03/2025' }],
  cotton:    [{ commodity: 'Cotton', variety: 'Long Staple', market: 'Akola', state: 'Maharashtra', district: 'Akola', min_price: '7000', modal_price: '7800', max_price: '8500', arrival_date: '28/03/2025' }],
  onion:     [{ commodity: 'Onion', variety: 'Red', market: 'Lasalgaon', state: 'Maharashtra', district: 'Nashik', min_price: '600', modal_price: '1200', max_price: '2000', arrival_date: '28/03/2025' }],
  tomato:    [{ commodity: 'Tomato', variety: 'Desi', market: 'Kolkata', state: 'West Bengal', district: 'Hooghly', min_price: '800', modal_price: '1400', max_price: '2200', arrival_date: '28/03/2025' }],
  potato:    [{ commodity: 'Potato', variety: 'Jyothi', market: 'Agra', state: 'Uttar Pradesh', district: 'Agra', min_price: '700', modal_price: '900', max_price: '1200', arrival_date: '28/03/2025' }],
  soyabean:  [{ commodity: 'Soyabean', variety: 'Yellow', market: 'Latur', state: 'Maharashtra', district: 'Latur', min_price: '3900', modal_price: '4400', max_price: '4900', arrival_date: '28/03/2025' }],
  sugarcane: [{ commodity: 'Sugarcane', variety: 'CO-86032', market: 'Kolhapur', state: 'Maharashtra', district: 'Kolhapur', min_price: '3100', modal_price: '3400', max_price: '3700', arrival_date: '28/03/2025' }],
  maize:     [{ commodity: 'Maize', variety: 'Hybrid', market: 'Davangere', state: 'Karnataka', district: 'Davangere', min_price: '1600', modal_price: '1900', max_price: '2200', arrival_date: '28/03/2025' }],
  groundnut: [{ commodity: 'Groundnut', variety: 'Bold', market: 'Rajkot', state: 'Gujarat', district: 'Rajkot', min_price: '5500', modal_price: '6200', max_price: '7000', arrival_date: '28/03/2025' }],
  mustard:   [{ commodity: 'Mustard', variety: 'Sarson', market: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', min_price: '4800', modal_price: '5400', max_price: '5900', arrival_date: '28/03/2025' }],
  corn:      [{ commodity: 'Maize', variety: 'Local', market: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', min_price: '1700', modal_price: '2000', max_price: '2300', arrival_date: '28/03/2025' }],
};

function getFallbackRecords(commodity) {
  if (!commodity) {
    return Object.values(FALLBACK_PRICES).flat();
  }
  const key = commodity.toLowerCase().trim();
  return FALLBACK_PRICES[key] ?? Object.values(FALLBACK_PRICES).flat().filter(r =>
    r.commodity.toLowerCase().includes(key)
  );
}

router.get('/', async (req, res) => {
  const { commodity, limit = '50', offset = '0' } = req.query;

  const API_KEY = process.env.DATA_GOV_API_KEY;
  // Try real API first
  if (API_KEY && API_KEY.length > 20) {
    const params = new URLSearchParams({ 'api-key': API_KEY, format: 'json', limit, offset });
    if (commodity) params.set('filters[commodity]', commodity);

    try {
      const response = await fetch(`${BASE}?${params.toString()}`, { timeout: 10000 });
      if (response.ok) {
        const data = await response.json();
        if (data.records?.length > 0) {
          data.source = 'data.gov.in';
          return res.json(data);
        }
      }
      throw new Error(`data.gov.in returned status ${response.status}`);
    } catch (err) {
      console.warn('[Market] data.gov.in failed, using fallback:', err.message);
    }
  }

  // Fallback — realistic mandi data
  const records = getFallbackRecords(commodity);
  res.json({
    source: 'fallback',
    total: records.length,
    count: records.length,
    offset: 0,
    limit: parseInt(limit),
    records,
  });
});

export default router;
