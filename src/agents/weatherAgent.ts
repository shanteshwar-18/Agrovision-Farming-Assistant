// ============================================================
// Weather Agent — calls backend proxy /api/weather
// ============================================================
import type { WeatherData, ForecastDay, AgentResult } from './types';

const CACHE_KEY = 'agrovision_weather_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const FARMING_ACTIONS: Record<string, string> = {
  rain: 'Delay irrigation. Check drainage in the field.',
  'heavy rain': 'Avoid field operations. Ensure proper drainage.',
  snow: 'Protect crops from frost. No field activity.',
  overcast: 'Good day for transplanting seedlings.',
  'partially cloudy': 'Optimal spray window — low UV, low wind drift risk.',
  clear: 'High UV. Water crops in early morning or evening.',
  wind: 'Avoid pesticide spray today — high drift risk.',
  storm: 'Stay off the field. Secure loose structures.',
};

function getFarmingAction(conditions: string): string {
  const lower = conditions.toLowerCase();
  for (const [key, action] of Object.entries(FARMING_ACTIONS)) {
    if (lower.includes(key)) return action;
  }
  return 'Monitor conditions. Plan field activities based on today\'s weather.';
}

export async function fetchWeather(lat: number, lon: number): Promise<AgentResult<WeatherData>> {
  // --- Check cache ---
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: AgentResult<WeatherData> = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.data) {
        return { ...parsed, cached: true };
      }
    }
  } catch {}

  // --- Fetch via backend proxy ---
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Status ${res.status}` }));
      throw new Error(err.error || `Weather API error ${res.status}`);
    }
    const json = await res.json();

    const current = json.currentConditions;
    const forecast: ForecastDay[] = (json.days || []).slice(0, 5).map((d: any, i: number) => ({
      day: i === 0
        ? 'Today'
        : new Date(d.datetime + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.datetime,
      tempMax: Math.round(d.tempmax ?? d.temp ?? 30),
      tempMin: Math.round(d.tempmin ?? d.temp ?? 20),
      rainfall: d.precip ?? 0,
      humidity: Math.round(d.humidity ?? 60),
      windSpeed: Math.round(d.windspeed ?? 10),
      condition: d.conditions ?? 'Clear',
      uvIndex: d.uvindex ?? 0,
      icon: d.icon ?? 'clear-day',
      farmingAction: getFarmingAction(d.conditions ?? ''),
    }));

    const weatherData: WeatherData = {
      temperature: Math.round(current?.temp ?? 28),
      feelsLike: Math.round(current?.feelslike ?? 30),
      humidity: Math.round(current?.humidity ?? 60),
      windSpeed: Math.round(current?.windspeed ?? 10),
      rainfall: current?.precip ?? 0,
      pressure: Math.round(current?.pressure ?? 1013),
      uvIndex: current?.uvindex ?? 0,
      visibility: Math.round(current?.visibility ?? 10),
      condition: current?.conditions ?? 'Clear',
      icon: current?.icon ?? 'clear-day',
      forecast,
      location: json.resolvedAddress ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      timestamp: Date.now(),
    };

    const result: AgentResult<WeatherData> = {
      data: weatherData,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch (err: any) {
    // Offline fallback
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: AgentResult<WeatherData> = JSON.parse(cached);
        if (parsed.data) return { ...parsed, cached: true };
      }
    } catch {}
    return { data: null, error: err.message, cached: false, timestamp: Date.now() };
  }
}
