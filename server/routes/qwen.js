// ============================================================
// Qwen Route — HuggingFace Router (OpenAI-compatible, 2025)
// Model : Qwen/Qwen3.5-9B  via router.huggingface.co/v1
// Mirrors the Python pattern:
//   client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=HF_TOKEN)
//   client.chat.completions.create(model="Qwen/Qwen3.5-9B", messages=[...])
//
// POST /api/qwen          { inputs: string, parameters?: {} }
// POST /api/qwen/vision   { imageUrl: string, question?: string }
// POST /api/qwen/client   { inputs: string }  ← InferenceClient method
// GET  /api/qwen/test     ← quick connectivity test
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';
import { InferenceClient } from '@huggingface/inference';

const router = Router();

// Stable text-only model that guarantees 200 OKs on HF Router
const MODEL  = 'Qwen/Qwen2.5-7B-Instruct';
// Stable multimodal model for vision analysis
const VISION_MODEL = 'meta-llama/Llama-3.2-11B-Vision-Instruct';

// OpenAI-compatible base URL (same as Python base_url)
const HF_BASE = 'https://router.huggingface.co/v1';
const HF_URL  = `${HF_BASE}/chat/completions`;

// Read token lazily to avoid ES module dotenv hoisting issues
function getHfToken() {
  return process.env.HF_TOKEN || process.env.QWEN_API_KEY;
}

// Shared HuggingFace InferenceClient (lazy init)
let client = null;
function getClient() {
  if (!client) client = new InferenceClient(getHfToken());
  return client;
}

// ─── Helpers ────────────────────────────────────────────────

/** Call HF chat completions via raw fetch (OpenAI-compatible) */
async function fetchChatCompletion(messages, extraParams = {}) {
  const payload = {
    model: MODEL,
    messages,
    max_tokens: 800,
    temperature: 0.3,
    ...(extraParams || {}),
  };

  console.log('[Qwen DEBUG] Sending Payload:', JSON.stringify(payload).slice(0, 300) + '...');

  const response = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getHfToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 503) {
    throw Object.assign(new Error('Model is loading. Retry in ~20s'), { loading: true, status: 503 });
  }
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HuggingFace ${response.status}: ${errText.slice(0, 300)}`);
  }

  return response.json(); // OpenAI-style: { choices: [{ message: { content } }] }
}

/** Call HF chat completions via InferenceClient SDK */
async function clientChatCompletion(messages, extraParams = {}) {
  const completion = await getClient().chatCompletion({
    model: MODEL,
    messages,
    max_tokens: 800,
    temperature: 0.3,
    ...extraParams,
  });
  return completion; // same shape as fetch result
}

// ─── Routes ─────────────────────────────────────────────────

/**
 * POST /api/qwen
 * Standard text chat — used by AI Decision Agent
 * Body: { inputs: string, parameters?: {} }
 */
router.post('/', async (req, res) => {
  const { inputs, parameters } = req.body;
  if (!inputs) {
    return res.status(400).json({ error: '"inputs" field is required' });
  }

  const messages = [
    {
      role: 'system',
      content: 'You are AgroVision AI, an expert agricultural advisor. Always respond with valid JSON only.',
    },
    { role: 'user', content: inputs },
  ];

  try {
    const data = await fetchChatCompletion(messages, parameters);
    const content = data?.choices?.[0]?.message?.content ?? '';
    // Return in legacy format so frontend agent doesn't need changes
    res.json([{ generated_text: content }]);
  } catch (err) {
    console.error('[Qwen /] ', err.message);
    if (err.loading) return res.status(503).json({ error: err.message, loading: true });
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /api/qwen
 * Friendly message for browser address bar users
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Qwen API is running. Use POST to chat, POST /vision for image analysis, or GET /test for token verification.',
  });
});

/**
 * POST /api/qwen/vision
 * Multimodal image + text analysis using image_url content type
 * Body: { imageUrl: string, question?: string }
 *
 * Supports both publicly-hosted URLs and base64 data: URLs from frontend FileReader
 */
router.post('/vision', async (req, res) => {
  const { imageUrl, question } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: '"imageUrl" is required (public URL or base64 data: URL)' });
  }

  const prompt = question || 'Identify this plant or crop. Describe any visible disease, pest damage, or health issues. Be concise and farming-focused.';

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];

  try {
    // Primary: fetch-based approach
    const payloadExtra = { max_tokens: 600, temperature: 0.2, model: VISION_MODEL };
    const data = await fetchChatCompletion(messages, payloadExtra);
    const content = data?.choices?.[0]?.message?.content ?? '';
    res.json({ analysis: content, model: VISION_MODEL, method: 'fetch' });
  } catch (fetchErr) {
    console.warn('[Qwen /vision fetch failed]', fetchErr.message, '— trying InferenceClient...');
    // Fallback: InferenceClient SDK
    try {
      const data = await clientChatCompletion(messages, { max_tokens: 600, temperature: 0.2, model: VISION_MODEL });
      const content = data?.choices?.[0]?.message?.content ?? '';
      res.json({ analysis: content, model: VISION_MODEL, method: 'client' });
    } catch (clientErr) {
      console.error('[Qwen /vision]', clientErr.message);
      if (clientErr.loading || fetchErr.loading) {
        return res.status(503).json({ error: 'Vision model loading. Retry in ~20s', loading: true });
      }
      res.status(502).json({ error: clientErr.message });
    }
  }
});

/**
 * POST /api/qwen/client
 * Uses @huggingface/inference InferenceClient directly (alternative to /api/qwen)
 * Body: { inputs: string }
 */
router.post('/client', async (req, res) => {
  const { inputs } = req.body;
  if (!inputs) {
    return res.status(400).json({ error: '"inputs" field is required' });
  }

  const messages = [
    {
      role: 'system',
      content: 'You are AgroVision AI, an expert agricultural advisor. Always respond with valid JSON only.',
    },
    { role: 'user', content: inputs },
  ];

  try {
    const data = await clientChatCompletion(messages);
    const content = data?.choices?.[0]?.message?.content ?? '';
    res.json([{ generated_text: content }]);
  } catch (err) {
    console.error('[Qwen /client]', err.message);
    res.status(502).json({ error: err.message });
  }
});

/**
 * GET /api/qwen/test
 * Quick connectivity test — verifies HF token and model availability
 */
router.get('/test', async (_req, res) => {
  const token = getHfToken();
  if (!token) {
    return res.status(500).json({ ok: false, error: 'HF_TOKEN / QWEN_API_KEY not set in server/.env' });
  }

  try {
    const data = await fetchChatCompletion([
      { role: 'user', content: 'Reply with exactly: {"status":"ok"}' },
    ], { max_tokens: 30 });

    const content = data?.choices?.[0]?.message?.content ?? '';
    res.json({
      ok: true,
      model: MODEL,
      method: 'fetch',
      rawReply: content,
      tokenConfigured: token.startsWith('hf_'),
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message, model: MODEL });
  }
});

export default router;
