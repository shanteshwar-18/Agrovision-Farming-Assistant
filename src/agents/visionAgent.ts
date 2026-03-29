// ============================================================
// Vision Agent — PlantNet primary + Qwen3.5 vision fallback
// Calls /api/plantnet for species ID, falls back to /api/qwen/vision
// for AI-powered crop disease / health analysis
// ============================================================
import type { VisionResult, AgentResult } from './types';

const CACHE_KEY = 'agrovision_vision_cache';

// ─── PlantNet identification ─────────────────────────────────

export async function identifyPlant(imageFile: File): Promise<AgentResult<VisionResult>> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name);
    formData.append('organ', 'leaf');

    const res = await fetch('/api/plantnet', {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser will set multipart boundary automatically
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Status ${res.status}` }));
      throw new Error(err.error || `PlantNet error ${res.status}`);
    }

    const json = await res.json();
    const best = json.results?.[0];
    if (!best) throw new Error('No plant identified in the image');

    const result: VisionResult = {
      species: best.species?.scientificNameWithoutAuthor ?? 'Unknown',
      commonName: best.species?.commonNames?.[0] ?? 'Unknown plant',
      confidence: Math.round((best.score ?? 0) * 100) / 100,
      family: best.species?.family?.scientificNameWithoutAuthor ?? '',
      genus: best.species?.genus?.scientificNameWithoutAuthor ?? '',
      gbifId: best.gbif?.id,
      imageUrl: best.images?.[0]?.url?.m,
    };

    const agentResult: AgentResult<VisionResult> = {
      data: result,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(agentResult));
    return agentResult;
  } catch (err: any) {
    // Try cached last result
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: AgentResult<VisionResult> = JSON.parse(cached);
        if (parsed.data) return { ...parsed, cached: true };
      }
    } catch {}
    return { data: null, error: err.message, cached: false, timestamp: Date.now() };
  }
}

// ─── Qwen3.5 Vision Analysis (AI crop health analysis) ──────

export interface QwenVisionResult {
  analysis: string;
  model: string;
  method: string;
}

/**
 * Analyze a crop/plant image using Qwen3.5-9B multimodal vision.
 * Accepts a File object — converts to base64 data URL internally.
 * Falls back gracefully.
 */
export async function analyzeImageWithQwen(
  imageFile: File,
  question?: string,
): Promise<AgentResult<QwenVisionResult>> {
  try {
    // Convert file → base64 data URL (works with router.huggingface.co)
    const dataUrl = await fileToPreviewUrl(imageFile);

    const res = await fetch('/api/qwen/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: dataUrl, question }),
    });

    if (res.status === 503) {
      // Model loading — surface to UI
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Vision AI is loading. Retry in ~20 seconds.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Status ${res.status}` }));
      throw new Error(err.error || `Vision analysis error ${res.status}`);
    }

    const data: QwenVisionResult = await res.json();
    return { data, error: null, cached: false, timestamp: Date.now() };
  } catch (err: any) {
    return { data: null, error: err.message, cached: false, timestamp: Date.now() };
  }
}

// ─── Utility ─────────────────────────────────────────────────

export function fileToPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
