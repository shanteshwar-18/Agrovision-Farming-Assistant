// ============================================================
// Vision Agent — calls backend proxy /api/plantnet (fixes 403/CORS)
// ============================================================
import type { VisionResult, AgentResult } from './types';

const CACHE_KEY = 'agrovision_vision_cache';

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

export function fileToPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
