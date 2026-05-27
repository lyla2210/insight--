import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildInterpretMessages } from '../src/server/interpretPrompt.ts';
import {
  getDeepSeekApiKey,
  streamDeepSeekChat,
} from '../src/server/deepseek.ts';

interface InterpretRequestBody {
  question?: string;
  hexagram?: number[];
}

export default async function handler(
  req: IncomingMessage & { method?: string; body?: InterpretRequestBody },
  res: ServerResponse & {
    status?: (code: number) => typeof res;
    json?: (body: unknown) => void;
    send?: (body: string) => void;
    setHeader: (name: string, value: string) => void;
  },
) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const body = await readJsonBody(req);
  const { question, hexagram } = body;

  if (!question?.trim()) {
    return sendJson(res, 400, { error: 'Question is required.' });
  }

  if (!Array.isArray(hexagram) || hexagram.length !== 6) {
    return sendJson(res, 400, { error: 'Hexagram must contain exactly 6 lines.' });
  }

  if (!getDeepSeekApiKey()) {
    return sendJson(res, 500, { error: 'DEEPSEEK_API_KEY is not configured.' });
  }

  try {
    const { messages } = buildInterpretMessages(question.trim(), hexagram);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await streamDeepSeekChat(messages, (delta) => {
      res.write(delta);
    });

    res.end();
  } catch (error) {
    console.error('DeepSeek interpretation error:', error);
    if (!res.headersSent) {
      return sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Interpretation failed.',
      });
    }
    res.end();
  }
}

async function readJsonBody(
  req: IncomingMessage & { body?: InterpretRequestBody },
): Promise<InterpretRequestBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};

  try {
    return JSON.parse(text) as InterpretRequestBody;
  } catch {
    return {};
  }
}

function sendJson(
  res: ServerResponse & {
    status?: (code: number) => typeof res;
    json?: (body: unknown) => void;
  },
  statusCode: number,
  payload: unknown,
) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
