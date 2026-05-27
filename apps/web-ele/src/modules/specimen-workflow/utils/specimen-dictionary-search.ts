const PINYIN_INITIAL_BOUNDARIES = [
  ['a', '阿'],
  ['b', '八'],
  ['c', '嚓'],
  ['d', '咑'],
  ['e', '妸'],
  ['f', '发'],
  ['g', '旮'],
  ['h', '哈'],
  ['j', '击'],
  ['k', '喀'],
  ['l', '垃'],
  ['m', '妈'],
  ['n', '拿'],
  ['o', '哦'],
  ['p', '啪'],
  ['q', '期'],
  ['r', '然'],
  ['s', '撒'],
  ['t', '塌'],
  ['w', '挖'],
  ['x', '昔'],
  ['y', '压'],
  ['z', '匝'],
] as const;

const pinyinCollator = new Intl.Collator('zh-Hans-CN-u-co-pinyin');

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function isAsciiLetterOrDigit(char: string) {
  return /^[a-z0-9]$/i.test(char);
}

function isChineseChar(char: string) {
  return /[\u3400-\u9fff]/u.test(char);
}

function getPinyinInitial(char: string) {
  if (isAsciiLetterOrDigit(char)) {
    return char.toLowerCase();
  }

  if (!isChineseChar(char)) {
    return '';
  }

  for (const [index, [initial, boundary]] of PINYIN_INITIAL_BOUNDARIES.entries()) {
    const nextBoundary = PINYIN_INITIAL_BOUNDARIES[index + 1]?.[1];
    if (
      pinyinCollator.compare(char, boundary) >= 0 &&
      (!nextBoundary || pinyinCollator.compare(char, nextBoundary) < 0)
    ) {
      return initial;
    }
  }

  return '';
}

export function buildPinyinInitials(value: string) {
  return Array.from(value)
    .map((char) => getPinyinInitial(char))
    .join('');
}

export function buildSearchKeywords(values: string[]) {
  const keywords = new Set<string>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const normalizedValue = normalizeText(value);
      const initials = buildPinyinInitials(value);

      keywords.add(normalizedValue);
      if (initials) {
        keywords.add(initials);
      }
    });

  return [...keywords];
}

export function matchesSearchKeyword(
  keyword: string,
  searchKeywords: string[],
) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  return searchKeywords.some((item) => item.includes(normalizedKeyword));
}
