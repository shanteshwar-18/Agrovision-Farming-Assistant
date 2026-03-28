// ============================================================
// Agent Orchestrator — coordinates all agents + geolocation
// ============================================================
import { fetchWeather } from './weatherAgent';
import { fetchSoil } from './soilAgent';
import { fetchMarketPrices } from './marketAgent';
import { getAIDecision } from './aiDecisionAgent';
import { identifyPlant } from './visionAgent';
import type {
  AgentContext, AIDecision, AgentResult,
  WeatherData, SoilData, MarketData, VisionResult,
} from './types';

const LOC_CACHE_KEY = 'agrovision_location';

// Default fallback location — Pune, Maharashtra (central farming region)
const DEFAULT_LOCATION = { lat: 18.5246, lon: 73.8786, label: 'Pune, Maharashtra (default)' };

// ---- Geolocation with fallback ----
export async function getUserLocation(): Promise<{ lat: number; lon: number; label: string }> {
  // Try cached first
  try {
    const cached = localStorage.getItem(LOC_CACHE_KEY);
    if (cached) {
      const loc = JSON.parse(cached);
      if (loc?.lat && loc?.lon) return loc;
    }
  } catch {}

  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`,
        };
        localStorage.setItem(LOC_CACHE_KEY, JSON.stringify(loc));
        resolve(loc);
      },
      _err => {
        // Geolocation blocked or unavailable — use default silently
        console.info('[AgroVision] Geolocation unavailable, using default: Pune');
        resolve(DEFAULT_LOCATION);
      },
      { timeout: 8000, maximumAge: 600000 } // 10 min age tolerance
    );
  });
}

/** Clear cached location (call when user wants to re-detect) */
export function clearLocationCache() {
  localStorage.removeItem(LOC_CACHE_KEY);
}

// ---- Full Pipeline ----
export interface PipelineResult {
  context: AgentContext;
  decision: AgentResult<AIDecision>;
  errors: string[];
  location: { lat: number; lon: number; label: string };
}

export async function runFullPipeline(options: {
  task: string;
  crop?: string;
  language?: 'en' | 'hi' | 'mr';
  imageFile?: File;
  commodity?: string;
}): Promise<PipelineResult> {
  const errors: string[] = [];
  const location = await getUserLocation();

  const context: AgentContext = {
    crop: options.crop,
    language: options.language ?? 'en',
    location,
  };

  const { lat, lon } = location;

  // Fetch all data agents in parallel for speed
  const [weatherResult, soilResult, marketResult] = await Promise.allSettled([
    fetchWeather(lat, lon),
    fetchSoil(lat, lon),
    fetchMarketPrices(options.commodity ?? options.crop),
  ]);

  if (weatherResult.status === 'fulfilled') {
    if (weatherResult.value.data) context.weather = weatherResult.value.data;
    if (weatherResult.value.error) errors.push(`Weather: ${weatherResult.value.error}`);
  } else {
    errors.push(`Weather fetch failed: ${weatherResult.reason}`);
  }

  if (soilResult.status === 'fulfilled') {
    if (soilResult.value.data) context.soil = soilResult.value.data;
    if (soilResult.value.error) errors.push(`Soil: ${soilResult.value.error}`);
  } else {
    errors.push(`Soil fetch failed: ${soilResult.reason}`);
  }

  if (marketResult.status === 'fulfilled') {
    if (marketResult.value.data) context.market = marketResult.value.data;
    if (marketResult.value.error) errors.push(`Market: ${marketResult.value.error}`);
  } else {
    errors.push(`Market fetch failed: ${marketResult.reason}`);
  }

  // Vision agent (optional — only when image provided)
  if (options.imageFile) {
    const visionResult = await identifyPlant(options.imageFile);
    if (visionResult.data) context.vision = visionResult.data;
    else if (visionResult.error) errors.push(`Vision: ${visionResult.error}`);
  }

  // AI Decision — always runs, uses rule-based fallback if Qwen unavailable
  const decision = await getAIDecision(context, options.task);

  return { context, decision, errors, location };
}

// ---- Individual quick-fetch helpers ----
export async function quickWeather(): Promise<AgentResult<WeatherData>> {
  const loc = await getUserLocation();
  return fetchWeather(loc.lat, loc.lon);
}

export async function quickSoil(): Promise<AgentResult<SoilData>> {
  const loc = await getUserLocation();
  return fetchSoil(loc.lat, loc.lon);
}

export async function quickMarket(commodity?: string): Promise<AgentResult<MarketData>> {
  return fetchMarketPrices(commodity);
}
