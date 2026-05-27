import fs from 'node:fs';
import path from 'node:path';
import { formatHexagramReading, type HexagramReading } from '../lib/hexagram.ts';

const DEFAULT_SYSTEM_PROMPT = `CONTEXT & SYSTEM ROLE:
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

const PROMPT_CANDIDATES = [
  '/Users/qinzh/Desktop/prompt to Deepseek.md',
  path.join(process.cwd(), 'prompt to Deepseek.md'),
];

function loadSystemPrompt(): string {
  for (const candidate of PROMPT_CANDIDATES) {
    try {
      const prompt = fs.readFileSync(candidate, 'utf8').trim();
      if (prompt) {
        return `${prompt}

COMPATIBILITY ADDENDUM:
After ACTIONABLE PROTOCOLS, add one last section named FINAL RECOMMENDATION.
Use 2-3 short sentences only.
Keep it visually clean. No extra symbols, no markdown headers, no codes.`;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return DEFAULT_SYSTEM_PROMPT;
}

export function buildInterpretMessages(question: string, results: number[]) {
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

  return {
    reading,
    messages: [
      { role: 'system' as const, content: loadSystemPrompt() },
      { role: 'user' as const, content: userContent },
    ],
  };
}

export type { HexagramReading };
