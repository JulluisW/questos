import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

/**
 * Provider switch (server-only; never import from a Client Component).
 *
 *   OPENAI_API_KEY set  -> OpenAI, the production provider
 *                          (OPENAI_MODEL, default gpt-6-luna)
 *   otherwise           -> local Ollama through its OpenAI-compatible API
 *                          (OLLAMA_BASE_URL, default http://localhost:11434/v1;
 *                           OLLAMA_MODEL, default llama3.2)
 *
 * In production the Oracle is disabled unless a provider is configured
 * explicitly, because Ollama on localhost does not exist on a host like Vercel.
 */
export function getAIModel(): LanguageModel {
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // 📌 READ-ME: gpt-6-luna is OpenAI's recommended replacement for
    // gpt-4o-mini, which shuts down on Jan 14, 2027. OPENAI_MODEL overrides
    // this without a code change.
    return openai(process.env.OPENAI_MODEL || 'gpt-6-luna');
  }

  const ollama = createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama', // Ollama ignores the key, but the SDK requires one
  });
  // Ollama implements Chat Completions, not the Responses API.
  return ollama.chat(process.env.OLLAMA_MODEL || 'llama3.2');
}

export function isAIEnabled(): boolean {
  if (process.env.AI_DISABLED === 'true') return false;
  if (process.env.OPENAI_API_KEY || process.env.OLLAMA_BASE_URL) return true;
  return process.env.NODE_ENV !== 'production';
}

export function aiProviderLabel(): string {
  return process.env.OPENAI_API_KEY ? 'OpenAI' : 'local Ollama';
}

/** Max Oracle generations per user per rolling hour. */
export const AI_HOURLY_LIMIT = Number(process.env.AI_HOURLY_LIMIT || 10);
