// ============================================================
// Qwen Route — HuggingFace NEW Serverless Inference API (2025)
// POST /api/qwen    { inputs: string, parameters?: {} }
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY = process.env.QWEN_API_KEY;

// Correct 2025 HuggingFace Inference Providers URL (OpenAI-compatible)
const HF_URL = 'https://router.huggingface.co/v1/chat/completions';

router.post('/', async (req, res) => {
  const { inputs, parameters } = req.body;
  if (!inputs) {
    return res.status(400).json({ error: '"inputs" field is required in request body' });
  }

  // Build OpenAI-compatible chat payload (new HF API format)
  const payload = {
    model: 'Qwen/Qwen2.5-7B-Instruct',
    messages: [
      {
        role: 'system',
        content: 'You are AgroVision AI, an expert agricultural advisor. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: inputs,
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
    ...parameters,
  };

  try {
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 503) {
      return res.status(503).json({ error: 'Model is loading, please retry in ~20 seconds', loading: true });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    // New API returns OpenAI-style response: data.choices[0].message.content
    const content = data?.choices?.[0]?.message?.content ?? '';
    // Return in old format so frontend agent doesn't need changes
    res.json([{ generated_text: content }]);
  } catch (err) {
    console.error('[Qwen Route]', err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
