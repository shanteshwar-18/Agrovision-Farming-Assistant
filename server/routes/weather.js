// ============================================================
// Weather Route — Visual Crossing primary, Open-Meteo fallback (FREE, no key)
// GET /api/weather?lat=...&lon=...
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const VC_KEY = process.env.WEATHER_API_KEY;

// WMO weather condition codes → readable text + farming action
const WMO_CODES = {
  0: { text: 'Clear sky', action: 'High UV. Water crops early morning or evening.' },
  1: { text: 'Mainly clear', action: 'Good day for field operations.' },
  2: { text: 'Partly cloudy', action: 'Optimal spray window — low UV, low wind drift.' },
  3: { text: 'Overcast', action: 'Good day for transplanting seedlings.' },
  45: { text: 'Foggy', action: 'Delay pesticide spray. Risk of fungal disease — monitor crops.' },
  48: { text: 'Icy fog', action: 'Protect crops from frost. No field activity.' },
  51: { text: 'Light drizzle', action: 'Delay fertilizer. Light rain may cause runoff.' },
  61: { text: 'Slight rain', action: 'Delay irrigation. Check field drainage.' },
  63: { text: 'Moderate rain', action: 'Pause all field work. Check drainage channels.' },
  65: { text: 'Heavy rain', action: 'Avoid field operations. Ensure proper drainage immediately.' },
  71: { text: 'Slight snow', action: 'Protect crops. No field activity.' },
  80: { text: 'Slight showers', action: 'Delay irrigation — natural rain expected.' },
  81: { text: 'Moderate showers', action: 'Pause field operations. Allow soil to drain.' },
  82: { text: 'Heavy showers', action: 'Avoid field. Inspect for flooding.' },
  95: { text: 'Thunderstorm', action: 'Stay off the field. Secure loose structures.' },
  99: { text: 'Thunderstorm + hail', action: 'Emergency: protect crops from hail damage.' },
};

function wmoInfo(code) {
  return WMO_CODES[code] ?? { text: 'Variable conditions', action: 'Monitor weather and plan field activities accordingly.' };
}

async function fetchFromVisualCrossing(lat, lon) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/next5days?unitGroup=metric&key=${process.env.WEATHER_API_KEY}&contentType=json&include=days,current`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`VC ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchFromOpenMeteo(lat, lon) {
  // 100% free, no API key, reliable
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure,visibility,uv_index,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,uv_index_max,wind_speed_10m_max&timezone=auto&forecast_days=5`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();

  const c = json.current;
  const d = json.daily;
  const days = ['Today', 'Tomorrow', ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']];

  // Reverse-geocode city via Open-Meteo timezone (e.g. "Asia/Kolkata")
  const tz = json.timezone ?? '';
  const locationLabel = tz.split('/').pop()?.replace(/_/g, ' ') ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  const forecast = (d.time ?? []).slice(0, 5).map((date, i) => {
    const code = d.weather_code?.[i] ?? 0;
    const info = wmoInfo(code);
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
    return {
      day: dayLabel,
      date,
      tempMax: Math.round(d.temperature_2m_max?.[i] ?? 30),
      tempMin: Math.round(d.temperature_2m_min?.[i] ?? 20),
      rainfall: d.precipitation_sum?.[i] ?? 0,
      humidity: Math.round(c.relative_humidity_2m ?? 60),
      windSpeed: Math.round(d.wind_speed_10m_max?.[i] ?? 10),
      condition: info.text,
      uvIndex: d.uv_index_max?.[i] ?? 0,
      icon: 'clear-day',
      farmingAction: info.action,
    };
  });

  // Adapt to same shape as Visual Crossing response
  return {
    resolvedAddress: locationLabel,
    source: 'open-meteo',
    currentConditions: {
      temp: c.temperature_2m,
      feelslike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windspeed: c.wind_speed_10m,
      precip: c.precipitation,
      pressure: c.surface_pressure,
      uvindex: c.uv_index ?? 0,
      visibility: (c.visibility ?? 10000) / 1000,
      conditions: wmoInfo(c.weather_code ?? 0).text,
      icon: 'clear-day',
    },
    days: forecast,
  };
}

router.get('/', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query params are required' });
  }

  const VC_KEY = process.env.WEATHER_API_KEY;
  // Try Visual Crossing first (if key configured), fall back to Open-Meteo
  if (VC_KEY && VC_KEY.length > 10) {
    try {
      const data = await fetchFromVisualCrossing(lat, lon);
      data.source = 'visual-crossing';
      return res.json(data);
    } catch (err) {
      console.warn('[Weather] Visual Crossing failed, falling back to Open-Meteo:', err.message);
    }
  }

  try {
    const data = await fetchFromOpenMeteo(parseFloat(lat), parseFloat(lon));
    return res.json(data);
  } catch (err) {
    console.error('[Weather Route] Both sources failed:', err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
