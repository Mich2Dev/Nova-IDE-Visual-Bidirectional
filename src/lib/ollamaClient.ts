const nova = (window as any).novaAPI;

export interface OllamaMessage {
  role: string;
  content: string;
  images?: string[];
}

export async function checkOllamaHealth(
  url = import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434'
): Promise<{ ok: boolean; models?: string[]; error?: string }> {
  if (nova?.ollamaHealth) {
    return nova.ollamaHealth(url);
  }
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, models: (data.models || []).map((m: { name: string }) => m.name) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de conexión' };
  }
}

export async function chatWithOllama(params: {
  url?: string;
  model: string;
  messages: OllamaMessage[];
}): Promise<{ success: boolean; content?: string; error?: string }> {
  const url = params.url || import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434';

  if (nova?.ollamaChat) {
    return nova.ollamaChat({ url, model: params.model, messages: params.messages });
  }

  try {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: params.model, messages: params.messages, stream: false }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = await res.json();
    return { success: true, content: data.message?.content || '' };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Error de red' };
  }
}
