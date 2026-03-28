// ============================================================
// AgroVision — Shared Agent Types
// ============================================================

export interface WeatherData {
  temperature: number;        // °C
  feelsLike: number;
  humidity: number;           // %
  windSpeed: number;          // km/h
  rainfall: number;           // mm today
  pressure: number;           // hPa
  uvIndex: number;
  visibility: number;         // km
  condition: string;
  icon: string;
  forecast: ForecastDay[];
  location: string;
  timestamp: number;
}

export interface ForecastDay {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  uvIndex: number;
  icon: string;
  farmingAction?: string;
}

export interface SoilData {
  moisture: number;           // 0–1 unitless (vol. fraction)
  moisturePercent: number;    // 0–100 %
  surfaceTemp: number;        // °C (from Kelvin)
  deepTemp: number;           // °C at 10cm
  status: 'dry' | 'optimal' | 'wet';
  irrigationNeeded: boolean;
  overWaterRisk: boolean;
  timestamp: number;
}

export interface MarketPrice {
  commodity: string;
  variety?: string;
  market: string;
  state: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
}

export interface MarketData {
  prices: MarketPrice[];
  timestamp: number;
}

export interface VisionResult {
  species: string;
  commonName: string;
  confidence: number;         // 0–1
  family: string;
  genus: string;
  gbifId?: number;
  imageUrl?: string;
}

export interface AIDecision {
  recommendation: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  explanation: string;
  crop?: string;
  fertilizer?: string;
  irrigation?: string;
  pestAdvice?: string;
  yieldForecast?: string;
  sellingStrategy?: string;
  confidence: number;         // 0–100%
}

export interface AgentContext {
  weather?: WeatherData;
  soil?: SoilData;
  market?: MarketData;
  vision?: VisionResult;
  crop?: string;
  language?: 'en' | 'hi' | 'mr';
  location?: { lat: number; lon: number; label: string };
}

export interface AgentResult<T> {
  data: T | null;
  error: string | null;
  cached: boolean;
  timestamp: number;
}
