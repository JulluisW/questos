import { createOpenAI } from '@ai-sdk/openai';

// Ollama provides an OpenAI-compatible API endpoint at /v1
const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', // Placeholder key required by SDK
});

export function getAIModel() {
  // Gracefully switch to commercial providers in production via env var
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai('gpt-4o-mini');
  }

  // Local fallback model (Requires `ollama run llama3.2` or `mistral`)
  return ollama(process.env.OLLAMA_MODEL || 'llama3.2');
}
