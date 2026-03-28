// ============================================================
// Market Agent — calls backend proxy /api/market
// ============================================================
import type { MarketData, MarketPrice, AgentResult } from './types';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const POPULAR_COMMODITIES = [
  'Rice', 'Wheat', 'Maize', 'Soyabean', 'Cotton', 'Sugarcane',
  'Onion', 'Tomato', 'Potato', 'Groundnut', 'Mustard',
];

export async function fetchMarketPrices(commodity?: string): Promise<AgentResult<MarketData>> {
  const cacheKey = `agrovision_market_${commodity ?? 'all'}`;
  // --- Cache check ---
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: AgentResult<MarketData> = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.data) {
        return { ...parsed, cached: true };
      }
    }
  } catch {}

  try {
    const params = new URLSearchParams({ limit: '50', offset: '0' });
    if (commodity) params.set('commodity', commodity);

    const res = await fetch(`/api/market?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Status ${res.status}` }));
      throw new Error(err.error || `Market API error ${res.status}`);
    }
    const json = await res.json();

    const prices: MarketPrice[] = (json.records || []).map((r: any) => ({
      commodity: r.commodity ?? r.Commodity ?? '',
      variety: r.variety ?? r.Variety ?? '',
      market: r.market ?? r.Market ?? '',
      state: r.state ?? r.State ?? '',
      district: r.district ?? r.District ?? '',
      minPrice: parseFloat(r.min_price ?? r.Min_x0020_Price ?? 0),
      maxPrice: parseFloat(r.max_price ?? r.Max_x0020_Price ?? 0),
      modalPrice: parseFloat(r.modal_price ?? r.Modal_x0020_Price ?? 0),
      date: r.arrival_date ?? r.Arrival_Date ?? new Date().toLocaleDateString('en-IN'),
    }));

    const marketData: MarketData = { prices, timestamp: Date.now() };
    const result: AgentResult<MarketData> = {
      data: marketData,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (err: any) {
    // Offline fallback
    try {
      const cacheKey2 = `agrovision_market_${commodity ?? 'all'}`;
      const cached = localStorage.getItem(cacheKey2);
      if (cached) {
        const parsed: AgentResult<MarketData> = JSON.parse(cached);
        if (parsed.data) return { ...parsed, cached: true };
      }
    } catch {}
    return { data: null, error: err.message, cached: false, timestamp: Date.now() };
  }
}

export function getAveragePrice(prices: MarketPrice[], commodity: string): number | null {
  const filtered = prices.filter(p =>
    p.commodity.toLowerCase().includes(commodity.toLowerCase())
  );
  if (!filtered.length) return null;
  const avg = filtered.reduce((sum, p) => sum + p.modalPrice, 0) / filtered.length;
  return Math.round(avg);
}
