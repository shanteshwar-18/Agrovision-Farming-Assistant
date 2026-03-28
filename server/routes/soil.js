// ============================================================
// Soil Route — AgroMonitoring primary, Open-Meteo derived fallback
// GET /api/soil?lat=...&lon=...&polyid=...
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY = process.env.SOIL_API_KEY;
const BASE = 'https://api.agromonitoring.com/agro/1.0';

let cachedPolyId = null;

async function getFirstPolygon() {
  try {
    const res = await fetch(`${BASE}/polygons?appid=${process.env.SOIL_API_KEY}`, { timeout: 8000 });
    if (!res.ok) return null;
    const data = await res.json();
    return (Array.isArray(data) && data.length > 0) ? (data[0].id ?? null) : null;
  } catch { return null; }
}

async function createPolygon(lat, lon) {
  const delta = 0.005;
  const body = {
    name: `AgroVision_${Date.now()}`,
    geo_json: {
      type: 'Feature', properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[lon - delta, lat - delta], [lon + delta, lat - delta], [lon + delta, lat + delta], [lon - delta, lat + delta], [lon - delta, lat - delta]]],
      },
    },
  };
  try {
    const res = await fetch(`${BASE}/polygons?appid=${process.env.SOIL_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), timeout: 8000,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch { return null; }
}

/**
 * Derive soil estimates from Open-Meteo (free, no key).
 * Uses hourly soil temperature and moisture variables.
 */
async function fetchDerivedSoil(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=soil_temperature_0cm,soil_temperature_6cm,soil_moisture_0_to_1cm&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto&forecast_days=1`;
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error('Open-Meteo soil fetch failed');
    const json = await res.json();

    // Latest hourly values (index 0 = now)
    const soilTemp0 = json.hourly?.soil_temperature_0cm?.[0] ?? (json.current?.temperature_2m + 2) ?? 27;
    const soilTemp6 = json.hourly?.soil_temperature_6cm?.[0] ?? (json.current?.temperature_2m) ?? 24;
    const moisture = json.hourly?.soil_moisture_0_to_1cm?.[0] ?? null;

    // Fallback: derive from humidity + precip if no direct soil moisture
    const humidity = json.current?.relative_humidity_2m ?? 60;
    const precip = json.current?.precipitation ?? 0;
    const derivedMoisture = moisture ?? Math.max(0.05, Math.min(0.6,
      (humidity / 100) * 0.5 + (precip > 0 ? 0.15 : 0) + (soilTemp0 > 35 ? -0.1 : 0)
    ));

    return {
      source: 'open-meteo',
      polyid: null,
      t0: soilTemp0 + 273.15,        // stored in Kelvin (like AgroMonitoring)
      t10: soilTemp6 + 273.15,
      moisture: parseFloat(derivedMoisture.toFixed(3)),
    };
  } catch {
    // Ultimate hardcoded fallback for disconnected mode
    return { source: 'derived', polyid: null, t0: 300.15, t10: 297.15, moisture: 0.35 };
  }
}

router.get('/', async (req, res) => {
  const { lat, lon, polyid: clientPolyId } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  const API_KEY = process.env.SOIL_API_KEY;

  // Try AgroMonitoring if key looks valid
  if (API_KEY && API_KEY.length > 20) {
    let polyid = clientPolyId || cachedPolyId;
    if (!polyid) polyid = await getFirstPolygon();
    if (!polyid) polyid = await createPolygon(latNum, lonNum);
    if (polyid) cachedPolyId = polyid;

    if (polyid) {
      try {
        const soilRes = await fetch(`${BASE}/soil?polyid=${polyid}&appid=${API_KEY}`, { timeout: 8000 });
        if (soilRes.ok) {
          const data = await soilRes.json();
          return res.json({ ...data, polyid, source: 'agromonitoring' });
        }
        // Stale polyid — clear cache
        cachedPolyId = null;
      } catch (err) {
        console.warn('[Soil] AgroMonitoring failed:', err.message);
      }
    }
  }

  // Fallback to Open-Meteo derived soil data
  const derived = await fetchDerivedSoil(latNum, lonNum);
  res.json(derived);
});

export default router;
