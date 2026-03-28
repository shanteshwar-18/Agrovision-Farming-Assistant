// ============================================================
// Soil Agent — calls backend proxy /api/soil
// Falls back to weather-derived moisture estimate if AgroMonitoring unavailable
// ============================================================
import type { SoilData, AgentResult } from './types';

const CACHE_KEY = 'agrovision_soil_cache';
const CACHE_TTL = 15 * 60 * 1000;

/** Derive soil moisture from local weather conditions (humidity, rainfall, temp) */
async function deriveFromWeather(lat: number, lon: number): Promise<SoilData> {
  let humidity = 60;
  let rainfall = 0;
  let temp = 25;
  try {
    // Re-use cached weather if available
    const cached = localStorage.getItem('agrovision_weather_cache');
    if (cached) {
      const w = JSON.parse(cached);
      if (w?.data) {
        humidity = w.data.humidity ?? humidity;
        rainfall = w.data.rainfall ?? rainfall;
        temp = w.data.temperature ?? temp;
      }
    }
  } catch {}

  const baseMoisture = (humidity / 100) * 0.5 + (rainfall > 0 ? 0.15 : 0);
  const heatAdj = temp > 35 ? -0.1 : temp < 15 ? 0.05 : 0;
  const moisture = Math.max(0.05, Math.min(0.6, baseMoisture + heatAdj));
  const status: SoilData['status'] = moisture < 0.2 ? 'dry' : moisture > 0.4 ? 'wet' : 'optimal';

  return {
    moisture,
    moisturePercent: Math.round(moisture * 100),
    surfaceTemp: Math.round(temp + 2),
    deepTemp: Math.round(temp - 1),
    status,
    irrigationNeeded: status === 'dry',
    overWaterRisk: status === 'wet',
    timestamp: Date.now(),
  };
}

export async function fetchSoil(lat: number, lon: number): Promise<AgentResult<SoilData>> {
  // --- Cache check ---
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: AgentResult<SoilData> = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.data) {
        return { ...parsed, cached: true };
      }
    }
  } catch {}

  // Retrieve known polyid for this session
  const storedPolyId = localStorage.getItem('agrovision_polyid') ?? '';

  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (storedPolyId) params.set('polyid', storedPolyId);

    const res = await fetch(`/api/soil?${params.toString()}`);
    if (!res.ok) throw new Error(`Soil proxy error ${res.status}`);
    const json = await res.json();

    // Save received polyid for future requests
    if (json.polyid) localStorage.setItem('agrovision_polyid', json.polyid);

    let soilData: SoilData;
    if (json.source === 'agromonitoring' && json.moisture != null) {
      const moisture: number = json.moisture;
      const t0: number = json.t0 ? Math.round(json.t0 - 273.15) : 22;
      const t10: number = json.t10 ? Math.round(json.t10 - 273.15) : 20;
      const status: SoilData['status'] = moisture < 0.2 ? 'dry' : moisture > 0.4 ? 'wet' : 'optimal';
      soilData = {
        moisture,
        moisturePercent: Math.round(moisture * 100),
        surfaceTemp: t0,
        deepTemp: t10,
        status,
        irrigationNeeded: status === 'dry',
        overWaterRisk: status === 'wet',
        timestamp: Date.now(),
      };
    } else {
      // Backend returned derived marker — calculate locally
      soilData = await deriveFromWeather(lat, lon);
    }

    const result: AgentResult<SoilData> = {
      data: soilData,
      error: json.source !== 'agromonitoring' ? 'Using weather-derived soil estimate' : null,
      cached: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch (err: any) {
    // Offline fallback — cached or derived
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: AgentResult<SoilData> = JSON.parse(cached);
        if (parsed.data) return { ...parsed, cached: true };
      }
    } catch {}

    try {
      const derived = await deriveFromWeather(lat, lon);
      const result: AgentResult<SoilData> = {
        data: derived,
        error: `Using weather-derived soil estimate (${err.message})`,
        cached: false,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      return result;
    } catch {
      return { data: null, error: err.message, cached: false, timestamp: Date.now() };
    }
  }
}
