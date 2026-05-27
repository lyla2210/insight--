import type { ChatMessage } from './interpretPromptClient.ts';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function getDeepSeekApiKey(): string | undefined {
  return import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() || undefined;
}

function getDeepSeekModel(): string {
  return import.meta.env.VITE_DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
}

export async function streamDeepSeekChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    throw new Error('VITE_DEEPSEEK_API_KEY is not configured.');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getDeepSeekModel(),
      messages,
      stream: true,
      temperature: 0.75,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error('DeepSeek API returned empty body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        // Skip partial JSON chunks.
      }
    }
  }
}
