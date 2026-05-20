/**
 * MiMo client wrapper for Nota.
 *
 * Nota uses three of Xiaomi's MiMo families per receipt scan:
 *
 *   - mimo-v2.5-vision     → OCRs a photographed receipt into structured JSON.
 *   - mimo-v2.5-reasoning  → categorises, detects spending anomalies,
 *                            and writes a one-line Bahasa Indonesia insight.
 *   - mimo-v2.5-tts        → reads the weekly recap script aloud.
 *
 * They share a single OpenAI-compatible base URL, so we use the official
 * `openai` SDK and just point it at MiMo.
 */
import OpenAI from 'openai';

let cached: OpenAI | null = null;

export function mimo(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.MIMO_API_KEY;
  const baseURL = process.env.MIMO_BASE_URL ?? 'https://platform.xiaomimimo.com/v1';
  if (!apiKey) {
    throw new Error(
      'MIMO_API_KEY is not configured. Set it locally in .env or as a Netlify environment variable in production.'
    );
  }
  cached = new OpenAI({ apiKey, baseURL });
  return cached;
}

export const models = {
  vision:    () => process.env.MIMO_VISION_MODEL    ?? 'mimo-v2.5-vision',
  reasoning: () => process.env.MIMO_REASONING_MODEL ?? 'mimo-v2.5-reasoning',
  tts:       () => process.env.MIMO_TTS_MODEL       ?? 'mimo-v2.5-tts'
};

export const defaults = {
  ttsVoice: () => process.env.MIMO_TTS_VOICE ?? 'ember'
};

/** True if a credit-bearing key is wired up; gates the live /scan endpoint. */
export function hasCredentials(): boolean {
  return Boolean(process.env.MIMO_API_KEY);
}
