// ============================================================
// Voice Agent — Web Speech API (TTS + STT)
// ============================================================
export type Language = 'en' | 'hi' | 'mr';

const LANG_MAP: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

// ---- Text-to-Speech ----
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, language: Language = 'en'): void {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[language];
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking ?? false;
}

// ---- Speech-to-Text ----
export function startListening(
  language: Language,
  onResult: (transcript: string) => void,
  onError?: (err: string) => void
): (() => void) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = LANG_MAP[language];
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0]?.[0]?.transcript ?? '';
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    onError?.(event.error ?? 'Speech recognition error');
  };

  recognition.start();
  return () => recognition.stop();
}

// ---- Voice summaries for AI responses ----
export function speakAIDecision(
  decision: { recommendation: string; actions: string[] },
  language: Language
): void {
  const text = `${decision.recommendation}. ${decision.actions.slice(0, 2).join('. ')}`;
  speak(text, language);
}
