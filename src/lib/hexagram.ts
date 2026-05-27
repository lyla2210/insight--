/** 六爻结果：自下而上，1=阳 0=阴 */

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

/** 自下而上六位 → 周易卦名 */
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

export interface HexagramReading {
  bits: string;
  primaryName: string;
  primaryTrigram: string;
  lineSymbols: string[];
  lineLabels: string[];
  changingLines: string;
  transformedName: string;
  transformedBits: string;
}

function bitsFromResults(results: number[]): string {
  return results.map((v) => (v === 1 ? '1' : '0')).join('');
}

function lineSymbol(yang: boolean): string {
  return yang ? '——— 阳爻' : '— — 阴爻';
}

function trigramDesc(bits: string): string {
  const t = TRIGRAM[bits];
  return t ? `${t.symbol}${t.name}` : bits;
}

export function resolveHexagramName(bits: string): string {
  if (HEXAGRAM_NAMES[bits]) return HEXAGRAM_NAMES[bits];
  const lower = bits.slice(0, 3);
  const upper = bits.slice(3, 6);
  const l = TRIGRAM[lower]?.name ?? '?';
  const u = TRIGRAM[upper]?.name ?? '?';
  return `${u}${l}卦`;
}

export function formatHexagramReading(results: number[]): HexagramReading {
  const bits = bitsFromResults(results);
  const lower = bits.slice(0, 3);
  const upper = bits.slice(3, 6);
  const primaryName = resolveHexagramName(bits);

  const lineSymbols = results.map((v) => lineSymbol(v === 1));
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
