// ============================================================
// AI Decision Agent — calls backend proxy /api/qwen (fixes CORS)
// ============================================================
import type { AgentContext, AIDecision, AgentResult } from './types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 22000; // HuggingFace model loading wait

function buildPrompt(ctx: AgentContext, task: string): string {
  const weatherSummary = ctx.weather
    ? `Temperature: ${ctx.weather.temperature}°C, Humidity: ${ctx.weather.humidity}%, Rainfall today: ${ctx.weather.rainfall}mm, Wind: ${ctx.weather.windSpeed}km/h, Condition: ${ctx.weather.condition}`
    : 'Weather data unavailable';

  const soilSummary = ctx.soil
    ? `Moisture: ${ctx.soil.moisturePercent}% (${ctx.soil.status}), Surface Temp: ${ctx.soil.surfaceTemp}°C, Irrigation Needed: ${ctx.soil.irrigationNeeded}, Overwater Risk: ${ctx.soil.overWaterRisk}`
    : 'Soil data unavailable';

  const marketSummary = ctx.market?.prices?.length
    ? ctx.market.prices
        .slice(0, 5)
        .map(p => `${p.commodity}: ₹${p.modalPrice}/quintal`)
        .join(', ')
    : 'Market data unavailable';

  const plantInfo = ctx.vision
    ? `Plant identified: ${ctx.vision.commonName} (${ctx.vision.species}), confidence ${Math.round(ctx.vision.confidence * 100)}%`
    : '';

  const lang = ctx.language ?? 'en';
  const langInstruction =
    lang === 'hi'
      ? 'Respond in simple Hindi that an Indian farmer can understand.'
      : lang === 'mr'
      ? 'Respond in simple Marathi that an Indian farmer can understand.'
      : 'Respond in simple English that an Indian farmer can understand.';

  return `You are AgroVision AI, an expert agricultural advisor for Indian farmers.
${langInstruction}

Current farm conditions:
- Weather: ${weatherSummary}
- Soil: ${soilSummary}
- Market prices: ${marketSummary}
${plantInfo ? `- Plant Info: ${plantInfo}` : ''}
${ctx.crop ? `- Crop: ${ctx.crop}` : ''}

Task: ${task}

Respond ONLY with a valid JSON object (no markdown, no text outside JSON):
{
  "recommendation": "main recommendation in 1-2 sentences",
  "risk_level": "low|medium|high|critical",
  "actions": ["action 1", "action 2", "action 3"],
  "explanation": "brief scientific explanation",
  "crop": "best crop name if asked, else omit",
  "fertilizer": "fertilizer advice if relevant, else omit",
  "irrigation": "irrigation decision",
  "pestAdvice": "pest control advice if relevant, else omit",
  "yieldForecast": "yield estimate if asked, else omit",
  "sellingStrategy": "when and where to sell if asked, else omit",
  "confidence": 80
}`;
}

function extractJSON(raw: string): AIDecision | null {
  // Strip markdown code fences if model wraps JSON in ```json ... ```
  const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);

    // Sanitization: Fix for React crashing when Qwen hallucinates nested objects for string fields
    const stringFields = ['recommendation', 'explanation', 'crop', 'fertilizer', 'irrigation', 'pestAdvice', 'yieldForecast', 'sellingStrategy'];
    for (const field of stringFields) {
      if (parsed[field] && typeof parsed[field] === 'object') {
        // Flatten the rogue object into a readable string
        parsed[field] = Object.entries(parsed[field])
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
    }

    return parsed as AIDecision;
  } catch {
    return null;
  }
}

async function callQwen(prompt: string, attempt = 0): Promise<string> {
  const res = await fetch('/api/qwen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (res.status === 503) {
    // Model loading — retry after delay
    const json = await res.json().catch(() => ({}));
    if (attempt < MAX_RETRIES && json?.loading) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return callQwen(prompt, attempt + 1);
    }
    throw new Error('AI model is loading. Please try again in 30 seconds.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Status ${res.status}` }));
    throw new Error(err.error || `Qwen proxy error ${res.status}`);
  }

  const json = await res.json();
  // HuggingFace returns: [{ generated_text: "..." }]
  return Array.isArray(json)
    ? (json[0]?.generated_text ?? '')
    : (json.generated_text ?? '');
}

export async function getAIDecision(
  ctx: AgentContext,
  task: string
): Promise<AgentResult<AIDecision>> {
  try {
    const prompt = buildPrompt(ctx, task);
    const rawText = await callQwen(prompt);

    const decision = extractJSON(rawText);
    if (!decision) throw new Error('AI response could not be parsed as JSON');

    return { data: decision, error: null, cached: false, timestamp: Date.now() };
  } catch (err: any) {
    // Rule-based fallback
    const fallback = buildFallbackDecision(ctx, task);
    return {
      data: fallback,
      error: `AI unavailable (${err.message}). Showing rule-based advice.`,
      cached: false,
      timestamp: Date.now(),
    };
  }
}

/** Simple rule-based fallback when Qwen is unavailable */
function buildFallbackDecision(ctx: AgentContext, _task: string): AIDecision {
  const soil = ctx.soil;
  const weather = ctx.weather;

  let recommendation = 'Monitor your crops and soil conditions regularly.';
  let risk_level: AIDecision['risk_level'] = 'low';
  const actions: string[] = [];

  if (soil?.irrigationNeeded) {
    recommendation = 'Soil is dry. Irrigate your crops within the next 24 hours.';
    risk_level = 'medium';
    actions.push('Start drip or flood irrigation within 24 hours');
    actions.push('Check leaves for wilting signs early morning');
  } else if (soil?.overWaterRisk) {
    recommendation = 'Soil moisture is high. Pause irrigation to prevent root rot.';
    risk_level = 'medium';
    actions.push('Stop irrigation for 2–3 days');
    actions.push('Check field drainage channels');
  } else {
    actions.push('Continue current farming practices');
  }

  if ((weather?.temperature ?? 0) > 35) {
    actions.push('Shade sensitive crops. Water early morning before 7 AM.');
    risk_level = 'high';
  }
  if ((weather?.windSpeed ?? 0) > 20) {
    actions.push('Avoid pesticide spray today — high wind drift risk.');
  }
  if ((weather?.rainfall ?? 0) > 10) {
    actions.push('Delay fertilizer application. Heavy rain may cause nutrient runoff.');
  }

  if (!actions.length) actions.push('Monitor crops daily for signs of stress.');

  return {
    recommendation,
    risk_level,
    actions,
    explanation: 'Rule-based advice from sensor and weather readings. AI is temporarily unavailable.',
    irrigation: soil?.irrigationNeeded
      ? 'Irrigate within 24h'
      : soil?.overWaterRisk
      ? 'Pause irrigation'
      : 'No action needed',
    confidence: 60,
  };
}
