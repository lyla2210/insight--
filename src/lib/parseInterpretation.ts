interface ParsedSection {
  title: string;
  body: string;
}

export function parseInterpretation(raw: string): {
  title: string;
  details: string;
  timeline: ParsedSection | null;
  protocols: ParsedSection | null;
  advice: ParsedSection | null;
  preview: string;
} {
  const text = raw.trim();
  if (!text) {
    return {
      title: '',
      details: '',
      timeline: null,
      protocols: null,
      advice: null,
      preview: '',
    };
  }

  const sections = splitMarkdownSections(text);
  const detailsParts: string[] = [];
  let title = '';
  let timeline: ParsedSection | null = null;
  let protocols: ParsedSection | null = null;
  let advice: ParsedSection | null = null;

  for (const section of sections) {
    if (isTopLabel(section.title)) {
      title = section.body ? `${section.title}\n${section.body}`.trim() : section.title;
      continue;
    }

    const type = classifyHeading(section.title);

    if (type === 'timeline') {
      timeline = section;
      continue;
    }

    if (type === 'protocols') {
      protocols = section;
      continue;
    }

    if (type === 'advice') {
      advice = section;
      continue;
    }

    detailsParts.push(renderSection(section));
  }

  const preview = sections.length > 0
    ? sections.map(renderSection).join('\n\n')
    : text;

  return {
    title,
    details: detailsParts.join('\n\n').trim(),
    timeline,
    protocols,
    advice,
    preview: preview.trim(),
  };
}

function splitMarkdownSections(text: string): ParsedSection[] {
  const headingRegex = /^(#{1,6})\s+(.+?)\s*$/gm;
  const matches = Array.from(text.matchAll(headingRegex));

  if (matches.length > 0) {
    const sections: ParsedSection[] = [];
    const intro = text.slice(0, matches[0].index).trim();
    if (intro) {
      sections.push({ title: '', body: intro });
    }

    for (let i = 0; i < matches.length; i += 1) {
      const current = matches[i];
      const start = current.index ?? 0;
      const nextStart = matches[i + 1]?.index ?? text.length;
      const block = text.slice(start, nextStart).trim();
      const body = block.replace(current[0], '').trim();

      sections.push({
        title: current[2].trim(),
        body,
      });
    }

    return sections;
  }

  const plainSections = splitPlainTextSections(text);
  if (plainSections.length > 0) {
    return plainSections;
  }

  return [{ title: '', body: text }];
}

function splitPlainTextSections(text: string): ParsedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join('\n').trim();
    if (currentTitle || body) {
      sections.push({ title: currentTitle.trim(), body });
    }
    currentTitle = '';
    currentBody = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (looksLikePlainHeading(trimmed)) {
      flush();
      currentTitle = trimmed;
      continue;
    }

    currentBody.push(line);
  }

  flush();
  return sections;
}

function classifyHeading(title: string): 'details' | 'timeline' | 'protocols' | 'advice' {
  const normalized = title.toLowerCase();

  if (
    /timeline simulation|sim_log|时间线|推演|模拟|阶段/.test(normalized)
  ) {
    return 'timeline';
  }

  if (
    /actionable protocols|rx_plans|行动方案|行动协议|行动建议|执行方案/.test(normalized)
  ) {
    return 'protocols';
  }

  if (
    /final recommendation|verdict|最终建议|结论建议|最终行动指南/.test(normalized)
  ) {
    return 'advice';
  }

  return 'details';
}

function renderSection(section: ParsedSection): string {
  if (!section.title) return section.body.trim();
  if (!section.body) return section.title.trim();
  return `### ${section.title}\n${section.body}`.trim();
}

function looksLikePlainHeading(line: string): boolean {
  if (!line) return false;
  if (line.startsWith('**') && line.endsWith('**')) return true;
  if (/^e[pb]i[_\s-]?6/i.test(line)) return true;
  if (/^(the systemic state|dynamic trace|timeline simulation|actionable protocols|final recommendation|最终建议|系统状态|动态轨迹|时间线|行动方案)/i.test(line)) {
    return true;
  }
  if (/^\*\*phase\s*0?[12]/i.test(line)) return true;
  return false;
}

function isTopLabel(title: string): boolean {
  return /^e[pb]i[_\s-]?6/i.test(title.trim());
}
