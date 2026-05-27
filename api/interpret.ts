import type { IncomingMessage, ServerResponse } from 'node:http';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `CONTEXT & SYSTEM ROLE:
You are "Insight-六爻", a clinical AI interpreter specializing in ancient I Ching semiotics and cognitive psychology. Your purpose is to decode the systemic state of any user facing dilemmas. Your tone is clinical, objective, and surgically clean.

CRITICAL VISUAL & TEXT RULE:
- REJECT AI FLUFF: No markdown heavy symbols. Do NOT use headers like ### or ####. Do NOT use brackets like [ACTION] or technical codes like // MATRIX.
- FORMATTING: Create visual hierarchy strictly through line breaks, judicious bolding, and short dense sentences.
- LANGUAGE REFLEX: Match the user's language exactly.

OUTPUT FORMAT:
EPI_6 INSIGHT LOG: [Hexagram Name]

THE SYSTEMIC STATE
Exactly two dense, clinical sentences.

DYNAMIC TRACE
For quiet hexagrams, analyze Line 2 and Line 5 only. If changing lines exist, interpret only those lines.

TIMELINE SIMULATION
Use two short phases only.

ACTIONABLE PROTOCOLS
Exactly three clean numbered steps.

FINAL RECOMMENDATION
End with a short decisive judgment in 2-3 sentences.

Do not add any extra sections before or after this structure.`;

const TRIGRAM: Record<string, { name: string; symbol: string }> = {
  '111': { name: '乾', symbol: '☰' },
  '110': { name: '兑', symbol: '☱' },
  '101': { name: '离', symbol: '☲' },
  '100': { name: '震', symbol: '☳' },
  '011': { name: '巽', symbol: '☴' },
  '010': { name: '坎', symbol: '☵' },
  '001': { name: '艮', symbol: '☶' },
  '000': { name: '坤', symbol: '☷' },
};

const HEXAGRAM_NAMES: Record<string, string> = {
  '111111': '乾为天',
  '000000': '坤为地',
  '010001': '水雷屯',
  '100010': '山水蒙',
  '111010': '水天需',
  '010111': '天水讼',
  '000010': '地水师',
  '010000': '水地比',
  '111011': '风天小畜',
  '110111': '天泽履',
  '111000': '地天泰',
  '000111': '天地否',
  '101111': '火天大有',
  '111101': '天火同人',
  '000100': '地山谦',
  '001000': '雷地豫',
  '011001': '泽雷随',
  '100110': '山风蛊',
  '000011': '地泽临',
  '110000': '风地观',
  '101001': '火雷噬嗑',
  '100101': '山火贲',
  '100000': '山地剥',
  '000001': '地雷复',
  '111001': '天雷无妄',
  '100111': '山天大畜',
  '100001': '山雷颐',
  '011110': '泽风大过',
  '010010': '坎为水',
  '101010': '离为火',
  '011100': '泽山咸',
  '001110': '雷风恒',
  '111100': '天山遁',
  '001111': '雷天大壮',
  '101100': '火地晋',
  '000101': '地火明夷',
  '110101': '风火家人',
  '101011': '火泽睽',
  '010100': '水山蹇',
  '001010': '雷水解',
  '110001': '山泽损',
  '100011': '风雷益',
  '111110': '泽天夬',
  '011111': '天风姤',
  '011000': '泽地萃',
  '000110': '地风升',
  '011010': '泽水困',
  '010110': '水风井',
  '011101': '泽火革',
  '101110': '火风鼎',
  '001001': '震为雷',
  '100100': '艮为山',
  '110010': '风山渐',
  '001011': '雷泽归妹',
  '001101': '雷火丰',
  '110110': '巽为风',
  '011011': '兑为泽',
  '010011': '水泽节',
  '110011': '风泽中孚',
  '001100': '雷山小过',
  '101101': '水火既济',
  '010101': '火水未济',
};

interface InterpretRequestBody {
  question?: string;
  hexagram?: number[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default async function handler(
  req: IncomingMessage & { method?: string; body?: InterpretRequestBody },
  res: ServerResponse & {
    status?: (code: number) => typeof res;
    json?: (body: unknown) => void;
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

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return sendJson(res, 500, { error: 'DEEPSEEK_API_KEY is not configured.' });
  }

  try {
    const messages = buildInterpretMessages(question.trim(), hexagram);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await streamDeepSeekChat(apiKey, messages, (delta) => {
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

function buildInterpretMessages(question: string, results: number[]): ChatMessage[] {
  const reading = formatHexagramReading(results);
  const linesBlock = reading.lineLabels
    .map((label, i) => `${label}: ${reading.lineSymbols[i]}`)
    .join('\n');

  const userContent = `INPUT DATA:
- User Question: ${question}
- Primary_Hexagram: ${reading.primaryName} (${reading.primaryTrigram}; pattern ${reading.bits})
- Line Pattern (bottom → top):
${linesBlock}
- Changing_Lines: ${reading.changingLines}
- Transformed_Hexagram: ${reading.transformedName} (${reading.transformedBits})

Respond in the same language as the User Question. Follow the OUTPUT FORMAT exactly.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];
}

async function streamDeepSeekChat(
  apiKey: string,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
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
        // Skip incomplete chunks.
      }
    }
  }
}

function formatHexagramReading(results: number[]) {
  const bits = results.map((v) => (v === 1 ? '1' : '0')).join('');
  const lower = bits.slice(0, 3);
  const upper = bits.slice(3, 6);
  const primaryName = resolveHexagramName(bits);

  const lineSymbols = results.map((v) => (v === 1 ? '——— 阳爻' : '— — 阴爻'));
  const lineLabels = results.map((v, i) => {
    const pos = ['初', '二', '三', '四', '五', '上'][i];
    return `${pos}爻·${v === 1 ? '阳' : '阴'}`;
  });

  return {
    bits,
    primaryName,
    primaryTrigram: `下${trigramDesc(lower)} / 上${trigramDesc(upper)}`,
    lineSymbols,
    lineLabels,
    changingLines:
      '无动爻（当前为二元阴阳掷法，六爻均为静爻；若未来接入三枚铜钱可识别老阳/老阴再推变卦）',
    transformedName: primaryName,
    transformedBits: bits,
  };
}

function resolveHexagramName(bits: string): string {
  if (HEXAGRAM_NAMES[bits]) return HEXAGRAM_NAMES[bits];
  const lower = bits.slice(0, 3);
  const upper = bits.slice(3, 6);
  const l = TRIGRAM[lower]?.name ?? '?';
  const u = TRIGRAM[upper]?.name ?? '?';
  return `${u}${l}卦`;
}

function trigramDesc(bits: string): string {
  const trigram = TRIGRAM[bits];
  return trigram ? `${trigram.symbol}${trigram.name}` : bits;
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
